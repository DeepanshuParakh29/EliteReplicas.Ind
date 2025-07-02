#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const rootDir = path.resolve(__dirname, '..');
const clientDir = path.join(rootDir, 'client');
const publicDir = path.join(clientDir, 'public');
const distDir = path.join(rootDir, 'dist');
const distPublicDir = path.join(distDir, 'public');

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

// Copy files recursively with filtering
function copyFiles(source, target, options = {}) {
  const {
    exclude = [],
    include = ['*'],
    rename = null,
    transform = null
  } = options;

  if (!fs.existsSync(source)) {
    log(`Source directory does not exist: ${source}`, colors.yellow);
    return;
  }

  ensureDir(target);
  
  const files = fs.readdirSync(source);
  
  for (const file of files) {
    // Skip excluded files/directories
    if (exclude.some(pattern => {
      if (typeof pattern === 'string') {
        return file === pattern;
      } else if (pattern instanceof RegExp) {
        return pattern.test(file);
      }
      return false;
    })) {
      log(`Skipping excluded: ${file}`, colors.yellow);
      continue;
    }

    const sourcePath = path.join(source, file);
    let targetPath = path.join(target, rename ? rename(file) : file);
    
    const stat = fs.statSync(sourcePath);
    
    if (stat.isDirectory()) {
      copyFiles(sourcePath, targetPath, options);
    } else {
      // Check if file should be included based on include patterns
      const shouldInclude = include.some(pattern => {
        if (typeof pattern === 'string') {
          return file === pattern || pattern === '*';
        } else if (pattern instanceof RegExp) {
          return pattern.test(file);
        }
        return false;
      });

      if (!shouldInclude) {
        log(`Skipping non-included file: ${file}`, colors.yellow);
        continue;
      }

      // Ensure target directory exists
      ensureDir(path.dirname(targetPath));
      
      // Copy or transform file
      if (typeof transform === 'function') {
        const content = fs.readFileSync(sourcePath, 'utf8');
        const transformed = transform(content, file);
        fs.writeFileSync(targetPath, transformed);
        log(`Transformed: ${sourcePath} -> ${targetPath}`, colors.green);
      } else {
        fs.copyFileSync(sourcePath, targetPath);
        log(`Copied: ${sourcePath} -> ${targetPath}`, colors.green);
      }
    }
  }
}

// Process environment variables for the client
function processEnvVars() {
  const envPath = path.join(rootDir, '.env');
  const envExamplePath = path.join(rootDir, '.env.example');
  const targetEnvPath = path.join(distPublicDir, 'env.js');
  
  let envVars = {};
  
  // Load .env file if it exists
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        // Only include client-side env vars (prefixed with NEXT_PUBLIC_ or VITE_)
        if (key.startsWith('NEXT_PUBLIC_') || key.startsWith('VITE_')) {
          envVars[key] = match[2].trim().replace(/(^['"]|['"]$)/g, '');
        }
      }
    });
  } else if (fs.existsSync(envExamplePath)) {
    log('No .env file found, using .env.example', colors.yellow);
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        if (key.startsWith('NEXT_PUBLIC_') || key.startsWith('VITE_')) {
          envVars[key] = match[2].trim().replace(/(^['"]|['"]$)/g, '');
        }
      }
    });
  } else {
    log('No .env or .env.example file found', colors.yellow);
  }
  
  // Create env.js file with the environment variables
  const envJsContent = `// Auto-generated at build time
window.__ENV = ${JSON.stringify(envVars, null, 2)};`;
  
  ensureDir(path.dirname(targetEnvPath));
  fs.writeFileSync(targetEnvPath, envJsContent);
  log(`Generated environment variables: ${targetEnvPath}`, colors.green);
}

// Main function
async function main() {
  try {
    log('Starting client files copy process...', colors.blue);
    
    // Ensure dist directory exists
    ensureDir(distDir);
    ensureDir(distPublicDir);
    
    // Copy public directory
    if (fs.existsSync(publicDir)) {
      log('Copying public directory...', colors.blue);
      copyFiles(publicDir, distPublicDir, {
        exclude: [
          '**/*.md',
          '**/README*',
          '**/CHANGELOG*',
          '**/LICENSE*',
          '**/package*.json',
          '**/tsconfig*.json',
          '**/*.test.*',
          '**/__tests__',
          '**/node_modules'
        ]
      });
    } else {
      log('No public directory found to copy.', colors.yellow);
    }
    
    // Process environment variables
    processEnvVars();
    
    // Copy any other client files needed at runtime
    const clientFiles = [
      'robots.txt',
      'sitemap.xml',
      'manifest.json',
      'favicon.ico'
    ];
    
    for (const file of clientFiles) {
      const sourceFile = path.join(rootDir, file);
      const targetFile = path.join(distPublicDir, file);
      
      if (fs.existsSync(sourceFile)) {
        ensureDir(path.dirname(targetFile));
        fs.copyFileSync(sourceFile, targetFile);
        log(`Copied: ${sourceFile} -> ${targetFile}`, colors.green);
      } else {
        const altSourceFile = path.join(clientDir, 'public', file);
        if (fs.existsSync(altSourceFile)) {
          ensureDir(path.dirname(targetFile));
          fs.copyFileSync(altSourceFile, targetFile);
          log(`Copied: ${altSourceFile} -> ${targetFile}`, colors.green);
        }
      }
    }
    
    log('Client files copy process completed successfully!', colors.green);
    process.exit(0);
  } catch (error) {
    log(`Error copying client files: ${error.message}`, colors.red);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the main function
main();
