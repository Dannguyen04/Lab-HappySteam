// node tests/run-suite.js smoke lop3-bai03 — kiểm trang thật, 3D, 24 ảnh, tương tác, mobile.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

(async () => {
  const executablePath = [process.env.ZM_CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
    .find(p => p && fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 860 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push('JS: ' + e.message));
    page.on('requestfailed', r => errors.push(`Request: ${r.url()} (${r.failure()?.errorText})`));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(pageUrl('bai.html?id=lop3-bai03'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Bài 3/);
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'pro');
    assert.equal(await page.evaluate(() => window.robotViewer.stats().instances), 75);

    for (let step = 1; step <= 24; step++) {
      assert.equal(await page.locator('#countNow').innerText(), String(step));
      const img = page.locator('#book-img');
      const src = `assets/lop3-bai03/step-${String(step).padStart(2, '0')}.jpg`;
      assert.equal(await img.getAttribute('src'), src);
      await img.evaluate(el => el.decode());
      assert.ok(await img.evaluate(el => el.naturalWidth > 0), `Ảnh ${step} không giải mã được`);
      await page.click('#doneBtn');
      await page.waitForFunction(n => parseInt(document.getElementById('am-done').textContent, 10) === n,
        step, { timeout: 5000 });
    }
    assert.ok(await page.locator('#chip-m1').evaluate(el => el.classList.contains('is-done')));

    await page.click('#tab-btn-creative');
    await page.click('[data-preset="basket"]');
    assert.ok(await page.evaluate(() => window.robotViewer.stats().creative > 0), 'Gói 3D phải hiện trên mô hình');
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');
    assert.match(await page.locator('#sim-active-upgrade-badge').innerText(), /Giỏ bóng mềm/i);
    await page.locator('#lever-release').waitFor({ state: 'visible', timeout: 10000 });
    assert.equal(await page.locator('#lever-controls [data-level]').count(), 3);
    await page.waitForFunction(() => document.getElementById('space-scene')?.width > 100);
    await page.waitForTimeout(200);
    const varied = await page.locator('#space-scene').evaluate(c => {
      const p = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0;
      for (let i = 4; i < p.length; i += 4 * 31)
        if (p[i] !== p[0] || p[i + 1] !== p[1] || p[i + 2] !== p[2]) n++;
      return n;
    });
    assert.ok(varied > 100, `Canvas hội khoa học trống (${varied})`);

    await page.click('#lever-release');
    const outcome = await page.evaluate(() => {
      const sim = window.simEngine;
      sim.pauseLoop();
      const finish = () => { for (let n = 0; n < 100 && sim.running; n++) sim.advance(.02); };
      finish();
      const m2 = { done: sim.done.m2, m3: sim.done.m3, m4: sim.upgradeRun, outcome: sim.lastOutcome };
      sim.setAdvanced(false);
      sim.setLevel(3); sim.start(); finish();
      const high = { m3: sim.done.m3, outcome: sim.lastOutcome };
      sim.setLevel(2); sim.start(); finish();
      const center = { m3: sim.done.m3, outcome: sim.lastOutcome };
      sim.setAdvanced(true);
      for (const level of [1, 3, 2]) { sim.setLevel(level); sim.start(); finish(); }
      return { m2, high, center, pro: sim.done.m5, progress: sim.progress };
    });
    assert.deepEqual(outcome.m2, { done: true, m3: false, m4: true, outcome: 'hit' });
    assert.equal(outcome.high.outcome, 'long');
    assert.equal(outcome.high.m3, false);
    assert.equal(outcome.center.outcome, 'hit');
    assert.equal(outcome.center.m3, true);
    assert.equal(outcome.pro, true);
    assert.equal(outcome.progress, 3);
    await page.waitForFunction(() => document.getElementById('mc-text')?.textContent.includes('mô hình đòn bẩy'));
    assert.doesNotMatch(await page.locator('#mc-text').innerText(), /vệ tinh/);
    if (process.env.ZM_SMOKE_SHOT) await page.screenshot({ path: process.env.ZM_SMOKE_SHOT, fullPage: true });
    assert.deepEqual(errors, [], 'Lỗi JS hoặc tài nguyên desktop');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    const mobileErrors = [];
    mobile.on('pageerror', e => mobileErrors.push(e.message));
    await mobile.goto(pageUrl('bai.html?id=lop3-bai03'));
    await mobile.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await mobile.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      const sizes = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(sizes[0] <= sizes[1], `Tràn ngang 375px ${tab}: ${sizes}`);
    }
    assert.ok(await mobile.locator('#lever-release').isVisible());
    assert.deepEqual(mobileErrors, []);
    console.log('PASS: lop3-bai03 · trang 24/24, 3D 75 chi tiết, gói 3D, M2/M3/M5, canvas, mobile 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
