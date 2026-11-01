// Smoke giao diện Lớp 1 Bài 13 – chạy bằng npm run test:smoke (HTTP server của suite).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

const ID = 'lop1-bai13';
const total = 22;

async function ready(page) {
  await page.goto(pageUrl(`bai.html?id=${ID}`));
  await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 30000 });
  await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 30000 });
}

async function sceneIsDrawn(page) {
  await page.waitForTimeout(300);
  const pixels = await page.locator('#space-scene').evaluate(canvas => {
    if (!canvas.width || !canvas.height) return 0;
    const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    const colors = new Set();
    for (let i = 0; i < data.length; i += Math.max(4, Math.floor(data.length / 4000 / 4) * 4)) {
      colors.add(`${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`);
    }
    return colors.size;
  });
  assert.ok(pixels > 10, `Cảnh 2D chưa vẽ đủ nội dung: ${pixels} màu`);
}

(async () => {
  const exe = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
    .find(p => p && fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(exe ? { executablePath: exe } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 860 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('requestfailed', r => errors.push('Network: ' + r.url()));
    await ready(page);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 30000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 30000 });
    assert.match(await page.title(), /Bài 13/);
    assert.equal(await page.locator('#btn-mode').innerText(), 'Chế độ: Bé');

    // Thao tác nút thật: đánh dấu xong mỗi bước tự dẫn sang bước tiếp theo.
    for (let s = 1; s <= total; s++) {
      assert.equal(await page.evaluate(() => window.robotViewer.getStep()), s);
      const book = page.locator('#book-img');
      assert.equal(await book.getAttribute('src'), `js/bai13/book/step-${String(s).padStart(2, '0')}.jpg`);
      await book.evaluate(img => img.decode());
      assert.ok(await book.evaluate(img => img.naturalWidth > 0), `Thiếu hình sách bước ${s}`);
      await page.locator('#doneBtn').click();
    }
    assert.equal(await page.evaluate(() => window.robotViewer.stats().done), total);
    assert.equal(await page.evaluate(() => window.simEngine.assemblyDone), true);

    await page.click('#tab-btn-creative');
    for (const [preset, count] of [['blade', 1], ['beacon', 2], ['salt', 3], ['chain', 5]]) {
      assert.ok(await page.locator(`[data-preset="${preset}"]`).isVisible());
      await page.locator(`[data-preset="${preset}"]`).click();
      assert.equal(await page.locator(`[data-preset="${preset}"]`).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.evaluate(() => window.robotViewer.stats().creative), count,
        `Gói ${preset} đã chọn nhưng không gắn đủ chi tiết vào mô hình 3D`);
    }
    assert.deepEqual(await page.evaluate(() => window.ZMCreative.features().sort()), ['beacon', 'blade', 'chain', 'salt']);
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true');
    await sceneIsDrawn(page);

    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-load-sample');
    assert.match(await page.locator('#ghost-score').innerText(), /đúng 7\/7 khối/i);
    assert.equal(await page.evaluate(() => window.simEngine.matchesSample()), true);
    await page.click('#program-canvas-chain .zb-block-start');
    await page.waitForFunction(() => !window.simEngine.running, null, { timeout: 20000 });
    assert.equal(await page.evaluate(() => window.simEngine.left()), 0, 'Chương trình mẫu chưa dọn hết 3 đống tuyết');
    assert.deepEqual(await page.evaluate(() => ({ ...window.simEngine.done })), { m2: true, m3: true, m5: false });
    assert.ok(await page.evaluate(() => window.simEngine.upgradeRun), 'Đã gắn nâng cấp nhưng chưa nhận NV4');
    assert.match(await page.locator('#mission-summary-badge').innerText(), /4\/4/);
    assert.ok(await page.locator('#victory-modal').isVisible());
    assert.match(await page.locator('#verify-code-output').innerText(), /^ZM13-/);
    await page.click('#btn-close-victory');

    await page.click('#btn-mode');
    assert.equal(await page.locator('#btn-mode').innerText(), 'Chế độ: Nâng cao');
    assert.ok(await page.locator('#chip-m5').isVisible());
    assert.equal(await page.evaluate(() => window.simEngine.advanced), true);
    // Thử thách 5 đống trong tối đa 4 chu kỳ: giữ chương trình mẫu, đổi Wait 1s → 5s.
    const wait = page.locator('#program-canvas-chain .zb-block').filter({ hasText: '1s' });
    assert.equal(await wait.count(), 1);
    for (let i = 0; i < 4; i++) await page.locator('#program-canvas-chain .zb-block').nth(4).click();
    assert.match(await page.locator('#program-canvas-chain .zb-block').nth(4).innerText(), /5s/);
    await page.click('#btn-run-program');
    await page.waitForFunction(() => !window.simEngine.running, null, { timeout: 20000 });
    assert.equal(await page.evaluate(() => window.simEngine.left()), 0);
    assert.ok(await page.evaluate(() => window.simEngine.cycles <= 4));
    assert.equal(await page.evaluate(() => window.simEngine.done.m5), true);
    assert.match(await page.locator('#mission-summary-badge').innerText(), /5\/5/);
    await page.click('#btn-mode');
    assert.equal(await page.evaluate(() => window.simEngine.advanced), false);

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    await ready(mobile);
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      const sizes = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(sizes[0] <= sizes[1], `Tràn ngang ở ${tab}: ${sizes}`);
    }
    await sceneIsDrawn(mobile);
    assert.deepEqual(errors, [], 'Có lỗi console / JavaScript / request');
    console.log('PASS: lop1-bai13 – 22 bước và hình sách, 4 preset, chương trình mẫu 4/4, Nâng cao 5/5, cảnh 2D, màn 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
