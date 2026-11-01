// Smoke giao diện Lớp 3 Bài 10 – chạy bằng npm run test:smoke (BASE_URL do run-suite cấp).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

async function checkSceneCanvas(page) {
  await page.waitForFunction(() => {
    const c = document.getElementById('space-scene');
    return c && c.width > 100 && c.height > 100;
  }, null, { timeout: 10000 });
  await page.waitForTimeout(250);
  const pixels = await page.locator('#space-scene').evaluate(c => {
    const { width, height } = c;
    const data = c.getContext('2d').getImageData(0, 0, width, height).data;
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
}

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
    await page.goto(pageUrl('bai.html?id=lop3-bai10'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Bài 10/);
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'pro', 'Lớp 3 mặc định Nâng cao');
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/5 nhiệm vụ');
    assert.ok((await page.evaluate(() => window.robotViewer.stats().instances)) > 0, 'Mô hình CAD có linh kiện');

    // Đi lần lượt 15 bước, kiểm tra cả hình sách lẫn tiến độ lắp thực tế.
    for (let step = 1; step <= 15; step++) {
      assert.equal(await page.locator('#countNow').innerText(), String(step));
      const book = page.locator('#book-img');
      assert.match(await book.getAttribute('src'), new RegExp(`^js/lop3-bai10/book/page-${String(step).padStart(2, '0')}\\.jpg$`));
      await book.evaluate(img => img.decode());
      assert.ok(await book.evaluate(img => img.naturalWidth > 0 && img.naturalHeight > 0), `Ảnh sách bước ${step} phải tải được`);
      assert.equal(await page.locator('#book-pdf').getAttribute('href'), await book.getAttribute('src'));
      await page.click('#doneBtn');
      await page.waitForFunction(n => parseInt(document.getElementById('am-done').textContent, 10) === n,
        step, { timeout: 5000 });
    }
    assert.match(await page.locator('#am-done').innerText(), /15\s*\/\s*15/);
    assert.ok(await page.locator('#chip-m1').evaluate(el => el.classList.contains('is-done')));
    assert.match(await page.locator('#mission-summary-badge').innerText(), /^1\/5/);

    await page.click('#tab-btn-creative');
    assert.ok(await page.locator('#creative-stage').isVisible());
    for (const [preset, count] of [['dish', 2], ['wheels', 8]]) {
      await page.click(`[data-preset="${preset}"]`);
      assert.equal(await page.evaluate(() => window.robotViewer.stats().creative), count,
        `Gói ${preset} phải xuất hiện bằng mesh trên robot 3D`);
      await page.click(`[data-preset="${preset}"]`);
      assert.equal(await page.evaluate(() => window.robotViewer.stats().creative), 0,
        `Bỏ gói ${preset} phải gỡ linh kiện CAD`);
    }
    await page.click('[data-preset="lamp"]');
    assert.equal(await page.locator('[data-preset="lamp"]').getAttribute('aria-pressed'), 'true');
    assert.deepEqual(await page.evaluate(() => window.ZMCreative.features()), ['lamp']);
    assert.equal(await page.evaluate(() => window.robotViewer.stats().creative), 2,
      'Hai đèn pha phải thực sự xuất hiện trên mô hình CAD');
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');
    assert.match(await page.locator('#sim-active-upgrade-badge').innerText(), /đèn pha/i);
    await checkSceneCanvas(page);

    // Mẫu học sinh: Start → Repeat → Motor Low → Chờ vật cản → Stop → Wait 3s → Repeat End.
    // Chạy trong chế độ Cơ bản để không gặp bão bụi dành riêng cho Nâng cao.
    await page.click('#btn-mode');
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'kid');
    assert.ok(await page.locator('#chip-m5').isHidden());
    assert.ok(await page.locator('#m-weather').isHidden());
    assert.match(await page.locator('#mission-summary-badge').innerText(), /^1\/4/);
    page.once('dialog', d => d.accept());
    await page.click('#btn-load-sample');
    assert.match(await page.locator('#ghost-score').innerText(), /^đúng 7\/7 khối$/i);
    await page.click('#program-canvas-chain .zb-block-start');
    assert.equal(await page.evaluate(() => window.simEngine.running), true);
    // Mô phỏng đi bằng tick thực của engine, giúp smoke không cần chờ 30 giây đồng hồ thật.
    const result = await page.evaluate(() => {
      const s = window.simEngine;
      s.pauseLoop();
      for (let i = 0; i < 720 && s.running; i++) s.advance(0.05);
      s.updateUI();
      return { got: s.got(), crashed: s.crashed };
    });
    assert.equal(result.got, 3, 'Chương trình mẫu phải thu đủ ba mẫu đá');
    assert.equal(result.crashed, false, 'Robot không va chạm khi có cảm biến');
    await page.waitForFunction(() => document.getElementById('mission-summary-badge').textContent.includes('4/4'));
    for (const id of ['m2', 'm3', 'm4'])
      assert.ok(await page.locator('#chip-' + id).evaluate(el => el.classList.contains('is-done')), `Phải đạt ${id}`);
    assert.ok(await page.locator('#victory-modal').isVisible());
    assert.match(await page.locator('#verify-code-output').innerText(), /^ZM3-10-/);
    await page.click('#btn-close-victory');
    await page.click('#btn-mode');
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'pro');
    assert.ok(await page.locator('#chip-m5').isVisible());
    assert.ok(await page.locator('#m-weather').isVisible());
    assert.equal(await page.evaluate(() => window.simEngine.advanced), true);
    assert.match(await page.locator('#mission-summary-badge').innerText(), /^4\/5/);
    assert.deepEqual(errors, [], 'Không có JS exception, request lỗi hoặc HTTP 4xx/5xx');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    const mobileErrors = [];
    mobile.on('pageerror', e => mobileErrors.push(e.message));
    mobile.on('console', m => { if (m.type() === 'error') mobileErrors.push(`Console: ${m.text()}`); });
    await mobile.goto(pageUrl('bai.html?id=lop3-bai10'));
    await mobile.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await mobile.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      await mobile.waitForTimeout(180);
      const widths = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(widths[0] <= widths[1], `Tràn ngang 375px tại ${tab}: ${widths}`);
    }
    assert.deepEqual(mobileErrors, []);
    console.log('PASS: lop3-bai10 – 15 bước/15 ảnh sách, cả 3 gói CAD sáng tạo có mesh, mẫu 7 khối đạt NV1–4, hai chế độ, canvas có vẽ, mobile 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
