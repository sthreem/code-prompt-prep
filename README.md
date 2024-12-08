# Code Prompt Prep (CPP)

**Prepare project files for AI assistance by minifying and organizing code.**

---

## ⚡ Overview

`Code Prompt Prep (CPP)` is a CLI tool designed to streamline project file preparation for AI-powered tools or other use cases where concise, well-structured code is critical.

### Why is this Useful?

When interacting with AI tools, providing concise and relevant context is key to obtaining accurate and meaningful outputs. Large, unstructured codebases can overwhelm AI tools or lead to irrelevant responses. `Code Prompt Prep` solves this by generating **plain-text, minified versions of your code**, making it:

- **Easier to fit within input token limits.**
- **Faster to process for the AI.**
- **More focused**, reducing noise from unnecessary comments, whitespaces, or excluded files.

Whether you're using AI for debugging, documentation, or code generation, this tool ensures that only the essential parts of your project are included in the prompt or context.

---

## 🚧 Status

> **Note:** This package has not been published yet. Stay tuned for updates!

---

## 📦 Features

- **Minify Files**: Strips comments and extra spaces from code, leaving only the essential content.
- **Customizable Filters**: Specify which files, extensions, or folders to include or exclude for precise outputs.
- **Plain-Text Output**: Ensures your code is formatted in a way that is AI-friendly.
- **Concurrency Control**: Process multiple files simultaneously for faster execution.
- **User-Friendly Interface**: Clear CLI messages, spinners, and detailed error handling.
- **Robust Performance**: Stream-based file handling to minimize memory usage.
- **Graceful Cleanup**: Automatically removes incomplete output files if the process is interrupted.

---

## 📥 Installation

Since this package is not yet published, clone the repository and install dependencies locally:

```bash
git clone https://github.com/sthreem/code-prompt-prep.git
cd code-prompt-prep
npm install
```

To use the CLI globally, link it with `npm`:

```bash
npm link
```

---

## 🚀 Usage

### Basic Command

```bash
cpp --project-path <path_to_project> [options]
```

### Examples

1. **Process all files in the current directory**:

   ```bash
   cpp --project-path .
   ```

2. **Include only `.ts` and `.js` files**:

   ```bash
   cpp --project-path ./src --include-extensions .ts,.js
   ```

3. **Exclude `node_modules` and `dist` folders**:

   ```bash
   cpp --project-path ./ --exclude-folders node_modules,dist
   ```

4. **Limit concurrency to 2 for slower systems**:

   ```bash
   cpp --project-path ./ --concurrency 2
   ```

### Help Command

```bash
cpp --help
```

Output:

```
Usage: cpp [options]

Prepare project files for AI assistance by minifying and organizing code.

Options:
  -p, --project-path <path>       Path to the project directory (default: ".")
  -o, --output-folder <name>      Name of the output folder (default: "_ai_output")
  -if, --include-files <list>     Files to include (comma-separated file paths)
  -ie, --include-extensions <list>
                                  File extensions to include (comma-separated, must start with dot)
  -id, --include-folders <list>   Folders to include (comma-separated folder paths)
  -xf, --exclude-files <list>     Files to exclude (comma-separated file paths)
  -xe, --exclude-extensions <list>
                                  File extensions to exclude (comma-separated, must start with dot)
  -xd, --exclude-folders <list>   Folders to exclude (comma-separated folder paths)
  -c, --concurrency <number>      Number of files to process concurrently (max 100) (default: 4)
  -h, --help                      Display help for command
```

---

## 🛠 Configuration

### Filters

You can customize which files or folders to include/exclude using the following options:

- **Include Options**:

  - `--include-files`: Specify exact file paths to include.
  - `--include-extensions`: Specify file extensions (e.g., `.js`, `.ts`).
  - `--include-folders`: Include entire folders.

- **Exclude Options**:
  - `--exclude-files`: Specify exact file paths to exclude.
  - `--exclude-extensions`: Specify file extensions to exclude.
  - `--exclude-folders`: Exclude entire folders.

### Output

The processed files are saved in the specified output folder (default: `_ai_output`) with a timestamped `.txt` file. This plain-text file can then be directly copied into an AI prompt or used as context when interacting with AI tools.

---

## 🔒 Graceful Handling of Interruptions

The tool ensures:

- **Spinners and progress indicators are stopped.**
- **Incomplete output files are cleaned up automatically.**
- **Active buffers are safely closed.**

This means that if you interrupt the process (e.g., pressing `Ctrl+C`), `Code Prompt Prep` will handle the cleanup without requiring any manual intervention.

---

## 🧪 Testing

> **Note:** Tests are not included yet but will be added in future updates.

---

## 🛡 Known Limitations

- **Unpublished**: This package is not yet available on NPM.
- **Filters**: Complex filtering logic may require further customization.

---

## 🤝 Contributing

Contributions are welcome! To get started:

1. Fork the repository.
2. Clone your fork:
   ```bash
   git clone https://github.com/<your_username>/code-prompt-prep.git
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature
   ```
4. Push your changes and open a pull request.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 📧 Support

For issues or questions, please open an issue on [GitHub Issues](https://github.com/sthreem/code-prompt-prep/issues).

---

**Streamline your code preparation for AI with `Code Prompt Prep`—minify, organize, and optimize your files today!**
