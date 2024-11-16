import type { FilterOptions, ProgramOptions } from './schema.js';
import type { FileProcessingError, GitignoreError, ValidationError } from './errors.js';

export type { FilterOptions, ProgramOptions };
export type { FileProcessingError, GitignoreError, ValidationError };

/**
 * Function type for ignore patterns
 */
export type IgnoreFunction = (path: string) => boolean;

/**
 * Type for async operations that may fail
 */
export type Result<T, E = Error> = Promise<
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: E;
    }
>;

/**
 * Type for file processing status
 */
export interface ProcessingStatus {
  processed: number;
  failed: number;
  total: number;
  startTime: number;
  endTime?: number;
}

/**
 * Type for file processing result
 */
export interface ProcessingResult {
  filePath: string;
  success: boolean;
  error?: Error;
  processingTime: number;
}

/**
 * Type for progress callback
 */
export type ProgressCallback = (status: ProcessingStatus) => void;

/**
 * Type for file processing options
 */
export interface ProcessingOptions {
  concurrency: number;
  onProgress?: ProgressCallback;
  skipErrors?: boolean;
}

/**
 * Type for supported file types
 */
export type FileType =
  | 'javascript'
  | 'typescript'
  | 'json'
  | 'text'
  | 'markdown'
  | 'html'
  | 'css'
  | 'unknown';

/**
 * Interface for file metadata
 */
export interface FileMetadata {
  path: string;
  type: FileType;
  size: number;
  lastModified: Date;
  relativePath: string;
}

/**
 * Type guard for checking if a value is a FileMetadata object
 * @param {unknown} value - The value to check
 * @returns {boolean} True if the value is a FileMetadata object, false otherwise
 */
export function isFileMetadata(value: unknown): value is FileMetadata {
  return (
    typeof value === 'object' &&
    value !== null &&
    'path' in value &&
    'type' in value &&
    'size' in value &&
    'lastModified' in value &&
    'relativePath' in value &&
    value.lastModified instanceof Date
  );
}

/**
 * Type for file processing configuration
 */
export interface ProcessingConfig {
  readonly minify: boolean;
  readonly removeComments: boolean;
  readonly trimWhitespace: boolean;
  readonly normalizeLineEndings: boolean;
}

/**
 * Default processing configuration
 */
export const DEFAULT_PROCESSING_CONFIG: ProcessingConfig = {
  minify: true,
  removeComments: true,
  trimWhitespace: true,
  normalizeLineEndings: true,
} as const;

/**
 * Type for supported character encodings
 */
export type CharacterEncoding = 'utf8' | 'ascii' | 'utf16le' | 'base64' | 'binary';

/**
 * Interface for file reading options
 */
export interface ReadOptions {
  encoding?: CharacterEncoding;
  flag?: string;
}

/**
 * Interface for file writing options
 */
export interface WriteOptions extends ReadOptions {
  mode?: number;
  flag?: string;
}
