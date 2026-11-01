// Smoke giao diện Lớp 3 Bài 09 – chạy bằng npm run test:smoke (HTTP server của suite).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

async function ready(page) {
  await page.goto(pageUrl('bai.html?id=lop3-bai09'));
  await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 30000 });
  await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 30000 });
}

async function sceneIsDrawn(page) {
  await page.waitForTimeout(300);
  const colors = await page.locator('#space-scene').evaluate(canvas => {
    if (!canvas.width || !canvas.height) return 0;
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    const set = new Set();
    for (let i = 0; i < data.length; i += Math.max(4, Math.floor(data.length / 4000 / 4) * 4)) {
      set.add(`${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`);
    }
    return set.size;
  });
  assert.ok(colors > 10, `Cảnh 2D chưa vẽ đủ nội dung: ${colors} màu`);
}

(async () => {
  const exe = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
    .find(p => p && fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(exe ? { executablePath: exe } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 860 }, reducedMotion: 'reduce' });
    const errors = [];
    const missingBooks = [];
    const lessonIssues = [];
    page.on('pageerror', e => errors.push(e.message));
    // Chrome ghi 404 bằng thông báo chung không chứa URL; đối chiếu URL ở response.
    page.on('console', m => {
      if (m.type() === 'error' && !/^Failed to load resource: the server responded with a status of 404 \(Not Found\)$/.test(m.text())) errors.push(m.text());
    });
    page.on('response', r => {
      if (r.status() >= 400 && !/\/assets\/lop3-bai09\/step-\d+\.jpg$/.test(new URL(r.url()).pathname)) {
        errors.push(`HTTP ${r.status()}: ${r.url()}`);
      }
    });
    page.on('requestfailed', r => errors.push('Network: ' + r.url()));
    await ready(page);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 30000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 30000 });
    assert.match(await page.title(), /Bài 9/);
    assert.equal(await page.locator('#btn-mode').innerText(), 'Chế độ: Nâng cao');
    assert.equal(await page.evaluate(() => window.simEngine.advanced), true);

    for (let s = 1; s <= 27; s++) {
      assert.equal(await page.evaluate(() => window.robotViewer.getStep()), s);
      const book = page.locator('#book-img');
      assert.equal(await book.getAttribute('src'), `assets/lop3-bai09/step-${String(s).padStart(2, '0')}.jpg`);
      const valid = await book.evaluate(img => img.decode().then(() => img.naturalWidth > 0, () => false));
      if (!valid) missingBooks.push(s);
      await page.click('#doneBtn');
    }
    assert.equal(await page.evaluate(() => window.robotViewer.stats().done), 27);
    assert.equal(await page.evaluate(() => window.simEngine.assemblyDone), true);

    await page.click('#tab-btn-creative');
    for (const preset of ['float', 'light', 'sail']) {
      assert.ok(await page.locator(`[data-preset="${preset}"]`).isVisible());
      await page.locator(`[data-preset="${preset}"]`).click();
      assert.equal(await page.locator(`[data-preset="${preset}"]`).getAttribute('aria-pressed'), 'true');
    }
    assert.deepEqual(await page.evaluate(() => window.ZMCreative.features().sort()), ['float', 'light', 'sail']);
    if (!(await page.evaluate(() => window.robotViewer.stats().creative > 0))) {
      lessonIssues.push('Đã chọn 3 gói nhưng mô hình 3D không có chi tiết sáng tạo bổ sung');
    }
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');
    await sceneIsDrawn(page);

    // Mẫu 9 khối chạy trọn vòng lặp ở chế độ Cơ bản, trước khi thử thời tiết Nâng cao.
    await page.click('#btn-mode');
    if ((await page.locator('#btn-mode').innerText()) !== 'Chế độ: Cơ bản') {
      lessonIssues.push('Ở Lớp 3, chế độ Cơ bản hiển thị nhãn "Chế độ: Bé"');
    }
    assert.equal(await page.evaluate(() => window.simEngine.advanced), false);
    assert.ok(await page.locator('#m-speed').isVisible(), 'Cơ bản phải hiển thị tốc độ');
    assert.ok(await page.locator('#m-dist').isVisible(), 'Cơ bản phải hiển thị quãng đường');
    assert.equal(await page.locator('#m-tilt').isVisible(), false, 'Góc nghiêng chỉ ở Nâng cao');
    assert.equal(await page.locator('#m-weather').isVisible(), false, 'Thời tiết chỉ ở Nâng cao');
    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-load-sample');
    assert.match(await page.locator('#ghost-score').innerText(), /đúng 9\/9 khối/i);
    assert.equal(await page.evaluate(() => window.simEngine.matchesSample()), true);
    await page.click('#program-canvas-chain .zb-block-start');
    await page.waitForFunction(() => window.simEngine.done.m2, null, { timeout: 20000 });
    assert.ok(await page.evaluate(() => window.simEngine.loops >= 1));
    assert.ok(await page.evaluate(() => window.simEngine.upgradeRun), 'Chưa ghi nhận nhiệm vụ nâng cấp');
    await page.click('#btn-stop-program');

    await page.click('#btn-mode');
    assert.equal(await page.locator('#btn-mode').innerText(), 'Chế độ: Nâng cao');
    assert.equal(await page.evaluate(() => window.simEngine.advanced), true);
    assert.ok(await page.locator('#m-tilt').isVisible(), 'Nâng cao phải hiển thị góc nghiêng');
    assert.ok(await page.locator('#chip-m5').isVisible());
    // Khay khối thật: Xóa chương trình mẫu, lắp Start → Repeat → Low → Wait 3s → Repeat End.
    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-clear-code');
    assert.ok(await page.locator('#block-toolbox [data-key="lowSpeed"]').isVisible());
    await page.click('#block-toolbox [data-key="lowSpeed"]');
    await page.click('#block-toolbox [data-key="wait"]');
    assert.equal(await page.locator('#program-canvas-chain .zb-block').count(), 5);
    await page.click('#btn-run-program');
    // Đi qua các vòng lặp bằng thời gian mô phỏng; vẫn khởi chạy và kiểm tra trên cảnh thật.
    await page.evaluate(() => {
      const e = window.simEngine;
      for (let t = 0; t < 85 && e.running && !e.arrived && !e.crashed; t++) e.advance(1);
    });
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => window.simEngine.crashed), false, 'Thuyền đã va đá hoặc bị lật');
    assert.equal(await page.evaluate(() => window.simEngine.arrived), true, 'Thuyền chưa cập cảng 30m');
    assert.deepEqual(await page.evaluate(() => ({ ...window.simEngine.done })), { m2: true, m3: true, m5: true });
    assert.match(await page.locator('#mission-summary-badge').innerText(), /5\/5/);
    assert.ok(await page.locator('#victory-modal').isVisible());
    assert.match(await page.locator('#verify-code-output').innerText(), /^ZM3-09-/);
    await page.click('#btn-close-victory');
    await sceneIsDrawn(page);

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    await ready(mobile);
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      const sizes = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(sizes[0] <= sizes[1], `Tràn ngang ở ${tab}: ${sizes}`);
    }
    await sceneIsDrawn(mobile);
    const findings = [
      ...lessonIssues,
      ...(missingBooks.length ? [`Thiếu hình sách ở ${missingBooks.length}/27 bước: ${missingBooks.join(', ')}`] : []),
      ...errors
    ];
    assert.deepEqual(findings, [], 'Lỗi bài học cần sửa (xem docs/giao-viec/30-bao-cao-lop3-bai09.md)');
    console.log('PASS: lop3-bai09 – 27 bước và hình sách, 3 preset, mẫu 9/9, vượt bão và cập cảng 5/5, cảnh 2D, màn 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
