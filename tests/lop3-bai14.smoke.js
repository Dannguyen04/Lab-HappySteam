// Smoke tích hợp Bài 14: 3D/ảnh sách, xưởng, sân khấu, chương trình mẫu và mobile.
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
    await page.goto(pageUrl('bai.html?id=lop3-bai14'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Bài 14/);
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'pro');
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/5 nhiệm vụ');
    assert.equal(await page.evaluate(() => window.robotViewer.stats().instances), 73);

    for (let step = 1; step <= 23; step++) {
      assert.equal(await page.locator('#countNow').innerText(), String(step));
      const img = page.locator('#book-img');
      const src = `assets/lop3-bai14/step-${String(step).padStart(2, '0')}.jpg`;
      assert.equal(await img.getAttribute('src'), src);
      await img.evaluate(el => el.decode());
      assert.ok(await img.evaluate(el => el.naturalWidth > 0 && el.naturalHeight > 0), `Ảnh bước ${step} phải giải mã được`);
      assert.equal(await page.locator('#book-pdf').getAttribute('href'), src);
      await page.click('#doneBtn');
      await page.waitForFunction(n => parseInt(document.getElementById('am-done').textContent, 10) === n,
        step, { timeout: 5000 });
    }
    assert.match(await page.locator('#am-done').innerText(), /23\s*\/\s*23/);
    assert.ok(await page.locator('#chip-m1').evaluate(el => el.classList.contains('is-done')));

    await page.click('#tab-btn-creative');
    assert.ok(await page.locator('#creative-stage').isVisible());
    await page.click('[data-preset="stageLights"]');
    assert.ok((await page.evaluate(() => window.robotViewer.stats().creative)) > 0, 'Đèn nâng cấp phải xuất hiện trên 3D');
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');
    assert.match(await page.locator('#sim-active-upgrade-badge').innerText(), /đèn sân khấu/i);
    await page.waitForFunction(() => {
      const c = document.getElementById('space-scene');
      return c && c.width > 100 && c.height > 100;
    });
    await page.waitForTimeout(250);
    const pixels = await page.locator('#space-scene').evaluate(c => {
      const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let visible = 0, varied = 0;
      for (let i = 0; i < data.length; i += 4 * 29) {
        if (data[i + 3] > 0) visible++;
        if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) varied++;
      }
      return { visible, varied };
    });
    assert.ok(pixels.visible > 100 && pixels.varied > 100, `Sân khấu canvas bị trống: ${JSON.stringify(pixels)}`);

    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-load-sample');
    assert.match(await page.locator('#ghost-score').innerText(), /^đúng 7\/7 khối$/i);
    await page.click('#program-canvas-chain .zb-block-start');
    const result = await page.evaluate(() => {
      const s = window.simEngine;
      s.pauseLoop();
      for (let i = 0; i < 400 && s.running; i++) s.advance(0.05);
      s.updateUI();
      return { m2: s.done.m2, failed: s.failed, notes: s.notes.join('') };
    });
    assert.deepEqual(result, { m2: true, failed: false, notes: 'AB' });
    await page.waitForFunction(() => document.getElementById('chip-m2').classList.contains('is-done'));
    assert.ok(await page.locator('#chip-m4').evaluate(el => el.classList.contains('is-done')));

    const swapped = await page.evaluate(() => {
      const s = window.simEngine;
      const p = window.LESSON.blocks.sample.map(key => ({ ...window.BLOCK_TEMPLATES[key] }));
      [p[3], p[5]] = [p[5], p[3]];
      const holds = [];
      for (let round = 0; round < 3; round++) {
        s.setProgram(p);
        s.start();
        for (let i = 0; i < 400 && s.running; i++) s.advance(0.05);
        holds.push(s.holdTime);
      }
      s.checkMissions();
      return { m3: s.done.m3, m5: s.done.m5, holds };
    });
    assert.equal(swapped.m3, true);
    assert.equal(swapped.m5, true);
    assert.deepEqual(swapped.holds, [1.8, 2.6, 3.4]);
    assert.deepEqual(errors, [], 'Không có lỗi JS, HTTP hay tải tài nguyên');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    const mobileErrors = [];
    mobile.on('pageerror', e => mobileErrors.push(e.message));
    await mobile.goto(pageUrl('bai.html?id=lop3-bai14'));
    await mobile.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await mobile.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      const widths = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(widths[0] <= widths[1], `Tràn ngang mobile tại ${tab}: ${widths}`);
    }
    assert.deepEqual(mobileErrors, []);
    console.log('PASS: lop3-bai14 – 23 JPEG, 73 linh kiện 3D, gói sáng tạo, sân khấu, NV2/3/5 và mobile 375px.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
