// Playwright script to create GitHub repository and push code
// Usage: npx playwright install && node create-github-repo.mjs

import { chromium } from 'playwright';

async function createGitHubRepo() {
  const browser = await chromium.launch({ headless: false }); // Set to true for headless
  const context = await browser.createBrowserContext();
  const page = await context.newPage();

  try {
    console.log('🔄 Opening GitHub new repository page...');
    await page.goto('https://github.com/new', { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');

    console.log('✅ Page loaded');

    // Check if we need to login
    const loginButton = await page.$('a[href*="login"]');
    if (loginButton) {
      console.log('⚠️  You need to login to GitHub first');
      console.log('📖 Please login in the browser window that opened');
      
      // Wait for user to login (60 seconds)
      await page.waitForURL('**/new', { timeout: 60000 });
      console.log('✅ Login detected, proceeding...');
    }

    // Fill in repository name
    console.log('📝 Filling in repository details...');
    
    const repoNameInput = await page.$('input#repository_name');
    if (repoNameInput) {
      await repoNameInput.fill('workforce-manager');
      console.log('✅ Repository name: workforce-manager');
    }

    // Fill in description
    const descInput = await page.$('textarea#repository_description');
    if (descInput) {
      await descInput.fill('Workforce Manager - Full-stack mobile & web app');
      console.log('✅ Description added');
    }

    // Ensure Public is selected (usually default)
    const publicRadio = await page.$('input[type="radio"][value="public"]');
    if (publicRadio) {
      await publicRadio.click();
      console.log('✅ Visibility: Public');
    }

    // Make sure we don't initialize with README/gitignore (we have our own)
    const initReadme = await page.$('input[id*="repository_auto_init"]');
    if (initReadme) {
      const isChecked = await initReadme.isChecked();
      if (isChecked) {
        await initReadme.click();
        console.log('✅ Unchecked "Initialize with README"');
      }
    }

    // Click Create Repository button
    console.log('🚀 Creating repository...');
    const createButton = await page.$('button:has-text("Create repository")');
    if (createButton) {
      await createButton.click();
      console.log('⏳ Waiting for repository to be created...');
    }

    // Wait for the repository page to load
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('✅ Repository created successfully!');

    // Get the repository URL
    const urlElement = await page.$('[data-filterable-for="repo-clone-url"] input, .input-group input');
    if (urlElement) {
      const repoUrl = await urlElement.inputValue();
      console.log(`📍 Repository URL: ${repoUrl}`);
    }

    console.log('\n✅ SUCCESS! Repository created on GitHub');
    console.log('\n📝 Next steps:');
    console.log('1. Open PowerShell');
    console.log('2. Run: cd "c:\\Users\\Megha\\OneDrive\\Desktop\\Workforce-manager\\Workforce-Manager"');
    console.log('3. Run: git push -u origin main');
    console.log('4. Enter username: akshay');
    console.log('5. Enter password: Your GitHub personal access token');
    console.log('\n🎉 Your code will be on GitHub!');

    // Keep browser open for 10 seconds so user can see the repo
    console.log('\n⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📖 Manual steps:');
    console.log('1. Go to https://github.com/new');
    console.log('2. Repository name: workforce-manager');
    console.log('3. Description: Workforce Manager - Full-stack mobile & web app');
    console.log('4. Choose: Public');
    console.log('5. Click "Create repository"');
    console.log('6. Then run: git push -u origin main');
  } finally {
    await browser.close();
  }
}

// Run the script
createGitHubRepo().catch(console.error);
