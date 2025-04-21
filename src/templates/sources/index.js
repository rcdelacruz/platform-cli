const path = require('path');
const fs = require('fs-extra');
const { logger } = require('../../utils/logger');
const { getConfig } = require('../../utils/config');
const GitTemplateSource = require('./git');

/**
 * Factory function to get a template source for a template
 * @param {string} templateName The name of the template
 * @param {Object} options Additional options
 * @returns {Object} Template source instance
 */
function getTemplateSource(templateName, options = {}) {
  const config = getConfig();
  const templateConfigs = config.templates || {};
  
  // Template-specific configuration from config file
  const templateConfig = templateConfigs[templateName] || {};
  
  // Merge with options
  const finalConfig = { ...templateConfig, ...options };
  
  // Default source type is 'git'
  const sourceType = finalConfig.source || 'git';
  
  logger.debug(`Using template source type: ${sourceType} for template: ${templateName}`);
  
  switch (sourceType) {
    case 'git':
      return new GitTemplateSource(templateName, finalConfig);
    case 'local':
      throw new Error('Local template source not yet implemented');
    case 'npm':
      throw new Error('NPM template source not yet implemented');
    default:
      throw new Error(`Unknown template source type: ${sourceType}`);
  }
}

/**
 * Check if a local template exists
 * @param {string} templateName The name of the template
 * @returns {Promise<boolean>} True if the template exists locally
 */
async function hasLocalTemplate(templateName) {
  const config = getConfig();
  const localTemplateDir = config.templateDir || './templates';
  const templatePath = path.resolve(localTemplateDir, templateName);
  
  return fs.pathExists(templatePath);
}

/**
 * List available templates
 * @returns {Promise<string[]>} List of available template names
 */
async function listTemplates() {
  const config = getConfig();
  const templates = Object.keys(config.templates || {});
  
  // Check for local templates
  const localTemplateDir = config.templateDir || './templates';
  if (await fs.pathExists(localTemplateDir)) {
    const localTemplates = await fs.readdir(localTemplateDir);
    
    // Add local templates that don't exist in config
    for (const template of localTemplates) {
      if (!templates.includes(template)) {
        templates.push(template);
      }
    }
  }
  
  return templates;
}

module.exports = {
  getTemplateSource,
  hasLocalTemplate,
  listTemplates
};
