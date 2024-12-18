/**
 * Default patterns to ignore when processing files.
 * This list includes common patterns for:
 * - Version control system directories (.git, .svn, .hg)
 * - Package manager directories (node_modules, bower_components)
 * - IDE and editor directories (.idea, .vscode)
 * - Build output directories (dist, build, out)
 * - Binary and media files (images, videos, audio)
 * - Documents (PDF, Office files)
 * - Archive files (zip, tar, etc.)
 * - Font files
 * - Environment files
 * - Package manager lock files
 *
 * @type {string[]}
 */
export const DEFAULT_IGNORE_PATTERNS: string[] = [
  // Folders
  '.git/',
  '.svn/',
  '.hg/',
  'node_modules/',
  'bower_components/',
  '.idea/',
  '.vscode/',
  'dist/',
  'build/',
  'out/',
  'target/',
  'bin/',
  'obj/',
  // Files
  '.gitignore',
  '*.md',
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.gif',
  '*.bmp',
  '*.tiff',
  '*.ico',
  '*.svg',
  '*.mp4',
  '*.avi',
  '*.mov',
  '*.mkv',
  '*.webm',
  '*.mp3',
  '*.wav',
  '*.ogg',
  '*.flac',
  '*.zip',
  '*.rar',
  '*.7z',
  '*.tar',
  '*.gz',
  '*.bz2',
  '*.csv',
  '*.xls',
  '*.xlsx',
  '*.pdf',
  '*.doc',
  '*.docx',
  '*.ppt',
  '*.pptx',
  '*.class',
  '*.o',
  '*.so',
  '*.a',
  '*.exe',
  '*.dll',
  '*.woff',
  '*.woff2',
  '*.ttf',
  '*.otf',
  '*.eot',
  '.env',
  '.env.*',
  // Package manager lock files
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'npm-shrinkwrap.json',
  'shrinkwrap.yaml',
];
