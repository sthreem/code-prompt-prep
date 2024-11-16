export class FileProcessingError extends Error {
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

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class GitignoreError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'GitignoreError';
    Object.setPrototypeOf(this, GitignoreError.prototype);
  }
}
