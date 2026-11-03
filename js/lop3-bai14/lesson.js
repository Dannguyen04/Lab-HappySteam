// Cấu hình Bài 14 lớp 3 – Cây đàn ghi-ta. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop3/bai14/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop3/bai14/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop3-bai14",
    "label": "Bài 14",
    "code": "ZM3-14",
    "sheetName": "Lớp 3 · Bài 14: Cây đàn ghi-ta",
    "store": "zm3b14_",
    "baseName": "Cây đàn ghi-ta",
    "Engine": "GuitarEngine",
    "defaultMode": "pro",
    "missions": {
      "core": [
        "m1",
        "m2",
        "m3",
        "m4"
      ],
      "pro": [
        "m5"
      ]
    },
    "cards": {
      "m1": {
        "n": 1,
        "title": "Lắp cây đàn ghi-ta",
        "text": "Bấm “Đã lắp xong bước này” ở cả 23 bước của chặng Lắp ráp.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Chạy đúng chương trình mẫu",
        "text": "Lắp đúng bảy khối như giáo án. Khi khán giả đưa tay gần cảm biến, đàn phát A; khi rút tay, đàn phát B, hoàn tất một vòng."
      },
      "m3": {
        "n": 3,
        "title": "Chơi theo yêu cầu khán giả",
        "text": "Khán giả muốn nghe B khi đưa tay lại gần và A khi rút tay. Hãy đổi hai khối giai điệu; thiếu hoặc sai khối chờ sẽ không đạt."
      },
      "m4": {
        "n": 4,
        "title": "Nâng cấp sân khấu ghi-ta",
        "text": "Thử hộp cộng hưởng, dây đàn màu, đèn sân khấu hoặc giá đỡ và quan sát thay đổi trên sân khấu.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Đợi đúng nhịp khán giả",
        "text": "Nâng cao: biểu diễn B–A đúng cả ba lượt có thời gian che cảm biến khác nhau. Đừng phát nốt khi cảm biến chưa đổi trạng thái."
      }
    },
    "cardOrder": {
      "kid": [
        "m2",
        "m3",
        "m4",
        "m1"
      ],
      "pro": [
        "m2",
        "m3",
        "m4",
        "m5",
        "m1"
      ]
    },
    "blocks": {
      "toolbox": [
        "obstacle",
        "waitClear",
        "melodyA",
        "melodyB"
      ],
      "pro": [],
      "sample": [
        "start",
        "repeatStart",
        "obstacle",
        "melodyA",
        "waitClear",
        "melodyB",
        "repeatEnd"
      ],
      "empty": [
        "start",
        "repeatStart",
        "repeatEnd"
      ]
    },
    "sampleSig": [
      "start",
      "repeatStart",
      "sensor_obstacle",
      "melody",
      "wait_clear",
      "melody",
      "repeatEnd"
    ],
    "creative": {
      "store": "zm3b14.creative",
      "emptyText": "Cây đàn ghi-ta cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Số lượng trong hộp kit và tên tiếng Việt của các chi tiết gói sáng tạo
  // Phụ kiện gợi ý cho xưởng là linh kiện bổ sung, số lượng do giáo viên kiểm kit trước giờ học.
  const KIT = { 'BP-7528': 8, 'BP-7073': 8, 'BP-7011': 30, 'BP-7523A': 12, 'BP-7006': 12 };
  const NAMES = {
    'BP-7528': 'Thanh dài 15 lỗ', 'BP-7073': 'Thanh cong',
    'BP-7011': 'Chốt xanh', 'BP-7523A': 'Thanh 3 lỗ', 'BP-7006': 'Khối nối'
  };
  const FEATURES = {
    resonator: { text: 'Hộp cộng hưởng: thân đàn trông đầy đặn hơn; là minh họa sóng âm, không tăng âm lượng loa thật.' },
    glowStrings: { text: 'Dây đàn màu: tạo điểm nhấn các dây và hiệu ứng nốt đang phát.' },
    stageLights: { text: 'Đèn sân khấu: đèn minh họa thay đổi theo nốt A hoặc B.' },
    stand: { text: 'Giá đỡ: gợi ý chân chống giúp mô hình đứng ổn định khi biểu diễn.' }
  };
  const SLOTS = [
    { id: 'body', name: 'Hai bên thân đàn', options: [{ id: 'resonator', label: 'Hộp cộng hưởng', feature: 'resonator', parts: { 'BP-7073': 2, 'BP-7011': 2 } }] },
    { id: 'strings', name: 'Dọc cần đàn', options: [{ id: 'glowStrings', label: 'Dây đàn màu', feature: 'glowStrings', parts: { 'BP-7528': 2, 'BP-7011': 2 } }] },
    { id: 'lights', name: 'Phía trên sân khấu', options: [{ id: 'stageLights', label: 'Đèn sân khấu', feature: 'stageLights', parts: { 'BP-7523A': 2, 'BP-7006': 2 } }] },
    { id: 'base', name: 'Bên dưới thân đàn', options: [{ id: 'stand', label: 'Giá đỡ', feature: 'stand', parts: { 'BP-7528': 2, 'BP-7006': 2 } }] }
  ];
  const PRESETS = [
    { id: 'resonator', title: 'Hộp cộng hưởng', text: 'Thân đàn đầy đặn và sóng âm trực quan.', pick: { body: 'resonator' } },
    { id: 'glowStrings', title: 'Dây đàn màu', text: 'Dây đàn nổi bật khi phát nhạc.', pick: { strings: 'glowStrings' } },
    { id: 'stageLights', title: 'Đèn sân khấu', text: 'Đèn minh họa thay đổi theo nốt.', pick: { lights: 'stageLights' } },
    { id: 'stand', title: 'Giá đỡ', text: 'Thêm điểm tựa cho cây đàn.', pick: { base: 'stand' } }
  ];
  const pic = (color, shape) => '<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="5" y="4" width="54" height="40" rx="10" fill="#f8f3e8" stroke="#334155" stroke-width="2"/><g fill="' + color + '" stroke="#334155" stroke-width="2">' + shape + '</g></svg>';
  const PICS = {
    resonator: pic('#c78745', '<ellipse cx="32" cy="24" rx="17" ry="15"/><circle cx="32" cy="24" r="6" fill="#334155"/>'),
    glowStrings: pic('#50c4e7', '<path d="M20 10v28M28 10v28M36 10v28M44 10v28" fill="none"/>'),
    stageLights: pic('#ffd23f', '<path d="M15 14h34l-9 15H24z"/><path d="M22 31L13 39M42 31l9 8" fill="none"/>'),
    stand: pic('#7b9a9f', '<path d="M32 9v23M32 30L16 39M32 30l16 9" fill="none"/>')
  };
  // Vị trí 3D của chi tiết mỗi gói: trả về { 'slot:option': [chi tiết…] }
  function placements(DATA, H) {
    const parts = DATA.instances || [];
    if (!parts.length) return {};
    const src = name => parts.find(p => p.name === name);
    const pos = parts.map(p => p.pos);
    const minX = Math.min(...pos.map(p => p[0]));
    const maxX = Math.max(...pos.map(p => p[0]));
    const maxY = Math.max(...pos.map(p => p[1]));
    const minY = Math.min(...pos.map(p => p[1]));
    const midZ = (Math.min(...pos.map(p => p[2])) + Math.max(...pos.map(p => p[2]))) / 2;
    const attach = (name, positions) => {
      const item = src(name);
      return item ? positions.map(p => H.make(item, p)) : [];
    };
    return {
      'body:resonator': attach('BP-7073', [[minX - 0.025, 0.05, midZ], [maxX + 0.025, 0.05, midZ]]),
      'strings:glowStrings': attach('BP-7528', [[-0.018, 0.22, midZ + 0.025], [0.018, 0.22, midZ + 0.025]]),
      'lights:stageLights': attach('BP-7523A', [[minX, maxY + 0.035, midZ], [maxX, maxY + 0.035, midZ]]),
      'base:stand': attach('BP-7528', [[minX - 0.02, minY - 0.015, midZ], [maxX + 0.02, minY - 0.015, midZ]])
    };
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const n = d.step || d.page;
      const src = `assets/lop3-bai14/step-${String(n).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Hình bước ${n} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${n} · trang ${n}`,
        cap: n === 23 ? 'Cây đàn ghi-ta đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
        pdf: src
      };
    },
    details(t) {
      const out = [];
      if (t.state.upgrades && t.state.upgrades.length) out.push('Gói nâng cấp: ' + t.state.upgrades.join(', '));
      return out.join(' · ');
    },
    creative: { ...SPEC.creative, kit: KIT, names: NAMES, features: FEATURES, slots: SLOTS, pics: PICS, presets: PRESETS, placements }
  };
})();
