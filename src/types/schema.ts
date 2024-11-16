import { z } from 'zod';

/**
 * Maximum allowed concurrency for file processing
 * This limit helps prevent system resource exhaustion
 */
export const MAX_CONCURRENCY = 100;

/**
 * Schema for file filtering options.
 * Defines the structure for including or excluding files based on patterns.
 */
export const FilterOptionsSchema = z.object({
  files: z.array(z.string()).default([]),
  extensions: z.array(z.string()).default([]),
  folders: z.array(z.string()).default([]),
});

/**
 * Schema for program options.
 * Defines the complete configuration structure for the application.
 */
export const ProgramOptionsSchema = z.object({
  projectPath: z.string(),
  outputFolder: z.string().default('_ai_output'),
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
    description: 'Name of the output folder',
    default: '_ai_output',
  },
  includeFiles: {
    description: 'Files to include (comma-separated)',
    default: '',
  },
  includeExtensions: {
    description: 'File extensions to include (comma-separated)',
    default: '',
  },
  includeFolders: {
    description: 'Folders to include (comma-separated)',
    default: '',
  },
  excludeFiles: {
    description: 'Files to exclude (comma-separated)',
    default: '',
  },
  excludeExtensions: {
    description: 'File extensions to exclude (comma-separated)',
    default: '',
  },
  excludeFolders: {
    description: 'Folders to exclude (comma-separated)',
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
