// node tests/run-suite.js smoke lop3-bai02 – kiểm trang thật, 31 trang sách, 3D, mô phỏng và mobile.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

(async () => {
  const executablePath = [process.env.ZM_CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
    .find(path => path && fs.existsSync(path));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 860 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push('JS: ' + e.message));
    page.on('requestfailed', r => {
      if (!r.url().endsWith('/js/lop3-bai02/art.js'))
        errors.push(`Request: ${r.url()} (${r.failure()?.errorText})`);
    });
    page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/js/lop3-bai02/art.js')) errors.push(`${r.status()} ${r.url()}`); });

    await page.goto(pageUrl('bai.html?id=lop3-bai02'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Bài 2/);
    assert.equal(await page.locator('#tab-btn-sim small').innerText(), 'Sa bàn nhà kho');
    assert.equal(await page.locator('#victory-modal h2').innerText(), 'Hoàn thành bốn nhiệm vụ chính');
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'pro');
    assert.equal(await page.evaluate(() => window.robotViewer.stats().instances), 81);
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/5 nhiệm vụ');

    for (let step = 1; step <= 31; step++) {
      assert.equal(await page.locator('#countNow').innerText(), String(step));
      const img = page.locator('#book-img');
      const src = `assets/lop3-bai02/step-${String(step).padStart(2, '0')}.jpg`;
      assert.equal(await img.getAttribute('src'), src);
      await img.evaluate(el => el.decode());
      assert.ok(await img.evaluate(el => el.naturalWidth > 0), `Ảnh lắp bước ${step} chưa giải mã`);
      assert.equal(await page.locator('#book-pdf').getAttribute('href'), src);
      await page.click('#doneBtn');
      await page.waitForFunction(n => parseInt(document.getElementById('am-done').textContent, 10) === n,
        step, { timeout: 5000 });
    }
    assert.ok(await page.locator('#chip-m1').evaluate(el => el.classList.contains('is-done')));

    await page.click('#tab-btn-creative');
    assert.ok(await page.locator('#creative-stage').isVisible());
    await page.click('[data-preset="wideFork"]');
    assert.ok(await page.evaluate(() => window.robotViewer.stats().creative > 0), 'Phụ kiện 3D phải gắn được');
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');
    assert.match(await page.locator('#sim-active-upgrade-badge').innerText(), /càng nâng rộng/i);
    await page.waitForFunction(() => {
      const c = document.getElementById('space-scene');
      return c && c.width > 100 && c.height > 100;
    });
    await page.waitForTimeout(200);
    const pixels = await page.locator('#space-scene').evaluate(c => {
      const p = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let varied = 0;
      for (let i = 4; i < p.length; i += 4 * 29)
        if (p[i] !== p[0] || p[i + 1] !== p[1] || p[i + 2] !== p[2]) varied++;
      return varied;
    });
    assert.ok(pixels > 100, `Canvas nhà kho bị trống: ${pixels}`);
    if (process.env.ZM_SMOKE_SHOT) await page.screenshot({ path: process.env.ZM_SMOKE_SHOT, fullPage: true });

    page.once('dialog', d => d.accept());
    await page.click('#btn-load-sample');
    assert.match(await page.locator('#ghost-score').innerText(), /^đúng 16\/16 khối$/i);
    await page.click('#program-canvas-chain .zb-block-start');
    const simResult = await page.evaluate(() => {
      const sim = window.simEngine;
      const make = () => window.LESSON.blocks.sample.map(spec => {
        const [key, extra] = Array.isArray(spec) ? spec : [spec, {}];
        return { ...window.BLOCK_TEMPLATES[key], ...extra };
      });
      const tick = () => {
        sim.pauseLoop();
        for (let i = 0; i < 1500 && sim.running; i++) sim.advance(.05);
        sim.checkMissions();
        return { m2: sim.done.m2, m3: sim.done.m3, m5: sim.done.m5, reason: sim.reason, failed: sim.failed };
      };
      const sample = tick();
      const corrected = make(); corrected[8].duration = 2;
      sim.setAdvanced(false); sim.setProgram(corrected); sim.start();
      const delivery = tick();
      const hazardous = make(); hazardous[8].duration = 2;
      sim.setAdvanced(true); sim.setProgram(hazardous); sim.start();
      const noWait = tick();
      hazardous.splice(13, 0, { ...window.BLOCK_TEMPLATES.waitClear });
      sim.setProgram(hazardous); sim.start();
      const safe = tick();
      return { sample, delivery, noWait, safe, upgradeRun: sim.upgradeRun };
    });
    assert.equal(simResult.sample.m2, true, '16 khối mẫu phải đạt M2');
    assert.equal(simResult.sample.reason, 'short', 'Mẫu 1 giây tiến chưa tới pallet');
    assert.equal(simResult.delivery.m3, true, 'Chỉnh thành 2 giây phải giao pallet thành công');
    assert.equal(simResult.delivery.failed, false);
    assert.equal(simResult.noWait.reason, 'hazard', 'Chạy khi có vật cản phải thất bại');
    assert.equal(simResult.safe.m5, true, 'Chèn Đợi đường trống trước M1 lùi phải đạt nâng cao');
    assert.equal(simResult.safe.failed, false);
    assert.equal(simResult.upgradeRun, true, 'Mô phỏng sau khi gắn nâng cấp phải tính M4');
    assert.match(await page.locator('#mc-text').innerText(), /hành trình vận chuyển mới cho xe nâng/);
    assert.deepEqual(errors, [], 'Lỗi tài nguyên hoặc JavaScript trên trang desktop');
    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    const mobileErrors = [];
    mobile.on('pageerror', e => mobileErrors.push(e.message));
    await mobile.goto(pageUrl('bai.html?id=lop3-bai02'));
    await mobile.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await mobile.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      const widths = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(widths[0] <= widths[1], `Tràn ngang 375px tại ${tab}: ${widths}`);
    }
    assert.deepEqual(mobileErrors, [], 'Lỗi JavaScript trên mobile');
    console.log('PASS: lop3-bai02 – 31 ảnh, 81 chi tiết 3D, nâng cấp 3D, canvas, M2/M3/M5, mobile 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
