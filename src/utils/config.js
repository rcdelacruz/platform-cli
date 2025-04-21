const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { merge } = require('lodash');
const { logger } = require('./logger');

// Default configuration
const defaultConfig = {
  templates: {
    'java-spring': {
      source: 'git',
      url: 'https://github.com/yourcompany/platform-template-java-spring.git',
      branch: 'main'
    },
    'react': {
      source: 'git',
      url: 'https://github.com/yourcompany/platform-template-react.git',
      branch: 'main'
    },
    'node-express': {
      source: 'git',
      url: 'https://github.com/yourcompany/platform-template-node-express.git',
      branch: 'main'
    }
  },
  pluginPrefix: 'platform-cli-plugin-',
  pluginsDir: './plugins',
  templateDir: './templates'
};

// Global configuration object
let globalConfig = null;

/**
 * Initialize configuration
 */
function initializeConfig() {
  if (globalConfig) {
    return globalConfig;
  }
  
  try {
    // Start with default configuration
    globalConfig = { ...defaultConfig };
    
    // Look for configuration files in multiple locations
    const configLocations = [
      // Global config
      path.join(os.homedir(), '.platform-cli.json'),
      
      // Project config
      path.resolve('.platform-cli.json'),
      
      // Environment-specific config
      process.env.PLATFORM_CLI_CONFIG
    ].filter(Boolean);
    
    // Load and merge configurations
    for (const configPath of configLocations) {
      if (fs.existsSync(configPath)) {
        try {
          const config = fs.readJsonSync(configPath);
          globalConfig = merge(globalConfig, config);
          logger.debug(`Loaded configuration from ${configPath}`);
        } catch (error) {
          logger.warn(`Failed to load configuration from ${configPath}: ${error.message}`);
        }
      }
    }
    
    return globalConfig;
  } catch (error) {
    logger.warn(`Failed to initialize configuration: ${error.message}`);
    return defaultConfig;
  }
}

/**
 * Get the current configuration
 * @returns {Object} The current configuration
 */
function getConfig() {
  if (!globalConfig) {
    return initializeConfig();
  }
  
  return globalConfig;
}

/**
 * Save configuration to a file
 * @param {Object} config Configuration to save
 * @param {string} filePath Path to save the configuration to
 */
async function saveConfig(config, filePath = path.join(os.homedir(), '.platform-cli.json')) {
  try {
    await fs.writeJson(filePath, config, { spaces: 2 });
    globalConfig = merge({}, defaultConfig, config);
    logger.debug(`Saved configuration to ${filePath}`);
    return true;
  } catch (error) {
    logger.error(`Failed to save configuration to ${filePath}: ${error.message}`);
    return false;
  }
}

module.exports = {
  initializeConfig,
  getConfig,
  saveConfig,
  defaultConfig
};
