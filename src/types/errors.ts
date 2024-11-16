/**
 * Custom error class for file processing related errors.
 * Used when operations on specific files fail during the processing pipeline.
 */
export class FileProcessingError extends Error {
  /**
   * Creates a new FileProcessingError instance.
   * @param {string} message - The error message describing what went wrong
   * @param {string} filePath - The path to the file that caused the error
   * @param {Error} [originalError] - The original error that was caught, if any
   */
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'FileProcessingError';
    Object.setPrototypeOf(this, FileProcessingError.prototype);
  }
}

/**
 * Custom error class for validation related errors.
 * Used when input validation fails, such as invalid options or parameters.
 */
export class ValidationError extends Error {
  /**
   * Creates a new ValidationError instance.
   * @param {string} message - The error message describing what validation failed
   */
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Custom error class for .gitignore related errors.
 * Used when operations involving .gitignore files fail.
 */
export class GitignoreError extends Error {
  /**
   * Creates a new GitignoreError instance.
   * @param {string} message - The error message describing what went wrong with the .gitignore operation
   * @param {Error} [originalError] - The original error that was caught, if any
   */
  constructor(
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'GitignoreError';
    Object.setPrototypeOf(this, GitignoreError.prototype);
  }
}
