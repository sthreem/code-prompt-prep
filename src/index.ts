#!/usr/bin/env node

import * as path from 'path';
import { Command } from 'commander';
import fs from 'fs-extra';
import PQueue from 'p-queue';
import {
  addToGitignore,
  loadIgnorePatterns,
  readAllFiles,
  filterFiles,
  processFile,
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

    // Add output folder to .gitignore
    const gitignoreSpinner = createSpinner('Adding output folder to .gitignore...');
    await addToGitignore(options.projectPath, options.outputFolder);
    gitignoreSpinner.succeed('Output folder added to .gitignore');

    // Load ignore patterns
    const ignoreSpinner = createSpinner('Loading ignore patterns...');
    const gitignorePatterns = await loadIgnorePatterns(options.projectPath);
    ignoreSpinner.succeed('Ignore patterns loaded');

    // Create timestamped output file
    const timestamp = formatTimestamp();
    const outputFile = path.join(outputFolder, `${timestamp}.txt`);

    // Initialize processing queue
    const queue = new PQueue({ concurrency: options.concurrency });

    try {
      const filesSpinner = createSpinner('Reading project files...');
      const files = await readAllFiles(options.projectPath, gitignorePatterns);
      filesSpinner.succeed(`Found ${files.length} files`);

      const filterSpinner = createSpinner('Filtering files...');
      const filteredFiles = filterFiles(
        files,
        options.projectPath,
        options.include,
        options.exclude,
        gitignorePatterns
      );
      filterSpinner.succeed(`Selected ${filteredFiles.length} files for processing`);

      displayMessage(MessageType.INFO, 'Starting file processing...');

      let processedCount = 0;
      const totalFiles = filteredFiles.length;

      // Process files concurrently
      await queue.addAll(
        filteredFiles.map(file => async () => {
          try {
            await processFile(file, options.projectPath, outputFile);
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

// Handle the main function with proper error catching
main().catch(error => {
  displayMessage(MessageType.ERROR, `Unhandled error: ${error}`);
  process.exit(1);
});
