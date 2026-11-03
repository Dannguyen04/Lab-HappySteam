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
    // Xe là mô hình kit thật (79a): nạp bất đồng bộ, xong thì container gắn data-car-source=kit
    await page.waitForSelector('#world-3d[data-car-source="kit"]', { state: 'attached', timeout: 15000 });
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
    assert.equal(await page.locator('#robot3d canvas').isVisible(), true, 'Lắp robot phải có xe 3D trên tấm đế');
    await page.waitForSelector('#robot3d[data-car-source="kit"]', { state: 'attached', timeout: 15000 });
    await page.locator('#sensor-deck .rs-part[data-sensor="line"]').click();
    assert.equal(await page.evaluate(() => codeLab.state.sensors.line), null);
    assert.equal(await page.locator('#sensor-deck .rs-part[data-sensor="line"]').getAttribute('aria-pressed'), 'false');
    assert.match(await page.locator('#robot-ports-summary').innerText(), /P3 trống/);
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

    // 8. Thi đấu Super Track: chọn sân, chạy gợi ý, đọc điểm trực tiếp và chi tiết.
    await page.locator('.cl-nav-tab[data-screen="home"]').click();
    await page.locator('#home-btn-quickstart').click();
    if (await page.locator('#theme-detail').isVisible()) await page.locator('#theme-back').click();
    await page.locator('.rs-theme[data-theme="contest"]').click();
    await page.locator('.rs-map-item[data-map="st-tinh-te"]').click();
    assert.match(await page.locator('#detail-about').innerText(), /Super AI/);
    await noOverflow('Sân thi đấu đầy đủ');
    await page.locator('#detail-start').click();
    await page.locator('.cl-nav-tab[data-screen="sim"]').click();
    await page.locator('#world-3d canvas').waitFor({ state: 'visible', timeout: 10000 });
    assert.equal(await page.evaluate(() => codeLab.sim.map.id), 'st-tinh-te');
    await noOverflow('3D sân thi đấu đầy đủ');
    await page.locator('.cl-nav-tab[data-screen="home"]').click();
    await page.locator('#home-btn-quickstart').click();
    if (await page.locator('#theme-detail').isVisible()) await page.locator('#theme-back').click();
    await page.locator('.rs-theme[data-theme="contest"]').click();
    await page.locator('.rs-map-item[data-map="st-tap-duot"]').click();
    assert.match(await page.locator('#detail-goals').innerText(), /Rời bến/);
    await noOverflow('Chủ đề thi đấu');
    await page.locator('#detail-start').click();
    await page.locator('#btn-hint').click();
    await page.evaluate(() => { codeLab.state.speed = 4; });
    assert.equal((await page.locator('#bar-score').innerText()).trim(), '0');
    await page.locator('#btn-code-run').click();
    await page.locator('#result').waitFor({ state: 'visible', timeout: 30000 });
    assert.equal(await page.evaluate(() => codeLab.sim.result.ok), true, 'Gợi ý thi đấu về bến B');
    assert.ok(Number(await page.locator('#bar-score').innerText()) > 0, 'Thanh cúp phải là điểm số > 0');
    assert.match(await page.locator('#result-sub').innerText(), /150 điểm/);
    assert.match(await page.locator('#result-score-items').innerText(), /Rời bến A.*60 điểm/);
    await noOverflow('Kết quả thi đấu');

    // 9. Thiết kế sa bàn 3D (79b): mở từ menu ☰ và ô trang chủ, đặt tường + ô đích + xuất phát, lưu, chạy trong "Sa bàn của lớp"
    await page.locator('#btn-file').click();
    await page.locator('#btn-editor').click();
    assert.equal(await page.locator('#screen-design').isVisible(), true, 'Menu ☰ "Thiết kế sa bàn…" phải mở màn thiết kế');
    await page.locator('.cl-nav-tab[data-screen="home"]').click();
    await page.locator('#home-btn-editor').click();
    assert.equal(await page.locator('#screen-design').isVisible(), true, 'Ô "Thiết kế sa bàn" phải mở màn thiết kế');
    assert.equal(await page.locator('#tab-design').getAttribute('aria-selected'), 'true');
    await page.locator('#design-3d canvas').waitFor({ state: 'visible', timeout: 10000 });
    assert.ok(await page.locator('#dz-tray .dz-tool').count() >= 15, 'Khay đạo cụ đủ ô (cả vật thi đấu)');
    for (const t of ['wall', 'box', 'line', 'zone-red', 'zone-green', 'zone-blue', 'zone-yellow', 'flag', 'goal', 'start', 'marker', 'dockA', 'dockB', 'ramp', 'button'])
      assert.equal(await page.locator(`#dz-tray .dz-tool[data-tool="${t}"]`).count(), 1, 'Thiếu ô đạo cụ ' + t);
    await noOverflow('Thiết kế sa bàn');
    await page.locator('#dz-name').fill('Sân thử 79b');
    await page.locator('#dz-size').selectOption('200x120');
    // Chạm ô đạo cụ rồi chạm lên sân (tọa độ cm → điểm ảnh qua camera 3D)
    const placeAt = async (tool, x, y) => {
      await page.locator(`#dz-tray .dz-tool[data-tool="${tool}"]`).click();
      const p = await page.evaluate(([x, y]) => CodeLabDesigner.toScreen(x, y), [x, y]);
      await page.mouse.click(p.x, p.y);
    };
    await placeAt('start', 30, 60);
    await placeAt('wall', 100, 30);
    await placeAt('goal', 160, 60);
    assert.equal((await page.locator('#dz-count').innerText()).trim(), '2', 'Đếm 2 đạo cụ (tường + ô đích)');
    const d = await page.evaluate(() => CodeLabDesigner.draft);
    assert.deepEqual([d.start.x, d.start.y], [30, 60], 'Xe đặt đúng chỗ chạm, bắt lưới 5 cm');
    const goal = d.items.find(i => i.k === 'zone' && i.goal), wall = d.items.find(i => i.k === 'wall');
    assert.ok(goal && Math.abs(goal.x + goal.w / 2 - 160) <= 5 && Math.abs(goal.y + goal.h / 2 - 60) <= 5, 'Ô đích đúng chỗ chạm');
    assert.ok(wall && Math.abs(wall.x + wall.w / 2 - 100) <= 5, 'Tường đúng chỗ chạm');
    // Chọn tường → xoay 90° → hoàn tác / làm lại bằng phím
    const wp = await page.evaluate(() => { const w = CodeLabDesigner.draft.items.find(i => i.k === 'wall'); return CodeLabDesigner.toScreen(w.x + w.w / 2, w.y + w.h / 2); });
    await page.mouse.click(wp.x, wp.y);
    assert.match(await page.locator('#dz-sel-name').innerText(), /Tường/);
    await page.locator('#dz-rotate').click();
    assert.ok(await page.evaluate(() => { const w = CodeLabDesigner.draft.items.find(i => i.k === 'wall'); return w.h > w.w; }), 'Xoay 90° đổi chiều tường');
    await page.locator('#dz-delete').click();
    assert.equal((await page.locator('#dz-count').innerText()).trim(), '1');
    await page.keyboard.press('Control+z');
    assert.equal((await page.locator('#dz-count').innerText()).trim(), '2', 'Ctrl+Z trả lại tường');
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+y');
    assert.ok(await page.evaluate(() => { const w = CodeLabDesigner.draft.items.find(i => i.k === 'wall'); return w && w.h > w.w; }), 'Ctrl+Y làm lại phép xoay');
    await noOverflow('Thiết kế sa bàn sau khi đặt');
    await page.locator('#dz-save').click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('codelab.maps') || '[]'));
    assert.equal(saved.length, 1);
    assert.equal(saved[0].name, 'Sân thử 79b');
    assert.deepEqual(saved[0].size, [200, 120]);
    assert.ok(saved[0].custom && saved[0].items.filter(i => i.k === 'wall').length === 5, 'Lưu đúng định dạng map (4 tường khung + 1 tường)');
    // Sa bàn mới hiện ở chủ đề "Sa bàn của lớp" và chạy được về đích
    await page.locator('.cl-nav-tab[data-screen="home"]').click();
    await page.locator('#home-btn-quickstart').click();
    if (await page.locator('#theme-detail').isVisible()) await page.locator('#theme-back').click();
    await page.locator('.rs-theme[data-theme="class"]').click();
    await page.locator('.rs-map-item').filter({ hasText: 'Sân thử 79b' }).click();
    await page.locator('#detail-start').click();
    assert.match(await page.locator('#map-name').innerText(), /Sân thử 79b/);
    await page.locator('.cl-nav-tab[data-screen="sim"]').click();
    await page.evaluate(() => {
      codeLab.state.speed = 4;
      codeLab.state.blocks = [CodeLab.make('start'), CodeLab.make(['move', { dir: 'fwd', speed: 75, sec: 8 }])];
    });
    await page.locator('#btn-run').click();
    await page.locator('#result').waitFor({ state: 'visible', timeout: 30000 });
    assert.equal(await page.evaluate(() => codeLab.sim.result.ok), true, 'Xe chạy thẳng về ô đích của sa bàn vừa thiết kế');

    assert.deepEqual(errors, [], 'Không được có lỗi console/mạng');
    console.log('PASS: Phòng lập trình – luồng cũ, Super Track 3D, gợi ý thi đấu 150 điểm, thiết kế sa bàn 3D lưu và chạy được, không lỗi console/mạng, không tràn 1024×768.');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
