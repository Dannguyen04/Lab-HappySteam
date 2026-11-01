// Chế độ khách giữ danh mục tự do; chỉ nạp Supabase khi có phiên học sinh.
(function () {
  'use strict';
  let supabase = null;
  let supabaseReady = false;

  const $ = id => document.getElementById(id);
  const { lessons, types, grades } = window.ZM_CATALOG;
  const store = {
    get: k => {
      try {
        return localStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    }
  };

  const q = new URLSearchParams(location.search);
  const pick = (v, ok, dflt) => (ok.includes(+v) ? +v : dflt);
  let grade = pick(q.get('lop') || store.get('zm_home_grade'), grades, 1);
  let term = pick(q.get('hk') || store.get('zm_home_term'), [1, 2], 1);
  let studentSession = null;
  let courseState = null;
  try { studentSession = JSON.parse(sessionStorage.getItem('happy-student-session') || 'null'); }
  catch { studentSession = { invalid: true }; }
  const hasStudent = Boolean(studentSession);
  const cacheKey = hasStudent && studentSession.student_id && studentSession.session_id
    ? `happy-home-cache:${studentSession.student_id}:${studentSession.session_id}` : null;
  if (hasStudent && cacheKey && Date.parse(studentSession.expires_at) > Date.now()) {
    try {
      const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
      if (cached && cached.ok && grades.includes(cached.grade)) courseState = cached;
    } catch { /* Cache hỏng: giữ chế độ máy và không mở bài. */ }
  }
  if (hasStudent) {
    $('home-student').hidden = false;
    $('home-student-avatar').textContent = studentSession.avatar || '🐾';
    $('home-student-name').textContent = studentSession.nickname || 'Học sinh';
    if (courseState) grade = courseState.grade;
  }

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function renderGrades() {
    if (hasStudent && !courseState) {
      $('grade-tabs').innerHTML = '';
      return;
    }
    $('grade-tabs').innerHTML = (hasStudent ? [courseState.grade] : grades)
      .map(g => {
        if (hasStudent) return `<button type="button" role="tab" data-grade="${g}" aria-selected="true" tabindex="0"><b>Lớp ${g}</b><small>${esc(courseState.class_name)}</small></button>`;
        const ready = lessons.filter(l => l.grade === g && l.href).length;
        return `<button type="button" role="tab" data-grade="${g}" aria-selected="${g === grade}" tabindex="${g === grade ? 0 : -1}">
          <b>Lớp ${g}</b><small>${ready ? ready + ' bài sẵn sàng' : 'Sắp có'}</small></button>`;
      })
      .join('');
  }

  function card(l) {
    const t = types[l.type];
    const head = l.no ? `Bài ${l.no}` : t.label;
    const cover = l.cover
      ? `<img src="${esc(l.cover)}" alt="">`
      : `<span class="lc-num" aria-hidden="true">${l.no ?? '✓'}</span>`;
    const id = `lop${l.grade}-bai${String(l.no).padStart(2, '0')}`;
    const state = !l.href ? 'soon' : !hasStudent || courseState?.lessons?.[id] === true ? 'ready' : 'locked';
    const action = state === 'ready' ? 'Vào học →' : state === 'locked' ? '🔒 Chưa tới tuần học' : 'Sắp có';
    const body = `
      <div class="lc-cover" data-type="${l.type}">${cover}</div>
      <div class="lc-body">
        <span class="lc-eyebrow">${head}</span>
        <b class="lc-title">${esc(l.title)}</b>
        ${l.about ? `<p class="lc-about">${esc(l.about)}</p>` : ''}
        <span class="lc-foot">
          <span class="lc-type" data-type="${l.type}" title="${esc(t.hint)}">${t.label}</span>
          <span class="lc-go">${action}</span>
        </span>
      </div>`;
    return state === 'ready'
      ? `<a class="lesson-card is-ready" href="${esc(l.href)}">${body}</a>`
      : `<div class="lesson-card is-${state}" aria-disabled="true">${body}</div>`;
  }

  function render() {
    renderGrades();
    document.querySelectorAll('#term-tabs [data-term]').forEach(b => {
      const on = +b.dataset.term === term;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    if (hasStudent && !courseState) {
      $('home-count').textContent = 'Đang tải các bài học của lớp…';
      $('lesson-grid').innerHTML = '';
      return;
    }
    if (hasStudent) grade = courseState.grade;
    const list = lessons.filter(l => l.grade === grade && l.term === term);
    const ready = list.filter(l => l.href && (!hasStudent || courseState.lessons[`lop${l.grade}-bai${String(l.no).padStart(2, '0')}`] === true)).length;
    $('home-count').textContent = list.length
      ? `Lớp ${grade}${hasStudent ? ` · ${courseState.class_name} · Tuần ${courseState.current_week}` : ''} · Học kì ${term === 1 ? 'I' : 'II'}: ${list.length} bài · ${ready} bài đã sẵn sàng`
      : `Lớp ${grade} · Học kì ${term === 1 ? 'I' : 'II'}: chưa có bài nào trong danh mục.`;
    $('lesson-grid').innerHTML = list.map(card).join('');
    if (!hasStudent) store.set('zm_home_grade', grade);
    store.set('zm_home_term', term);
  }

  // Bấm và dùng mũi tên trái/phải để chuyển (mẫu tablist)
  function tabs(container, attr, set) {
    container.addEventListener('click', e => {
      const b = e.target.closest(`[data-${attr}]`);
      if (!b) return;
      if (hasStudent && attr === 'grade') return;
      set(+b.dataset[attr]);
      render();
    });
    container.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const all = [...container.querySelectorAll(`[data-${attr}]`)];
      if (!all.length || (hasStudent && attr === 'grade')) return;
      const i = all.findIndex(b => b.getAttribute('aria-selected') === 'true');
      const next = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
      set(+next.dataset[attr]);
      render();
      container.querySelector(`[data-${attr}="${next.dataset[attr]}"]`).focus();
    });
  }
  tabs($('grade-tabs'), 'grade', g => (grade = g));
  tabs($('term-tabs'), 'term', t => (term = t));

  // Giao diện sáng/tối dùng chung khóa với trang bài học
  const btnTheme = $('btn-toggle-theme');
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    btnTheme.textContent = theme === 'dark' ? 'Giao diện sáng' : 'Giao diện tối';
    store.set('zm_theme', theme);
  }
  applyTheme(store.get('zm_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  btnTheme.addEventListener('click', () =>
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));

  render();
  if (hasStudent) {
    const note = $('home-network-note');
    const warn = text => { note.textContent = text; note.hidden = false; };
    $('home-switch-student').addEventListener('click', async () => {
      $('home-switch-student').disabled = true;
      sessionStorage.removeItem('happy-student-session');
      if (cacheKey) sessionStorage.removeItem(cacheKey);
      if (supabaseReady) {
        try { await Promise.race([supabase.rpc('leave_session'), new Promise(resolve => setTimeout(resolve, 2000))]); }
        catch { /* Vẫn cho đổi tên khi mất mạng. */ }
      }
      location.assign('vao-hoc.html');
    });
    (async () => {
      try {
        ({ supabase, supabaseReady } = await import('./supabase-client.js'));
        if (!supabaseReady || !studentSession.student_id || !studentSession.session_id ||
            Date.parse(studentSession.expires_at) <= Date.now()) {
          if (Date.parse(studentSession.expires_at) <= Date.now()) {
            const expired = new Error('Phiên học hết hạn');
            expired.name = 'AccessDenied';
            throw expired;
          }
          throw new Error('Phiên học hoặc kết nối chưa sẵn sàng');
        }
        const { data, error } = await supabase.rpc('student_home_state', {
          p_student_id: studentSession.student_id, p_session_id: studentSession.session_id
        });
        if (error && (/ZM_BLOCK_|permission denied/i.test(error.message) || [401, 403].includes(error.status))) {
          const denied = new Error(error.message);
          denied.name = 'AccessDenied';
          throw denied;
        }
        if (error || !data?.ok || !grades.includes(data.grade)) throw error || new Error('Dữ liệu lớp chưa hợp lệ');
        courseState = data;
        grade = data.grade;
        if (cacheKey) sessionStorage.setItem(cacheKey, JSON.stringify(data));
        note.hidden = true;
        render();
      } catch (error) {
        if (error.name === 'AccessDenied') {
          courseState = null;
          if (cacheKey) sessionStorage.removeItem(cacheKey);
          warn('🔒 Phiên máy không còn được duyệt hoặc đã hết hạn. Chọn “Không phải em?” để vào lại.');
        } else warn(courseState
          ? '📶 Mất kết nối. Đang dùng trạng thái bài học đã lưu gần nhất.'
          : '📶 Chưa tải được lớp. Kiểm tra mạng hoặc chọn “Không phải em?” để vào lại.');
        render();
      }
    })();
  }
})();
