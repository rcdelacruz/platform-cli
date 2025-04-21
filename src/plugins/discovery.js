const fs = require('fs-extra');
const path = require('path');
const { pluginRegistry } = require('./registry');
const { logger } = require('../utils/logger');
const { getConfig } = require('../utils/config');

/**
 * Discover and load all available plugins
 */
async function discoverPlugins() {
  try {
    // Discover built-in plugins
    await discoverBuiltInPlugins();
    
    // Discover local plugins
    await discoverLocalPlugins();
    
    // Discover NPM plugins
    await discoverNpmPlugins();
    
    logger.debug(`Discovered ${pluginRegistry.getAllPlugins().size} plugins`);
    return pluginRegistry.getAllPlugins();
  } catch (error) {
    logger.error(`Error discovering plugins: ${error.message}`);
    throw error;
  }
}

/**
 * Discover built-in plugins
 */
async function discoverBuiltInPlugins() {
  const pluginsDir = path.join(__dirname, 'built-in');
  
  if (await fs.pathExists(pluginsDir)) {
    const files = await fs.readdir(pluginsDir);
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        try {
          const PluginClass = require(path.join(pluginsDir, file));
          const plugin = new PluginClass();
          pluginRegistry.register(plugin);
        } catch (error) {
          logger.warn(`Failed to load built-in plugin ${file}: ${error.message}`);
        }
      }
    }
  }
}

/**
 * Discover local plugins
 */
async function discoverLocalPlugins() {
  const config = getConfig();
  const localPluginsDir = path.resolve(config.pluginsDir || './plugins');
  
  if (await fs.pathExists(localPluginsDir)) {
    const files = await fs.readdir(localPluginsDir);
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        try {
          const PluginClass = require(path.join(localPluginsDir, file));
          const plugin = new PluginClass();
          pluginRegistry.register(plugin);
        } catch (error) {
          logger.warn(`Failed to load local plugin ${file}: ${error.message}`);
        }
      }
    }
  }
}

/**
 * Discover NPM plugins
 */
async function discoverNpmPlugins() {
  const config = getConfig();
  
  // Look for packages with the platform-cli-plugin prefix
  const packageJsonPath = path.resolve('package.json');
  
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    const pluginPrefix = config.pluginPrefix || 'platform-cli-plugin-';
    
    for (const [name, version] of Object.entries(dependencies)) {
      if (name.startsWith(pluginPrefix)) {
        try {
          const PluginClass = require(name);
          const plugin = new PluginClass();
          pluginRegistry.register(plugin);
        } catch (error) {
          logger.warn(`Failed to load NPM plugin ${name}: ${error.message}`);
        }
      }
    }
  }
}

module.exports = {
  discoverPlugins
};
