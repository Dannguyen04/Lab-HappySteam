// Xưởng sáng tạo Bài 9 (góp ý của thầy: "sáng tạo thêm từ mô hình 3D đã có hôm đó").
// Học sinh chọn gói gợi ý hoặc tự gắn chi tiết vào các vị trí trên mô hình vệ tinh hoàn chỉnh; chi tiết mới hiện
// ngay trong trình xem 3D (window.robotViewer.setCreative) và các tính năng được đưa sang sa bàn ở Tab 2.
// Vị trí gắn tính từ chính dữ liệu 3D (khung cánh pin, tâm đầu vệ tinh, hướng cột anten, khung chữ H) –
// là hình minh họa ý tưởng; các chốt nối nhỏ không vẽ.
(function () {
  'use strict';

  const STORE = 'zm9.creative';
  // Số lượng trong hộp kit ZM Alpha 330 (set2321A, theo thư viện RoboBuilder)
  const KIT = { 'BP-3976': 2, 'BP-7011': 15, 'BP-7045': 2, 'BP-3992': 2, 'BP-7023': 6, 'BP-7012': 40, sensor: 1 };
  const NAMES = {
    'BP-3976': 'Khung 5×7 (cánh pin)',
    'BP-7011': 'Chốt dài xanh dương',
    'BP-7045': 'Bánh răng 40 răng (làm chảo)',
    'BP-3992': 'Trục 5',
    'BP-7023': 'Bạc chặn trục',
    'BP-7012': 'Chốt đen',
    sensor: 'Mô-đun cảm biến trong kit'
  };
  const FEATURES = {
    solar: { icon: '⚡', text: 'Pin mặt trời kép: thêm năng lượng cho vệ tinh' },
    radar: { icon: '📡', text: 'Chảo ra-đa: bắt sóng trạm mặt đất xa hơn' },
    sensor: { icon: '🛡️', text: 'Cảm biến: phát hiện thiên thạch, dùng được khối "Chờ vật cản"' }
  };
  // Vị trí gắn và lựa chọn. parts: linh kiện thật cần lấy thêm; feature: tính năng mở ở sa bàn
  const SLOTS = [
    {
      id: 'wingL',
      name: 'Đầu cánh pin bên trái',
      options: [{ id: 'frame', label: 'Khung 5×7', parts: { 'BP-3976': 1, 'BP-7011': 2 }, feature: 'solar' }]
    },
    {
      id: 'wingR',
      name: 'Đầu cánh pin bên phải',
      options: [{ id: 'frame', label: 'Khung 5×7', parts: { 'BP-3976': 1, 'BP-7011': 2 }, feature: 'solar' }]
    },
    {
      id: 'head',
      name: 'Mặt ngoài đầu vệ tinh',
      options: [
        { id: 'dish', label: 'Chảo ra-đa', parts: { 'BP-7045': 1, 'BP-3992': 1, 'BP-7023': 1 }, feature: 'radar' },
        { id: 'sensor', label: 'Cảm biến', parts: { sensor: 1, 'BP-7012': 2 }, feature: 'sensor' }
      ]
    },
    {
      id: 'front',
      name: 'Phía trước thân',
      options: [{ id: 'sensor', label: 'Cảm biến', parts: { sensor: 1, 'BP-7012': 2 }, feature: 'sensor' }]
    }
  ];
  const PRESETS = [
    {
      id: 'solar',
      icon: '⚡',
      title: 'Cánh pin kép',
      text: 'Thêm 2 khung 5×7 nối dài hai cánh pin mặt trời.',
      pick: { wingL: 'frame', wingR: 'frame' }
    },
    {
      id: 'radar',
      icon: '📡',
      title: 'Chảo ra-đa',
      text: 'Bánh răng 40 răng làm chảo thu sóng trên đầu vệ tinh.',
      pick: { head: 'dish' }
    },
    {
      id: 'sensor',
      icon: '🛡️',
      title: 'Cảm biến né thiên thạch',
      text: 'Gắn mô-đun cảm biến phía trước để phát hiện vật cản.',
      pick: { front: 'sensor' }
    }
  ];

  // ---------- hình học (ma trận cột 3×3 như trình xem) ----------
  const add = (a, b) => a.map((v, k) => v + b[k]);
  const sub = (a, b) => a.map((v, k) => v - b[k]);
  const scale = (a, s) => a.map(v => v * s);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => scale(a, 1 / (Math.hypot(...a) || 1));
  const col = (R, k) => [R[k * 3], R[k * 3 + 1], R[k * 3 + 2]];
  const fromCols = (a, b, c) => [...a, ...b, ...c];
  function matMul(A, B) {
    const out = new Array(9).fill(0);
    for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) out[c * 3 + r] += A[k * 3 + r] * B[c * 3 + k];
    return out;
  }
  // Phép quay đưa vectơ đơn vị a về b (Rodrigues)
  function rotateTo(a, b) {
    const v = cross(a, b),
      c = dot(a, b);
    if (c < -0.9999) {
      const axis = norm(Math.abs(a[0]) < 0.9 ? cross(a, [1, 0, 0]) : cross(a, [0, 1, 0]));
      return fromCols(...[0, 1, 2].map(i => [0, 1, 2].map(j => 2 * axis[i] * axis[j] - (i === j ? 1 : 0))));
    }
    const k = 1 / (1 + c),
      M = [0, -v[2], v[1], v[2], 0, -v[0], -v[1], v[0], 0]; // hàng
    const R = [];
    for (let r = 0; r < 3; r++)
      for (let cc = 0; cc < 3; cc++) {
        let s = (r === cc ? 1 : 0) + M[r * 3 + cc];
        for (let t = 0; t < 3; t++) s += k * M[r * 3 + t] * M[t * 3 + cc];
        R.push(s);
      }
    // R đang theo hàng → đổi sang cột
    return [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]];
  }
  // Nửa bề dày của nhóm linh kiện theo hướng d tính từ điểm c (dùng 8 góc hộp lưới của từng linh kiện)
  function reach(DATA, list, d, c) {
    let best = 0;
    for (const p of list)
      for (const id of p.meshes) {
        const m = DATA.meshes[id];
        for (let mask = 0; mask < 8; mask++) {
          const corner = [0, 1, 2].map(i => (mask & (1 << i) ? m.hi[i] : m.lo[i]));
          const w = add(window.robotViewer.rotate(p.rotation, corner), p.pos);
          best = Math.max(best, dot(sub(w, c), d));
        }
      }
    return best;
  }

  // Tính các mẫu linh kiện gắn thêm từ mô hình: { 'wingL:frame': [instance…], … }
  function buildPlacements(DATA) {
    const V = window.robotViewer,
      all = DATA.instances,
      by = name => all.filter(p => p.name === name),
      head = all.filter(p => p.groupPath === 'Main/Head'),
      base = all.filter(p => p.groupPath === 'Main'),
      headC = V.box(head).center;
    const make = (src, pos, rotation, meshes) => ({
      name: src ? src.name : 'sensor',
      colorCode: src ? src.colorCode : null,
      meshes: meshes || src.meshes,
      rotation: rotation || src.rotation,
      pos,
      step: DATA.steps,
      groupPath: 'Main',
      joins: [],
      extra: true
    });
    const out = {};
    // Chi tiết gắn trên đầu vệ tinh quay cùng cột anten trong sa bàn (bộ truyền 'output' của trình xem)
    const onHead = list => list.map(p => ({ ...p, drive: 'output' }));

    // Cánh pin: khung mới nối tiếp ngay phía ngoài khung cũ
    const frames = by('BP-3976')
      .map(f => ({ f, c: V.box([f]).center }))
      .sort((a, b) => a.c[0] - b.c[0]);
    frames.forEach(({ f, c }, i) => {
      const d = norm(sub(c, headC)),
        width = reach(DATA, [f], d, c) + reach(DATA, [f], scale(d, -1), c);
      out[(i === 0 ? 'wingL' : 'wingR') + ':frame'] = onHead([make(f, add(f.pos, scale(d, width)))]);
    });

    // Hướng cột anten đi vào đầu vệ tinh: trục 5 trên cùng (trục dài theo cột 0 của ma trận)
    const mast = by('BP-3992')[0];
    let n = norm(col(mast.rotation, 0));
    if (dot(n, sub(headC, mast.pos)) < 0) n = scale(n, -1);
    const face = add(headC, scale(n, reach(DATA, head, n, headC) + 0.002));
    // Chảo ra-đa: trục 5 + bạc chặn + bánh răng 40 răng, cùng hướng n
    const gear = by('BP-7045')[0],
      bush = by('BP-7023')[0];
    const gearAxis = [0, 1, 2].reduce((a, b) => (Math.abs(gear.rotation[b * 3 + 1]) > Math.abs(gear.rotation[a * 3 + 1]) ? b : a));
    const up = col(gear.rotation, gearAxis)[1] > 0 ? [0, 1, 0] : [0, -1, 0];
    const turn = rotateTo(up, n),
      axleRot = rotateTo([1, 0, 0], n);
    out['head:dish'] = onHead([
      make(mast, add(face, scale(n, 0.025)), matMul(axleRot, [1, 0, 0, 0, 1, 0, 0, 0, 1])),
      make(bush, add(face, scale(n, 0.008)), matMul(turn, bush.rotation)),
      make(gear, add(face, scale(n, 0.03)), matMul(turn, gear.rotation))
    ]);
    // Cảm biến minh họa: khối 30 mm, mắt đọc theo +Z cục bộ
    const sensorMeshes = DATA.creative && DATA.creative.sensor;
    if (sensorMeshes) {
      out['head:sensor'] = onHead([make(null, face, rotateTo([0, 1, 0], n), sensorMeshes)]);
      const hframe = by('BP-7620')[0],
        hb = V.box([hframe]).center,
        bc = V.box(base).center;
      let f = sub(hb, bc);
      f[1] = 0;
      f = norm(f);
      const top = hb[1] + reach(DATA, [hframe], [0, 1, 0], hb);
      const theta = Math.atan2(f[0], f[2]),
        c = Math.cos(theta),
        s = Math.sin(theta);
      out['front:sensor'] = [make(null, [hb[0], top, hb[2]], [c, 0, -s, 0, 1, 0, s, 0, c], sensorMeshes)];
    }
    return out;
  }

  // ---------- trạng thái & giao diện ----------
  let choice = {};
  try {
    choice = JSON.parse(localStorage.getItem(STORE) || '{}') || {};
  } catch (e) {}
  let placements = null,
    isOpen = false;
  const shown = new Map(); // khóa 'slot:option' → mảng instance đang hiện (giữ addedAt)

  const $ = id => document.getElementById(id);
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  const optionOf = slot => slot.options.find(o => o.id === choice[slot.id]);

  function features() {
    const set = new Set();
    for (const slot of SLOTS) {
      const o = optionOf(slot);
      if (o && o.feature) set.add(o.feature);
    }
    return [...set];
  }
  function bom(DATA) {
    const need = {};
    for (const slot of SLOTS) {
      const o = optionOf(slot);
      if (o) for (const [code, n] of Object.entries(o.parts)) need[code] = (need[code] || 0) + n;
    }
    return Object.entries(need).map(([code, n]) => {
      const used = DATA.instances.filter(p => p.name === code).length,
        free = Math.max(0, (KIT[code] || 0) - used);
      return { code, n, free, short: Math.max(0, n - free) };
    });
  }

  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify(choice));
    } catch (e) {}
  }
  function sync(animateNew) {
    const DATA = window.LESSON_3D_DATA;
    renderPanel(DATA);
    if (!isOpen || !placements) return;
    const now = performance.now(),
      extras = [];
    for (const slot of SLOTS) {
      const key = slot.id + ':' + choice[slot.id];
      const list = placements[key];
      if (!list) continue;
      if (!shown.has(key)) shown.set(key, list.map(p => ({ ...p, addedAt: animateNew ? now : 0 })));
      extras.push(...shown.get(key));
    }
    for (const key of [...shown.keys()]) if (!SLOTS.some(s => s.id + ':' + choice[s.id] === key)) shown.delete(key);
    window.robotViewer.setCreative(extras);
  }
  function pick(slotId, optionId) {
    choice[slotId] = choice[slotId] === optionId ? undefined : optionId;
    if (!choice[slotId]) delete choice[slotId];
    save();
    if (window.SFX) window.SFX.click();
    sync(true);
  }

  function renderPanel(DATA) {
    const presets = $('creative-presets'),
      slots = $('creative-slots'),
      table = $('creative-bom'),
      feats = $('creative-features');
    if (!presets) return;
    presets.replaceChildren(
      ...PRESETS.map(p => {
        const on = Object.entries(p.pick).every(([s, o]) => choice[s] === o);
        const b = el('button', 'creative-preset' + (on ? ' on' : ''));
        b.type = 'button';
        b.dataset.preset = p.id;
        b.setAttribute('aria-pressed', on);
        b.append(el('span', 'cp-icon', p.icon), el('b', null, p.title), el('small', null, p.text));
        b.onclick = () => {
          for (const [s, o] of Object.entries(p.pick)) choice[s] = on ? undefined : o;
          for (const k of Object.keys(choice)) if (!choice[k]) delete choice[k];
          save();
          if (window.SFX) window.SFX.click();
          sync(true);
        };
        return b;
      })
    );
    slots.replaceChildren(
      ...SLOTS.map(slot => {
        const row = el('div', 'creative-slot');
        row.append(el('span', 'cs-name', slot.name));
        const opts = el('div', 'cs-opts');
        for (const o of slot.options) {
          const on = choice[slot.id] === o.id;
          const b = el('button', 'cs-opt' + (on ? ' on' : ''), (on ? '✓ ' : '+ ') + o.label);
          b.type = 'button';
          b.dataset.slot = slot.id;
          b.dataset.option = o.id;
          b.setAttribute('aria-pressed', on);
          b.onclick = () => pick(slot.id, o.id);
          opts.append(b);
        }
        row.append(opts);
        return row;
      })
    );
    const rows = bom(DATA);
    table.replaceChildren();
    if (!rows.length) {
      const tr = el('tr');
      const td = el('td', 'cb-empty', 'Chưa gắn chi tiết nào. Chọn một gói gợi ý hoặc bấm "+" ở vị trí muốn gắn.');
      td.colSpan = 3;
      tr.append(td);
      table.append(tr);
    } else {
      const head = el('tr');
      head.append(el('th', null, 'Linh kiện'), el('th', null, 'Cần'), el('th', null, 'Kit còn'));
      table.append(head);
      for (const r of rows) {
        const tr = el('tr', r.short ? 'short' : '');
        const name = el('td');
        name.append(el('span', null, NAMES[r.code] || r.code));
        if (r.code !== 'sensor') name.append(el('code', null, r.code));
        tr.append(name, el('td', null, r.n + '×'), el('td', null, r.free + (r.short ? ` · thiếu ${r.short}` : ' ✓')));
        table.append(tr);
      }
    }
    const short = rows.filter(r => r.short);
    $('creative-short').hidden = !short.length;
    $('creative-short').textContent = short.length
      ? '⚠ Hộp kit của nhóm không đủ: ' +
        short.map(r => `${NAMES[r.code] || r.code} thiếu ${r.short}`).join(', ') +
        '. Hãy hỏi mượn nhóm khác hoặc thay bằng chi tiết tương tự.'
      : '';
    const fs = features();
    feats.replaceChildren(
      ...(fs.length
        ? fs.map(f => el('li', null, FEATURES[f].icon + ' ' + FEATURES[f].text))
        : [el('li', 'muted', 'Vệ tinh cơ bản – chưa có tính năng mới.')])
    );
    $('creative-count').textContent = rows.reduce((s, r) => s + r.n, 0);
  }

  // Mở/đóng xưởng: chuyển trình xem 3D vào khung của xưởng và bật chế độ sáng tạo
  function whenViewer(cb, tries = 0) {
    if (window.robotViewer && window.robotViewer.setCreative) cb();
    else if (tries < 200) setTimeout(() => whenViewer(cb, tries + 1), 100);
  }
  function open() {
    isOpen = true;
    const stage = $('creative-stage'),
      app = $('app');
    if (stage && app && app.parentElement !== stage) stage.append(app);
    whenViewer(() => {
      if (!isOpen) return;
      if (!placements) placements = buildPlacements(window.LESSON_3D_DATA);
      sync(false);
      window.dispatchEvent(new Event('resize'));
    });
  }
  function close() {
    if (!isOpen) return;
    isOpen = false;
    const home = $('subview-base'),
      app = $('app');
    if (home && app && app.parentElement !== home) home.prepend(app);
    shown.clear();
    if (window.robotViewer && window.robotViewer.setCreative) window.robotViewer.setCreative(null);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!$('creative-presets')) return;
    renderPanel(window.LESSON_3D_DATA);
    $('creative-reset').onclick = () => {
      choice = {};
      save();
      sync(false);
    };
    $('creative-deploy').onclick = () => {
      deployed = extras();
      if (window.simEngine) window.simEngine.setUpgrades(features());
      if (window.SFX) window.SFX.ding();
      document.querySelector('.nav-tab-btn[data-tab="tab-simulation"]')?.click();
    };
  });

  // Chi tiết đang chọn (không hoạt ảnh) để sa bàn hiện đúng vệ tinh của học sinh
  function extras() {
    if (!placements && window.robotViewer && window.robotViewer.box) placements = buildPlacements(window.LESSON_3D_DATA);
    if (!placements) return [];
    return SLOTS.flatMap(slot => placements[slot.id + ':' + choice[slot.id]] || []);
  }
  // Vệ tinh đã đưa vào sa bàn (chụp lúc bấm "Thử trong sa bàn")
  let deployed = [];
  window.ZMCreative = { open, close, features, extras, deployed: () => deployed, choice: () => ({ ...choice }) };
})();
