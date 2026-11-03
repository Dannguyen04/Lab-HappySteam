// Phiếu 53: thao tác vòng đời lớp qua RPC; mọi dữ liệu người dùng đều gắn bằng textContent.
import { supabase } from './supabase-client.js';

const $ = id => document.getElementById(id);
const node = (tag, text, klass) => {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  if (klass) n.className = klass;
  return n;
};
let current = null;
let refreshingBoard = null;

export function closeClassManagement() {
  current = null;
  refreshingBoard = null;
  $('t-management').hidden = true;
  $('t-slips').hidden = true;
  for (const id of ['t-slips-grid','t-student-list','t-staff-list','t-pending-invites']) {
    $(id).replaceChildren();
  }
}

function info(text, error = false) {
  const p = $('t-management-message');
  p.textContent = text;
  p.className = 't-msg' + (error ? ' is-error' : ' is-ok');
}
async function rpc(name, params = {}) {
  const { data, error } = await supabase.rpc(name, params);
  if (error || (data && data.ok === false)) throw error || Error('Thao tác chưa thành công');
  return data;
}
async function perform(action, success) {
  try {
    const result = await action();
    info(typeof success === 'function' ? success(result) : success);
    if (refreshingBoard) await refreshingBoard();
    if (current) await loadManagement(false);
  } catch (e) { info(e.message || 'Chưa lưu được thay đổi.', true); }
}
function button(label, onClick, style = 'btn') {
  const b = node('button', label, style);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}
function listRow(list, label, controls = []) {
  const li = node('li');
  li.append(node('span', label));
  if (controls.length) {
    const group = node('div', undefined, 't-manage-list-actions');
    group.append(...controls); li.append(group);
  }
  list.append(li);
}

export async function renderInvitationInbox(refreshBoard) {
  const panel = $('t-invitations');
  const list = $('t-invitation-list');
  try {
    const invitations = await rpc('my_class_invitations');
    list.replaceChildren();
    panel.hidden = !invitations?.length;
    for (const invitation of invitations || []) {
      listRow(list, invitation.class_name, [
        button('Nhận lời mời', async () => {
          try {
            await rpc('respond_class_invitation', { p_invitation_id: invitation.id, p_accept: true });
            await renderInvitationInbox(refreshBoard); await refreshBoard();
          } catch (e) { list.prepend(node('li', e.message)); }
        }, 'btn btn-primary'),
        button('Từ chối', async () => {
          try {
            await rpc('respond_class_invitation', { p_invitation_id: invitation.id, p_accept: false });
            await renderInvitationInbox(refreshBoard);
          } catch (e) { list.prepend(node('li', e.message)); }
        })
      ]);
    }
  } catch (e) {
    panel.hidden = false;
    list.replaceChildren(node('li', 'Không tải được lời mời: ' + e.message));
  }
}

export async function openClassManagement(c, ownedClasses, refreshBoard) {
  current = { c, ownedClasses };
  refreshingBoard = refreshBoard;
  $('t-management').hidden = false;
  $('t-management-title').textContent = `Quản lý · ${c.name}`;
  info('');
  await loadManagement();
  $('t-management').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadManagement(resetMessage = true) {
  const context = current;
  if (!context) return;
  if (resetMessage) info('');
  try {
    const state = await rpc('class_management_state', { p_class_id: context.c.id });
    if (current !== context) return;
    const owner = state.owner;
    $('t-owner-tools').hidden = !owner;
    $('t-roster-management').hidden = !owner;
    $('t-leave-class').hidden = owner;
    $('t-change-status').textContent = context.c.status === 'open' ? 'Kết thúc lớp' : 'Mở lại lớp';
    $('t-unlock-form').hidden = context.c.status !== 'open';

    if (owner) {
      const staff = $('t-staff-list'); staff.replaceChildren();
      for (const person of state.staff || []) {
        const controls = person.role === 'assistant' ? [
          button('Chuyển vai chủ lớp', () => {
            if (confirm(`Chuyển quyền chủ lớp cho ${person.name}?`))
              perform(() => rpc('manage_class_staff', { p_class_id: context.c.id, p_teacher_id: person.teacher_id, p_action: 'transfer' }), 'Đã chuyển vai chủ lớp.');
          }),
          button('Gỡ giáo viên', () => {
            if (confirm(`Gỡ ${person.name} khỏi lớp?`))
              perform(() => rpc('manage_class_staff', { p_class_id: context.c.id, p_teacher_id: person.teacher_id, p_action: 'remove' }), 'Đã gỡ giáo viên.');
          })
        ] : [];
        listRow(staff, `${person.name} · ${person.role === 'owner' ? 'Chủ lớp' : 'Giáo viên phụ'}`, controls);
      }
      const pending = $('t-pending-invites'); pending.replaceChildren();
      for (const invitation of state.invitations || []) {
        listRow(pending, invitation.email, [button('Thu hồi', () =>
          perform(() => rpc('revoke_class_invitation', { p_invitation_id: invitation.id }), 'Đã thu hồi lời mời.'))]);
      }
      if (!state.invitations?.length) listRow(pending, 'Không có lời mời chờ phản hồi.');
      const students = $('t-student-list'); students.replaceChildren();
      for (const student of state.students || []) {
        const controls = [];
        if (student.status === 'left' && context.c.status === 'open') {
          controls.push(button('Thêm lại lớp', () => perform(() => rpc('reenroll_class_student', {
            p_class_id: context.c.id, p_student_id: student.id
          }), 'Đã thêm lại học sinh.')));
        }
        if (student.status === 'active' && context.c.status === 'open') {
          const choices = context.ownedClasses.filter(item => item.id !== context.c.id && item.grade === context.c.grade && item.status === 'open');
          for (const target of choices) controls.push(button(`Chuyển sang ${target.name}`, () => {
            if (confirm(`Chuyển ${student.nickname} sang ${target.name}? Tiến độ bài sẽ được sao chép, đánh giá cũ được giữ ở lớp trước.`))
              perform(() => rpc('transfer_class_student', { p_student_id: student.id, p_target_class: target.id }), 'Đã chuyển lớp và sao chép tiến độ.');
          }));
        }
        listRow(students, `${student.avatar} ${student.nickname} · ${student.status === 'left' ? 'Đã rời lớp' : 'Đang học'}`, controls);
      }
      if (!state.students?.length) listRow(students, 'Lớp chưa có học sinh.');
    }
    const lessonSelect = $('t-unlock-lesson'); lessonSelect.replaceChildren();
    const { data: lessons, error } = await supabase.from('lessons').select('id,title,grade,week,current_version')
      .eq('grade', context.c.grade).order('week');
    if (error) throw error;
    for (const lesson of lessons || []) {
      if (lesson.current_version === null) continue;
      const option = node('option', `Tuần ${lesson.week}: ${lesson.title}`);
      option.value = lesson.id; lessonSelect.append(option);
    }
    $('t-unlock-form').querySelector('button').disabled = !lessonSelect.options.length;
    $('t-change-status').dataset.ungraded = String(state.ungraded_core || 0);
  } catch (e) { info('Không tải được quản lý lớp: ' + e.message, true); }
}

function openSlips(c, slips) {
  $('t-slips-title').textContent = `Phiếu mời phụ huynh · ${c.name}`;
  const root = $('t-slips-grid'); root.replaceChildren();
  for (const slip of slips) {
    const card = node('article', undefined, 't-slip');
    card.append(node('h3', 'Happy STEAM · Mời phụ huynh'),
      node('div', `${slip.avatar} ${slip.nickname}`),
      node('div', slip.code, 't-slip-code'),
      node('p', 'Mở trang phụ huynh của Happy STEAM và nhập mã trên để kết nối với con. Giữ mã này riêng tư.'));
    root.append(card);
  }
  $('t-slips').hidden = false;
  $('t-slips').scrollIntoView({ behavior: 'smooth' });
}

export function bindLifecycleBoard() {
  $('t-management-close').addEventListener('click', closeClassManagement);
  $('t-invite-assistant').addEventListener('submit', event => {
    event.preventDefault();
    if (!current) return;
    const email = $('t-assistant-email').value.trim();
    perform(() => rpc('invite_class_assistant', { p_class_id: current.c.id, p_email: email }), 'Đã gửi lời mời trong hệ thống. Giáo viên đăng nhập bằng email này để nhận lời mời.');
  });
  $('t-change-status').addEventListener('click', async () => {
    if (!current) return;
    const { c } = current;
    const ending = c.status === 'open';
    const count = Number($('t-change-status').dataset.ungraded || 0);
    const warning = ending && count ? `Còn ${count} bài xong cơ bản chưa chấm (BR-LP-03). ` : '';
    if (!confirm(`${warning}${ending ? 'Kết thúc lớp và đóng các buổi đang mở?' : 'Mở lại lớp?'} `)) return;
    await perform(async () => {
      const result = await rpc('set_teacher_class_status', { p_class_id: c.id, p_status: ending ? 'ended' : 'open' });
      c.status = result.status;
      return result;
    }, result => ending
      ? `Đã kết thúc lớp và đóng buổi học. ${result.ungraded_core ? `Còn ${result.ungraded_core} bài xong cơ bản chưa chấm.` : ''}`
      : 'Đã mở lại lớp.');
  });
  $('t-leave-class').addEventListener('click', () => {
    if (!current || !confirm('Rời lớp này?')) return;
    perform(async () => {
      const { data: auth } = await supabase.auth.getUser();
      await rpc('manage_class_staff', { p_class_id: current.c.id, p_teacher_id: auth.user.id, p_action: 'leave' });
      current = null; $('t-management').hidden = true;
    }, 'Đã rời lớp.');
  });
  $('t-unlock-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!current) return;
    perform(() => rpc('unlock_class_lesson', { p_class_id: current.c.id, p_lesson_id: $('t-unlock-lesson').value }), 'Đã mở sớm bài cho lớp.');
  });
  $('t-print-slips').addEventListener('click', async () => {
    if (!current) return;
    try { openSlips(current.c, await rpc('class_invite_slips', { p_class_id: current.c.id })); }
    catch (e) { info('Không tải được phiếu mời: ' + e.message, true); }
  });
  $('t-slips-print').addEventListener('click', () => window.print());
  $('t-slips-close').addEventListener('click', () => { $('t-slips').hidden = true; });
}
