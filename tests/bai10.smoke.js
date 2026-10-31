// Chạy: node tests/bai10.smoke.js (cần Playwright, có thể đặt NODE_PATH) – giao diện Bài 10 cối xoay gió.
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
    const page = await browser.newPage({ viewport: { width: 1366, height: 860 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // js/bai10/art.js (hình vẽ cảnh) có thể chưa có – trang tự dùng hình đơn giản
    page.on('requestfailed', r => !/bai10\/art\.js$/.test(r.url()) && errors.push('Không tải được ' + r.url()));
    await page.goto(`file:///${root}/lop1-bai10.html`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer, null, { timeout: 20000 });
    assert.match(await page.title(), /Bài 10/);
    assert.equal(await page.evaluate(() => window.robotViewer.stats().instances), 41);
    await page.evaluate(() => window.robotViewer.setStep(14));
    assert.equal(await page.locator('#book-img').getAttribute('src'), 'assets/bai10/step-14.jpg');

    const badgeHas = t => page.waitForFunction(x => document.getElementById('mission-summary-badge').textContent.includes(x), t, { timeout: 20000 });
    await page.evaluate(() => {
      for (let s = 1; s <= 15; s++) {
        window.robotViewer.setStep(s);
        if (!/bỏ/.test(document.getElementById('doneBtn').textContent)) document.getElementById('doneBtn').click();
      }
    });
    await badgeHas('1/4');

    // Xưởng: 4 gói (cánh dài, thêm cánh, đèn, đuôi)
    await page.click('#tab-btn-creative');
    for (const k of ['long', 'more', 'light', 'tail']) await page.click(`[data-preset="${k}"]`);
    assert.equal(await page.evaluate(() => window.robotViewer.stats().creative), 8, '3 cánh dài + 3 cánh thêm + đèn + đuôi');
    await page.click('#creative-deploy');

    // Khay có Medium Speed và Waiting for Pressed; chương trình mẫu 11 khối
    assert.ok(await page.locator('#block-toolbox button[title="Thêm khối Medium Speed"]').isVisible());
    assert.ok(await page.locator('#block-toolbox button[title="Thêm khối Waiting for Pressed"]').isVisible());
    page.once('dialog', d => d.accept());
    await page.click('#btn-load-sample');
    assert.equal(await page.locator('#ghost-score').textContent(), 'Đúng 11/11 khối');
    await page.click('#program-canvas-chain .zb-block-start');
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => window.simEngine.rpm()), 0, 'Chưa nhấn nút thì cánh quạt đứng yên');
    // nhấn nút đỏ 3 lần → quay nhanh, chờ đầy pin, nhấn lần 4 → dừng
    for (let i = 0; i < 3; i++) {
      await page.click('#scene-press');
      await page.waitForTimeout(150);
    }
    assert.equal(await page.evaluate(() => window.simEngine.rpm()), 150);
    await badgeHas('3/4'); // NV3 (pin đầy) + NV4 (gói sáng tạo đã chạy)
    await page.keyboard.press('Space'); // phím cách = nhấn nút
    await badgeHas('Đạt 4/4');
    assert.ok(await page.locator('#victory-modal').isVisible());
    assert.match(await page.locator('#verify-code-output').innerText(), /^ZM10-/);
    await page.click('#btn-close-victory');

    // Nâng cao: NV5 vượt bão, bảng thời tiết
    await page.click('#btn-mode');
    await badgeHas('4/5');
    assert.equal(await page.evaluate(() => window.simEngine.advanced), true);
    fs.mkdirSync(path.join(__dirname, 'screenshots'), { recursive: true });
    await page.click('#btn-run-program');
    for (let i = 0; i < 3; i++) await page.click('#scene-press');
    await page.waitForTimeout(1200);
    await page.locator('#scene-wrap').screenshot({ path: path.join(__dirname, 'screenshots', 'bai10-scene.png') });
    await page.click('#btn-stop-program');
    await page.click('#btn-mode');

    await page.click('#scene-toggle');
    assert.equal(await page.evaluate(() => document.getElementById('app').parentElement.id), 'sim-stage');
    await page.click('#scene-toggle');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    await mobile.goto(`file:///${root}/lop1-bai10.html`);
    await mobile.waitForFunction(() => window.robotViewer, null, { timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      const d = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(d[0] <= d[1], `375px bị tràn ngang ở ${tab}: ${d}`);
    }
    assert.deepEqual(errors, [], 'Không có lỗi JavaScript / tệp thiếu');
    console.log('PASS: Bài 10 – lắp 15 bước + hình sách, xưởng 4 gói, nút đỏ/phím cách đổi tốc độ, sạc đầy pin, 4/4 nhiệm vụ, Nâng cao thời tiết, cối 3D, không tràn 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
