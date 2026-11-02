// Smoke Phòng lập trình – chạy từ tests/run-suite.js với BASE_URL HTTP.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

(async () => {
  const executablePath = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
    .find(p => p && fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(`${m.text()} (${m.location().url})`); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
    page.on('requestfailed', r => errors.push('Không tải được: ' + r.url()));

    await page.goto(pageUrl('code-lab.html'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.codeLab && window.CodeLabEditor);
    assert.match(await page.title(), /Phòng lập trình/);
    assert.match(await page.locator('#map-name').innerText(), /Về đích/);
    assert.equal(await page.locator('#world').isVisible(), true);

    // Khay → dải khối và chạy từng khối: dừng trước khối Chờ, sau Tiến 1 giây.
    await page.locator('#toolbox .cl-tool').filter({ hasText: 'Tiến' }).first().click();
    assert.deepEqual(await page.evaluate(() => codeLab.state.blocks.map(b => b.t)), ['start', 'move']);
    await page.locator('#toolbox .cl-tool').filter({ hasText: 'Chờ' }).first().click();
    assert.deepEqual(await page.evaluate(() => codeLab.state.blocks.map(b => b.t)), ['start', 'move', 'wait']);
    await page.locator('#btn-step').click();
    await page.waitForFunction(() => codeLab.sim.paused, null, { timeout: 10000 });
    const step = await page.evaluate(() => ({ active: codeLab.sim.active, t: codeLab.sim.t, x: codeLab.sim.robot.x }));
    assert.equal(step.active, 2, 'Từng khối phải dừng trước khối thứ 3 (Chờ)');
    assert.ok(step.t >= 0.95 && step.t <= 1.1, `Tiến phải chạy hết 1 giây trước khi dừng: ${step.t}`);
    assert.ok(step.x > 25, 'Xe phải thực sự di chuyển trong bước Tiến');
    assert.equal(await page.locator('#program .cl-block.is-active').getAttribute('data-i'), '2');

    // Sa bàn Bé: chương trình gợi ý về đích, hiển thị kết quả có sao.
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#btn-hint').click();
    assert.deepEqual(await page.evaluate(() => codeLab.state.blocks.map(b => b.t)), ['start', 'move', 'stop']);
    await page.locator('#btn-run').click();
    await page.locator('#result').waitFor({ state: 'visible', timeout: 20000 });
    assert.match(await page.locator('#result-text').innerText(), /Tới đích rồi/);
    assert.ok(await page.locator('#result-stars .on').count() >= 1, 'Phải có ít nhất 1 sao');
    assert.equal(await page.evaluate(() => codeLab.sim.result.ok), true);

    // Sa bàn Lớp 3+: xe chờ cảm biến rồi dừng trước tường trong ô đích.
    await page.locator('[data-level="pro"]').click();
    await page.locator('#btn-maps').click();
    await page.locator('#map-grid .cl-map-card').filter({ hasText: 'Dừng trước tường' }).click();
    assert.match(await page.locator('#map-name').innerText(), /Dừng trước tường/);
    await page.locator('#btn-hint').click();
    assert.deepEqual(await page.evaluate(() => codeLab.state.blocks.map(b => b.t)), ['start', 'move', 'waitUntil', 'stop']);
    await page.locator('#btn-run').click();
    await page.locator('#result').waitFor({ state: 'visible', timeout: 30000 });
    assert.equal(await page.evaluate(() => codeLab.sim.result.ok), true, 'Gợi ý phải hoàn thành sa bàn Dừng trước tường');
    assert.ok(await page.locator('#result-stars .on').count() >= 1);

    // Trình vẽ: kéo Ô đích, lưu, thấy sa bàn mới trong danh sách.
    await page.locator('#btn-editor').click();
    await page.locator('#editor-dialog').waitFor({ state: 'visible' });
    await page.locator('#ed-name').fill('Sa bàn smoke 74b');
    await page.locator('#ed-tools [data-tool="goal"]').click();
    const bounds = await page.locator('#ed-canvas').boundingBox();
    assert.ok(bounds && bounds.width > 100 && bounds.height > 100, 'Canvas vẽ phải nhìn thấy');
    await page.mouse.move(bounds.x + bounds.width * 0.6, bounds.y + bounds.height * 0.45);
    await page.mouse.down();
    await page.mouse.move(bounds.x + bounds.width * 0.75, bounds.y + bounds.height * 0.65, { steps: 4 });
    await page.mouse.up();
    await page.locator('#ed-save').click();
    assert.equal(await page.locator('#editor-dialog').evaluate(el => el.open), false, 'Đặt được ô đích rồi phải lưu được');
    assert.match(await page.locator('#map-name').innerText(), /Sa bàn smoke 74b/);
    assert.ok(await page.evaluate(() => codeLab.state.mapId.startsWith('tu-ve-')));
    await page.locator('#btn-maps').click();
    assert.equal(await page.locator('#map-grid .cl-map-card').filter({ hasText: 'Sa bàn smoke 74b' }).count(), 1);
    await page.locator('#maps-dialog form button').click();

    const overflow = await page.evaluate(() => ({ width: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
    assert.ok(overflow.content <= overflow.width, `Trang tràn ngang ở 1024×768: ${JSON.stringify(overflow)}`);
    assert.deepEqual(errors, [], 'Trang có lỗi JavaScript, console hoặc tải tệp');
    console.log('PASS: Code Lab mở, thêm khối, từng khối, 2 sa bàn gợi ý đạt sao, vẽ/lưu sa bàn, không tràn ngang 1024×768.');
  } finally {
    await browser.close();
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
