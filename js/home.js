// js/home.js – trang chọn bài: Lớp 1–5 → Học kì I/II → thẻ bài học (danh mục ở js/catalog.js).
// Bài đã làm xong (có href) mở được; bài khác hiện mờ "Sắp có". Nhớ lớp/học kì vừa chọn; có thể mở thẳng ?lop=1&hk=2.
(function () {
  'use strict';

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

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function renderGrades() {
    $('grade-tabs').innerHTML = grades
      .map(g => {
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
    const body = `
      <div class="lc-cover" data-type="${l.type}">${cover}</div>
      <div class="lc-body">
        <span class="lc-eyebrow">${head}</span>
        <b class="lc-title">${esc(l.title)}</b>
        ${l.about ? `<p class="lc-about">${esc(l.about)}</p>` : ''}
        <span class="lc-foot">
          <span class="lc-type" data-type="${l.type}" title="${esc(t.hint)}">${t.label}</span>
          <span class="lc-go">${l.href ? 'Vào học →' : 'Sắp có'}</span>
        </span>
      </div>`;
    return l.href
      ? `<a class="lesson-card is-ready" href="${esc(l.href)}">${body}</a>`
      : `<div class="lesson-card is-soon" aria-disabled="true">${body}</div>`;
  }

  function render() {
    renderGrades();
    document.querySelectorAll('#term-tabs [data-term]').forEach(b => {
      const on = +b.dataset.term === term;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    const list = lessons.filter(l => l.grade === grade && l.term === term);
    const ready = list.filter(l => l.href).length;
    $('home-count').textContent = list.length
      ? `Lớp ${grade} · Học kì ${term === 1 ? 'I' : 'II'}: ${list.length} bài · ${ready} bài đã sẵn sàng`
      : `Lớp ${grade} · Học kì ${term === 1 ? 'I' : 'II'}: chưa có bài nào trong danh mục.`;
    $('lesson-grid').innerHTML = list.map(card).join('');
    store.set('zm_home_grade', grade);
    store.set('zm_home_term', term);
  }

  // Bấm và dùng mũi tên trái/phải để chuyển (mẫu tablist)
  function tabs(container, attr, set) {
    container.addEventListener('click', e => {
      const b = e.target.closest(`[data-${attr}]`);
      if (!b) return;
      set(+b.dataset[attr]);
      render();
    });
    container.addEventListener('keydown', e => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const all = [...container.querySelectorAll(`[data-${attr}]`)];
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
})();
