/**
 * Base plugin interface that all plugins must implement
 */
class PluginInterface {
  /**
   * Get plugin name
   * @returns {string} The name of the plugin
   */
  getName() {
    throw new Error('Method not implemented');
  }

  /**
   * Get plugin version
   * @returns {string} The version of the plugin
   */
  getVersion() {
    throw new Error('Method not implemented');
  }

  /**
   * Get plugin description
   * @returns {string} The description of the plugin
   */
  getDescription() {
    throw new Error('Method not implemented');
  }

  /**
   * Get plugin dependencies
   * @returns {string[]} Array of plugin names this plugin depends on
   */
  getDependencies() {
    return [];
  }

  /**
   * Get plugin default configuration
   * @returns {Object} Default configuration values
   */
  getDefaults() {
    return {};
  }

  /**
   * Initialize the plugin
   * @param {Object} context The plugin context
   */
  async initialize(context) {
    throw new Error('Method not implemented');
  }

  /**
   * Apply the plugin to a project
   * @param {Object} context The project context
   */
  async apply(context) {
    throw new Error('Method not implemented');
  }

  /**
   * Validate plugin configuration
   * @param {Object} config The configuration to validate
   * @returns {boolean} True if valid, throws error otherwise
   */
  validateConfig(config) {
    return true;
  }

  /**
   * Get help text for the plugin
   * @returns {string} Help text
   */
  getHelp() {
    return `
Plugin: ${this.getName()} v${this.getVersion()}
${this.getDescription()}

Configuration Options:
${JSON.stringify(this.getDefaults(), null, 2)}
    `.trim();
  }
}

module.exports = PluginInterface;
