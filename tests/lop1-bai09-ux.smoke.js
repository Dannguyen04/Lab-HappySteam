// Kiểm thử UX chuẩn trên bai.html?id=lop1-bai09 (phiếu 86: U1, U3, U4, U6, U9).
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.mp4': 'video/mp4'
};

function serve() {
  if (process.env.BASE_URL) return Promise.resolve({ close() {}, url: process.env.BASE_URL });
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(ROOT, p === '/' ? 'index.html' : p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(r => srv.listen(0, '127.0.0.1', () => r({ close: () => srv.close(), url: `http://127.0.0.1:${srv.address().port}` })));
}

let passed = 0, failed = 0;
function check(name, ok, detail = '') {
  if (ok) {
    passed++;
    console.log('  PASS', name);
  } else {
    failed++;
    console.error('  FAIL', name, detail);
  }
}

(async () => {
  const srv = await serve();
  const base = srv.url;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {
    if (m.type() === 'error') errors.push(m.text());
  });

  // --- 7. Ít cú nhấp (U1): từ index.html tới lúc bấm Chạy không quá 3 thao tác, mở bài không có hộp thoại chắn ngang ---
  await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.clear());

  let clicks = 0;
  // Thao tác 1: bấm thẻ bài 9 trên index.html
  await page.click('a.lesson-card[href="bai.html?id=lop1-bai09"]');
  clicks++;
  await page.waitForFunction(() => window.robotViewer && window.simEngine && window.ZMSpotlight, null, { timeout: 15000 });

  const blockingModalOnLoad = await page.evaluate(() => {
    return [...document.querySelectorAll('.modal.is-open, .victory.is-open, dialog[open]')].length;
  });
  check('Mở bài không hiện hộp thoại chắn ngang (U1)', blockingModalOnLoad === 0, `modals=${blockingModalOnLoad}`);

  // Thao tác 2: bấm tab Lập trình & thử
  await page.click('#tab-btn-sim');
  clicks++;
  // Thao tác 3: bấm nút Chạy
  await page.click('#btn-run-program');
  clicks++;
  const startedIn3Clicks = await page.evaluate(() => !!window.simEngine.running);
  check('Từ index.html tới lúc bấm Chạy robot ảo không quá 3 thao tác (U1)', clicks <= 3 && startedIn3Clicks, `clicks=${clicks}, running=${startedIn3Clicks}`);
  await page.click('#btn-stop-program');

  // Xóa localStorage để kiểm tra luồng học sinh mới từ đầu trên bai.html?id=lop1-bai09
  await page.evaluate(() => {
    localStorage.clear();
    history.replaceState(null, '', location.pathname + location.search);
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.robotViewer && window.simEngine && window.ZMSpotlight, null, { timeout: 15000 });

  // --- 1. Thanh chặng dính trên đầu khi cuộn trang (kiểm tra cả 1366x768 và 1024x768) ---
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.click('#tab-btn-asm');
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(80);
  const sticky1024 = await page.evaluate(() => {
    const nav = document.querySelector('.stages');
    const r = nav.getBoundingClientRect();
    const pos = getComputedStyle(nav).position;
    return { pos, top: Math.round(r.top), visible: r.top >= 0 && r.bottom <= window.innerHeight };
  });
  check('Thanh chặng dính ở trên khi cuộn trang ở 1024×768 (U6)', sticky1024.pos === 'sticky' && sticky1024.top <= 24 && sticky1024.visible, JSON.stringify(sticky1024));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.setViewportSize({ width: 1366, height: 768 });

  // --- 2. Dấu ✓ trên chặng đã xong + tiến độ con trên chặng đang mở ---
  // 2a. Khám phá: chọn đáp án dự đoán -> hiện dấu ✓ trên tab Khám phá
  await page.click('#tab-btn-explore');
  await page.evaluate(() => {
    const q = document.getElementById('fl-explore-q');
    if (q) q.hidden = false;
  });
  await page.click('#fl-explore-q .fl-choice');
  const exploreDone = await page.evaluate(() => {
    const t = document.getElementById('tab-btn-explore');
    return t.classList.contains('is-done') && t.querySelector('i').textContent.trim() === '✓';
  });
  check('Chặng Khám phá hiện dấu ✓ sau khi chọn đáp án dự đoán', exploreDone);

  // 2b. Lắp ráp: hiện tiến độ con "bước k/N" trên tab đang mở, và dấu ✓ khi tới bước cuối
  await page.click('#tab-btn-asm');
  await page.evaluate(() => window.robotViewer.setStep(5));
  const asmSubProg = await page.locator('#tab-btn-asm .stage-prog').innerText();
  check('Tab Lắp ráp đang mở hiện tiến độ con "bước k/N"', asmSubProg.includes('bước 5/28'), asmSubProg);

  // --- 3. Nhớ chặng và bước lắp đang làm khi tải lại trang ---
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 15000 });
  const rememberedAsm = await page.evaluate(() => ({
    stage: window.ZMStages.current(),
    step: window.robotViewer.getStep(),
    storedStage: localStorage.getItem(window.LESSON.store + 'stage')
  }));
  check('Tải lại trang nhớ đúng chặng và bước lắp đang làm (bước 5)', rememberedAsm.stage === 'assembly' && rememberedAsm.step === 5, JSON.stringify(rememberedAsm));

  // Đi tới bước cuối (28/28) -> tab Lắp ráp có dấu ✓
  await page.evaluate(() => window.robotViewer.setStep(28));
  const asmDoneMark = await page.evaluate(() => {
    const t = document.getElementById('tab-btn-asm');
    return t.classList.contains('is-done') && t.querySelector('i').textContent.trim() === '✓';
  });
  check('Chặng Lắp ráp hiện dấu ✓ khi đã đi qua bước cuối', asmDoneMark);

  // 2c. Sáng tạo: chọn 1 gói gợi ý -> tab Sáng tạo hiện dấu ✓
  await page.click('#tab-btn-creative');
  await page.click('#creative-presets .creative-preset');
  await page.waitForTimeout(50);
  const creativeDoneMark = await page.evaluate(() => {
    const t = document.getElementById('tab-btn-creative');
    return t.classList.contains('is-done') && t.querySelector('i').textContent.trim() === '✓';
  });
  check('Chặng Sáng tạo hiện dấu ✓ khi đã chọn ít nhất 1 chi tiết/gói', creativeDoneMark);

  // --- 5. Spotlight gợi ý lần đầu mở chặng Lập trình ---
  await page.click('#tab-btn-sim');
  await page.waitForTimeout(100);
  const spot1 = await page.evaluate(() => {
    const el = document.getElementById('zm-spotlight');
    const txt = document.getElementById('zm-spotlight-text');
    return { open: window.ZMSpotlight.isOpen(), hidden: el ? el.hidden : true, text: txt ? txt.textContent : '' };
  });
  check('Lần đầu mở chặng Lập trình hiện spotlight chỉ vào khay khối (U4)', spot1.open && !spot1.hidden && spot1.text.includes('Chạm khối này để thêm'), JSON.stringify(spot1));

  // Bấm vào khối đầu tiên trong khay -> thao tác đi xuyên qua, thêm khối và chuyển spotlight sang nút Chạy
  await page.click('#block-toolbox .zb-item:not(.pro-only)');
  await page.waitForTimeout(100);
  const spot2 = await page.evaluate(() => {
    const el = document.getElementById('zm-spotlight');
    const txt = document.getElementById('zm-spotlight-text');
    return { open: window.ZMSpotlight.isOpen(), hidden: el ? el.hidden : true, text: txt ? txt.textContent : '' };
  });
  check('Sau khi thêm khối, spotlight chuyển sang nút Chạy ("Chạm để chạy")', spot2.open && !spot2.hidden && spot2.text.includes('Chạm để chạy'), JSON.stringify(spot2));

  // Đóng spotlight bằng phím Esc, chuyển sang chặng khác rồi quay lại Lập trình -> không hiện lại lần 2
  await page.keyboard.press('Escape');
  await page.click('#tab-btn-creative');
  await page.click('#tab-btn-sim');
  await page.waitForTimeout(100);
  const spotReopen = await page.evaluate(() => window.ZMSpotlight.isOpen());
  check('Spotlight không hiện lại ở lần mở chặng Lập trình thứ 2', spotReopen === false);

  // Kiểm tra các chấm nhiệm vụ trên tab Lập trình đang mở
  const simDotsCount = await page.locator('#tab-btn-sim .stage-prog .stage-dot').count();
  check('Tab Lập trình đang mở hiện các chấm nhiệm vụ', simDotsCount === 4, `dots=${simDotsCount}`);

  // --- 4. Kích thước và vị trí nút Chạy / Dừng (U9) ---
  const btnMetrics = await page.evaluate(() => {
    const run = document.getElementById('btn-run-program').getBoundingClientRect();
    const stop = document.getElementById('btn-stop-program').getBoundingClientRect();
    const ws = document.getElementById('program-workspace').getBoundingClientRect();
    return {
      runW: Math.round(run.width),
      runH: Math.round(run.height),
      stopW: Math.round(stop.width),
      stopH: Math.round(stop.height),
      atBottomRight: run.right > ws.left + ws.width * 0.5 && stop.right > ws.left + ws.width * 0.5 && run.bottom >= ws.bottom - 24
    };
  });
  check(
    'Nút Chạy và Dừng có kích thước >= 64 px, đặt ở góc phải dưới vùng ghép khối (U9)',
    btnMetrics.runW >= 64 && btnMetrics.runH >= 64 && btnMetrics.stopW >= 64 && btnMetrics.stopH >= 64 && btnMetrics.atBottomRight,
    JSON.stringify(btnMetrics)
  );

  // --- 6. Trạng thái đang chạy (U3) bật khi bấm Chạy, tự tắt khi bấm Dừng và khi chạy xong ---
  page.once('dialog', d => d.accept());
  await page.click('#btn-load-sample');
  await page.click('#btn-run-program');
  await page.waitForTimeout(150);
  const runningVisuals = await page.evaluate(() => ({
    runSpin: document.getElementById('btn-run-program').classList.contains('is-running'),
    stopRed: document.getElementById('btn-stop-program').classList.contains('is-running'),
    chainGlow: document.getElementById('program-canvas-chain').classList.contains('is-running'),
    activeBlock: !!document.querySelector('#program-canvas-chain .zb-block.is-active')
  }));
  check(
    'Khi đang chạy: nút Chạy có viền quay, nút Dừng đỏ, chuỗi khối sáng viền và khối đang chạy nổi bật (U3)',
    runningVisuals.runSpin && runningVisuals.stopRed && runningVisuals.chainGlow && runningVisuals.activeBlock,
    JSON.stringify(runningVisuals)
  );

  // Bấm Dừng -> cả 4 trạng thái tắt ngay
  await page.click('#btn-stop-program');
  const stoppedVisuals = await page.evaluate(() => ({
    runSpin: document.getElementById('btn-run-program').classList.contains('is-running'),
    stopRed: document.getElementById('btn-stop-program').classList.contains('is-running'),
    chainGlow: document.getElementById('program-canvas-chain').classList.contains('is-running'),
    activeBlock: !!document.querySelector('#program-canvas-chain .zb-block.is-active')
  }));
  check(
    'Khi bấm Dừng: cả 4 trạng thái tự trả về bình thường',
    !stoppedVisuals.runSpin && !stoppedVisuals.stopRed && !stoppedVisuals.chainGlow && !stoppedVisuals.activeBlock,
    JSON.stringify(stoppedVisuals)
  );

  // Chạy chương trình ngắn không có vòng lặp và không bật motor -> tự kết thúc và tự tắt cả 4 trạng thái (không bị treo).
  // (Bài 9 hết khối mà motor còn quay thì vẫn là đang chạy như kit thật, phải bấm Dừng: không kiểm ở đây.)
  await page.evaluate(() => {
    window.ZMApp.blocks.blocks = [{ type: 'start' }, { type: 'wait', duration: 1 }];
    window.ZMApp.blocks.render();
    window.ZMApp.blocks.notifyChange();
  });
  await page.click('#btn-run-program');
  await page.waitForFunction(() => !window.simEngine.running, null, { timeout: 4000 });
  const autoResetVisuals = await page.evaluate(() => ({
    runSpin: document.getElementById('btn-run-program').classList.contains('is-running'),
    stopRed: document.getElementById('btn-stop-program').classList.contains('is-running'),
    chainGlow: document.getElementById('program-canvas-chain').classList.contains('is-running'),
    activeBlock: !!document.querySelector('#program-canvas-chain .zb-block.is-active')
  }));
  check(
    'Khi chạy xong chương trình không lặp: cả 4 trạng thái tự trả về bình thường (không bị treo)',
    !autoResetVisuals.runSpin && !autoResetVisuals.stopRed && !autoResetVisuals.chainGlow && !autoResetVisuals.activeBlock,
    JSON.stringify(autoResetVisuals)
  );

  // 2d. Chia sẻ: chụp ảnh / chọn câu hỏi -> hiện dấu ✓ trên tab Chia sẻ
  await page.click('#tab-btn-share');
  await page.click('#fl-share-q .fl-choice');
  const shareDoneMark = await page.evaluate(() => {
    const t = document.getElementById('tab-btn-share');
    return t.classList.contains('is-done') && t.querySelector('i').textContent.trim() === '✓';
  });
  check('Chặng Chia sẻ hiện dấu ✓ khi đã trả lời câu hỏi hoặc có ảnh', shareDoneMark);

  check('Không có lỗi console/pageerror', errors.length === 0, errors.join('; '));

  await browser.close();
  srv.close();
  console.log(`\nTổng kết lop1-bai09-ux.smoke: ${passed} đạt, ${failed} lỗi.`);
  process.exit(failed ? 1 : 0);
})();
