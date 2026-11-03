// Chạy: node tests/home.smoke.js (cần Playwright, có thể đặt NODE_PATH) – trang chọn bài index.html
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

// Kiểm giao diện có phiên bằng bản build Vite với Supabase giả, không truy cập DB thật.
async function smokeStudentHome(browser) {
  const oldUrl = process.env.VITE_SUPABASE_URL;
  const oldKey = process.env.VITE_SUPABASE_ANON_KEY;
  process.env.VITE_SUPABASE_URL = 'https://supabase.mock.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'home-smoke-key';
  const { build, preview } = await import('vite');
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'happysteam-home-'));
  let server;
  try {
    const configFile = path.resolve(__dirname, '../vite.config.js');
    await build({ configFile, build: { outDir, emptyOutDir: true }, logLevel: 'error' });
    server = await preview({ configFile, build: { outDir }, preview: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
    const base = server.resolvedUrls.local[0];
    const page = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let offline = false;
    let denied = false;
    let leaveCalls = 0;
    let leaveOpen = true;
    const user = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', aud: 'authenticated',
      role: 'authenticated', is_anonymous: true,
      app_metadata: { provider: 'anonymous', providers: ['anonymous'] },
      user_metadata: {}, created_at: '2026-11-01T00:00:00Z'
    };
    const jwt = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(JSON.stringify({ sub: user.id, role: user.role, exp: 1924992000, is_anonymous: true })).toString('base64url'),
      'fake_signature'
    ].join('.');
    await page.route('https://supabase.mock.invalid/**', async route => {
      const name = new URL(route.request().url()).pathname;
      if (offline) { await route.abort('failed'); return; }
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: {
          'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST,GET,OPTIONS',
          'access-control-allow-headers': 'authorization,apikey,content-type,x-client-info'
        } });
      } else if (name.endsWith('/auth/v1/signup')) {
        await route.fulfill({ status: 200, contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({
            access_token: jwt, token_type: 'bearer', expires_in: 31536000,
            expires_at: 1924992000, refresh_token: 'test-refresh-token', user
          }) });
      } else if (name.endsWith('/auth/v1/user')) {
        await route.fulfill({ status: 200, contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(user) });
      } else if (name.endsWith('/rpc/session_roster')) {
        assert.deepEqual(route.request().postDataJSON(), { p_code: '1234' });
        await route.fulfill({ status: 200, contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({
            ok: true, device_tag: 'M7', roster: [
              { nickname: 'An', avatar: '🐱', pick: 'pick-an' },
              { nickname: 'Bình', avatar: '🐶', pick: 'pick-binh' }
            ]
          }) });
      } else if (name.endsWith('/rpc/student_home_state')) {
        if (denied) {
          await route.fulfill({ status: 403, contentType: 'application/json',
            headers: { 'access-control-allow-origin': '*' },
            body: '{"code":"42501","message":"ZM_BLOCK_DEVICE_NOT_APPROVED"}' });
          return;
        }
        assert.deepEqual(route.request().postDataJSON(), {
          p_student_id: 'student-1', p_session_id: 'session-1'
        });
        await route.fulfill({ status: 200, contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({
            ok: true, grade: 1, class_name: 'Lớp 1A', class_id: 'class-1', current_week: 8,
            lessons: { 'lop1-bai03': true, 'lop1-bai09': false, 'lop1-bai10': true }
          }) });
      } else if (name.endsWith('/rpc/leave_session')) {
        leaveCalls++;
        await route.fulfill({ status: 200, contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({
            ok: true, session_open: leaveOpen, join_code: leaveOpen ? '1234' : null
          }) });
      } else throw new Error('Unexpected mock RPC: ' + name);
    });
    await page.goto(new URL('index.html', base).href);
    assert.equal(await page.locator('#grade-tabs [data-grade]').count(), 5, 'Khách được xem tự do');
    assert.equal(await page.locator('#home-student').isVisible(), false);
    await page.evaluate(() => sessionStorage.setItem('happy-student-session', JSON.stringify({
      student_id: 'student-1', session_id: 'session-1', expires_at: '2027-01-01T00:00:00Z',
      nickname: 'An', avatar: '🐱'
    })));
    await page.reload();
    await page.locator('.lesson-card.is-locked').first().waitFor();
    assert.equal(await page.locator('#grade-tabs [data-grade]').count(), 1, 'Chỉ hiện khối lớp của học sinh');
    assert.equal(await page.locator('#grade-tabs [data-grade="1"]').count(), 1);
    assert.equal(await page.locator('.lesson-card.is-ready[href="bai.html?id=lop1-bai03"]').count(), 1);
    assert.equal(await page.locator('.lesson-card.is-locked').count() > 0, true);
    assert.equal(await page.locator('.lesson-card.is-soon').count() > 0, true);
    assert.match(await page.locator('#home-student').innerText(), /An[\s\S]*Không phải em\?/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    offline = true;
    await page.reload();
    await page.getByText(/Đang dùng trạng thái bài học đã lưu/).waitFor();
    assert.equal(await page.locator('.lesson-card.is-ready[href="bai.html?id=lop1-bai03"]').count(), 1, 'Giữ trạng thái cache khi mất mạng');
    await page.evaluate(() => sessionStorage.removeItem('happy-home-cache:student-1:session-1'));
    await page.reload();
    await page.getByText(/Chưa tải được lớp/).waitFor();
    assert.equal(await page.locator('.lesson-card').count(), 0, 'Chưa có cache phải đóng danh mục');
    offline = false;
    await page.reload();
    await page.locator('.lesson-card.is-ready').first().waitFor();
    denied = true;
    await page.reload();
    await page.getByText(/Phiên máy không còn được duyệt/).waitFor();
    assert.equal(await page.locator('.lesson-card').count(), 0, 'Từ chối quyền phải xoá cache');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('happy-home-cache:student-1:session-1')), null);
    denied = false;
    await page.getByRole('button', { name: 'Không phải em?' }).click();
    await page.waitForURL(/\/vao-hoc\.html/);
    await page.locator('#j-name-panel').waitFor({ state: 'visible', timeout: 12000 });
    assert.equal(await page.locator('.join-person').count(), 2,
      'Buổi còn mở: tự lấy lưới tên theo mã cũ');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('happy-student-session')), null);
    assert.equal(leaveCalls, 1);
    leaveOpen = false;
    await page.goto(new URL('index.html', base).href);
    await page.evaluate(() => sessionStorage.setItem('happy-student-session', JSON.stringify({
      student_id: 'student-1', session_id: 'session-1', expires_at: '2027-01-01T00:00:00Z',
      nickname: 'An', avatar: '🐱'
    })));
    await page.reload();
    await page.locator('#home-switch-student').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Không phải em?' }).click();
    await page.waitForURL(/\/vao-hoc\.html/);
    await page.locator('#j-code-panel').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#j-name-panel').isVisible(), false,
      'Buổi đã đóng: phải nhập mã mới');
    assert.equal(leaveCalls, 2);
    assert.deepEqual(errors, [], 'Giao diện có phiên không có lỗi JavaScript');
    await page.close();
  } finally {
    if (server) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
    fs.rmSync(outDir, { recursive: true, force: true });
    if (oldUrl === undefined) delete process.env.VITE_SUPABASE_URL;
    else process.env.VITE_SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.VITE_SUPABASE_ANON_KEY;
    else process.env.VITE_SUPABASE_ANON_KEY = oldKey;
  }
}

(async () => {
  const executablePath = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
    .filter(Boolean).find(p => fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('requestfailed', r => errors.push('Không tải được ' + r.url()));
    await page.goto(pageUrl('index.html'));
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    assert.match(await page.title(), /Happy STEAM/);
    assert.equal(await page.locator('.lesson-card').count(), 18, 'Lớp 1 HK I: 18 tuần (13 bài mô hình, 4 tuần dự án, trưng bày)');
    assert.equal(await page.locator('.lesson-card.is-ready').count(), 16, 'Lớp 1 HK I: các bài sẵn sàng (nay gồm cả bài 1, 4, 5, 6, 8) + 4 tuần dự án + trưng bày sẵn sàng');
    assert.equal(await page.locator('.lesson-card.is-soon').first().getAttribute('aria-disabled'), 'true');
    await page.click('#term-tabs [data-term="2"]');
    assert.equal(await page.locator('.lesson-card').count(), 17, 'Lớp 1 HK II: tuần 19–35');
    await page.click('#grade-tabs [data-grade="2"]');
    assert.match(await page.locator('#home-count').innerText(), /Lớp 2 · Học kì II/i);
    await page.reload();
    assert.equal(await page.locator('#grade-tabs [aria-selected="true"]').getAttribute('data-grade'), '2', 'Nhớ lớp đã chọn');
    await page.goto(pageUrl('index.html?lop=1&hk=1'));
    await page.click('.lesson-card.is-ready[href="bai.html?id=lop1-bai09"]');
    await page.waitForFunction(() => window.robotViewer, null, { timeout: 20000 });
    await page.locator('#lesson-loading').waitFor({ state: 'detached', timeout: 20000 });
    assert.match(await page.title(), /Bài 9/);
    await page.click('.back-link');
    await page.waitForSelector('.lesson-card');
    assert.match(await page.title(), /Chọn bài|Happy STEAM/);
    await page.goto(pageUrl('bai.html?id=khong-co'));
    assert.match(await page.locator('#lesson-loading').innerText(), /Không tìm thấy bài học/);
    assert.equal(await page.locator('#lesson-loading a[href="index.html"]').count(), 1, 'ID sai có link về trang chọn bài');
    const mobile = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true });
    await mobile.goto(pageUrl('index.html?lop=1&hk=1'));
    const d = await mobile.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
    assert.ok(d[0] <= d[1], 'Trang chọn bài không tràn ngang ở 375px: ' + d);
    assert.deepEqual(errors, [], 'Không có lỗi JavaScript / tệp thiếu');
    await smokeStudentHome(browser);
    console.log('PASS: trang chọn bài Lớp → Học kì → Bài, Bài 9 mở được và quay lại được, nhớ lựa chọn, không tràn 375px.');
  } finally {
    await browser.close();
  }
})().catch(e => {
  console.error(e);
  process.exit(1);
});
