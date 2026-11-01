// Cấu hình Lớp 3 · Bài 9 – Vượt bão (thuyền một động cơ, bánh xe). Phần dùng chung đọc window.LESSON;
// phần riêng của bài là js/lop3-bai09/storm-engine.js + storm-scene.js (+ art.js do công cụ vẽ cung cấp, nếu có).
// Mô hình: động cơ M1 truyền qua bánh răng xuống bánh xe → thuyền chạy; hai cánh trắng là buồm. Trong DATA.drive:
// 'output' = các chi tiết quay theo M1 (bánh xe); nếu bản dựng chưa có drive thì sa bàn 3D chỉ hiển thị tĩnh.
(function () {
  'use strict';

  // Số lượng trong hộp kit ZM Alpha 330 (set2321A)
  const KIT = { 'BP-7017': 2, 'BP-7018': 2, 'BP-7012': 40, 'BP-3976': 2, 'BP-7011': 15, 'BP-7023': 6, 'BP-7024': 6 };
  const NAMES = {
    'BP-7017': 'Cánh trắng trái (buồm)',
    'BP-7018': 'Cánh trắng phải (buồm)',
    'BP-7012': 'Chốt đen',
    'BP-3976': 'Khung 5×7',
    'BP-7011': 'Chốt dài xanh dương',
    'BP-7023': 'Bạc chặn trục',
    'BP-7024': 'Bạc nửa vàng (đèn)'
  };
  const FEATURES = {
    float: { text: 'Phao thăng bằng hai bên: chịu sóng gấp đôi lâu, khó lật khi qua bão (Nâng cao)' },
    light: { text: 'Đèn dẫn đường: thấy đá ngầm từ xa, qua bãi đá được ở tốc độ Medium' },
    sail: { text: 'Buồm thêm: hứng gió, thuyền nhanh hơn 25% khi trời quang' }
  };
  const SLOTS = [
    { id: 'side', name: 'Hai bên thân', options: [{ id: 'float', label: 'Phao thăng bằng', parts: { 'BP-3976': 2, 'BP-7012': 4 }, feature: 'float' }] },
    { id: 'bow', name: 'Mũi thuyền', options: [{ id: 'light', label: 'Đèn dẫn đường', parts: { 'BP-7024': 2, 'BP-7023': 1 }, feature: 'light' }] },
    { id: 'mast', name: 'Cột buồm', options: [{ id: 'sail', label: 'Buồm thêm', parts: { 'BP-7017': 1, 'BP-7018': 1, 'BP-7012': 2 }, feature: 'sail' }] }
  ];
  const PRESETS = [
    { id: 'float', title: 'Phao thăng bằng', text: 'Thân vững hơn khi sóng to.', pick: { side: 'float' } },
    { id: 'light', title: 'Đèn dẫn đường', text: 'Nhìn thấy bãi đá ngầm sớm.', pick: { bow: 'light' } },
    { id: 'sail', title: 'Buồm thêm', text: 'Hứng gió để chạy nhanh hơn.', pick: { mast: 'sail' } }
  ];
  // Hình gói: lấy từ js/lop3-bai09/art.js (window.StormArt.PICS) khi có; tạm dùng hình đơn giản
  const boat = extra =>
    `<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M6 30h52l-8 12H14z" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.6" stroke-linejoin="round"/><path d="M30 28V6l14 20z" fill="#fff" stroke="#1e2a34" stroke-width="1.6" stroke-linejoin="round"/>${extra}</svg>`;
  const FALLBACK_PICS = {
    float: boat('<ellipse cx="6" cy="38" rx="6" ry="4" fill="#ff8a3d" stroke="#1e2a34" stroke-width="1.4"/><ellipse cx="58" cy="38" rx="6" ry="4" fill="#ff8a3d" stroke="#1e2a34" stroke-width="1.4"/>'),
    light: boat('<path d="M58 28l6-6v12z" fill="#ffd23f" opacity=".8"/><circle cx="56" cy="29" r="3" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.2"/>'),
    sail: boat('<path d="M28 28V12L16 28z" fill="#fff" stroke="#1e2a34" stroke-width="1.6" stroke-linejoin="round"/>')
  };
  const PICS = new Proxy({}, { get: (_, k) => (window.StormArt && window.StormArt.PICS && window.StormArt.PICS[k]) || FALLBACK_PICS[k] });

  // Tận dụng mesh sẵn có của kit cho phao/đèn và hai cánh buồm phụ.
  function placements(DATA, H) {
    const { add, make, box } = H;
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const cr = DATA.creative || {};
    const body = box(DATA.instances);
    const c = body.center;
    const part = (key, mesh, pos, rotation = I) =>
      Number.isInteger(mesh) && DATA.meshes[mesh] ? make(null, pos, rotation, [mesh], key) : null;
    const filter = list => list.filter(Boolean);
    const float = cr.float?.length ? filter([-1, 1].map(side => part('float', cr.float[0],
      [c[0], body.lo[1] + 0.015, side < 0 ? body.lo[2] - 0.018 : body.hi[2] + 0.018]))) : [];
    const light = cr.light?.length ? filter([-1, 1].map(side => part('light', cr.light[0],
      [body.hi[0] + 0.016, c[1], c[2] + side * 0.018]))) : [];
    const sail = cr.sail?.length === 2 ? filter(cr.sail.map((mesh, i) => {
      const original = DATA.instances.find(x => x.meshes.includes(mesh));
      return part('sail', mesh, add([c[0], body.hi[1] + 0.024, c[2]], [0, 0, (i ? 1 : -1) * 0.015]), original?.rotation || I);
    })) : [];
    return {
      'side:float': float,
      'bow:light': light,
      'mast:sail': sail
    };
  }

  window.LESSON = {
    id: 'lop3-bai09',
    label: 'Bài 9',
    code: 'ZM3-09',
    sheetName: 'Lớp 3 · Bài 9: Vượt bão',
    store: 'zm3b09_',
    baseName: 'Thuyền vượt bão',
    Engine: 'StormEngine',
    defaultMode: 'pro', // Lớp 3: mở ở chế độ Nâng cao (hiện số liệu, tính toán, thử thách bão)

    book(d) {
      const src = `assets/lop3-bai09/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Trang ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.step} · trang ${d.page}`,
        cap: d.step === d.total ? 'Thuyền vượt bão đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
        pdf: src
      };
    },

    missions: { core: ['m1', 'm2', 'm3', 'm4'], pro: ['m5'] },
    cards: {
      m2: { n: 2, title: 'Ghép khối giống hàng mẫu', text: 'Ghép đúng chương trình mẫu: M1 chạy chậm → vừa → nhanh, mỗi lần chờ 3 giây, lặp lại. Chạy hết một vòng lặp.' },
      m3: { n: 3, title: 'Vượt biển, cập cảng', text: 'Cho thuyền chạy nhanh ngoài khơi, nhưng chạy chậm (Low) khi qua bãi đá ngầm. Tới cảng ở 30 m mà không va đá!' },
      m4: { n: 4, title: 'Thử thuyền sáng tạo', text: 'Gắn thêm chi tiết ở chặng Sáng tạo, rồi quay lại chạy chương trình.', go: ['creative', 'Đến xưởng sáng tạo'] },
      m5: { n: 5, title: 'Vượt bão ra khơi', text: 'Bão kéo tới theo lượt: gió đẩy lùi thuyền, chạy nhanh sẽ bị sóng làm lật. Chọn tốc độ hợp lý hoặc dừng chờ bão tan, rồi cập cảng.' },
      m1: { n: 1, title: 'Lắp xong thuyền', text: 'Bấm “Đã lắp xong bước này” ở cả 27 bước của chặng Lắp ráp.', go: ['assembly', 'Đến chặng lắp ráp'] }
    },
    cardOrder: { kid: ['m2', 'm3', 'm4', 'm1'], pro: ['m2', 'm3', 'm4', 'm5', 'm1'] },

    // Chương trình mẫu: Start, Repeat, Low Speed, Wait 3s, Medium Speed, Wait 3s, High Speed, Wait 3s, Repeat End
    blocks: {
      toolbox: ['lowSpeed', 'mediumSpeed', 'highSpeed', 'wait', 'motorStop', 'melodyA'],
      pro: [],
      sample: [
        'start', 'repeatStart',
        'lowSpeed', 'wait', 'mediumSpeed', 'wait', 'highSpeed', 'wait',
        'repeatEnd'
      ],
      empty: ['start', 'repeatStart', 'repeatEnd']
    },

    details(t) {
      const out = [];
      if (t.state.best) out.push(`Cập cảng sau ${t.state.best.secs} giây`);
      if (t.state.upgrades && t.state.upgrades.length) out.push('Gói nâng cấp: ' + t.state.upgrades.join(', '));
      return out.join(' · ');
    },

    creative: {
      store: 'zm3b09.creative',
      kit: KIT,
      names: NAMES,
      features: FEATURES,
      slots: SLOTS,
      pics: PICS,
      presets: PRESETS,
      emptyText: 'Thuyền cơ bản – chưa có tính năng mới.',
      placements
    }
  };
})();
