// Cấu hình Bài 15 lớp 3 – Robot đẩy xe. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop3/bai15/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop3/bai15/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop3-bai15",
    "label": "Bài 15",
    "code": "ZM3-15",
    "sheetName": "Lớp 3 · Bài 15: Robot đẩy xe",
    "store": "zm3b15_",
    "baseName": "Robot đẩy xe",
    "Engine": "PushEngine",
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
        "title": "Lắp robot đẩy xe",
        "text": "Bấm “Đã lắp xong bước này” ở cả 27 bước của chặng Lắp ráp.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Chạy chương trình mẫu",
        "text": "Lắp đúng 4 khối trong sách và nhấn Start: động cơ quay nhanh, hai chân bước và đẩy xe tiến lên."
      },
      "m3": {
        "n": 3,
        "title": "Đẩy xe tới vạch đích",
        "text": "Chương trình mẫu không tự dừng nên xe lao quá vạch. Thêm Chờ và Dừng: tốc độ nhanh là 20 cm/giây, em tính xem cần chờ bao nhiêu giây."
      },
      "m4": {
        "n": 4,
        "title": "Thử robot sáng tạo",
        "text": "Thử một trong bốn chi tiết 3D sáng tạo.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Giao hàng với tải thay đổi",
        "text": "Nâng cao: lượt 1 vạch 80 cm, lượt 2 xe chở nặng đi chậm hơn và vạch 45 cm, lượt 3 vạch 100 cm. Đạt lượt nào thì sang lượt kế; trượt thì chỉnh và chạy lại lượt đó."
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
        "highSpeed",
        "mediumSpeed",
        "lowSpeed",
        "wait",
        "motorStop"
      ],
      "pro": [
        "motorPower",
        "motorReverse"
      ],
      "sample": [
        "start",
        "repeatStart",
        "highSpeed",
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
      "motor:high",
      "repeatEnd"
    ],
    "creative": {
      "store": "zm3b15.creative",
      "emptyText": "Robot đẩy xe cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Số lượng trong hộp kit và tên tiếng Việt của các chi tiết gói sáng tạo
  // Định mức minh họa cho phụ kiện trong xưởng (chỉ áp dụng cho gói sáng tạo, không thay danh mục kit gốc).
  const KIT = { 'BP-7528': 2, 'BP-7073': 4, 'BP-7012': 12, 'BP-8818': 2, 'BP-3976': 2, 'BP-7524A': 4, 'BP-7024': 4, 'BP-7525A': 2 };
  const NAMES = {
    'BP-7528': 'Thanh dài 15 lỗ', 'BP-7073': 'Thanh cong', 'BP-7012': 'Chốt đen',
    'BP-8818': 'Khung đế 7×11', 'BP-3976': 'Khung 5×7',
    'BP-7524A': 'Thanh 5 lỗ', 'BP-7024': 'Bạc chặn nửa', 'BP-7525A': 'Thanh 7 lỗ'
  };
  const FEATURES = {
    wideHead: { text: 'Đầu đẩy rộng: lực đẩy trải đều, xe đi thẳng nên dừng chính xác hơn (sai số vạch đích thêm 1 cm).' },
    brace: { text: 'Thanh chống hai bên: xe chở nặng ít bị chao, đi nhanh hơn (hệ số tải nặng 0,75 lên 0,85).' },
    backStop: { text: 'Khung chặn hàng: thùng hàng không trượt về phía sau (trang trí, thêm thùng trên xe).' },
    tray: { text: 'Khay chở thùng có chốt giữ: đặt thùng hàng cố định trên xe (trang trí).' }
  };
  const SLOTS = [
    { id: 'head', name: 'Đầu đẩy của robot', options: [{ id: 'wideHead', label: 'Đầu đẩy rộng', feature: 'wideHead', parts: { 'BP-7525A': 1, 'BP-7073': 2, 'BP-7012': 4 } }] },
    { id: 'side', name: 'Hai bên xe hàng', options: [{ id: 'brace', label: 'Thanh chống hai bên', feature: 'brace', parts: { 'BP-7528': 2, 'BP-7012': 4 } }] },
    { id: 'back', name: 'Phía sau xe', options: [{ id: 'backStop', label: 'Khung chặn hàng', feature: 'backStop', parts: { 'BP-3976': 1, 'BP-7524A': 2, 'BP-7012': 2 } }] },
    { id: 'deck', name: 'Sàn xe hàng', options: [{ id: 'tray', label: 'Khay chở thùng', feature: 'tray', parts: { 'BP-8818': 1, 'BP-7024': 2, 'BP-7012': 2 } }] }
  ];
  const PRESETS = [
    { id: 'wideHead', title: 'Đầu đẩy rộng', text: 'Đẩy đều, xe đi thẳng.', pick: { head: 'wideHead' } },
    { id: 'brace', title: 'Thanh chống hai bên', text: 'Chống chao khi xe nặng.', pick: { side: 'brace' } },
    { id: 'backStop', title: 'Khung chặn hàng', text: 'Giữ thùng không trượt.', pick: { back: 'backStop' } },
    { id: 'tray', title: 'Khay chở thùng', text: 'Thùng nằm chắc trên xe.', pick: { deck: 'tray' } }
  ];
  const card = (color, icon) => `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="8" y="24" width="46" height="11" rx="3" fill="#f5efe0" stroke="#2b303b" stroke-width="2"/><circle cx="19" cy="39" r="6" fill="#2b303b"/><circle cx="45" cy="39" r="6" fill="#2b303b"/><g fill="${color}" stroke="#283c49" stroke-width="1.3">${icon}</g></svg>`;
  const PICS = {
    wideHead: card('#60d9e5', '<rect x="2" y="8" width="8" height="26" rx="2"/><path d="M10 20h12" fill="none"/>'),
    brace: card('#f5a033', '<path d="M10 36L22 22M54 36L42 22" fill="none" stroke-width="3"/><rect x="8" y="34" width="46" height="3"/>'),
    backStop: card('#e6594d', '<rect x="8" y="8" width="5" height="17"/><rect x="8" y="8" width="26" height="4"/>'),
    tray: card('#8c6138', '<rect x="12" y="20" width="40" height="4"/><rect x="22" y="8" width="20" height="12"/>')
  };
  // Mesh gói sáng tạo đã ở tọa độ tuyệt đối của mô hình nên đặt tại gốc.
  function placements(DATA, H) {
    const meshes = DATA.creative || {};
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const mk = kind => meshes[kind]?.length ? [H.make(null, [0, 0, 0], I, meshes[kind], kind)] : [];
    return {
      'head:wideHead': mk('wideHead'),
      'side:brace': mk('brace'),
      'back:backStop': mk('backStop'),
      'deck:tray': mk('tray')
    };
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const src = `assets/lop3-bai15/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Bước ${d.page}: hình sách hướng dẫn lắp robot đẩy xe`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: d.page === 27 ? 'Robot đẩy xe đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
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
