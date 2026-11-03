// Kiểm tra tích hợp trang bài học bằng Chrome: node tests/lop1-bai01.browser.cjs
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const relative = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '');
  const file = path.resolve(root, relative || 'index.html');
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', (types[path.extname(file)] || 'application/octet-stream') + '; charset=utf-8');
    res.end(buf);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    browser = await chromium.launch({ executablePath: fs.existsSync(chrome) ? chrome : undefined, headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/bai.html?id=lop1-bai01`);
    await page.waitForFunction(() => !document.getElementById('lesson-loading'), { timeout: 20000 });
    await page.waitForSelector('#ramp-release', { state: 'attached', timeout: 10000 });
    assert.match(await page.title(), /Xe trượt dốc/);
    assert.match(await page.locator('#tab-btn-asm small').innerText(), /minh họa 3D/);
    assert.equal(await page.locator('#victory-modal h2').innerText(), 'Hoàn thành các nhiệm vụ');
    assert.equal(await page.locator('html').getAttribute('data-mode'), 'kid');
    await page.click('#tab-btn-sim');
    assert.match(await page.locator('#sim-status-desc').innerText(), /Thả xe/);
    assert.equal(await page.locator('#ramp-surface-row').isVisible(), false);
    assert.equal(await page.locator('#ramp-release').isVisible(), true);

    await page.click('#ramp-release');
    await page.waitForFunction(() => window.simEngine?.done.m2 && !window.simEngine.running, { timeout: 15000 });
    assert.equal(await page.evaluate(() => window.simEngine.reachedGoal), false);
    await page.click('[data-slope="2"]');
    await page.click('#ramp-release');
    await page.waitForFunction(() => window.simEngine?.done.m3 && !window.simEngine.running, { timeout: 15000 });
    assert.equal(await page.evaluate(() => window.simEngine.reachedGoal), true);
    assert.match(await page.locator('#sim-status-desc').innerText(), /cờ đích/);

    await page.click('#btn-mode');
    assert.equal(await page.locator('#ramp-surface-row').isVisible(), true);
    await page.click('[data-surface="rough"]');
    await page.click('[data-slope="3"]');
    await page.click('#ramp-release');
    await page.waitForFunction(() => window.simEngine?.done.m5 && !window.simEngine.running, { timeout: 15000 });
    assert.match(await page.locator('#calc-eq2').innerText(), /mô phỏng/);
    const visiblePixels = await page.locator('#space-scene').evaluate(cv => {
      const data = cv.getContext('2d').getImageData(0, 0, 20, 20).data;
      return data.some((v, i) => i % 4 === 3 && v > 0);
    });
    assert.equal(visiblePixels, true, 'Canvas sa bàn phải được vẽ');

    await page.click('#tab-btn-creative');
    await page.click('[data-preset="wing"]');
    await page.click('#creative-deploy');
    assert.equal(await page.evaluate(() => window.simEngine.has('spoilerWing')), true);
    await page.click('#ramp-release');
    await page.waitForFunction(() => window.simEngine?.upgradeRun, { timeout: 10000 });
    await page.click('#tab-btn-asm');
    for (let step = 1; step <= 7; step++) {
      await page.click(`#steps button[data-step="${step}"]`);
      await page.click('#doneBtn');
    }
    await page.waitForFunction(() => window.simEngine?.assemblyDone, { timeout: 10000 });
    assert.match(await page.locator('#am-done').innerText(), /7\s*\/\s*7/);
    await page.click('#tab-btn-sim');
    await page.waitForFunction(() => document.querySelector('#mc-text')?.textContent.includes('hoàn thành'), { timeout: 5000 });
    fs.mkdirSync(path.join(root, 'scratch'), { recursive: true });
    await page.screenshot({ path: path.join(root, 'scratch', 'lop1-bai01-mobile.png'), fullPage: true });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    assert.ok(overflow < 3, 'Trang tràn ngang trên màn hình 390px: ' + overflow + 'px');
    assert.deepEqual(errors, [], 'Lỗi JavaScript trong trình duyệt');
    console.log('PASS: Chrome 390px · 7 bước M1 · Bé/Nâng cao · M2/M3/M5 · gói sáng tạo M4 · canvas vẽ · không lỗi JS/tràn ngang.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
