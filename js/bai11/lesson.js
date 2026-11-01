// Cấu hình Lớp 1 · Bài 11 – Nước từ đâu đến (cối xoay nước). Phần dùng chung (js/app.js, blocks-engine.js, mission-tracker.js,
// creative-lab.js) đọc window.LESSON; phần riêng của bài là js/bai11/water-engine.js + water-scene.js (+ art.js).
(function () {
  'use strict';

  // ---------- Xưởng sáng tạo ----------
  // Số lượng trong hộp kit ZM Alpha 330 (set2321A, theo thư viện RoboBuilder)
  const KIT = { 'BP-7525A': 4, 'BP-7012': 40, 'BP-7528': 4, 'BP-3976': 2, 'BP-7024': 6, 'BP-3993': 3, 'BP-7027': 4, 'BP-7073': 3, 'BP-8818': 2 };
  const NAMES = {
    'BP-7525A': 'Thanh 7 lỗ (máng, mái)',
    'BP-7012': 'Chốt đen',
    'BP-7528': 'Thanh 15 lỗ (máng dẫn)',
    'BP-3976': 'Khung 5×7 (mái che)',
    'BP-7024': 'Bạc nửa (gầu)',
    'BP-3993': 'Trục 7',
    'BP-7027': 'Khớp góc',
    'BP-7073': 'Thanh cong (gầu, vòi lọc)',
    'BP-8818': 'Khung đế 7×11 (bộ lọc)'
  };
  const FEATURES = {
    scoop: { text: 'Gầu to hơn: mỗi vòng múc nhiều nước hơn 40%' },
    pipe: { text: 'Máng dẫn nước: nước chảy gọn vào bể, nhiều hơn 10%' },
    cover: { text: 'Mái che bể: nắng ít làm nước bay hơi hơn' },
    filter: { text: 'Bộ lọc nước: nước sạch hơn trước khi dùng' }
  };
  const SLOTS = [
    { id: 'wheel', name: 'Bánh gầu', options: [{ id: 'scoop', label: 'Gầu to', parts: { 'BP-7073': 3, 'BP-7024': 3, 'BP-7012': 3 }, feature: 'scoop' }] },
    { id: 'side', name: 'Cạnh bể chứa', options: [{ id: 'pipe', label: 'Máng dẫn nước', parts: { 'BP-7528': 1, 'BP-7012': 4 }, feature: 'pipe' }] },
    { id: 'roof', name: 'Phía trên bể', options: [{ id: 'cover', label: 'Mái che bể', parts: { 'BP-3976': 1, 'BP-7525A': 2, 'BP-7012': 2 }, feature: 'cover' }] },
    { id: 'front', name: 'Phía trước mô hình', options: [{ id: 'filter', label: 'Bộ lọc nước', parts: { 'BP-8818': 1, 'BP-3993': 1, 'BP-7027': 1 }, feature: 'filter' }] }
  ];
  const PRESETS = [
    { id: 'scoop', title: 'Gầu to hơn', text: 'Thêm gầu lên bánh quay để múc nhiều nước.', pick: { wheel: 'scoop' } },
    { id: 'pipe', title: 'Máng dẫn nước', text: 'Máng dài đưa nước từ gầu vào bể.', pick: { side: 'pipe' } },
    { id: 'cover', title: 'Mái che bể', text: 'Tấm mái che nắng cho bể chứa.', pick: { roof: 'cover' } },
    { id: 'filter', title: 'Bộ lọc nước', text: 'Hộp lọc đặt trước vòi nước.', pick: { front: 'filter' } }
  ];
  // Hình gói: lấy từ js/bai11/art.js (window.WaterArt.PICS) khi có; tạm dùng hình đơn giản này
  const wheel = extra =>
    `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="6" y="38" width="52" height="6" rx="2" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.5"/><circle cx="26" cy="24" r="12" fill="#fff" stroke="#1e2a34" stroke-width="2"/><circle cx="26" cy="24" r="3" fill="#1e2a34"/>${extra}</svg>`;
  const FALLBACK_PICS = {
    scoop: wheel('<path d="M26 12v-6M38 24h6M14 24H8M26 36v6" stroke="#1e2a34" stroke-width="5" stroke-linecap="round"/><path d="M26 12v-6M38 24h6M14 24H8M26 36v6" stroke="#3dc1dc" stroke-width="3" stroke-linecap="round"/>'),
    pipe: wheel('<path d="M38 24h10l6 10" stroke="#1e2a34" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M38 24h10l6 10" stroke="#9ec1ff" stroke-width="3" fill="none" stroke-linecap="round"/>'),
    cover: wheel('<path d="M34 8h26l-4 6H38z" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.6"/>'),
    filter: wheel('<rect x="40" y="20" width="16" height="12" rx="2" fill="#dff3f8" stroke="#0e6f8a" stroke-width="1.6"/><path d="M44 26h8" stroke="#0e6f8a" stroke-width="1.6"/>')
  };
  const PICS = new Proxy({}, { get: (_, k) => (window.WaterArt && window.WaterArt.PICS && window.WaterArt.PICS[k]) || FALLBACK_PICS[k] });

  // Vị trí gắn tính từ mô hình: bánh gầu quay theo trục ra (drive.output), bể và bộ não làm mốc. Mặt trước mô hình là +X.
  // Các hình gói nằm trong DATA.creative (do build.json cung cấp); thiếu gói nào thì bỏ qua gói đó.
  function placements(DATA, H) {
    const { make, box, by } = H;
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const c = DATA.creative || {};
    const first = (...codes) => {
      for (const code of codes) {
        const list = by(code);
        if (list && list.length) return box(list);
      }
      return null;
    };
    const rcu = first('BE-5158');
    const base = first('BP-8818', 'BE-5158');
    const out = {};
    const put = (key, mesh, pos, extra) => {
      if (c[mesh] && c[mesh].length && pos) out[key] = [{ ...make(null, pos, I, c[mesh], mesh), ...(extra || {}) }];
    };
    const d = DATA.drive && DATA.drive.output;
    // Ba gầu bố trí quanh trục quay; từng chi tiết chuyển động cùng bánh gầu.
    if (d && d.point && c.scoop?.length) {
      const [x, y, z] = d.point;
      out['wheel:scoop'] = [
        [x + 0.012, y + 0.035, z],
        [x + 0.012, y - 0.0175, z + 0.0303],
        [x + 0.012, y - 0.0175, z - 0.0303]
      ].map(pos => ({ ...make(null, pos, I, c.scoop, 'scoop'), drive: 'output' }));
    }
    put('side:pipe', 'pipe', rcu && [rcu.center[0], rcu.lo[1], rcu.center[2]]);
    put('roof:cover', 'cover', rcu && [rcu.center[0], rcu.hi[1], rcu.center[2]]);
    put('front:filter', 'filter', base && [base.hi[0], base.lo[1], base.center[2]]);
    return out;
  }

  window.LESSON = {
    id: 'lop1-bai11',
    label: 'Bài 11',
    code: 'ZM11',
    sheetName: 'Bài 11: Nước từ đâu đến – cối xoay nước',
    store: 'zm11_',
    baseName: 'Cối xoay nước',
    Engine: 'WaterEngine',

    book(d) {
      const page = Math.max(1, Math.min(31, Number(d.page) || Number(d.step) || 1));
      return {
        src: `assets/lop1-bai11/step-${String(page).padStart(2, '0')}.jpg`,
        alt: `Hình lắp ráp gốc bước ${page} của cối xoay nước`,
        loc: `Bước ${page} · trang ${page}/31`,
        cap: page === 31 ? 'Mô hình hoàn thành. Đối chiếu ảnh với mô hình 3D.' : 'Làm theo hình bước này và đối chiếu mô hình 3D.',
        pdf: `references/lop1/bai11/bai11.pdf#page=${page}`
      };
    },

    missions: { core: ['m1', 'm2', 'm3', 'm4'], pro: ['m5'] },
    cards: {
      m2: { n: 2, title: 'Ghép khối giống hàng mẫu', text: 'Đặt các khối giống hàng mẫu mờ, chạm Start: màn hình hiện trái tim rồi mặt cười, gầu quay, kêu A rồi B.' },
      m3: { n: 3, title: 'Đưa nước lên đầy bể', text: 'Cho gầu quay đúng chiều để múc nước từ sông lên bể chứa. Bể đầy 100 lít thì dân làng có nước dùng.' },
      m4: { n: 4, title: 'Thử cối xoay nước sáng tạo', text: 'Gắn thêm chi tiết ở chặng Sáng tạo, rồi quay lại chạy chương trình.', go: ['creative', 'Đến xưởng sáng tạo'] },
      m5: { n: 5, title: 'Giữ nước cho cả làng', text: 'Trời nắng làm nước bay hơi (2 lít mỗi giây). Bể 150 lít, đầy 3 lần liền. Tính: vòng/giây × 5 lít − 2 lít bay hơi.' },
      m1: { n: 1, title: 'Lắp xong cối xoay nước', text: 'Bấm “Đã lắp xong bước này” ở cả 31 bước của chặng Lắp ráp.', go: ['assembly', 'Đến chặng lắp ráp'] }
    },
    cardOrder: { kid: ['m2', 'm3', 'm4', 'm1'], pro: ['m2', 'm3', 'm4', 'm5', 'm1'] },

    // Chương trình mẫu trong giáo án: Trái tim, âm A, quay nhanh 3 giây, mặt cười, âm B, tiếp tục quay 3 giây, lặp lại
    blocks: {
      toolbox: ['displayHeart', 'displaySmile', 'melodyA', 'melodyB', 'highSpeed', 'lowSpeed', 'wait', 'motorStop', 'motorReverse'],
      pro: [],
      sample: ['start', 'repeatStart', 'displayHeart', 'melodyA', 'highSpeed', ['wait', { duration: 3 }], 'displaySmile', 'melodyB', ['wait', { duration: 3 }], 'repeatEnd'],
      empty: ['start', 'repeatStart', 'repeatEnd']
    },

    details(t) {
      const out = [];
      const r = t.state.lastRun;
      if (r) out.push(`Bể đầy ${r.liters} lít sau ${r.secs} giây`);
      if (t.state.upgrades && t.state.upgrades.length) out.push('Gói nâng cấp: ' + t.state.upgrades.join(', '));
      if (t.state.fills) out.push('Đầy bể Nâng cao: ' + t.state.fills + ' lần');
      return out.join(' · ');
    },

    creative: {
      store: 'zm11.creative',
      kit: KIT,
      names: NAMES,
      features: FEATURES,
      slots: SLOTS,
      pics: PICS,
      presets: PRESETS,
      emptyText: 'Cối xoay nước cơ bản – chưa có tính năng mới.',
      placements
    }
  };
})();
