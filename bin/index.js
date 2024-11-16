#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const minimist = require("minimist");
const ignore = require("ignore");
const recursiveReadDir = require("recursive-readdir");

async function addToGitignore(projectPath, folderName) {
  const gitignorePath = path.join(projectPath, ".gitignore");
  const entry = `/${folderName}/\n`;
  let exists = false;

  if (await fs.pathExists(gitignorePath)) {
    const content = await fs.readFile(gitignorePath, "utf8");
    exists = content.includes(entry.trim());
  }

  if (!exists) {
    await fs.appendFile(gitignorePath, entry);
  }
}

function minifyCode(content) {
  content = content.replace(/\/\/.*$/gm, ""); // Remove single-line comments
  content = content.replace(/\/\*[\s\S]*?\*\//g, ""); // Remove multi-line comments
  content = content.trim(); // Remove leading/trailing whitespaces
  content = content.replace(/\s+/g, " "); // Replace multiple spaces/newlines with a single space
  return content;
}

async function processFile(filePath, projectPath, outputFile) {
  const relPath = path.relative(projectPath, filePath);
  try {
    const content = await fs.readFile(filePath, "utf8");
    const minifiedContent = minifyCode(content);
    await fs.appendFile(
      outputFile,
      `${relPath}\n${minifiedContent}\n\n`,
      "utf8"
    );
    console.log(`Successfully wrote: ${relPath}`);
  } catch (error) {
    console.error(`Error processing ${relPath}: ${error.message}`);
  }
}

async function loadGitignorePatterns(projectPath) {
  const gitignorePath = path.join(projectPath, ".gitignore");
  let ig = ignore();
  if (await fs.pathExists(gitignorePath)) {
    const content = await fs.readFile(gitignorePath, "utf8");
    ig.add(content);
  }
  return ig;
}

function filterFiles(files, projectPath, include, exclude, gitignorePatterns) {
  // If no include/exclude options are provided, process all files
  const hasFilters =
    include.files.length > 0 ||
    include.extensions.length > 0 ||
    include.folders.length > 0 ||
    exclude.files.length > 0 ||
    exclude.extensions.length > 0 ||
    exclude.folders.length > 0;

  if (!hasFilters) {
    console.log("No filters provided. Processing all files.");
    return files.filter(
      (file) => !gitignorePatterns.ignores(path.relative(projectPath, file))
    );
  }

  // Apply filters if specified
  return files.filter((file) => {
    const relPath = path.relative(projectPath, file);

    // Check if file is ignored by .gitignore
    if (gitignorePatterns.ignores(relPath)) {
      return false;
    }

    // Check for exclusions
    if (exclude.files.includes(relPath)) {
      return false;
    }
    if (exclude.extensions.some((ext) => file.endsWith(ext))) {
      return false;
    }
    if (
      exclude.folders.some((folder) =>
        file.startsWith(path.join(projectPath, folder))
      )
    ) {
      return false;
    }

    // Check for inclusions
    if (include.files.includes(relPath)) {
      return true;
    }
    if (
      include.extensions.some((ext) => file.endsWith(ext)) ||
      include.folders.some((folder) =>
        file.startsWith(path.join(projectPath, folder))
      )
    ) {
      return true;
    }

    return false;
  });
}

function formatTimestamp() {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "undefined") return [];
  return [value];
}

async function main() {
  const argv = minimist(process.argv.slice(2));
  const projectPath = path.resolve(argv._[0] || ".");

  if (!(await fs.pathExists(projectPath))) {
    console.error("Project path does not exist.");
    process.exit(1);
  }

  const outputFolderName = argv["of"] || "_ai_output";
  const outputFolder = path.join(projectPath, outputFolderName);
  await fs.ensureDir(outputFolder);

  // Add output folder to .gitignore
  await addToGitignore(projectPath, outputFolderName);

  // Load .gitignore patterns
  const gitignorePatterns = await loadGitignorePatterns(projectPath);

  // Create timestamped output file
  const timestamp = formatTimestamp();
  const outputFile = path.join(outputFolder, `${timestamp}.txt`);

  // Parse include and exclude options
  const include = {
    files: toArray(argv["if"]).map((f) => path.normalize(f)),
    extensions: toArray(argv["ie"]),
    folders: toArray(argv["if"]).map((f) => path.normalize(f)),
  };

  const exclude = {
    files: toArray(argv["xf"]).map((f) => path.normalize(f)),
    extensions: toArray(argv["xe"]),
    folders: toArray(argv["xf"]).map((f) => path.normalize(f)),
  };

  // Read all files recursively, ignoring patterns
  let files;
  try {
    files = await recursiveReadDir(projectPath, [
      (file, stats) => {
        const relPath = path.relative(projectPath, file);
        return gitignorePatterns.ignores(relPath);
      },
    ]);
  } catch (error) {
    console.error(`Error reading files: ${error.message}`);
    process.exit(1);
  }

  // Filter files based on include/exclude options
  const filteredFiles = filterFiles(
    files,
    projectPath,
    include,
    exclude,
    gitignorePatterns
  );

  // Process each file
  for (const file of filteredFiles) {
    await processFile(file, projectPath, outputFile);
  }

  console.log(`Minified code has been saved to ${outputFile}`);
}

main().catch((error) => {
  console.error(`An error occurred: ${error.message}`);
  process.exit(1);
});
