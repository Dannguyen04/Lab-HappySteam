// S-01: phiên xác thực ẩn danh Supabase; máy chỉ nhận student_id SAU khi giáo viên duyệt.
import { supabase, supabaseReady } from './supabase-client.js';

const $ = id => document.getElementById(id);
let code = '';
let roster = [];
let selected = null;
let tag = '';
let timer = null;
let busy = false;
let checking = false;
let cancelling = false;
let joinedDuringCancel = false;
let joinedWithWarning = false;
let approvedJoin = null;
let activeCheck = Promise.resolve();
const panelIds = ['j-code-panel', 'j-name-panel', 'j-wait-panel'];
function show(id) { panelIds.forEach(k => { $(k).hidden = k !== id; }); }
function notice(icon, text) {
  $('j-notice').textContent = text; // icon bỏ: không dùng emoji làm icon giao diện
  $('j-notice').hidden = !text;
}
function keyDisplay() {
  $('j-code').textContent = code.padEnd(4, '•').split('').join(' ');
  $('j-lookup').disabled = code.length !== 4 || busy;
  $('j-code-hidden').value = code;
  $('j-code-hidden').disabled = busy;
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
  $('j-code').classList.add('is-loading');
  notice('', 'Đang tìm lớp...');
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
  finally { busy = false; $('j-code').classList.remove('is-loading'); keyDisplay(); }
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
    joinedWithWarning = false;
    approvedJoin = null;
    $('j-wait-continue').hidden = true;
    tag = data.device_tag || tag;
    $('j-device-tag').textContent = tag ? 'Máy của em: ' + tag : '';
    $('j-wait-icon').dataset.state = 'pending';
    $('j-wait-title').textContent = 'Đợi thầy cô duyệt nhé!';
    $('j-wait-detail').textContent = `Em đã chọn ${person.avatar} ${person.nickname}.`;
    notice('', '');
    show('j-wait-panel');
    if (timer) clearInterval(timer);
    await pollApproval();
    if (selected && !cancelling) timer = setInterval(pollApproval, 3000);
  } catch (error) { notice('📶', invalid(error)); }
  finally { busy = false; }
}
function pollApproval() {
  if (checking) return activeCheck;
  activeCheck = checkApproval();
  return activeCheck;
}
async function checkApproval() {
  if (!selected || checking || cancelling) return;
  checking = true;
  try {
    const { data, error } = await supabase.rpc('join_session', { p_code: code });
    if (cancelling) {
      if (data?.ok) joinedDuringCancel = true;
      return;
    }
    if (error || (!data?.ok && data?.status !== 'pending')) {
      if (timer) clearInterval(timer);
      timer = null;
      selected = null;
      approvedJoin = null;
      $('j-wait-continue').hidden = true;
      show('j-name-panel');
      notice('🔒', invalid(error || data));
      return;
    }
    if (!data.ok) return;
    if (timer) clearInterval(timer);
    timer = null;
    if (data.warnings?.includes('BR-BH-02')) {
      joinedWithWarning = true;
      notice('⚠️', 'Bạn này đang học ở máy khác. Hỏi thầy cô nhé.');
      // Học sinh đã được duyệt; cảnh báo rõ trước khi tiếp tục.
      $('j-wait-icon').dataset.state = 'warning';
      $('j-wait-title').textContent = 'Tên này có máy khác!';
      $('j-wait-detail').textContent = 'Thầy cô đã duyệt. Chạm để tiếp tục.';
      approvedJoin = data;
      $('j-wait-continue').hidden = false;
      return;
    }
    finish(data);
  } catch (error) { notice('📶', invalid(error)); }
  finally { checking = false; }
}
function finish(data) {
  sessionStorage.setItem('happy-student-session', JSON.stringify({
    student_id: data.student_id, session_id: data.session_id,
    expires_at: data.expires_at, nickname: selected.nickname, avatar: selected.avatar,
    join_code: code
  }));
  sessionStorage.removeItem('happy-join-code');
  location.assign('index.html');
}
async function backToNames() {
  if (cancelling || !selected) return;
  cancelling = true;
  if (timer) clearInterval(timer);
  timer = null;
  try {
    await activeCheck;
    const { data, error } = await supabase.rpc('cancel_join', { p_code: code });
    if (error || !data?.ok) throw error || new Error('Không hủy được yêu cầu.');
    // Nếu giáo viên duyệt ngay lúc bấm Đổi tên, trả luôn phiên vừa vào.
    if (joinedDuringCancel || joinedWithWarning) {
      const left = await supabase.rpc('leave_session');
      if (left.error || !left.data?.ok) throw left.error || new Error('Không rời được phiên.');
    }
    selected = null;
    joinedDuringCancel = false;
    joinedWithWarning = false;
    approvedJoin = null;
    $('j-wait-continue').hidden = true;
    if (!data.session_open) { code = ''; keyDisplay(); }
    notice('', '');
    show(data.session_open ? 'j-name-panel' : 'j-code-panel');
  } catch (error) {
    notice('📶', error.message || 'Không hủy được yêu cầu. Thử lại nhé!');
  } finally { cancelling = false; }
}
function init() {
  $('j-code-hidden').addEventListener('input', event => {
    if (busy || $('j-code-panel').hidden) return;
    code = event.target.value.replace(/\D/g, '').slice(0, 4);
    notice('', '');
    keyDisplay();
    if (code.length === 4) lookup();
  });
  $('j-keypad').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    appendKey(button.dataset.digit || button.dataset.action);
  });
  window.addEventListener('keydown', event => {
    if ($('j-code-panel').hidden) return;
    if (event.target === $('j-code-hidden') || event.altKey || event.ctrlKey || event.metaKey) return;
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
  $('j-wait-continue').addEventListener('click', () => {
    if (approvedJoin && selected && !cancelling) {
      const data = approvedJoin;
      approvedJoin = null;
      $('j-wait-continue').hidden = true;
      finish(data);
    }
  });
  if (!supabaseReady) notice('📶', 'Chưa kết nối lớp học. Nhờ thầy cô kiểm tra nhé.');
  keyDisplay();
  const previous = sessionStorage.getItem('happy-join-code');
  sessionStorage.removeItem('happy-join-code');
  if (/^\d{4}$/.test(previous || '')) {
    code = previous;
    keyDisplay();
    lookup();
  }
}
init();
