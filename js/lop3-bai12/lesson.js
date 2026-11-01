// Cấu hình Bài 12 lớp 3 – Robot trồng cây trên sao Hỏa. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop3/bai12/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop3/bai12/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop3-bai12",
    "label": "Bài 12",
    "code": "ZM3-12",
    "sheetName": "Lớp 3 · Bài 12: Sống trên sao Hỏa – Trồng cây",
    "store": "zm3b12_",
    "baseName": "Thân robot",
    "Engine": "PlantEngine",
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
        "title": "Lắp robot gắp cây",
        "text": "Bấm “Đã lắp xong bước này” ở cả 31 bước của chặng Lắp ráp.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Hoàn thành một vòng chương trình mẫu",
        "text": "Lắp đúng 13 khối KHGD và chạy trọn một vòng: xe tới chậu, dừng, phát giai điệu A, hạ khung gắp và lùi lại."
      },
      "m3": {
        "n": 3,
        "title": "Đưa đủ ba chậu vào luống trồng",
        "text": "Trồng đủ 3 chậu: lùi thiếu hoặc quá vị trí đều làm chậu đổ. Có thể phải thay đổi thời gian lùi ở mỗi lượt."
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
        "title": "Trồng cây an toàn qua bão",
        "text": "Nâng cao: vị trí chậu thay đổi theo lượt, bão bụi xuất hiện bất kỳ giữa các lượt. Chạy khi đang bão làm đổ chậu; dùng khối Đợi đường trống."
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
        "melodyA",
        "wait",
        "waitClear"
      ],
      "pro": [
        "motorPower",
        "motorReverse"
      ],
      "sample": [
        "start",
        "repeatStart",
        "m1Motor",
        "obstacle",
        "motorStop",
        "melodyA",
        "m2Motor",
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
            "duration": 3
          }
        ],
        "motorStop",
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
      "motor:low",
      "sensor_obstacle",
      "stop",
      "melody",
      "motor:low",
      "wait:1",
      "stop",
      "motor:low",
      "wait:3",
      "stop",
      "repeatEnd"
    ],
    "creative": {
      "store": "zm3b12.creative",
      "emptyText": "Thân robot cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Số lượng trong hộp kit và tên tiếng Việt của các chi tiết gói sáng tạo
  // Định mức minh họa cho phụ kiện trong xưởng (chỉ áp dụng cho gói sáng tạo, không thay danh mục kit gốc).
  const KIT = { 'BP-7528': 2, 'BP-7073': 4, 'BP-7012': 12, 'BP-8818': 2, 'BP-3976': 2, 'BP-7524A': 4, 'BP-7024': 4 };
  const NAMES = {
    'BP-7528': 'Thanh dài 15 lỗ', 'BP-7073': 'Thanh cong', 'BP-7012': 'Chốt đen',
    'BP-8818': 'Khung đế 7×11', 'BP-3976': 'Khung 5×7',
    'BP-7524A': 'Thanh 5 lỗ', 'BP-7024': 'Bạc chặn nửa'
  };
  const FEATURES = {
    wideArm: { text: 'Khung gắp rộng: tay gắp mở rộng, đỡ được chậu cây lớn ở đầu xe.' },
    watering: { text: 'Bình tưới: cây đã trồng lớn nhanh hơn nhờ được cấp nước.' },
    lamp: { text: 'Đèn chiếu: chiếu sáng luống cây, thúc đẩy cây phát triển.' },
    solar: { text: 'Pin mặt trời: tăng năng lượng, rút ngắn thời gian ảnh hưởng của bão bụi.' }
  };
  const SLOTS = [
    { id: 'gripper', name: 'Đầu khung gắp', options: [{ id: 'wideArm', label: 'Khung gắp rộng', feature: 'wideArm', parts: { 'BP-7528': 1, 'BP-7073': 2, 'BP-7012': 4 } }] },
    { id: 'back', name: 'Lưng robot', options: [{ id: 'watering', label: 'Bình tưới', feature: 'watering', parts: { 'BP-8818': 1, 'BP-7524A': 2, 'BP-7012': 3 } }] },
    { id: 'front', name: 'Phía trước nhà kính', options: [{ id: 'lamp', label: 'Đèn chiếu cây', feature: 'lamp', parts: { 'BP-7024': 2, 'BP-7073': 1, 'BP-7012': 2 } }] },
    { id: 'roof', name: 'Trên nóc robot', options: [{ id: 'solar', label: 'Tấm pin mặt trời', feature: 'solar', parts: { 'BP-3976': 1, 'BP-7012': 2 } }] }
  ];
  const PRESETS = [
    { id: 'wideArm', title: 'Khung gắp rộng', text: 'Vận chuyển cả chậu to.', pick: { gripper: 'wideArm' } },
    { id: 'watering', title: 'Bình tưới', text: 'Giúp cây non lớn nhanh.', pick: { back: 'watering' } },
    { id: 'lamp', title: 'Đèn chiếu cây', text: 'Cấp ánh sáng cho luống cây.', pick: { front: 'lamp' } },
    { id: 'solar', title: 'Tấm pin mặt trời', text: 'Cấp năng lượng cho robot.', pick: { roof: 'solar' } }
  ];
  const card = (color, icon) => `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="8" y="24" width="46" height="11" rx="3" fill="#f5efe0" stroke="#2b303b" stroke-width="2"/><circle cx="19" cy="39" r="6" fill="#2b303b"/><circle cx="45" cy="39" r="6" fill="#2b303b"/><g fill="${color}" stroke="#283c49" stroke-width="1.3">${icon}</g></svg>`;
  const PICS = {
    wideArm: card('#60d9e5', '<path d="M4 17h20l5 8H10z"/><path d="M36 25l5-8h19v8z"/>'),
    watering: card('#40d5ab', '<rect x="23" y="10" width="22" height="15" rx="4"/><path d="M45 15h9v8h-9" fill="none"/>'),
    lamp: card('#ffe57d', '<path d="M31 24V9h21l-8 15z"/><circle cx="44" cy="13" r="3" fill="#fff"/>'),
    solar: card('#4088cf', '<rect x="12" y="6" width="44" height="15"/><path d="M33 6v15M12 13h44" fill="none"/>')
  };
  // Vị trí 3D của chi tiết mỗi gói: trả về { 'slot:option': [chi tiết…] }
  function placements(DATA, H) {
    const parts = DATA.instances || [];
    if (!parts.length) return {};
    const meshes = DATA.creative || {};
    const pos = parts.map(p => p.pos);
    const top = Math.max(...pos.map(p => p[1]));
    const front = Math.min(...pos.map(p => p[2]));
    const middle = (Math.min(...pos.map(p => p[0])) + Math.max(...pos.map(p => p[0]))) / 2;
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const mk = (kind, center) => meshes[kind]?.length ? [H.make(null, center, I, meshes[kind], kind)] : [];
    return {
      'gripper:wideArm': mk('wideArm', [middle, 0.035, front - 0.03]),
      'back:watering': mk('watering', [middle, top + 0.016, 0.072]),
      'front:lamp': mk('lamp', [middle, top + 0.009, front - 0.012]),
      'roof:solar': mk('solar', [middle, top + 0.047, 0.056])
    };
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const n = d.step || d.page;
      const src = `assets/lop3-bai12/step-${String(n).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Bước ${n}: hình sách hướng dẫn lắp ráp robot trồng cây`,
        loc: `Bước ${n} · trang ${d.page || n}`,
        cap: n === 31 ? 'Thân robot đã hoàn thành.' : 'Quan sát vị trí linh kiện rồi lắp theo hình hướng dẫn.',
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
