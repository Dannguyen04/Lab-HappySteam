// Cấu hình Lớp 1 · Bài 13 – Hiện tượng thiên nhiên: Tuyết rơi (xe robot dọn tuyết). Phần dùng chung (js/app.js, blocks-engine.js,
// mission-tracker.js, creative-lab.js) đọc window.LESSON; phần riêng của bài là js/bai13/plow-engine.js + snow-scene.js (+ art.js).
(function () {
  'use strict';

  // ---------- Xưởng sáng tạo ----------
  // Số lượng trong hộp kit ZM Alpha 330 (set2321A, theo thư viện RoboBuilder)
  const KIT = { 'BP-8818': 2, 'BP-7525A': 4, 'BP-7012': 40, 'BP-3976': 2, 'BP-3993': 3, 'BP-7024': 6, 'BP-7027': 4, 'BP-7528': 4, 'BP-7073': 3 };
  const NAMES = {
    'BP-8818': 'Khung đế 7×11 (lưỡi gạt)',
    'BP-7525A': 'Thanh 7 lỗ (khung)',
    'BP-7012': 'Chốt đen',
    'BP-3976': 'Khung 5×7 (thùng muối)',
    'BP-3993': 'Trục 7 (cột đèn)',
    'BP-7024': 'Bạc nửa (đèn)',
    'BP-7027': 'Khớp góc',
    'BP-7528': 'Thanh 15 lỗ (xích)',
    'BP-7073': 'Thanh cong (móc xích)'
  };
  const FEATURES = {
    blade: { text: 'Lưỡi gạt tuyết: đẩy được tuyết dày ngay cả khi chạy chậm (từ mức 3)' },
    beacon: { text: 'Đèn cảnh báo: đèn cam nhấp nháy để xe khác nhìn thấy trong tuyết' },
    salt: { text: 'Thùng rải muối: rải muối làm tuyết tan nhanh hơn' },
    chain: { text: 'Xích bánh xe: bánh bám đường, không trượt trên tuyết' }
  };
  const SLOTS = [
    { id: 'front', name: 'Phía trước xe', options: [{ id: 'blade', label: 'Lưỡi gạt tuyết', parts: { 'BP-8818': 1, 'BP-7525A': 2, 'BP-7012': 4 }, feature: 'blade' }] },
    { id: 'roof', name: 'Nóc xe', options: [{ id: 'beacon', label: 'Đèn cảnh báo', parts: { 'BP-3993': 1, 'BP-7024': 1, 'BP-7027': 1 }, feature: 'beacon' }] },
    { id: 'back', name: 'Phía sau xe', options: [{ id: 'salt', label: 'Thùng rải muối', parts: { 'BP-3976': 1, 'BP-7012': 2 }, feature: 'salt' }] },
    { id: 'wheel', name: 'Hai bên bánh xe', options: [{ id: 'chain', label: 'Xích bánh xe', parts: { 'BP-7528': 1, 'BP-7073': 2, 'BP-7012': 4 }, feature: 'chain' }] }
  ];
  const PRESETS = [
    { id: 'blade', title: 'Lưỡi gạt tuyết', text: 'Lưỡi to phía trước, đẩy được cả tuyết dày.', pick: { front: 'blade' } },
    { id: 'beacon', title: 'Đèn cảnh báo', text: 'Đèn cam nhấp nháy trên nóc xe.', pick: { roof: 'beacon' } },
    { id: 'salt', title: 'Thùng rải muối', text: 'Thùng chứa muối phía sau để làm tuyết tan.', pick: { back: 'salt' } },
    { id: 'chain', title: 'Xích bánh xe', text: 'Xích quấn quanh bánh để không trượt.', pick: { wheel: 'chain' } }
  ];
  // Hình gói: lấy từ js/bai13/art.js (SnowArt.PICS) khi có; tạm dùng hình đơn giản này
  const FALLBACK_PICS = {
    blade: '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="8" y="22" width="34" height="14" rx="3" fill="#ffb300" stroke="#1e2a34" stroke-width="1.8"/><path d="M42 36l8-20h6l-6 20z" fill="#dfe6ec" stroke="#1e2a34" stroke-width="1.8"/><circle cx="16" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/><circle cx="34" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/></svg>',
    beacon: '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="14" y="24" width="36" height="14" rx="3" fill="#ffb300" stroke="#1e2a34" stroke-width="1.8"/><circle cx="32" cy="16" r="6" fill="#ff9800" stroke="#1e2a34" stroke-width="1.8"/><path d="M20 12l-5-3M44 12l5-3M32 6V2" stroke="#ff9800" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/><circle cx="44" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/></svg>',
    salt: '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="10" y="26" width="36" height="12" rx="3" fill="#ffb300" stroke="#1e2a34" stroke-width="1.8"/><rect x="8" y="12" width="22" height="14" fill="#7fa6c8" stroke="#1e2a34" stroke-width="1.8"/><path d="M6 40l-3 4M10 42l-2 4M14 41l-1 5" stroke="#9aa7b4" stroke-width="2" stroke-linecap="round"/><circle cx="18" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/><circle cx="40" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/></svg>',
    chain: '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="12" y="20" width="40" height="12" rx="3" fill="#ffb300" stroke="#1e2a34" stroke-width="1.8"/><circle cx="22" cy="36" r="8" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/><circle cx="22" cy="36" r="10.5" fill="none" stroke="#1e2a34" stroke-width="2" stroke-dasharray="3 3"/><circle cx="44" cy="36" r="8" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/><circle cx="44" cy="36" r="10.5" fill="none" stroke="#1e2a34" stroke-width="2" stroke-dasharray="3 3"/></svg>'
  };
  const PICS = new Proxy({}, { get: (_, k) => (window.SnowArt && window.SnowArt.PICS && window.SnowArt.PICS[k]) || FALLBACK_PICS[k] });

  // Vị trí gắn theo linh kiện thực tế của Bài 13; đầu xe là +X.
  function placements(DATA, H) {
    const { make, box, by } = H;
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const c = DATA.creative || {};
    const safe = fn => {
      try {
        return fn() || [];
      } catch (e) {
        return [];
      }
    };
    const rcu = () => box(by('BE-5158')),
      front = () => box(by('BP-7021')),
      wheel = () => by('BP-8850');
    return {
      'front:blade': safe(() => {
        const b = front();
        return [make(null, [b.hi[0] + 0.005, b.center[1] - 0.01, b.center[2]], I, c.blade, 'blade')];
      }),
      'roof:beacon': safe(() => {
        const b = rcu();
        return [make(null, [b.center[0], b.hi[1], b.center[2]], I, c.beacon, 'beacon')];
      }),
      'back:salt': safe(() => {
        const b = rcu();
        return [make(null, [b.lo[0] - 0.025, b.hi[1] - 0.015, b.center[2]], I, c.salt, 'salt')];
      }),
      'wheel:chain': safe(() => {
        // Bánh BP-8850 quay quanh trục Z của xe; dùng ma trận của chính bánh
        // để đặt vòng xích (mesh gốc có trục X) đồng tâm với hai bánh.
        return wheel().map(w => make(null, w.pos.slice(), w.rotation.slice(), c.chain, 'chain'));
      })
    };
  }

  window.LESSON = {
    id: 'lop1-bai13',
    label: 'Bài 13',
    code: 'ZM13',
    sheetName: 'Bài 13: Hiện tượng tuyết rơi – Xe dọn tuyết',
    store: 'zm13_',
    baseName: 'Thân xe',
    Engine: 'PlowEngine',

    book(d) {
      const raw = Number(d?.page ?? d?.step);
      const page = Number.isFinite(raw) ? Math.max(1, Math.min(22, Math.trunc(raw))) : 1;
      const src = `js/bai13/book/step-${String(page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Hình bước ${page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${page} · trang ${page}`,
        cap: page === 22 ? 'Bước 22: quan sát mô hình xe dọn tuyết đã hoàn thành.' : 'Đối chiếu linh kiện và vị trí lắp theo hình minh họa trong sách.',
        pdf: src
      };
    },

    missions: { core: ['m1', 'm2', 'm3', 'm4'], pro: ['m5'] },
    cards: {
      m2: { n: 2, title: 'Ghép khối giống hàng mẫu', text: 'Đặt các khối giống hàng mẫu mờ (có khối Lặp), chạm Start. Cảm biến thấy đống tuyết là xe tự chạy 1 giây rồi dừng, lặp lại.' },
      m3: { n: 3, title: 'Dọn sạch tuyết trên đường', text: 'Cho xe đẩy hết các đống tuyết mà không đụng tường cuối đường. Gợi ý: tuyết dày, chạy chậm (mức dưới 5) sẽ bị kẹt, hãy chạy nhanh hoặc gắn lưỡi gạt.' },
      m4: { n: 4, title: 'Thử xe sáng tạo', text: 'Gắn thêm chi tiết ở chặng Sáng tạo, rồi quay lại chạy chương trình.', go: ['creative', 'Đến xưởng sáng tạo'] },
      m5: { n: 5, title: 'Bão tuyết: dọn trong 4 lần chạy', text: 'Đường dài 230 cm có 5 đống tuyết. Tính: tốc độ (bảng bên cạnh) × số giây Wait = quãng đường mỗi lần. Dọn sạch chỉ với tối đa 4 lần chạy.' },
      m1: { n: 1, title: 'Lắp xong xe dọn tuyết', text: 'Bấm “Đã lắp xong bước này” ở mọi bước của chặng Lắp ráp.', go: ['assembly', 'Đến chặng lắp ráp'] }
    },
    cardOrder: { kid: ['m2', 'm3', 'm4', 'm1'], pro: ['m2', 'm3', 'm4', 'm5', 'm1'] },

    // Chương trình mẫu trong giáo án: Start → Lặp { Chờ vật cản → Quay nhanh → Chờ 1 giây → Dừng }
    blocks: {
      toolbox: ['repeatStart', 'repeatEnd', 'obstacle', 'highSpeed', 'motorPower', 'wait', 'motorStop', 'motorReverse', 'melodyA', 'melodyB'],
      pro: [],
      sample: ['start', 'repeatStart', 'obstacle', 'highSpeed', ['wait', { duration: 1 }], 'motorStop', 'repeatEnd'],
      empty: ['start']
    },

    details(t) {
      const out = [];
      const r = t.state.lastRun;
      if (r) out.push(`Dọn ${r.piles} đống tuyết: ${r.cycles} lần chạy, mức ${r.power}`);
      if (t.state.upgrades && t.state.upgrades.length) out.push('Gói nâng cấp: ' + t.state.upgrades.join(', '));
      return out.join(' · ');
    },

    creative: {
      store: 'zm13.creative',
      kit: KIT,
      names: NAMES,
      features: FEATURES,
      slots: SLOTS,
      pics: PICS,
      presets: PRESETS,
      emptyText: 'Xe cơ bản – chưa có tính năng mới.',
      placements
    }
  };
})();
