// Cấu hình Bài 1 lớp 1 – Làm quen bộ công cụ – Xe trượt dốc. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop1/bai01/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop1/bai01/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop1-bai01",
    "label": "Bài 1",
    "code": "ZM1",
    "sheetName": "Lớp 1 · Bài 01: Làm quen bộ công cụ",
    "store": "zm1_",
    "baseName": "Xe trượt dốc",
    "Engine": "RampEngine",
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
        "title": "Lắp xe trượt dốc",
        "text": "Quan sát mô hình 3D và đánh dấu hoàn tất cả 7 bước lắp.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Quan sát xe lăn",
        "text": "Chạm nút Thả xe, xem xe lăn rồi đợi xe kết thúc lượt thử."
      },
      "m3": {
        "n": 3,
        "title": "Tăng dốc để đến đích",
        "text": "Độ dốc nấc 1 chưa đủ. Chọn nấc 2 hoặc 3, thả xe và quan sát xe tới cờ."
      },
      "m4": {
        "n": 4,
        "title": "Thử một gói cải tiến",
        "text": "Chọn gói ở xưởng Sáng tạo, đưa xe ra sa bàn rồi Thả xe một lượt.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Đến đích trên đường nhám",
        "text": "Ở chế độ Nâng cao, chọn mặt nhám. Thử nấc 2 chưa tới đích; chỉnh nấc 3 và thả lại."
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
      "toolbox": [],
      "pro": [],
      "sample": [
        "start"
      ],
      "empty": [
        "start"
      ]
    },
    "sampleSig": [
      "start"
    ],
    "creative": {
      "store": "zm1.creative",
      "emptyText": "Xe trượt dốc cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Số lượng dưới đây là giả định để thử ý tưởng, cần kiểm lại hộp kit thật.
  const KIT = { 'BP-8841': 4, 'BP-8850': 4, 'BP-7528': 7, 'BP-7012': 40, 'BP-7023': 8 };
  const NAMES = {
    'BP-8841': 'Vành bánh lớn', 'BP-8850': 'Lốp xanh ngọc',
    'BP-7528': 'Thanh 15 lỗ', 'BP-7012': 'Chốt đen', 'BP-7023': 'Bạc trục'
  };
  const FEATURES = {
    bigFrontWheels: { text: 'Bánh trước lớn: thử kiểu bánh to ở hai đầu trục trước.' },
    cargoWeight: { text: 'Khối gia tải: thử thay đổi khối lượng và quan sát chuyển động.' },
    spoilerWing: { text: 'Cánh đuôi: thử trang trí, tìm hiểu cánh gió của xe.' },
    frontBumper: { text: 'Cản trước: bảo vệ đầu xe khi thử nghiệm.' }
  };
  const SLOTS = [
    { id: 'frontWheels', name: 'Trục trước', options: [{ id: 'big', label: 'Bánh trước lớn', feature: 'bigFrontWheels', parts: { 'BP-8841': 2, 'BP-8850': 2 } }] },
    { id: 'body', name: 'Trên thân xe', options: [{ id: 'weight', label: 'Khối gia tải', feature: 'cargoWeight', parts: { 'BP-7528': 1, 'BP-7012': 2 } }] },
    { id: 'tail', name: 'Đuôi xe', options: [{ id: 'wing', label: 'Cánh đuôi', feature: 'spoilerWing', parts: { 'BP-7528': 1, 'BP-7012': 2 } }] },
    { id: 'nose', name: 'Đầu xe', options: [{ id: 'bumper', label: 'Cản trước', feature: 'frontBumper', parts: { 'BP-7528': 1, 'BP-7012': 2 } }] }
  ];
  const PRESETS = [
    { id: 'wheels', title: '🛞 Bánh lớn', text: 'Thử bánh to phía trước.', pick: { frontWheels: 'big' } },
    { id: 'weight', title: '🧱 Gia tải', text: 'Thử thêm khối lượng lên thân.', pick: { body: 'weight' } },
    { id: 'wing', title: '🪽 Cánh đuôi', text: 'Trang trí đuôi xe.', pick: { tail: 'wing' } },
    { id: 'bumper', title: '🛡️ Cản trước', text: 'Thử thanh bảo vệ đầu xe.', pick: { nose: 'bumper' } }
  ];
  const pic = (extra) => '<svg viewBox="0 0 72 50" aria-hidden="true"><path d="M9 20h54v12H9z" fill="#63cad2" stroke="#304052" stroke-width="2"/><circle cx="21" cy="35" r="9" fill="#acec7d" stroke="#304052" stroke-width="2"/><circle cx="52" cy="35" r="9" fill="#acec7d" stroke="#304052" stroke-width="2"/>' + extra + '</svg>';
  const PICS = {
    wheels: pic('<circle cx="52" cy="35" r="13" fill="none" stroke="#ffbd49" stroke-width="4"/>'),
    weight: pic('<rect x="29" y="10" width="18" height="10" rx="2" fill="#ffbd49"/>'),
    wing: pic('<path d="M6 7h24v4H6zM19 11v9" fill="#ffbd49" stroke="#304052" stroke-width="2"/>'),
    bumper: pic('<path d="M64 19v23h5V19" fill="none" stroke="#f28b70" stroke-width="4"/>')
  };
  // Dùng lại hình học CAD cho ý tưởng 3D; không khẳng định các mối nối này lắp được trên kit thật.
  function placements(DATA, H) {
    const first = code => (H.by(code) || [])[0];
    const beam = first('BP-7528');
    const rim = first('BP-8841');
    const tire = first('BP-8850');
    const clone = (src, pos) => src ? H.make(src, pos, src.rotation) : null;
    const shifted = (src, dx, dy, dz) => src ? clone(src, [src.pos[0] + dx, src.pos[1] + dy, src.pos[2] + dz]) : null;
    const out = {
      'frontWheels:big': [
        shifted(rim, -0.14, 0, -0.018), shifted(rim, -0.14, 0, 0.018),
        shifted(tire, -0.14, 0, -0.018), shifted(tire, -0.14, 0, 0.018)
      ],
      'body:weight': [shifted(beam, 0, 0.045, 0)],
      'tail:wing': [shifted(beam, 0.09, 0.065, 0)],
      'nose:bumper': [shifted(beam, -0.09, 0.025, 0)]
    };
    for (const key of Object.keys(out)) out[key] = out[key].filter(Boolean);
    return out;
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const n = d.step || d.page;
      const src = `assets/lop1-bai01/step-${String(n).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Minh họa bước ${n} dựng từ dữ liệu 3D, không phải trang sách gốc`,
        loc: `Bước ${n}/7 · minh họa 3D`,
        cap: n === 7 ? 'Mô hình xe hoàn chỉnh. Minh họa dựng lại từ 3D, cần kiểm tra trên kit thật.' : 'Minh họa dựng từ mô hình 3D, không phải trang sách gốc. Quan sát chi tiết được thêm ở bước này.',
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
