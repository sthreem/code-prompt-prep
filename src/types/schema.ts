import { z } from 'zod';
import * as path from 'path';

/**
 * Maximum allowed concurrency for file processing
 * This limit helps prevent system resource exhaustion
 */
export const MAX_CONCURRENCY = 100;

/**
 * Validates a file path for correct format
 * Checks for invalid characters and proper path structure
 * @param {string} value - The path to validate
 * @returns {boolean} True if path is valid
 */
function isValidPath(value: string): boolean {
  try {
    // Normalize the path to handle different separators
    const normalizedPath = path.normalize(value);

    // Check for invalid characters in path
    // Excludes common invalid characters and control characters
    const invalidChars = /[<>:"|?*]/;
    if (invalidChars.test(normalizedPath)) {
      return false;
    }

    // Additional check for non-printable characters
    // eslint-disable-next-line no-control-regex
    if (/[\x00-\x1F\x7F]/.test(normalizedPath)) {
      return false;
    }

    // Check for valid path structure
    return !normalizedPath.includes('..');
  } catch {
    return false;
  }
}

/**
 * Validates a file extension format
 * Must start with dot and contain valid characters
 * @param {string} value - The extension to validate
 * @returns {boolean} True if extension is valid
 */
function isValidExtension(value: string): boolean {
  // Extension must start with dot and contain only valid characters
  const extensionPattern = /^\.[a-zA-Z0-9]+$/;
  return extensionPattern.test(value);
}

/**
 * Schema for file filtering options.
 * Defines the structure for including or excluding files based on patterns.
 */
export const FilterOptionsSchema = z.object({
  files: z
    .array(
      z.string().refine(isValidPath, {
        message: 'Invalid file path format. Path contains invalid characters or structure.',
      })
    )
    .default([]),
  extensions: z
    .array(
      z.string().refine(isValidExtension, {
        message:
          'Invalid extension format. Extensions must start with dot and contain only alphanumeric characters.',
      })
    )
    .default([]),
  folders: z
    .array(
      z.string().refine(isValidPath, {
        message: 'Invalid folder path format. Path contains invalid characters or structure.',
      })
    )
    .default([]),
});

/**
 * Schema for program options.
 * Defines the complete configuration structure for the application.
 */
export const ProgramOptionsSchema = z.object({
  projectPath: z.string().refine(isValidPath, {
    message: 'Invalid project path format.',
  }),
  outputFolder: z
    .string()
    .refine(value => isValidPath(value) && !value.includes('/') && !value.includes('\\'), {
      message: 'Output folder must be a valid folder name without path separators.',
    })
    .default('_ai_output'),
  include: FilterOptionsSchema,
  exclude: FilterOptionsSchema,
  concurrency: z
    .number()
    .int()
    .positive()
    .max(MAX_CONCURRENCY, `Concurrency must not exceed ${MAX_CONCURRENCY} for system stability`)
    .default(4),
});

/**
 * Type representing file filtering options.
 * @typedef {z.infer<typeof FilterOptionsSchema>} FilterOptions
 */
export type FilterOptions = z.infer<typeof FilterOptionsSchema>;

/**
 * Type representing complete program options.
 * @typedef {z.infer<typeof ProgramOptionsSchema>} ProgramOptions
 */
export type ProgramOptions = z.infer<typeof ProgramOptionsSchema>;

/**
 * Validates and parses program options.
 * @param {unknown} options - The options object to validate
 * @returns {ProgramOptions} Validated and parsed program options
 * @throws {Error} If validation fails with detailed error messages
 */
export const validateOptions = (options: unknown): ProgramOptions => {
  try {
    return ProgramOptionsSchema.parse(options);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(
        (issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`
      );
      throw new Error(`Invalid options:\n${issues.join('\n')}`);
    }
    throw error as Error;
  }
};

/**
 * Constants defining CLI options with descriptions and default values.
 * Used for configuring the command-line interface.
 */
export const CLI_OPTIONS = {
  projectPath: {
    description: 'Path to the project directory',
    default: '.',
  },
  outputFolder: {
    description: 'Name of the output folder (must be a valid folder name)',
    default: '_ai_output',
  },
  includeFiles: {
    description: 'Files to include (comma-separated file paths)',
    default: '',
  },
  includeExtensions: {
    description: 'File extensions to include (comma-separated, must start with dot)',
    default: '',
  },
  includeFolders: {
    description: 'Folders to include (comma-separated folder paths)',
    default: '',
  },
  excludeFiles: {
    description: 'Files to exclude (comma-separated file paths)',
    default: '',
  },
  excludeExtensions: {
    description: 'File extensions to exclude (comma-separated, must start with dot)',
    default: '',
  },
  excludeFolders: {
    description: 'Folders to exclude (comma-separated folder paths)',
    default: '',
  },
  concurrency: {
    description: `Number of files to process concurrently (max ${MAX_CONCURRENCY})`,
    default: 4,
  },
} as const;

/**
 * Parses a comma-separated string into an array of trimmed strings.
 * @param {string} value - The comma-separated string to parse
 * @returns {string[]} Array of trimmed, non-empty strings
 */
export const parseCommaSeparated = (value: string): string[] =>
  value
    .split(',')
    .filter(Boolean)
    .map(item => item.trim());
