/**
 * Type definitions for the 'ignore' npm package.
 * This package provides functionality for handling .gitignore-style pattern matching.
 */
declare module 'ignore' {
  /**
   * Interface representing an instance of the ignore pattern matcher.
   * Provides methods for adding patterns and checking if paths match the patterns.
   */
  interface Ignore {
    /**
     * Adds one or more ignore patterns to the instance.
     * @param {string | string[]} pattern - A single pattern string or array of pattern strings
     * @returns {Ignore} The Ignore instance for method chaining
     */
    add(pattern: string | string[]): Ignore;

    /**
     * Checks if a given path matches any of the ignore patterns.
     * @param {string} path - The path to check against the ignore patterns
     * @returns {boolean} True if the path should be ignored, false otherwise
     */
    ignores(path: string): boolean;
  }

  /**
   * Creates a new instance of the Ignore pattern matcher.
   * @returns {Ignore} A new Ignore instance
   */
  function ignore(): Ignore;
  export = ignore;
}
