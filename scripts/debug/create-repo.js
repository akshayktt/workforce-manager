#!/usr/bin/env node

/**
 * Simple GitHub Repo Creator - Uses default browser
 */

const { spawn } = require('child_process');
const os = require('os');

const REPO_NAME = 'workforce-manager';
const GITHUB_USERNAME = 'akshay';
const GITHUB_URL = `https://github.com/new`;

console.log('🚀 GitHub Repository Creator\n');
console.log('═══════════════════════════════════════════════════════\n');
console.log('📋 Repository Details:');
console.log(`   Name: ${REPO_NAME}`);
console.log(`   Owner: ${GITHUB_USERNAME}`);
console.log(`   URL: https://github.com/${GITHUB_USERNAME}/${REPO_NAME}\n`);

console.log('📖 INSTRUCTIONS:\n');
console.log('1. A browser window will open to GitHub');
console.log('2. Login if needed');
console.log('3. Fill in these details:');
console.log(`   - Repository name: ${REPO_NAME}`);
console.log('   - Description: Workforce Manager - Full-stack mobile & web app');
console.log('   - Visibility: Public');
console.log('4. UNCHECK: Initialize with README, .gitignore, license');
console.log('5. Click "Create repository"');
console.log('6. Wait for the page to show your new repository');
console.log('7. Come back here and press Enter\n');

console.log('🔗 Opening browser...\n');

// Open the GitHub new repo page in default browser
const isWindows = os.platform() === 'win32';
const isMac = os.platform() === 'darwin';
const isLinux = os.platform() === 'linux';

let command;
if (isWindows) {
  command = 'start';
} else if (isMac) {
  command = 'open';
} else if (isLinux) {
  command = 'xdg-open';
}

if (command) {
  spawn(command, [GITHUB_URL], { stdio: 'ignore' });
  console.log('✅ Browser opened! Creating repository...\n');
} else {
  console.log(`⚠️  Please visit: ${GITHUB_URL}\n`);
}

// Print next steps
console.log('\n═══════════════════════════════════════════════════════\n');
console.log('✅ After creating the repository on GitHub:\n');
console.log('1. Open PowerShell');
console.log('2. Run these commands:\n');
console.log('   cd "c:\\Users\\Megha\\OneDrive\\Desktop\\Workforce-manager\\Workforce-Manager"');
console.log('   git push -u origin main\n');
console.log('3. When prompted:');
console.log(`   Username: ${GITHUB_USERNAME}`);
console.log('   Password: Your GitHub personal access token\n');
console.log('📝 Get a personal access token at:');
console.log('   https://github.com/settings/tokens\n');
console.log('═══════════════════════════════════════════════════════\n');
console.log('🎉 Your code will be on GitHub!\n');

process.exit(0);
