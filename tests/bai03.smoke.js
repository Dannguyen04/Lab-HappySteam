// Chạy: node tests/bai03.smoke.js (cần Playwright, có thể đặt NODE_PATH) – giao diện Bài 3 Robot thám hiểm Milo.
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
    // js/bai03/art.js (hình vẽ cảnh) có thể chưa có – trang tự dùng hình đơn giản
    page.on('requestfailed', r => !/bai03\/art\.js$/.test(r.url()) && errors.push('Không tải được ' + r.url()));
    await page.goto(`file:///${root}/lop1-bai03.html`);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer, null, { timeout: 20000 });
    assert.match(await page.title(), /Bài 3/);
    assert.equal(await page.evaluate(() => window.robotViewer.stats().instances), 40);
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/4 nhiệm vụ');
    assert.equal(await page.locator('#book-img').getAttribute('src'), 'assets/bai03/step-01.jpg');
    await page.evaluate(() => window.robotViewer.setStep(17));
    assert.equal(await page.locator('#book-img').getAttribute('src'), 'assets/bai03/step-17.jpg');
    assert.match(await page.locator('#am-step-s').innerText(), /đầu robot 3\/6/i);

    // NV1: đánh dấu lắp xong 22 bước
    const badgeHas = t => page.waitForFunction(x => document.getElementById('mission-summary-badge').textContent.includes(x), t, { timeout: 15000 });
    await page.evaluate(() => {
      for (let s = 1; s <= 22; s++) {
        window.robotViewer.setStep(s);
        if (!/bỏ/.test(document.getElementById('doneBtn').textContent)) document.getElementById('doneBtn').click();
      }
    });
    await badgeHas('1/4');

    // Xưởng sáng tạo: 4 gói Bài 3
    await page.click('#tab-btn-creative');
    for (const k of ['bin', 'antenna', 'solar', 'arm']) await page.click(`[data-preset="${k}"]`);
    assert.equal(await page.evaluate(() => window.robotViewer.stats().creative), 4);
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');

    // NV2 + NV4: chương trình mẫu, robot chờ tay rồi chạy (quá B, có thùng nên mẫu không rơi)
    page.once('dialog', d => d.accept());
    await page.click('#btn-load-sample');
    assert.equal(await page.locator('#ghost-score').textContent(), 'Đúng 5/5 khối');
    await page.click('#program-canvas-chain .zb-block-start');
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => window.simEngine.x), 0, 'Chưa đưa tay thì robot đứng yên');
    await page.click('#scene-hand');
    await page.waitForFunction(() => !window.simEngine.running, null, { timeout: 8000 });
    assert.match(await page.locator('#scene-toast-title').innerText(), /Quá điểm B/);
    await badgeHas('3/4');

    // NV3: Wait 2 giây ở mức 8 (có thùng chở) ≈ 79 cm → tới B
    await page.locator('#program-canvas-chain .zb-block').nth(3).click(); // Wait 3 → 4
    for (let i = 0; i < 3; i++) await page.locator('#program-canvas-chain .zb-block').nth(3).click(); // 4 → 5 → 1 → 2
    assert.match(await page.locator('#program-canvas-chain .zb-block').nth(3).innerText(), /2s/);
    await page.click('#btn-run-program');
    await page.waitForTimeout(300);
    await page.click('#scene-hand');
    await badgeHas('Đạt 4/4');
    assert.match(await page.locator('#scene-toast-title').innerText(), /Giỏi quá/);
    assert.ok(await page.locator('#victory-modal').isVisible());
    assert.match(await page.locator('#verify-code-output').innerText(), /^ZM3-/);
    await page.click('#btn-close-victory');

    // Nâng cao: thêm NV5, thước đo và bảng tốc độ
    await page.click('#btn-mode');
    await badgeHas('4/5');
    assert.ok(await page.locator('#chip-m5').isVisible());
    assert.equal(await page.evaluate(() => window.simEngine.advanced), true);
    await page.locator('#scene-wrap').screenshot({ path: path.join(__dirname, 'screenshots', 'bai03-scene.png') });
    await page.click('#btn-mode');

    // Robot 3D chạy theo chương trình
    await page.click('#scene-toggle');
    assert.equal(await page.evaluate(() => document.getElementById('app').parentElement.id), 'sim-stage');
    await page.click('#scene-toggle');

    // Điện thoại 375 px không tràn ngang
    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    await mobile.goto(`file:///${root}/lop1-bai03.html`);
    await mobile.waitForFunction(() => window.robotViewer, null, { timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      const d = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(d[0] <= d[1], `375px bị tràn ngang ở ${tab}: ${d}`);
    }
    assert.deepEqual(errors, [], 'Không có lỗi JavaScript / tệp thiếu');
    console.log('PASS: Bài 3 – lắp 22 bước + hình sách, xưởng 4 gói, chờ tay rồi chạy, chở mẫu tới B, 4/4 nhiệm vụ, Nâng cao NV5, robot 3D, không tràn 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
