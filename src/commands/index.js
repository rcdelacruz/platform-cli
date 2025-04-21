const { registerGenerateCommand } = require('./generate');

/**
 * Register all commands with the program
 * @param {Object} program Commander program instance
 */
function registerCommands(program) {
  registerGenerateCommand(program);
  
  // Add more command registrations here
  // registerPluginCommand(program);
  // registerConfigCommand(program);
}

module.exports = {
  registerCommands
};
