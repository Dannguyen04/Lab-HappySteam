// Chạy: node tests/run-suite.js smoke lop3-bai01 – trang thật, 3D, sách, địa chấn và mobile.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

(async () => {
  const executablePath = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(f => f && fs.existsSync(f));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 860 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('Console: ' + m.text()); });
    page.on('requestfailed', r => errors.push('Request: ' + r.url() + ': ' + r.failure()?.errorText));
    page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
    await page.goto(pageUrl('bai.html?id=lop3-bai01'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Bài 1/);
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'pro');
    assert.equal(await page.evaluate(() => window.robotViewer.stats().instances), 74);
    for (let step = 1; step <= 27; step++) {
      assert.equal(await page.locator('#countNow').innerText(), String(step));
      const img = page.locator('#book-img');
      const src = `assets/lop3-bai01/step-${String(step).padStart(2, '0')}.jpg`;
      assert.equal(await img.getAttribute('src'), src);
      await img.evaluate(el => el.decode());
      assert.ok(await img.evaluate(el => el.naturalWidth > 0 && el.naturalHeight > 0), 'Không giải mã được ảnh ' + step);
      await page.click('#doneBtn');
      await page.waitForFunction(n => parseInt(document.getElementById('am-done').textContent, 10) === n,
        step, { timeout: 5000 });
    }
    assert.ok(await page.locator('#chip-m1').evaluate(el => el.classList.contains('is-done')));

    await page.click('#tab-btn-creative');
    await page.click('[data-preset="brace"]');
    assert.ok(await page.evaluate(() => window.robotViewer.stats().creative > 0), 'Gói giằng phải hiển thị trên 3D');
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');
    assert.match(await page.locator('#sim-active-upgrade-badge').innerText(), /giằng/i);
    await page.waitForFunction(() => {
      const c = document.getElementById('space-scene');
      return c && c.width > 100 && c.height > 100;
    });
    await page.waitForTimeout(250);
    const pixels = await page.locator('#space-scene').evaluate(c => {
      const p = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let different = 0;
      for (let i = 4; i < p.length; i += 4 * 29) {
        if (p[i] !== p[0] || p[i + 1] !== p[1] || p[i + 2] !== p[2]) different++;
      }
      return different;
    });
    assert.ok(pixels > 100, 'Canvas địa chấn phải có hình, không được trống');

    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-load-sample');
    await page.click('#program-canvas-chain .zb-block-start');
    const simulated = await page.evaluate(() => {
      const s = window.simEngine;
      s.pauseLoop();
      for (let i = 0; i < 400 && s.running; i++) s.advance(.05);
      const before = { m2: s.done.m2, m3: s.done.m3, reason: s.reason };
      const make = () => window.LESSON.blocks.sample.map(item => {
        const [name, extra] = Array.isArray(item) ? item : [item, {}];
        return { ...window.BLOCK_TEMPLATES[name], ...extra };
      });
      const p = make();
      p[7].duration = 1;
      s.setAdvanced(false);
      s.setProgram(p);
      s.start();
      for (let i = 0; i < 400 && s.running; i++) s.advance(.05);
      s.checkMissions();
      return { before, after: { m3: s.done.m3, m4: s.upgradeRun, failed: s.failed } };
    });
    assert.deepEqual(simulated.before, { m2: true, m3: false, reason: 'overload' });
    assert.deepEqual(simulated.after, { m3: true, m4: true, failed: false });
    // art.js do nhánh thiết kế hình ảnh cung cấp riêng; loader thử tải tùy chọn và Canvas dự phòng hoạt động.
    assert.deepEqual(errors.filter(e => !e.includes('/js/lop3-bai01/art.js') && !e.includes('Failed to load resource: the server responded with a status of 404')),
      [], 'Trang không có lỗi JavaScript/HTTP/tài nguyên bắt buộc');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    const mobileErrors = [];
    mobile.on('pageerror', e => mobileErrors.push(e.message));
    await mobile.goto(pageUrl('bai.html?id=lop3-bai01'));
    await mobile.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await mobile.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      const widths = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(widths[0] <= widths[1], `Tràn ngang mobile ${tab}: ${widths}`);
    }
    assert.deepEqual(mobileErrors, []);
    console.log('PASS: lop3-bai01 – 27 JPEG, 74 chi tiết 3D, 4 gói, canvas, M2/M3/M4 và mobile 375px.');
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
