const path = require('path');
const { logger } = require('../utils/logger');
const { getTemplateSource } = require('../templates/sources');
const { processTemplate } = require('../templates/processor');
const { pluginRegistry } = require('../plugins/registry');
const { discoverPlugins } = require('../plugins/discovery');

/**
 * Register the generate command
 * @param {Object} program Commander program instance
 */
function registerGenerateCommand(program) {
  program
    .command('generate')
    .alias('g')
    .description('Generate a new project from a template')
    .argument('<template>', 'Template name (e.g., java-spring, react)')
    .option('-n, --name <name>', 'Project name')
    .option('-o, --output <dir>', 'Output directory (defaults to ./<name>)')
    .option('-p, --package <package>', 'Package name (for Java projects)')
    .option('--with-plugins <plugins>', 'Comma-separated list of plugins to apply', commaSeparatedList)
    .option('--org <organization>', 'GitHub organization for template repository')
    .option('--repo <repository>', 'GitHub repository name for template')
    .option('--branch <branch>', 'Git branch to use (defaults to main)')
    .action(async (templateName, options) => {
      try {
        // Prepare context
        const name = options.name || templateName;
        const outputDir = options.output || path.resolve(`./${name}`);
        
        const context = {
          name,
          outputDir,
          packageName: options.package || getDefaultPackage(name),
          templateName,
          plugins: options.withPlugins || []
        };
        
        logger.info(`Generating ${templateName} project: ${name}`);
        
        // Get template source
        const templateSource = getTemplateSource(templateName, {
          org: options.org,
          repo: options.repo,
          branch: options.branch
        });
        
        // Load template
        await templateSource.load();
        
        // Process template
        await processTemplate(context, templateSource);
        
        // Apply plugins if specified
        if (context.plugins.length > 0) {
          // Discover available plugins
          await discoverPlugins();
          
          logger.info(`Applying plugins: ${context.plugins.join(', ')}`);
          
          // Resolve plugin dependencies to get the correct order
          const orderedPlugins = pluginRegistry.getPluginsInDependencyOrder(context.plugins);
          
          // Apply plugins in order
          for (const pluginName of orderedPlugins) {
            const plugin = pluginRegistry.getPlugin(pluginName);
            logger.info(`Applying plugin: ${pluginName}`);
            await plugin.apply(context);
          }
        }
        
        // Clean up
        await templateSource.cleanup();
        
        logger.success(`Project generated successfully at ${outputDir}`);
        logger.info(`You can now:
  cd ${path.relative(process.cwd(), outputDir)}
  # Follow the README.md for next steps`);
      } catch (error) {
        logger.error(`Failed to generate project: ${error.message}`);
        logger.debug(error.stack);
        process.exit(1);
      }
    });
}

/**
 * Split a comma-separated list into an array
 * @param {string} value Comma-separated list
 * @returns {string[]} Array of values
 */
function commaSeparatedList(value) {
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

/**
 * Get a default package name based on project name
 * @param {string} name Project name
 * @returns {string} Default package name
 */
function getDefaultPackage(name) {
  // Convert project name to lowercase and replace non-alphanumeric characters with dots
  const sanitized = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
  
  // Remove consecutive dots
  const normalized = sanitized.replace(/\.{2,}/g, '.');
  
  // Remove leading and trailing dots
  const trimmed = normalized.replace(/^\.+|\.+$/g, '');
  
  // Add a default domain if needed
  return trimmed.includes('.') ? trimmed : `com.example.${trimmed}`;
}

module.exports = {
  registerGenerateCommand
};
