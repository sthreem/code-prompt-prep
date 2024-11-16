import fs from 'fs-extra';
import * as path from 'path';
import ignore from 'ignore';
import recursiveReadDir from 'recursive-readdir';
import { minifyCode } from './utils.js';
import { DEFAULT_IGNORE_PATTERNS } from './ignorePatterns.js';
import type { FilterOptions } from './types/schema.js';
import type { IgnoreFunction } from './types/index.js';
import { FileProcessingError, GitignoreError } from './types/errors.js';

type IgnoreInstance = ReturnType<typeof ignore>;

/**
 * Adds the output folder to the project's .gitignore file.
 * @param projectPath - Path to the project directory.
 * @param folderName - Name of the output folder.
 */
export async function addToGitignore(projectPath: string, folderName: string): Promise<void> {
  const gitignorePath = path.join(projectPath, '.gitignore');
  const entry = `/${folderName}/\n`;

  try {
    let content = '';
    if (await fs.pathExists(gitignorePath)) {
      content = await fs.readFile(gitignorePath, 'utf8');
      if (content.includes(entry.trim())) {
        return;
      }
    }
    await fs.appendFile(gitignorePath, entry);
  } catch (error) {
    throw new GitignoreError(
      `Failed to update .gitignore file: ${(error as Error).message}`,
      error as Error
    );
  }
}

/**
 * Loads ignore patterns from .gitignore and default patterns.
 * @param projectPath - Path to the project directory.
 * @returns An instance of ignore with loaded patterns.
 */
export async function loadIgnorePatterns(projectPath: string): Promise<IgnoreInstance> {
  const gitignorePath = path.join(projectPath, '.gitignore');
  const ig = ignore().add(DEFAULT_IGNORE_PATTERNS);

  try {
    if (await fs.pathExists(gitignorePath)) {
      const content = await fs.readFile(gitignorePath, 'utf8');
      ig.add(content);
    }
    return ig;
  } catch (error) {
    throw new GitignoreError(
      `Failed to load ignore patterns: ${(error as Error).message}`,
      error as Error
    );
  }
}

/**
 * Reads all files in the project directory, respecting ignore patterns.
 * @param projectPath - Path to the project directory.
 * @param gitignorePatterns - ignore instance with patterns.
 * @returns Array of file paths.
 */
export async function readAllFiles(
  projectPath: string,
  gitignorePatterns: IgnoreInstance
): Promise<string[]> {
  const ignoreFunc: IgnoreFunction = (file: string): boolean =>
    gitignorePatterns.ignores(path.relative(projectPath, file));

  try {
    return await recursiveReadDir(projectPath, [ignoreFunc]);
  } catch (error) {
    throw new FileProcessingError(
      `Failed to read project files: ${(error as Error).message}`,
      projectPath,
      error as Error
    );
  }
}

/**
 * Filters files based on include and exclude options.
 * @param files - Array of file paths.
 * @param projectPath - Path to the project directory.
 * @param include - Include options.
 * @param exclude - Exclude options.
 * @param gitignorePatterns - ignore instance with patterns.
 * @returns Filtered array of file paths.
 */
export function filterFiles(
  files: string[],
  projectPath: string,
  include: FilterOptions,
  exclude: FilterOptions,
  gitignorePatterns: IgnoreInstance
): string[] {
  const hasFilters =
    include.files.length > 0 ||
    include.extensions.length > 0 ||
    include.folders.length > 0 ||
    exclude.files.length > 0 ||
    exclude.extensions.length > 0 ||
    exclude.folders.length > 0;

  if (!hasFilters) {
    return files.filter(file => !gitignorePatterns.ignores(path.relative(projectPath, file)));
  }

  return files.filter(file => {
    const relPath = path.relative(projectPath, file);

    // Check if file is ignored by patterns
    if (gitignorePatterns.ignores(relPath)) {
      return false;
    }

    // Check for exclusions
    if (exclude.files.includes(relPath)) {
      return false;
    }
    if (exclude.extensions.some(ext => file.endsWith(ext))) {
      return false;
    }
    if (exclude.folders.some(folder => file.startsWith(path.join(projectPath, folder)))) {
      return false;
    }

    // Check for inclusions
    if (include.files.includes(relPath)) {
      return true;
    }
    if (
      include.extensions.some(ext => file.endsWith(ext)) ||
      include.folders.some(folder => file.startsWith(path.join(projectPath, folder)))
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Process a single file by minifying its content and appending to the output file.
 * @param filePath - Path to the file to process.
 * @param projectPath - Path to the project directory.
 * @param outputFile - Path to the output file.
 */
export async function processFile(
  filePath: string,
  projectPath: string,
  outputFile: string
): Promise<void> {
  const relPath = path.relative(projectPath, filePath);

  try {
    const content = await fs.readFile(filePath, 'utf8');
    const minifiedContent = minifyCode(content);
    await fs.appendFile(outputFile, `${relPath}\n${minifiedContent}\n\n`, 'utf8');
  } catch (error) {
    throw new FileProcessingError(
      `Failed to process file: ${(error as Error).message}`,
      filePath,
      error as Error
    );
  }
}

/**
 * Processes multiple files by minifying and writing to the output file.
 * @deprecated Use processFile with concurrent queue instead.
 * @param files - Array of file paths to process.
 * @param projectPath - Path to the project directory.
 * @param outputFile - Path to the output file.
 */
export async function processFiles(
  files: string[],
  projectPath: string,
  outputFile: string
): Promise<void> {
  for (const file of files) {
    await processFile(file, projectPath, outputFile);
  }
}
