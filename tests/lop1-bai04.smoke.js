// Smoke trình duyệt Bài 4: 3D, 23 ảnh sách, giữ/thả cò, hai chế độ và mobile.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

(async () => {
  const executablePath = [process.env.ZM_CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(p => p && fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 860 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(`Console: ${m.text()}`); });
    page.on('requestfailed', r => errors.push(`Request: ${r.url()} ${r.failure()?.errorText}`));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
    await page.goto(pageUrl('bai.html?id=lop1-bai04'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Bài 4/);
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'kid');
    assert.equal(await page.evaluate(() => window.robotViewer.stats().instances), 74);
    assert.ok(await page.locator('#chip-m5').isHidden(), 'Chế độ Bé ẩn M5');
    assert.ok(await page.locator('#m-depth').isHidden(), 'Chế độ Bé ẩn số đo');
    for (let step = 1; step <= 23; step++) {
      assert.equal(await page.locator('#countNow').innerText(), String(step));
      const image = page.locator('#book-img');
      assert.equal(await image.getAttribute('src'), `assets/lop1-bai04/step-${String(step).padStart(2, '0')}.jpg`);
      await image.evaluate(el => el.decode());
      assert.ok(await image.evaluate(el => el.naturalWidth > 0), `Ảnh bước ${step} phải tải được`);
      await page.click('#doneBtn');
      await page.waitForFunction(n => parseInt(document.getElementById('am-done').textContent, 10) === n, step);
    }
    assert.ok(await page.locator('#chip-m1').evaluate(el => el.classList.contains('is-done')));
    await page.click('#tab-btn-creative');
    await page.click('[data-preset="sideHandle"]');
    assert.ok(await page.evaluate(() => window.robotViewer.stats().creative > 0), 'Có CAD nâng cấp');
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');
    await page.waitForFunction(() => document.getElementById('space-scene').width > 100);
    await page.waitForTimeout(250);
    const drawn = await page.locator('#space-scene').evaluate(c => {
      const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let opaque = 0, varied = 0;
      for (let i = 0; i < data.length; i += 116) {
        if (data[i + 3]) opaque++;
        if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) varied++;
      }
      return { opaque, varied };
    });
    assert.ok(drawn.opaque > 100 && drawn.varied > 100, `Canvas trống: ${JSON.stringify(drawn)}`);
    assert.ok(await page.locator('#drill-material').isHidden(), 'Chế độ Bé ẩn chọn vật liệu');
    assert.ok(await page.locator('#calc-eq1').isHidden(), 'Chế độ Bé ẩn tính toán và số đo');

    page.once('dialog', d => d.accept());
    await page.click('#btn-load-sample');
    assert.match(await page.locator('#ghost-score').innerText(), /^đúng 7\/7 khối$/i);
    await page.click('#program-canvas-chain .zb-block-start');
    assert.ok(await page.evaluate(() => window.simEngine.running));
    await page.locator('#scene-press').dispatchEvent('pointerdown', { bubbles: true, pointerId: 1, pointerType: 'touch' });
    const during = await page.evaluate(() => {
      const s = window.simEngine;
      s.pauseLoop();
      for (let i = 0; i < 30; i++) s.advance(0.02);
      return { held: s.held, motorOn: s.motorOn, depth: s.depth };
    });
    assert.ok(during.held && during.motorOn && during.depth > 0, 'Giữ cò làm khoan quay');
    await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 })));
    const sample = await page.evaluate(() => {
      const s = window.simEngine;
      s.advance(0.02);
      s.checkMissions();
      return { held: s.held, running: s.running, m2: s.done.m2, m3: s.done.m3 };
    });
    assert.deepEqual(sample, { held: false, running: false, m2: true, m3: false });
    assert.ok(await page.locator('#chip-m2').evaluate(el => el.classList.contains('is-done')));
    assert.ok(await page.locator('#chip-m4').evaluate(el => el.classList.contains('is-done')));

    await page.click('#btn-mode');
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'pro');
    assert.ok(await page.locator('#chip-m5').isVisible());
    assert.ok(await page.locator('#drill-material').isVisible());
    assert.ok(await page.locator('#calc-eq1').isVisible(), 'Nâng cao hiện tính toán');
    await page.selectOption('#drill-material', 'wood');
    assert.equal(await page.evaluate(() => window.simEngine.material), 'wood');
    assert.ok(await page.locator('#m-depth').isVisible());
    assert.deepEqual(errors, [], 'Không có lỗi JavaScript, request hỏng hoặc HTTP >= 400');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    const mobileErrors = [];
    mobile.on('pageerror', e => mobileErrors.push(e.message));
    await mobile.goto(pageUrl('bai.html?id=lop1-bai04'));
    await mobile.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await mobile.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      const widths = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(widths[0] <= widths[1], `Tràn ngang mobile ở ${tab}: ${widths}`);
    }
    assert.deepEqual(mobileErrors, []);
    console.log('PASS: lop1-bai04 – 23 JPEG, 74 chi tiết 3D, nâng cấp, canvas, bấm giữ/thả, hai chế độ và mobile 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
