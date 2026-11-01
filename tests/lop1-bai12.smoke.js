// Chạy trong HTTP test server: npm run test:smoke (hoặc BASE_URL=... node tests/lop1-bai12.smoke.js).
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
    await page.goto(pageUrl('bai.html?id=lop1-bai12'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Bài 12/);
    assert.equal(await page.evaluate(() => window.robotViewer.stats().instances), 57);
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/4 nhiệm vụ');

    const assembly = await page.evaluate(async () => {
      const issues = [];
      for (let step = 1; step <= 24; step++) {
        window.robotViewer.setStep(step);
        const img = document.getElementById('book-img');
        const pdf = document.getElementById('book-pdf');
        try { await img.decode(); } catch (e) { issues.push(`Bước ${step}: ảnh không tải được`); }
        if (!img.naturalWidth || !img.getAttribute('src').endsWith(`assets/lop1-bai12/step-${String(step).padStart(2, '0')}.jpg`)) issues.push(`Bước ${step}: sai ảnh sách`);
        if (!pdf.getAttribute('href').endsWith(`assets/lop1-bai12/step-${String(step).padStart(2, '0')}.jpg`)) issues.push(`Bước ${step}: sai ảnh tham chiếu`);
        if (!/bỏ/i.test(document.getElementById('doneBtn').textContent)) document.getElementById('doneBtn').click();
      }
      return { issues, done: document.getElementById('am-done').textContent };
    });
    assert.deepEqual(assembly.issues, []);
    assert.match(assembly.done, /24\s*\/\s*24/);
    assert.ok((await page.locator('#chip-m1').getAttribute('class')).includes('is-done'));

    // Bài 12 cải tiến bằng mã khối: giáo án không có gói xưởng lắp thêm.
    assert.equal(await page.locator('#tab-btn-creative').isVisible(), false);
    assert.equal(await page.evaluate(() => !!window.LESSON.creative || !!window.ZMCreative), false);
    await page.click('#tab-btn-sim');
    await checkPaintedScene(page);
    assert.ok(await page.locator('#scene-hand').isVisible());

    page.once('dialog', d => d.accept());
    await page.click('#btn-load-sample');
    assert.match(await page.locator('#ghost-score').innerText(), /đúng 12\/12 khối/i);
    assert.equal(await page.locator('#program-canvas-chain .zb-block').count(), 12);
    await page.click('#program-canvas-chain .zb-block-start');
    await page.waitForFunction(() => window.simEngine.waitingTouch, null, { timeout: 5000 });
    await page.click('#scene-hand');
    await page.waitForFunction(() => window.simEngine.waitingTouch && window.simEngine.sawUp, null, { timeout: 5000 });
    await page.click('#scene-hand');
    await page.waitForFunction(() => document.getElementById('chip-m2')?.classList.contains('is-done'), null, { timeout: 5000 });
    assert.ok(await page.evaluate(() => window.simEngine.angle <= 2), 'Mẫu phải hạ đê về vị trí đầu');
    await page.click('#btn-stop-program');

    // NV3: giữ đê >=40° từ giây 5 tới giây 9; NV4: hai lượt thắng bằng hai chương trình khác nhau.
    const safeProgram = async speed => {
      page.once('dialog', d => d.accept());
      await page.click('#btn-clear-code');
      for (const key of ['touch', speed, 'wait', 'motorStop']) {
        await page.click(`#block-toolbox button[data-key="${key}"]`);
      }
      const wait = page.locator('#program-canvas-chain .zb-block').nth(4);
      for (let i = 0; i < 3; i++) await wait.click(); // 3s → 4s → 5s → 1s
      assert.match(await wait.innerText(), /1s/);
      await page.click('#program-canvas-chain .zb-block-start');
      await page.waitForFunction(() => window.simEngine.waitingTouch, null, { timeout: 5000 });
      await page.click('#scene-hand');
      await page.waitForFunction(() => !window.simEngine.running, null, { timeout: 14000 });
      assert.equal(await page.evaluate(() => window.simEngine.flooded), false, 'Không được ngập lũ');
      assert.ok(await page.evaluate(() => window.simEngine.angle >= 40), 'Đê phải dựng >=40°');
    };
    await safeProgram('lowSpeed');
    assert.ok((await page.locator('#chip-m3').getAttribute('class')).includes('is-done'));
    assert.equal(await page.evaluate(() => window.simEngine.wins), 1);
    await safeProgram('highSpeed');
    assert.equal(await page.evaluate(() => window.simEngine.wins), 2);
    assert.ok((await page.locator('#chip-m4').getAttribute('class')).includes('is-done'));
    assert.equal(await page.locator('#mission-summary-badge').innerText(), 'Đạt 4/4 nhiệm vụ');
    assert.ok(await page.locator('#victory-modal').isVisible());
    assert.match(await page.locator('#verify-code-output').innerText(), /^ZM12-/);
    await page.click('#btn-close-victory');

    await page.click('#btn-mode');
    assert.equal(await page.evaluate(() => document.documentElement.dataset.mode), 'pro');
    assert.equal(await page.evaluate(() => window.simEngine.advanced), true);
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '4/5 nhiệm vụ');
    assert.ok(await page.locator('#chip-m5').isVisible());
    assert.ok([30, 45, 60, 75].includes(await page.evaluate(() => window.simEngine.level)));
    await page.click('#btn-mode');
    assert.equal(await page.evaluate(() => window.simEngine.advanced), false);
    await page.click('#scene-toggle');
    assert.equal(await page.evaluate(() => document.getElementById('app').parentElement.id), 'sim-stage');
    await page.click('#scene-toggle');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    capture(mobile);
    await mobile.goto(pageUrl('bai.html?id=lop1-bai12'));
    await mobile.waitForFunction(() => window.robotViewer && window.simEngine, null, { timeout: 20000 });
    await mobile.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    for (const tab of ['#tab-btn-asm', '#tab-btn-sim']) {
      await mobile.click(tab);
      const sizes = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(sizes[0] <= sizes[1], `375px tràn ngang ở ${tab}: ${sizes}`);
    }
    assert.deepEqual(errors, [], 'Không có lỗi console, JavaScript hoặc request thất bại');
    console.log('PASS: lop1-bai12 – 24/24 ảnh sách/PDF, xưởng ẩn đúng giáo án, mẫu 12 khối nâng/hạ, hai lượt chắn lũ, NV1–4, Bé/Nâng cao NV5, canvas, mobile 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
