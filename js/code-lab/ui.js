// Phòng lập trình – giao diện: chọn sa bàn, dải khối ngang hai cấp (Bé / Lớp 3+), bảng chỉnh khối, chạy / từng khối /
// tua, bảng cảm biến, nhật ký, lưu tự động, xuất/nhập file, gửi cho lớp (dữ liệu mẫu, chưa nối máy chủ).
(function () {
  'use strict';
  const CL = window.CodeLab, V = window.CodeLabView;
  const $ = id => document.getElementById(id);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('codelab.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('codelab.' + k, JSON.stringify(v)); } catch { /* đầy bộ nhớ: bỏ qua */ } }
  };

  // ---------- Khối trong khay ----------
  const mv = (dir, speed, sec) => ['move', { dir, speed, sec }];
  const TOOLS = {
    fwd: { label: 'Tiến', color: 'motor', add: [mv('fwd', 75, 1)] },
    back: { label: 'Lùi', color: 'motor', add: [mv('back', 75, 1)] },
    left: { label: 'Rẽ trái', color: 'motor', add: [mv('left', 50, 0.5)] },
    right: { label: 'Rẽ phải', color: 'motor', add: [mv('right', 50, 0.5)] },
    move: { label: 'Di chuyển', color: 'motor', add: [mv('fwd', 50, 1)] },
    motors: { label: 'Hai động cơ', color: 'motor', add: ['motors'] },
    stop: { label: 'Dừng', color: 'motor', add: ['stop'] },
    wait: { label: 'Chờ', color: 'wait', add: ['wait'] },
    waitUntil: { label: 'Chờ đến khi', color: 'sensor', add: ['waitUntil'] },
    repeat: { label: 'Lặp n lần', color: 'control', add: ['repeat', 'end'] },
    forever: { label: 'Lặp mãi', color: 'control', add: ['forever', 'end'] },
    if: { label: 'Nếu', color: 'control', add: ['if', 'end'] },
    ifElse: { label: 'Nếu … không thì', color: 'control', add: ['if', 'else', 'end'] },
    soundA: { label: 'Âm thanh A', color: 'melody', add: ['soundA'] },
    soundB: { label: 'Âm thanh B', color: 'melody', add: ['soundB'] },
    led: { label: 'Đèn màu', color: 'display', add: ['led'] }
  };
  const TOOLBOX = {
    kid: [['Di chuyển', ['fwd', 'back', 'left', 'right', 'stop']], ['Chờ & lặp', ['wait', 'repeat', 'forever']], ['Âm thanh & đèn', ['soundA', 'soundB', 'led']]],
    pro: [['Di chuyển', ['move', 'motors', 'stop']], ['Chờ', ['wait', 'waitUntil']], ['Điều khiển', ['repeat', 'forever', 'if', 'ifElse']], ['Âm thanh & đèn', ['soundA', 'soundB', 'led']]]
  };
  const COLOR_OF = { start: 'start', move: 'motor', motors: 'motor', stop: 'motor', wait: 'wait', waitUntil: 'sensor', repeat: 'control', forever: 'control', if: 'control', else: 'control', end: 'control', sound: 'melody', led: 'display' };
  const DIR = { fwd: ['↑', 'Tiến'], back: ['↓', 'Lùi'], left: ['↶', 'Rẽ trái'], right: ['↷', 'Rẽ phải'] };
  const KID_SPEED = { 50: 'chậm', 75: 'vừa', 100: 'nhanh' };
  const SENSOR = { dist: 'Sóng âm', touch: 'Chạm', lineL: 'Mắt trái', lineR: 'Mắt phải', color: 'Màu' };
  const num = v => String(v).replace('.', ',');

  function condText(c) {
    if (c.s === 'dist') return `sóng âm ${c.op} ${c.v} cm`;
    if (c.s === 'touch') return c.op === 'not' ? 'không chạm' : 'chạm được nhấn';
    if (c.s === 'lineL' || c.s === 'lineR') return `${c.s === 'lineL' ? 'mắt trái' : 'mắt phải'} ${c.op === 'not' ? 'không thấy' : 'thấy'} vạch`;
    if (c.s === 'color') return `màu ${c.op === 'not' ? '≠' : '='} ${V.COLOR_NAME[c.v] || c.v}`;
    return '';
  }
  // Hình + chữ của một khối trên dải
  function face(b, i, blocks) {
    switch (b.t) {
      case 'start': return ['⚑', 'Bắt đầu', ''];
      case 'move': {
        const speed = state.level === 'kid' && KID_SPEED[b.speed] ? KID_SPEED[b.speed] : b.speed + '%';
        return [DIR[b.dir][0], DIR[b.dir][1], `${speed} · ${b.sec ? num(b.sec) + ' s' : 'mãi'}`];
      }
      case 'motors': return ['⚙', 'Động cơ', `M1 ${b.m1} · M2 ${b.m2}`];
      case 'stop': return ['■', 'Dừng', ''];
      case 'wait': return ['⏳', 'Chờ', num(b.sec) + ' s'];
      case 'waitUntil': return ['⏳', 'Chờ đến khi', condText(b.cond)];
      case 'repeat': return ['⟳', `Lặp ${b.n} lần`, ''];
      case 'forever': return ['∞', 'Lặp mãi', ''];
      case 'if': return ['◇', 'Nếu', condText(b.cond)];
      case 'else': return ['◆', 'Không thì', ''];
      case 'end': {
        const opener = openerOf(blocks, i);
        return ['⌟', opener && opener.t === 'if' ? 'Hết Nếu' : 'Hết lặp', ''];
      }
      case 'sound': return ['♪', 'Âm thanh ' + b.tune, ''];
      case 'led': return ['●', 'Đèn', b.color === 'off' ? 'tắt' : V.COLOR_NAME[b.color]];
    }
    return ['?', b.t, ''];
  }
  function openerOf(blocks, endIdx) {
    let depth = 0;
    for (let j = endIdx - 1; j >= 0; j--) {
      const t = blocks[j].t;
      if (t === 'end') depth++;
      else if (CL.OPENERS.has(t)) {
        if (!depth) return blocks[j];
        depth--;
      }
    }
    return null;
  }

  // ---------- Trạng thái ----------
  const state = {
    level: store.get('level', 'kid'),
    mapId: store.get('map', CL.MAPS[0].id),
    blocks: [CL.make('start')],
    selected: -1,
    speed: 1
  };
  const allMaps = () => [...CL.MAPS, ...store.get('maps', [])];
  const mapById = id => allMaps().find(m => m.id === id) || CL.MAPS[0];
  let sim = new CL.Sim(mapById(state.mapId));
  const canvas = $('world'), ctx = canvas.getContext('2d');
  let T = V.fit(canvas, sim.map);

  const progKey = () => `prog.${state.mapId}.${state.level}`;
  function save() { store.set(progKey(), state.blocks); }
  function loadProgram() {
    state.blocks = store.get(progKey(), null) || [CL.make('start')];
    state.selected = -1;
    sim.setProgram(state.blocks);
  }

  // ---------- Thông báo ----------
  function log(kind, text) {
    const li = document.createElement('li');
    li.dataset.kind = kind;
    li.innerHTML = `<time>${num(sim.t.toFixed(1))} s</time> ${text}`;
    $('log').prepend(li);
    while ($('log').children.length > 30) $('log').lastChild.remove();
  }
  function msg(text, kind = '') {
    $('msg').textContent = text;
    $('msg').dataset.kind = kind;
  }
  let toastTimer = 0;
  function toast(text) {
    $('toast').textContent = text;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($('toast').hidden = true), 2600);
  }

  // ---------- Dải chương trình ----------
  function depths(blocks) {
    let d = 0;
    return blocks.map(b => {
      if (b.t === 'end') d = Math.max(0, d - 1);
      const here = b.t === 'else' ? Math.max(0, d - 1) : d;
      if (CL.OPENERS.has(b.t)) d++;
      return here;
    });
  }
  function renderProgram() {
    const box = $('program');
    box.innerHTML = '';
    const dep = depths(state.blocks);
    state.blocks.forEach((b, i) => {
      const [icon, title, sub] = face(b, i, state.blocks);
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `cl-block c-${COLOR_OF[b.t]}` + (i === state.selected ? ' is-selected' : '') + (i === sim.active ? ' is-active' : '') +
        (CL.OPENERS.has(b.t) ? ' is-open' : '') + (b.t === 'end' ? ' is-close' : '');
      el.dataset.i = i;
      el.style.setProperty('--depth', dep[i]);
      el.innerHTML = `<span class="cl-idx">${i + 1}</span><span class="cl-ico" aria-hidden="true">${icon}</span>` +
        `<span class="cl-cap">${title}</span>${sub ? `<span class="cl-sub">${sub}</span>` : ''}` +
        (dep[i] ? `<span class="cl-nest" aria-hidden="true">${'<i></i>'.repeat(Math.min(3, dep[i]))}</span>` : '');
      el.setAttribute('aria-label', `${i + 1}. ${title} ${sub}`);
      el.addEventListener('click', () => {
        if (b.t === 'start') { run(); return; }
        state.selected = state.selected === i ? -1 : i;
        renderProgram();
        renderInspector();
      });
      box.appendChild(el);
    });
    const add = document.createElement('span');
    add.className = 'cl-add-hint';
    add.textContent = state.selected >= 0 ? `Khối mới sẽ chèn sau khối ${state.selected + 1}` : 'Chạm khối trong khay bên dưới để thêm vào cuối';
    box.appendChild(add);
  }
  function setActive(i) {
    for (const el of $('program').querySelectorAll('.cl-block')) {
      const on = +el.dataset.i === i;
      if (on !== el.classList.contains('is-active')) {
        el.classList.toggle('is-active', on);
        if (on) el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      }
    }
  }
  function changed() {
    stopRun(true);
    sim.setProgram(state.blocks);
    save();
    renderProgram();
    renderInspector();
    draw();
  }
  function insert(key) {
    const list = TOOLS[key].add.map(CL.make);
    const at = state.selected >= 0 ? state.selected + 1 : state.blocks.length;
    state.blocks.splice(at, 0, ...list);
    state.selected = at;
    if (window.SFX) window.SFX.click();
    changed();
  }
  function remove(i) {
    const b = state.blocks[i];
    if (b.t === 'start' || b.t === 'end') return;
    if (CL.OPENERS.has(b.t)) {
      const m = CL.matchOf(state.blocks, i);
      // bỏ khối mở cùng "Không thì" và "Hết" đi kèm, giữ các khối bên trong
      [m.end, m.else].filter(j => j > i).sort((a, c) => c - a).forEach(j => state.blocks.splice(j, 1));
    }
    state.blocks.splice(i, 1);
    state.selected = Math.min(i, state.blocks.length - 1);
    if (state.selected === 0) state.selected = -1;
    changed();
  }
  function move(i, d) {
    const j = i + d;
    if (j < 1 || j >= state.blocks.length) return;
    const next = state.blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    if (!CL.check(next).ok) {
      msg('Không dịch được: khối đóng/mở sẽ bị đảo thứ tự.', 'warn');
      if (window.SFX) window.SFX.buzz();
      return;
    }
    state.blocks = next;
    state.selected = j;
    changed();
  }

  // ---------- Bảng chỉnh khối ----------
  function chips(label, options, value, set) {
    const wrap = document.createElement('div');
    wrap.className = 'cl-field';
    wrap.innerHTML = `<span class="cl-field-label">${label}</span>`;
    const row = document.createElement('div');
    row.className = 'cl-chips';
    for (const [v, text] of options) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cl-chip' + (v === value ? ' is-on' : '');
      b.textContent = text;
      b.addEventListener('click', () => { set(v); changed(); });
      row.appendChild(b);
    }
    wrap.appendChild(row);
    return wrap;
  }
  function stepper(label, value, min, max, step, set, unit = '') {
    const wrap = document.createElement('div');
    wrap.className = 'cl-field';
    wrap.innerHTML = `<span class="cl-field-label">${label}</span><div class="cl-stepper"><button type="button" aria-label="Giảm">−</button>` +
      `<output>${num(value)}${unit}</output><button type="button" aria-label="Tăng">+</button></div>`;
    const [minus, plus] = wrap.querySelectorAll('button');
    const fix = v => Math.round(Math.max(min, Math.min(max, v)) * 100) / 100;
    minus.addEventListener('click', () => { set(fix(value - step)); changed(); });
    plus.addEventListener('click', () => { set(fix(value + step)); changed(); });
    return wrap;
  }
  function condFields(b, box) {
    const c = b.cond;
    box.appendChild(chips('Cảm biến', Object.entries(SENSOR), c.s, v => {
      b.cond = v === 'dist' ? { s: v, op: '<', v: 20 } : v === 'color' ? { s: v, op: 'is', v: 'green' } : { s: v, op: 'is' };
    }));
    if (c.s === 'dist') {
      box.appendChild(chips('So sánh', [['<', 'gần hơn <'], ['>', 'xa hơn >']], c.op, v => (c.op = v)));
      box.appendChild(stepper('Khoảng cách', c.v, 5, 150, 5, v => (c.v = v), ' cm'));
    } else if (c.s === 'color') {
      box.appendChild(chips('Là', [['is', '='], ['not', '≠']], c.op, v => (c.op = v)));
      box.appendChild(chips('Màu', ['green', 'red', 'blue', 'yellow', 'white'].map(k => [k, V.COLOR_NAME[k]]), c.v, v => (c.v = v)));
    } else {
      box.appendChild(chips('Khi', [['is', c.s === 'touch' ? 'được nhấn' : 'thấy vạch'], ['not', c.s === 'touch' ? 'không nhấn' : 'không thấy']], c.op, v => (c.op = v)));
    }
  }
  function renderInspector() {
    const box = $('inspector');
    const i = state.selected, b = state.blocks[i];
    box.hidden = !b;
    if (!b) return;
    box.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'cl-ins-head';
    const [, title] = face(b, i, state.blocks);
    head.innerHTML = `<strong>Khối ${i + 1}: ${title}</strong>`;
    const tools = document.createElement('div');
    tools.className = 'cl-ins-tools';
    const tb = (text, label, fn, disabled) => {
      const x = document.createElement('button');
      x.type = 'button';
      x.className = 'cl-btn';
      x.textContent = text;
      x.setAttribute('aria-label', label);
      x.disabled = !!disabled;
      x.addEventListener('click', fn);
      tools.appendChild(x);
    };
    tb('◀', 'Dịch sang trái', () => move(i, -1), i <= 1);
    tb('▶', 'Dịch sang phải', () => move(i, 1), i >= state.blocks.length - 1);
    tb('× Xóa', 'Xóa khối', () => remove(i), b.t === 'end');
    tb('Xong', 'Bỏ chọn', () => { state.selected = -1; renderProgram(); renderInspector(); });
    head.appendChild(tools);
    box.appendChild(head);
    const f = document.createElement('div');
    f.className = 'cl-ins-fields';
    const kid = state.level === 'kid';
    if (b.t === 'move') {
      f.appendChild(chips('Hướng', Object.entries(DIR).map(([k, v]) => [k, v[0] + ' ' + v[1]]), b.dir, v => (b.dir = v)));
      if (kid) f.appendChild(chips('Tốc độ', [[50, 'Chậm'], [75, 'Vừa'], [100, 'Nhanh']], b.speed, v => (b.speed = v)));
      else f.appendChild(stepper('Tốc độ', b.speed, 10, 100, 10, v => (b.speed = v), ' %'));
      const secs = kid ? [0.5, 1, 2, 3, 4, 5] : [0, 0.25, 0.5, 1, 1.5, 2, 3, 5];
      f.appendChild(chips('Thời gian', secs.map(v => [v, v ? num(v) + ' s' : 'mãi (đi tiếp ngay)']), b.sec, v => (b.sec = v)));
    } else if (b.t === 'motors') {
      f.appendChild(stepper('M1 (bánh trái)', b.m1, -100, 100, 10, v => (b.m1 = v)));
      f.appendChild(stepper('M2 (bánh phải)', b.m2, -100, 100, 10, v => (b.m2 = v)));
    } else if (b.t === 'wait') {
      f.appendChild(chips('Chờ', (kid ? [0.5, 1, 2, 3, 4, 5] : [0.1, 0.25, 0.5, 1, 2, 3, 5]).map(v => [v, num(v) + ' s']), b.sec, v => (b.sec = v)));
    } else if (b.t === 'waitUntil' || b.t === 'if') {
      condFields(b, f);
    } else if (b.t === 'repeat') {
      f.appendChild(stepper('Số lần', b.n, 1, 20, 1, v => (b.n = v)));
    } else if (b.t === 'sound') {
      f.appendChild(chips('Bài', [['A', 'Âm thanh A'], ['B', 'Âm thanh B']], b.tune, v => (b.tune = v)));
    } else if (b.t === 'led') {
      f.appendChild(chips('Màu đèn', [['red', 'đỏ'], ['green', 'xanh lá'], ['blue', 'xanh dương'], ['yellow', 'vàng'], ['off', 'tắt']], b.color, v => (b.color = v)));
    } else {
      f.innerHTML = `<p class="cl-ins-note">${b.t === 'end' ? 'Khối Hết đóng khối Lặp/Nếu. Xóa khối mở thì khối Hết cũng mất theo.' : b.t === 'else' ? 'Các khối sau "Không thì" chạy khi điều kiện của khối Nếu sai.' : 'Khối này không có gì để chỉnh.'}</p>`;
    }
    box.appendChild(f);
  }

  // ---------- Khay ----------
  function renderToolbox() {
    const box = $('toolbox');
    box.innerHTML = '';
    for (const [group, keys] of TOOLBOX[state.level]) {
      const g = document.createElement('div');
      g.className = 'cl-group';
      g.innerHTML = `<span class="cl-group-name">${group}</span>`;
      for (const k of keys) {
        const t = TOOLS[k], first = CL.make(t.add[0]);
        const [icon] = face(first, 0, [first]);
        const b = document.createElement('button');
        b.type = 'button';
        b.className = `cl-tool c-${t.color}`;
        b.innerHTML = `<span class="cl-ico" aria-hidden="true">${icon}</span><span>${t.label}</span>`;
        b.addEventListener('click', () => insert(k));
        g.appendChild(b);
      }
      box.appendChild(g);
    }
  }

  // ---------- Sa bàn & nhiệm vụ ----------
  function renderMission() {
    const m = sim.map, r = m.rules;
    $('map-name').textContent = m.name;
    $('mission-name').textContent = m.name + (m.level === 'pro' ? ' · Lớp 3+' : '') + (m.custom ? ' · do lớp vẽ' : '');
    $('mission-about').textContent = m.about || '';
    const best = store.get('best.' + m.id, 0);
    $('mission-goals').innerHTML = r.free ? '<span class="cl-goal">Sân tự do – không chấm</span>' :
      [`Về đích${m.items.some(i => i.k === 'flag') ? ' (qua đủ cờ)' : ''}`, `Dưới ${r.time} giây`,
        r.star3 === 'noCrash' ? 'Không va chạm' : `Tối đa ${r.blocks} khối`]
        .map((g, i) => `<span class="cl-goal${best > i ? ' is-done' : ''}">★ ${g}</span>`).join('');
  }
  function selectMap(id) {
    stopRun(true);
    state.mapId = id;
    store.set('map', id);
    sim = new CL.Sim(mapById(id));
    bindSim();
    T = V.fit(canvas, sim.map);
    loadProgram();
    if (sim.map.level === 'pro' && state.level === 'kid') msg('Sa bàn này cần khối Lớp 3+ (Chờ đến khi, Nếu). Chuyển cấp ở góc trên.', 'warn');
    else msg('');
    $('result').hidden = true;
    $('log').innerHTML = '';
    renderMission();
    renderProgram();
    renderInspector();
    draw();
  }
  function renderMapGrid() {
    const grid = $('map-grid');
    grid.innerHTML = '';
    for (const m of allMaps()) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cl-map-card' + (m.id === state.mapId ? ' is-on' : '');
      const c = document.createElement('canvas');
      c.width = 240;
      c.height = 150;
      V.drawMap(c.getContext('2d'), m, V.fit(c, m));
      const best = store.get('best.' + m.id, 0);
      b.appendChild(c);
      b.insertAdjacentHTML('beforeend', `<strong>${m.name}</strong><span>${m.level === 'pro' ? 'Lớp 3+' : 'Bé'}${m.custom ? ' · do lớp vẽ' : ''}` +
        `${m.rules.free ? '' : ' · ' + '★'.repeat(best) + '☆'.repeat(3 - best)}</span>`);
      b.addEventListener('click', () => { $('maps-dialog').close(); selectMap(m.id); });
      grid.appendChild(b);
    }
  }

  // ---------- Chạy ----------
  let raf = 0, last = 0;
  function bindSim() {
    sim.onEvent = (type, data) => {
      if (type === 'start') { log('info', 'Bắt đầu chạy chương trình.'); $('result').hidden = true; }
      else if (type === 'bump') log('warn', 'Xe chạm tường!');
      else if (type === 'flag') log('ok', `Lấy được cờ! Còn ${data.left} lá.`);
      else if (type === 'sound') { if (window.SFX) window.SFX.melody(data); log('info', 'Phát âm thanh ' + data + '.'); }
      else if (type === 'led') log('info', 'Bật đèn ' + (data === 'off' ? 'tắt' : V.COLOR_NAME[data]) + '.');
      else if (type === 'programEnd') log('info', 'Hết khối lệnh – động cơ vẫn quay.');
      else if (type === 'paused') msg(data >= 0 ? `Dừng trước khối ${data + 1}. Bấm "Từng khối" để chạy tiếp.` : 'Chương trình đã chạy hết.', '');
      else if (type === 'error') {
        msg(data.text, 'bad');
        state.selected = data.at;
        renderProgram();
        renderInspector();
      } else if (type === 'finish') showResult(data);
    };
  }
  function showResult(r) {
    log(r.ok ? 'ok' : 'warn', r.text);
    if (sim.map.rules.free) { msg(r.text); return; }
    if (r.ok && window.SFX) window.SFX.fanfare();
    else if (window.SFX) window.SFX.buzz();
    const best = store.get('best.' + sim.map.id, 0);
    if (r.stars > best) store.set('best.' + sim.map.id, r.stars);
    store.set('last.' + sim.map.id, r);
    $('result-stars').innerHTML = [0, 1, 2].map(i => `<span class="${i < r.stars ? 'on' : ''}">★</span>`).join('');
    $('result-text').textContent = r.ok ? 'Tới đích rồi!' : r.text;
    $('result-sub').textContent = `Thời gian ${num(r.t)} s · ${r.blocks} khối · ${r.bumps} lần va chạm`;
    $('btn-next-map').hidden = !r.ok;
    $('result').hidden = false;
    renderMission();
  }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * state.speed;
    last = now;
    sim.tick(dt);
    draw();
    setActive(sim.active);
    if (sim.running && !sim.paused) raf = requestAnimationFrame(frame);
    else { raf = 0; updateRunButton(); }
  }
  function loop() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
    updateRunButton();
  }
  function run() {
    if (sim.running && !sim.paused) { stopRun(); return; }
    if (window.SFX) window.SFX.init();
    if (sim.running && sim.paused) { sim.resume(); msg(''); loop(); return; }
    sim.setProgram(state.blocks);
    msg('');
    if (sim.start()) loop();
    updateRunButton();
  }
  function step() {
    if (window.SFX) window.SFX.init();
    if (!sim.running) sim.setProgram(state.blocks);
    sim.stepOnce();
    if (sim.running) loop();
  }
  function stopRun(silent) {
    cancelAnimationFrame(raf);
    raf = 0;
    if (sim.running) {
      sim.stop();
      if (!silent) log('info', 'Đã dừng.');
    }
    setActive(-1);
    updateRunButton();
  }
  function updateRunButton() {
    const b = $('btn-run');
    const going = sim.running && !sim.paused;
    b.textContent = going ? '■ Dừng' : sim.running ? '▶ Chạy tiếp' : '▶ Chạy';
    b.classList.toggle('is-stop', going);
  }
  function draw() {
    V.drawSim(ctx, sim, T);
    const v = sim.sensors();
    $('s-m1').textContent = v.m1;
    $('s-m2').textContent = v.m2;
    $('s-dist').textContent = v.dist === null ? 'không thấy' : num(v.dist.toFixed(0)) + ' cm';
    $('s-dist').dataset.near = v.dist !== null && v.dist < 25;
    $('s-touch').textContent = v.touch ? '● được nhấn' : '○';
    $('s-line').textContent = `${v.lineL ? '●' : '○'} ${v.lineR ? '●' : '○'}`;
    $('s-color').textContent = V.COLOR_NAME[v.color] || v.color;
    $('s-time').textContent = num(sim.t.toFixed(1)) + ' s';
    $('s-bumps').textContent = sim.bumps;
  }

  // ---------- Lưu / chia sẻ ----------
  function student() {
    try { const s = JSON.parse(sessionStorage.getItem('happy-student-session') || 'null'); if (s && s.nickname) return s.nickname; } catch { /* không có phiên */ }
    return 'Học sinh (máy này)';
  }
  function fileAction(act) {
    $('file-menu').hidden = true;
    if (act === 'export') {
      const data = { v: 1, map: state.mapId, level: state.level, blocks: state.blocks };
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
      a.download = `chuong-trinh-${state.mapId}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Đã tải chương trình về máy.');
    } else if (act === 'import') $('file-input').click();
    else if (act === 'send') {
      const r = store.get('last.' + state.mapId, null);
      const sent = store.get('sent', []);
      sent.unshift({ who: student(), map: sim.map.name, stars: r ? r.stars : 0, t: r ? r.t : null, blocks: CL.countBlocks(state.blocks), at: new Date().toLocaleString('vi-VN') });
      store.set('sent', sent.slice(0, 50));
      toast('Đã gửi cho lớp (dữ liệu mẫu – chưa lưu lên máy chủ).');
    } else if (act === 'sent') {
      const demo = [
        { who: 'Minh Anh', map: 'Về đích', stars: 3, t: 3.1, blocks: 3, at: 'mẫu' },
        { who: 'Gia Bảo', map: 'Thu cờ hình vuông', stars: 2, t: 24.6, blocks: 9, at: 'mẫu' },
        { who: 'Khánh Linh', map: 'Dừng trước tường', stars: 1, t: 9.8, blocks: 5, at: 'mẫu' }
      ];
      $('sent-rows').innerHTML = [...store.get('sent', []), ...demo].map(s =>
        `<tr><td>${esc(s.who)}</td><td>${esc(s.map)}</td><td>${'★'.repeat(s.stars)}${'☆'.repeat(3 - s.stars)}</td><td>${s.t === null ? '–' : num(s.t) + ' s'}</td><td>${s.blocks}</td><td>${esc(s.at)}</td></tr>`).join('');
      $('sent-dialog').showModal();
    }
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  $('file-input').addEventListener('change', async e => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!Array.isArray(data.blocks) || !CL.check(data.blocks).ok) throw new Error('bad');
      if (data.level) setLevel(data.level, true);
      if (data.map && allMaps().some(m => m.id === data.map)) selectMap(data.map);
      state.blocks = data.blocks;
      changed();
      toast('Đã mở chương trình.');
    } catch {
      toast('File không phải chương trình của Phòng lập trình.');
    }
  });

  function setLevel(level, quiet) {
    state.level = level;
    store.set('level', level);
    document.querySelectorAll('[data-level]').forEach(b => b.classList.toggle('is-on', b.dataset.level === level));
    document.documentElement.dataset.level = level;
    if (quiet) return;
    stopRun(true);
    loadProgram();
    renderToolbox();
    renderProgram();
    renderInspector();
    draw();
  }

  // ---------- Nối nút ----------
  $('btn-run').addEventListener('click', run);
  $('btn-step').addEventListener('click', step);
  $('btn-reset').addEventListener('click', () => { stopRun(true); sim.reset(); $('result').hidden = true; msg(''); draw(); });
  $('btn-again').addEventListener('click', () => { $('result').hidden = true; run(); });
  $('btn-next-map').addEventListener('click', () => {
    const list = allMaps(), i = list.findIndex(m => m.id === state.mapId);
    selectMap(list[(i + 1) % list.length].id);
  });
  $('btn-hint').addEventListener('click', () => {
    if (!sim.map.hint) { toast('Sa bàn này chưa có gợi ý.'); return; }
    if (state.blocks.length > 1 && !confirm('Thay chương trình đang ghép bằng chương trình gợi ý?')) return;
    if (sim.map.level === 'pro' && state.level === 'kid') setLevel('pro');
    state.blocks = sim.map.hint.map(CL.make);
    state.selected = -1;
    changed();
  });
  $('btn-clear').addEventListener('click', () => {
    if (state.blocks.length > 1 && !confirm('Xóa hết các khối?')) return;
    state.blocks = [CL.make('start')];
    state.selected = -1;
    changed();
  });
  document.querySelectorAll('[data-level]').forEach(b => b.addEventListener('click', () => setLevel(b.dataset.level)));
  document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click', () => {
    state.speed = +b.dataset.speed;
    document.querySelectorAll('[data-speed]').forEach(x => x.classList.toggle('is-on', x === b));
  }));
  $('btn-maps').addEventListener('click', () => { renderMapGrid(); $('maps-dialog').showModal(); });
  $('btn-file').addEventListener('click', e => { e.stopPropagation(); $('file-menu').hidden = !$('file-menu').hidden; });
  $('file-menu').addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (a) fileAction(a.dataset.act); });
  document.addEventListener('click', e => { if (!e.target.closest('#file-menu')) $('file-menu').hidden = true; });
  document.addEventListener('keydown', e => {
    if (e.target.closest('input, select, textarea, dialog')) return;
    if (e.key === 'Delete' && state.selected > 0) remove(state.selected);
    if (e.key === 'Escape') { state.selected = -1; renderProgram(); renderInspector(); }
  });
  $('btn-editor').addEventListener('click', () => window.CodeLabEditor.open(saved => {
    const maps = store.get('maps', []).filter(m => m.id !== saved.id);
    maps.push(saved);
    store.set('maps', maps);
    selectMap(saved.id);
    toast('Đã lưu sa bàn – thử chạy xe nhé!');
  }));
  window.addEventListener('resize', draw);

  // ---------- Khởi động ----------
  setLevel(state.level, true);
  bindSim();
  selectMap(mapById(state.mapId).id);
  renderToolbox();
  window.codeLab = { get sim() { return sim; }, state, selectMap, setLevel, run, step };
})();
