const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Helper function to resolve paths relative to the project root
const rootPath = (...paths) => path.join(process.cwd(), ...paths);

// Enable colors for better log visibility
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

const log = (message, color = '') => {
  console.log(`${color}${message}${colors.reset}`);
};

log('🚀 Starting Vercel build...', colors.bright + colors.blue);

// Create necessary directories
const createDirs = () => {
  log('📂 Creating directories...', colors.blue);
  const dirs = [
    rootPath('dist'),
    rootPath('dist/public'),
    rootPath('dist/lib'),
    rootPath('client/dist')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`  ✓ Created directory: ${dir}`, colors.green);
    } else {
      log(`  ✓ Directory exists: ${dir}`, colors.yellow);
    }
  });
};

// Run a command with error handling
const runCommand = (command, description, cwd = process.cwd(), env = {}) => {
  log(`\n${description}...`, colors.blue);
  log(`  $ ${command}`, colors.yellow);
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd,
      env: { 
        ...process.env, 
        NODE_ENV: process.env.NODE_ENV || 'production',
        ...env 
      }
    });
    log(`  ✓ ${description} completed successfully`, colors.green);
    return true;
  } catch (error) {
    log(`  ✗ ${description} failed`, colors.red);
    log(`  Error: ${error.message}`, colors.red);
    if (error.stderr) {
      log(`  Stderr: ${error.stderr.toString()}`, colors.red);
    }
    if (error.stdout) {
      log(`  Stdout: ${error.stdout.toString()}`, colors.red);
    }
    throw error;
  }
};

// Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Run build commands
const runBuild = async () => {
  const isDev = process.env.NODE_ENV === 'development';
  
  try {
    // Install root dependencies
    log(`\n📦 Installing ${isDev ? 'development' : 'production'} dependencies...`, colors.blue);
    await runCommand('npm install', 'Installing root dependencies');

    if (!isDev) {
      // In production, build both server and client
      log('\n🚀 Building for production...', colors.blue);
      
      // Build server first
      log('\n🔨 Building server...', colors.blue);
      await runCommand('npm run build:server', 'Building server');

      // Verify server build
      const serverBuildPath = rootPath('dist', 'index.js');
      if (!fs.existsSync(serverBuildPath)) {
        throw new Error('Server build failed - index.js not found in dist/');
      }
      log('✅ Server build completed successfully', colors.green);

      // Build client
      log('\n🎨 Building client...', colors.blue);
      await runCommand('npm run build:client', 'Building client', rootPath('client'));

      // Verify client build
      const clientBuildPath = rootPath('client', 'dist', 'index.html');
      if (!fs.existsSync(clientBuildPath)) {
        throw new Error('Client build failed - index.html not found in client/dist');
      }
      log('✅ Client build completed successfully', colors.green);
    } else {
      // In development, just install client dependencies
      log('\n🚀 Setting up development environment...', colors.blue);
      await runCommand('npm install', 'Installing client dependencies', rootPath('client'));
      log('✅ Development environment ready', colors.green);
      log('\nRun the following commands to start development:', colors.blue);
      log('1. For server: npm run dev', colors.yellow);
      log('2. For client: cd client && npm run dev', colors.yellow);
    }
  } catch (error) {
    log(`\n❌ ${isDev ? 'Development setup' : 'Build'} failed: ${error.message}`, colors.red);
    if (error.stderr) console.error(error.stderr.toString());
    if (error.stdout) console.error(error.stdout.toString());
    throw error;
  }
};

// Run the build process
(async () => {
  try {
    log('\n🔄 Starting build process...', colors.bright + colors.blue);
    createDirs();
    await runBuild();
    
    log('\n🎉 Build completed successfully!', colors.bright + colors.green);
    log('   You can now deploy to Vercel using: vercel --prod', colors.bright);
    
    process.exit(0);
  } catch (error) {
    log('\n❌ Build failed!', colors.bright + colors.red);
    log(`   Error: ${error.message}`, colors.red);
    
    if (error.stderr) {
      log('\nError details:', colors.red);
      console.error(error.stderr.toString());
    } else if (error.stdout) {
      log('\nOutput:', colors.red);
      console.error(error.stdout.toString());
    }
    
    process.exit(1);
  }
})();
