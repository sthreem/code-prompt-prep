#!/usr/bin/env node

import * as path from 'path';
import { Command } from 'commander';
import fs from 'fs-extra';
import PQueue from 'p-queue';
import ignore from 'ignore';
import {
  addToGitignore,
  loadIgnorePatterns,
  readAllFiles,
  filterFiles,
  processFile,
  createOutputBuffer,
  closeOutputBuffer,
  type OutputBuffer,
} from './fileProcessor.js';
import { formatTimestamp } from './utils.js';
import {
  CLI_OPTIONS,
  parseCommaSeparated,
  validateOptions,
  type ProgramOptions,
} from './types/schema.js';
import { FileProcessingError, ValidationError } from './types/errors.js';
import { displayMessage, MessageType, createSpinner } from './ui.js';

type IgnoreInstance = ReturnType<typeof ignore>;

// Track active spinners for cleanup
const activeSpinners = new Set<ReturnType<typeof createSpinner>>();

// Track the output buffer for cleanup
let currentOutputBuffer: OutputBuffer | null = null;

/**
 * Cleanup routine for graceful shutdown
 * Stops all spinners and closes output buffer
 */
async function cleanup(): Promise<void> {
  // Stop all active spinners
  activeSpinners.forEach(spinner => {
    spinner.stop();
  });
  activeSpinners.clear();

  // Close output buffer if it exists
  if (currentOutputBuffer) {
    try {
      await closeOutputBuffer(currentOutputBuffer);
      displayMessage(MessageType.INFO, 'Cleaned up output buffer');
    } catch (error) {
      displayMessage(MessageType.ERROR, 'Failed to clean up output buffer');
    }
    currentOutputBuffer = null;
  }
}

/**
 * Creates a spinner and tracks it for cleanup
 * @param {string} text - The spinner text
 * @returns {ReturnType<typeof createSpinner>} The created spinner
 */
function createTrackedSpinner(text: string): ReturnType<typeof createSpinner> {
  const spinner = createSpinner(text);
  activeSpinners.add(spinner);
  return spinner;
}

/**
 * Initialize the command-line interface with all available options and their descriptions.
 * This sets up the CLI using Commander.js with all the necessary options for file processing.
 * @type {Command}
 */
const program = new Command()
  .name('cpp')
  .description('Prepare project files for AI assistance by minifying and organizing code.')
  .version('1.0.0')
  .option(
    '-p, --project-path <path>',
    CLI_OPTIONS.projectPath.description,
    CLI_OPTIONS.projectPath.default
  )
  .option(
    '-o, --output-folder <name>',
    CLI_OPTIONS.outputFolder.description,
    CLI_OPTIONS.outputFolder.default
  )
  .option(
    '-if, --include-files <list>',
    CLI_OPTIONS.includeFiles.description,
    CLI_OPTIONS.includeFiles.default
  )
  .option(
    '-ie, --include-extensions <list>',
    CLI_OPTIONS.includeExtensions.description,
    CLI_OPTIONS.includeExtensions.default
  )
  .option(
    '-id, --include-folders <list>',
    CLI_OPTIONS.includeFolders.description,
    CLI_OPTIONS.includeFolders.default
  )
  .option(
    '-xf, --exclude-files <list>',
    CLI_OPTIONS.excludeFiles.description,
    CLI_OPTIONS.excludeFiles.default
  )
  .option(
    '-xe, --exclude-extensions <list>',
    CLI_OPTIONS.excludeExtensions.description,
    CLI_OPTIONS.excludeExtensions.default
  )
  .option(
    '-xd, --exclude-folders <list>',
    CLI_OPTIONS.excludeFolders.description,
    CLI_OPTIONS.excludeFolders.default
  )
  .option(
    '-c, --concurrency <number>',
    CLI_OPTIONS.concurrency.description,
    String(CLI_OPTIONS.concurrency.default)
  )
  .parse(process.argv);

/**
 * Main function that orchestrates the entire file processing workflow.
 * This function handles the core logic of the application, including:
 * - Parsing and validating command line options
 * - Setting up the output directory
 * - Managing the file processing queue
 * - Error handling and reporting
 *
 * @async
 * @returns {Promise<void>} A promise that resolves when all processing is complete
 * @throws {ValidationError} If the provided options are invalid
 * @throws {FileProcessingError} If there are errors during file processing
 * @throws {Error} For any other unexpected errors
 */
async function main(): Promise<void> {
  try {
    const opts = program.opts();

    // Convert CLI options to ProgramOptions format
    const options: ProgramOptions = validateOptions({
      projectPath: path.resolve(opts.projectPath),
      outputFolder: opts.outputFolder,
      include: {
        files: parseCommaSeparated(opts.includeFiles),
        extensions: parseCommaSeparated(opts.includeExtensions),
        folders: parseCommaSeparated(opts.includeFolders),
      },
      exclude: {
        files: parseCommaSeparated(opts.excludeFiles),
        extensions: parseCommaSeparated(opts.excludeExtensions),
        folders: parseCommaSeparated(opts.excludeFolders),
      },
      concurrency: parseInt(opts.concurrency, 10),
    });

    // Validate project path
    if (!(await fs.pathExists(options.projectPath))) {
      throw new ValidationError('Project path does not exist.');
    }

    const outputFolder = path.join(options.projectPath, options.outputFolder);
    await fs.ensureDir(outputFolder);

    // Check if .gitignore exists before showing spinner
    const gitignorePath = path.join(options.projectPath, '.gitignore');
    if (await fs.pathExists(gitignorePath)) {
      const gitignoreSpinner = createTrackedSpinner('Adding output folder to .gitignore...');
      await addToGitignore(options.projectPath, options.outputFolder);
      gitignoreSpinner.succeed('Output folder added to .gitignore');
      activeSpinners.delete(gitignoreSpinner);
    } else {
      displayMessage(MessageType.INFO, 'No .gitignore file found, skipping gitignore update');
    }

    // Load ignore patterns only if .gitignore exists
    let gitignorePatterns: IgnoreInstance;
    if (await fs.pathExists(gitignorePath)) {
      const ignoreSpinner = createTrackedSpinner('Loading ignore patterns...');
      gitignorePatterns = await loadIgnorePatterns(options.projectPath);
      ignoreSpinner.succeed('Ignore patterns loaded');
      activeSpinners.delete(ignoreSpinner);
    } else {
      gitignorePatterns = ignore();
    }

    // Create timestamped output file
    const timestamp = formatTimestamp();
    const outputFile = path.join(outputFolder, `${timestamp}.txt`);
    currentOutputBuffer = createOutputBuffer(outputFile);

    // Initialize processing queue
    const queue = new PQueue({ concurrency: options.concurrency });

    try {
      // Read files without spinner if directory is empty
      const filesSpinner = createTrackedSpinner('Reading project files...');
      const files = await readAllFiles(options.projectPath, gitignorePatterns);

      if (files.length === 0) {
        filesSpinner.stop();
        activeSpinners.delete(filesSpinner);
        displayMessage(MessageType.WARNING, 'No files found in the project directory');
        return;
      }
      filesSpinner.succeed(`Found ${files.length} files`);
      activeSpinners.delete(filesSpinner);

      // Filter files without spinner if no filters are applied
      const hasFilters =
        options.include.files.length > 0 ||
        options.include.extensions.length > 0 ||
        options.include.folders.length > 0 ||
        options.exclude.files.length > 0 ||
        options.exclude.extensions.length > 0 ||
        options.exclude.folders.length > 0;

      let filteredFiles: string[];
      if (hasFilters) {
        const filterSpinner = createTrackedSpinner('Filtering files...');
        filteredFiles = filterFiles(
          files,
          options.projectPath,
          options.include,
          options.exclude,
          gitignorePatterns
        );
        filterSpinner.succeed(`Selected ${filteredFiles.length} files for processing`);
        activeSpinners.delete(filterSpinner);
      } else {
        filteredFiles = files;
        displayMessage(
          MessageType.INFO,
          `Processing all ${files.length} files (no filters applied)`
        );
      }

      // Check if any files match the filters
      if (filteredFiles.length === 0) {
        displayMessage(
          MessageType.WARNING,
          'No files match the specified include/exclude filters. Please check your filter settings.'
        );
        return;
      }

      displayMessage(MessageType.INFO, 'Starting file processing...');

      let processedCount = 0;
      const totalFiles = filteredFiles.length;

      // Process files concurrently
      await queue.addAll(
        filteredFiles.map(file => async () => {
          try {
            await processFile(file, options.projectPath, currentOutputBuffer!);
            processedCount++;
            displayMessage(
              MessageType.SUCCESS,
              `[${processedCount}/${totalFiles}] Processed: ${path.relative(options.projectPath, file)}`
            );
          } catch (error) {
            if (error instanceof Error) {
              throw new FileProcessingError(`Failed to process file: ${file}`, file, error);
            }
            throw error;
          }
        })
      );

      // Close the output buffer
      await closeOutputBuffer(currentOutputBuffer!);
      currentOutputBuffer = null;

      displayMessage(
        MessageType.SUCCESS,
        `\nCompleted processing ${totalFiles} files. Output saved to ${outputFile}`
      );
    } catch (error) {
      if (error instanceof FileProcessingError) {
        displayMessage(MessageType.ERROR, `Error processing ${error.filePath}: ${error.message}`);
        if (error.originalError) {
          displayMessage(MessageType.ERROR, `Original error: ${error.originalError.message}`);
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      displayMessage(MessageType.ERROR, `Validation error: ${error.message}`);
    } else if (error instanceof Error) {
      displayMessage(MessageType.ERROR, `Fatal error: ${error.message}`);
    } else {
      displayMessage(MessageType.ERROR, 'An unknown error occurred');
    }
    process.exit(1);
  }
}

// Set up SIGINT handler for graceful shutdown
process.on('SIGINT', () => {
  displayMessage(MessageType.WARNING, '\nReceived interrupt signal. Cleaning up...');
  void cleanup().then(() => {
    displayMessage(MessageType.INFO, 'Cleanup completed. Exiting...');
    process.exit(0);
  });
});

// Handle the main function with proper error catching
main().catch(error => {
  displayMessage(MessageType.ERROR, `Unhandled error: ${error}`);
  void cleanup().then(() => process.exit(1));
});
