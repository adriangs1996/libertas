/**
 * Output formatting utilities
 */

import chalk from 'chalk';

export class Formatter {
  /**
   * Format success message
   */
  static success(message: string): string {
    return chalk.green(`✓ ${message}`);
  }

  /**
   * Format error message
   */
  static error(message: string): string {
    return chalk.red(`✗ ${message}`);
  }

  /**
   * Format warning message
   */
  static warning(message: string): string {
    return chalk.yellow(`⚠ ${message}`);
  }

  /**
   * Format info message
   */
  static info(message: string): string {
    return chalk.blue(`ℹ ${message}`);
  }

  /**
   * Format header
   */
  static header(text: string): string {
    return chalk.bold.cyan(`\n${text}\n`);
  }

  /**
   * Format key-value pair
   */
  static keyValue(key: string, value: any): string {
    return `${chalk.gray(key)}: ${chalk.white(JSON.stringify(value))}`;
  }

  /**
   * Format JSON data for display
   */
  static json(data: any, indent: number = 2): string {
    return JSON.stringify(data, null, indent);
  }

  /**
   * Format table
   */
  static table(data: any[]): void {
    console.table(data);
  }

  /**
   * Format list
   */
  static list(items: string[]): string {
    return items.map((item) => `  • ${item}`).join('\n');
  }
}

export default Formatter;
