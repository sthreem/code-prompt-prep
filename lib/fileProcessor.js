import fs from 'fs-extra';
import path from 'path';
import ignore from 'ignore';
import recursiveReadDir from 'recursive-readdir';
import { minifyCode } from './utils.js';
import { DEFAULT_IGNORE_PATTERNS } from './ignorePatterns.js';

/**
 * Adds the output folder to the project's .gitignore file.
 * @param {string} projectPath - Path to the project directory.
 * @param {string} folderName - Name of the output folder.
 */
async function addToGitignore(projectPath, folderName) {
  const gitignorePath = path.join(projectPath, '.gitignore');
  const entry = `/${folderName}/\n`;

  try {
    let content = '';
    if (await fs.pathExists(gitignorePath)) {
      content = await fs.readFile(gitignorePath, 'utf8');
      if (content.includes(entry.trim())) {
        return;
      }
    }
    await fs.appendFile(gitignorePath, entry);
  } catch (error) {
    console.error(`Error updating .gitignore: ${error.message}`);
  }
}

/**
 * Loads ignore patterns from .gitignore and default patterns.
 * @param {string} projectPath - Path to the project directory.
 * @returns {object} - An instance of ignore with loaded patterns.
 */
async function loadIgnorePatterns(projectPath) {
  const gitignorePath = path.join(projectPath, '.gitignore');
  const ig = ignore().add(DEFAULT_IGNORE_PATTERNS);
  if (await fs.pathExists(gitignorePath)) {
    const content = await fs.readFile(gitignorePath, 'utf8');
    ig.add(content);
  }
  return ig;
}

/**
 * Reads all files in the project directory, respecting ignore patterns.
 * @param {string} projectPath - Path to the project directory.
 * @param {object} gitignorePatterns - ignore instance with patterns.
 * @returns {Promise<string[]>} - Array of file paths.
 */
async function readAllFiles(projectPath, gitignorePatterns) {
  return recursiveReadDir(projectPath, [
    file => gitignorePatterns.ignores(path.relative(projectPath, file)),
  ]);
}

/**
 * Filters files based on include and exclude options.
 * @param {string[]} files - Array of file paths.
 * @param {string} projectPath - Path to the project directory.
 * @param {object} include - Include options.
 * @param {object} exclude - Exclude options.
 * @param {object} gitignorePatterns - ignore instance with patterns.
 * @returns {string[]} - Filtered array of file paths.
 */
function filterFiles(files, projectPath, include, exclude, gitignorePatterns) {
  const hasFilters =
    include.files.length > 0 ||
    include.extensions.length > 0 ||
    include.folders.length > 0 ||
    exclude.files.length > 0 ||
    exclude.extensions.length > 0 ||
    exclude.folders.length > 0;

  if (!hasFilters) {
    console.log('No filters provided. Processing all files.');
    return files.filter(file => !gitignorePatterns.ignores(path.relative(projectPath, file)));
  }

  return files.filter(file => {
    const relPath = path.relative(projectPath, file);

    // Check if file is ignored by patterns
    if (gitignorePatterns.ignores(relPath)) {
      return false;
    }

    // Check for exclusions
    if (exclude.files.includes(relPath)) {
      return false;
    }
    if (exclude.extensions.some(ext => file.endsWith(ext))) {
      return false;
    }
    if (exclude.folders.some(folder => file.startsWith(path.join(projectPath, folder)))) {
      return false;
    }

    // Check for inclusions
    if (include.files.includes(relPath)) {
      return true;
    }
    if (
      include.extensions.some(ext => file.endsWith(ext)) ||
      include.folders.some(folder => file.startsWith(path.join(projectPath, folder)))
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Processes files by minifying and writing to the output file.
 * @param {string[]} files - Array of file paths to process.
 * @param {string} projectPath - Path to the project directory.
 * @param {string} outputFile - Path to the output file.
 */
async function processFiles(files, projectPath, outputFile) {
  for (const file of files) {
    const relPath = path.relative(projectPath, file);
    try {
      const content = await fs.readFile(file, 'utf8');
      const minifiedContent = minifyCode(content);
      await fs.appendFile(outputFile, `${relPath}\n${minifiedContent}\n\n`, 'utf8');
      console.log(`Processed: ${relPath}`);
    } catch (error) {
      console.error(`Error processing ${relPath}: ${error.message}`);
    }
  }
}

export { addToGitignore, loadIgnorePatterns, readAllFiles, filterFiles, processFiles };
