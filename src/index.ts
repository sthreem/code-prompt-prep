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
  type FilterOptions,
  type ProgramOptions,
} from './types/schema.js';
import { FileProcessingError, ValidationError } from './types/errors.js';

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
    await addToGitignore(options.projectPath, options.outputFolder);

    // Load ignore patterns
    const gitignorePatterns = await loadIgnorePatterns(options.projectPath);

    // Create timestamped output file
    const timestamp = formatTimestamp();
    const outputFile = path.join(outputFolder, `${timestamp}.txt`);

    // Initialize processing queue
    const queue = new PQueue({ concurrency: options.concurrency });

    try {
      const files = await readAllFiles(options.projectPath, gitignorePatterns);
      const filteredFiles = filterFiles(
        files,
        options.projectPath,
        options.include,
        options.exclude,
        gitignorePatterns
      );

      // Process files concurrently
      await queue.addAll(
        filteredFiles.map(file => async () => {
          try {
            await processFile(file, options.projectPath, outputFile);
            console.log(`Processed: ${path.relative(options.projectPath, file)}`);
          } catch (error) {
            if (error instanceof Error) {
              throw new FileProcessingError(`Failed to process file: ${file}`, file, error);
            }
            throw error;
          }
        })
      );

      console.log(`\nMinified code has been saved to ${outputFile}`);
    } catch (error) {
      if (error instanceof FileProcessingError) {
        console.error(`Error processing ${error.filePath}: ${error.message}`);
        if (error.originalError) {
          console.error('Original error:', error.originalError.message);
        }
      } else {
        throw error;
      }
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error('Validation error:', error.message);
    } else if (error instanceof Error) {
      console.error('Fatal error:', error.message);
    } else {
      console.error('An unknown error occurred');
    }
    process.exit(1);
  }
}

// Handle the main function with proper error catching
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
