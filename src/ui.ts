import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import inquirer from 'inquirer';

/**
 * UI message types for consistent styling
 */
export const enum MessageType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning',
}

/**
 * Display a styled message in the console
 * @param {MessageType} type - The type of message to display (success, error, info, warning)
 * @param {string} message - The message content to display
 * @returns {void}
 */
export function displayMessage(type: MessageType, message: string): void {
  switch (type) {
    case MessageType.SUCCESS:
      console.log(chalk.green('✓ ' + message));
      break;
    case MessageType.ERROR:
      console.error(chalk.red('✗ ' + message));
      break;
    case MessageType.WARNING:
      console.warn(chalk.yellow('⚠ ' + message));
      break;
    case MessageType.INFO:
      console.info(chalk.blue('ℹ ' + message));
      break;
  }
}

/**
 * Create and start a spinner for long-running operations
 * @param {string} text - The text to display next to the spinner
 * @returns {Ora} The created spinner instance
 */
export function createSpinner(text: string): Ora {
  return ora({
    text,
    color: 'cyan',
    spinner: 'dots',
  }).start();
}

/**
 * Prompt for a list of choices
 * @param {string} message - The prompt message to display
 * @param {string[]} choices - The list of choices to present to the user
 * @returns {Promise<string>} The selected choice
 */
export async function promptForChoice(message: string, choices: string[]): Promise<string> {
  const { choice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'choice',
      message,
      choices,
    },
  ]);
  return choice;
}

/**
 * Create a confirmation prompt
 * @param {string} message - The confirmation message to display
 * @returns {Promise<boolean>} True if confirmed, false otherwise
 */
export async function confirmAction(message: string): Promise<boolean> {
  const { confirmed } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: false,
    },
  ]);
  return confirmed;
}

/**
 * Prompt for a single input value
 * @param {string} message - The prompt message to display
 * @param {string} [defaultValue] - Optional default value for the input
 * @returns {Promise<string>} The user's input
 */
export async function promptForInput(message: string, defaultValue?: string): Promise<string> {
  const { input } = await inquirer.prompt([
    {
      type: 'input',
      name: 'input',
      message,
      default: defaultValue,
    },
  ]);
  return input;
}

/**
 * Prompt for a password
 * @param {string} message - The prompt message to display
 * @returns {Promise<string>} The entered password
 */
export async function promptForPassword(message: string): Promise<string> {
  const { password } = await inquirer.prompt([
    {
      type: 'password',
      name: 'password',
      message,
    },
  ]);
  return password;
}
