// S-01: phiên xác thực ẩn danh Supabase; máy chỉ nhận student_id SAU khi giáo viên duyệt.
import { supabase, supabaseReady } from './supabase-client.js';

const $ = id => document.getElementById(id);
let code = '';
let roster = [];
let selected = null;
let tag = '';
let timer = null;
let busy = false;
const panelIds = ['j-code-panel', 'j-name-panel', 'j-wait-panel'];
function show(id) { panelIds.forEach(k => { $(k).hidden = k !== id; }); }
function notice(icon, text) {
  $('j-notice').textContent = icon + ' ' + text;
  $('j-notice').hidden = !text;
}
function keyDisplay() {
  $('j-code').textContent = code.padEnd(4, '•').split('').join(' ');
  $('j-lookup').disabled = code.length !== 4 || busy;
}
function invalid(error) {
  if (error?.message?.includes('ZM_BLOCK_RATE_LIMIT') || error?.error === 'ZM_BLOCK_RATE_LIMIT')
    return 'Có quá nhiều lượt thử mã. Đợi vài phút rồi thử lại nhé.';
  if (error?.message?.includes('ZM_BLOCK_BR_BH_01') || error?.error === 'ZM_BLOCK_BR_BH_01')
    return 'Mã chưa đúng hoặc buổi đã đóng.';
  return 'Có lỗi kết nối. Thử lại nhé!';
}
function appendKey(digit) {
  if (busy || $('j-code-panel').hidden) return;
  if (digit === 'back') code = code.slice(0, -1);
  else if (digit === 'clear') code = '';
  else if (code.length < 4) code += digit;
  notice('', '');
  keyDisplay();
  // Đủ bốn số là tự kiểm tra, không cần thêm lần chạm.
  if (code.length === 4) lookup();
}
async function anonymousSession() {
  if (!supabaseReady) throw new Error('Chưa kết nối lớp học.');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (session?.user) {
    if (!session.user.is_anonymous) throw new Error('Hãy mở trang này trên máy học sinh hoặc cửa sổ riêng.');
    return;
  }
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}
async function lookup() {
  if (busy || code.length !== 4) return;
  busy = true; keyDisplay();
  try {
    await anonymousSession();
    const { data, error } = await supabase.rpc('session_roster', { p_code: code });
    if (error || !data?.ok) {
      notice('🔒', invalid(error || data));
      return;
    }
    roster = data.roster || [];
    tag = data.device_tag || '';
    const grid = $('j-roster');
    grid.replaceChildren();
    if (!roster.length) { notice('🐾', 'Lớp chưa có tên. Hỏi thầy cô nhé.'); return; }
    for (const person of roster) {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'join-person';
      const avatar = document.createElement('span');
      avatar.className = 'join-animal'; avatar.textContent = person.avatar;
      const name = document.createElement('span');
      name.className = 'join-person-name'; name.textContent = person.nickname;
      btn.append(avatar, name);
      btn.addEventListener('click', () => requestName(person));
      grid.append(btn);
    }
    notice('', '');
    show('j-name-panel');
  } catch (error) { notice('📶', error.message || 'Không kết nối được.'); }
  finally { busy = false; keyDisplay(); }
}
async function requestName(person) {
  if (busy) return;
  busy = true;
  try {
    const { data, error } = await supabase.rpc('request_join', { p_code: code, p_pick: person.pick });
    if (error || !data?.ok) {
      notice('⚠️', invalid(error || data)); return;
    }
    selected = person;
    tag = data.device_tag || tag;
    $('j-device-tag').textContent = tag ? 'Máy của em: ' + tag : '';
    $('j-wait-icon').textContent = '⏳';
    $('j-wait-title').textContent = 'Đợi thầy cô duyệt nhé!';
    $('j-wait-detail').textContent = `Em đã chọn ${person.avatar} ${person.nickname}.`;
    notice('', '');
    show('j-wait-panel');
    if (timer) clearInterval(timer);
    await checkApproval();
    if (selected) timer = setInterval(checkApproval, 3000);
  } catch (error) { notice('📶', invalid(error)); }
  finally { busy = false; }
}
let checking = false;
async function checkApproval() {
  if (!selected || checking) return;
  checking = true;
  try {
    const { data, error } = await supabase.rpc('join_session', { p_code: code });
    if (error || (!data?.ok && data?.status !== 'pending')) {
      if (timer) clearInterval(timer);
      timer = null;
      selected = null;
      show('j-name-panel');
      notice('🔒', invalid(error || data));
      return;
    }
    if (!data.ok) return;
    if (timer) clearInterval(timer);
    timer = null;
    if (data.warnings?.includes('BR-BH-02')) {
      notice('⚠️', 'Bạn này đang học ở máy khác. Hỏi thầy cô nhé.');
      // Học sinh đã được duyệt; cảnh báo rõ trước khi tiếp tục.
      $('j-wait-icon').textContent = '⚠️';
      $('j-wait-title').textContent = 'Tên này có máy khác!';
      $('j-wait-detail').textContent = 'Thầy cô đã duyệt. Chạm để tiếp tục.';
      const go = document.createElement('button');
      go.className = 'join-primary'; go.textContent = 'Tiếp tục vào lớp';
      go.addEventListener('click', () => finish(data), { once: true });
      $('j-wait-panel').append(go);
      return;
    }
    finish(data);
  } catch (error) { notice('📶', invalid(error)); }
  finally { checking = false; }
}
function finish(data) {
  sessionStorage.setItem('happy-student-session', JSON.stringify({
    student_id: data.student_id, session_id: data.session_id,
    expires_at: data.expires_at, nickname: selected.nickname, avatar: selected.avatar
  }));
  location.assign('index.html');
}
function backToNames() {
  if (timer) clearInterval(timer);
  timer = null;
  selected = null;
  notice('', '');
  show('j-name-panel');
}
function init() {
  $('j-keypad').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    appendKey(button.dataset.digit || button.dataset.action);
  });
  window.addEventListener('keydown', event => {
    if ($('j-code-panel').hidden) return;
    if (/^\d$/.test(event.key)) appendKey(event.key);
    else if (event.key === 'Backspace') appendKey('back');
    else if (event.key === 'Escape') appendKey('clear');
  });
  $('j-lookup').addEventListener('click', lookup);
  $('j-change-code').addEventListener('click', () => {
    if (timer) clearInterval(timer);
    selected = null; roster = []; show('j-code-panel'); notice('', '');
  });
  $('j-change-name').addEventListener('click', backToNames);
  if (!supabaseReady) notice('📶', 'Chưa kết nối lớp học. Nhờ thầy cô kiểm tra nhé.');
  keyDisplay();
}
init();
