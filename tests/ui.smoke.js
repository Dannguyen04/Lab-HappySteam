// Chạy với Playwright có sẵn: node tests/ui.smoke.js
// Có thể đặt NODE_PATH tới một thư mục node_modules chứa playwright.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  console.error('Thiếu Playwright. Cài riêng công cụ kiểm thử hoặc đặt NODE_PATH.');
  process.exit(2);
}

async function main() {
  const executablePath = [
    process.env.ZM_CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean).find(p => fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const url = 'file:///' + path.join(path.resolve(__dirname, '..'), 'index.html').replace(/\\/g, '/');
    const shots = path.join(__dirname, 'screenshots');
    fs.mkdirSync(shots, { recursive: true });
    const stats = page => page.evaluate(() => window.robotViewer.stats());
    const parentOfApp = page => page.evaluate(() => document.getElementById('app').parentElement.id);

    const page = await browser.newPage({ viewport: { width: 1366, height: 860 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(url);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer, null, { timeout: 20000 });
    assert.match(await page.title(), /Vệ tinh ZMrobo/);
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light', 'Mặc định giao diện sáng như Bài 7');
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/4 nhiệm vụ');

    // ---- Chặng 1: lắp ráp 28 bước ----
    assert.equal(await page.locator('#tab-btn-asm').getAttribute('aria-selected'), 'true');
    assert.ok(await page.locator('#stage-assembly').isVisible());
    assert.ok(await page.locator('#stage-sim').isHidden(), 'Chỉ hiện một chặng');
    assert.equal(await parentOfApp(page), 'subview-base');
    const s0 = await stats(page);
    assert.equal(s0.instances, 61);
    assert.equal(s0.meshes, 34, '32 mesh CAD + 2 mesh cảm biến minh họa');
    assert.equal(s0.animating, false, 'Chế độ giảm chuyển động: không chạy hoạt ảnh lắp');
    const box = await page.locator('#view').boundingBox();
    assert.ok(box.width > 600 && box.height > 300, 'Khung 3D đủ lớn trên desktop');

    for (const [step, visible, added] of [[9, 20, 3], [21, 3, 3], [28, 61, 0]]) {
      await page.evaluate(s => window.robotViewer.setStep(s), step);
      await page.waitForTimeout(120);
      assert.equal((await stats(page)).visible, visible, `Bước ${step}: số linh kiện hiển thị`);
      assert.equal(await page.locator('#countNow').innerText(), String(step));
      assert.equal(await page.locator('#am-added').innerText(), String(added), `Bước ${step}: đồng hồ linh kiện mới`);
      assert.match(await page.locator('#book-img').getAttribute('src'), new RegExp(`step-${String(step).padStart(2, '0')}\\.jpg$`),
        `Bước ${step}: hình sách theo bước đang xem`);
      if (step === 9) await page.screenshot({ path: path.join(shots, 'assembly-desktop.png'), fullPage: true });
    }
    assert.match(await page.locator('#book-loc').innerText(), /Bước 28 · trang 15/);
    assert.match(await page.locator('#am-step-s').innerText(), /Ghép cụm/);
    await page.evaluate(() => window.robotViewer.setStep(20));
    await page.waitForTimeout(80);
    assert.match(await page.locator('#book-img').getAttribute('src'), /step-19\.jpg$/, 'Bước 20 dùng hình bước 19');
    assert.match(await page.locator('#book-cap').innerText(), /Bước 20 chỉ xoay/);
    assert.match(await page.locator('#book-pdf').getAttribute('href'), /#page=11$/);
    await page.evaluate(() => window.robotViewer.setStep(21));
    await page.waitForTimeout(80);
    assert.match(await page.locator('#am-step-s').innerText(), /Cụm đầu vệ tinh 1\/7/);
    assert.ok(await page.locator('#pli').isHidden(), 'Không lặp ô linh kiện nổi trên khung 3D');

    // ---- Chặng 2: xưởng sáng tạo ----
    await page.click('#tab-btn-creative');
    await page.waitForFunction(() => document.getElementById('app').parentElement.id === 'creative-stage' &&
      window.robotViewer.stats().creative === 0);
    assert.equal((await stats(page)).visible, 61, 'Xưởng mở trên mô hình hoàn chỉnh');
    await page.click('[data-preset="sensor"]');
    assert.equal((await stats(page)).creative, 1, 'Gói cảm biến: 1 mô-đun');
    await page.click('[data-slot="head"][data-option="dish"]');
    assert.equal((await stats(page)).creative, 4, 'Chảo ra-đa: trục + bạc + bánh răng');
    assert.match(await page.locator('#creative-bom').innerText(), /Bánh răng 40 răng/);
    assert.ok(await page.locator('#creative-short').isHidden(), 'Kit còn đủ cho cảm biến và chảo');
    assert.equal(await page.locator('#creative-kit').innerText(), 'Đủ');
    await page.click('[data-preset="solar"]');
    assert.equal((await stats(page)).creative, 6, 'Cánh pin kép: thêm 2 khung');
    assert.match(await page.locator('#creative-short').innerText(), /Khung 5×7 \(cánh pin\) thiếu 2/);
    assert.equal(await page.locator('#creative-kit').innerText(), 'Thiếu 2');
    assert.equal(await page.locator('#creative-features li').count(), 3);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(shots, 'creative-desktop.png'), fullPage: true });
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'), 'true', 'Thử trong sa bàn mở chặng 3');
    // Chặng 3 mở bằng cảnh câu chuyện; 3D chỉ hiện khi bấm "Xem robot thật"
    assert.ok(await page.locator('#space-scene').isVisible(), 'Cảnh câu chuyện là khung chính');
    assert.equal(await parentOfApp(page), 'subview-base', 'Không hiện 3D cùng lúc với cảnh câu chuyện');
    assert.equal(await page.evaluate(() => window.simEngine.running), false, 'Không tự chạy khi mở chặng 3');
    assert.ok(await page.locator('#scene-idle').isVisible(), 'Gợi ý chạm Start khi chưa chạy');
    await page.click('#scene-toggle');
    assert.equal(await parentOfApp(page), 'sim-stage', 'Xem robot thật: hiện 3D quay theo chương trình');
    assert.ok(await page.locator('#space-scene').isHidden());
    await page.click('#scene-toggle');
    assert.equal(await parentOfApp(page), 'subview-base');
    // Chạm khối Start màu vàng để chạy, như phần mềm ZMrobo
    await page.click('#program-canvas-chain .zb-block-start');
    assert.equal(await page.evaluate(() => window.simEngine.running), true, 'Chạm Start phải chạy chương trình');
    await page.click('#btn-stop-program');
    // Chế độ Bé ẩn số đo; Nâng cao hiện lại
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'kid');
    assert.ok(await page.locator('#m-motor').isHidden(), 'Chế độ Bé không hiện số đo');
    await page.click('#btn-mode');
    assert.ok(await page.locator('#m-motor').isVisible(), 'Nâng cao hiện số đo');
    await page.click('#btn-mode');
    const badge = await page.locator('#sim-active-upgrade-badge').textContent();
    for (const word of ['Pin kép', 'Chảo ra-đa', 'Cảm biến']) assert.ok(badge.includes(word), `Sa bàn thiếu gói: ${word}`);
    await page.click('#tab-btn-asm');
    assert.equal(await parentOfApp(page), 'subview-base');
    assert.equal((await stats(page)).creative, null, 'Rời xưởng: không còn chi tiết gắn thêm');
    await page.click('#tab-btn-creative');
    await page.click('#creative-reset');
    assert.equal((await stats(page)).creative, 0);

    // ---- Giao diện tối được nhớ ----
    await page.click('#btn-toggle-theme');
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.reload();
    await page.waitForFunction(() => window.robotViewer, null, { timeout: 20000 });
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    assert.equal(await page.locator('#tab-btn-creative').getAttribute('aria-selected'), 'true', 'Nhớ chặng đang học');
    await page.click('#btn-toggle-theme');

    // ---- Cả 4 nhiệm vụ qua giao diện, như học sinh làm lần lượt ----
    const badgeHas = text => page.waitForFunction(
      t => document.getElementById('mission-summary-badge')?.textContent?.includes(t), text, { timeout: 15000 });
    await page.click('#tab-btn-asm');
    await page.evaluate(() => {
      for (let s = 1; s <= 28; s++) {
        window.robotViewer.setStep(s);
        if (!/bỏ/.test(document.getElementById('doneBtn').textContent)) document.getElementById('doneBtn').click();
      }
    });
    await badgeHas('1/4');
    assert.equal(await page.locator('#am-done').innerText(), '28/ 28');
    await page.click('#tab-btn-creative');
    await page.click('[data-preset="radar"]');
    await page.click('#creative-deploy');
    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-load-sample');
    assert.equal(await page.locator('#ghost-score').textContent(), 'Đúng 9/9 khối');
    assert.match(await page.locator('#mc-title').innerText(), /Nhiệm vụ 2/);
    await page.click('#btn-run-program');
    await badgeHas('3/4');
    assert.match(await page.locator('#mc-title').innerText(), /Nhiệm vụ 3/, 'Thẻ nhiệm vụ chuyển sang NV3');
    assert.ok(await page.locator('#ghost-wrap').isHidden(), 'Xong NV2 thì ẩn hàng mẫu');
    await page.screenshot({ path: path.join(shots, 'simulation-desktop.png'), fullPage: true });
    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-clear-code');
    for (const title of ['Motor Power', 'Melody B', 'Stop'])
      await page.locator(`#block-toolbox button[title="Thêm khối ${title}"]`).click();
    for (let i = 0; i < 4; i++) await page.locator('#program-canvas-chain .zb-block[data-power]').click();
    assert.equal(await page.locator('#program-canvas-chain .zb-block[data-power]').getAttribute('data-power'), '4');
    await page.click('#btn-run-program');
    await badgeHas('4/4');
    await page.waitForFunction(() => !window.simEngine.running, null, { timeout: 3000 });
    assert.match(await page.locator('#scene-toast-title').innerText(), /Giỏi quá/);
    assert.ok(await page.locator('#victory-modal').isVisible(), 'Đạt 4 nhiệm vụ phải hiện bảng hoàn thành');
    assert.match(await page.locator('#verify-code-output').innerText(), /^ZM9-/);

    // ---- Nâng cao (cấp 2–3): NV5 đợi thiên thạch bay qua, NV6 chụp ảnh vật lạ gửi về trạm ----
    await page.click('#btn-close-victory');
    assert.ok(await page.locator('#chip-m5').isHidden(), 'Chế độ Bé không hiện NV5');
    assert.ok(await page.locator('#block-toolbox button[title="Thêm khối Chụp ảnh gửi về"]').isHidden(), 'Chế độ Bé không có khối Nâng cao');
    await page.click('#btn-mode');
    await badgeHas('4/6');
    assert.equal(await page.evaluate(() => window.simEngine.advanced), true, 'Nâng cao bật thiên thạch bay qua');
    assert.match(await page.locator('#mc-title').innerText(), /Nhiệm vụ 5/);
    await page.click('#tab-btn-creative');
    await page.click('[data-preset="sensor"]');
    await page.click('#creative-deploy');
    const add = title => page.locator(`#block-toolbox button[title="Thêm khối ${title}"]`).click();
    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-clear-code');
    for (const title of ['Motor Power', 'Chờ vật cản', 'Stop', 'Đợi đường trống', 'Motor Power']) await add(title);
    await page.click('#btn-run-program');
    await badgeHas('5/6');
    assert.match(await page.locator('#mc-title').innerText(), /Nhiệm vụ 6/);
    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-clear-code');
    await add('Motor Power');
    for (let i = 0; i < 4; i++) await page.locator('#program-canvas-chain .zb-block[data-power]').click();
    await add('Nếu thấy vật lạ');
    await add('Chụp ảnh gửi về');
    const chain = await page.locator('#program-canvas-chain .zb-block .zb-text-tag').allTextContents();
    assert.deepEqual(chain, ['Start', 'Repeat Start', 'Motor Power', 'Nếu thấy vật lạ', 'Chụp ảnh gửi về', 'Hết Nếu', 'Repeat End'],
      'Khối thêm sau khối Nếu phải nằm bên trong: ' + chain);
    assert.equal(await page.locator('#program-canvas-chain .zb-in-if').count(), 1);
    await page.click('#btn-run-program');
    await badgeHas('6/6');
    await page.waitForTimeout(1400);
    await page.locator('#scene-wrap').screenshot({ path: path.join(shots, 'scene-advanced.png') });
    await page.click('#btn-stop-program');
    await page.click('#btn-mode');
    await badgeHas('4/4');
    assert.equal(await page.evaluate(() => window.simEngine.advanced), false);
    assert.deepEqual(errors, [], 'Không được có lỗi JavaScript trên desktop');

    // ---- Điện thoại 375 px ----
    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true, deviceScaleFactor: 1 });
    const mobileErrors = [];
    mobile.on('pageerror', err => mobileErrors.push(err.message));
    await mobile.goto(url);
    await mobile.evaluate(() => localStorage.clear());
    await mobile.reload();
    await mobile.waitForFunction(() => window.robotViewer, null, { timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      await mobile.waitForTimeout(300);
      const d = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(d[0] <= d[1], `375px bị tràn ngang ở ${tab}: ${d}`);
    }
    await mobile.click('#tab-btn-asm');
    await mobile.waitForTimeout(300);
    const mv = await mobile.locator('#view').boundingBox();
    assert.ok(mv.width >= 300 && mv.height > 280, `3D trên điện thoại thiếu kích thước: ${JSON.stringify(mv)}`);
    await mobile.evaluate(() => window.robotViewer.setStep(1));
    await mobile.click('#next');
    assert.equal(await mobile.evaluate(() => window.robotViewer.stats().animating), true, 'Bước mới phải có hoạt ảnh lắp');
    await mobile.waitForTimeout(1600);
    assert.equal(await mobile.evaluate(() => window.robotViewer.stats().animating), false, 'Hoạt ảnh phải kết thúc');
    await mobile.screenshot({ path: path.join(shots, 'assembly-mobile.png'), fullPage: true });
    assert.deepEqual(mobileErrors, [], 'Không được có lỗi JavaScript trên mobile');
    console.log('PASS: 3 chặng, hình sách + đồng hồ theo bước, xưởng sáng tạo, sa bàn 3D, sáng/tối được nhớ, 4/4 nhiệm vụ, không tràn 375px.');
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
