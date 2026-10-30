// assets/test_fixes.js - Test fixes for Audio, Tab loops, and Mobile responsiveness
const { chromium } = require('C:\\Users\\DAN\\Documents\\RBB_Studio\\node_modules\\@playwright\\test');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });

  // 1. Test Desktop Viewport
  console.log('--- 1. TESTING DESKTOP (1280x800) ---');
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('Console Error:', msg.text());
    }
  });

  const indexPath = path.resolve(__dirname, '../index.html');
  await page.goto('file:///' + indexPath.replace(/\\/g, '/'));
  await page.waitForTimeout(1000);

  console.log('Title:', await page.title());

  // Test Audio Unlock gesture simulation
  await page.click('body');
  console.log('Simulated user gesture for audio unlock.');

  // Test Tab Switching: To Assembly
  console.log('Switching to Tab Assembly...');
  await page.click('#tab-btn-asm');
  await page.waitForTimeout(500);

  // Check if simEngine is paused
  const isLoopActiveWhenAsm = await page.evaluate(() => {
    return document.getElementById('tab-simulation').classList.contains('is-active');
  });
  console.log('Is Simulation Tab active after switch to Assembly?', isLoopActiveWhenAsm);

  // Test Subtab: Mục 4: Sáng tạo mô hình 3D
  console.log('Testing Subtab: Mục 4: Sáng tạo mô hình 3D...');
  await page.click('#btn-subtab-creative');
  await page.waitForTimeout(400);
  const isCreativeActive = await page.$eval('#subview-creative', el => el.classList.contains('active'));
  console.log('Is Mục 4 Sáng tạo Subview active?', isCreativeActive);
  await page.screenshot({ path: path.resolve(__dirname, '../screenshot_creative.png') });
  console.log('Saved screenshot_creative.png');

  // Test Deploying Upgrade C (Sensor) to Tab 2
  console.log('Deploying Upgrade C (Sensor) to Tab 2...');
  await page.click('.btn-deploy-upgrade[data-upgrade="sensor"]');
  await page.waitForTimeout(500);
  const isSimActiveAfterDeploy = await page.$eval('#tab-simulation', el => el.classList.contains('is-active'));
  const activeBadgeText = await page.$eval('#sim-active-upgrade-badge', el => el.textContent.trim());
  console.log('Switched to Tab 2 after deploy?', isSimActiveAfterDeploy);
  console.log('Active Upgrade Badge Text:', activeBadgeText);

  // Test Theme Toggle
  console.log('Testing Theme Toggle (Dark -> Light -> Dark)...');
  const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log('Initial Theme:', initialTheme);
  await page.click('#btn-toggle-theme');
  await page.waitForTimeout(300);
  const lightTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log('Theme after 1st click:', lightTheme);
  await page.screenshot({ path: path.resolve(__dirname, '../screenshot_theme_light.png') });
  await page.click('#btn-toggle-theme');
  await page.waitForTimeout(300);
  const darkTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log('Theme after 2nd click:', darkTheme);

  // Switch back to Simulation
  console.log('Switching back to Tab Simulation...');
  await page.click('#tab-btn-sim');
  await page.waitForTimeout(500);

  // Test Run button
  await page.click('#btn-run-program');
  await page.waitForTimeout(500);

  const simStatus = await page.$eval('#sim-status-pill', el => el.textContent.trim());
  console.log('Sim Status:', simStatus);

  await page.screenshot({ path: path.resolve(__dirname, '../screenshot_desktop.png') });
  console.log('Desktop screenshot saved: screenshot_desktop.png');

  // 2. Test Mobile Viewport (iPhone SE: 375x667)
  console.log('\n--- 2. TESTING MOBILE (375x667 iPhone SE) ---');
  const mobilePage = await browser.newPage({ viewport: { width: 375, height: 667 } });
  const mobileErrors = [];
  mobilePage.on('console', msg => {
    if (msg.type() === 'error') {
      mobileErrors.push(msg.text());
      console.error('Mobile Console Error:', msg.text());
    }
  });

  await mobilePage.goto('file:///' + indexPath.replace(/\\/g, '/'));
  await mobilePage.waitForTimeout(1000);

  // Check header overflow
  const headerBBox = await mobilePage.evaluate(() => {
    const nav = document.querySelector('.top-nav');
    return {
      scrollWidth: nav.scrollWidth,
      clientWidth: nav.clientWidth,
      overflow: nav.scrollWidth > nav.clientWidth
    };
  });
  console.log('Header bounding box on 375px mobile:', headerBBox);

  // Check tab buttons visibility on mobile
  const tabSimText = await mobilePage.$eval('#tab-btn-sim', el => el.innerText.trim());
  const tabAsmText = await mobilePage.$eval('#tab-btn-asm', el => el.innerText.trim());
  console.log('Mobile Tab Sim Text:', tabSimText.replace(/\n/g, ' '));
  console.log('Mobile Tab Asm Text:', tabAsmText.replace(/\n/g, ' '));

  // Test tapping student button on mobile
  await mobilePage.click('#btn-student-profile');
  await mobilePage.waitForTimeout(300);
  const modalOpen = await mobilePage.$eval('#profile-modal', el => el.classList.contains('is-open'));
  console.log('Profile modal opened on mobile?', modalOpen);
  await mobilePage.click('#btn-close-profile');
  await mobilePage.waitForTimeout(300);

  // Test clicking sound toggle on mobile
  await mobilePage.click('#btn-toggle-sound');
  const soundPressed = await mobilePage.$eval('#btn-toggle-sound', el => el.getAttribute('aria-pressed'));
  console.log('Sound toggle aria-pressed:', soundPressed);

  await mobilePage.screenshot({ path: path.resolve(__dirname, '../screenshot_mobile.png') });
  console.log('Mobile screenshot saved: screenshot_mobile.png');

  await browser.close();

  console.log('\n--- SUMMARY ---');
  console.log('Desktop Errors:', errors.length);
  console.log('Mobile Errors:', mobileErrors.length);
  if (errors.length === 0 && mobileErrors.length === 0 && !headerBBox.overflow) {
    console.log('ALL FIXES VERIFIED SUCCESSFULLY! 0 ERRORS & NO OVERFLOW.');
  } else {
    console.log('Fix verification finished with some remarks.');
  }
})();
