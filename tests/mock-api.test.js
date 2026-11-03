'use strict';
// Bước 76-2: kiểm thử dữ liệu mẫu thuần Node, không truy cập mạng/Supabase.
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const api = require('../mock/api.js');

beforeEach(() => api.reset());

test('read trả bản sao; write giữ một nguồn dữ liệu giữa 3 vai', () => {
  const teacher = api.read('teacher');
  teacher.students[2].nickname = 'Tên sửa trong bản sao';
  assert.equal(api.read('teacher').students[2].nickname, 'Minh Anh');
  teacher.students[2].nickname = 'Minh Anh mới';
  teacher.groups[0].name = 'Cá Voi mới';
  api.write('teacher', teacher);
  assert.equal(api.read('parentProfiles')[2].shortName, 'Minh Anh mới');
  assert.equal(api.read('exhibition').students[2].nickname, 'Minh Anh mới');
  assert.equal(api.read('exhibition').groups[0].name, 'Cá Voi mới');
  assert.equal(api.read('teacher').groups[2].starsPeer, '2,5');
  assert.equal(api.read('teacher').groups[2].starsGuest, '2,2');
  assert.equal(api.projectTeam('G1').teamName, 'Nhóm Cá Voi mới');
  assert.throws(() => api.write('version', 77), /Không cho phép/);
});

test('reset khôi phục seed và phát thông báo thay đổi', () => {
  const events = [];
  const unsubscribe = api.subscribe(section => events.push(section));
  const parent = api.read('parent');
  parent.selectedStudentId = 5;
  api.write('parent', parent);
  assert.equal(api.read('parent').selectedStudentId, 5);
  const fresh = api.reset();
  unsubscribe();
  assert.deepEqual(events, ['parent', 'reset']);
  assert.equal(fresh.parent.selectedStudentId, 3);
  assert.equal(api.read('teacher').students[2].fullName, 'Nguyễn Minh Anh');
  assert.equal(api.read('exhibition').students[2].nickname, 'Minh Anh');
  assert.equal(api.read('parentProfiles')[2].shortName, 'Minh Anh');
});

test('BRD 6.2/6.3: mức gợi ý 4 nhiệm vụ cơ bản, không tính nâng cao', () => {
  assert.equal(api.suggestedGrade(4, 4), 'HTT');
  assert.equal(api.suggestedGrade(2, 4), 'HT');
  assert.equal(api.suggestedGrade(0, 4), 'CHT');
  assert.equal(api.suggestedGrade(1, 4), 'CHT');
  assert.equal(api.suggestedGrade(0, 0), null);
  assert.equal(api.rpc('suggested_level', { completed: 3, total: 4 }), 'HT');
  assert.throws(() => api.suggestedGrade(5, 4), RangeError);
  const before = api.read('teacher').cells['3_B9'];
  api.rpc('save_attempt', { p_student_id: 3, p_lesson_id: 'B9', coreFlags: [true, true, true, true] });
  const after = api.read('teacher').cells['3_B9'];
  assert.equal(after.suggested, 'HTT');
  assert.deepEqual(after.advFlags, before.advFlags);
  assert.equal(api.rpc('suggested_level', { p_student_id: 3, p_lesson_id: 'B9' }), 'HTT');
});

test('BRD 6.2: tính tuần từ 07/09/2026 và trừ tuần nghỉ', () => {
  assert.equal(api.currentWeek('2026-09-07', '2026-09-06'), 0);
  assert.equal(api.currentWeek('2026-09-07', '2026-11-04'), 9);
  assert.equal(api.currentWeek('2026-09-07', '2026-11-16'), 11);
  assert.equal(api.currentWeek('2026-09-07', '2027-02-22', ['2027-02-08', '2027-02-15']), 23);
  assert.equal(api.rpc('current_week', { p_on: '2026-11-04' }), 9);
});

test('BRD GD-14: chấm, đồng ý/rút đồng ý và ẩn nhận xét', () => {
  api.rpc('grade', { p_student_id: 3, p_lesson_id: 'B9', p_level: 'HTT', p_comment: 'Tiến bộ rõ' });
  assert.equal(api.lessonsForStudent(3).find(l => l.id === 'lop1-bai09').comment, 'Tiến bộ rõ');
  api.rpc('withdraw_consent', { p_student_id: 3 });
  assert.equal(api.read('teacher').students[2].hasConsent, false);
  assert.equal(api.read('teacher').students[2].fullName, '');
  assert.equal(api.lessonsForStudent(3).find(l => l.id === 'lop1-bai09').comment, '');
  api.rpc('grade', { p_student_id: 3, p_lesson_id: 'B9', p_level: 'HT', p_comment: 'Chữ bị ẩn' });
  assert.equal(api.read('teacher').cells['3_B9'].teacherComment, '');
  api.rpc('give_consent', { p_student_id: 3, p_full_name: 'Nguyễn Minh Anh' });
  assert.equal(api.read('teacher').students[2].fullName, 'Nguyễn Minh Anh');
  assert.equal(api.read('parentProfiles')[2].hasConsent, true);
});

test('BRD 6.6: số phiếu, sao, thứ hạng seed và nhóm dưới 3 phiếu', () => {
  const rows = api.leaderboard();
  const values = rows.map(r => [r.group.id, r.voteCount, r.totalStars, r.score, r.rank]);
  assert.deepEqual(values, [
    ['g1', 7, 52, 2.5, 1],
    ['g2', 10, 72, 2.4, 2],
    ['g3', 6, 43, 2.4, 3],
    ['g5', 4, 26, 2.2, 4],
    ['g6', 3, 19, 2.1, 5],
    ['g4', 2, 18, null, null]
  ]);
  assert.equal(rows.some(r => r.group.id === 'g7'), false);
});

test('BRD 6.6: cùng điểm làm tròn thì ưu tiên lượt, cùng lượt thì đồng hạng', () => {
  const exhibit = api.read('exhibition');
  [[3, 2, 2], [3, 2, 2], [3, 2, 2], [3, 2, 3]].forEach((stars, index) => {
    exhibit.votes.push({
      id: `added-${index}`, groupId: 'g3', source: 'BAN', raterId: `extra-${index}`,
      stars, presets: [], text: '', textStatus: 'KHONG_CO'
    });
  });
  const rows = api.leaderboard(exhibit);
  const g2 = rows.find(row => row.group.id === 'g2');
  const g3 = rows.find(row => row.group.id === 'g3');
  assert.equal(g2.score, 2.4);
  assert.equal(g3.score, 2.4);
  assert.equal(g3.voteCount, 10);
  assert.equal(g3.totalStars, 72);
  assert.equal(g3.rank, g2.rank);
});

test('BRD 6.4: ba nguồn độc lập, làm tròn theo sao gốc và chỉ hiện nhận xét duyệt', () => {
  const team = api.projectTeam('G3');
  assert.deepEqual(team.memberIds, [9, 10, 11, 12]);
  assert.deepEqual(team.ratingsBySource.map(s => [s.count, s.avgTotal]), [
    [4, '2,5'], [2, '2,2'], [0, 'Chưa có']
  ]);
  assert.deepEqual(team.ratingsBySource[0].criteria.map(c => c.score), ['2,8', '2,3', '2,5']);
  assert.deepEqual(team.ratingsBySource[1].criteria.map(c => c.score), ['2,5', '1,5', '2,5']);
  assert.equal(team.approvedQuotes.some(q => q.text.includes('Nếu thêm phễu')), false);
  assert.equal(team.approvedQuotes.some(q => q.text.includes('Thử bấm nhầm')), false);
  assert.equal(team.approvedQuotes.some(q => q.text.includes('Mô hình guồng nước quay đều')), true);
  const exhibit = api.read('exhibition');
  exhibit.votes.find(v => v.id === 'v-g3-b2').stars = [3, 3, 3];
  api.write('exhibition', exhibit);
  const updated = api.projectTeam('G3');
  assert.equal(updated.ratingsBySource[0].avgTotal, '2,6');
  assert.equal(updated.ratingsBySource[0].criteria[2].score, '2,8');
  assert.equal(api.read('teacher').groups[2].starsPeer, '2,6');
  assert.equal(api.projectTeam('G1').ratingsBySource[2].count, 1);
  assert.equal(api.projectTeam('G3').ratingsBySource[2].count, 0);
});

test('Thu hồi phiếu khách làm giảm điểm và xóa nhận xét trong phần phụ huynh', () => {
  const exhibit = api.read('exhibition');
  exhibit.tickets.find(ticket => ticket.code === 'K7M4P9X2').status = 'DA_THU_HOI';
  api.write('exhibition', exhibit);
  const team = api.projectTeam('G3');
  assert.equal(team.ratingsBySource[1].count, 1);
  assert.equal(team.approvedQuotes.some(q => q.text.includes('Mô hình guồng nước quay đều')), false);
  assert.equal(api.leaderboard().find(r => r.group.id === 'g3').voteCount, 5);
});

test('Sửa nhóm và chấm nhóm đồng bộ sang phần phụ huynh', () => {
  api.rpc('grade_group', { p_group_id: 'G1', p_level: 'HT', p_comment: 'Nhóm phối hợp tốt' });
  assert.equal(api.projectTeam('G1').teacherGrade, 'HT');
  assert.equal(api.projectTeam('G1').teacherComment, 'Nhóm phối hợp tốt');
  api.rpc('close_session');
  assert.equal(api.read('exhibition').session.state, 'DA_DONG');
  api.rpc('open_session');
  assert.equal(api.read('exhibition').session.state, 'DANG_MO');
});
