// Phiếu 44: trình duyệt thật, Vite local và Supabase Auth/RPC giả lập.
// Chạy độc lập: node tests/student-join.smoke.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright');

(async () => {
  const originalUrl = process.env.VITE_SUPABASE_URL;
  const originalKey = process.env.VITE_SUPABASE_ANON_KEY;
  process.env.VITE_SUPABASE_URL = 'https://supabase.mock.invalid';
  process.env.VITE_SUPABASE_ANON_KEY = 'local-mock-anon-key';
  const { build, preview } = await import('vite');
  const buildRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'happysteam-join-'));
  const executablePath = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
    .filter(Boolean).find(file => fs.existsSync(file));
  let browser;
  let server;
  try {
    const configFile = path.resolve(__dirname, '../vite.config.js');
    await build({ configFile, build: { outDir: buildRoot, emptyOutDir: true }, logLevel: 'error' });
    server = await preview({ configFile, build: { outDir: buildRoot },
      preview: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
    const base = server.resolvedUrls.local[0];
    browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
    const page = await browser.newPage({ viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true });
    const pageErrors = [];
    page.on('pageerror', error => {
      if (new URL(page.url()).pathname.endsWith('/vao-hoc.html')) pageErrors.push(error.message);
    });
    let approved = false;
    const calls = [];
    const user = {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', aud: 'authenticated',
      role: 'authenticated', is_anonymous: true, app_metadata: { provider: 'anonymous', providers: ['anonymous'] },
      user_metadata: {}, created_at: '2026-11-01T00:00:00Z'
    };
    const jwt = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(JSON.stringify({ sub: user.id, role: user.role, exp: 1924992000, is_anonymous: true })).toString('base64url'),
      'fake_signature'
    ].join('.');
    await page.route('https://supabase.mock.invalid/**', async route => {
      const request = route.request();
      const endpoint = new URL(request.url()).pathname;
      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: {
          'access-control-allow-origin': '*', 'access-control-allow-methods': 'POST,GET,OPTIONS',
          'access-control-allow-headers': 'authorization,apikey,content-type,x-client-info'
        } });
        return;
      }
      const args = request.postDataJSON() || {};
      calls.push({ endpoint, args });
      let response;
      if (endpoint === '/auth/v1/signup') {
        response = { access_token: jwt, token_type: 'bearer', expires_in: 31536000,
          expires_at: 1924992000, refresh_token: 'test-refresh-token', user };
      } else if (endpoint === '/auth/v1/user') {
        response = user;
      } else if (endpoint === '/rest/v1/rpc/session_roster') {
        response = args.p_code === '1234'
          ? { ok: true, device_tag: 'M7', roster: [
            { nickname: 'An', avatar: '🐱', pick: 'pick-an' },
            { nickname: 'Bình', avatar: '🐶', pick: 'pick-binh' }] }
          : { ok: false, error: 'ZM_BLOCK_BR_BH_01' };
      } else if (endpoint === '/rest/v1/rpc/request_join') {
        assert.deepEqual(args, { p_code: '1234', p_pick: 'pick-an' });
        response = { ok: true, status: 'pending', device_tag: 'M7' };
      } else if (endpoint === '/rest/v1/rpc/cancel_join') {
        assert.deepEqual(args, { p_code: '1234' });
        response = { ok: true, cancelled: !approved, session_open: true };
      } else if (endpoint === '/rest/v1/rpc/leave_session') {
        response = { ok: true, session_open: true, join_code: '1234' };
      } else if (endpoint === '/rest/v1/rpc/join_session') {
        assert.equal(args.p_code, '1234');
        response = approved
          ? { ok: true, status: 'approved', student_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            session_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
            expires_at: '2027-01-01T00:00:00Z', warnings: ['BR-BH-02'] }
          : { ok: false, status: 'pending', warnings: [] };
      } else if (endpoint === '/rest/v1/rpc/student_home_state') {
        assert.equal(args.p_student_id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
        response = { ok: true, grade: 1, class_id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          class_name: 'Lớp 1A', current_week: 4,
          lessons: { 'lop1-bai03': true, 'lop1-bai09': false } };
      } else {
        throw new Error('Unexpected Supabase request: ' + request.url());
      }
      await route.fulfill({
        status: 200, contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
        body: JSON.stringify(response)
      });
    });

    await page.goto(new URL('vao-hoc.html', base).href);
    const pad = page.locator('#j-keypad button[data-digit]');
    const size = await pad.first().boundingBox();
    assert.ok(size.width >= 56 && size.height >= 56, 'Bàn phím có vùng chạm >=56px');
    for (const digit of '0000') await page.locator(`#j-keypad button[data-digit="${digit}"]`).click();
    await page.locator('#j-notice').waitFor({ state: 'visible', timeout: 7000 }).catch(async error => {
      throw new Error(`Expected invalid-code notice. ${error.message}; code=${await page.locator('#j-code').innerText()}; calls=${JSON.stringify(calls)}; pageErrors=${JSON.stringify(pageErrors)}`);
    });
    await page.waitForFunction(() => /Mã chưa đúng/.test(document.querySelector('#j-notice').innerText), null, { timeout: 7000 });
    assert.match(await page.locator('#j-notice').innerText(), /Mã chưa đúng/);
    assert.equal(await page.locator('#j-code-panel').isVisible(), true);

    await page.locator('[data-action="clear"]').click();
    for (const digit of '1234') await page.locator(`#j-keypad button[data-digit="${digit}"]`).click();
    await page.locator('#j-name-panel').waitFor({ state: 'visible' });
    assert.equal(await page.locator('.join-person').count(), 2);
    const personSize = await page.locator('.join-person').first().boundingBox();
    assert.ok(personSize.width >= 56 && personSize.height >= 56, 'Tên/con vật có vùng chạm >=56px');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true,
      'Không tràn ngang trên màn hình 375px');
    await page.locator('.join-person').first().click();
    await page.locator('#j-wait-panel').waitFor({ state: 'visible' });
    assert.match(await page.locator('#j-wait-title').innerText(), /Đợi thầy cô/);
    assert.ok(calls.some(call => call.endpoint.endsWith('/request_join')));
    assert.ok(calls.some(call => call.endpoint.endsWith('/join_session')));
    await page.locator('#j-change-name').click();
    await page.locator('#j-name-panel').waitFor({ state: 'visible' });
    assert.equal(calls.filter(call => call.endpoint.endsWith('/cancel_join')).length, 1,
      'Đổi tên phải huỷ yêu cầu chờ trước khi về lưới tên');
    assert.equal(await page.locator('.join-person').count(), 2);
    await page.locator('.join-person').first().click();
    await page.locator('#j-wait-panel').waitFor({ state: 'visible' });
    assert.equal(calls.filter(call => call.endpoint.endsWith('/request_join')).length, 2,
      'Chọn lại tên phải gửi yêu cầu duyệt mới');
    approved = true;
    await page.locator('#j-wait-title').getByText('Tên này có máy khác!').waitFor({ timeout: 12000 });
    await page.locator('#j-change-name').click();
    await page.locator('#j-name-panel').waitFor({ state: 'visible' });
    assert.equal(calls.filter(call => call.endpoint.endsWith('/cancel_join')).length, 2);
    assert.equal(calls.filter(call => call.endpoint.endsWith('/leave_session')).length, 1,
      'Đã duyệt với cảnh báo: đổi tên phải rời phiên vừa được cấp');
    await page.locator('.join-person').first().click();
    await page.locator('#j-wait-title').getByText('Tên này có máy khác!').waitFor({ timeout: 12000 });
    assert.equal(await page.getByRole('button', { name: 'Tiếp tục vào lớp' }).count(), 1,
      'Không giữ nút tiếp tục cũ sau khi đổi tên');
    await page.getByRole('button', { name: 'Tiếp tục vào lớp' }).click();
    await page.waitForURL(/\/index\.html(?:\?|$)/, { timeout: 12000 });
    await page.locator('#home-student-name').getByText('An').waitFor();
    await page.locator('#grade-tabs [data-grade]').first().waitFor({ timeout: 12000 });
    assert.equal(await page.locator('#grade-tabs [data-grade]').count(), 1);
    await page.locator('.lesson-card.is-locked').first().waitFor();
    const student = await page.evaluate(() => JSON.parse(sessionStorage.getItem('happy-student-session')));
    assert.equal(student.nickname, 'An');
    assert.equal(student.avatar, '🐱');
    assert.equal(student.student_id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
    assert.deepEqual(pageErrors, []);
    // Phiếu 52/6: tạo lớp trên giao diện giáo viên phải lấy ngẫu nhiên từ con vật chưa dùng.
    const teacher = { ...user, id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
      is_anonymous: false, email: 'teacher@example.test', app_metadata: { provider: 'email', providers: ['email'] } };
    const teacherJwt = [
      Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
      Buffer.from(JSON.stringify({ sub: teacher.id, role: 'authenticated', exp: 1924992000 })).toString('base64url'),
      'fake_signature'
    ].join('.');
    const teacherPage = await browser.newPage();
    try {
      let opened = 0;
      teacherPage.on('dialog', dialog => dialog.accept());
      await teacherPage.addInitScript(({ token, teacher }) => {
        Math.random = () => 0.99;
        localStorage.setItem('sb-supabase-auth-token', JSON.stringify({
          access_token: token, token_type: 'bearer', expires_in: 31536000,
          expires_at: 1924992000, refresh_token: 'test-refresh-token', user: teacher
        }));
      }, { token: teacherJwt, teacher });
      await teacherPage.route('https://supabase.mock.invalid/**', async route => {
        const endpoint = new URL(route.request().url()).pathname;
        let response;
        if (endpoint === '/auth/v1/user') response = teacher;
        else if (endpoint === '/rest/v1/profiles') response = { id: teacher.id, full_name: 'Giáo viên' };
        else if (endpoint === '/rest/v1/classes') response = [{
          id: 'class-52', name: 'Lớp 1A', grade: 1, school_year: '2026-2027',
          week1_monday: '2026-10-05', status: 'open'
        }];
        else if (endpoint === '/rest/v1/class_staff') response = [{
          class_id: 'class-52', teacher_id: teacher.id, role: 'owner'
        }];
        else if (endpoint === '/rest/v1/rpc/open_session') {
          assert.deepEqual(route.request().postDataJSON(), { p_class_id: 'class-52' });
          opened++;
          response = { ok: true, session_id: `session-${opened}`,
            join_code: opened === 1 ? '1234' : '5678',
            expires_at: '2027-01-01T00:00:00Z', closed_previous: opened > 1 };
        } else if (endpoint === '/rest/v1/rpc/list_pending_devices' ||
                   endpoint === '/rest/v1/rpc/session_attendees' ||
                   endpoint === '/rest/v1/rpc/my_class_invitations') response = [];
        else if (endpoint === '/rest/v1/class_sessions') response = { closed_at: null };
        else throw new Error('Unexpected teacher mock request: ' + endpoint);
        await route.fulfill({ status: 200, contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(response) });
      });
      await teacherPage.goto(new URL('giao-vien.html', base).href);
      await teacherPage.locator('#t-new-class').waitFor({ state: 'visible', timeout: 12000 });
      await teacherPage.locator('#t-new-class').click();
      await teacherPage.locator('#t-paste').fill('An\nBình\nMinh');
      await teacherPage.locator('#t-add-names').click();
      const avatars = await teacherPage.locator('#t-roster-editor select').evaluateAll(
        selects => selects.map(select => select.value));
      assert.equal(avatars.length, 3);
      assert.equal(new Set(avatars).size, 3, 'Mỗi em nhận con vật chưa dùng');
      assert.notEqual(avatars[0], '🐱', 'Random=0.99 không được chọn con vật đầu danh sách');
      await teacherPage.getByRole('button', { name: 'Bắt đầu buổi học' }).click();
      await teacherPage.locator('#t-join-code').getByText('1234').waitFor();
      await teacherPage.getByRole('button', { name: 'Bắt đầu buổi học' }).click();
      await teacherPage.locator('#t-join-code').getByText('5678').waitFor();
      assert.match(await teacherPage.locator('#t-status').innerText(), /Đã đóng buổi cũ/,
        'Giáo viên phải được báo khi mở buổi mới thay buổi cũ');
    } finally { await teacherPage.close(); }
    console.log('student-join.smoke OK: mã sai → mã đúng → chờ duyệt → huỷ/đổi tên → duyệt → vào lớp; mobile 375px');
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve()));
    fs.rmSync(buildRoot, { recursive: true, force: true });
    if (originalUrl === undefined) delete process.env.VITE_SUPABASE_URL;
    else process.env.VITE_SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.VITE_SUPABASE_ANON_KEY;
    else process.env.VITE_SUPABASE_ANON_KEY = originalKey;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
