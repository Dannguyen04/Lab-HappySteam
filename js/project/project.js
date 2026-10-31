// js/project/project.js – Sổ dự án "Hành trình dòng nước" (Lớp 1, tuần 14–17 / 31–34): 4 chặng theo tuần
// ① Ý tưởng (chọn vấn đề, mô hình gốc, ý tưởng, bản vẽ) → ② Chế tạo (việc chế tạo, ảnh mô hình, chương trình khối
// tự do, chạy thử) → ③ Poster A4 tự ghép (tải ảnh / in) → ④ Chia sẻ (tự đánh giá sao, điều học được, nộp Sheets).
// Bài làm của nhóm lưu trong localStorage theo học kì (?hk=1|2) để tuần sau mở lại làm tiếp.
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const HK = q.get('hk') === '2' ? 2 : 1;
  const KEY = 'zm_proj_hk' + HK;
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
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  // ---------- dữ liệu ----------
  const PROBLEMS = [
    { id: 'dry', icon: '🌱', title: 'Cây thiếu nước', text: 'Vườn cây khô héo vì không ai tưới.', ideas: ['tưới cây tự động', 'bơm nước lên vườn'] },
    { id: 'flood', icon: '🌊', title: 'Lũ lụt ngập nhà', text: 'Mưa to, nước sông dâng làm ngập nhà.', ideas: ['đóng cửa đê khi nước dâng', 'báo động khi nước lên cao'] },
    { id: 'dirty', icon: '🗑️', title: 'Rác trên sông', text: 'Rác làm nước sông bẩn, cá không sống được.', ideas: ['vớt rác trên sông', 'lọc nước cho sạch'] },
    { id: 'waste', icon: '🚰', title: 'Lãng phí nước', text: 'Vòi nước quên khóa, nước chảy mãi.', ideas: ['tự khóa vòi khi không có người', 'đếm giờ dùng nước'] },
    { id: 'lift', icon: '⛰️', title: 'Đưa nước lên cao', text: 'Nhà trên đồi khó lấy nước từ suối.', ideas: ['bánh xe nước kéo nước lên', 'cối xoay gió bơm nước'] },
    { id: 'rain', icon: '🌧️', title: 'Hứng nước mưa', text: 'Nước mưa chảy đi mất, mùa khô lại thiếu.', ideas: ['hứng và giữ nước mưa', 'mở nắp bể khi trời mưa'] }
  ];
  const BASES = [3, 9, 10, 11, 12, 13];
  const CHECKLIST = ['Lắp mô hình gốc', 'Thêm chi tiết mới', 'Nối động cơ và cảm biến vào bộ não', 'Lập trình', 'Chạy thử', 'Sửa lỗi và chạy lại'];
  const ROLES = ['Thợ lắp ráp', 'Lập trình viên', 'Họa sĩ', 'Người trình bày'];
  const STARS = [
    { id: 'idea', text: 'Ý tưởng hay, giúp được mọi người' },
    { id: 'works', text: 'Mô hình chạy được' },
    { id: 'team', text: 'Cả nhóm cùng làm, chia việc' },
    { id: 'talk', text: 'Trình bày rõ ràng' }
  ];
  const LEARNED = ['cách nối động cơ', 'lập trình khối lệnh', 'chia việc trong nhóm', 'tiết kiệm nước'];
  const BLOCK_COLORS = { start: '#ffeb2e', control: '#e8892b', motor: '#2a9bd8', wait: '#8cc152', melody: '#8e6bbf', sensor: '#ea6ea9', display: '#17b3c7' };

  const empty = () => ({
    group: { name: '', className: '', members: ROLES.map(role => ({ name: '', role })) },
    problem: null, base: null, idea: '', sketch: null, sketched: false,
    checklist: [], photo: null, program: null, tests: [],
    title: '', upgrade: '', stars: {}, learned: '', stage: 1
  });
  let S = empty();
  try {
    S = Object.assign(empty(), JSON.parse(store.get(KEY) || '{}'));
  } catch (e) {}
  let saveTimer = 0;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!store.set(KEY, JSON.stringify(S))) $('submit-status').textContent = 'Không lưu được bài làm trên máy (bộ nhớ trình duyệt đầy). Hãy xóa bớt ảnh.';
    }, 250);
    updateMissions();
  }
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };

  // ---------- chặng ----------
  function go(n, focus) {
    S.stage = n;
    document.querySelectorAll('.stage-tab').forEach(t => {
      const on = +t.dataset.stage === n;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    for (let i = 1; i <= 4; i++) $('stage-' + i).hidden = i !== n;
    if (n === 3) renderPoster();
    save();
  }

  // ---------- ① Ý tưởng ----------
  function renderPick(container, items, selected, onPick) {
    container.replaceChildren(
      ...items.map(it => {
        const b = el('button', 'pick-card' + (it.id === selected ? ' on' : ''));
        b.type = 'button';
        b.dataset.id = it.id;
        b.setAttribute('aria-pressed', String(it.id === selected));
        if (it.img) {
          const img = el('img');
          img.src = it.img;
          img.alt = '';
          b.append(img);
        } else b.append(el('span', 'pick-icon', it.icon));
        b.append(el('b', null, it.title));
        if (it.text) b.append(el('small', null, it.text));
        b.onclick = () => {
          onPick(it.id === selected ? null : it.id);
          if (window.SFX) window.SFX.click();
        };
        return b;
      })
    );
  }
  function renderIdea() {
    renderPick($('problem-cards'), PROBLEMS, S.problem, id => {
      S.problem = id;
      save();
      renderIdea();
    });
    const lessons = (window.ZM_CATALOG ? window.ZM_CATALOG.lessons : []).filter(l => l.grade === 1 && BASES.includes(l.no));
    const bases = lessons.map(l => ({ id: 'b' + l.no, title: `Bài ${l.no}`, text: l.title, img: l.cover, icon: '🧩' }));
    bases.push({ id: 'new', title: 'Mô hình mới', text: 'Nhóm tự nghĩ', icon: '✨' });
    renderPick($('base-cards'), bases, S.base, id => {
      S.base = id;
      save();
      renderIdea();
    });
    const p = PROBLEMS.find(x => x.id === S.problem);
    suggest($('idea-suggest'), p ? p.ideas : [], 'idea');
  }
  function suggest(box, list, field) {
    box.replaceChildren(
      ...list.map(t => {
        const b = el('button', 'tool', '+ ' + t);
        b.type = 'button';
        b.onclick = () => {
          const ta = $(field);
          ta.value = (ta.value.trim() ? ta.value.trim() + ', ' : '') + t;
          S[field] = ta.value;
          save();
        };
        return b;
      })
    );
  }

  // Bảng vẽ: bút 5 màu, 2 cỡ, tẩy, xóa hết; lưu ảnh PNG sau mỗi nét
  const sketch = { color: '#1e2a34', size: 6, erase: false };
  function setupSketch() {
    const cv = $('sketch'),
      ctx = cv.getContext('2d');
    const blank = () => {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, cv.width, cv.height);
    };
    blank();
    if (S.sketch) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, cv.width, cv.height);
      img.src = S.sketch;
    }
    const tools = $('sketch-tools');
    const colors = ['#1e2a34', '#2a9bd8', '#e53935', '#43a047', '#e8892b'];
    const btn = (label, title, on, fn, swatch) => {
      const b = el('button', 'sk-btn' + (on ? ' on' : ''), label);
      b.type = 'button';
      b.title = title;
      b.setAttribute('aria-label', title);
      if (swatch) b.style.setProperty('--sw', swatch);
      b.onclick = () => {
        fn();
        renderTools();
      };
      return b;
    };
    function renderTools() {
      tools.replaceChildren(
        ...colors.map(c => btn('', 'Bút màu', !sketch.erase && sketch.color === c, () => ((sketch.color = c), (sketch.erase = false)), c)),
        btn('Mảnh', 'Nét mảnh', sketch.size === 6, () => (sketch.size = 6)),
        btn('Đậm', 'Nét đậm', sketch.size === 14, () => (sketch.size = 14)),
        btn('Tẩy', 'Tẩy', sketch.erase, () => (sketch.erase = true)),
        btn('Xóa hết', 'Xóa hết bản vẽ', false, () => {
          if (!confirm('Xóa hết bản vẽ?')) return;
          blank();
          S.sketch = null;
          S.sketched = false;
          save();
        })
      );
    }
    renderTools();
    let drawing = false,
      last = null;
    const at = e => {
      const r = cv.getBoundingClientRect();
      return [((e.clientX - r.left) * cv.width) / r.width, ((e.clientY - r.top) * cv.height) / r.height];
    };
    cv.addEventListener('pointerdown', e => {
      drawing = true;
      last = at(e);
      cv.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    cv.addEventListener('pointermove', e => {
      if (!drawing) return;
      const p = at(e);
      ctx.strokeStyle = sketch.erase ? '#fff' : sketch.color;
      ctx.lineWidth = sketch.erase ? 30 : sketch.size;
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(last[0], last[1]);
      ctx.lineTo(p[0], p[1]);
      ctx.stroke();
      last = p;
    });
    const end = () => {
      if (!drawing) return;
      drawing = false;
      S.sketch = cv.toDataURL('image/jpeg', 0.8);
      S.sketched = true;
      save();
    };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    // Ảnh chụp bản vẽ trên giấy → vẽ vừa khung
    $('sketch-photo').addEventListener('change', async e => {
      const f = e.target.files[0];
      if (!f) return;
      const img = await loadImage(URL.createObjectURL(f));
      blank();
      const k = Math.min(cv.width / img.width, cv.height / img.height);
      ctx.drawImage(img, (cv.width - img.width * k) / 2, (cv.height - img.height * k) / 2, img.width * k, img.height * k);
      S.sketch = cv.toDataURL('image/jpeg', 0.8);
      S.sketched = true;
      save();
    });
  }
  const loadImage = src =>
    new Promise((ok, fail) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = fail;
      img.src = src;
    });
  // Ảnh thu nhỏ (cạnh dài ≤ 900 px, JPEG) để localStorage không đầy
  async function shrink(file) {
    const img = await loadImage(URL.createObjectURL(file));
    const k = Math.min(1, 900 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.78);
  }

  // ---------- ② Chế tạo ----------
  let blocks = null;
  function renderBuild() {
    $('build-checklist').replaceChildren(
      ...CHECKLIST.map((t, i) => {
        const li = el('li');
        const lab = el('label', 'check');
        const cb = el('input');
        cb.type = 'checkbox';
        cb.checked = S.checklist.includes(i);
        cb.onchange = () => {
          S.checklist = cb.checked ? [...new Set([...S.checklist, i])] : S.checklist.filter(x => x !== i);
          if (window.SFX) window.SFX.click();
          save();
        };
        lab.append(cb, el('span', null, t));
        li.append(lab);
        return li;
      })
    );
    const box = $('model-photo-box');
    box.replaceChildren();
    if (S.photo) {
      const img = el('img');
      img.src = S.photo;
      img.alt = 'Ảnh mô hình của nhóm';
      box.append(img);
    } else box.append(el('span', 'hint', 'Chưa có ảnh'));
    $('test-log').replaceChildren(...S.tests.map((t, i) => el('li', t.ok ? 'ok' : 'fix', `Lần ${i + 1}: ${t.ok ? '⭐ chạy tốt' : '🔧 cần sửa'} · ${t.at}`)));
  }
  function setupBlocks() {
    blocks = new window.BlockEngine('program-canvas-chain', 'block-toolbox', {
      toolbox: ['touch', 'obstacle', 'lowSpeed', 'mediumSpeed', 'highSpeed', 'motorPower', 'motorReverse', 'wait', 'motorStop',
        'melodyA', 'melodyB', 'repeatStart', 'repeatEnd'],
      empty: ['start']
    });
    blocks.renderToolbox();
    if (Array.isArray(S.program) && S.program.length) {
      blocks.blocks = S.program;
      blocks.render();
    } else blocks.clearProgram();
    blocks.setOnChange(list => {
      S.program = list.map(b => ({ ...b }));
      save();
    });
    blocks.onStartTap = () => {
      if (window.SFX) window.SFX.ding();
    };
  }

  // ---------- ③ Poster ----------
  function wrapText(ctx, text, x, y, w, lh, maxLines = 4) {
    const words = String(text || '').split(/\s+/);
    let line = '',
      n = 0;
    for (const word of words) {
      const t = line ? line + ' ' + word : word;
      if (ctx.measureText(t).width > w && line) {
        ctx.fillText(line, x, y + n * lh);
        line = word;
        if (++n >= maxLines) return n;
      } else line = t;
    }
    if (line) ctx.fillText(line, x, y + n * lh), n++;
    return n;
  }
  function box(ctx, x, y, w, h, title, color) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = '700 34px "Be Vietnam Pro","Segoe UI",sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 28, y + 52);
  }
  async function drawImg(ctx, src, x, y, w, h) {
    if (!src) return false;
    try {
      const img = await loadImage(src);
      const k = Math.min(w / img.width, h / img.height);
      ctx.drawImage(img, x + (w - img.width * k) / 2, y + (h - img.height * k) / 2, img.width * k, img.height * k);
      return true;
    } catch (e) {
      return false;
    }
  }
  let posterJob = 0;
  async function renderPoster() {
    const job = ++posterJob;
    const cv = $('poster'),
      ctx = cv.getContext('2d'),
      W = cv.width,
      H = cv.height;
    ctx.fillStyle = '#eef7fb';
    ctx.fillRect(0, 0, W, H);
    // Đầu poster
    ctx.fillStyle = '#0080b8';
    ctx.fillRect(0, 0, W, 260);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.font = '600 30px "Be Vietnam Pro","Segoe UI",sans-serif';
    ctx.fillText(`DỰ ÁN HÀNH TRÌNH DÒNG NƯỚC · LỚP ${S.group.className || '1'}`, 70, 80);
    ctx.font = '800 76px "Be Vietnam Pro","Segoe UI",sans-serif';
    wrapText(ctx, S.title || 'Tên dự án', 70, 170, W - 140, 80, 1);
    const members = S.group.members.filter(m => m.name.trim());
    ctx.font = '500 30px "Be Vietnam Pro","Segoe UI",sans-serif';
    ctx.fillText((S.group.name || 'Nhóm') + (members.length ? ' · ' + members.map(m => m.name).join(', ') : ''), 70, 230);
    // Vấn đề + ý tưởng
    const p = PROBLEMS.find(x => x.id === S.problem);
    box(ctx, 60, 300, 540, 380, 'Vấn đề', '#e53935');
    ctx.font = '96px "Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.fillText(p ? p.icon : '❓', 90, 460);
    ctx.fillStyle = '#1e2a34';
    ctx.font = '700 38px "Be Vietnam Pro","Segoe UI",sans-serif';
    ctx.fillText(p ? p.title : 'Chưa chọn', 210, 430);
    ctx.font = '400 30px "Be Vietnam Pro","Segoe UI",sans-serif';
    wrapText(ctx, p ? p.text : '', 90, 530, 480, 42, 3);
    box(ctx, 640, 300, 540, 380, 'Ý tưởng', '#43a047');
    ctx.fillStyle = '#1e2a34';
    ctx.font = '400 32px "Be Vietnam Pro","Segoe UI",sans-serif';
    wrapText(ctx, S.idea ? 'Mô hình của nhóm em giúp ' + S.idea : 'Chưa viết ý tưởng', 670, 410, 480, 46, 6);
    // Bản vẽ + ảnh mô hình
    box(ctx, 60, 720, 540, 480, 'Bản vẽ phác thảo', '#e8892b');
    box(ctx, 640, 720, 540, 480, 'Mô hình của nhóm', '#2a9bd8');
    if (!(await drawImg(ctx, S.sketch, 90, 790, 480, 380))) {
      ctx.fillStyle = '#9aa7b4';
      ctx.font = '400 28px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.fillText('Chưa có bản vẽ', 230, 990);
    }
    let base = null;
    if (S.base && S.base !== 'new') base = (window.ZM_CATALOG.lessons.find(l => l.grade === 1 && 'b' + l.no === S.base) || {}).cover;
    if (!(await drawImg(ctx, S.photo || base, 670, 790, 480, 380))) {
      ctx.fillStyle = '#9aa7b4';
      ctx.font = '400 28px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.fillText('Chưa có ảnh', 830, 990);
    }
    if (job !== posterJob) return;
    // Chương trình: các khối màu như phần mềm ZMrobo
    box(ctx, 60, 1240, 1120, 250, 'Chương trình', '#8e6bbf');
    const prog = (S.program || []).slice(0, 9);
    prog.forEach((b, i) => {
      const x = 90 + i * 116,
        y = 1325;
      ctx.fillStyle = BLOCK_COLORS[b.color] || '#999';
      ctx.beginPath();
      ctx.roundRect(x, y, 104, 104, 14);
      ctx.fill();
      ctx.fillStyle = b.color === 'start' ? '#1e9b3a' : '#fff';
      ctx.font = '700 19px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.textAlign = 'center';
      wrapText(ctx, b.label || b.name, x + 52, y + 44, 94, 23, 3);
      ctx.textAlign = 'left';
    });
    if (!prog.length) {
      ctx.fillStyle = '#9aa7b4';
      ctx.font = '400 28px "Be Vietnam Pro","Segoe UI",sans-serif';
      ctx.fillText('Chưa có chương trình', 90, 1380);
    }
    // Nâng cấp + chạy thử
    box(ctx, 60, 1530, 1120, 160, 'Nâng cấp và chạy thử', '#17b3c7');
    ctx.fillStyle = '#1e2a34';
    ctx.font = '400 30px "Be Vietnam Pro","Segoe UI",sans-serif';
    const ok = S.tests.filter(t => t.ok).length;
    wrapText(ctx, (S.upgrade || 'Chưa ghi nâng cấp') + ` · Chạy thử ${S.tests.length} lần, ${ok} lần chạy tốt`, 90, 1640, 1060, 40, 1);
    ctx.fillStyle = '#56687a';
    ctx.font = '500 24px "Be Vietnam Pro","Segoe UI",sans-serif';
    ctx.fillText('Happy STEAM · Phòng Lab ZMrobo ảo', 60, H - 26);
    const missing = [];
    if (!S.title) missing.push('tên dự án');
    if (!S.problem) missing.push('vấn đề');
    if (!S.sketch && !S.photo) missing.push('bản vẽ hoặc ảnh mô hình');
    $('poster-missing').textContent = missing.length ? 'Poster còn thiếu: ' + missing.join(', ') + '.' : 'Poster đã đủ thông tin.';
  }

  // ---------- ④ Chia sẻ ----------
  function renderShare() {
    $('stars').replaceChildren(
      ...STARS.map(s => {
        const row = el('div', 'star-row');
        row.append(el('span', null, s.text));
        const g = el('div', 'star-btns');
        g.setAttribute('role', 'radiogroup');
        g.setAttribute('aria-label', s.text);
        for (let n = 1; n <= 5; n++) {
          const b = el('button', 'star' + ((S.stars[s.id] || 0) >= n ? ' on' : ''), '★');
          b.type = 'button';
          b.setAttribute('role', 'radio');
          b.setAttribute('aria-checked', String(S.stars[s.id] === n));
          b.setAttribute('aria-label', n + ' sao');
          b.onclick = () => {
            S.stars[s.id] = n;
            if (window.SFX) window.SFX.click();
            save();
            renderShare();
          };
          g.append(b);
        }
        row.append(g);
        return row;
      })
    );
    suggest($('learned-suggest'), LEARNED, 'learned');
  }

  // ---------- nhiệm vụ ----------
  let allWas = false;
  function missions() {
    const m1 = !!(S.problem && S.base && S.idea.trim().length >= 5 && S.sketched);
    const m2 = S.checklist.length >= 4 && (S.program || []).filter(b => b.type !== 'start').length >= 3;
    const m3 = !!(m1 && S.title.trim() && (S.sketch || S.photo));
    const m4 = STARS.every(s => S.stars[s.id]) && S.learned.trim().length >= 5;
    return { m1, m2, m3, m4 };
  }
  function updateMissions() {
    const m = missions();
    let n = 0;
    for (const k of ['m1', 'm2', 'm3', 'm4']) {
      $('chip-' + k).classList.toggle('is-done', m[k]);
      if (m[k]) n++;
    }
    const all = n === 4;
    $('mission-summary-badge').textContent = all ? 'Đạt 4/4 nhiệm vụ' : `${n}/4 nhiệm vụ`;
    $('mission-summary-badge').className = 'mission-badge' + (all ? ' badge-all-done' : '');
    if (all && !allWas && window.SFX) window.SFX.fanfare();
    allWas = all;
  }

  async function submit() {
    const status = $('submit-status');
    const m = missions();
    const url = store.get('zm_teacher_webhook') || '';
    if (!S.group.name.trim()) {
      status.textContent = 'Hãy đặt tên nhóm trước khi nộp (nút Nhóm ở đầu trang).';
      $('btn-group').click();
      return;
    }
    const p = PROBLEMS.find(x => x.id === S.problem);
    const payload = {
      timestamp: new Date().toLocaleString('vi-VN'),
      name: S.group.name + ': ' + S.group.members.filter(x => x.name.trim()).map(x => `${x.name} (${x.role})`).join(', '),
      className: S.group.className || 'Chưa điền',
      lesson: `Dự án Hành trình dòng nước – học kì ${HK === 1 ? 'I' : 'II'}`,
      score: `${Object.values(m).filter(Boolean).length}/4`,
      m1: m.m1, m2: m.m2, m3: m.m3, m4: m.m4, m5: null, m6: null,
      details: [S.title && 'Tên: ' + S.title, p && 'Vấn đề: ' + p.title, S.idea && 'Ý tưởng: ' + S.idea,
        'Tự đánh giá: ' + STARS.map(s => `${s.text} ${S.stars[s.id] || 0}★`).join('; '), S.learned && 'Học được: ' + S.learned]
        .filter(Boolean).join(' · '),
      verificationCode: 'DA' + HK + '-' + Math.floor(1000 + Math.random() * 9000)
    };
    if (!url) {
      status.textContent = 'Chưa có địa chỉ nhận bài của thầy/cô. Hãy in poster hoặc chụp màn hình để nộp.';
      return;
    }
    try {
      $('btn-submit').disabled = true;
      status.textContent = 'Đang gửi…';
      await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      status.textContent = `Đã gửi dự án (mã ${payload.verificationCode}). Nhờ thầy/cô kiểm tra trong Google Sheets.`;
    } catch (e) {
      status.textContent = 'Không gửi được. Hãy chụp màn hình poster để nộp.';
    } finally {
      $('btn-submit').disabled = false;
    }
  }

  // ---------- nhóm ----------
  function renderGroup() {
    $('group-label').textContent = S.group.name ? 'Nhóm: ' + S.group.name : 'Nhóm: chưa đặt tên';
    $('group-name').value = S.group.name;
    $('group-class').value = S.group.className;
    $('members').replaceChildren(
      ...S.group.members.map((m, i) => {
        const lab = el('label', 'field', m.role);
        const inp = el('input');
        inp.value = m.name;
        inp.maxLength = 30;
        inp.placeholder = 'Tên bạn ' + (i + 1);
        inp.oninput = () => {
          m.name = inp.value;
          save();
        };
        lab.append(inp);
        return lab;
      })
    );
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.SFX) window.SFX.init();
    $('proj-eyebrow').textContent = HK === 1 ? 'Lớp 1 · Dự án học kì I · Tuần 14–17' : 'Lớp 1 · Dự án học kì II · Tuần 31–34';
    renderIdea();
    setupSketch();
    $('idea').value = S.idea;
    $('idea').oninput = e => ((S.idea = e.target.value), save());
    renderBuild();
    setupBlocks();
    $('btn-clear-code').onclick = () => confirm('Xóa hết các khối lệnh?') && blocks.clearProgram();
    $('model-photo').addEventListener('change', async e => {
      if (!e.target.files[0]) return;
      S.photo = await shrink(e.target.files[0]);
      save();
      renderBuild();
    });
    const addTest = ok => {
      S.tests.push({ ok, at: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) });
      if (S.tests.length > 12) S.tests.shift();
      if (window.SFX) ok ? window.SFX.ding() : window.SFX.click();
      save();
      renderBuild();
    };
    $('test-ok').onclick = () => addTest(true);
    $('test-fix').onclick = () => addTest(false);
    $('title').value = S.title;
    $('upgrade').value = S.upgrade;
    for (const f of ['title', 'upgrade'])
      $(f).oninput = e => {
        S[f] = e.target.value;
        save();
        clearTimeout(renderPoster.t);
        renderPoster.t = setTimeout(renderPoster, 300);
      };
    $('poster-png').onclick = () =>
      $('poster').toBlob(b => {
        const a = el('a');
        a.href = URL.createObjectURL(b);
        a.download = 'poster-' + (S.title || 'du-an').replace(/[^\p{L}\p{N}]+/gu, '-') + '.png';
        a.click();
      }, 'image/png');
    $('poster-print').onclick = async () => {
      await renderPoster();
      $('poster-print-img').src = $('poster').toDataURL('image/png');
      setTimeout(() => window.print(), 100);
    };
    renderShare();
    $('learned').value = S.learned;
    $('learned').oninput = e => ((S.learned = e.target.value), save());
    $('btn-submit').onclick = submit;
    // nhóm
    renderGroup();
    $('btn-group').onclick = () => $('group-modal').classList.add('is-open');
    $('btn-close-group').onclick = () => {
      $('group-modal').classList.remove('is-open');
      renderGroup();
    };
    $('group-name').oninput = e => ((S.group.name = e.target.value), save());
    $('group-class').oninput = e => ((S.group.className = e.target.value), save());
    document.addEventListener('keydown', e => e.key === 'Escape' && $('group-modal').classList.remove('is-open'));
    // chặng: ?chang=1..4 (thẻ tuần trên trang chọn bài) hoặc chặng đang làm dở
    const tabs = [...document.querySelectorAll('.stage-tab')];
    tabs.forEach((t, i) => {
      t.onclick = () => go(+t.dataset.stage);
      t.onkeydown = e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        go(+tabs[(i + (e.key === 'ArrowRight' ? 1 : 3)) % 4].dataset.stage, true);
      };
    });
    const want = +q.get('chang');
    go(want >= 1 && want <= 4 ? want : S.stage || 1);
    // giao diện sáng/tối dùng chung khóa với các trang khác
    const btnTheme = $('btn-toggle-theme');
    const applyTheme = th => {
      document.documentElement.setAttribute('data-theme', th);
      btnTheme.textContent = th === 'dark' ? 'Giao diện sáng' : 'Giao diện tối';
      store.set('zm_theme', th);
    };
    applyTheme(store.get('zm_theme') || 'light');
    btnTheme.onclick = () => applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    updateMissions();
  });

  window.ZMProject = { state: () => S, missions, renderPoster };
})();
