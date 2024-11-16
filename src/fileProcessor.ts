import fs from 'fs-extra';
import * as path from 'path';
import ignore from 'ignore';
import recursiveReadDir from 'recursive-readdir';
import { minifyCode } from './utils.js';
import { DEFAULT_IGNORE_PATTERNS } from './ignorePatterns.js';
import type { FilterOptions } from './types/schema.js';
import type { IgnoreFunction } from './types/index.js';
import { FileProcessingError, GitignoreError } from './types/errors.js';
import { createWriteStream, type WriteStream } from 'fs';
import { createReadStream } from 'fs';

type IgnoreInstance = ReturnType<typeof ignore>;

// Buffer size for write operations (5MB)
const WRITE_BUFFER_SIZE = 5 * 1024 * 1024;

// Maximum buffer entries before forced flush
const MAX_BUFFER_ENTRIES = 100;

/**
 * Class to manage buffered writes to the output file.
 * Implements an efficient buffering system for writing content to files.
 * Automatically flushes the buffer when it reaches size or entry limits.
 *
 * @class
 * @property {string[]} buffer - Array to store content before writing
 * @property {number} bufferSize - Current size of buffered content in bytes
 * @property {WriteStream} writeStream - Stream for writing to output file
 */
export class OutputBuffer {
  private buffer: string[] = [];
  private bufferSize = 0;
  private writeStream: WriteStream;

  /**
   * Creates an instance of OutputBuffer.
   * @param {string} outputFile - Path to the file where content will be written
   */
  constructor(outputFile: string) {
    this.writeStream = createWriteStream(outputFile, { flags: 'a', encoding: 'utf8' });
  }

  /**
   * Add content to the buffer
   * @param {string} content - Content to add to buffer
   */
  async add(content: string): Promise<void> {
    this.buffer.push(content);
    this.bufferSize += content.length;

    if (this.bufferSize >= WRITE_BUFFER_SIZE || this.buffer.length >= MAX_BUFFER_ENTRIES) {
      await this.flush();
    }
  }

  /**
   * Flush buffer contents to file
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    return new Promise<void>((resolve, reject) => {
      const content = this.buffer.join('');
      this.writeStream.write(content, (error: Error | null | undefined) => {
        if (error) {
          reject(error);
        } else {
          this.buffer = [];
          this.bufferSize = 0;
          resolve();
        }
      });
    });
  }

  /**
   * Close the write stream
   */
  async close(): Promise<void> {
    await this.flush();
    return new Promise<void>((resolve, reject) => {
      this.writeStream.end((error: Error | null | undefined) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

/**
 * Adds the output folder to the project's .gitignore file.
 * @param {string} projectPath - Path to the project directory
 * @param {string} folderName - Name of the output folder
 * @returns {Promise<void>}
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
 * @param {string} projectPath - Path to the project directory
 * @returns {Promise<IgnoreInstance>} An instance of ignore with loaded patterns
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
 * @param {string} projectPath - Path to the project directory
 * @param {IgnoreInstance} gitignorePatterns - ignore instance with patterns
 * @returns {Promise<string[]>} Array of file paths
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
 * @param {string[]} files - Array of file paths
 * @param {string} projectPath - Path to the project directory
 * @param {FilterOptions} include - Include options
 * @param {FilterOptions} exclude - Exclude options
 * @param {IgnoreInstance} gitignorePatterns - ignore instance with patterns
 * @returns {string[]} Filtered array of file paths
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
 * Process a single file by minifying its content and adding to the output buffer.
 * Uses streams for efficient file reading.
 * @param {string} filePath - Path to the file to process
 * @param {string} projectPath - Path to the project directory
 * @param {OutputBuffer} outputBuffer - Buffer for writing output
 * @returns {Promise<void>}
 */
export async function processFile(
  filePath: string,
  projectPath: string,
  outputBuffer: OutputBuffer
): Promise<void> {
  const relPath = path.relative(projectPath, filePath);

  try {
    // Read file content as a stream
    const readStream = createReadStream(filePath, { encoding: 'utf8' });
    let content = '';

    // Process the stream chunks
    for await (const chunk of readStream) {
      content += chunk;
    }

    const minifiedContent = minifyCode(content);
    await outputBuffer.add(`${relPath}\n${minifiedContent}\n\n`);
  } catch (error) {
    throw new FileProcessingError(
      `Failed to process file: ${(error as Error).message}`,
      filePath,
      error as Error
    );
  }
}

/**
 * Creates and initializes an output buffer for file processing
 * @param {string} outputFile - Path to the output file
 * @returns {OutputBuffer} Initialized output buffer
 */
export function createOutputBuffer(outputFile: string): OutputBuffer {
  return new OutputBuffer(outputFile);
}

/**
 * Closes the output buffer and ensures all content is written
 * @param {OutputBuffer} buffer - The output buffer to close
 * @returns {Promise<void>}
 */
export async function closeOutputBuffer(buffer: OutputBuffer): Promise<void> {
  await buffer.close();
}

/**
 * Processes multiple files by minifying and writing to the output file.
 * @deprecated Use processFile with concurrent queue instead.
 * @param {string[]} files - Array of file paths to process
 * @param {string} projectPath - Path to the project directory
 * @param {string} outputFile - Path to the output file
 * @returns {Promise<void>}
 */
export async function processFiles(
  files: string[],
  projectPath: string,
  outputFile: string
): Promise<void> {
  const buffer = createOutputBuffer(outputFile);
  try {
    for (const file of files) {
      await processFile(file, projectPath, buffer);
    }
  } finally {
    await closeOutputBuffer(buffer);
  }
}
