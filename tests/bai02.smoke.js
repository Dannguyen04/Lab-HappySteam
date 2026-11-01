// Chạy: node tests/bai02.smoke.js (cần Playwright, có thể đặt NODE_PATH) – giao diện Bài 2 Xe đua Động cơ.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

(async () => {
  const executablePath = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
    .filter(Boolean).find(p => fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 860 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    // js/bai02/art.js (hình vẽ cảnh) có thể chưa có – trang tự dùng hình đơn giản
    page.on('requestfailed', r => !/bai02\/art\.js$/.test(r.url()) && errors.push('Không tải được ' + r.url()));
    page.on('response', r => r.status() >= 400 && !/bai02\/art\.js$/.test(r.url()) && errors.push(r.status() + ' ' + r.url()));
    await page.goto(pageUrl('bai.html?id=lop1-bai02'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Bài 2/);
    assert.equal(await page.evaluate(() => window.robotViewer.stats().instances), 30);
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/4 nhiệm vụ');
    assert.equal(await page.locator('#book-img').getAttribute('src'), 'assets/bai02/step-01.png');
    await page.evaluate(() => window.robotViewer.setStep(14));
    assert.equal(await page.locator('#book-img').getAttribute('src'), 'assets/bai02/step-14.png');

    // NV1: đánh dấu lắp xong 14 bước
    const badgeHas = t => page.waitForFunction(x => document.getElementById('mission-summary-badge').textContent.includes(x), t, { timeout: 15000 });
    await page.evaluate(() => {
      for (let s = 1; s <= 14; s++) {
        window.robotViewer.setStep(s);
        if (!/bỏ/.test(document.getElementById('doneBtn').textContent)) document.getElementById('doneBtn').click();
      }
    });
    await badgeHas('1/4');

    // Xưởng sáng tạo: 4 gói Bài 2 (đèn pha chỉ trang trí, không đổi tốc độ)
    await page.click('#tab-btn-creative');
    for (const k of ['wing', 'bigwheel', 'nose', 'lights']) await page.click(`[data-preset="${k}"]`);
    assert.equal(await page.evaluate(() => window.robotViewer.stats().creative), 5, 'Bánh to gắn hai bánh nên 5 chi tiết');
    await page.click('[data-preset="bigwheel"]');
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');

    // NV2 + NV4: chương trình mẫu chạy tới cuối trong cảnh, xe dừng quanh đỉnh dốc
    page.once('dialog', d => d.accept());
    await page.click('#btn-load-sample');
    assert.equal(await page.locator('#ghost-score').textContent(), 'Đúng 4/4 khối');
    await page.click('#program-canvas-chain .zb-block-start');
    await page.waitForFunction(() => !window.simEngine.running && window.simEngine.pc >= 4, null, { timeout: 12000 });
    assert.ok(await page.evaluate(() => window.simEngine.x) > 50, 'Xe đã chạy trong cảnh');
    await badgeHas('3/4');
    await page.locator('#scene-wrap').screenshot({ path: path.join(__dirname, 'screenshots', 'bai02-scene.png') });

    // NV3: đổi Wait 3 → 5 giây, xe đỗ vào ô (xe có bánh to: 8 + nâng cấp nên tính lại bằng engine)
    await page.evaluate(() => window.simEngine.setUpgrades([]));
    await page.locator('#program-canvas-chain .zb-block').nth(2).click(); // Wait 3 → 4
    await page.locator('#program-canvas-chain .zb-block').nth(2).click(); // 4 → 5
    assert.match(await page.locator('#program-canvas-chain .zb-block').nth(2).innerText(), /5s/);
    await page.click('#btn-run-program');
    await badgeHas('Đạt 4/4');
    assert.match(await page.locator('#scene-toast-title').innerText(), /Giỏi quá/);
    assert.match(await page.locator('#verify-code-output').innerText(), /^ZM2-/);
    await page.click('#btn-close-victory');

    // Chế độ Bé giấu số đo ngay cả khi xe trôi dốc.
    await page.evaluate(() => window.ZMScene.onEvent('slide'));
    assert.doesNotMatch(await page.locator('#scene-toast-text').innerText(), /\d/, 'Thông báo chế độ Bé không lộ mức số');
    await page.click('#scene-toast-close');

    // Nâng cao: thêm NV5, đường mới
    await page.click('#btn-mode');
    await badgeHas('4/5');
    assert.ok(await page.locator('#chip-m5').isVisible());
    assert.equal(await page.evaluate(() => window.simEngine.advanced), true);
    assert.equal(await page.locator('#m-section').innerText(), 'Phẳng');
    await page.click('#btn-mode');

    // Xe 3D chạy theo chương trình
    await page.click('#scene-toggle');
    assert.equal(await page.evaluate(() => document.getElementById('app').parentElement.id), 'sim-stage');
    await page.click('#scene-toggle');

    // Điện thoại 375 px không tràn ngang
    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    await mobile.goto(pageUrl('bai.html?id=lop1-bai02'));
    await mobile.waitForFunction(() => window.robotViewer, null, { timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      const d = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(d[0] <= d[1], `375px bị tràn ngang ở ${tab}: ${d}`);
    }
    assert.deepEqual(errors, [], 'Không có lỗi JavaScript / tệp thiếu');
    console.log('PASS: Bài 2 - lắp 14 bước + hình sách, xưởng 4 gói, chương trình mẫu trong cảnh, đỗ xe vào ô, 4/4 nhiệm vụ, Nâng cao NV5, xe 3D, không tràn 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
