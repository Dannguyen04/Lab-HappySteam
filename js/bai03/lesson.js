// Cấu hình Lớp 1 · Bài 3 – Robot thám hiểm Milo. Phần dùng chung (js/app.js, blocks-engine.js, mission-tracker.js,
// creative-lab.js) đọc window.LESSON; phần riêng của bài là js/bai03/rover-engine.js + mars-scene.js (+ art.js).
(function () {
  'use strict';

  // ---------- Xưởng sáng tạo ----------
  // Số lượng trong hộp kit ZM Alpha 330 (set2321A, theo thư viện RoboBuilder)
  const KIT = { 'BP-8818': 2, 'BP-7525A': 4, 'BP-7012': 40, 'BP-3976': 2, 'BP-3993': 3, 'BP-7024': 6, 'BP-7027': 4, 'BP-7528': 4, 'BP-7073': 3 };
  const NAMES = {
    'BP-8818': 'Khung đế 7×11 (đáy thùng)',
    'BP-7525A': 'Thanh 7 lỗ (vách thùng)',
    'BP-7012': 'Chốt đen',
    'BP-3976': 'Khung 5×7 (tấm pin)',
    'BP-3993': 'Trục 7 (ăng-ten)',
    'BP-7024': 'Bạc nửa (đèn)',
    'BP-7027': 'Khớp góc',
    'BP-7528': 'Thanh 15 lỗ (cánh tay)',
    'BP-7073': 'Thanh cong (ngón kẹp)'
  };
  const FEATURES = {
    bin: { text: 'Thùng chở mẫu: chạy nhanh mẫu cây cũng không rơi' },
    antenna: { text: 'Ăng-ten, đèn: báo tín hiệu về Trạm A khi tới điểm B' },
    solar: { text: 'Pin mặt trời: robot có thêm năng lượng để thám hiểm lâu hơn' },
    arm: { text: 'Cánh tay gắp: nhặt mẫu đá ở điểm B mang về' }
  };
  const SLOTS = [
    { id: 'back', name: 'Trên lưng robot', options: [{ id: 'bin', label: 'Thùng chở mẫu', parts: { 'BP-8818': 1, 'BP-7525A': 2, 'BP-7012': 4 }, feature: 'bin' }] },
    { id: 'roof', name: 'Mái che phía trên', options: [{ id: 'solar', label: 'Pin mặt trời', parts: { 'BP-3976': 1, 'BP-7012': 2 }, feature: 'solar' }] },
    { id: 'head', name: 'Đỉnh đầu cảm biến', options: [{ id: 'antenna', label: 'Ăng-ten, đèn', parts: { 'BP-3993': 1, 'BP-7024': 1, 'BP-7027': 1 }, feature: 'antenna' }] },
    { id: 'front', name: 'Phía trước bánh bi', options: [{ id: 'arm', label: 'Cánh tay gắp', parts: { 'BP-7528': 1, 'BP-7073': 2, 'BP-7012': 4 }, feature: 'arm' }] }
  ];
  const PRESETS = [
    { id: 'bin', title: 'Thùng chở mẫu', text: 'Chở mẫu cây an toàn, kể cả khi chạy nhanh.', pick: { back: 'bin' } },
    { id: 'antenna', title: 'Ăng-ten và đèn', text: 'Ăng-ten dài có đèn đỏ nhấp nháy trên đầu.', pick: { head: 'antenna' } },
    { id: 'solar', title: 'Pin mặt trời', text: 'Tấm pin che trên lưng như robot sao Hỏa thật.', pick: { roof: 'solar' } },
    { id: 'arm', title: 'Cánh tay gắp', text: 'Cánh tay có kẹp chìa ra phía trước.', pick: { front: 'arm' } }
  ];
  // Hình gói: lấy từ js/bai03/art.js (MarsArt.PICS) khi có; tạm dùng hình đơn giản này
  const FALLBACK_PICS = {
    bin: '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="14" y="22" width="36" height="16" rx="3" fill="#fff" stroke="#1e2a34" stroke-width="1.8"/><path d="M20 22V12h24v10" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.8"/><circle cx="32" cy="10" r="4" fill="#4caf50"/><circle cx="20" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/><circle cx="44" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/></svg>',
    antenna: '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="14" y="24" width="36" height="14" rx="3" fill="#fff" stroke="#1e2a34" stroke-width="1.8"/><path d="M32 24V6" stroke="#1e2a34" stroke-width="2.4"/><circle cx="32" cy="6" r="4" fill="#e53935"/><path d="M40 6a8 8 0 0 1 6 6M24 6a8 8 0 0 0-6 6" stroke="#e53935" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="20" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/><circle cx="44" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/></svg>',
    solar: '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="8" y="8" width="48" height="12" fill="#1f4aa6" stroke="#0e2a6a" stroke-width="1.6"/><path d="M20 8v12M32 8v12M44 8v12" stroke="#9ec1ff" stroke-width="1"/><path d="M32 20v6" stroke="#1e2a34" stroke-width="2"/><rect x="14" y="26" width="36" height="12" rx="3" fill="#fff" stroke="#1e2a34" stroke-width="1.8"/><circle cx="20" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/><circle cx="44" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/></svg>',
    arm: '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="6" y="22" width="30" height="14" rx="3" fill="#fff" stroke="#1e2a34" stroke-width="1.8"/><path d="M36 30h18" stroke="#9aa7b4" stroke-width="4" stroke-linecap="round"/><path d="M54 24v12M54 24h5M54 36h5" stroke="#1e2a34" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/><circle cx="30" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/></svg>'
  };
  const PICS = new Proxy({}, { get: (_, k) => (window.MarsArt && window.MarsArt.PICS && window.MarsArt.PICS[k]) || FALLBACK_PICS[k] });

  // Vị trí gắn tính từ mô hình: nóc bộ não, đỉnh cảm biến, phía trước bánh bi. Mặt trước robot là +X.
  function placements(DATA, H) {
    const { make, box, by } = H;
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const rcu = box(by('BE-5158')),
      sensor = box(by('BE-6313')),
      caster = box(by('BP-8840'));
    const c = DATA.creative;
    const at = (b, dy = 0) => [b.center[0], b.hi[1] + dy, b.center[2]];
    return {
      'back:bin': [make(null, at(rcu), I, c.bin, 'bin')],
      'roof:solar': [make(null, at(rcu), I, c.solar, 'solar')],
      'head:antenna': [make(null, [sensor.center[0] - 0.01, sensor.hi[1], sensor.center[2]], I, c.antenna, 'antenna')],
      'front:arm': [make(null, [caster.hi[0] - 0.004, caster.center[1], caster.center[2]], I, c.arm, 'arm')]
    };
  }

  window.LESSON = {
    id: 'lop1-bai03',
    label: 'Bài 3',
    code: 'ZM3',
    sheetName: 'Bài 3: Robot thám hiểm Milo',
    store: 'zm3_',
    baseName: 'Thân robot',
    Engine: 'RoverEngine',

    book(d) {
      const src = `assets/bai03/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Hình bước ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: [13, 14, 20, 22].includes(d.page)
          ? 'Bước này chỉ xoay mô hình để quan sát, không thêm linh kiện.'
          : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
        pdf: src
      };
    },

    missions: { core: ['m1', 'm2', 'm3', 'm4'], pro: ['m5'] },
    cards: {
      m2: { n: 2, title: 'Ghép khối giống hàng mẫu', text: 'Đặt các khối giống hàng mẫu mờ, chạm Start, rồi bấm ✋ để đưa tay trước cảm biến.' },
      m3: { n: 3, title: 'Chở mẫu cây tới điểm B', text: 'Cho robot dừng đúng ở điểm B mà mẫu cây không rơi. Gợi ý: chạy chậm hơn (Tốc độ mức 4) và đổi số giây chờ, hoặc gắn thùng chở mẫu.' },
      m4: { n: 4, title: 'Thử robot sáng tạo', text: 'Gắn thêm chi tiết ở chặng Sáng tạo, rồi quay lại chạy chương trình.', go: ['creative', 'Đến xưởng sáng tạo'] },
      m5: { n: 5, title: 'Đo quãng đường', text: 'Điểm B đổi chỗ sau mỗi lần chở đúng. Tính: tốc độ (bảng bên cạnh) × số giây = quãng đường. Chở đúng 3 vị trí B khác nhau.' },
      m1: { n: 1, title: 'Lắp xong Robot Milo', text: 'Bấm “Đã lắp xong bước này” ở cả 22 bước của chặng Lắp ráp.', go: ['assembly', 'Đến chặng lắp ráp'] }
    },
    cardOrder: { kid: ['m2', 'm3', 'm4', 'm1'], pro: ['m2', 'm3', 'm4', 'm5', 'm1'] },

    // Chương trình mẫu trong phiếu học tập: Start → Wait for Obstacles → High Speed → Wait 3s → Stop
    blocks: {
      toolbox: ['obstacle', 'highSpeed', 'motorPower', 'wait', 'motorStop', 'motorReverse', 'melodyA', 'melodyB'],
      pro: [],
      sample: ['start', 'obstacle', 'highSpeed', ['wait', { duration: 3 }], 'motorStop'],
      empty: ['start']
    },

    details(t) {
      const out = [];
      const r = t.state.lastRun;
      if (r) out.push(`Chở tới B (${r.b} cm): mức ${r.power}, chạy ${r.secs} giây`);
      if (t.state.upgrades && t.state.upgrades.length) out.push('Gói nâng cấp: ' + t.state.upgrades.join(', '));
      if (t.state.bHits && t.state.bHits.length) out.push('B đã chở đúng: ' + t.state.bHits.join(', ') + ' cm');
      return out.join(' · ');
    },

    creative: {
      store: 'zm3.creative',
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
