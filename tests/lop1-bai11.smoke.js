// Chạy trong HTTP test server: npm run test:smoke (hoặc BASE_URL=... node tests/lop1-bai11.smoke.js).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

async function checkPaintedScene(page) {
  await page.waitForFunction(() => {
    const canvas = document.getElementById('space-scene');
    if (!canvas || !canvas.width || !canvas.height) return false;
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const colors = new Set();
    for (let i = 0; i < data.length; i += Math.max(4, Math.floor(data.length / 800 / 4) * 4)) {
      if (data[i + 3]) colors.add(`${data[i] >> 4}:${data[i + 1] >> 4}:${data[i + 2] >> 4}`);
      if (colors.size >= 4) return true;
    }
    return false;
  }, null, { timeout: 10000 });
}

(async () => {
  const executablePath = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
    .filter(Boolean).find(p => fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 860 }, reducedMotion: 'reduce' });
    const errors = [];
    const capture = p => {
      p.on('pageerror', e => errors.push(`JavaScript: ${e.message}`));
      p.on('console', m => { if (m.type() === 'error') errors.push(`Console: ${m.text()}`); });
      p.on('requestfailed', r => errors.push(`Request: ${r.url()} (${r.failure()?.errorText})`));
    };
    capture(page);
    await page.goto(pageUrl('bai.html?id=lop1-bai11'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Bài 11/);
    assert.equal(await page.evaluate(() => window.robotViewer.stats().instances), 75);
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/4 nhiệm vụ');

    // Kiểm từng bước: ảnh sách giải mã được, liên kết sách trỏ đúng ảnh và nút hoàn tất cập nhật NV1.
    const assembly = await page.evaluate(async () => {
      const issues = [];
      for (let step = 1; step <= 31; step++) {
        window.robotViewer.setStep(step);
        const img = document.getElementById('book-img');
        const pdf = document.getElementById('book-pdf');
        try { await img.decode(); } catch (e) { issues.push(`Bước ${step}: ảnh không tải được`); }
        if (!img.naturalWidth || !img.getAttribute('src').endsWith(`assets/lop1-bai11/step-${String(step).padStart(2, '0')}.jpg`)) issues.push(`Bước ${step}: sai ảnh sách`);
        if (pdf.getAttribute('href') !== img.getAttribute('src')) issues.push(`Bước ${step}: liên kết sách khác ảnh`);
        if (!/bỏ/i.test(document.getElementById('doneBtn').textContent)) document.getElementById('doneBtn').click();
      }
      return { issues, done: document.getElementById('am-done').textContent };
    });
    assert.deepEqual(assembly.issues, []);
    assert.match(assembly.done, /31\s*\/\s*31/);
    assert.equal(await page.locator('#chip-m1').getAttribute('class').then(s => s.includes('is-done')), true);

    await page.click('#tab-btn-creative');
    assert.ok(await page.locator('#creative-stage').isVisible(), 'Xưởng 3D phải hiển thị');
    assert.equal(await page.locator('.creative-slot').count(), 4);
    for (const preset of ['scoop', 'pipe', 'cover', 'filter']) {
      await page.click(`[data-preset="${preset}"]`);
      assert.equal(await page.locator(`[data-preset="${preset}"]`).getAttribute('aria-pressed'), 'true');
      const extras = await page.evaluate(() => window.ZMCreative.extras());
      assert.ok(extras.some(p => p.name === preset), `${preset}: phải có linh kiện 3D được gắn`);
      assert.ok(await page.evaluate(() => window.robotViewer.stats().creative) >= extras.length,
        `${preset}: các linh kiện phải hiển thị trong xưởng`);
    }
    assert.deepEqual(await page.evaluate(() => window.ZMCreative.features().sort()), ['cover', 'filter', 'pipe', 'scoop']);
    const creativeGeometry = await page.evaluate(() => ({
      hasMeshes: !!window.LESSON_3D_DATA.creative,
      visible: window.robotViewer.stats().creative
    }));
    assert.ok(creativeGeometry.hasMeshes && creativeGeometry.visible >= 6, 'Đủ hình học cho bốn gói sáng tạo');
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');
    assert.deepEqual(await page.evaluate(() => [...window.simEngine.upgrades].sort()), ['cover', 'filter', 'pipe', 'scoop']);

    page.once('dialog', d => d.accept());
    await page.click('#btn-load-sample');
    assert.match(await page.locator('#ghost-score').innerText(), /đúng 10\/10 khối/i);
    assert.equal(await page.locator('#program-canvas-chain .zb-block').count(), 10);
    await checkPaintedScene(page);
    await page.click('#program-canvas-chain .zb-block-start');
    await page.waitForFunction(() => ['m2', 'm3', 'm4'].every(id =>
      document.getElementById('chip-' + id)?.classList.contains('is-done')), null, { timeout: 22000 });
    assert.equal(await page.locator('#mission-summary-badge').innerText(), 'Đạt 4/4 nhiệm vụ');
    assert.ok(await page.locator('#victory-modal').isVisible());
    assert.match(await page.locator('#verify-code-output').innerText(), /^ZM11-/);
    await page.click('#btn-close-victory');

    await page.click('#btn-mode');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.mode), 'pro');
    assert.equal(await page.evaluate(() => window.simEngine.advanced), true);
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '4/5 nhiệm vụ');
    assert.ok(await page.locator('#chip-m5').isVisible());
    await page.click('#btn-mode');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.mode), 'kid');
    assert.equal(await page.evaluate(() => window.simEngine.advanced), false);
    await page.click('#scene-toggle');
    assert.equal(await page.evaluate(() => document.getElementById('app').parentElement.id), 'sim-stage');
    await page.click('#scene-toggle');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    capture(mobile);
    await mobile.goto(pageUrl('bai.html?id=lop1-bai11'));
    await mobile.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await mobile.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      const sizes = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(sizes[0] <= sizes[1], `375px tràn ngang ở ${tab}: ${sizes}`);
    }
    assert.deepEqual(errors, [], 'Không có lỗi console, JavaScript hoặc request thất bại');
    console.log('PASS: lop1-bai11 – 31/31 ảnh sách/liên kết, 4 gói nâng cấp 3D, mẫu 10 khối, NV1–4, Bé/Nâng cao NV5, canvas, mobile 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
