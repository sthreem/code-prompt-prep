export interface FilterOptions {
  files: string[];
  extensions: string[];
  folders: string[];
}

export interface ProcessingOptions {
  projectPath: string;
  outputFolderName: string;
  include: FilterOptions;
  exclude: FilterOptions;
}

export interface MinifyOptions {
  content: string;
}

export type IgnoreFunction = (path: string) => boolean;

// For minimist parsed arguments
export interface ParsedArgs {
  [key: string]: string | number | boolean | string[] | undefined;
  _: string[];
  of?: string;
  if?: string | string[];
  ie?: string | string[];
  xf?: string | string[];
  xe?: string | string[];
}
