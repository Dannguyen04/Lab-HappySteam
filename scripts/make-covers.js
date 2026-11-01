// Chạy: node scripts/make-covers.js
// Chụp mô hình WebGL đã lắp xong bằng HTTP server và Chromium như bộ smoke tests.
const fs = require('node:fs');
const path = require('node:path');
const { fork } = require('node:child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'assets', 'covers');
const ids = [
  'lop1-bai11', 'lop1-bai12', 'lop1-bai13',
  'lop3-bai09', 'lop3-bai10', 'lop3-bai11'
];
const WIDTH = 809;
const HEIGHT = 455;
const MIN_BYTES = 40 * 1024;
const MAX_BYTES = 60 * 1024;

function startServer() {
  const child = fork(path.join(root, 'tests', 'helpers', 'static-server.js'), [], {
    stdio: ['ignore', 'inherit', 'inherit', 'ipc']
  });
  return new Promise((resolve, reject) => {
    function fail(error) { child.kill(); reject(error); }
    child.once('error', fail);
    child.once('exit', code => fail(new Error(`Static server exited (${code})`)));
    child.once('message', ({ port }) => {
      child.removeListener('error', fail);
      child.removeAllListeners('exit');
      resolve({ child, base: `http://127.0.0.1:${port}` });
    });
  });
}

async function measureImage(page, buffer) {
  // Dùng canvas trong Chromium để đọc JPEG đã nén thực tế; không tạo ảnh tạm.
  return page.evaluate(async base64 => {
    const image = new Image();
    image.src = `data:image/jpeg;base64,${base64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let n = 0, sum = 0, sum2 = 0, dark = 0, centerDark = 0;
    for (let y = 0; y < canvas.height; y += 3) {
      for (let x = 0; x < canvas.width; x += 3) {
        const p = (y * canvas.width + x) * 4;
        const light = 0.2126 * pixels[p] + 0.7152 * pixels[p + 1] + 0.0722 * pixels[p + 2];
        sum += light;
        sum2 += light * light;
        n++;
        if (light < 180) {
          dark++;
          if (x > canvas.width * 0.2 && x < canvas.width * 0.8 &&
              y > canvas.height * 0.13 && y < canvas.height * 0.87) centerDark++;
        }
      }
    }
    const mean = sum / n;
    return {
      width: image.width,
      height: image.height,
      mean: +mean.toFixed(1),
      deviation: +Math.sqrt(Math.max(0, sum2 / n - mean * mean)).toFixed(1),
      darkRatio: +(dark / n).toFixed(4),
      centerDarkRatio: +(centerDark / n).toFixed(4)
    };
  }, buffer.toString('base64'));
}

async function captureLesson(browser, base, id) {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 950 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce'
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(`${base}/bai.html?id=${encodeURIComponent(id)}`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.robotViewer, null, { timeout: 45000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 45000 });
    await page.waitForFunction(() => {
      const s = window.robotViewer.stats();
      return s.instances > 0 && s.meshes > 0 && document.querySelector('#view')?.getBoundingClientRect().width > 0;
    }, null, { timeout: 30000 });

    // Chỉ thay đổi CSS trong trang chụp, không sửa mã nguồn ứng dụng.
    await page.addStyleTag({ content: `
      #subview-base {
        position: fixed !important; top: 0 !important; left: 0 !important;
        z-index: 2147483640 !important; width: ${WIDTH}px !important;
        height: ${HEIGHT}px !important; min-height: 0 !important;
        aspect-ratio: auto !important; border: none !important;
        border-radius: 0 !important; box-shadow: none !important;
      }
      #subview-base .lefttop, #subview-base .corner, #subview-base .bottomnav,
      #subview-base .resume, #subview-base .loading, #subview-base .drawer,
      #subview-base .bom, #subview-base .preview { display: none !important; }
    ` });
    await page.evaluate(() => {
      document.getElementById('all').click();
      document.getElementById('iso').click();
      // Màu linh kiện thực tế; bỏ lớp tô nổi linh kiện của bước cuối.
      if (document.getElementById('eye').getAttribute('aria-pressed') !== 'true') {
        document.getElementById('eye').click();
      }
      // Phóng nhẹ để mô hình nổi bật trên thẻ 16:9 mà vẫn giữ đủ chi tiết.
      document.getElementById('view').dispatchEvent(new WheelEvent('wheel', {
        deltaY: -180, bubbles: true, cancelable: true
      }));
    });
    await page.waitForFunction(() => {
      const s = window.robotViewer.stats();
      const a = document.getElementById('subview-base').getBoundingClientRect();
      // WebGL nội bộ render 2x để khử răng cưa; JPEG vẫn chụp đúng khung CSS 809x455.
      return s.visible > 0 && s.canvas[0] === 1618 && s.canvas[1] === 910 &&
        Math.round(a.width) === 809 && Math.round(a.height) === 455 && !s.animating;
    }, null, { timeout: 15000 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const stage = page.locator('#subview-base');

    // Chọn JPEG vừa mục tiêu 40–60 KB; Playwright trả Buffer, không tạo file phụ.
    let best = null;
    for (const quality of [92, 91, 93, 90, 94, 89, 95, 88, 96, 85, 78, 68, 58, 100, 40, 30]) {
      const buffer = await stage.screenshot({ type: 'jpeg', quality, animations: 'disabled' });
      const distance = buffer.length < MIN_BYTES ? MIN_BYTES - buffer.length :
        buffer.length > MAX_BYTES ? buffer.length - MAX_BYTES : 0;
      if (!best || distance < best.distance) best = { buffer, quality, distance };
      if (distance === 0) break;
    }
    const stats = await measureImage(page, best.buffer);
    if (stats.width !== WIDTH || stats.height !== HEIGHT ||
        stats.deviation < 12 || stats.darkRatio < 0.015 || stats.centerDarkRatio < 0.01 ||
        stats.mean < 35 || stats.mean > 249) {
      throw new Error(`Ảnh lỗi/trống/đen: ${JSON.stringify(stats)}`);
    }
    if (errors.length) console.warn(`Lưu ý lỗi JS trong ${id}: ${errors.join(' | ')}`);
    const target = path.join(output, `${id}.jpg`);
    fs.writeFileSync(target, best.buffer);
    console.log(`${path.relative(root, target)} | ${stats.width}x${stats.height} | ` +
      `${(best.buffer.length / 1024).toFixed(1)} KB | JPEG Q${best.quality} | ` +
      `stddev=${stats.deviation}, dark=${(stats.darkRatio * 100).toFixed(1)}%`);
  } finally {
    await page.close();
  }
}

async function main() {
  const hosted = await startServer();
  let browser;
  try {
    const executablePath = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
      .filter(Boolean).find(p => fs.existsSync(p));
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    for (const id of ids) await captureLesson(browser, hosted.base, id);
  } finally {
    if (browser) await browser.close();
    hosted.child.kill();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
