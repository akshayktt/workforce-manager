#!/usr/bin/env node

/**
 * GitHub Repository Creator
 * This script automates the creation of a GitHub repository
 * 
 * Requirements: Playwright needs to be installed
 * npm install playwright
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_NAME = 'workforce-manager';
const GITHUB_USERNAME = 'akshay';
const REPO_URL = `https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git`;

async function runPlaywright() {
  console.log('🚀 Starting GitHub Repository Creation...\n');
  console.log('📋 Repository Details:');
  console.log(`   Name: ${REPO_NAME}`);
  console.log(`   Owner: ${GITHUB_USERNAME}`);
  console.log(`   URL: ${REPO_URL}\n`);

  console.log('🔗 Opening browser to GitHub...');
  console.log('💡 Tip: You will see a browser window. Please:');
  console.log('   1. Login if prompted');
  console.log('   2. Fill the form and click "Create repository"');
  console.log('   3. Wait for the automation to complete\n');

  try {
    // Try to run the Playwright script
    const scriptPath = path.join(__dirname, 'create-github-repo.mjs');
    
    if (fs.existsSync(scriptPath)) {
      console.log('⏳ Running automation script...\n');
      execSync(`node "${scriptPath}"`, { stdio: 'inherit', cwd: __dirname });
    } else {
      console.log('❌ Script not found. Please create it first.\n');
      printManualSteps();
      return;
    }

    console.log('\n✅ Repository creation completed!');
    console.log('\n🎯 Next: Push your code to GitHub');
    printPushSteps();

  } catch (error) {
    console.error('\n❌ Error during automation:', error.message);
    console.log('\n📖 Falling back to manual steps...\n');
    printManualSteps();
  }
}

function printManualSteps() {
  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('📖 MANUAL STEPS TO CREATE REPOSITORY\n');
  console.log('1️⃣  Go to: https://github.com/new');
  console.log('2️⃣  Fill in:');
  console.log(`   Repository name: ${REPO_NAME}`);
  console.log('   Description: Workforce Manager - Full-stack mobile & web app');
  console.log('   Visibility: Public');
  console.log('3️⃣  Leave these UNCHECKED:');
  console.log('   ☐ Initialize with README');
  console.log('   ☐ Add .gitignore');
  console.log('   ☐ Add license');
  console.log('4️⃣  Click "Create repository"');
  console.log('\n═══════════════════════════════════════════════════════\n');
}

function printPushSteps() {
  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('🚀 PUSH YOUR CODE TO GITHUB\n');
  console.log('Run these commands in PowerShell:\n');
  console.log('cd "c:\\Users\\Megha\\OneDrive\\Desktop\\Workforce-manager\\Workforce-Manager"');
  console.log('git push -u origin main\n');
  console.log('When prompted:');
  console.log(`   Username: ${GITHUB_USERNAME}`);
  console.log('   Password: Your GitHub personal access token\n');
  console.log('📝 Get a personal access token:');
  console.log('   1. Go to: https://github.com/settings/tokens');
  console.log('   2. Click "Generate new token (classic)"');
  console.log('   3. Select scope: repo');
  console.log('   4. Copy the token and paste it as password\n');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('✅ Done! Your code will be on GitHub! 🎉\n');
}

// Run the automation
runPlaywright().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
