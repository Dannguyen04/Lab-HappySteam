// Smoke giao diện Lớp 3 Bài 12 – chạy bằng npm run test:smoke (BASE_URL do run-suite cấp).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

(async () => {
  const executablePath = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => p && fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 860 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(`Console: ${m.text()}`); });
    page.on('requestfailed', r => errors.push(`Request: ${r.url()} (${r.failure()?.errorText})`));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(pageUrl('bai.html?id=lop3-bai12'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Bài 12/);
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'pro');
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/5 nhiệm vụ');
    assert.equal(await page.evaluate(() => window.robotViewer.stats().instances), 70, 'Mô hình 70 linh kiện CAD');

    for (let step = 1; step <= 31; step++) {
      assert.equal(await page.locator('#countNow').innerText(), String(step));
      const img = page.locator('#book-img');
      assert.equal(await img.getAttribute('src'), `assets/lop3-bai12/step-${String(step).padStart(2, '0')}.jpg`);
      await img.evaluate(el => el.decode());
      assert.ok(await img.evaluate(el => el.naturalWidth > 0 && el.naturalHeight > 0), `JPEG bước ${step} phải tải được`);
      assert.equal(await page.locator('#book-pdf').getAttribute('href'), `assets/lop3-bai12/step-${String(step).padStart(2, '0')}.jpg`);
      await page.click('#doneBtn');
      await page.waitForFunction(n => parseInt(document.getElementById('am-done').textContent, 10) === n, step, { timeout: 5000 });
    }
    assert.match(await page.locator('#am-done').innerText(), /31\s*\/\s*31/);
    assert.ok(await page.locator('#chip-m1').evaluate(el => el.classList.contains('is-done')));

    await page.click('#tab-btn-creative');
    assert.ok(await page.locator('#creative-stage').isVisible());
    await page.click('#tab-btn-sim');
    assert.ok(await page.locator('#space-scene').isVisible());
    await page.waitForFunction(() => {
      const c = document.getElementById('space-scene');
      return c && c.width > 100 && c.height > 100;
    }, null, { timeout: 10000 });
    await page.waitForTimeout(250);
    const pixels = await page.locator('#space-scene').evaluate(c => {
      const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let nonTransparent = 0, different = 0;
      for (let i = 0; i < data.length; i += 4 * 29) {
        if (data[i + 3] > 0) nonTransparent++;
        if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) different++;
      }
      return { nonTransparent, different };
    });
    assert.ok(pixels.nonTransparent > 100 && pixels.different > 100, `Nhà kính canvas trống: ${JSON.stringify(pixels)}`);

    await page.click('#btn-mode');
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'kid');
    assert.ok(await page.locator('#chip-m5').isHidden());
    page.once('dialog', d => d.accept());
    await page.click('#btn-load-sample');
    assert.match(await page.locator('#ghost-score').innerText(), /^đúng 13\/13 khối$/i);
    await page.click('#program-canvas-chain .zb-block-start');
    assert.equal(await page.evaluate(() => window.simEngine.running), true);
    const result = await page.evaluate(() => {
      const s = window.simEngine;
      s.pauseLoop();
      for (let i = 0; i < 400 && s.running; i++) s.advance(0.05);
      s.updateUI();
      return { m2: s.done.m2, got: s.got() };
    });
    assert.equal(result.m2, true, 'Mẫu 13 khối đạt NV2');
    await page.click('#btn-mode');
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'pro');
    assert.ok(await page.locator('#chip-m5').isVisible());
    assert.equal(await page.evaluate(() => window.simEngine.advanced), true);
    assert.deepEqual(errors, [], 'Không có JS exception, request lỗi hoặc HTTP 4xx/5xx');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    const mobileErrors = [];
    mobile.on('pageerror', e => mobileErrors.push(e.message));
    mobile.on('console', m => { if (m.type() === 'error') mobileErrors.push(`Console: ${m.text()}`); });
    await mobile.goto(pageUrl('bai.html?id=lop3-bai12'));
    await mobile.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await mobile.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      await mobile.waitForTimeout(180);
      const widths = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(widths[0] <= widths[1], `Tràn ngang 375px tại ${tab}: ${widths}`);
    }
    assert.deepEqual(mobileErrors, []);
    console.log('PASS: lop3-bai12 – 31 bước/JPEG, 3D 70 chi tiết, mẫu 13 khối đạt NV2, hai chế độ, canvas nhà kính, mobile 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
