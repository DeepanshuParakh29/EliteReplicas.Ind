#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const serverDir = path.join(rootDir, 'server');
const libDir = path.join(serverDir, 'lib');
const distLibDir = path.join(distDir, 'lib');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
};

// Logging helper
function log(message, color = '') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${color}${message}${colors.reset}`);
}

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`, colors.blue);
  }
}

// Copy files recursively
function copyFiles(source, target) {
  if (!fs.existsSync(source)) {
    log(`Source directory does not exist: ${source}`, colors.yellow);
    return;
  }

  ensureDir(target);
  
  const files = fs.readdirSync(source);
  
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      copyFiles(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
      log(`Copied: ${sourcePath} -> ${targetPath}`, colors.green);
    }
  }
}

// Main function
async function main() {
  try {
    log('Starting server files copy process...', colors.blue);
    
    // Copy lib directory
    if (fs.existsSync(libDir)) {
      log('Copying lib directory...', colors.blue);
      copyFiles(libDir, distLibDir);
    } else {
      log('No lib directory found to copy.', colors.yellow);
    }
    
    // Copy any other server files needed at runtime
    const serverFiles = [
      'firebase-service-account.json',
      '.env',
      '.env.production'
    ];
    
    for (const file of serverFiles) {
      const sourceFile = path.join(rootDir, file);
      const targetFile = path.join(distDir, file);
      
      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, targetFile);
        log(`Copied: ${sourceFile} -> ${targetFile}`, colors.green);
      }
    }
    
    log('Server files copy process completed successfully!', colors.green);
    process.exit(0);
  } catch (error) {
    log(`Error copying server files: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Run the main function
main();
