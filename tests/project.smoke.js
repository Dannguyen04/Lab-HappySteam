// Chạy: node tests/project.smoke.js (cần Playwright, có thể đặt NODE_PATH) – Sổ dự án "Hành trình dòng nước".
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const executablePath = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
    .filter(Boolean).find(p => fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const root = path.resolve(__dirname, '..').split(path.sep).join('/');
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('requestfailed', r => errors.push('Không tải được ' + r.url()));
    page.on('dialog', d => d.accept());
    // Vào từ thẻ tuần 15 trên trang chọn bài → mở đúng chặng ②
    await page.goto(`file:///${root}/index.html?lop=1&hk=1`);
    await page.evaluate(() => localStorage.clear());
    await page.click('a.lesson-card[href="lop1-du-an.html?hk=1&chang=2"]');
    await page.waitForSelector('#stage-2:not([hidden])');
    assert.equal(await page.locator('#tab-build').getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/4 nhiệm vụ');

    // Nhóm
    await page.click('#btn-group');
    await page.fill('#group-name', 'Nhóm Giọt Nước');
    await page.fill('#group-class', '1A');
    await page.locator('#members input').nth(0).fill('An');
    await page.locator('#members input').nth(1).fill('Bình');
    await page.click('#btn-close-group');
    assert.match(await page.locator('#group-label').innerText(), /Giọt Nước/);

    // ① Ý tưởng: thẻ vấn đề, mô hình gốc, ý tưởng (gợi ý), vẽ một nét
    await page.click('#tab-idea');
    await page.click('#problem-cards [data-id="dry"]');
    await page.click('#base-cards [data-id="b10"]');
    await page.locator('#idea-suggest button').first().click();
    assert.match(await page.locator('#idea').inputValue(), /tưới cây/);
    const box = await page.locator('#sketch').boundingBox();
    await page.mouse.move(box.x + 100, box.y + 100);
    await page.mouse.down();
    await page.mouse.move(box.x + 300, box.y + 200, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(() => document.getElementById('chip-m1').classList.contains('is-done'));

    // ② Chế tạo: 4 việc + 3 khối lệnh + 1 lần chạy thử
    await page.click('#tab-build');
    for (let i = 0; i < 4; i++) await page.locator('#build-checklist input').nth(i).check();
    for (const t of ['Waiting for Pressed', 'High Speed', 'Stop']) await page.locator(`#block-toolbox button[title="Thêm khối ${t}"]`).click();
    await page.click('#test-ok');
    await page.waitForFunction(() => document.getElementById('chip-m2').classList.contains('is-done'));

    // ③ Poster
    await page.click('#tab-poster');
    await page.fill('#title', 'Cối xoay gió tưới cây');
    await page.waitForFunction(() => document.getElementById('chip-m3').classList.contains('is-done'));
    await page.waitForFunction(() => /đủ thông tin/.test(document.getElementById('poster-missing').textContent));
    fs.mkdirSync(path.join(__dirname, 'screenshots'), { recursive: true });
    await page.locator('#poster').screenshot({ path: path.join(__dirname, 'screenshots', 'project-poster.png') });

    // ④ Chia sẻ: 4 mục sao + điều học được
    await page.click('#tab-share');
    for (let i = 0; i < 4; i++) await page.locator('.star-btns').nth(i).locator('.star').nth(3 + (i % 2)).click();
    await page.locator('#learned-suggest button').first().click();
    await page.waitForFunction(() => document.getElementById('mission-summary-badge').textContent.includes('Đạt 4/4'));
    await page.click('#btn-submit');
    assert.match(await page.locator('#submit-status').innerText(), /Chưa có địa chỉ nhận bài/);

    // Tuần sau mở lại: bài làm còn nguyên
    await page.waitForTimeout(400);
    await page.goto(`file:///${root}/lop1-du-an.html?hk=1`);
    await page.waitForSelector('#stage-4:not([hidden])');
    assert.match(await page.locator('#mission-summary-badge').innerText(), /Đạt 4\/4/);
    assert.equal(await page.locator('#program-canvas-chain .zb-block').count(), 4, 'Start + 3 khối được lưu');
    // Học kì II là sổ riêng
    await page.goto(`file:///${root}/lop1-du-an.html?hk=2`);
    assert.match(await page.locator('#proj-eyebrow').textContent(), /học kì II/);
    assert.equal(await page.locator('#mission-summary-badge').innerText(), '0/4 nhiệm vụ');

    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    await mobile.goto(`file:///${root}/lop1-du-an.html?hk=1`);
    for (const tab of ['#tab-idea', '#tab-build', '#tab-poster', '#tab-share']) {
      await mobile.click(tab);
      const d = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      assert.ok(d[0] <= d[1], `375px bị tràn ngang ở ${tab}: ${d}`);
    }
    assert.deepEqual(errors, [], 'Không có lỗi JavaScript / tệp thiếu');
    console.log('PASS: Sổ dự án – mở đúng chặng từ trang chọn bài, nhóm, ý tưởng + bản vẽ, chế tạo + khối lệnh, poster, tự đánh giá, 4/4, lưu qua tuần, HK I/II riêng, không tràn 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
