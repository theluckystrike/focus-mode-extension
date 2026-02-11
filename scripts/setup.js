const { execSync } = require('child_process');
const path = require('path');

console.log('Setting up Focus Mode Pro...');

// Install dependencies
console.log('Installing dependencies...');
execSync('npm install', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

// Generate icons
console.log('Generating icons...');
execSync('node scripts/generate-icons.js', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });

console.log('Setup complete! Run "npm run build" to build the extension.');
