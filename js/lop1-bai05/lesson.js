// Cấu hình Bài 5 lớp 1 – Chào hỏi, kết bạn – Spy Robot. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop1/bai05/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop1/bai05/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop1-bai05",
    "label": "Bài 5",
    "code": "ZM5",
    "sheetName": "Lớp 1 · Bài 5: Chào hỏi, kết bạn – Spy Robot",
    "store": "zm5_",
    "baseName": "Spy Robot",
    "Engine": "SpyEngine",
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
        "title": "Lắp Spy Robot",
        "text": "Đánh dấu đủ 21 bước lắp robot điệp viên.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Robot biết chào và tạm biệt",
        "text": "Ghép 13 khối như sách rồi chạy trọn một vòng chào – tạm biệt."
      },
      "m3": {
        "n": 3,
        "title": "Chào vừa đủ lâu",
        "text": "Đổi thời gian chờ sau lời chào đầu từ 1 thành 2 giây. Chờ 1 giây sẽ quá vội!"
      },
      "m4": {
        "n": 4,
        "title": "Điệp viên nhí sáng tạo",
        "text": "Thử gắn kính, ăng-ten, mũ hoặc huy hiệu rồi chạy robot.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Cảm biến lịch sự",
        "text": "Chạm khối Chờ vật cản để thử cự ly 20, 30, 50 cm. Nhận bạn ở 28 cm, bỏ qua người đi ngang 45 cm."
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
        "repeatStart",
        "repeatEnd",
        "obstacle",
        "displaySmile",
        "displayWink",
        "melodyA",
        "melodyB",
        "highSpeed",
        "highSpeedCCW",
        "wait"
      ],
      "pro": [
        "displayHeart",
        "lowSpeed",
        "mediumSpeed"
      ],
      "sample": [
        "start",
        "repeatStart",
        "obstacle",
        "displaySmile",
        "melodyA",
        "highSpeed",
        [
          "wait",
          {
            "duration": 1
          }
        ],
        "obstacle",
        "displayWink",
        "melodyB",
        "highSpeedCCW",
        [
          "wait",
          {
            "duration": 1
          }
        ],
        "repeatEnd"
      ],
      "empty": [
        "start",
        "repeatStart",
        "repeatEnd"
      ],
      "sensorRange": true
    },
    "sampleSig": [
      "start",
      "repeatStart",
      "sensor_obstacle",
      "display",
      "melody",
      "motor:high",
      "wait:1",
      "sensor_obstacle",
      "display",
      "melody",
      "motor:high",
      "wait:1",
      "repeatEnd"
    ],
    "creative": {
      "store": "zm5.creative",
      "emptyText": "Spy Robot cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Số lượng trong hộp kit và tên tiếng Việt của các chi tiết gói sáng tạo
  // Định mức chi tiết bổ sung để THỬ Ý TƯỞNG trong xưởng, không xác nhận tồn kho thực của hộp Alpha 330.
  const KIT = { 'BP-7027': 4, 'BP-7628': 4, 'BP-7024': 4, 'BP-7525A': 3,
    'BP-7012': 24, 'BP-7075': 4, 'BP-7001': 4, 'BP-3976': 4 };
  const NAMES = {
    'BP-7027': 'Thanh kỹ thuật', 'BP-7628': 'Trục dài', 'BP-7024': 'Vòng chặn vàng',
    'BP-7525A': 'Thanh ngang trắng', 'BP-7012': 'Chốt đen',
    'BP-7075': 'Khớp vai', 'BP-7001': 'Cánh tay', 'BP-3976': 'Khung chữ nhật'
  };
  const FEATURES = {
    glasses: { text: 'Kính điệp viên: trang trí mắt cảm biến cho robot thật ngầu.' },
    antennas: { text: 'Ăng-ten kép: trang trí trên đầu để điệp viên nhận ra từ xa.' },
    hat: { text: 'Mũ đặc nhiệm: giúp robot nổi bật ở cổng trường.' },
    badge: { text: 'Huy hiệu ngôi sao: đánh dấu điệp viên lễ phép ở trước ngực.' }
  };
  const SLOTS = [
    { id: 'eyes', name: 'Trước mắt cảm biến', options: [
      { id: 'glasses', label: 'Kính điệp viên', feature: 'glasses', parts: { 'BP-7525A': 1, 'BP-7012': 2 } }] },
    { id: 'radar', name: 'Hai bên đỉnh đầu', options: [
      { id: 'antennas', label: 'Ăng-ten kép', feature: 'antennas', parts: { 'BP-7628': 2, 'BP-7024': 2 } }] },
    { id: 'head', name: 'Trên đỉnh đầu', options: [
      { id: 'hat', label: 'Mũ đặc nhiệm', feature: 'hat', parts: { 'BP-3976': 1, 'BP-7027': 2, 'BP-7012': 2 } }] },
    { id: 'chest', name: 'Trước ngực', options: [
      { id: 'badge', label: 'Huy hiệu ngôi sao', feature: 'badge', parts: { 'BP-7075': 1, 'BP-7024': 1 } }] }
  ];
  const PRESETS = [
    { id: 'glasses', title: '🕶️ Kính điệp viên', text: 'Mắt robot thêm ngầu.', pick: { eyes: 'glasses' } },
    { id: 'antennas', title: '📡 Ăng-ten kép', text: 'Hai ăng-ten trên đầu.', pick: { radar: 'antennas' } },
    { id: 'hat', title: '🎩 Mũ đặc nhiệm', text: 'Đổi phong cách ngụy trang.', pick: { head: 'hat' } },
    { id: 'badge', title: '⭐ Huy hiệu sao', text: 'Ngôi sao lễ phép.', pick: { chest: 'badge' } }
  ];
  const icon = (path, color) => `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="22" y="20" width="20" height="23" rx="5" fill="#61cad7" stroke="#345" stroke-width="2"/><g stroke="${color}" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${path}</g></svg>`;
  const PICS = {
    glasses: icon('<path d="M6 16h20v8H6zM38 16h20v8H38zM26 19h12"/>', '#30364d'),
    antennas: icon('<path d="M21 17L11 4M43 17L53 4"/>', '#ffa856'),
    hat: icon('<path d="M9 17h46M20 17V5h24v12"/>', '#344c7b'),
    badge: icon('<path d="M32 25l3 5 6 1-4 5 1 6-6-3-6 3 1-6-4-5 6-1z"/>', '#ffde54')
  };
  // Vị trí 3D của chi tiết mỗi gói: trả về { 'slot:option': [chi tiết…] }
  function placements(DATA, H) {
    if (!DATA.instances?.length) return {};
    const first = name => (H.by(name) || [])[0];
    const sensor = first('BE-6313'), hub = first('BE-5158');
    const clone = (name, pos) => {
      const src = first(name);
      return src ? [H.make(src, pos, src.rotation)] : [];
    };
    const eye = sensor?.pos || [0.00254, 0.155, 0.0075];
    const chest = hub?.pos || [0.00304, 0.095, -0.0125];
    return {
      'eyes:glasses': clone('BP-7525A', [eye[0], eye[1] + 0.007, eye[2] - 0.035]),
      'radar:antennas': [
        ...clone('BP-7628', [eye[0] - 0.028, eye[1] + 0.069, eye[2]]),
        ...clone('BP-7628', [eye[0] + 0.028, eye[1] + 0.069, eye[2]])
      ],
      'head:hat': clone('BP-3976', [eye[0], eye[1] + 0.08, eye[2] - 0.01]),
      'chest:badge': clone('BP-7024', [chest[0], chest[1], chest[2] - 0.028])
    };
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const src = `assets/lop1-bai05/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Hình bước ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: d.page === 21 ? 'Spy Robot đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
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
