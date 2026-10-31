// Chạy: node tests/home.smoke.js (cần Playwright, có thể đặt NODE_PATH) – trang chọn bài index.html
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const executablePath = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
    .filter(Boolean).find(p => fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const root = path.resolve(__dirname, '..').split(path.sep).join('/');
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('requestfailed', r => errors.push('Không tải được ' + r.url()));
    await page.goto(`file:///${root}/index.html`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    assert.match(await page.title(), /Happy STEAM/);
    assert.equal(await page.locator('.lesson-card').count(), 18, 'Lớp 1 HK I: 18 tuần (13 bài mô hình, 4 tuần dự án, trưng bày)');
    assert.equal(await page.locator('.lesson-card.is-ready').count(), 3, 'Lớp 1 HK I: Bài 3, 9, 10 sẵn sàng');
    assert.equal(await page.locator('.lesson-card.is-soon').first().getAttribute('aria-disabled'), 'true');
    await page.click('#term-tabs [data-term="2"]');
    assert.equal(await page.locator('.lesson-card').count(), 17, 'Lớp 1 HK II: tuần 19–35');
    await page.click('#grade-tabs [data-grade="2"]');
    assert.match(await page.locator('#home-count').innerText(), /Lớp 2 · Học kì II/i);
    await page.reload();
    assert.equal(await page.locator('#grade-tabs [aria-selected="true"]').getAttribute('data-grade'), '2', 'Nhớ lớp đã chọn');
    await page.goto(`file:///${root}/index.html?lop=1&hk=1`);
    await page.click('.lesson-card.is-ready[href="lop1-bai09.html"]');
    await page.waitForFunction(() => window.robotViewer, null, { timeout: 20000 });
    assert.match(await page.title(), /Bài 9/);
    await page.click('.back-link');
    await page.waitForSelector('.lesson-card');
    assert.match(await page.title(), /Chọn bài|Happy STEAM/);
    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    await mobile.goto(`file:///${root}/index.html?lop=1&hk=1`);
    const d = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    assert.ok(d[0] <= d[1], 'Trang chọn bài không tràn ngang ở 375px: ' + d);
    assert.deepEqual(errors, [], 'Không có lỗi JavaScript / tệp thiếu');
    console.log('PASS: trang chọn bài Lớp → Học kì → Bài, Bài 9 mở được và quay lại được, nhớ lựa chọn, không tràn 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
