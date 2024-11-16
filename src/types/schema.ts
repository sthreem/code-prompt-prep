import { z } from 'zod';
import type { ValidationError } from './errors.js';

export const FilterOptionsSchema = z.object({
  files: z.array(z.string()).default([]),
  extensions: z.array(z.string()).default([]),
  folders: z.array(z.string()).default([]),
});

export const ProgramOptionsSchema = z.object({
  projectPath: z.string(),
  outputFolder: z.string().default('_ai_output'),
  include: FilterOptionsSchema,
  exclude: FilterOptionsSchema,
  concurrency: z.number().int().positive().default(4),
});

export type FilterOptions = z.infer<typeof FilterOptionsSchema>;
export type ProgramOptions = z.infer<typeof ProgramOptionsSchema>;

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

// Constants for CLI options
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
    description: 'Number of files to process concurrently',
    default: 4,
  },
} as const;

export const parseCommaSeparated = (value: string): string[] =>
  value
    .split(',')
    .filter(Boolean)
    .map(item => item.trim());
