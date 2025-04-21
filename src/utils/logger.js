const chalk = require('chalk');

/**
 * Simple logger utility
 */
const logger = {
  /**
   * Log debug message
   * @param {string} message Message to log
   */
  debug: (message) => {
    if (process.env.DEBUG) {
      console.log(chalk.gray(`[DEBUG] ${message}`));
    }
  },

  /**
   * Log info message
   * @param {string} message Message to log
   */
  info: (message) => {
    console.log(chalk.blue(`[INFO] ${message}`));
  },

  /**
   * Log success message
   * @param {string} message Message to log
   */
  success: (message) => {
    console.log(chalk.green(`[SUCCESS] ${message}`));
  },

  /**
   * Log warning message
   * @param {string} message Message to log
   */
  warn: (message) => {
    console.log(chalk.yellow(`[WARNING] ${message}`));
  },

  /**
   * Log error message
   * @param {string} message Message to log
   */
  error: (message) => {
    console.error(chalk.red(`[ERROR] ${message}`));
  }
};

module.exports = {
  logger
};
