// Cấu hình Lớp 3 · Bài 10 – Robot thám hiểm sao Hỏa (xe 1 động cơ + cảm biến sóng âm). Phần dùng chung đọc window.LESSON;
// phần riêng của bài là js/lop3-bai10/rover-engine.js + rover-scene.js (+ art.js do công cụ vẽ cung cấp, nếu có).
// Động cơ cho xe chạy tới/lùi; cảm biến sóng âm đo khoảng cách tới tảng đá. Trong DATA.drive: 'output' = bánh xe quay theo quãng đường.
(function () {
  'use strict';

  // Số lượng trong hộp kit ZM Alpha 330 (set2321A)
  const KIT = { 'BP-8813': 2, 'BP-3990': 5, 'BP-7012': 40, 'BP-7024': 6 };
  const NAMES = {
    'BP-8813': 'Khối 3 cánh (đĩa ăng-ten)',
    'BP-3990': 'Trục 2',
    'BP-7012': 'Chốt đen (gai bánh)',
    'BP-7024': 'Bạc nửa vàng (đèn)'
  };
  const FEATURES = {
    dish: { text: 'Ăng-ten: cảm biến dò xa gấp đôi, thấy tảng đá sớm hơn' },
    lamp: { text: 'Đèn pha: vẫn nhìn thấy đá khi có bão bụi (Nâng cao)' },
    wheels: { text: 'Bánh gai: chạy trong bão bụi lâu gấp đôi mới bị lún cát (Nâng cao)' }
  };
  const SLOTS = [
    { id: 'top', name: 'Trên thân xe', options: [{ id: 'dish', label: 'Ăng-ten', parts: { 'BP-8813': 1, 'BP-3990': 1 }, feature: 'dish' }] },
    { id: 'front', name: 'Phía trước', options: [{ id: 'lamp', label: 'Đèn pha', parts: { 'BP-7024': 2, 'BP-3990': 1 }, feature: 'lamp' }] },
    { id: 'wheel', name: 'Quanh bánh xe', options: [{ id: 'wheels', label: 'Bánh gai', parts: { 'BP-7012': 8 }, feature: 'wheels' }] }
  ];
  const PRESETS = [
    { id: 'dish', title: 'Ăng-ten', text: 'Dò xa hơn để thấy đá sớm.', pick: { top: 'dish' } },
    { id: 'lamp', title: 'Đèn pha', text: 'Soi đường khi bão bụi che mắt.', pick: { front: 'lamp' } },
    { id: 'wheels', title: 'Bánh gai', text: 'Bám cát, không bị lún khi gặp bão.', pick: { wheel: 'wheels' } }
  ];
  // Hình gói: lấy từ js/lop3-bai10/art.js (MarsArt.PICS) khi có; tạm dùng hình đơn giản
  const rover = extra =>
    `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="12" y="18" width="40" height="16" rx="4" fill="#fff" stroke="#1e2a34" stroke-width="1.6"/><rect x="14" y="14" width="14" height="8" rx="2" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6"/><circle cx="20" cy="36" r="7" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6"/><circle cx="46" cy="36" r="7" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6"/>${extra}</svg>`;
  const FALLBACK_PICS = {
    dish: rover('<path d="M40 18v-8M32 8a8 6 0 0 0 16 0z" fill="#fff" stroke="#e53935" stroke-width="2"/>'),
    lamp: rover('<path d="M52 24l10-6v14l-10-6z" fill="#ffd23f" opacity=".8"/><circle cx="52" cy="26" r="3" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>'),
    wheels: rover('<path d="M13 30l-3-3M13 42l-3 3M27 30l3-3M27 42l3 3M39 30l-3-3M39 42l-3 3M53 30l3-3M53 42l3 3" stroke="#1e2a34" stroke-width="2.4" stroke-linecap="round"/>')
  };
  const PICS = new Proxy({}, { get: (_, k) => (window.MarsArt && window.MarsArt.PICS && window.MarsArt.PICS[k]) || FALLBACK_PICS[k] });

  // Chi tiết sáng tạo minh họa bằng mesh linh kiện kit; bố trí theo thân xe và vị trí hai bánh.
  // Phía trước được xác định theo cảm biến siêu âm, không phụ thuộc chiều CAD ban đầu.
  function placements(DATA, H) {
    const { add, sub, scale, norm, make, box } = H;
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const all = DATA.instances;
    const body = box(all);
    const labelOf = p => ((DATA.labels && DATA.labels.names && DATA.labels.names[p.name]) || '').toLowerCase();
    const sensor = all.filter(p => /sóng âm|siêu âm/.test(labelOf(p)));
    let fwd = [0, 0, 1];
    if (sensor.length) {
      const f = sub(box(sensor).center, body.center);
      f[1] = 0;
      if (Math.hypot(f[0], f[2]) > 1e-6) fwd = norm(f);
    }
    const half = Math.abs(fwd[0]) * (body.hi[0] - body.lo[0]) / 2 + Math.abs(fwd[2]) * (body.hi[2] - body.lo[2]) / 2;
    const c = DATA.creative || {};
    const part = (key, mesh, pos) => Number.isInteger(mesh) ? make(null, pos, I, [mesh], key) : null;
    // Ăng-ten: trục đỏ đỡ đĩa trắng, nhô lên trên cảm biến.
    const top = [body.center[0], body.hi[1], body.center[2]];
    const dish = c.dish && c.dish.length === 2 ? [
      part('dish', c.dish[1], add(top, [0, 0.014, 0])),
      part('dish', c.dish[0], add(top, [0, 0.041, 0]))
    ] : [];
    // Hai bạc nửa màu vàng ở phía trước mô phỏng cặp đèn pha.
    const front = add(body.center, scale(fwd, half + 0.015));
    front[1] = body.center[1];
    const across = norm([fwd[2], 0, -fwd[0]]);
    const lamp = c.lamp && c.lamp.length ? [-1, 1].map(side =>
      part('lamp', c.lamp[0], add(front, scale(across, side * 0.020)))) : [];
    // Mỗi bánh thêm bốn chốt đen quanh vòng lốp, ở mặt ngoài bánh.
    const wheels = [];
    if (c.wheels && c.wheels.length) for (const wheel of all.filter(p => p.name === 'BP-8850')) {
      const center = box([wheel]).center;
      const side = center[0] < body.center[0] ? -1 : 1;
      for (const a of [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4]) {
        wheels.push(part('wheels', c.wheels[0], [
          center[0] + side * 0.010, center[1] + Math.sin(a) * 0.021, center[2] + Math.cos(a) * 0.021
        ]));
      }
    }
    return {
      'top:dish': dish,
      'front:lamp': lamp,
      'wheel:wheels': wheels
    };
  }

  window.LESSON = {
    id: 'lop3-bai10',
    label: 'Bài 10',
    code: 'ZM3-10',
    sheetName: 'Lớp 3 · Bài 10: Robot thám hiểm sao Hỏa',
    store: 'zm3b10_',
    baseName: 'Robot thám hiểm sao Hỏa',
    Engine: 'RoverEngine',
    defaultMode: 'pro', // Lớp 3: mở ở chế độ Nâng cao (hiện số liệu, tính toán, thử thách bão bụi)

    book(d) {
      const src = `js/lop3-bai10/book/page-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Trang ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.step} · trang ${d.page}`,
        cap: d.step === d.total ? 'Robot thám hiểm sao Hỏa đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
        pdf: src
      };
    },

    missions: { core: ['m1', 'm2', 'm3', 'm4'], pro: ['m5'] },
    cards: {
      m1: { n: 1, title: 'Lắp xong robot', text: 'Bấm “Đã lắp xong bước này” ở cả 15 bước của chặng Lắp ráp.', go: ['assembly', 'Đến chặng lắp ráp'] },
      m2: { n: 2, title: 'Ghép khối giống hàng mẫu', text: 'Ghép đúng chương trình mẫu: Start, Repeat, động cơ chậm, chờ vật cản (cảm biến sóng âm), dừng, chờ 3 giây, Repeat End. Chạy hết một vòng lặp.' },
      m3: { n: 3, title: 'Thu 3 mẫu đá sao Hỏa', text: 'Cho xe tiến tới, dừng cách tảng đá 3–15 cm (không được đâm vào đá) và đứng yên 2 giây để lấy mẫu. Thu đủ 3 mẫu!' },
      m4: { n: 4, title: 'Thử robot sáng tạo', text: 'Gắn thêm chi tiết ở chặng Sáng tạo, rồi quay lại chạy chương trình.', go: ['creative', 'Đến xưởng sáng tạo'] },
      m5: { n: 5, title: 'Thám hiểm trong bão bụi', text: 'Bão bụi nổi lên theo giờ: cảm biến bị mù và xe chạy sẽ lún cát. Hãy cho xe đứng yên chờ bão tan rồi mới thu đủ 3 mẫu.' }
    },
    cardOrder: { kid: ['m2', 'm3', 'm4', 'm1'], pro: ['m2', 'm3', 'm4', 'm5', 'm1'] },

    // Chương trình mẫu: Start, Repeat, động cơ chậm, chờ vật cản (cảm biến sóng âm), Stop, Wait 3s, Repeat End
    blocks: {
      toolbox: ['lowSpeed', 'mediumSpeed', 'motorReverse', 'obstacle', 'motorStop', 'wait', 'melodyA'],
      pro: [],
      sample: ['start', 'repeatStart', 'lowSpeed', 'obstacle', 'motorStop', ['wait', { duration: 3 }], 'repeatEnd'],
      empty: ['start', 'repeatStart', 'repeatEnd']
    },

    details(t) {
      const out = [];
      if (t.state.best) out.push(`Thu đủ 3 mẫu sau ${t.state.best.secs} giây`);
      if (t.state.upgrades && t.state.upgrades.length) out.push('Gói nâng cấp: ' + t.state.upgrades.join(', '));
      return out.join(' · ');
    },

    creative: {
      store: 'zm3b10.creative',
      kit: KIT,
      names: NAMES,
      features: FEATURES,
      slots: SLOTS,
      pics: PICS,
      presets: PRESETS,
      emptyText: 'Robot cơ bản – chưa có tính năng mới.',
      placements
    }
  };
})();
