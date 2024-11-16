#!/usr/bin/env node

import * as path from 'path';
import minimist from 'minimist';
import fs from 'fs-extra';
import {
  addToGitignore,
  loadIgnorePatterns,
  readAllFiles,
  filterFiles,
  processFiles,
} from './fileProcessor.js';
import { formatTimestamp, toArray } from './utils.js';
import type { FilterOptions, ParsedArgs } from './types/index.js';

async function main(): Promise<void> {
  const argv: ParsedArgs = minimist(process.argv.slice(2));
  const projectPath = path.resolve(argv._[0] || '.');

  // Validate project path
  if (!(await fs.pathExists(projectPath))) {
    console.error('Project path does not exist.');
    process.exit(1);
  }

  const outputFolderName = argv['of'] || '_ai_output';
  const outputFolder = path.join(projectPath, outputFolderName);
  await fs.ensureDir(outputFolder);

  // Add output folder to .gitignore
  await addToGitignore(projectPath, outputFolderName);

  // Load ignore patterns
  const gitignorePatterns = await loadIgnorePatterns(projectPath);

  // Create timestamped output file
  const timestamp = formatTimestamp();
  const outputFile = path.join(outputFolder, `${timestamp}.txt`);

  // Parse include and exclude options
  const include: FilterOptions = {
    files: toArray(argv['if']).map(f => path.normalize(f as string)),
    extensions: toArray(argv['ie']),
    folders: toArray(argv['if']).map(f => path.normalize(f as string)),
  };

  const exclude: FilterOptions = {
    files: toArray(argv['xf']).map(f => path.normalize(f as string)),
    extensions: toArray(argv['xe']),
    folders: toArray(argv['xf']).map(f => path.normalize(f as string)),
  };

  try {
    const files = await readAllFiles(projectPath, gitignorePatterns);
    const filteredFiles = filterFiles(files, projectPath, include, exclude, gitignorePatterns);
    await processFiles(filteredFiles, projectPath, outputFile);
    console.log(`Minified code has been saved to ${outputFile}`);
  } catch (error) {
    console.error(`An error occurred: ${(error as Error).message}`);
    process.exit(1);
  }
}

// Handle the main function with proper error catching
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
