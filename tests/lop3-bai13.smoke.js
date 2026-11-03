// Smoke giao diện Lớp 3 Bài 13 – chạy bằng npm run test:smoke (BASE_URL do run-suite cấp).
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
    await page.goto(pageUrl('bai.html?id=lop3-bai13'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Bài 13/);
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'pro');
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/5 nhiệm vụ');
    assert.equal(await page.evaluate(() => window.robotViewer.stats().instances), 92, 'Mô hình 92 linh kiện CAD');

    // Đúng ảnh JPG thực của từng bước, tải và giải mã được trong trình duyệt.
    for (let step = 1; step <= 41; step++) {
      assert.equal(await page.locator('#countNow').innerText(), String(step));
      const img = page.locator('#book-img');
      assert.equal(await img.getAttribute('src'), `assets/lop3-bai13/step-${String(step).padStart(2, '0')}.jpg`);
      await img.evaluate(el => el.decode());
      assert.ok(await img.evaluate(el => el.naturalWidth > 0 && el.naturalHeight > 0),
        `JPEG bước ${step} phải tải và giải mã được`);
      assert.match(await img.getAttribute('alt'), new RegExp(`Bước ${step}:`));
      // Khi vừa tải, nhãn tĩnh ban đầu chỉ ghi "Bước 1"; từ bước 2 có cả số trang.
      assert.match(await page.locator('#book-loc').innerText(),
        step === 1 ? /^Bước 1(?: · trang 1)?$/ : new RegExp(`Bước ${step} · trang ${step}`));
      // Mọi bước (kể cả liên kết tĩnh bước 1 trong page.html) trỏ về ảnh sách được deploy, không về references/
      assert.equal(await page.locator('#book-pdf').getAttribute('href'), `assets/lop3-bai13/step-${String(step).padStart(2, '0')}.jpg`);
      await page.click('#doneBtn');
      await page.waitForFunction(n => parseInt(document.getElementById('am-done').textContent, 10) === n,
        step, { timeout: 5000 });
    }
    assert.match(await page.locator('#am-done').innerText(), /41\s*\/\s*41/);
    assert.ok(await page.locator('#chip-m1').evaluate(el => el.classList.contains('is-done')));
    assert.match(await page.locator('#mission-summary-badge').innerText(), /^1\/5/);

    await page.click('#tab-btn-creative');
    assert.ok(await page.locator('#creative-stage').isVisible());
    await page.click('[data-preset="boosters"]');
    assert.ok((await page.evaluate(() => window.robotViewer.stats().creative)) > 0, 'Máy bơm mạnh phải hiện trên 3D');
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');
    assert.match(await page.locator('#sim-active-upgrade-badge').innerText(), /động cơ đẩy/i);
    assert.ok(await page.locator('#space-scene').isVisible());
    await page.waitForFunction(() => {
      const c = document.getElementById('space-scene');
      return c && c.width > 100 && c.height > 100;
    }, null, { timeout: 10000 });
    await page.waitForTimeout(250);
    const pixels = await page.locator('#space-scene').evaluate(c => {
      const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let nonTransparent = 0;
      let different = 0;
      for (let i = 0; i < data.length; i += 4 * 29) {
        if (data[i + 3] > 0) nonTransparent++;
        if (data[i] !== data[0] || data[i + 1] !== data[1] || data[i + 2] !== data[2]) different++;
      }
      return { nonTransparent, different };
    });
    assert.ok(pixels.nonTransparent > 100 && pixels.different > 100,
      `Sa bàn canvas trống hoặc chỉ có một màu: ${JSON.stringify(pixels)}`);

    // Mẫu: Start → Repeat → Motor Low → Chờ vật cản → Stop → Wait 3s → Repeat End.
    await page.click('#btn-mode');
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'kid');
    assert.ok(await page.locator('#chip-m5').isHidden());
    page.once('dialog', d => d.accept());
    await page.click('#btn-load-sample');
    assert.match(await page.locator('#ghost-score').innerText(), /^đúng 10\/10 khối$/i);
    await page.click('#program-canvas-chain .zb-block-start');
    assert.equal(await page.evaluate(() => window.simEngine.running), true);
    // Tiến thời gian bằng tick của bộ mô phỏng đang chạy từ giao diện.
    const result = await page.evaluate(() => {
      const s = window.simEngine;
      s.pauseLoop();
      for (let i = 0; i < 720 && s.running; i++) s.advance(0.05);
      s.updateUI();
      return { stage: s.stage, v: s.v, x: s.x };
    });
    // Luật từ 78a3364: gói động cơ không làm mẫu 3-3-3 tự cất cánh; em phải chỉnh thời gian chờ (giống tests/lop3-bai13.test.js).
    assert.equal(result.stage, 'braking', 'Gói động cơ không làm mẫu 3-3-3 tự cất cánh');
    assert.ok(!(await page.locator('#chip-m3').evaluate(el => el.classList.contains('is-done'))), 'Mẫu 3-3-3 chưa đạt NV3');
    // Chỉnh khối Chờ cuối thành 4 giây rồi chạy lại: cất cánh, quãng lấy đà ngắn hơn
    const fixed = await page.evaluate(() => {
      const s = window.simEngine, B = window.ZMApp.blocks;
      s.stop();
      B.blocks[8].duration = 4;
      B.render();
      B.notifyChange();
      s.start();
      s.pauseLoop();
      for (let i = 0; i < 720 && s.running; i++) s.advance(0.05);
      s.updateUI();
      return { stage: s.stage, x: s.x };
    });
    assert.equal(fixed.stage, 'airborne', 'Chờ 3-3-4 với gói động cơ thì cất cánh');
    assert.ok(fixed.x < 41);
    await page.waitForFunction(() => document.getElementById('mission-summary-badge').textContent.includes('4/4'));
    for (const id of ['m2', 'm3', 'm4'])
      assert.ok(await page.locator('#chip-' + id).evaluate(el => el.classList.contains('is-done')), `Phải đạt ${id}`);
    assert.ok(await page.locator('#victory-modal').isVisible());
    assert.match(await page.locator('#verify-code-output').innerText(), /^ZM3-13-/);
    await page.click('#btn-close-victory');
    await page.click('#btn-mode');
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'pro');
    assert.ok(await page.locator('#chip-m5').isVisible());
    assert.equal(await page.evaluate(() => window.simEngine.advanced), true);
    assert.match(await page.locator('#mission-summary-badge').innerText(), /^4\/5/);
    assert.deepEqual(errors, [], 'Không có JS exception, request lỗi hoặc HTTP 4xx/5xx');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    const mobileErrors = [];
    mobile.on('pageerror', e => mobileErrors.push(e.message));
    mobile.on('console', m => { if (m.type() === 'error') mobileErrors.push(`Console: ${m.text()}`); });
    await mobile.goto(pageUrl('bai.html?id=lop3-bai13'));
    await mobile.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await mobile.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      await mobile.waitForTimeout(180);
      const widths = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(widths[0] <= widths[1], `Tràn ngang 375px tại ${tab}: ${widths}`);
    }
    assert.deepEqual(mobileErrors, []);
    console.log('PASS: lop3-bai13 – 41 bước/JPEG, xưởng 3D, mẫu 10 khối đạt NV1–4, hai chế độ, canvas có vẽ, mobile 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
