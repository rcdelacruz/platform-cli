#!/usr/bin/env node

const { program } = require('commander');
const pkg = require('../package.json');
const { registerCommands } = require('../src/commands');
const { initializeConfig } = require('../src/utils/config');
const { logger } = require('../src/utils/logger');

// Initialize configuration
initializeConfig();

// Set up the program
program
  .version(pkg.version, '-v, --version', 'Output the current version')
  .description('Platform Engineering CLI tool');

// Register all commands
registerCommands(program);

// Handle unrecognized commands
program.on('command:*', function () {
  logger.error(`Invalid command: ${program.args.join(' ')}`);
  logger.info('See --help for a list of available commands.');
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no arguments
if (program.args.length === 0) {
  program.help();
}
