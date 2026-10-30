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
  const browserCandidates = [
    process.env.ZM_CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean);
  const executablePath = browserCandidates.find(p => fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const base = path.resolve(__dirname, '..');
    const url = 'file:///' + path.join(base, 'index.html').replace(/\\/g, '/');
    const screenshots = path.join(__dirname, 'screenshots');
    fs.mkdirSync(screenshots, { recursive: true });

    const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    await page.goto(url);
    await page.waitForTimeout(800);
    assert.match(await page.title(), /ZMrobo/);
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/4 NV');
    assert.ok(await page.locator('#sim-canvas-2d').evaluate(el => el.width > 0));

    await page.click('#tab-btn-asm');
    await page.waitForTimeout(900);
    assert.equal(await page.locator('#tab-assembly').getAttribute('class'), 'tab-pane is-active');
    assert.ok(await page.locator('#subview-official').evaluate(el => el.classList.contains('active')),
      'Hình bài giảng phải là tab lắp ráp mặc định');
    assert.equal(await page.locator('.official-step-chip').count(), 27);
    assert.equal(await page.locator('[data-official-step="20"]').count(), 0,
      'PDF không in bước 20: không tự bịa thêm bước');
    await page.waitForFunction(() => document.querySelector('#official-step-image')?.naturalWidth > 0);
    assert.match(await page.locator('#official-step-image').getAttribute('src'), /step-01\.jpg$/);
    await page.click('#official-next');
    assert.equal(await page.locator('#official-step-title').innerText(), 'Bước 2');
    await page.click('#official-zoom-in');
    assert.equal(await page.locator('#official-zoom-value').innerText(), '125%');
    await page.click('#official-zoom-reset');
    assert.equal(await page.locator('#official-zoom-value').innerText(), '100%');
    await page.click('[data-official-step="19"]');
    await page.click('#official-next');
    assert.equal(await page.locator('#official-step-title').innerText(), 'Bước 21');
    assert.match(await page.locator('#official-pdf-page').getAttribute('href'), /#page=12$/);
    await page.click('[data-official-step="28"]');
    assert.ok(await page.locator('#official-next').isDisabled(), 'Bước cuối không được đi tiếp');
    await page.waitForFunction(() => document.querySelector('#official-step-image')?.naturalWidth > 0);
    await page.screenshot({ path: path.join(screenshots, 'official-assembly-desktop.png') });
    await page.click('#btn-subtab-base');
    assert.ok(await page.locator('#subview-base').evaluate(el => el.classList.contains('active')));
    await page.waitForTimeout(500);
    assert.ok(await page.locator('canvas').count() >= 1, 'WebGL viewer cần canvas');
    const assembly = await page.evaluate(() => {
      const pane = document.querySelector('#subview-base').getBoundingClientRect();
      const canvas = document.querySelector('#view').getBoundingClientRect();
      return {
        paneWidth: pane.width,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        stepsColor: getComputedStyle(document.querySelector('#countNow')).color,
        bannerColor: getComputedStyle(document.querySelector('#bannerText')).color,
        stats: window.robotViewer?.stats()
      };
    });
    assert.ok(assembly.paneWidth >= 1280 * 0.65, 'Khung lắp ráp phải đủ rộng trên desktop');
    assert.ok(assembly.canvasWidth >= assembly.paneWidth - 4 && assembly.canvasHeight > 200,
      'Canvas 3D phải chiếm khung hiển thị và có chiều cao');
    assert.equal(assembly.stats?.instances, 61);
    assert.equal(assembly.stats?.meshes, 34, 'Phải tải 32 mesh CAD + 2 mesh cảm biến minh họa');
    assert.equal(assembly.stats?.animating, false, 'Chế độ giảm chuyển động: không chạy hoạt ảnh lắp');
    assert.match(await page.locator('.parts-badge').innerText(), /28 bước theo sách/);
    assert.match(await page.locator('#assemblyCheck').innerText(), /Sách hướng dẫn · bước [0-9]+/);
    assert.equal(assembly.stepsColor, 'rgb(242, 246, 255)', 'Số bước phải dễ đọc trên nền tối');
    assert.equal(assembly.bannerColor, 'rgb(242, 246, 255)', 'Hướng dẫn phải dễ đọc trên nền tối');
    await page.screenshot({ path: path.join(screenshots, 'assembly-desktop.png') });

    // Chụp các bước trong trạng thái đã lắp xong: không hoạt ảnh, không highlight.
    await page.locator('#markStyle').evaluate(el => {
      el.value = 'none';
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    for (const [step, count, filename] of [
      [9, 1 + 4 + 1 + 2 + 2 + 1 + 4 + 2 + 3, 'assembly-motor-step09.png'],
      [21, 3, 'assembly-head-step21.png'],
      [28, 61, 'assembly-final-neutral.png'],
    ]) {
      await page.evaluate(s => window.robotViewer.setStep(s), step);
      await page.waitForTimeout(150);
      const stats = await page.evaluate(() => window.robotViewer.stats());
      assert.equal(stats.visible, count, `Bước ${step}: thiếu linh kiện hiển thị`);
      assert.equal(stats.mark, 'none', `Bước ${step}: hình kiểm tra không được tô highlight`);
      assert.equal(stats.explode, 0, `Bước ${step}: không được tách mô hình`);
      assert.equal(stats.glError, 0, `Bước ${step}: lỗi WebGL`);
      await page.click('#menuBtn');
      assert.equal(await page.locator('#stepTitle').innerText(), `Bước ${step} / 28`);
      assert.match(await page.locator('#doneBtn').innerText(), /Đã lắp xong bước này/);
      assert.ok(await page.locator('#drawerCheck').isVisible(), `Bước ${step}: mục sách hướng dẫn phải hiển thị`);
      assert.equal(await page.locator('#drawer').evaluate(el => getComputedStyle(el).color),
        'rgb(34, 34, 34)', `Bước ${step}: chữ ngăn chức năng phải dễ đọc trong nền tối`);
      assert.ok((await page.locator('#drawerCheck').innerText()).includes(`sách hướng dẫn – bước ${step}`));
      if (step === 28) {
        assert.equal(await page.locator('#pliItems .pliItem.group b').innerText(), 'CỤM GHÉP',
          'Cụm ghép có sẵn không được hiển thị như linh kiện cần lấy mới');
      }
      await page.screenshot({ path: path.join(screenshots, `assembly-review-${step}.png`) });
      await page.click('#menuClose');
      await page.screenshot({ path: path.join(screenshots, filename) });
    }

    // Liên kết hai chiều với tab sách: bước 21 trong 3D ↔ hình in bước 21
    await page.evaluate(() => window.robotViewer.setStep(21));
    await page.waitForTimeout(100);
    await page.click('#assemblyCheck');
    assert.ok(await page.locator('#subview-official').evaluate(el => el.classList.contains('active')));
    assert.equal(await page.locator('#official-step-title').innerText(), 'Bước 21');
    await page.click('[data-official-step="14"]');
    await page.click('#official-open-3d');
    assert.ok(await page.locator('#subview-base').evaluate(el => el.classList.contains('active')));
    assert.equal(await page.locator('#countNow').innerText(), '14');

    // Xưởng sáng tạo: trình xem 3D chuyển sang xưởng, chi tiết gắn thêm hiện trên mô hình hoàn chỉnh
    await page.click('#btn-subtab-creative');
    assert.ok(await page.locator('#subview-creative').evaluate(el => el.classList.contains('active')));
    await page.waitForFunction(() => document.getElementById('app').parentElement.id === 'creative-stage' &&
      window.robotViewer.stats().creative === 0);
    assert.equal(await page.evaluate(() => window.robotViewer.stats().visible), 61, 'Xưởng mở trên mô hình hoàn chỉnh');
    await page.click('[data-preset="sensor"]');
    assert.equal(await page.evaluate(() => window.robotViewer.stats().creative), 1, 'Gói cảm biến: 1 mô-đun');
    await page.click('[data-slot="head"][data-option="dish"]');
    assert.equal(await page.evaluate(() => window.robotViewer.stats().creative), 4, 'Chảo ra-đa: trục + bạc + bánh răng');
    assert.match(await page.locator('#creative-bom').innerText(), /Bánh răng 40 răng/);
    assert.ok(await page.locator('#creative-short').isHidden(), 'Kit còn đủ cho cảm biến và chảo');
    await page.click('[data-preset="solar"]');
    assert.equal(await page.evaluate(() => window.robotViewer.stats().creative), 6, 'Cánh pin kép: thêm 2 khung');
    assert.match(await page.locator('#creative-short').innerText(), /Khung 5×7 \(cánh pin\) thiếu 2/,
      'Kit chỉ có 2 khung 5×7 và mô hình đã dùng cả 2');
    assert.equal(await page.locator('#creative-features li').count(), 3);
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(screenshots, 'creative-desktop.png') });
    await page.click('#creative-deploy');
    assert.ok(await page.locator('#tab-simulation').evaluate(el => el.classList.contains('is-active')));
    const badge = await page.locator('#sim-active-upgrade-badge').innerText();
    for (const word of ['Pin kép', 'Chảo ra-đa', 'Cảm biến']) assert.ok(badge.includes(word), `Sa bàn thiếu gói: ${word}`);
    // Rời xưởng: trình xem 3D về lại tab lắp ráp, không còn chi tiết gắn thêm
    await page.click('#tab-btn-asm');
    await page.click('#btn-subtab-base');
    assert.equal(await page.evaluate(() => document.getElementById('app').parentElement.id), 'subview-base');
    assert.equal(await page.evaluate(() => window.robotViewer.stats().creative), null);
    await page.click('#btn-subtab-creative');
    await page.click('#creative-reset');
    assert.equal(await page.evaluate(() => window.robotViewer.stats().creative), 0);
    await page.click('#tab-btn-sim');

    const initialTheme = await page.locator('html').getAttribute('data-theme');
    await page.click('#btn-toggle-theme');
    const changed = await page.locator('html').getAttribute('data-theme');
    assert.notEqual(initialTheme, changed);
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-theme'), changed);
    await page.screenshot({ path: path.join(screenshots, 'simulation-desktop.png') });
    await page.click('#tab-btn-asm');
    await page.click('#btn-subtab-base');
    assert.equal(await page.locator('#countNow').evaluate(el => getComputedStyle(el).color),
      'rgb(34, 34, 34)', 'Số bước phải có màu chữ tối trong chế độ sáng');
    await page.click('#tab-btn-sim');

    // Cả 4 nhiệm vụ qua giao diện, như học sinh làm lần lượt
    const badgeHas = text => page.waitForFunction(
      t => document.getElementById('mission-summary-badge')?.textContent?.includes(t), text, { timeout: 15000 });
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/4 NV');
    // NV1: đánh dấu "Đã lắp xong" cả 28 bước
    await page.click('#tab-btn-asm');
    await page.click('#btn-subtab-base');
    await page.evaluate(() => {
      for (let s = 1; s <= 28; s++) {
        window.robotViewer.setStep(s);
        if (!/bỏ/.test(document.getElementById('doneBtn').textContent)) document.getElementById('doneBtn').click();
      }
    });
    await badgeHas('1/4');
    // NV4: gắn chảo ra-đa, đưa vào sa bàn (động cơ chạy ở bước sau)
    await page.click('#btn-subtab-creative');
    await page.click('[data-preset="radar"]');
    await page.click('#creative-deploy');
    // NV2: chương trình mẫu trong sách, chạy hết một vòng (8 giây)
    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-load-sample');
    await badgeHas('3/4');
    // NV3: Motor Power mức 4 → Melody B → Stop: dừng ở ~90°, trước vành đai thiên thạch
    page.once('dialog', dialog => dialog.accept());
    await page.click('#btn-clear-code');
    for (const title of ['Motor Power', 'Melody B', 'Stop']) {
      await page.locator(`#block-toolbox button[title="Thêm khối ${title}"]`).click();
    }
    for (let i = 0; i < 4; i++) await page.locator('#program-canvas-chain .zb-block[data-power]').click();
    assert.equal(await page.locator('#program-canvas-chain .zb-block[data-power]').getAttribute('data-power'), '4');
    await badgeHas('4/4');
    assert.ok(await page.locator('#victory-modal').evaluate(el => el.classList.contains('is-open')),
      'Đạt 4 nhiệm vụ phải mở kết quả chúc mừng');
    assert.match(await page.locator('#verify-code-output').innerText(), /^ZM9-/);
    assert.deepEqual(errors, [], 'Không được có lỗi JavaScript trên desktop');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 667 }, isMobile: true, deviceScaleFactor: 1 });
    const mobileErrors = [];
    mobile.on('pageerror', err => mobileErrors.push(err.message));
    await mobile.goto(url);
    await mobile.waitForTimeout(750);
    const dims = await mobile.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
      body: document.body.scrollWidth,
    }));
    assert.ok(dims.scroll <= dims.client, `375px bị tràn trang: ${JSON.stringify(dims)}`);
    await mobile.click('#tab-btn-asm');
    await mobile.waitForTimeout(700);
    assert.ok(await mobile.locator('#subview-official').isVisible());
    await mobile.waitForFunction(() => document.querySelector('#official-step-image')?.naturalWidth > 0);
    await mobile.click('#official-next');
    assert.equal(await mobile.locator('#official-step-title').innerText(), 'Bước 2');
    await mobile.screenshot({ path: path.join(screenshots, 'official-assembly-mobile.png'), fullPage: true });
    await mobile.click('#btn-subtab-base');
    await mobile.waitForTimeout(350);
    const assemblyDims = await mobile.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    assert.ok(assemblyDims.scroll <= assemblyDims.client,
      `Lắp ráp trên mobile bị tràn: ${JSON.stringify(assemblyDims)}`);
    const mobilePane = await mobile.evaluate(() => {
      const pane = document.querySelector('#subview-base').getBoundingClientRect();
      const view = document.querySelector('#view').getBoundingClientRect();
      return { paneWidth: pane.width, canvasWidth: view.width, canvasHeight: view.height,
        color: getComputedStyle(document.querySelector('#bannerText')).color };
    });
    assert.ok(mobilePane.paneWidth >= 300 && mobilePane.canvasWidth >= mobilePane.paneWidth - 4 &&
      mobilePane.canvasHeight > 180, `3D trên điện thoại thiếu kích thước: ${JSON.stringify(mobilePane)}`);
    assert.equal(mobilePane.color, 'rgb(242, 246, 255)');
    assert.match(await mobile.locator('#assemblyCheck').innerText(), /Sách hướng dẫn/);
    // Không giảm chuyển động: sang bước mới thì linh kiện rơi vào vị trí
    await mobile.evaluate(() => window.robotViewer.setStep(1));
    await mobile.click('#next');
    assert.equal(await mobile.evaluate(() => window.robotViewer.stats().animating), true, 'Bước mới phải có hoạt ảnh lắp');
    await mobile.waitForTimeout(1600);
    assert.equal(await mobile.evaluate(() => window.robotViewer.stats().animating), false, 'Hoạt ảnh phải kết thúc');
    await mobile.screenshot({ path: path.join(screenshots, 'assembly-mobile.png'), fullPage: true });
    assert.deepEqual(mobileErrors, [], 'Không được có lỗi JavaScript trên mobile');
    console.log('PASS: sách 27 hình + 3D 28 bước liên kết hai chiều, hoạt ảnh lắp, xưởng sáng tạo, WebGL 61 chi tiết, dark/light, 4/4 nhiệm vụ, không tràn 375px.');
  } finally {
    await browser.close();
  }
}

main().catch(err => { console.error(err); process.exitCode = 1; });
