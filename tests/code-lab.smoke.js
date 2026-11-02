// Smoke Phòng lập trình (giao diện RoboSim) – chạy từ tests/run-suite.js với BASE_URL HTTP.
// Trang nạp Blockly/three bằng import module nên cần Vite (npm run test:dist hoặc BASE_URL của vite dev/preview).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

(async () => {
  // Server tĩnh trả code-lab.html gốc: import 'blockly' không phân giải được → bỏ qua, kiểm ở test:dist
  const html = await (await fetch(pageUrl('code-lab.html'))).text();
  if (!/@vite\/client|assets\//.test(html)) {
    console.log('SKIP: code-lab cần Vite (npm run test:dist hoặc BASE_URL của vite dev/preview).');
    return;
  }
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
    page.on('dialog', d => d.accept());

    await page.goto(pageUrl('code-lab.html'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.codeLab && window.CodeLabBlocksVertical && window.CodeLabPython, null, { timeout: 15000 });
    assert.match(await page.title(), /Phòng lập trình/);

    const noOverflow = async where => {
      const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(o <= 1, `${where}: tràn ngang ${o}px ở 1024×768`);
    };

    // 1. Các màn chuyển qua lại bằng nút vuông trên thanh (kiểu RoboSim)
    for (const screen of ['home', 'robot', 'code', 'sim', 'home']) {
      await page.locator(`.cl-nav-tab[data-screen="${screen}"]`).click();
      assert.equal(await page.locator(`#screen-${screen}`).isVisible(), true, `Màn ${screen} phải hiện`);
      assert.equal(await page.locator('.cl-nav-tab.is-active').getAttribute('data-screen'), screen);
      await noOverflow('Màn ' + screen);
    }
    assert.equal(await page.locator('#home-robot3d canvas').isVisible(), true, 'Trang chủ phải có xe 3D ở giữa');
    assert.equal(await page.locator('#screen-home .rs-tile').count(), 6, 'Trang chủ có 6 ô như RoboSim');

    // 2. Luyện theo chủ đề → Nâng cao → "Đếm vạch" (ảnh 3D lớn + danh sách) → Bắt đầu → nạp gợi ý
    await page.locator('#home-btn-quickstart').click();
    assert.equal(await page.locator('#screen-maps').isVisible(), true);
    assert.ok(await page.locator('#theme-grid .rs-theme').count() >= 3, 'Phải có các chủ đề Cơ bản/Nâng cao/Sân tự do');
    await page.locator('.rs-theme[data-theme="pro"]').click();
    await page.locator('.rs-map-item').filter({ hasText: 'Đếm vạch' }).click();
    assert.equal(await page.locator('#map-preview canvas').isVisible(), true, 'Phải có ảnh xem trước sa bàn');
    assert.match(await page.locator('#detail-about').innerText(), /vạch/);
    await noOverflow('Chọn sa bàn');
    await page.locator('#detail-start').click();
    assert.equal(await page.locator('#screen-code').isVisible(), true);
    assert.match(await page.locator('#map-name').innerText(), /Đếm vạch/);
    await page.locator('#btn-hint').click();
    const hintTypes = await page.evaluate(() => codeLab.state.blocks.map(b => b.t));
    assert.ok(hintTypes.includes('setVar') && hintTypes.includes('forever'), 'Gợi ý Đếm vạch dùng biến và lặp mãi');
    const roundTrip = await page.evaluate(() => CodeLabBlocksVertical.toFlatBlocks().map(b => b.t));
    assert.deepEqual(roundTrip, hintTypes, 'Khối dọc phải dịch ra đúng chuỗi khối phẳng');
    assert.ok(await page.evaluate(() => CodeLabBlocksVertical.workspace.getAllBlocks(false).length) > hintTypes.length,
      'Blockly phải dựng đủ khối (kèm khối số/biểu thức)');
    const area = await page.locator('#blockly-div').boundingBox();
    assert.ok(area && area.height > 300, `Vùng khối Blockly phải có chiều cao thật: ${area && area.height}px`);
    assert.equal(await page.locator('.blocklyToolbox').isVisible(), true, 'Cột nhóm khối phải hiện');
    const py = await page.locator('#python-code').innerText();
    assert.match(py, /dem = 0/);
    assert.match(py, /while True:/);
    assert.match(py, /show_variable\("dem"/);

    // 3. Chạy → khối được tô sáng → có kết quả, biến hiện trên bảng cảm biến
    await page.evaluate(() => {
      window.__lit = new Set();
      const orig = CodeLabBlocksVertical.highlightBlock;
      CodeLabBlocksVertical.highlightBlock = id => { if (id) window.__lit.add(id); return orig(id); };
      codeLab.state.speed = 4;
    });
    await page.locator('#btn-code-run').click();
    assert.equal(await page.locator('#screen-sim').isVisible(), true);
    await page.locator('#result').waitFor({ state: 'visible', timeout: 30000 });
    assert.equal(await page.evaluate(() => codeLab.sim.result.ok), true, 'Gợi ý phải hoàn thành sa bàn Đếm vạch');
    assert.ok(await page.locator('#result-stars .on').count() >= 1, 'Phải có ít nhất 1 sao');
    // khối tức thì xong trong một khung hình nên chỉ chắc thấy các khối có thời gian (Chờ đến khi…)
    assert.ok(await page.evaluate(() => [...window.__lit].some(id => CodeLabBlocksVertical.workspace.getBlockById(id))),
      'Phải tô sáng khối Blockly khi chạy');
    await page.locator('#btn-stats').click();
    assert.equal(await page.locator('#sensor-panel').isVisible(), true, 'Nút bảng cảm biến phải mở bảng');
    assert.match(await page.locator('#s-vars').innerText(), /dem: \d+/);
    assert.ok(parseFloat(await page.locator('#bar-timer').innerText()) > 1, 'Đồng hồ trên thanh phải chạy');
    assert.match(await page.locator('#bar-score').innerText(), /★/, 'Cúp trên thanh phải hiện sao đạt được');
    assert.match(await page.locator('#s-timer').innerText(), /\d+ ms/);
    await noOverflow('Mô phỏng');

    // 4. Sân 3D là mặc định, phủ đúng khung; chuyển 2D rồi về 3D không lỗi
    await page.locator('#world-3d canvas').waitFor({ state: 'visible', timeout: 10000 });
    assert.equal(await page.evaluate(() => codeLab.state.viewMode), '3d');
    const [box3d, wrap] = [await page.locator('#world-3d').boundingBox(), await page.locator('#canvas-wrap').boundingBox()];
    assert.ok(Math.abs(box3d.y - wrap.y) < 2 && Math.abs(box3d.height - wrap.height) < 2, '3D phải phủ đúng khung sa bàn, không nằm dưới');
    await page.locator('#btn-reset').click();
    await page.locator('#btn-run').click();
    await page.waitForFunction(() => codeLab.sim.t > 0.5, null, { timeout: 10000 });
    await page.locator('#btn-view3d').click();
    assert.equal(await page.locator('#world-3d').isHidden(), true);
    assert.equal(await page.evaluate(() => codeLab.state.viewMode), '2d');
    await page.locator('#btn-view3d').click();
    assert.equal(await page.evaluate(() => codeLab.state.viewMode), '3d');

    // 5. Gỡ cảm biến Dò vạch ở Lắp robot → khối dò vạch mờ trong khay, chạy bị chặn với lời nhắc
    await page.locator('.cl-nav-tab[data-screen="robot"]').click();
    await page.locator('#sensor-deck .cl-sensor-card').filter({ hasText: 'Dò vạch' }).getByRole('button').click();
    assert.equal(await page.evaluate(() => codeLab.state.sensors.line), null);
    await page.locator('.cl-nav-tab[data-screen="code"]').click();
    await page.locator('.blocklyToolboxCategory, .blocklyTreeRow').filter({ hasText: 'Dò vạch' }).first().click();
    await page.waitForFunction(() => {
      const ws = CodeLabBlocksVertical.workspace.getFlyout()?.getWorkspace();
      const b = ws && ws.getAllBlocks(false).find(x => x.type === 'block_line_follow');
      return b && !b.isEnabled();
    }, null, { timeout: 5000 });
    await page.locator('#btn-code-run').click();
    assert.match(await page.locator('#msg').innerText(), /Chưa gắn cảm biến Dò vạch/);
    assert.equal(await page.evaluate(() => codeLab.sim.running), false);
    await page.locator('.cl-nav-tab[data-screen="robot"]').click();
    await page.locator('#robot-btn-reset-default').click();

    // 6. Chọn sa bàn khác từ thanh trên khi đang ở màn khối dọc → Blockly nạp chương trình mới
    await page.locator('.cl-nav-tab[data-screen="code"]').click();
    await page.locator('#btn-maps').click();
    await page.locator('#map-grid .cl-map-card').filter({ hasText: 'Dừng trước tường' }).click();
    await page.locator('#btn-hint').click();
    assert.deepEqual(await page.evaluate(() => CodeLabBlocksVertical.toFlatBlocks().map(b => b.t)),
      ['start', 'move', 'waitUntil', 'stop']);
    await page.locator('#btn-code-run').click();
    await page.locator('#result').waitFor({ state: 'visible', timeout: 30000 });
    assert.equal(await page.evaluate(() => codeLab.sim.result.ok), true, 'Gợi ý phải hoàn thành Dừng trước tường');

    // 7. Chế độ Bé (khối ngang) vẫn dùng được
    await page.locator('.cl-nav-tab[data-screen="code"]').click();
    await page.locator('[data-block-mode="horizontal"]').click();
    assert.equal(await page.locator('#cl-horizontal-container').isVisible(), true);
    assert.ok(await page.locator('#toolbox .cl-tool').count() > 3);
    await noOverflow('Khối ngang');
    await page.locator('[data-block-mode="vertical"]').click();

    assert.deepEqual(errors, [], 'Không được có lỗi console/mạng');
    console.log('PASS: Phòng lập trình – trang chủ xe 3D + 6 ô, chọn sa bàn theo chủ đề, khối dọc ↔ Python, chạy + tô sáng + sao, 3D bật/tắt, gỡ cảm biến, đổi sa bàn, khối ngang, không tràn 1024×768.');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
