// Cấu hình Bài 2 lớp 3 – Di chuyển vật thể – Xe nâng hàng. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop3/bai02/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop3/bai02/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop3-bai02",
    "label": "Bài 2",
    "code": "ZM3-02",
    "sheetName": "Lớp 3 · Bài 2: Di chuyển vật thể",
    "store": "zm3b02_",
    "baseName": "Xe nâng",
    "Engine": "ForkliftEngine",
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
        "title": "Lắp xe nâng và giá pallet",
        "text": "Bấm “Đã lắp xong bước này” ở cả 31 bước của chặng Lắp ráp.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Chạy trọn chương trình mẫu",
        "text": "Lập trình 16 khối: M1 tiến đến vật cản; M2 hạ; M1 tiến vào 1 giây; M2 nâng; M1 lùi 3 giây."
      },
      "m3": {
        "n": 3,
        "title": "Căn càng và vận chuyển pallet",
        "text": "Mẫu tiến vào 1 giây nên càng chưa đỡ đúng pallet. Tăng thời gian tiến vào thành 2 giây, nâng rồi lùi 3 giây để về ô tập kết."
      },
      "m4": {
        "n": 4,
        "title": "Cải tiến xe nâng",
        "text": "Chọn và gắn một trong bốn nâng cấp vào xưởng sáng tạo, sau đó chạy mô phỏng.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Lùi xe an toàn khi có vật cản",
        "text": "Một xe hàng bất ngờ băng qua đường lùi sau khi nâng pallet. Thêm Đợi đường trống trước lệnh M1 lùi; lùi ngay khi còn vật cản sẽ thất bại."
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
        "m1Motor",
        "m2Motor",
        "obstacle",
        "motorStop",
        "wait",
        "waitClear"
      ],
      "pro": [
        "motorPower",
        "motorReverse"
      ],
      "sample": [
        "start",
        [
          "m1Motor",
          {
            "dir": "ccw"
          }
        ],
        "obstacle",
        "motorStop",
        [
          "m2Motor",
          {
            "dir": "ccw"
          }
        ],
        [
          "wait",
          {
            "duration": 1
          }
        ],
        "motorStop",
        [
          "m1Motor",
          {
            "dir": "ccw"
          }
        ],
        [
          "wait",
          {
            "duration": 1
          }
        ],
        "motorStop",
        [
          "m2Motor",
          {
            "dir": "cw"
          }
        ],
        [
          "wait",
          {
            "duration": 1
          }
        ],
        "motorStop",
        [
          "m1Motor",
          {
            "dir": "cw"
          }
        ],
        [
          "wait",
          {
            "duration": 3
          }
        ],
        "motorStop"
      ],
      "empty": [
        "start"
      ]
    },
    "sampleSig": [
      "start",
      "motor:low",
      "sensor_obstacle",
      "stop",
      "motor:low",
      "wait:1",
      "stop",
      "motor:low",
      "wait:1",
      "stop",
      "motor:low",
      "wait:1",
      "stop",
      "motor:low",
      "wait:3",
      "stop"
    ],
    "creative": {
      "store": "zm3b02.creative",
      "emptyText": "Xe nâng cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Số lượng trong hộp kit và tên tiếng Việt của các chi tiết gói sáng tạo
  // Định mức minh họa cho xưởng sáng tạo: số gốc trong mô hình + linh kiện đề xuất bổ sung.
  // Không phải lời xác nhận hộp kit thực tế có sẵn các phụ kiện này.
  const KIT = { 'BP-7526A': 6, 'BP-7012': 29, 'BP-3976': 2, 'BP-7095': 6,
    'BP-3035': 6, 'BP-7015': 9, 'BP-7078': 6 };
  const NAMES = { 'BP-7526A': 'Thanh càng dài', 'BP-7012': 'Chốt nối',
    'BP-3976': 'Khung chắn', 'BP-7095': 'Vành bánh xe', 'BP-3035': 'Lốp bánh xe',
    'BP-7015': 'Thanh gia cố', 'BP-7078': 'Thanh giữ đèn cảnh báo' };
  const FEATURES = {
    wideFork: { text: 'Càng nâng rộng giúp thử ý tưởng đỡ pallet lớn hơn (mô phỏng minh họa).' },
    backRest: { text: 'Khung chắn lưng giữ kiện hàng ổn định khi xe đổi hướng.' },
    twinWheels: { text: 'Cặp bánh sau phụ minh họa cách tăng độ vững của xe có tải.' },
    warning: { text: 'Cụm báo hiệu lùi nhắc người xung quanh tránh đường xe.' }
  };
  const SLOTS = [
    { id: 'fork', name: 'Hai bên càng nâng', options: [
      { id: 'wideFork', label: 'Càng nâng rộng', feature: 'wideFork', parts: { 'BP-7526A': 2, 'BP-7012': 4 } }] },
    { id: 'mast', name: 'Lưng càng nâng', options: [
      { id: 'backRest', label: 'Khung chắn lưng', feature: 'backRest', parts: { 'BP-3976': 1, 'BP-7012': 2 } }] },
    { id: 'rear', name: 'Hai bánh phía sau', options: [
      { id: 'twinWheels', label: 'Bánh sau kép', feature: 'twinWheels', parts: { 'BP-7095': 2, 'BP-3035': 2 } }] },
    { id: 'roof', name: 'Đuôi xe phía trên Hub', options: [
      { id: 'warning', label: 'Đèn/còi lùi', feature: 'warning', parts: { 'BP-7078': 2, 'BP-7015': 2 } }] }
  ];
  const PRESETS = [
    { id: 'wideFork', title: 'Càng nâng rộng', text: 'Đỡ pallet có bề ngang lớn.', pick: { fork: 'wideFork' } },
    { id: 'backRest', title: 'Khung chắn lưng', text: 'Giữ kiện hàng phía trước.', pick: { mast: 'backRest' } },
    { id: 'twinWheels', title: 'Bánh sau kép', text: 'Tăng độ vững của xe.', pick: { rear: 'twinWheels' } },
    { id: 'warning', title: 'Đèn/còi lùi', text: 'Báo hiệu khi xe lùi.', pick: { roof: 'warning' } }
  ];
  const card = (color, icon) => `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="8" y="23" width="48" height="13" rx="3" fill="#e5ebed" stroke="#263946" stroke-width="2"/><circle cx="18" cy="39" r="6" fill="#263946"/><circle cx="48" cy="39" r="6" fill="#263946"/><g fill="${color}" stroke="#263946" stroke-width="1.5">${icon}</g></svg>`;
  const PICS = {
    wideFork: card('#80d8e4', '<path d="M7 29V11h6v18M51 29V11h6v18"/>'),
    backRest: card('#b1d77b', '<rect x="26" y="7" width="16" height="18" rx="1"/><path d="M26 15h16" fill="none"/>'),
    twinWheels: card('#869fb2', '<circle cx="18" cy="39" r="9"/><circle cx="48" cy="39" r="9"/>'),
    warning: card('#ffc25c', '<path d="M27 23V9h14v14z"/><path d="M30 7l-3-4M38 7l3-4" fill="none"/>')
  };
  // Vị trí 3D của chi tiết mỗi gói: trả về { 'slot:option': [chi tiết…] }
  function placements(DATA, H) {
    const parts = DATA.instances || [];
    if (!parts.length) return {};
    // Dùng chính lưới sẵn có của xe để ghép thử ý tưởng; không đổi build.json gốc.
    const clone = (code, pred, pos) => {
      const src = H.by(code).find(pred) || H.by(code)[0];
      return src ? [H.make(src, pos)] : [];
    };
    const p = code => H.by(code);
    const side = (code, sign, pos) => clone(code, q => Math.sign(q.pos[0]) === sign, pos);
    return {
      'fork:wideFork': [
        ...side('BP-7526A', -1, [-0.064, 0.028, -0.003]),
        ...side('BP-7526A', 1, [0.064, 0.028, -0.003])
      ],
      'mast:backRest': clone('BP-3976', () => true, [0.001, 0.085, 0.018]),
      'rear:twinWheels': [
        ...side('BP-7095', -1, [-0.076, 0.016, 0.13]),
        ...side('BP-3035', -1, [-0.076, 0.016, 0.13]),
        ...side('BP-7095', 1, [0.076, 0.016, 0.13]),
        ...side('BP-3035', 1, [0.076, 0.016, 0.13])
      ],
      'roof:warning': [
        ...clone('BP-7078', () => true, [-0.014, 0.096, 0.154]),
        ...clone('BP-7078', () => true, [0.014, 0.096, 0.154])
      ]
    };
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const n = d.step || d.page;
      const src = `assets/lop3-bai02/step-${String(n).padStart(2, '0')}.jpg`;
      const captions = {
        25: 'Hoàn thiện khung xe nâng và liên kết động cơ.',
        26: 'Xe nâng đã lắp xong; chuẩn bị làm giá pallet riêng.',
        27: 'Bắt đầu lắp giá nâng vật thể độc lập.',
        28: 'Hoàn thiện chân và mặt đỡ của giá pallet.',
        29: 'Giá pallet đã hoàn thành.',
        30: 'Đưa đôi càng nâng vào bên dưới giá pallet.',
        31: 'Xe nâng và giá pallet hoàn thành; sẵn sàng thử chương trình.'
      };
      return {
        src,
        alt: `Hình bước ${n} trong sách hướng dẫn lắp ráp xe nâng`,
        loc: `Bước ${n} · trang ${d.page || n}`,
        cap: captions[n] || 'Quan sát chi tiết tô nổi bật và vị trí lắp trong hình hướng dẫn.',
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
