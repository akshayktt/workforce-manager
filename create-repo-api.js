#!/usr/bin/env node

/**
 * Create GitHub Repository using REST API
 * No external CLI tools needed - uses native Node.js
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function prompt(question) {
  return new Promise(resolve => {
    rl.question(question, resolve);
  });
}

async function createRepository() {
  console.log('\n🚀 GitHub Repository Creator (using REST API)\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Get GitHub token from user
  const token = await prompt(
    '🔑 Enter your GitHub Personal Access Token:\n   ' +
    '(Get it at: https://github.com/settings/tokens)\n   ' +
    'Token: '
  );

  if (!token) {
    console.log('\n❌ Token is required!');
    rl.close();
    return;
  }

  // Get username
  const username = await prompt('\n👤 Enter your GitHub username: ');
  
  if (!username) {
    console.log('\n❌ Username is required!');
    rl.close();
    return;
  }

  const repoName = 'workforce-manager';
  const description = 'Workforce Manager - Full-stack mobile & web app';

  console.log('\n📝 Creating repository...');
  console.log(`   Name: ${repoName}`);
  console.log(`   Owner: ${username}`);
  console.log(`   Description: ${description}\n`);

  // Create repository via GitHub API
  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: '/user/repos',
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'User-Agent': 'Node.js',
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }
  };

  const data = JSON.stringify({
    name: repoName,
    description: description,
    private: false,
    auto_init: false
  });

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);

          if (res.statusCode === 201) {
            console.log('✅ Repository created successfully!\n');
            console.log(`📍 Repository URL: ${parsed.html_url}`);
            console.log(`   Clone: ${parsed.clone_url}\n`);

            console.log('═══════════════════════════════════════════════════════\n');
            console.log('🚀 Next Step: Push your code!\n');
            console.log('Run this in PowerShell:\n');
            console.log(`cd "c:\\Users\\Megha\\OneDrive\\Desktop\\Workforce-manager\\Workforce-Manager"`);
            console.log('git push -u origin main\n');
            console.log('═══════════════════════════════════════════════════════\n');

            rl.close();
            resolve(true);
          } else if (res.statusCode === 422) {
            console.log('❌ Repository already exists or validation failed!');
            console.log(`   Error: ${parsed.message || 'Unknown error'}\n`);
            if (parsed.errors) {
              parsed.errors.forEach(err => {
                console.log(`   - ${err.message}`);
              });
            }
            rl.close();
            resolve(false);
          } else if (res.statusCode === 401) {
            console.log('❌ Authentication failed!');
            console.log('   Your token is invalid or expired.');
            console.log('   Get a new one at: https://github.com/settings/tokens\n');
            rl.close();
            resolve(false);
          } else {
            console.log(`❌ Error: HTTP ${res.statusCode}`);
            console.log(`   ${parsed.message || 'Unknown error'}\n`);
            rl.close();
            resolve(false);
          }
        } catch (error) {
          console.log('❌ Failed to parse response!');
          console.log(`   Error: ${error.message}\n`);
          rl.close();
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Network error!');
      console.log(`   ${error.message}\n`);
      rl.close();
      resolve(false);
    });

    req.write(data);
    req.end();
  });
}

// Run the script
createRepository().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
