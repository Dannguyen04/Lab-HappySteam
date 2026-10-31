// Cấu hình Lớp 1 · Bài 10 – Bạn gió tinh nghịch, gió ở đâu (cối xoay gió). Phần dùng chung đọc window.LESSON;
// phần riêng của bài là js/bai10/wind-engine.js + wind-scene.js (+ art.js do công cụ vẽ cung cấp).
(function () {
  'use strict';

  // Số lượng trong hộp kit ZM Alpha 330 (set2321A)
  const KIT = { 'BP-7525A': 4, 'BP-7012': 40, 'BP-8813': 2, 'BP-7013': 10, 'BP-3990': 5, 'BP-7027': 4, 'BP-7024': 6, 'BP-3976': 2, 'BP-3993': 3 };
  const NAMES = {
    'BP-7525A': 'Thanh 7 lỗ (cánh quạt)',
    'BP-7012': 'Chốt đen',
    'BP-8813': 'Khối 3 cánh',
    'BP-7013': 'Chốt trục xanh dương',
    'BP-3990': 'Trục 2',
    'BP-7027': 'Khớp góc',
    'BP-7024': 'Bạc nửa (đèn)',
    'BP-3976': 'Khung 5×7 (đuôi lái gió)',
    'BP-3993': 'Trục 7'
  };
  const FEATURES = {
    long: { text: 'Cánh dài hơn: hứng nhiều gió, sạc pin nhanh hơn 40%' },
    more: { text: '6 cánh: thêm cánh, sạc pin nhanh hơn 30%' },
    light: { text: 'Đèn trên đỉnh: báo cho máy bay thấy cối xoay gió ban đêm' },
    tail: { text: 'Đuôi lái gió: giữ cánh quạt luôn đón gió' }
  };
  const SLOTS = [
    { id: 'blades', name: 'Đầu các cánh quạt', options: [{ id: 'long', label: 'Cánh dài hơn', parts: { 'BP-7525A': 3, 'BP-7012': 6 }, feature: 'long' }] },
    { id: 'hub', name: 'Bầu cánh quạt', options: [{ id: 'more', label: 'Thêm 3 cánh', parts: { 'BP-8813': 1, 'BP-7525A': 3, 'BP-7013': 3 }, feature: 'more' }] },
    { id: 'top', name: 'Đỉnh động cơ', options: [{ id: 'light', label: 'Đèn đỏ', parts: { 'BP-3993': 1, 'BP-7024': 1 }, feature: 'light' }] },
    { id: 'back', name: 'Phía sau động cơ', options: [{ id: 'tail', label: 'Đuôi lái gió', parts: { 'BP-3976': 1, 'BP-7027': 1, 'BP-7012': 2 }, feature: 'tail' }] }
  ];
  const PRESETS = [
    { id: 'long', title: 'Cánh quạt dài hơn', text: 'Nối dài 3 cánh quạt để hứng nhiều gió hơn.', pick: { blades: 'long' } },
    { id: 'more', title: 'Thêm cánh quạt', text: 'Từ 3 cánh lên 6 cánh.', pick: { hub: 'more' } },
    { id: 'light', title: 'Đèn trên đỉnh', text: 'Đèn đỏ nhấp nháy trên đỉnh động cơ.', pick: { top: 'light' } },
    { id: 'tail', title: 'Đuôi lái gió', text: 'Đuôi phía sau giúp cối xoay gió đón gió.', pick: { back: 'tail' } }
  ];
  // Hình gói: lấy từ js/bai10/art.js (WindArt.PICS) khi có; tạm dùng hình đơn giản
  const mill = extra =>
    `<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M30 46V18h4v28" fill="#fff" stroke="#1e2a34" stroke-width="1.6"/>${extra}<circle cx="32" cy="16" r="3" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.4"/></svg>`;
  const blade = (a, l) => `<path d="M32 16L${(32 + l * Math.cos(a)).toFixed(1)} ${(16 + l * Math.sin(a)).toFixed(1)}" stroke="#1e2a34" stroke-width="5" stroke-linecap="round"/><path d="M32 16L${(32 + l * Math.cos(a)).toFixed(1)} ${(16 + l * Math.sin(a)).toFixed(1)}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
  const three = (l, n = 3) => Array.from({ length: n }, (_, i) => blade(-Math.PI / 2 + (i * 2 * Math.PI) / n, l)).join('');
  const FALLBACK_PICS = {
    long: mill(three(17)),
    more: mill(three(12, 6)),
    light: mill(three(12) + '<path d="M38 8V2" stroke="#1e2a34" stroke-width="2"/><circle cx="38" cy="2.5" r="2.5" fill="#e53935"/>'),
    tail: mill(three(12) + '<path d="M36 18h18l4-8v16z" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.4"/>')
  };
  const PICS = new Proxy({}, { get: (_, k) => (window.WindArt && window.WindArt.PICS && window.WindArt.PICS[k]) || FALLBACK_PICS[k] });

  // Quay ma trận cột/vectơ quanh trục đơn vị k góc a (Rodrigues)
  function axisRot(k, a) {
    const c = Math.cos(a),
      s = Math.sin(a),
      t = 1 - c,
      [x, y, z] = k;
    return [t * x * x + c, t * x * y + s * z, t * x * z - s * y, t * x * y - s * z, t * y * y + c, t * y * z + s * x,
      t * x * z + s * y, t * y * z - s * x, t * z * z + c];
  }
  function placements(DATA, H) {
    const { add, sub, scale, norm, matMul, make, box, by } = H;
    const d = DATA.drive.output;
    const rotV = (R, v) => [0, 1, 2].map(r => R[r] * v[0] + R[3 + r] * v[1] + R[6 + r] * v[2]);
    const blades = by('BP-7525A');
    const onRotor = list => list.map(p => ({ ...p, drive: 'output' }));
    // Cánh dài: thanh 7 lỗ mới nối tiếp phía ngoài mỗi cánh (dịch 50 mm theo hướng tâm → cánh)
    const long = blades.map(b => {
      let r = sub(b.pos, d.point);
      r = sub(r, scale(d.axis, r[0] * d.axis[0] + r[1] * d.axis[1] + r[2] * d.axis[2]));
      return make(b, add(b.pos, scale(norm(r), 0.05)));
    });
    // Thêm cánh: 3 thanh quay thêm 60° quanh trục cánh quạt
    const R60 = axisRot(d.axis, Math.PI / 3);
    const more = blades.map(b => make(b, add(d.point, rotV(R60, sub(b.pos, d.point))), matMul(R60, b.rotation)));
    // Đèn trên đỉnh động cơ, đuôi lái gió phía sau động cơ (ngược hướng trục cánh)
    const motor = box(by('BE-3581'));
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    // Đuôi ở phía đối diện cánh quạt (hình đuôi hướng −Z cục bộ: lật nếu cánh quạt nằm phía −Z của động cơ)
    const back = d.point[2] > motor.center[2] ? -1 : 1;
    const tailRot = back < 0 ? I : [-1, 0, 0, 0, 1, 0, 0, 0, -1];
    return {
      'blades:long': onRotor(long),
      'hub:more': onRotor(more),
      'top:light': [make(null, [motor.center[0], motor.hi[1], motor.center[2]], I, DATA.creative.light, 'light')],
      'back:tail': [make(null, [motor.center[0], motor.center[1], back < 0 ? motor.lo[2] : motor.hi[2]], tailRot, DATA.creative.tail, 'tail')]
    };
  }

  window.LESSON = {
    id: 'lop1-bai10',
    label: 'Bài 10',
    code: 'ZM10',
    sheetName: 'Bài 10: Bạn gió tinh nghịch – cối xoay gió',
    store: 'zm10_',
    baseName: 'Cối xoay gió',
    Engine: 'WindEngine',

    book(d) {
      const src = `assets/bai10/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Hình bước ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: d.page === 15 ? 'Cối xoay gió đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
        pdf: src
      };
    },

    missions: { core: ['m1', 'm2', 'm3', 'm4'], pro: ['m5'] },
    cards: {
      m2: { n: 2, title: 'Ghép khối giống hàng mẫu', text: 'Đặt các khối giống hàng mẫu mờ, chạm Start, rồi nhấn nút đỏ 4 lần: chậm → vừa → nhanh → dừng.' },
      m3: { n: 3, title: 'Sạc đầy pin cho ngôi nhà', text: 'Cho cánh quạt quay để sạc đầy pin, ngôi nhà sẽ sáng đèn. Quay nhanh thì sạc nhanh hơn!' },
      m4: { n: 4, title: 'Thử cối xoay gió sáng tạo', text: 'Gắn thêm chi tiết ở chặng Sáng tạo, rồi quay lại chạy chương trình.', go: ['creative', 'Đến xưởng sáng tạo'] },
      m5: { n: 5, title: 'Vượt qua cơn bão', text: 'Thời tiết đổi: gió nhẹ → gió mạnh → bão → gió nhẹ. Khi bão tới, nhấn nút cho cánh quạt dừng, hết bão chạy lại và sạc đầy pin.' },
      m1: { n: 1, title: 'Lắp xong cối xoay gió', text: 'Bấm “Đã lắp xong bước này” ở cả 15 bước của chặng Lắp ráp.', go: ['assembly', 'Đến chặng lắp ráp'] }
    },
    cardOrder: { kid: ['m2', 'm3', 'm4', 'm1'], pro: ['m2', 'm3', 'm4', 'm5', 'm1'] },

    // Chương trình mẫu trong giáo án: nhấn nút → chậm → nhấn → vừa → nhấn → nhanh → nhấn → dừng, lặp lại
    blocks: {
      toolbox: ['touch', 'lowSpeed', 'mediumSpeed', 'highSpeed', 'motorStop', 'motorPower', 'wait', 'melodyA'],
      pro: [],
      sample: ['start', 'repeatStart', 'touch', 'lowSpeed', 'touch', 'mediumSpeed', 'touch', 'highSpeed', 'touch', 'motorStop', 'repeatEnd'],
      empty: ['start', 'repeatStart', 'repeatEnd']
    },

    details(t) {
      const out = [];
      if (t.state.best) out.push(`Sạc đầy pin sau ${t.state.best.secs} giây`);
      if (t.state.upgrades && t.state.upgrades.length) out.push('Gói nâng cấp: ' + t.state.upgrades.join(', '));
      return out.join(' · ');
    },

    creative: {
      store: 'zm10.creative',
      kit: KIT,
      names: NAMES,
      features: FEATURES,
      slots: SLOTS,
      pics: PICS,
      presets: PRESETS,
      emptyText: 'Cối xoay gió cơ bản – chưa có tính năng mới.',
      placements
    }
  };
})();
