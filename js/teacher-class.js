// S-05/S-06: lớp, danh sách tên gọi ngắn và màn chiếu buổi học.
import { supabase } from './supabase-client.js';
import { renderInvitationInbox, openClassManagement, bindLifecycleBoard, closeClassManagement } from './teacher-lifecycle.js';

const $ = id => document.getElementById(id);
const animals = ['🐱','🐶','🐼','🐻','🐰','🦊','🐯','🦁','🐸','🐵','🐨','🐷','🐮','🐴','🐙','🦉','🦄','🐧','🐢','🐳','🐬','🦋','🐝','🐞','🐌','🐿️','🦔','🦦','🦥','🦒','🐘','🦓','🦘','🦚','🦜','🦩','🦕','🦖','🦀','🦞','🐠','🐡','🦭','🐺','🐗','🦌','🦏','🦛','🐫','🐐','🦙','🦨','🦡','🐊','🐓','🦃','🦢','🦅','🦇','🐉'];
let editingId = null;
let roster = [];
let activeSession = null;
let poller = null;
let refreshing = false;
let gradebookToken = 0;

const el = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
};
function message(text, kind = '') {
  $('t-status').textContent = text;
  $('t-status').hidden = !text;
  $('t-status').className = 't-msg' + (kind ? ' is-' + kind : '');
}
function pickAvatar() {
  const occupied = new Set(roster.map(r => r.avatar));
  const available = animals.filter(a => !occupied.has(a));
  return available.length ? available[Math.floor(Math.random() * available.length)] : `🐾${roster.length + 1}`;
}
function monday(dateString) {
  const d = new Date(dateString + 'T12:00:00');
  if (Number.isNaN(d.valueOf())) return '';
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}
const cleanName = name => name.trim().replace(/\s+/g, ' ');
const nameKey = name => cleanName(name).toLocaleLowerCase('vi');
function duplicateNames(names) {
  const seen = new Set();
  const duplicates = new Set();
  names.filter(Boolean).forEach(name => {
    const key = nameKey(name);
    if (seen.has(key)) duplicates.add(key);
    seen.add(key);
  });
  return duplicates;
}
function duplicateHelp(names) {
  const duplicates = duplicateNames(names);
  if (!duplicates.size) return '';
  const example = cleanName(names.find(n => duplicates.has(nameKey(n)))).split(' ')[0].slice(0, 8);
  return `Tên "${example}" bị trùng. Gợi ý: "${example} B." và "${example} T." (chọn chữ cái họ đúng của từng em).`;
}
function updateNameHints() {
  const conflicts = duplicateNames(roster.map(s => s.nickname));
  [...$('t-roster-editor').children].forEach((row, index) => {
    const input = row.querySelector('input');
    const hint = row.querySelector('.t-name-hint');
    const conflict = conflicts.has(nameKey(roster[index].nickname));
    input.setAttribute('aria-invalid', String(conflict));
    hint.hidden = !conflict;
    hint.textContent = conflict ? 'Tên trùng — thêm chữ cái họ (ví dụ: An B., An T.)' : '';
  });
}
function drawRoster() {
  const root = $('t-roster-editor');
  root.replaceChildren();
  $('t-roster-count').textContent = `${roster.length} em`;
  roster.forEach((student, index) => {
    const row = el('div', undefined, 't-student-row');
    const avatar = el('select');
    avatar.setAttribute('aria-label', `Con vật của ${student.nickname}`);
    const values = animals.includes(student.avatar) ? animals : [student.avatar, ...animals];
    values.forEach(a => {
      const opt = el('option', a);
      opt.value = a;
      avatar.append(opt);
    });
    avatar.value = student.avatar;
    avatar.addEventListener('change', () => { student.avatar = avatar.value; });
    const nickname = el('input');
    nickname.maxLength = 12;
    nickname.value = student.nickname;
    nickname.setAttribute('aria-label', `Tên gọi ngắn học sinh ${index + 1}`);
    nickname.addEventListener('input', () => { student.nickname = nickname.value; updateNameHints(); });
    const nameHint = el('small', '', 't-name-hint');
    nameHint.hidden = true;
    const remove = el('button', 'Xóa', 'btn');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Xóa học sinh ${index + 1}`);
    remove.addEventListener('click', () => { roster.splice(index, 1); drawRoster(); });
    row.append(avatar, nickname, nameHint, remove);
    root.append(row);
  });
  updateNameHints();
}
function showEditor(open) {
  $('t-class-form').hidden = !open;
  if (open) $('t-class-name').focus();
}
function newClass() {
  editingId = null;
  roster = [];
  $('t-editor-title').textContent = 'Tạo lớp mới';
  $('t-class-form').reset();
  $('t-school-year').value = '2026-2027';
  const today = new Date();
  const localDate = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
  $('t-week-one').value = monday(localDate);
  drawRoster();
  showEditor(true);
  message('');
}
async function editClass(c) {
  editingId = c.id;
  $('t-editor-title').textContent = 'Sửa lớp ' + c.name;
  $('t-class-name').value = c.name;
  $('t-grade').value = c.grade;
  $('t-school-year').value = c.school_year;
  $('t-week-one').value = c.week1_monday;
  const [{ data: breaks, error: breaksError }, { data: enrollments, error: enrollmentError }] = await Promise.all([
    supabase.from('class_breaks').select('week_monday,note').eq('class_id', c.id).order('week_monday'),
    supabase.from('enrollments').select('student_id').eq('class_id', c.id).eq('status', 'active')
  ]);
  if (breaksError || enrollmentError) { message('Không tải được lớp này. Thử lại nhé.', 'error'); return; }
  $('t-breaks').value = breaks.map(b => `${b.week_monday}${b.note ? ' | ' + b.note : ''}`).join('\n');
  if (enrollments.length) {
    const { data, error } = await supabase.from('students').select('id,nickname,avatar')
      .in('id', enrollments.map(e => e.student_id)).order('nickname');
    if (error) { message('Không tải được danh sách học sinh.', 'error'); return; }
    roster = data.map(s => ({ id: s.id, nickname: s.nickname, avatar: s.avatar }));
  } else roster = [];
  drawRoster();
  showEditor(true);
  message('');
}
function addNames() {
  const names = $('t-paste').value.split(/\r?\n/).map(cleanName).filter(Boolean);
  if (names.some(n => n.length > 12) || roster.length + names.length > 60) {
    message('Mỗi tên tối đa 12 ký tự, mỗi lớp tối đa 60 em.', 'error');
    return;
  }
  const help = duplicateHelp([...roster.map(s => s.nickname), ...names]);
  if (help) { message(help, 'error'); return; }
  names.forEach(nickname => roster.push({ nickname, avatar: pickAvatar() }));
  $('t-paste').value = '';
  drawRoster();
  message('Đã thêm tên. Thầy cô có thể sửa tên và con vật trước khi lưu.', 'ok');
}
async function saveClass(event) {
  event.preventDefault();
  const week1 = monday($('t-week-one').value);
  if (!week1) { message('Chọn ngày bắt đầu tuần 1.', 'error'); return; }
  $('t-week-one').value = week1;
  const breaks = $('t-breaks').value.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const [date, ...note] = line.split('|');
    return { monday: date.trim(), note: note.join('|').trim() };
  });
  if (breaks.some(b => !/^\d{4}-\d\d-\d\d$/.test(b.monday) || monday(b.monday) !== b.monday || b.monday <= week1) ||
      new Set(breaks.map(b => b.monday)).size !== breaks.length) {
    message('Tuần nghỉ phải là thứ Hai sau tuần 1, không được trùng.', 'error'); return;
  }
  const help = duplicateHelp(roster.map(s => s.nickname));
  if (help) { message(help, 'error'); updateNameHints(); return; }
  if (roster.some(s => !cleanName(s.nickname) || cleanName(s.nickname).length > 12) ||
      new Set(roster.map(s => s.avatar)).size !== roster.length) {
    message('Kiểm tra tên (1–12 ký tự) và con vật không được trùng.', 'error'); return;
  }
  const btn = $('t-save-class');
  btn.disabled = true;
  try {
    const { data, error } = await supabase.rpc('save_teacher_class', {
      p_class_id: editingId, p_name: $('t-class-name').value.trim(),
      p_grade: Number($('t-grade').value), p_school_year: $('t-school-year').value.trim(),
      p_week1_monday: week1, p_breaks: breaks, p_students: roster.map(s => ({
        ...(s.id ? { id: s.id } : {}), nickname: cleanName(s.nickname), avatar: s.avatar
      }))
    });
    if (error || !data?.ok) throw error || new Error('Không lưu được lớp');
    showEditor(false);
    message(data.warnings?.length ? 'Đã lưu. ' + data.warnings.join(' · ') : 'Đã lưu lớp và danh sách học sinh.', 'ok');
    await renderClassBoard();
  } catch (error) {
    message(error.message?.includes('ZM_LIMIT')
      ? 'Mỗi thầy cô có tối đa 20 lớp đang hoạt động. Hãy kết thúc lớp cũ trước khi tạo lớp mới.'
      : error.message?.includes('ZM_INVALID_INPUT')
        ? 'Thông tin lớp, lịch nghỉ hoặc danh sách học sinh chưa hợp lệ.'
        : error.message || 'Không lưu được lớp.', 'error');
  }
  finally { btn.disabled = false; }
}
export async function renderClassBoard() {
  const list = $('t-classes');
  list.replaceChildren();
  const { data, error } = await supabase.from('classes')
    .select('id,name,grade,school_year,week1_monday,status').order('created_at', { ascending: false });
  if (error) { message('Không tải được danh sách lớp.', 'error'); return; }
  const { data: staff } = await supabase.from('class_staff').select('class_id,role,teacher_id');
  const { data: auth } = await supabase.auth.getUser();
  const owned = data.filter(c => staff?.some(s => s.class_id === c.id && s.teacher_id === auth?.user?.id && s.role === 'owner'));
  $('t-empty').hidden = data.length > 0;
  for (const c of data) {
    const li = el('li');
    const title = el('strong', c.name);
    const meta = el('span', `Khối ${c.grade} · ${c.school_year}${c.status === 'ended' ? ' · đã kết thúc' : ''}`, 't-meta');
    const content = el('div');
    content.append(title, meta);
    const actions = el('div', undefined, 't-actions');
    const manage = el('button', 'Quản lý lớp', 'btn');
    manage.type = 'button';
    manage.addEventListener('click', () => openClassManagement(c, owned, renderClassBoard));
    actions.append(manage);
    const gradebook = el('button', 'Bảng lớp', 'btn');
    gradebook.type = 'button';
    gradebook.addEventListener('click', () => openGradebook(c));
    actions.append(gradebook);
    if (c.status === 'open' && staff?.some(s => s.class_id === c.id && s.teacher_id === auth?.user?.id && s.role === 'owner')) {
      const edit = el('button', 'Sửa lớp', 'btn');
      edit.type = 'button'; edit.addEventListener('click', () => editClass(c));
      actions.append(edit);
    }
    if (c.status === 'open') {
      const start = el('button', 'Bắt đầu buổi học', 'btn btn-primary');
      start.type = 'button'; start.addEventListener('click', () => openSession(c));
      actions.append(start);
    }
    li.append(content, actions); list.append(li);
  }
  await renderInvitationInbox(renderClassBoard);
  // Mã chiếu bảng được giữ trong sessionStorage của cùng tab sau khi tải lại.
  if (!activeSession) {
    for (const c of data) {
      const raw = sessionStorage.getItem('happy-session-' + c.id);
      if (!raw) continue;
      try {
        const saved = JSON.parse(raw);
        if (Date.parse(saved.expires_at) > Date.now()) { activateSession(saved); break; }
      } catch { sessionStorage.removeItem('happy-session-' + c.id); }
    }
  }
}
function closeGradebook() {
  gradebookToken++;
  $('t-gradebook').hidden = true;
  $('t-gradebook-table').replaceChildren();
  $('t-gradebook-status').textContent = '';
}
async function openGradebook(c) {
  const token = ++gradebookToken;
  const panel = $('t-gradebook');
  panel.hidden = false;
  $('t-gradebook-title').textContent = 'Bảng lớp · ' + c.name;
  $('t-gradebook-table').replaceChildren();
  $('t-gradebook-status').textContent = 'Đang tải trạng thái lớp và bài học...';
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  try {
    const [stateResult, lessonsResult, enrollmentsResult] = await Promise.all([
      supabase.rpc('class_management_state', { p_class_id: c.id }),
      supabase.from('lessons').select('id,title,week,current_version').eq('grade', c.grade).order('week'),
      supabase.from('enrollments').select('id,student_id').eq('class_id', c.id)
    ]);
    if (stateResult.error || lessonsResult.error || enrollmentsResult.error || !stateResult.data?.ok && stateResult.data?.ok !== undefined)
      throw stateResult.error || lessonsResult.error || enrollmentsResult.error || Error('Không đọc được dữ liệu lớp.');
    if (token !== gradebookToken) return;
    const students = stateResult.data.students || [];
    const lessons = (lessonsResult.data || []).filter(lesson => lesson.current_version !== null);
    const opened = await Promise.all(lessons.map(async lesson => {
      const result = await supabase.rpc('lesson_open', { p_class_id: c.id, p_lesson_id: lesson.id });
      if (result.error) throw result.error;
      return Boolean(result.data);
    }));
    if (token !== gradebookToken) return;
    // Tiến độ và mức chấm được đọc nguyên trạng, không tự suy đoán kết quả học sinh.
    const enrollments = enrollmentsResult.data || [];
    const enrollmentIds = enrollments.map(e => e.id);
    const attempts = [];
    if (enrollmentIds.length) {
      for (let offset = 0; ; offset += 1000) {
        const page = await supabase.from('attempts').select('id,enrollment_id,lesson_id,missions_done')
          .in('enrollment_id', enrollmentIds).range(offset, offset + 999);
        if (page.error) throw page.error;
        attempts.push(...(page.data || []));
        if ((page.data || []).length < 1000) break;
      }
    }
    const levels = new Map();
    for (let offset = 0; offset < attempts.length; offset += 100) {
      const ids = attempts.slice(offset, offset + 100).map(a => a.id);
      const result = await supabase.from('current_evaluations').select('attempt_id,level').in('attempt_id', ids);
      if (result.error) throw result.error;
      for (const evaluation of result.data || []) levels.set(evaluation.attempt_id, evaluation.level);
    }
    if (token !== gradebookToken) return;
    const studentOfEnrollment = new Map(enrollments.map(e => [e.id, e.student_id]));
    const progress = new Map();
    for (const attempt of attempts) progress.set(`${studentOfEnrollment.get(attempt.enrollment_id)}:${attempt.lesson_id}`, attempt);
    const table = $('t-gradebook-table');
    const head = el('thead');
    const headRow = el('tr');
    const first = el('th', 'Học sinh'); first.scope = 'col'; headRow.append(first);
    for (const lesson of lessons) {
      const cell = el('th', `Tuần ${lesson.week} · ${lesson.title}`);
      cell.scope = 'col'; headRow.append(cell);
    }
    head.append(headRow);
    const body = el('tbody');
    for (const student of students) {
      const row = el('tr');
      const name = el('th', `${student.avatar} ${student.nickname}${student.status === 'left' ? ' · Đã rời lớp' : ''}`);
      name.scope = 'row'; row.append(name);
      lessons.forEach((lesson, index) => {
        const attempt = progress.get(`${student.id}:${lesson.id}`);
        const level = attempt && levels.get(attempt.id);
        const status = level ? `Đã chấm · ${level}` : attempt ? 'Đã bắt đầu' :
          student.status === 'left' ? 'Đã rời lớp' : opened[index] ? 'Chưa làm' : 'Chưa mở';
        row.append(el('td', status, level ? 'is-graded' : 'is-unavailable'));
      });
      body.append(row);
    }
    if (!students.length) {
      const row = el('tr');
      const empty = el('td', 'Lớp chưa có học sinh.'); empty.colSpan = lessons.length + 1;
      row.append(empty); body.append(row);
    }
    table.replaceChildren(head, body);
    $('t-gradebook-status').textContent = `${students.length} học sinh · ${lessons.length} bài · dữ liệu từ lớp, bài mở và tiến độ hiện có.`;
  } catch (error) {
    if (token !== gradebookToken) return;
    $('t-gradebook-table').replaceChildren();
    $('t-gradebook-status').textContent = 'Không tải được Bảng lớp: ' + (error.message || 'Thử lại sau.');
  }
}
function setProjection(on) {
  document.querySelector('.teacher').classList.toggle('is-projecting', on);
  const toggle = $('t-project-toggle');
  toggle.setAttribute('aria-pressed', String(on));
  toggle.textContent = on ? 'Thoát màn chiếu' : 'Chiếu toàn màn hình';
}
async function toggleProjection() {
  const panel = $('t-session');
  if (document.querySelector('.teacher').classList.contains('is-projecting')) {
    setProjection(false);
    if (document.fullscreenElement === panel) await document.exitFullscreen().catch(() => {});
  } else {
    setProjection(true);
    if (panel.requestFullscreen) await panel.requestFullscreen().catch(() => {});
  }
}
async function openSession(c) {
  if (activeSession && !confirm('Đang hiển thị một buổi. Mở buổi mới?')) return;
  const { data, error } = await supabase.rpc('open_session', { p_class_id: c.id });
  if (error || !data?.ok) { message(error?.message || 'Không mở được buổi học.', 'error'); return; }
  const session = { ...data, class_id: c.id, class_name: c.name };
  sessionStorage.setItem('happy-session-' + c.id, JSON.stringify(session));
  activateSession(session);
  message(data.closed_previous
    ? 'Đã đóng buổi cũ và mở buổi mới. Chiếu mã mới để các em vào nhé.'
    : 'Đã mở buổi. Chiếu mã để các em vào nhé.', 'ok');
}
function activateSession(session) {
  stopClassSession();
  activeSession = session;
  $('t-session').hidden = false;
  $('t-session-title').textContent = 'Buổi học · ' + session.class_name;
  $('t-join-code').textContent = session.join_code;
  $('t-session-expiry').textContent = 'Mã còn hiệu lực đến ' + new Date(session.expires_at).toLocaleTimeString('vi-VN');
  $('t-session-note').textContent = 'Đang cập nhật mỗi 3 giây';
  refreshSession();
  poller = setInterval(refreshSession, 3000);
  $('t-session').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
export function stopClassSession() {
  setProjection(false);
  if (document.fullscreenElement === $('t-session')) document.exitFullscreen().catch(() => {});
  if (poller) clearInterval(poller);
  poller = null;
  activeSession = null;
  refreshing = false;
  $('t-session').hidden = true;
}
export function resetClassBoard() {
  stopClassSession();
  closeGradebook();
  closeClassManagement();
  $('t-invitations').hidden = true;
  $('t-invitation-list').replaceChildren();
  $('t-classes').replaceChildren();
}
async function refreshSession() {
  if (!activeSession || refreshing) return;
  refreshing = true;
  const session = activeSession;
  try {
    if (Date.parse(session.expires_at) <= Date.now()) {
      sessionStorage.removeItem('happy-session-' + session.class_id);
      stopClassSession(); message('Mã buổi đã hết hạn.', 'error'); return;
    }
    const [pending, attendees, status] = await Promise.all([
      supabase.rpc('list_pending_devices', { p_session_id: session.session_id }),
      supabase.rpc('session_attendees', { p_session_id: session.session_id }),
      supabase.from('class_sessions').select('closed_at').eq('id', session.session_id).maybeSingle()
    ]);
    if (activeSession !== session) return;
    if (pending.error || attendees.error || status.error) throw pending.error || attendees.error || status.error;
    if (!status.data || status.data.closed_at) {
      sessionStorage.removeItem('happy-session-' + session.class_id);
      stopClassSession(); message('Buổi học đã đóng.', 'ok'); return;
    }
    $('t-pending').replaceChildren();
    for (const d of pending.data || []) {
      const row = el('li');
      const label = el('span', `${d.avatar} ${d.nickname} · Máy ${d.device_tag}${d.in_use_elsewhere ? ' · tên này đang ở máy khác' : ''}`);
      const approve = el('button', 'Duyệt', 'btn btn-primary');
      approve.addEventListener('click', () => decide('approve_device', d.device_id));
      const reject = el('button', 'Từ chối', 'btn');
      reject.addEventListener('click', () => decide('reject_device', d.device_id));
      row.append(label, approve, reject); $('t-pending').append(row);
    }
    if (!pending.data?.length) $('t-pending').append(el('li', 'Chưa có máy chờ duyệt'));
    $('t-attendees').replaceChildren();
    for (const d of attendees.data || []) $('t-attendees').append(el('li', `${d.avatar} ${d.nickname} · Máy ${d.device_tag}`));
    if (!attendees.data?.length) $('t-attendees').append(el('li', 'Chưa có em nào vào'));
    $('t-attendee-count').textContent = String(attendees.data?.length || 0);
  } catch (error) { $('t-session-note').textContent = 'Mất kết nối: ' + error.message; }
  finally { refreshing = false; }
}
async function decide(action, deviceId) {
  if (!activeSession) return;
  const { data, error } = await supabase.rpc(action, {
    p_session_id: activeSession.session_id, p_device_id: deviceId
  });
  $('t-session-note').textContent = error?.message ||
    (data?.warnings?.includes('BR-BH-02') ? 'Tên này có yêu cầu ở máy khác.' : 'Đã cập nhật máy.');
  await refreshSession();
}
async function closeSession() {
  if (!activeSession) return;
  const session = activeSession;
  const { error } = await supabase.rpc('close_session', { p_session_id: session.session_id });
  if (error) { $('t-session-note').textContent = error.message; return; }
  sessionStorage.removeItem('happy-session-' + session.class_id);
  stopClassSession();
  message('Đã kết thúc buổi học.', 'ok');
}
export function bindClassBoard() {
  bindLifecycleBoard();
  $('t-new-class').addEventListener('click', newClass);
  $('t-cancel-class').addEventListener('click', () => showEditor(false));
  $('t-add-names').addEventListener('click', addNames);
  $('t-class-form').addEventListener('submit', saveClass);
  $('t-approve-all').addEventListener('click', () => decide('approve_device', null));
  $('t-close-session').addEventListener('click', closeSession);
  $('t-project-toggle').addEventListener('click', toggleProjection);
  $('t-gradebook-close').addEventListener('click', closeGradebook);
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement !== $('t-session') && document.querySelector('.teacher').classList.contains('is-projecting')) setProjection(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.querySelector('.teacher').classList.contains('is-projecting')) setProjection(false);
  });
}
