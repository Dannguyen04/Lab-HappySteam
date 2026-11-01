// Cấu hình Lớp 3 · Bài 11 – Sống trên sao Hỏa: Tìm kiếm nguồn nước (robot bánh xe có cảm biến và máy bơm nước).
// Phần dùng chung đọc window.LESSON; phần riêng của bài là js/lop3-bai11/water-engine.js + water-scene.js
// (+ art.js do công cụ vẽ cung cấp, nếu có). Mô hình: một động cơ quay trục hai bánh, cảm biến trên cột cao nhìn phía trước.
(function () {
  'use strict';

  // Số lượng trong hộp kit ZM Alpha 330 (set2321A)
  const KIT = { 'BP-8818': 2, 'BP-7525A': 4, 'BP-7012': 40, 'BP-3976': 2, 'BP-3993': 3, 'BP-7024': 6, 'BP-7528': 4, 'BP-7073': 3 };
  const NAMES = {
    'BP-8818': 'Khung đế 7×11 (đáy bồn)',
    'BP-7525A': 'Thanh 7 lỗ (vách bồn)',
    'BP-7012': 'Chốt đen',
    'BP-3976': 'Khung 5×7 (tấm pin)',
    'BP-3993': 'Trục 7 (ống hút)',
    'BP-7024': 'Bạc nửa (đèn)',
    'BP-7528': 'Thanh 15 lỗ (cần bơm)',
    'BP-7073': 'Thanh cong (đầu hút)'
  };
  const FEATURES = {
    tank: { text: 'Bồn chứa nước: mỗi mẫu thu được nhiều nước hơn (3 lít thay vì 2 lít)' },
    pump: { text: 'Máy bơm mạnh: bơm xong mỗi mỏm băng chỉ trong 1,5 giây thay vì 3 giây' },
    solar: { text: 'Pin mặt trời: tấm pin trên lưng cho robot thêm năng lượng làm việc' }
  };
  const SLOTS = [
    { id: 'back', name: 'Trên lưng robot', options: [{ id: 'tank', label: 'Bồn chứa nước', parts: { 'BP-8818': 1, 'BP-7525A': 2, 'BP-7012': 4 }, feature: 'tank' }] },
    { id: 'front', name: 'Phía trước robot', options: [{ id: 'pump', label: 'Máy bơm mạnh', parts: { 'BP-7528': 1, 'BP-7073': 2, 'BP-7012': 2 }, feature: 'pump' }] },
    { id: 'roof', name: 'Mái che phía trên', options: [{ id: 'solar', label: 'Pin mặt trời', parts: { 'BP-3976': 1, 'BP-7012': 2 }, feature: 'solar' }] }
  ];
  const PRESETS = [
    { id: 'tank', title: 'Bồn chứa nước', text: 'Chở được nhiều nước hơn mỗi lần bơm.', pick: { back: 'tank' } },
    { id: 'pump', title: 'Máy bơm mạnh', text: 'Bơm nhanh hơn, tìm đủ nước sớm hơn.', pick: { front: 'pump' } },
    { id: 'solar', title: 'Pin mặt trời', text: 'Tấm pin che trên lưng như robot sao Hỏa thật.', pick: { roof: 'solar' } }
  ];
  // Hình gói: lấy từ js/lop3-bai11/art.js khi có (PICS); tạm dùng hình đơn giản
  const body = extra =>
    `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="12" y="24" width="38" height="13" rx="3" fill="#fff" stroke="#1e2a34" stroke-width="1.8"/><circle cx="20" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/><circle cx="44" cy="40" r="5" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.5"/>${extra}</svg>`;
  const FALLBACK_PICS = {
    tank: body('<rect x="18" y="10" width="26" height="14" rx="3" fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.8"/><path d="M22 16h18" stroke="#fff" stroke-width="2"/>'),
    pump: body('<path d="M50 30h8M58 30v10" stroke="#1e2a34" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M58 44v-4" stroke="#3dc1dc" stroke-width="3"/>'),
    solar: body('<rect x="10" y="8" width="42" height="11" fill="#1f4aa6" stroke="#0e2a6a" stroke-width="1.6"/><path d="M24 8v11M38 8v11" stroke="#9ec1ff" stroke-width="1"/><path d="M31 19v5" stroke="#1e2a34" stroke-width="2"/>')
  };
  const artPics = () => {
    const A = window.WaterArt || window.MarsWaterArt || window.Bai11Art;
    return (A && A.PICS) || null;
  };
  const PICS = new Proxy({}, { get: (_, k) => (artPics() && artPics()[k]) || FALLBACK_PICS[k] });

  // Hình 3D minh họa nâng cấp bằng mesh riêng trong DATA.creative;
  // với bản CAD cũ, vẫn có hình học CAD dự phòng.
  // Trục xe nằm theo X; mặt trước có cảm biến siêu âm ở phía -Z.
  function placements(DATA, H) {
    const { make, box, by } = H;
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const c = DATA.creative || {};
    const first = code => (by(code) || [])[0];
    const rcuPart = first('BE-5158');
    const basePart = first('BP-8818');
    if (!rcuPart || !basePart) return {};
    const rcu = box([rcuPart]);
    const base = box([basePart]);
    const sensorPart = first('BE-1153');
    const sensor = sensorPart ? box([sensorPart]) : base;
    const top = Math.max(rcu.hi[1], base.hi[1]);
    const front = Math.min(base.lo[2], sensor.lo[2]);
    // Dời tâm mesh gốc đến vị trí gắn mới, giữ nguyên hình học và hướng CAD.
    const reused = (source, center, name, colorCode) => {
      if (!source) return null;
      const old = box([source]).center;
      const pos = source.pos.map((v, i) => v + center[i] - old[i]);
      return { ...make(null, pos, source.rotation, source.meshes, name), colorCode };
    };
    const attach = (name, center, source, colorCode) =>
      c[name] && c[name].length
        ? make(null, center, I, c[name], name)
        : reused(source, center, name, colorCode);
    const out = {};
    out['back:tank'] = [attach('tank', [rcu.center[0], top + 0.026, rcu.center[2] + 0.012], rcuPart, '(16)')];
    out['roof:solar'] = [attach('solar', [rcu.center[0], top + 0.056, rcu.center[2]], basePart, '(09)')];
    out['front:pump'] = [attach('pump', [base.center[0], base.center[1] + 0.015, front - 0.024], first('BP-7073'), '(06)')];
    for (const key of Object.keys(out)) out[key] = out[key].filter(Boolean);
    return out;
  }

  window.LESSON = {
    id: 'lop3-bai11',
    label: 'Bài 11',
    code: 'ZM3-11',
    sheetName: 'Lớp 3 · Bài 11: Sống trên sao Hỏa – Tìm kiếm nguồn nước',
    store: 'zm3b11_',
    baseName: 'Thân robot',
    Engine: 'WaterEngine',
    defaultMode: 'pro', // Lớp 3: mở ở chế độ Nâng cao (hiện số liệu, thi đấu tìm nước)

    book(d) {
      return {
        src: `assets/lop3-bai11/step-${String(d.step).padStart(2, '0')}.jpg`,
        alt: `Bước ${d.step}: hình hướng dẫn lắp ráp robot tìm nguồn nước`,
        loc: `Bước ${d.step} · trang ${d.page}`,
        cap: d.step === d.total ? 'Robot tìm kiếm nguồn nước đã hoàn thành.' : 'Quan sát vị trí linh kiện và lắp theo hình hướng dẫn.',
        pdf: `references/lop3/bai11/bai11.pdf#page=${d.page}`
      };
    },

    missions: { core: ['m1', 'm2', 'm3', 'm4'], pro: ['m5'] },
    cards: {
      m2: { n: 2, title: 'Ghép khối giống hàng mẫu', text: 'Ghép đúng chương trình trong phiếu: Start, lặp lại { động cơ chạy, chờ cảm biến thấy vật cản, Stop, chờ 3 giây }. Chạy hết một vòng lặp.' },
      m3: { n: 3, title: 'Lấy đủ nước ở 3 mỏm băng', text: 'Robot chạy dọc đường trên sao Hỏa, cảm biến thấy mỏm băng thì dừng lại và bơm nước 3 giây. Lấy đủ mẫu nước ở cả 3 mỏm băng!' },
      m4: { n: 4, title: 'Thử robot sáng tạo', text: 'Gắn thêm chi tiết ở chặng Sáng tạo, rồi quay lại chạy chương trình.', go: ['creative', 'Đến xưởng sáng tạo'] },
      m5: { n: 5, title: 'Thi đấu tìm nước nhanh nhất', text: 'Đường dài hơn, mỏm băng ở chỗ mới. Lấy đủ nước ở 3 mỏm trong 18 giây: chọn tốc độ phù hợp (chạy chậm quá sẽ không kịp) và thử gắn máy bơm mạnh.' },
      m1: { n: 1, title: 'Lắp xong robot tìm nước', text: 'Bấm “Đã lắp xong bước này” ở cả 15 bước của chặng Lắp ráp.', go: ['assembly', 'Đến chặng lắp ráp'] }
    },
    cardOrder: { kid: ['m2', 'm3', 'm4', 'm1'], pro: ['m2', 'm3', 'm4', 'm5', 'm1'] },

    // Chương trình mẫu trong phiếu học tập: Start → Repeat → động cơ chạy → Chờ vật cản (cảm biến) → Stop → Wait 3s → Repeat End
    blocks: {
      toolbox: ['obstacle', 'lowSpeed', 'highSpeed', 'motorStop', 'wait', 'melodyA'],
      pro: ['motorPower', 'motorReverse'],
      sample: ['start', 'repeatStart', 'lowSpeed', 'obstacle', 'motorStop', ['wait', { duration: 3 }], 'repeatEnd'],
      empty: ['start', 'repeatStart', 'repeatEnd']
    },

    details(t) {
      const out = [];
      if (t.state.best) out.push(`Lấy đủ nước sau ${t.state.best.secs} giây (${t.state.best.liters} lít)`);
      if (t.state.upgrades && t.state.upgrades.length) out.push('Gói nâng cấp: ' + t.state.upgrades.join(', '));
      return out.join(' · ');
    },

    creative: {
      store: 'zm3b11.creative',
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
