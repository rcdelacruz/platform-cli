const { logger } = require('../utils/logger');

/**
 * Registry for platform plugins
 */
class PluginRegistry {
  constructor() {
    this.plugins = new Map();
  }

  /**
   * Register a plugin
   * @param {PluginInterface} plugin The plugin instance
   */
  register(plugin) {
    const name = plugin.getName();
    if (this.plugins.has(name)) {
      throw new Error(`Plugin with name "${name}" is already registered`);
    }
    
    logger.debug(`Registering plugin: ${name} v${plugin.getVersion()}`);
    this.plugins.set(name, plugin);
    return this;
  }

  /**
   * Get a plugin by name
   * @param {string} name The plugin name
   * @returns {PluginInterface} The plugin instance
   */
  getPlugin(name) {
    if (!this.plugins.has(name)) {
      throw new Error(`Plugin "${name}" not found`);
    }
    
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins
   * @returns {Map<string, PluginInterface>} Map of all plugins
   */
  getAllPlugins() {
    return this.plugins;
  }

  /**
   * Check if a plugin is registered
   * @param {string} name The plugin name
   * @returns {boolean} True if the plugin is registered
   */
  hasPlugin(name) {
    return this.plugins.has(name);
  }

  /**
   * Resolve dependencies for a plugin
   * @param {string} name The plugin name
   * @param {Set<string>} visited Plugins already visited (for cycle detection)
   */
  resolveDependencies(name, visited = new Set()) {
    if (visited.has(name)) {
      throw new Error(`Circular dependency detected involving plugin "${name}"`);
    }

    visited.add(name);
    const plugin = this.getPlugin(name);
    const dependencies = plugin.getDependencies();

    for (const dep of dependencies) {
      if (!this.hasPlugin(dep)) {
        throw new Error(`Unresolved dependency "${dep}" for plugin "${name}"`);
      }
      
      this.resolveDependencies(dep, new Set(visited));
    }
  }
  
  /**
   * Get a list of plugins in dependency order
   * @param {string[]} pluginNames Names of plugins to order
   * @returns {string[]} Plugin names in dependency order
   */
  getPluginsInDependencyOrder(pluginNames) {
    const result = [];
    const visited = new Set();
    
    const visit = (name) => {
      if (visited.has(name)) {
        return;
      }
      
      visited.add(name);
      
      if (this.hasPlugin(name)) {
        const plugin = this.getPlugin(name);
        const dependencies = plugin.getDependencies();
        
        for (const dep of dependencies) {
          visit(dep);
        }
        
        if (!result.includes(name)) {
          result.push(name);
        }
      }
    };
    
    for (const name of pluginNames) {
      visit(name);
    }
    
    return result;
  }
}

// Export singleton instance
const pluginRegistry = new PluginRegistry();

module.exports = {
  PluginRegistry,
  pluginRegistry
};
