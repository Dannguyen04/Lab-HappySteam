// Phiếu 53: luồng giáo viên có Supabase mock, dùng HTTP server của tests/run-suite.js.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('playwright');
const { pageUrl } = require('./helpers/page-url');

(async () => {
  const executablePath = [process.env.ZM_CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe']
    .filter(Boolean).find(p => fs.existsSync(p));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      const ownerId = '00000000-0000-0000-0000-000000005301';
      const assistantId = '00000000-0000-0000-0000-000000005302';
      const classes = [
        { id:'class-a',name:'1A',grade:1,school_year:'2026-2027',week1_monday:'2026-09-07',status:'open' },
        { id:'class-b',name:'1B',grade:1,school_year:'2026-2027',week1_monday:'2026-09-07',status:'open' }
      ];
      const staff = classes.map(c => ({ class_id:c.id, teacher_id:ownerId, role:'owner' }));
      const students = [
        { id:'student-a',nickname:'An',avatar:'🐱',status:'active' },
        { id:'student-b',nickname:'Bình',avatar:'🐰',status:'left' }
      ];
      let invitations = [{ id:'invite-1',class_name:'Lớp 3A' }];
      let pending = [];
      window.__teacherCalls = [];
      window.__teacherMock = {
        owned:true,
        auth: {
          getSession: async () => ({ data: { session: { user: { id:ownerId, email:'owner@example.org' } } } }),
          getUser: async () => ({ data: { user: { id:ownerId,email:'owner@example.org' } } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
          signOut: async () => ({ error: null })
        },
        from(table) {
          const filters = [];
          const query = {
            select() { return query; }, eq(field, value) { filters.push([field,value]); return query; },
            order() { return query; },
            maybeSingle: async () => ({ data:table === 'profiles' ? {id:ownerId,full_name:'Giáo viên'} : null,error:null }),
            then(resolve, reject) {
              const sources = { classes, class_staff:staff,
                lessons:[{id:'lesson-one',grade:1,week:8,title:'Bài thử',current_version:1}] };
              return Promise.resolve({ data:(sources[table]||[]).filter(row => filters.every(([k,v]) => row[k] === v)),error:null }).then(resolve,reject);
            }
          };
          return query;
        },
        async rpc(name, params = {}) {
          window.__teacherCalls.push({name,params});
          let data = {ok:true};
          if (name === 'my_class_invitations') data = invitations;
          if (name === 'respond_class_invitation') invitations = invitations.filter(i => i.id !== params.p_invitation_id);
          if (name === 'class_management_state') data = {
            owner:window.__teacherMock.owned,ungraded_core:2,
            staff:[{teacher_id:ownerId,role:'owner',name:'Giáo viên'},
              {teacher_id:assistantId,role:'assistant',name:'Giáo viên phụ'}],
            invitations:pending,students
          };
          if (name === 'invite_class_assistant') pending.push({id:'new-invite',email:params.p_email});
          if (name === 'revoke_class_invitation') pending = pending.filter(i => i.id !== params.p_invitation_id);
          if (name === 'set_teacher_class_status') {
            classes[0].status = params.p_status;
            data = {ok:true,status:params.p_status,ungraded_core:2};
          }
          if (name === 'class_invite_slips') data = [{nickname:'An',avatar:'🐱',code:'ABCD2345'}];
          if (name === 'reenroll_class_student') students.find(s => s.id === params.p_student_id).status = 'active';
          if (name === 'transfer_class_student') students.find(s => s.id === params.p_student_id).status = 'left';
          return {data,error:null};
        }
      };
    });
    // Bổ sung mock cho import Supabase trong ES module, không gọi bất kỳ máy chủ thật nào.
    await page.route('**/js/supabase-client.js*', route => route.fulfill({
      status:200,contentType:'text/javascript',body:
        'export const supabaseReady=true;export const supabase=window.__teacherMock;'
    }));
    await page.goto(pageUrl('giao-vien.html'));
    await page.locator('#t-home').waitFor({state:'visible'});
    assert.equal(await page.locator('#t-invitations').isVisible(),true);
    await page.getByRole('button',{name:'Nhận lời mời'}).click();
    await page.locator('#t-invitations').waitFor({state:'hidden'});
    await page.locator('#t-classes button').filter({hasText:'Quản lý lớp'}).first().click();
    await page.locator('#t-management').waitFor({state:'visible'});
    assert.equal(await page.locator('#t-owner-tools').isVisible(),true);
    assert.match(await page.locator('#t-student-list').innerText(),/Bình · Đã rời lớp/);
    await page.locator('#t-assistant-email').fill('phu@example.org');
    await page.getByRole('button',{name:'Gửi lời mời'}).click();
    await page.getByText('phu@example.org').waitFor();
    await page.locator('#t-unlock-lesson').selectOption('lesson-one');
    await page.getByRole('button',{name:'Mở bài'}).click();
    await page.getByRole('button',{name:'Thêm lại lớp'}).click();
    await page.getByRole('button',{name:'Xem và in phiếu mời A4'}).click();
    await page.locator('#t-slips').waitFor({state:'visible'});
    assert.equal(await page.locator('.t-slip-code').innerText(),'ABCD2345');
    assert.doesNotMatch(await page.locator('#t-slips').innerText(),/Nguyễn Văn An/);
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('.wrap').evaluate(e => getComputedStyle(e).display),'none');
    assert.equal(await page.locator('#t-slips-grid').evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length),2);
    await page.emulateMedia({media:'screen'});
    await page.locator('#t-slips-close').click();
    const prompts = [];
    page.on('dialog', dialog => { prompts.push(dialog.message()); dialog.accept(); });
    await page.getByRole('button',{name:'Kết thúc lớp'}).click();
    await page.getByRole('button',{name:'Mở lại lớp'}).waitFor();
    assert.match(prompts[0],/2 bài xong cơ bản chưa chấm/);
    await page.getByRole('button',{name:'Mở lại lớp'}).click();
    await page.getByRole('button',{name:'Kết thúc lớp'}).waitFor();
    await page.getByRole('button',{name:/Chuyển sang 1B/}).first().click();
    await page.getByRole('button',{name:'Chuyển vai chủ lớp'}).click();
    assert.ok((await page.evaluate(() => window.__teacherCalls)).some(x => x.name === 'manage_class_staff' && x.params.p_action === 'transfer'));
    assert.deepEqual(errors,[]);
    console.log('teacher-lifecycle.smoke OK (mock, in A4, vòng đời, ghi danh và phân công)');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
