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
 * Utility function to create a confirmation prompt
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
 * Utility function to prompt for a single input
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
 * Utility function to prompt for a password
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
