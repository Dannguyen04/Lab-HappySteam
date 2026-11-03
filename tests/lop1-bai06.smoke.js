// node tests/run-suite.js smoke lop1-bai06 – giao diện trình duyệt thật.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

(async () => {
  const executablePath = [
    process.env.ZM_CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ].find(p => p && fs.existsSync(p));
  const browser = await chromium.launch({
    headless: true, ...(executablePath ? { executablePath } : {})
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 860 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => {
      if (r.status() >= 400 &&
          !(r.status() === 404 && new URL(r.url()).pathname === '/js/lop1-bai06/art.js'))
        errors.push(r.status() + ' ' + r.url());
    });
    await page.goto(pageUrl('bai.html?id=lop1-bai06'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Xe thông minh/);
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'kid');
    assert.equal(await page.evaluate(() => window.robotViewer.stats().instances), 33);
    assert.ok(await page.locator('#chip-m5').isHidden());
    await page.locator('#book-img').evaluate(el => el.decode());
    assert.ok(await page.locator('#book-img').evaluate(el => el.naturalWidth > 0));

    await page.click('#tab-btn-creative');
    assert.equal(await page.locator('[data-preset]').count(), 4);
    await page.click('[data-preset="beacon"]');
    assert.ok(await page.evaluate(() => window.robotViewer.stats().creative > 0),
      'Đèn ưu tiên phải gắn được lên CAD');
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');
    await page.waitForFunction(() => document.getElementById('space-scene').width > 100);
    await page.waitForTimeout(150);
    const pixels = await page.locator('#space-scene').evaluate(cv => {
      const data = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
      let filled = 0, varied = 0;
      for (let i = 0; i < data.length - 4; i += 144) {
        if (data[i + 3]) filled++;
        if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) varied++;
      }
      return { filled, varied };
    });
    assert.ok(pixels.filled > 100 && pixels.varied > 100, 'Cảnh canvas phải có hình thật: ' + JSON.stringify(pixels));

    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-load-sample');
    assert.match(await page.locator('#ghost-score').innerText(), /9\/9/);
    assert.ok(await page.locator('#program-canvas-chain .zb-traffic-kid').first().isVisible());
    assert.ok(await page.locator('#program-canvas-chain .zb-traffic-pro').first().isHidden(),
      'Bé không thấy tiếng Anh trong thẻ lệnh');
    await page.click('#btn-run-program');
    const sample = await page.evaluate(() => {
      const s = window.simEngine;
      s.pauseLoop();
      for (let i = 0; i < 500 && s.running; i++) s.advance(.05);
      return { m2: s.done.m2, m3: s.done.m3, m5: s.done.m5, running: s.running, upgraded: s.upgradeRun };
    });
    assert.deepEqual(sample, { m2: true, m3: true, m5: false, running: false, upgraded: true });
    assert.ok(await page.locator('#chip-m2').evaluate(el => el.classList.contains('is-done')));
    await page.click('#btn-mode');
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'pro');
    assert.ok(await page.locator('#chip-m5').isVisible());
    assert.ok(await page.locator('#m-traffic-green').isVisible());
    assert.ok(await page.locator('#program-canvas-chain .zb-traffic-pro').first().isVisible());
    assert.ok(await page.locator('#program-canvas-chain .zb-traffic-kid').first().isHidden());
    const advanced = await page.evaluate(() => {
      const s = window.simEngine, p = window.LESSON.blocks.sample.map(key => ({ ...window.BLOCK_TEMPLATES[key] }));
      s.cycleGreenDuration();
      s.setProgram(p); s.start(); s.pauseLoop();
      for (let i = 0; i < 500 && s.running; i++) s.advance(.05);
      return { green: s.greenDuration, m5: s.done.m5, failed: s.failed };
    });
    assert.deepEqual(advanced, { green: 4, m5: true, failed: false });
    assert.deepEqual(errors, [], 'Không có lỗi trang / HTTP');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    const mobileErrors = [];
    mobile.on('pageerror', e => mobileErrors.push(e.message));
    await mobile.goto(pageUrl('bai.html?id=lop1-bai06'));
    await mobile.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await mobile.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      const widths = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(widths[0] <= widths[1], 'Tràn ngang mobile ở ' + tab + ': ' + widths);
    }
    assert.deepEqual(mobileErrors, []);
    console.log('PASS: lop1-bai06 smoke – Chrome, CAD 33, 4 gói, canvas, thẻ Bé/Nâng cao, M2/M3/M5, mobile 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
