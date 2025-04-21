const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');
const { logger } = require('../../utils/logger');

/**
 * Template source that pulls from a Git repository
 */
class GitTemplateSource {
  /**
   * Create a new Git template source
   * @param {string} templateName The name of the template
   * @param {Object} config Git template configuration
   */
  constructor(templateName, config = {}) {
    this.templateName = templateName;
    this.config = config;
    this.tempDir = path.join(os.tmpdir(), `platform-cli-${Date.now()}`);
  }

  /**
   * Load the template from the Git repository
   */
  async load() {
    logger.info(`Loading template from Git repository: ${this.getRepoUrl()}`);
    
    try {
      // Create temp directory
      await fs.ensureDir(this.tempDir);
      
      // Clone the repository
      const cloneCmd = `git clone ${this.getRepoUrl()} --branch ${this.getBranch()} --single-branch ${this.tempDir}`;
      logger.debug(`Executing: ${cloneCmd}`);
      
      execSync(cloneCmd, { stdio: 'pipe' });
      
      // Remove .git directory
      const gitDir = path.join(this.tempDir, '.git');
      if (await fs.pathExists(gitDir)) {
        await fs.remove(gitDir);
      }
      
      logger.debug('Template loaded successfully');
      return true;
    } catch (error) {
      logger.error(`Failed to load template: ${error.message}`);
      throw new Error(`Failed to load template: ${error.message}`);
    }
  }

  /**
   * Get all files in the template
   * @returns {Promise<string[]>} Array of file paths relative to template root
   */
  async getFiles() {
    const result = [];

    const processDirectory = async (dir, base = '') => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(base, entry.name);
        
        if (entry.isDirectory()) {
          await processDirectory(fullPath, relativePath);
        } else {
          result.push(relativePath);
        }
      }
    };

    await processDirectory(this.tempDir);
    return result;
  }

  /**
   * Get the content of a file
   * @param {string} filePath Path to the file relative to template root
   * @returns {Promise<Buffer>} File content
   */
  async getFileContent(filePath) {
    return fs.readFile(path.join(this.tempDir, filePath));
  }

  /**
   * Clean up temporary resources
   */
  async cleanup() {
    try {
      if (await fs.pathExists(this.tempDir)) {
        await fs.remove(this.tempDir);
        logger.debug('Cleaned up temporary template files');
      }
    } catch (error) {
      logger.warn(`Failed to clean up temporary files: ${error.message}`);
    }
  }

  /**
   * Get the Git repository URL
   * @returns {string} Repository URL
   */
  getRepoUrl() {
    // Use explicitly configured URL if available
    if (this.config.url) {
      return this.config.url;
    }
    
    // Build URL from components if available
    const org = this.config.org || 'rcdelacruz';
    const repo = this.config.repo || `platform-template-${this.templateName}`;
    
    return `https://github.com/${org}/${repo}.git`;
  }

  /**
   * Get the branch to use
   * @returns {string} Branch name
   */
  getBranch() {
    return this.config.branch || 'main';
  }

  /**
   * Get the template directory
   * @returns {string} Template directory path
   */
  getTemplateDir() {
    return this.tempDir;
  }
}

module.exports = GitTemplateSource;
