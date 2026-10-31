// Cấu hình Lớp 1 · Bài 9 – Thông tin liên lạc vũ trụ. Các phần dùng chung (js/app.js, blocks-engine.js,
// mission-tracker.js, creative-lab.js) đọc window.LESSON; phần riêng của bài là simulation-engine.js + space-scene.js.
(function () {
  'use strict';

  // Hình in từng bước của sách (bản PDF này lược bước 20 – chỉ đổi góc nhìn, dùng hình bước 19)
  const BOOK_PAGES = { 1: 2, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 7, 11: 7, 12: 8, 13: 8, 14: 9,
    15: 9, 16: 10, 17: 10, 18: 11, 19: 11, 20: 11, 21: 12, 22: 12, 23: 13, 24: 13, 25: 14, 26: 14, 27: 15, 28: 15 };

  // ---------- Xưởng sáng tạo ----------
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
    { id: 'wingL', name: 'Đầu cánh pin bên trái', options: [{ id: 'frame', label: 'Khung 5×7', parts: { 'BP-3976': 1, 'BP-7011': 2 }, feature: 'solar' }] },
    { id: 'wingR', name: 'Đầu cánh pin bên phải', options: [{ id: 'frame', label: 'Khung 5×7', parts: { 'BP-3976': 1, 'BP-7011': 2 }, feature: 'solar' }] },
    {
      id: 'head',
      name: 'Mặt ngoài đầu vệ tinh',
      options: [
        { id: 'dish', label: 'Chảo ra-đa', parts: { 'BP-7045': 1, 'BP-3992': 1, 'BP-7023': 1 }, feature: 'radar' },
        { id: 'sensor', label: 'Cảm biến', parts: { sensor: 1, 'BP-7012': 2 }, feature: 'sensor' }
      ]
    },
    { id: 'front', name: 'Phía trước thân', options: [{ id: 'sensor', label: 'Cảm biến', parts: { sensor: 1, 'BP-7012': 2 }, feature: 'sensor' }] }
  ];
  // Hình minh họa nhỏ cho từng gói (học sinh nhỏ nhận ra gói mà không cần đọc chữ)
  const PICS = {
    solar: '<svg viewBox="0 0 64 48" aria-hidden="true"><g fill="#3dc1dc" stroke="#0e6f8a" stroke-width="1.5"><rect x="2" y="17" width="13" height="14"/><rect x="15" y="17" width="13" height="14"/><rect x="36" y="17" width="13" height="14"/><rect x="49" y="17" width="13" height="14"/></g><rect x="27" y="15" width="10" height="18" rx="2" fill="#fff" stroke="#1e2a34" stroke-width="1.5"/><path d="M8 17v-6M21 17v-6M42 17v-6M55 17v-6" stroke="#f2be00" stroke-width="2" stroke-linecap="round"/></svg>',
    radar: '<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M14 30a18 18 0 0 0 36 0z" fill="#dfe6ec" stroke="#1e2a34" stroke-width="1.8"/><path d="M32 30V12" stroke="#1e2a34" stroke-width="2"/><circle cx="32" cy="11" r="3" fill="#e8892b"/><path d="M40 8a10 10 0 0 1 8 8M43 3a16 16 0 0 1 11 11" stroke="#2a9bd8" stroke-width="2.2" fill="none" stroke-linecap="round"/><rect x="26" y="38" width="12" height="7" rx="1.5" fill="#fff" stroke="#1e2a34" stroke-width="1.5"/></svg>',
    sensor: '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="6" y="12" width="24" height="24" rx="4" fill="#fff" stroke="#1e2a34" stroke-width="1.8"/><circle cx="24" cy="24" r="5" fill="#1e2a34"/><path d="M36 16a12 12 0 0 1 0 16M42 11a19 19 0 0 1 0 26M48 6a26 26 0 0 1 0 36" stroke="#ea6ea9" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>'
  };
  const PRESETS = [
    { id: 'solar', icon: '⚡', title: 'Cánh pin kép', text: 'Thêm 2 khung 5×7 nối dài hai cánh pin mặt trời.', pick: { wingL: 'frame', wingR: 'frame' } },
    { id: 'radar', icon: '📡', title: 'Chảo ra-đa', text: 'Bánh răng 40 răng làm chảo thu sóng trên đầu vệ tinh.', pick: { head: 'dish' } },
    { id: 'sensor', icon: '🛡️', title: 'Cảm biến né thiên thạch', text: 'Gắn mô-đun cảm biến phía trước để phát hiện vật cản.', pick: { front: 'sensor' } }
  ];

  // Tính các mẫu linh kiện gắn thêm từ mô hình: { 'wingL:frame': [instance…], … }
  // Vị trí lấy từ khung cánh pin, tâm đầu vệ tinh, hướng cột anten, khung chữ H.
  function placements(DATA, H) {
    const { add, sub, scale, dot, norm, col, matMul, rotateTo, make, reach, box, by } = H;
    const all = DATA.instances,
      head = all.filter(p => p.groupPath === 'Main/Head'),
      base = all.filter(p => p.groupPath === 'Main'),
      headC = box(head).center;
    const out = {};
    // Chi tiết gắn trên đầu vệ tinh quay cùng cột anten trong sa bàn (bộ truyền 'output' của trình xem)
    const onHead = list => list.map(p => ({ ...p, drive: 'output' }));

    // Cánh pin: khung mới nối tiếp ngay phía ngoài khung cũ
    by('BP-3976')
      .map(f => ({ f, c: box([f]).center }))
      .sort((a, b) => a.c[0] - b.c[0])
      .forEach(({ f, c }, i) => {
        const d = norm(sub(c, headC)),
          width = reach([f], d, c) + reach([f], scale(d, -1), c);
        out[(i === 0 ? 'wingL' : 'wingR') + ':frame'] = onHead([make(f, add(f.pos, scale(d, width)))]);
      });

    // Hướng cột anten đi vào đầu vệ tinh: trục 5 trên cùng (trục dài theo cột 0 của ma trận)
    const mast = by('BP-3992')[0];
    let n = norm(col(mast.rotation, 0));
    if (dot(n, sub(headC, mast.pos)) < 0) n = scale(n, -1);
    const face = add(headC, scale(n, reach(head, n, headC) + 0.002));
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
      out['head:sensor'] = onHead([make(null, face, rotateTo([0, 1, 0], n), sensorMeshes, 'sensor')]);
      const hframe = by('BP-7620')[0],
        hb = box([hframe]).center,
        bc = box(base).center;
      let f = sub(hb, bc);
      f[1] = 0;
      f = norm(f);
      const top = hb[1] + reach([hframe], [0, 1, 0], hb);
      const theta = Math.atan2(f[0], f[2]),
        c = Math.cos(theta),
        s = Math.sin(theta);
      out['front:sensor'] = [make(null, [hb[0], top, hb[2]], [c, 0, -s, 0, 1, 0, s, 0, c], sensorMeshes, 'sensor')];
    }
    return out;
  }

  window.LESSON = {
    id: 'lop1-bai09',
    label: 'Bài 9',
    code: 'ZM9', // tiền tố mã tham chiếu khi hoàn thành
    sheetName: 'Bài 9: Thông tin liên lạc vũ trụ',
    store: 'zm9_', // khóa lưu chặng/chế độ của bài
    baseName: 'Thân vệ tinh',
    Engine: 'SimulationEngine',

    // Hình sách theo bước đang xem (sự kiện zm:step)
    book(d) {
      const shown = d.page === 20 ? 19 : d.page;
      return {
        src: `assets/official-assembly/step-${String(shown).padStart(2, '0')}.jpg`,
        alt: `Hình bước ${shown} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.page} · trang ${BOOK_PAGES[d.page]}`,
        cap: d.page === 20
          ? 'Bước 20 chỉ xoay mô hình sang góc khác, không thêm linh kiện – sách in gộp với bước 19.'
          : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
        pdf: `references/official/Bai9_Thong_tin_lien_lac_vu_tru.pdf#page=${BOOK_PAGES[d.page]}`
      };
    },

    // Nhiệm vụ: m1–m4 chính (đủ để nộp bài), m5–m6 chỉ ở chế độ Nâng cao
    missions: { core: ['m1', 'm2', 'm3', 'm4'], pro: ['m5', 'm6'] },
    // Thẻ nhiệm vụ ở chặng ③ theo thứ tự làm; go = nút đi tới chặng cần thiết
    cards: {
      m2: { n: 2, title: 'Ghép khối giống hàng mẫu', text: 'Đặt các khối giống hàng mẫu mờ, rồi chạm khối Start màu vàng.' },
      m3: { n: 3, title: 'Tránh đám đá thiên thạch', text: 'Trước khi vệ tinh tới đám đá, hãy cho vệ tinh quay ngược lại hoặc dừng lại. Gợi ý: Motor Power mức 4 → Melody B → Stop.' },
      m4: { n: 4, title: 'Thử vệ tinh sáng tạo', text: 'Gắn thêm chi tiết ở chặng Sáng tạo, rồi quay lại chạy chương trình.', go: ['creative', 'Đến xưởng sáng tạo'] },
      m5: { n: 5, title: 'Đợi thiên thạch bay qua', text: 'Thiên thạch bay ngang quỹ đạo 8 giây một lần và chặn đường 2,5 giây đầu. Cho vệ tinh dừng trước đường bay, đợi nó qua rồi chạy tiếp. Gợi ý: Motor Power → Chờ vật cản → Stop → Đợi đường trống → Motor Power. Hoặc tự tính số giây cho khối Wait.' },
      m6: { n: 6, title: 'Chụp ảnh vật lạ gửi về trạm', text: 'Quanh quỹ đạo có vật lạ (dấu ?). Ghép: Motor Power → Nếu thấy vật lạ [Chụp ảnh & gửi] Hết Nếu, đặt trong vòng lặp. Ảnh sẽ hiện trên màn hình trạm.' },
      m1: { n: 1, title: 'Lắp xong vệ tinh', text: 'Bấm “Đã lắp xong bước này” ở cả 28 bước của chặng Lắp ráp.', go: ['assembly', 'Đến chặng lắp ráp'] }
    },
    cardOrder: { kid: ['m2', 'm3', 'm4', 'm1'], pro: ['m2', 'm3', 'm4', 'm5', 'm6', 'm1'] },

    // Khối lệnh: khay (pro = chỉ chế độ Nâng cao), chương trình mẫu trong sách (ảnh "Lập trình.png"), chương trình trống
    blocks: {
      toolbox: ['melodyA', 'melodyB', 'highSpeed', 'motorPower', 'motorReverse', 'wait', 'motorStop', 'obstacle'],
      pro: ['waitClear', 'ifSee', 'photo'],
      sample: ['start', 'repeatStart', 'melodyA', 'highSpeed', ['wait', { duration: 3 }], 'melodyB', 'highSpeed', ['wait', { duration: 3 }], 'repeatEnd'],
      empty: ['start', 'repeatStart', 'repeatEnd']
    },

    // Chi tiết gửi kèm kết quả lên Google Sheets
    details(t) {
      const out = [];
      if (t.state.avoidanceMethod) out.push('Cách né: ' + (t.state.avoidanceMethod === 'reverse' ? 'đổi chiều' : 'Melody B + dừng'));
      if (t.state.upgrades && t.state.upgrades.length) out.push('Gói nâng cấp: ' + t.state.upgrades.join(', '));
      if (t.state.photos && t.state.photos.length) out.push('Ảnh gửi về: ' + t.state.photos.join(', '));
      return out.join(' · ');
    },

    creative: {
      store: 'zm9.creative',
      kit: KIT,
      names: NAMES,
      features: FEATURES,
      slots: SLOTS,
      pics: PICS,
      presets: PRESETS,
      emptyText: 'Vệ tinh cơ bản – chưa có tính năng mới.',
      placements
    }
  };
})();
