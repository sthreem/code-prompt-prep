/**
 * Minifies code by removing comments and unnecessary whitespace.
 * @param content - Code content to minify.
 * @returns Minified code.
 */
export function minifyCode(content: string): string {
  // Remove single-line comments
  content = content.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  // Remove leading/trailing whitespaces
  content = content.trim();
  // Replace multiple spaces and newlines with a single space
  content = content.replace(/\s+/g, ' ');
  return content;
}

/**
 * Formats the current timestamp.
 * @returns Formatted timestamp string.
 */
export function formatTimestamp(): string {
  const now = new Date();
  const pad = (n: number): string => n.toString().padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

/**
 * Ensures the input is an array.
 * @param value - The value to convert.
 * @returns The value as an array.
 */
export function toArray<T>(value: T | T[] | undefined): T[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'undefined') return [];
  return [value];
}
