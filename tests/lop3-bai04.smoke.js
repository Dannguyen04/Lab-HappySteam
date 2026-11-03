// node tests/run-suite.js smoke lop3-bai04 — kiểm trang thật, 3D, 18 ảnh, chương trình, sa bàn và mobile.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

const executablePath = [process.env.ZM_CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
  .find(p => p && fs.existsSync(p));

async function runProgram(page) {
  await page.click('#program-canvas-chain .zb-block-start');
  return page.evaluate(() => {
    const s = window.simEngine;
    s.pauseLoop();
    let frames = 0;
    while (s.running && frames++ < 5000) s.advance(0.02);
    s.updateUI();
    return {
      done: { ...s.done }, failed: s.failed, reason: s.reason,
      got: s.got(), missed: s.missed(), frames
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 860 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(`JS: ${e.message}`));
    page.on('console', m => {
      if (m.type() === 'error' && !m.text().includes('/js/lop3-bai04/art.js')
        && !m.text().includes('server responded with a status of 404 (Not Found)')) errors.push(`Console: ${m.text()}`);
    });
    page.on('requestfailed', r => {
      if (!r.url().endsWith('/js/lop3-bai04/art.js')) errors.push(`Request: ${r.url()} (${r.failure()?.errorText})`);
    });
    page.on('response', r => {
      if (r.status() >= 400 && !r.url().endsWith('/js/lop3-bai04/art.js')) errors.push(`${r.status()} ${r.url()}`);
    });

    await page.goto(pageUrl('bai.html?id=lop3-bai04'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Phân loại, tái chế rác thải/);
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'pro', 'Lớp 3 mặc định mở Nâng cao');
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/5 nhiệm vụ');
    const stats = await page.evaluate(() => window.robotViewer.stats());
    assert.equal(stats.instances, 34, 'Mô hình 3D có đủ 34 chi tiết');
    assert.equal(stats.meshes, 26, 'Mô hình 3D có đủ 26 mesh');
    assert.ok(stats.canvas[0] > 0 && stats.canvas[1] > 0, 'Canvas 3D đã khởi tạo');

    for (let step = 1; step <= 18; step++) {
      assert.equal(await page.locator('#countNow').innerText(), String(step));
      const img = page.locator('#book-img');
      const src = `assets/lop3-bai04/step-${String(step).padStart(2, '0')}.jpg`;
      assert.equal(await img.getAttribute('src'), src);
      await img.evaluate(el => el.decode());
      assert.ok(await img.evaluate(el => el.naturalWidth > 0 && el.naturalHeight > 0), `Ảnh bước ${step} giải mã được`);
      assert.equal(await page.locator('#book-pdf').getAttribute('href'), src);
      await page.click('#doneBtn');
      await page.waitForFunction(n => parseInt(document.getElementById('am-done').textContent, 10) === n,
        step, { timeout: 5000 });
    }
    assert.match(await page.locator('#am-done').innerText(), /18\s*\/\s*18/);
    assert.ok(await page.locator('#chip-m1').evaluate(el => el.classList.contains('is-done')));

    await page.click('#tab-btn-creative');
    assert.ok(await page.locator('#creative-stage').isVisible());
    assert.equal(await page.locator('[data-preset]').count(), 4);
    for (const preset of ['funnel', 'paddedArm', 'lids', 'tray']) {
      await page.click(`[data-preset="${preset}"]`);
      assert.ok(await page.evaluate(() => window.robotViewer.stats().creative > 0), `${preset} hiển thị chi tiết 3D`);
    }
    await page.click('[data-preset="paddedArm"]');
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');

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
    assert.ok(pixels.visible > 100 && pixels.varied > 100, `Sa bàn Canvas trống: ${JSON.stringify(pixels)}`);

    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-load-sample');
    assert.equal(await page.locator('#program-canvas-chain .zb-block').count(), 13, 'Chương trình mẫu có 13 khối');
    assert.match(await page.locator('#ghost-score').innerText(), /13\/13/);

    const sample = await runProgram(page);
    assert.equal(sample.done.m2, true, 'Mẫu chạy đủ một vòng đạt M2');
    assert.equal(sample.done.m3, false, 'Mẫu nguyên bản chưa phân loại chính xác');
    assert.equal(sample.done.m5, false, 'Mẫu 1 giây trượt ở Nâng cao');
    assert.equal(sample.failed, true);
    assert.ok(await page.locator('#chip-m4').evaluate(el => el.classList.contains('is-done')), 'Đã chạy thử gói sáng tạo đạt M4');

    await page.click('#btn-mode'); // Nâng cao → Bé: M3 dùng nhịp đỏ 1s, xanh 0,5s.
    for (let i = 0; i < 5; i++) await page.locator('#program-canvas-chain .zb-block').nth(10).click();
    assert.match(await page.locator('#program-canvas-chain .zb-block').nth(10).innerText(), /0\.5s/);
    const m3 = await runProgram(page);
    assert.equal(m3.done.m3, true, 'Đỏ 1 giây + xanh 0,5 giây đạt M3');
    assert.equal(m3.failed, false);
    assert.equal(m3.got, 4);
    assert.equal(m3.missed, 0);

    await page.click('#btn-mode'); // Bé → Nâng cao: cả hai nhịp đều 0,5s.
    for (let i = 0; i < 5; i++) await page.locator('#program-canvas-chain .zb-block').nth(5).click();
    assert.match(await page.locator('#program-canvas-chain .zb-block').nth(5).innerText(), /0\.5s/);
    const m5 = await runProgram(page);
    assert.equal(m5.done.m3, true);
    assert.equal(m5.done.m5, true, 'Hai thời gian 0,5 giây đạt Nâng cao');
    assert.equal(m5.failed, false);
    assert.equal(m5.got, 4);
    assert.deepEqual(errors, [], 'Không có lỗi JS, console, HTTP hoặc tải tài nguyên (trừ art.js tùy chọn)');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    const mobileErrors = [];
    mobile.on('pageerror', e => mobileErrors.push(e.message));
    mobile.on('requestfailed', r => {
      if (!r.url().endsWith('/js/lop3-bai04/art.js')) mobileErrors.push(`${r.url()} (${r.failure()?.errorText})`);
    });
    await mobile.goto(pageUrl('bai.html?id=lop3-bai04'));
    await mobile.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await mobile.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      const widths = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(widths[0] <= widths[1], `Tràn ngang mobile tại ${tab}: ${widths}`);
    }
    assert.deepEqual(mobileErrors, []);
    console.log('PASS: lop3-bai04 – 34 chi tiết 3D, 18 JPEG, 4 preset, M2/M3/M5, M4 và mobile 375px.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
