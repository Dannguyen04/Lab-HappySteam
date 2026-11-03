/* Mock API phiếu 76: giao diện đồng bộ Supabase ở mức dữ liệu mẫu, không gọi mạng. */
(function (root, factory) {
  const data = typeof module === 'object' && module.exports ? require('./data.js') : root.MockData;
  const api = factory(root, data);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MockAPI = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root, data) {
  'use strict';
  if (!data) throw new Error('Cần nạp mock/data.js trước mock/api.js');
  const KEY = 'mock.76.state';
  const clone = data.clone;
  let fallback = null;
  const listeners = new Set();
  function storage() {
    try { return root.localStorage || null; } catch (_) { return null; }
  }
  function getRaw() {
    const store = storage();
    if (store) {
      try { return store.getItem(KEY); } catch (_) { /* bộ nhớ có thể bị khóa */ }
    }
    return fallback;
  }
  function putRaw(raw) {
    fallback = raw;
    const store = storage();
    if (store) {
      try { store.setItem(KEY, raw); } catch (_) { /* vẫn dùng bản ghi tạm */ }
    }
  }
  function initialize() {
    let value;
    try { value = JSON.parse(getRaw()); } catch (_) { /* dữ liệu hỏng: tạo mới */ }
    if (!value || value.version !== 76 || !value.teacher || !value.parentProfiles || !value.exhibition) {
      value = data.createSeed();
      synchronize(value, 'teacher');
      putRaw(JSON.stringify(value));
    }
    return value;
  }
  function emit(section) {
    listeners.forEach(fn => fn(section));
    if (typeof root.dispatchEvent === 'function' && typeof root.CustomEvent === 'function') {
      root.dispatchEvent(new root.CustomEvent('mock76:change', { detail: { section } }));
    }
  }
  function sourceScore(exhibition, groupId, source) {
    const revoked = new Set(exhibition.tickets.filter(t => t.status === 'DA_THU_HOI').map(t => t.code));
    const votes = exhibition.votes.filter(v => v.groupId === groupId && v.source === source &&
      !(source === 'KHACH' && revoked.has(v.raterId)));
    const criteria = exhibition.session.criteria.length;
    if (!votes.length || !criteria) return 'Chưa có';
    const stars = votes.reduce((sum, vote) =>
      sum + vote.stars.reduce((subtotal, star) => subtotal + Number(star || 0), 0), 0);
    return (Math.floor(stars / (votes.length * criteria) * 10 + 0.5) / 10).toFixed(1).replace('.', ',');
  }
  function synchronize(state, changed) {
    const teacher = state.teacher;
    if (changed === 'parentProfiles') {
      state.parentProfiles.forEach(profile => {
        const student = teacher.students.find(st => st.id === profile.id);
        if (!student) return;
        student.hasConsent = Boolean(profile.hasConsent);
        student.fullName = profile.hasConsent ? (profile.fullName || '') : '';
        if (student.hasConsent === false) {
          Object.values(teacher.cells).filter(c => c.studentId === student.id).forEach(c => { c.teacherComment = ''; });
        }
      });
    }
    if (changed === 'exhibition') {
      state.exhibition.groups.forEach(group => {
        const shared = teacher.groups.find(g => g.id.toLowerCase() === group.id);
        if (!shared) return;
        shared.name = group.name;
        shared.topic = group.projectTitle;
        shared.status = group.status === 'DA_NOP' ? 'submitted' : 'working';
        shared.teacherGrade = group.teacherGrade;
      });
    } else {
      teacher.groups.forEach(group => {
        const exhibit = state.exhibition.groups.find(g => g.id === group.id.toLowerCase());
        if (!exhibit) return;
        exhibit.name = group.name;
        exhibit.projectTitle = group.topic;
        exhibit.status = group.status === 'submitted' ? 'DA_NOP' : 'DANG_LAM';
      });
    }
    teacher.groups.forEach(group => {
      const id = group.id.toLowerCase();
      group.starsPeer = sourceScore(state.exhibition, id, 'BAN');
      group.starsGuest = sourceScore(state.exhibition, id, 'KHACH');
      group.starsTeacher = sourceScore(state.exhibition, id, 'GIAO_VIEN');
    });
    const profiles = state.parentProfiles;
    teacher.students.forEach(student => {
      let profile = profiles.find(p => p.id === student.id);
      if (!profile) { profile = { id: student.id, code: '' }; profiles.push(profile); }
      profile.shortName = student.nickname;
      profile.animal = student.animal;
      profile.groupRole = student.role;
      profile.inProjectTeam = Boolean(student.groupId);
      profile.hasConsent = Boolean(student.hasConsent);
      profile.fullName = student.hasConsent ? student.fullName : '';
    });
    // Danh tính hs01…hs28 giữ ổn định để các lượt chấm đã lưu không mất hiệu lực.
    state.exhibition.students = teacher.students.map(st => ({
      id: 'hs' + String(st.id).padStart(2, '0'), studentId: st.id,
      nickname: st.nickname, animal: st.animal,
      groupId: st.groupId ? st.groupId.toLowerCase() : '', consent: Boolean(st.hasConsent)
    }));
  }
  function read(section) {
    const current = initialize();
    if (section == null) return clone(current);
    if (!(section in current)) throw new Error('Không có bộ dữ liệu mock: ' + section);
    return clone(current[section]);
  }
  function write(section, value) {
    if (!['teacher', 'parent', 'parentProfiles', 'exhibition'].includes(section)) {
      throw new Error('Không cho phép ghi bộ dữ liệu: ' + section);
    }
    const current = initialize();
    current[section] = clone(value);
    synchronize(current, section);
    putRaw(JSON.stringify(current));
    emit(section);
    return read(section);
  }
  function reset() {
    const old = storage();
    if (old) {
      try {
        // Dọn khóa cũ của chính mock để không tạo hai nguồn sự thật.
        ['mock.73a.state', 'mock.grades.1A2', 'mock.groups.1A2',
          'mock.ph.students.v1', 'mock.ph.state.v1', 'mock.trungBay.v1',
          'mock.trungBay.currentTicket'].forEach(key => old.removeItem(key));
      } catch (_) { /* không ảnh hưởng dữ liệu đang chạy */ }
    }
    const fresh = data.createSeed();
    synchronize(fresh, 'teacher');
    putRaw(JSON.stringify(fresh));
    emit('reset');
    return clone(fresh);
  }
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  function parseDay(date) {
    const raw = typeof date === 'string' ? date.slice(0, 10) : date;
    const day = typeof raw === 'string' ? new Date(raw + 'T00:00:00Z') : new Date(raw);
    if (Number.isNaN(day.getTime())) throw new TypeError('Ngày không hợp lệ');
    return Math.floor(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()) / 86400000);
  }
  function monday(day) {
    const date = new Date(day * 86400000);
    return day - ((date.getUTCDay() + 6) % 7);
  }
  function currentWeek(start = '2026-09-07', today = '2026-11-04', holidayMondays = []) {
    const begin = monday(parseDay(start));
    const end = monday(parseDay(today));
    if (end < begin) return 0;
    const calendar = Math.floor((end - begin) / 7) + 1;
    const holidays = new Set(holidayMondays.map(date => monday(parseDay(date))));
    let excluded = 0;
    holidays.forEach(day => { if (day >= begin && day <= end) excluded++; });
    return Math.max(0, calendar - excluded);
  }
  function leaderboard(exhibition = read('exhibition')) {
    const criteria = exhibition.session.criteria.length;
    const revoked = new Set(exhibition.tickets.filter(t => t.status === 'DA_THU_HOI').map(t => t.code));
    const rows = exhibition.groups.filter(g => g.status === 'DA_NOP').map(group => {
      const votes = exhibition.votes.filter(v => v.groupId === group.id &&
        (v.source === 'BAN' || v.source === 'KHACH') &&
        !(v.source === 'KHACH' && revoked.has(v.raterId)));
      const totalStars = votes.reduce((sum, v) => sum + v.stars.reduce((a, b) => a + Number(b || 0), 0), 0);
      const voteCount = votes.length;
      const unranked = voteCount < 3 || criteria === 0;
      return {
        group, voteCount, totalStars, unranked,
        peerCount: votes.filter(v => v.source === 'BAN').length,
        guestCount: votes.filter(v => v.source === 'KHACH').length,
        score: unranked ? null : Math.floor((totalStars / (voteCount * criteria)) * 10 + 0.5) / 10,
        rank: null
      };
    });
    rows.sort((a, b) => Number(a.unranked) - Number(b.unranked) ||
      (b.score ?? -1) - (a.score ?? -1) || b.voteCount - a.voteCount ||
      a.group.name.localeCompare(b.group.name, 'vi'));
    rows.forEach((row, index) => {
      if (row.unranked) return;
      const prev = rows[index - 1];
      row.rank = prev && !prev.unranked && row.score === prev.score && row.voteCount === prev.voteCount
        ? prev.rank : index + 1;
    });
    return rows;
  }
  function lessonsForStudent(id) {
    const person = read('parentProfiles').find(st => st.id === Number(id));
    const teacher = read('teacher');
    const base = clone(data.parentLessons[id] || data.parentLessons[1]);
    return base.map(lesson => {
      const sharedLesson = data.lessons.find(item => item.code === lesson.id);
      const cell = sharedLesson && teacher.cells[`${id}_${sharedLesson.id}`];
      if (!cell) return lesson;
      lesson.missions.forEach((m, index) => {
        m.done = m.type === 'basic' ? Boolean(cell.coreFlags[index]) : Boolean(cell.advFlags[0]);
      });
      lesson.suggestedGrade = data.computeSuggestedGrade(cell.coreFlags.filter(Boolean).length, cell.coreFlags.length);
      lesson.teacherGrade = cell.isGraded ? cell.teacherGrade : 'NONE';
      lesson.comment = person && person.hasConsent ? cell.teacherComment : '';
      return lesson;
    });
  }
  function projectTeam(groupId = 'G3') {
    const teacher = read('teacher');
    const exhibit = read('exhibition');
    const group = teacher.groups.find(g => g.id === groupId);
    if (!group) throw new Error('Không có nhóm dự án: ' + groupId);
    const display = exhibit.groups.find(g => g.id === group.id.toLowerCase());
    const revoked = new Set(exhibit.tickets.filter(t => t.status === 'DA_THU_HOI').map(t => t.code));
    const votes = exhibit.votes.filter(v => v.groupId === group.id.toLowerCase() &&
      !(v.source === 'KHACH' && revoked.has(v.raterId)));
    const sources = [
      { key: 'BAN', source: 'Các bạn trong lớp', note: 'Lượt chấm ẩn danh từ bạn cùng lớp' },
      { key: 'KHACH', source: 'Khách đến lớp (quét QR)', note: 'Phiếu hợp lệ, đã loại phiếu thu hồi' },
      { key: 'GIAO_VIEN', source: 'Giáo viên chấm sao', note: 'Tách riêng với đánh giá chính thức theo mức HTT / HT / CHT' }
    ];
    const formatScore = value => (Math.floor(value * 10 + 0.5) / 10).toFixed(1).replace('.', ',');
    const ratingsBySource = sources.map(source => {
      const selection = votes.filter(v => v.source === source.key);
      const count = selection.length;
      const criteria = count ? exhibit.session.criteria.map((name, index) => ({
        name, score: formatScore(selection.reduce((sum, v) => sum + Number(v.stars[index] || 0), 0) / count)
      })) : [];
      const totalStars = selection.reduce((sum, v) =>
        sum + v.stars.reduce((total, star) => total + Number(star || 0), 0), 0);
      const avgTotal = count && exhibit.session.criteria.length
        ? formatScore(totalStars / (count * exhibit.session.criteria.length)) : 'Chưa có';
      return { source: source.source, count, note: `${count} lượt · ${source.note}`, avgTotal, criteria };
    });
    const presetText = new Map(data.presetComments.map(p => [p.id, p.text]));
    const approvedQuotes = [];
    votes.forEach(vote => {
      const author = vote.source === 'BAN' ? 'Một bạn trong lớp'
        : vote.source === 'KHACH' ? 'Một vị khách' : 'Giáo viên';
      (vote.presets || []).forEach(code => {
        const text = presetText.get(code);
        if (text) approvedQuotes.push({ author, type: 'Câu mẫu', text });
      });
      if (vote.textStatus === 'DA_DUYET' && vote.text) {
        approvedQuotes.push({ author, type: 'Nhận xét đã duyệt', text: vote.text });
      }
    });
    return {
      memberIds: teacher.students.filter(s => s.groupId === group.id).map(s => s.id),
      teamName: 'Nhóm ' + group.name, topic: group.topic,
      cover: display ? display.cover : '',
      stage: display && display.status === 'DA_NOP'
        ? 'Giai đoạn 4/4 · Đã nộp poster & trưng bày' : 'Dự án đang thực hiện',
      teacherGrade: display ? display.teacherGrade : '',
      teacherComment: display ? display.teacherComment : '',
      ratingsBySource, approvedQuotes
    };
  }
  // Tên trùng RPC public trong migration. Các trường hợp khác trả lỗi rõ ràng.
  function rpc(name, args = {}) {
    const studentId = Number(args.p_student_id ?? args.studentId);
    const lessonId = args.p_lesson_id || args.lessonId || 'B9';
    if (name === 'my_class_invitations') return read('parentProfiles');
    if (name === 'current_week') return currentWeek(args.start || '2026-09-07', args.p_on || args.today || '2026-11-04', args.holidays || []);
    if (name === 'suggested_level') {
      if (args.completed !== undefined) return data.computeSuggestedGrade(args.completed, args.total);
      const cell = read('teacher').cells[`${studentId}_${lessonId}`];
      if (!cell) throw new Error('Không thấy lượt làm bài mẫu');
      return data.computeSuggestedGrade(cell.coreFlags.filter(Boolean).length, cell.coreFlags.length);
    }
    if (name === 'redeem_invite') {
      const found = read('parentProfiles').find(st => st.code === String(args.p_code || '').toUpperCase());
      if (!found || found.status === 'revoked') throw new Error('Mã mời sai hoặc hết hạn');
      return found;
    }
    if (name === 'give_consent' || name === 'withdraw_consent') {
      const profiles = read('parentProfiles');
      const profile = profiles.find(st => st.id === studentId);
      if (!profile) throw new Error('Không có học sinh');
      profile.hasConsent = name === 'give_consent';
      profile.fullName = profile.hasConsent ? (args.p_full_name || profile.fullName || '') : '';
      profile.dob = profile.hasConsent ? (args.p_birth_date || profile.dob || '') : '';
      profile.consentAt = profile.hasConsent ? 'Đã đồng ý (mock)' : '';
      write('parentProfiles', profiles);
      return profile;
    }
    if (name === 'grade' || name === 'save_attempt') {
      const teacher = read('teacher');
      const cell = teacher.cells[`${studentId}_${lessonId}`];
      if (!cell) throw new Error('Không có lượt làm bài mẫu');
      if (name === 'grade') {
        if (!['HTT', 'HT', 'CHT'].includes(args.p_level)) throw new Error('Mức đánh giá không hợp lệ');
        cell.teacherGrade = args.p_level;
        cell.teacherComment = teacher.students.find(s => s.id === studentId).hasConsent ? (args.p_comment || '') : '';
        cell.isGraded = true;
      } else {
        const flags = args.coreFlags || cell.coreFlags;
        if (!Array.isArray(flags) || flags.length !== cell.coreFlags.length) throw new Error('Nhiệm vụ cơ bản không hợp lệ');
        cell.coreFlags = flags.map(Boolean);
        cell.suggested = data.computeSuggestedGrade(cell.coreFlags.filter(Boolean).length, cell.coreFlags.length);
      }
      write('teacher', teacher);
      return cell;
    }
    if (name === 'grade_group') {
      const teacher = read('teacher');
      const group = teacher.groups.find(g => g.id === (args.p_group_id || '').toUpperCase());
      if (!group) throw new Error('Không có nhóm');
      group.teacherGrade = args.p_level;
      write('teacher', teacher);
      const exhibition = read('exhibition');
      const displayed = exhibition.groups.find(g => g.id === group.id.toLowerCase());
      displayed.teacherGrade = args.p_level;
      displayed.teacherComment = args.p_comment || '';
      write('exhibition', exhibition);
      return displayed;
    }
    if (name === 'open_session') {
      const exhibition = read('exhibition');
      exhibition.session.state = 'DANG_MO';
      write('exhibition', exhibition);
      return exhibition.session;
    }
    if (name === 'close_session') {
      const exhibition = read('exhibition');
      exhibition.session.state = 'DA_DONG';
      write('exhibition', exhibition);
      return exhibition.session;
    }
    throw new Error('RPC ' + name + ' chưa có trong bản mẫu');
  }
  if (typeof root.addEventListener === 'function') {
    root.addEventListener('storage', e => { if (e.key === KEY) emit('external'); });
  }
  return { KEY, read, write, reset, subscribe, rpc, currentWeek, leaderboard,
    lessonsForStudent, projectTeam, suggestedGrade: data.computeSuggestedGrade };
});
