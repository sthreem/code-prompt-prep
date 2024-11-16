import { setTimeout, clearTimeout } from 'timers';

/**
 * Type guard to check if a value is a non-null object
 * @param {unknown} value - Value to check
 * @returns {boolean} True if the value is a non-null object
 */
export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Type guard to check if a value is a string
 * @param {unknown} value - Value to check
 * @returns {boolean} True if the value is a string
 */
export const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * Minifies code by removing comments and unnecessary whitespace.
 * Uses modern regex patterns and string methods.
 * @param {string} content - Code content to minify
 * @returns {string} Minified code
 */
export function minifyCode(content: string): string {
  return (
    content
      // Remove single-line comments using lookbehind to preserve URLs
      .replace(/(?<!:)\/\/.*$/gm, '')
      // Remove multi-line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      // Remove leading/trailing whitespaces and collapse multiple whitespaces
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .join(' ')
      // Collapse multiple spaces
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Formats the current timestamp using modern date formatting.
 * @returns {string} Formatted timestamp string in the format YYYYMMdd_HHmmss
 */
export function formatTimestamp(): string {
  const now = new Date();
  const pad = (n: number): string => n.toString().padStart(2, '0');

  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * Ensures the input is an array using modern array methods.
 * @param {T | T[] | undefined | null} value - The value to convert
 * @returns {T[]} The value as an array
 */
export function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Safely joins path segments using modern path manipulation.
 * @param {string[]} segments - Path segments to join
 * @returns {string} Joined path string
 */
export function joinPath(...segments: string[]): string {
  return segments
    .filter(Boolean)
    .map(segment => segment.replace(/^\/+|\/+$/g, ''))
    .join('/');
}

/**
 * Creates a debounced version of a function.
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>): void => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Creates a throttled version of a function.
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle<T extends (...args: never[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
