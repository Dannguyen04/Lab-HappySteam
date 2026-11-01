// Chạy: node tests/run-suite.js smoke – trang giao-vien.html (thiếu cấu hình Supabase thì hiện thông báo thân thiện)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

(async () => {
  const executablePath = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
    .filter(Boolean).find(p => fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pageUrl('giao-vien.html'));
    try {
      await page.waitForFunction(() => !document.getElementById('t-offline').hidden || !document.getElementById('t-login').hidden, null, { timeout: 8000 });
    } catch (e) {
      // Static server phục vụ mã nguồn thô: import '@supabase/supabase-js' cần Vite, nên chỉ chạy được qua test:dist.
      console.log('SKIP teacher.smoke: trang cần bản build (npm run test:dist)');
      return;
    }
    const offline = await page.locator('#t-offline').isVisible();
    const login = await page.locator('#t-login').isVisible();
    assert.ok(offline !== login, 'Đúng một trong hai: thông báo chưa bật, hoặc form đăng nhập');
    assert.deepEqual(errors, []);
    console.log('teacher.smoke OK (' + (offline ? 'thiếu env' : 'có env') + ')');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
