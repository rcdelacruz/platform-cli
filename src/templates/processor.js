const fs = require('fs-extra');
const path = require('path');
const { template } = require('lodash');
const { logger } = require('../utils/logger');

/**
 * Process a template for a project
 * @param {Object} context Project context (name, outputDir, etc.)
 * @param {Object} templateSource Template source instance
 */
async function processTemplate(context, templateSource) {
  const { name, outputDir } = context;
  
  logger.info('Processing template files...');
  
  try {
    // Create output directory
    await fs.ensureDir(outputDir);
    
    // Get all template files
    const files = await templateSource.getFiles();
    logger.debug(`Found ${files.length} template files`);
    
    // Process each file
    for (const file of files) {
      await processFile(file, context, templateSource);
    }
    
    logger.info('Template processing complete');
    return true;
  } catch (error) {
    logger.error(`Template processing failed: ${error.message}`);
    throw error;
  }
}

/**
 * Process a single template file
 * @param {string} file Relative file path
 * @param {Object} context Project context
 * @param {Object} templateSource Template source instance
 */
async function processFile(file, context, templateSource) {
  try {
    // Get file content
    const content = await templateSource.getFileContent(file);
    
    // Process file path (replace variables in path)
    let outputPath = file;
    
    // Replace placeholders in file path
    if (outputPath.includes('{{') && outputPath.includes('}}')) {
      try {
        const pathTemplate = template(outputPath, { interpolate: /{{([\s\S]+?)}}/g });
        outputPath = pathTemplate(context);
      } catch (error) {
        logger.warn(`Failed to process template variables in path ${outputPath}: ${error.message}`);
      }
    }
    
    // Handle special placeholder patterns
    // e.g., Java package directories: __packageDir__/MyClass.java -> com/example/MyClass.java
    if (context.packageName && outputPath.includes('__packageDir__')) {
      outputPath = outputPath.replace(
        '__packageDir__',
        context.packageName.replace(/\./g, '/')
      );
    }
    
    // Create output directory
    const outputFilePath = path.join(context.outputDir, outputPath);
    await fs.ensureDir(path.dirname(outputFilePath));
    
    // Process file content (if text file)
    if (isTextFile(file)) {
      let textContent = content.toString('utf8');
      
      // Replace placeholders in content
      if (textContent.includes('{{') && textContent.includes('}}')) {
        try {
          const contentTemplate = template(textContent, { interpolate: /{{([\s\S]+?)}}/g });
          textContent = contentTemplate(context);
        } catch (error) {
          logger.warn(`Failed to process template variables in ${file}: ${error.message}`);
        }
      }
      
      // Handle special replacements
      
      // Replace package name placeholders
      if (context.packageName) {
        textContent = textContent.replace(/\${packageName}/g, context.packageName);
      }
      
      // Replace project name placeholders
      if (context.name) {
        textContent = textContent.replace(/\${projectName}/g, context.name);
      }
      
      // Write processed content
      await fs.writeFile(outputFilePath, textContent);
    } else {
      // Binary file, copy as-is
      await fs.writeFile(outputFilePath, content);
    }
    
    logger.debug(`Processed file: ${file} -> ${outputPath}`);
  } catch (error) {
    logger.warn(`Failed to process file ${file}: ${error.message}`);
    throw error;
  }
}

/**
 * Check if a file is a text file
 * @param {string} filePath File path
 * @returns {boolean} True if the file is a text file
 */
function isTextFile(filePath) {
  const textExtensions = [
    '.txt', '.md', '.html', '.css', '.scss', '.less', '.js', '.jsx', '.ts', '.tsx',
    '.json', '.xml', '.yaml', '.yml', '.properties', '.conf', '.config',
    '.java', '.kt', '.groovy', '.gradle', '.py', '.rb', '.php', '.c', '.cpp', '.h',
    '.cs', '.go', '.rs', '.swift', '.sh', '.bat', '.ps1'
  ];
  
  const ext = path.extname(filePath).toLowerCase();
  
  // Check extension
  if (textExtensions.includes(ext)) {
    return true;
  }
  
  // Some files might be text but have no extension
  const basename = path.basename(filePath).toLowerCase();
  const textFileNames = [
    'dockerfile', 'jenkinsfile', 'makefile', 'readme', 'license', '.gitignore',
    '.dockerignore', '.npmignore', '.npmrc', '.env', '.env.example'
  ];
  
  return textFileNames.includes(basename);
}

module.exports = {
  processTemplate
};
