// Đo request/byte từ Chrome DevTools: Bài 9 lạnh, tiếp Bài 3 cùng tab và cache.
const fs = require('node:fs');
const path = require('node:path');
const { fork } = require('node:child_process');
const { chromium } = require('playwright');

async function startServer() {
  const server = fork(path.join(__dirname, '..', 'tests', 'helpers', 'static-server.js'), [], {
    stdio: ['ignore', 'inherit', 'inherit', 'ipc']
  });
  return new Promise((resolve, reject) => {
    server.once('message', ({ port }) => resolve({ server, base: `http://127.0.0.1:${port}` }));
    server.once('error', reject);
    server.once('exit', code => reject(new Error(`Static server exited: ${code}`)));
  });
}

(async () => {
  const hosted = process.env.BASE_URL ? null : await startServer();
  const base = process.env.BASE_URL || hosted.base;
  let browser;
  try {
    const executablePath = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
      .filter(Boolean).find(p => fs.existsSync(p));
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    const context = await browser.newContext();
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send('Network.enable');
    await client.send('Network.setCacheDisabled', { cacheDisabled: false });
    const records = new Map();
    let group = [];
    client.on('Network.requestWillBeSent', e => {
      const row = { url: e.request.url, bytes: 0, cached: false, finished: false, failed: false };
      records.set(e.requestId, row);
      group.push(row);
    });
    client.on('Network.requestServedFromCache', e => {
      const row = records.get(e.requestId);
      if (row) row.cached = true;
    });
    client.on('Network.responseReceived', e => {
      const row = records.get(e.requestId);
      if (row && (e.response.fromDiskCache || e.response.fromPrefetchCache)) row.cached = true;
    });
    client.on('Network.loadingFinished', e => {
      const row = records.get(e.requestId);
      if (row) { row.bytes = e.encodedDataLength; row.finished = true; }
    });
    client.on('Network.loadingFailed', e => {
      const row = records.get(e.requestId);
      if (row) { row.finished = true; row.failed = true; }
    });
    const results = [];
    for (const id of ['lop1-bai09', 'lop1-bai03']) {
      group = [];
      await page.goto(`${base}/bai.html?id=${id}`, { waitUntil: 'domcontentloaded' });
      await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 25000 });
      await page.waitForFunction(() => !!window.robotViewer, null, { timeout: 25000 });
      await page.waitForLoadState('networkidle');
      const meshes = group.filter(r => r.url.includes('/content/kits/alpha330/meshes/'));
      results.push({
        id,
        requests: group.length,
        transferredBytes: group.reduce((sum, r) => sum + r.bytes, 0),
        cacheHits: group.filter(r => r.cached).length,
        meshRequests: meshes.length,
        meshTransferredBytes: meshes.reduce((sum, r) => sum + r.bytes, 0),
        meshCacheHits: meshes.filter(r => r.cached).length,
        failedRequests: group.filter(r => r.failed).map(r => r.url),
        unfinished: group.filter(r => !r.finished).length
      });
    }
    const mobileContext = await browser.newContext({ viewport: { width: 375, height: 760 }, isMobile: true });
    const mobile = await mobileContext.newPage();
    const consoleErrors = [];
    const httpErrors = [];
    mobile.on('response', response => {
      if (response.status() >= 400) httpErrors.push({ status: response.status(), url: response.url() });
    });
    mobile.on('console', message => {
      if (message.type() === 'error') consoleErrors.push({ text: message.text(), location: message.location() });
    });
    mobile.on('pageerror', error => consoleErrors.push(error.message));
    await mobile.goto(`${base}/bai.html?id=lop1-bai09`);
    await mobile.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 25000 });
    const widths = [];
    for (const tab of ['#tab-btn-asm', '#tab-btn-creative', '#tab-btn-sim']) {
      await mobile.click(tab);
      widths.push(await mobile.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth })));
    }
    console.log(JSON.stringify({ network: results, mobile375: { consoleErrors, httpErrors, widths } }, null, 2));
  } finally {
    if (browser) await browser.close();
    if (hosted) hosted.server.kill();
  }
})().catch(err => { console.error(err); process.exitCode = 1; });
