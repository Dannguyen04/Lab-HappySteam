// Cấu hình Lớp 1 · Bài 2 – Xe đua Động cơ. Phần dùng chung (js/app.js, blocks-engine.js, mission-tracker.js,
// creative-lab.js) đọc window.LESSON; phần riêng của bài là js/bai02/race-engine.js + race-scene.js (+ art.js).
(function () {
  'use strict';

  // ---------- Xưởng sáng tạo ----------
  // Số lượng trong hộp kit ZM Alpha 330 (set2321A, theo thư viện RoboBuilder)
  const KIT = { 'BP-7525A': 4, 'BP-7523A': 6, 'BP-7012': 40, 'BP-7021': 4, 'BP-8841': 4, 'BP-8850': 4, 'BP-7006': 4 };
  const NAMES = {
    'BP-7525A': 'Thanh 7 lỗ (cánh gió)',
    'BP-7523A': 'Thanh 3 lỗ (chân đỡ)',
    'BP-7012': 'Chốt đen',
    'BP-7021': 'Thanh 15 lỗ (mũi xe)',
    'BP-8841': 'Vành bánh xe',
    'BP-8850': 'Lốp xe',
    'BP-7006': 'Khối nối 4 chốt (đèn)'
  };
  const FEATURES = {
    wing: { text: 'Cánh gió đuôi: xe bám đường tốt hơn, leo dốc khỏe hơn' },
    bigwheel: { text: 'Bánh to hơn: chạy đường phẳng nhanh hơn nhưng leo dốc cần máy khỏe' },
    nose: { text: 'Mũi xe nhọn: cắt gió, chạy nhanh hơn một chút' },
    lights: { text: 'Đèn pha và số xe: xe đua trông thật oai' }
  };
  const SLOTS = [
    { id: 'rear', name: 'Phía sau xe', options: [{ id: 'wing', label: 'Cánh gió đuôi', parts: { 'BP-7525A': 1, 'BP-7523A': 2, 'BP-7012': 4 }, feature: 'wing' }] },
    { id: 'wheels', name: 'Hai bánh sau', options: [{ id: 'bigwheel', label: 'Bánh to hơn', parts: { 'BP-8841': 2, 'BP-8850': 2 }, feature: 'bigwheel' }] },
    { id: 'front', name: 'Đầu xe', options: [{ id: 'nose', label: 'Mũi xe nhọn', parts: { 'BP-7021': 1, 'BP-7523A': 1, 'BP-7012': 2 }, feature: 'nose' }] },
    { id: 'face', name: 'Mặt trước thân xe', options: [{ id: 'lights', label: 'Đèn pha + số xe', parts: { 'BP-7006': 2, 'BP-7012': 2 }, feature: 'lights' }] }
  ];
  const PRESETS = [
    { id: 'wing', title: 'Cánh gió đuôi', text: 'Xe bám đường hơn, leo dốc dễ hơn.', pick: { rear: 'wing' } },
    { id: 'bigwheel', title: 'Bánh to hơn', text: 'Chạy thẳng rất nhanh, nhưng leo dốc cần tốc độ cao.', pick: { wheels: 'bigwheel' } },
    { id: 'nose', title: 'Mũi xe nhọn', text: 'Đầu xe nhọn cắt gió, chạy nhanh hơn một chút.', pick: { front: 'nose' } },
    { id: 'lights', title: 'Đèn pha và số xe', text: 'Đèn sáng phía trước và số xe trên thân.', pick: { face: 'lights' } }
  ];
  // Hình gói: lấy từ js/bai02/art.js (RaceArt.PICS) khi có; tạm dùng hình đơn giản này
  const WHEELS = '<circle cx="18" cy="40" r="5" fill="#333" stroke="#1e2a34" stroke-width="1.5"/><circle cx="46" cy="40" r="5" fill="#333" stroke="#1e2a34" stroke-width="1.5"/>';
  const BODY = '<rect x="12" y="24" width="40" height="14" rx="4" fill="#e53935" stroke="#1e2a34" stroke-width="1.8"/>';
  const FALLBACK_PICS = {
    wing: `<svg viewBox="0 0 64 48" aria-hidden="true">${BODY}<rect x="8" y="10" width="22" height="5" fill="#1f4aa6" stroke="#0e2a6a" stroke-width="1.5"/><path d="M19 15v9" stroke="#1e2a34" stroke-width="2"/>${WHEELS}</svg>`,
    bigwheel: '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="12" y="20" width="40" height="14" rx="4" fill="#e53935" stroke="#1e2a34" stroke-width="1.8"/><circle cx="20" cy="36" r="10" fill="#333" stroke="#1e2a34" stroke-width="1.5"/><circle cx="20" cy="36" r="5" fill="#3dc1dc"/><circle cx="46" cy="40" r="5" fill="#333" stroke="#1e2a34" stroke-width="1.5"/></svg>',
    nose: `<svg viewBox="0 0 64 48" aria-hidden="true">${BODY}<path d="M52 24l10 6-10 8z" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.8"/>${WHEELS}</svg>`,
    lights: `<svg viewBox="0 0 64 48" aria-hidden="true">${BODY}<circle cx="53" cy="28" r="4" fill="#fff59d" stroke="#1e2a34" stroke-width="1.5"/><path d="M57 26l7-4v12l-7-4" fill="rgba(255,245,157,.5)"/><text x="26" y="35" font-size="11" font-weight="800" fill="#fff" text-anchor="middle">07</text>${WHEELS}</svg>`
  };
  const PICS = new Proxy({}, { get: (_, k) => (window.RaceArt && window.RaceArt.PICS && window.RaceArt.PICS[k]) || FALLBACK_PICS[k] });

  // Vị trí gắn tính từ mô hình (trục sau dọc X, thân xe dọc Z; đuôi ở −Z, đầu ở +Z). Các gói đã quay sẵn theo khung mô hình.
  function placements(DATA, H) {
    const { make, box, by } = H;
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const c = DATA.creative;
    const rcu = box(by('BE-5158')),
      frame = box(by('BP-8818')),
      tyreL = box([DATA.instances[8]]),
      tyreR = box([DATA.instances[10]]),
      front = box([25, 26, 27, 28, 29].map(i => DATA.instances[i]));
    return {
      'rear:wing': [make(null, [rcu.center[0], rcu.hi[1], rcu.lo[2]], I, c.wing, 'wing')],
      'wheels:bigwheel': [make(null, tyreL.center, I, c.bigwheel, 'bigwheel'), make(null, tyreR.center, I, c.bigwheel, 'bigwheel')],
      'front:nose': [make(null, [front.center[0], front.lo[1], front.hi[2]], I, c.nose, 'nose')],
      'face:lights': [make(null, [frame.center[0], frame.center[1], frame.hi[2]], I, c.lights, 'lights')]
    };
  }

  window.LESSON = {
    id: 'lop1-bai02',
    label: 'Bài 2',
    code: 'ZM2',
    sheetName: 'Bài 2: Động cơ',
    store: 'zm2_',
    baseName: 'Thân xe đua',
    Engine: 'RaceEngine',

    book(d) {
      const src = `assets/bai02/step-${String(d.page).padStart(2, '0')}.png`;
      return {
        src,
        alt: `Hình bước ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: d.page === 14
          ? 'Bước này chỉ xoay mô hình để quan sát, không thêm linh kiện.'
          : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
        pdf: src
      };
    },

    missions: { core: ['m1', 'm2', 'm3', 'm4'], pro: ['m5'] },
    cards: {
      m2: { n: 2, title: 'Ghép khối giống hàng mẫu', text: 'Đặt các khối giống hàng mẫu mờ: Start, Quay nhanh, Chờ 3 giây, Dừng. Rồi chạm Start cho xe chạy tới cuối.' },
      m3: { n: 3, title: 'Đỗ xe vào ô đỗ', text: 'Cho xe qua vạch đích rồi dừng hẳn trong ô đỗ, không đâm vào tường lốp. Gợi ý: xe leo dốc chậm hơn, hãy thử đổi số giây chờ.' },
      m4: { n: 4, title: 'Thử xe đua sáng tạo', text: 'Gắn thêm chi tiết ở chặng Sáng tạo, rồi quay lại cho xe chạy.', go: ['creative', 'Đến xưởng sáng tạo'] },
      m5: { n: 5, title: 'Vượt đường dốc lên dốc xuống', text: 'Đường Nâng cao có dốc lên rồi dốc xuống. Ghép chuỗi khối: chạy nhanh để lên dốc, đổi sang chạy chậm trước khi xuống dốc, rồi đỗ vào ô đỗ.' },
      m1: { n: 1, title: 'Lắp xong xe đua', text: 'Bấm “Đã lắp xong bước này” ở cả 14 bước của chặng Lắp ráp.', go: ['assembly', 'Đến chặng lắp ráp'] }
    },
    cardOrder: { kid: ['m2', 'm3', 'm4', 'm1'], pro: ['m2', 'm3', 'm4', 'm5', 'm1'] },

    // Chương trình mẫu trong phiếu học tập: Start → High Speed → Wait 3s → Stop
    blocks: {
      toolbox: ['highSpeed', 'lowSpeed', 'motorPower', 'wait', 'motorStop', 'motorReverse', 'melodyA'],
      pro: [],
      sample: ['start', 'highSpeed', ['wait', { duration: 3 }], 'motorStop'],
      empty: ['start']
    },

    details(t) {
      const out = [];
      const r = t.state.lastRun;
      if (r) out.push(`Đỗ xe ở ${r.x} cm: mức ${r.power}, chạy ${r.secs} giây`);
      if (t.state.upgrades && t.state.upgrades.length) out.push('Gói nâng cấp: ' + t.state.upgrades.join(', '));
      return out.join(' · ');
    },

    creative: {
      store: 'zm2.creative',
      kit: KIT,
      names: NAMES,
      features: FEATURES,
      slots: SLOTS,
      pics: PICS,
      presets: PRESETS,
      emptyText: 'Xe đua cơ bản – chưa có tính năng mới.',
      placements
    }
  };
})();
