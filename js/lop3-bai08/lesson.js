// Cấu hình Lớp 3 · Bài 8 – Giải cứu máy bay (giàn bay hai động cơ). Phần dùng chung đọc window.LESSON;
// phần riêng của bài là js/lop3-bai08/rescue-engine.js + rescue-scene.js (+ art.js do công cụ vẽ cung cấp, nếu có).
// Mô hình: động cơ M1 trên đỉnh quay cần ngang → máy bay bay vòng; động cơ M2 dưới chân quay trục vít → tay quay
// bập bênh cụm trên → máy bay lên/xuống. Trong DATA.drive: 'output' = cụm cần + máy bay (M1), 'tilt' = cụm trên (M2).
(function () {
  'use strict';

  // Số lượng trong hộp kit ZM Alpha 330 (set2321A)
  const KIT = { 'BP-7017': 2, 'BP-7018': 2, 'BP-7012': 40, 'BP-8813': 2, 'BP-3990': 5, 'BP-7024': 6 };
  const NAMES = {
    'BP-7017': 'Cánh máy bay trái',
    'BP-7018': 'Cánh máy bay phải',
    'BP-7012': 'Chốt đen',
    'BP-8813': 'Khối 3 cánh (đĩa radar)',
    'BP-3990': 'Trục 2',
    'BP-7024': 'Bạc nửa vàng (đèn)'
  };
  const FEATURES = {
    light: { text: 'Đèn pha: thấy người gặp nạn trong sương mù và cứu được ở đó' },
    wings: { text: 'Cánh dài hơn: máy bay vững hơn, chịu bão lâu gấp đôi (Nâng cao)' },
    radar: { text: 'Radar trên mũi: quét xa gấp đôi, tìm thấy người gặp nạn sớm hơn' }
  };
  const SLOTS = [
    { id: 'nose', name: 'Mũi máy bay', options: [{ id: 'radar', label: 'Radar', parts: { 'BP-8813': 1, 'BP-3990': 1 }, feature: 'radar' }] },
    { id: 'belly', name: 'Bụng máy bay', options: [{ id: 'light', label: 'Đèn pha', parts: { 'BP-7024': 2, 'BP-3990': 1 }, feature: 'light' }] },
    { id: 'wing', name: 'Hai đầu cánh', options: [{ id: 'wings', label: 'Cánh dài hơn', parts: { 'BP-7017': 1, 'BP-7018': 1, 'BP-7012': 2 }, feature: 'wings' }] }
  ];
  const PRESETS = [
    { id: 'radar', title: 'Radar trên mũi', text: 'Quét xa hơn để tìm người gặp nạn.', pick: { nose: 'radar' } },
    { id: 'light', title: 'Đèn pha', text: 'Soi sáng vùng sương mù.', pick: { belly: 'light' } },
    { id: 'wings', title: 'Cánh dài hơn', text: 'Nối thêm cặp cánh, bay vững trong gió bão.', pick: { wing: 'wings' } }
  ];
  // Hình gói: lấy từ js/lop3-bai08/art.js (RescueArt.PICS) khi có; tạm dùng hình đơn giản
  const plane = extra =>
    `<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M8 26h40l8-6v12l-8-6" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6" stroke-linejoin="round"/><path d="M26 26L18 8h8l10 18M26 26l-8 14h8l10-14" fill="#fff" stroke="#1e2a34" stroke-width="1.6" stroke-linejoin="round"/>${extra}</svg>`;
  const FALLBACK_PICS = {
    radar: plane('<path d="M56 16a8 8 0 0 1 0 16" fill="none" stroke="#e53935" stroke-width="2.4"/><path d="M60 12a13 13 0 0 1 0 24" fill="none" stroke="#e53935" stroke-width="1.6" opacity=".6"/>'),
    light: plane('<path d="M30 28l-10 18h22z" fill="#ffd23f" opacity=".75"/><circle cx="31" cy="29" r="3" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>'),
    wings: plane('<path d="M18 8l-6-6h8l6 6M18 40l-6 6h8l6-6" fill="#fff" stroke="#1e2a34" stroke-width="1.6" stroke-linejoin="round"/>')
  };
  const PICS = new Proxy({}, { get: (_, k) => (window.RescueArt && window.RescueArt.PICS && window.RescueArt.PICS[k]) || FALLBACK_PICS[k] });

  // Chi tiết sáng tạo gắn vào máy bay: quay theo cần (drive 'output'), cần lại nghiêng theo tháp (drive 'tilt')
  function placements(DATA, H) {
    const { add, sub, scale, norm, make, box, by } = H;
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const d = DATA.drive.output;
    const wingL = by('BP-7017')[0],
      wingR = by('BP-7018')[0];
    const body = box([wingL, wingR, ...by('BP-7075')]);
    // Hướng bay = tiếp tuyến vòng quay tại máy bay: trục quay × (tâm máy bay − điểm trên trục)
    const r = sub(body.center, d.point);
    const ax = d.axis;
    const fwd = norm([ax[1] * r[2] - ax[2] * r[1], ax[2] * r[0] - ax[0] * r[2], ax[0] * r[1] - ax[1] * r[0]]);
    const half = Math.abs(fwd[0]) * (body.hi[0] - body.lo[0]) / 2 + Math.abs(fwd[2]) * (body.hi[2] - body.lo[2]) / 2;
    const onArm = list => list.map(p => ({ ...p, drive: 'output' }));
    // Cánh dài: chép cánh thật, dời ra ngoài 70% bề rộng cánh theo hướng sải cánh (từ thân ra đầu cánh)
    const longer = [wingL, wingR].map(w => {
      const b = box([w]),
        out = sub(b.center, body.center);
      out[1] = 0;
      return make(w, add(w.pos, scale(norm(out), 0.6 * Math.max(b.hi[0] - b.lo[0], b.hi[2] - b.lo[2]))));
    });
    return {
      'nose:radar': onArm([make(null, add(body.center, scale(fwd, half)), I, DATA.creative.radar, 'radar')]),
      'belly:light': onArm([make(null, [body.center[0], body.lo[1], body.center[2]], I, DATA.creative.light, 'light')]),
      'wing:wings': onArm(longer)
    };
  }

  window.LESSON = {
    id: 'lop3-bai08',
    label: 'Bài 8',
    code: 'ZM3-08',
    sheetName: 'Lớp 3 · Bài 8: Giải cứu máy bay',
    store: 'zm3b08_',
    baseName: 'Máy bay cứu hộ',
    Engine: 'RescueEngine',
    defaultMode: 'pro', // Lớp 3: mở ở chế độ Nâng cao (hiện số liệu, tính toán, thử thách bão)

    book(d) {
      const src = `assets/lop3-bai08/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Trang ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.step} · trang ${d.page}`,
        cap: d.step === d.total ? 'Giàn bay máy bay cứu hộ đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
        pdf: src
      };
    },

    missions: { core: ['m1', 'm2', 'm3', 'm4'], pro: ['m5'] },
    cards: {
      m2: { n: 2, title: 'Ghép khối giống hàng mẫu', text: 'Ghép đúng chương trình trong sách: M1, M2 chậm → nhanh → chậm ngược → nhanh ngược, mỗi lần chờ 3 giây, lặp lại. Chạy hết một vòng lặp.' },
      m3: { n: 3, title: 'Cứu 3 người gặp nạn', text: 'Hạ máy bay xuống thấp (M2) và bay chậm (M1 Low) khi đi ngang người gặp nạn để thả thang. Cứu đủ 3 người!' },
      m4: { n: 4, title: 'Thử máy bay sáng tạo', text: 'Gắn thêm chi tiết ở chặng Sáng tạo, rồi quay lại chạy chương trình.', go: ['creative', 'Đến xưởng sáng tạo'] },
      m5: { n: 5, title: 'Cứu nạn trong bão', text: 'Bão kéo tới theo lượt: khi có bão phải bay lên cao trên mây, trời quang mới hạ thấp để cứu. Cứu đủ 3 người mà không bị rung lắc làm rơi người.' },
      m1: { n: 1, title: 'Lắp xong giàn bay', text: 'Bấm “Đã lắp xong bước này” ở cả 30 bước của chặng Lắp ráp.', go: ['assembly', 'Đến chặng lắp ráp'] }
    },
    cardOrder: { kid: ['m2', 'm3', 'm4', 'm1'], pro: ['m2', 'm3', 'm4', 'm5', 'm1'] },

    // Chương trình mẫu trong slide bài giảng: Start, Repeat, M1 Low, M2 Low, Wait 3s, M1 High, M2 High, Wait 3s,
    // M1 Low ngược, M2 Low ngược, Wait 3s, M1 High ngược, M2 High ngược, Wait 3s, Repeat End
    blocks: {
      toolbox: ['m1Motor', 'm2Motor', 'wait', 'motorStop', 'melodyA'],
      pro: [],
      sample: [
        'start', 'repeatStart',
        ['m1Motor', { speed: 'low', name: 'Low Speed' }], ['m2Motor', { speed: 'low', name: 'Low Speed' }], 'wait',
        ['m1Motor', { speed: 'high', name: 'High Speed' }], ['m2Motor', { speed: 'high', name: 'High Speed' }], 'wait',
        ['m1Motor', { speed: 'low', dir: 'ccw', name: 'Low Speed' }], ['m2Motor', { speed: 'low', dir: 'ccw', name: 'Low Speed' }], 'wait',
        ['m1Motor', { speed: 'high', dir: 'ccw', name: 'High Speed' }], ['m2Motor', { speed: 'high', dir: 'ccw', name: 'High Speed' }], 'wait',
        'repeatEnd'
      ],
      empty: ['start', 'repeatStart', 'repeatEnd']
    },

    details(t) {
      const out = [];
      if (t.state.best) out.push(`Cứu đủ 3 người sau ${t.state.best.secs} giây`);
      if (t.state.upgrades && t.state.upgrades.length) out.push('Gói nâng cấp: ' + t.state.upgrades.join(', '));
      return out.join(' · ');
    },

    creative: {
      store: 'zm3b08.creative',
      kit: KIT,
      names: NAMES,
      features: FEATURES,
      slots: SLOTS,
      pics: PICS,
      presets: PRESETS,
      emptyText: 'Máy bay cơ bản – chưa có tính năng mới.',
      placements
    }
  };
})();
