// js/teacher-auth.js – S-05 đăng nhập giáo viên bằng magic link (BRD F-01). Quyền đọc do RLS lo.
import { supabase, supabaseReady } from './supabase-client.js';
import { renderClassBoard, bindClassBoard, stopClassSession } from './teacher-class.js';

const $ = id => document.getElementById(id);
const panels = ['t-offline', 't-login', 't-profile', 't-home'];

function show(name) { panels.forEach(id => { $(id).hidden = id !== name; }); }
function say(text, kind) {
  const el = $('t-status');
  el.textContent = text || '';
  el.hidden = !text;
  el.className = 't-msg' + (kind ? ' is-' + kind : '');
}

async function afterSignIn(user) {
  say('');
  const { data: profile, error } = await supabase.from('profiles').select('id, full_name').eq('id', user.id).maybeSingle();
  if (error) { say('Không đọc được hồ sơ. Thầy cô thử tải lại trang nhé.', 'error'); show('t-login'); return; }
  if (!profile) { show('t-profile'); $('t-name').focus(); return; }
  $('t-user').textContent = `${profile.full_name} (${user.email})`;
  show('t-home');
  await renderClassBoard();
}

async function onLogin(e) {
  e.preventDefault();
  const email = $('t-email').value.trim();
  if (!/^\S+@\S+\.\S+$/.test(email)) { say('Email chưa đúng, thầy cô kiểm tra lại nhé.', 'error'); return; }
  $('t-send').disabled = true;
  const { error } = await supabase.auth.signInWithOtp({
    email, options: { emailRedirectTo: location.origin + location.pathname }
  });
  $('t-send').disabled = false;
  if (error) say('Chưa gửi được liên kết. Thầy cô thử lại sau ít phút.', 'error');
  else say('Đã gửi liên kết vào email. Thầy cô mở thư và bấm vào liên kết để đăng nhập.', 'ok');
}

async function onProfile(e) {
  e.preventDefault();
  const name = $('t-name').value.trim();
  if (name.length < 1 || name.length > 80) { say('Họ và tên cần từ 1 đến 80 ký tự.', 'error'); return; }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { show('t-login'); return; }
  const { error } = await supabase.rpc('ensure_profile', { p_full_name: name });
  if (error) { say('Chưa lưu được họ tên. Thầy cô thử lại sau nhé.', 'error'); return; }
  await afterSignIn(session.user);
}

async function init() {
  if (!supabaseReady) { show('t-offline'); return; }
  $('t-login-form').addEventListener('submit', onLogin);
  $('t-profile-form').addEventListener('submit', onProfile);
  bindClassBoard();
  $('t-logout').addEventListener('click', async () => {
    stopClassSession();
    await supabase.auth.signOut();
    say('Đã đăng xuất.', 'ok');
    show('t-login');
  });
  const { data: { session } } = await supabase.auth.getSession();
  if (session) await afterSignIn(session.user); else show('t-login');
  supabase.auth.onAuthStateChange((event, s) => {
    if (event === 'SIGNED_IN' && s && $('t-home').hidden && $('t-profile').hidden) afterSignIn(s.user);
  });
}

init();
