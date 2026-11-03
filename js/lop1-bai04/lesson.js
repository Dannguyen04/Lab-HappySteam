// Cấu hình Bài 4 lớp 1 – Cảm biến của robot. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop1/bai04/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop1/bai04/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop1-bai04",
    "label": "Bài 4",
    "code": "ZM4",
    "sheetName": "Lớp 1 · Bài 4: Cảm biến của robot",
    "store": "zm4_",
    "baseName": "Máy khoan",
    "Engine": "DrillEngine",
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
        "title": "Lắp máy khoan",
        "text": "Đánh dấu đủ 23 bước lắp máy khoan.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Máy khoan nghe lời",
        "text": "Ghép mẫu. Nhấn giữ cò đỏ rồi thả tay."
      },
      "m3": {
        "n": 3,
        "title": "Treo tranh lên tường",
        "text": "Chọn Quay chậm. Giữ cò tới vạch xanh rồi thả."
      },
      "m4": {
        "n": 4,
        "title": "Thiết kế máy khoan mới",
        "text": "Gắn một món mới rồi chạy thử máy khoan.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Kỹ sư chọn vật liệu",
        "text": "Khoan đúng cả ba chất liệu với tốc độ phù hợp, tới vạch xanh rồi nhả."
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
        "touch",
        "release",
        "highSpeed",
        "lowSpeed",
        "motorStop"
      ],
      "pro": [
        "mediumSpeed",
        "motorPower",
        "wait"
      ],
      "sample": [
        "start",
        "repeatStart",
        "touch",
        "highSpeed",
        "release",
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
      "sensor_touch",
      "motor:high",
      "sensor_release",
      "stop",
      "repeatEnd"
    ],
    "creative": {
      "store": "zm4.creative",
      "emptyText": "Máy khoan cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Số lượng trong hộp kit và tên tiếng Việt của các chi tiết gói sáng tạo
  // Số chi tiết bổ sung là định mức minh họa trong xưởng; không phải tồn kho kit gốc.
  const KIT = { 'BP-7524A': 1, 'BP-7012': 10, 'BP-7078': 2,
    'BP-7528': 2, 'BP-7073': 2, 'BP-7030': 4 };
  const NAMES = {
    'BP-7524A': 'Thanh 3 lỗ', 'BP-7012': 'Chốt đen',
    'BP-7078': 'Thanh gập góc', 'BP-7528': 'Thanh dài 15 lỗ',
    'BP-7073': 'Thanh cong', 'BP-7030': 'Khớp nối góc'
  };
  const FEATURES = {
    boostTrigger: { text: 'Cò trợ lực màu cam: giúp em bấm cảm biến chạm dễ hơn.' },
    sideHandle: { text: 'Tay cầm phụ: giữ máy ổn định khi khoan.' },
    depthGauge: { text: 'Thước xanh: giúp canh đúng vạch độ sâu.' },
    dustShield: { text: 'Tấm chắn phoi: che bụi bay ra từ mũi khoan.' }
  };
  const SLOTS = [
    { id: 'trigger', name: 'Cò cảm biến', options: [
      { id: 'boostTrigger', label: 'Cò trợ lực', feature: 'boostTrigger', parts: { 'BP-7524A': 1, 'BP-7012': 2 } }] },
    { id: 'handle', name: 'Tay cầm phía trước', options: [
      { id: 'sideHandle', label: 'Tay cầm phụ', feature: 'sideHandle', parts: { 'BP-7078': 1, 'BP-7012': 2 } }] },
    { id: 'gauge', name: 'Thân máy khoan', options: [
      { id: 'depthGauge', label: 'Thước đo sâu', feature: 'depthGauge', parts: { 'BP-7528': 1, 'BP-7012': 2 } }] },
    { id: 'shield', name: 'Đầu mũi khoan', options: [
      { id: 'dustShield', label: 'Tấm chắn phoi', feature: 'dustShield', parts: { 'BP-7073': 2, 'BP-7030': 2 } }] }
  ];
  const PRESETS = [
    { id: 'boostTrigger', title: '🟠 Cò trợ lực', text: 'Nhấn nút dễ hơn.', pick: { trigger: 'boostTrigger' } },
    { id: 'sideHandle', title: '🤲 Tay cầm phụ', text: 'Giữ khoan vững.', pick: { handle: 'sideHandle' } },
    { id: 'depthGauge', title: '📏 Thước đo sâu', text: 'Canh vạch xanh.', pick: { gauge: 'depthGauge' } },
    { id: 'dustShield', title: '🛡️ Chắn phoi', text: 'Che bụi khi khoan.', pick: { shield: 'dustShield' } }
  ];
  const pic = (shape, color) => `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="8" y="17" width="47" height="14" rx="5" fill="#62d2da" stroke="#263e4a" stroke-width="2"/>` +
    `<path d="${shape}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/></svg>`;
  const PICS = {
    boostTrigger: pic('M42 31l-10 9h-10', '#f9a04d'),
    sideHandle: pic('M36 30v15', '#5e778d'),
    depthGauge: pic('M12 13h40', '#65c77d'),
    dustShield: pic('M52 6v35', '#7ec9fc')
  };
  // Sao chép hình học linh kiện CAD có thật để gắn thử vào bốn điểm trên máy khoan.
  // Riêng tấm chắn trong suốt được biểu đạt bằng hiệu ứng ở cảnh 2D;
  // mô hình 3D chỉ hiển thị khung đỡ vì dữ liệu CAD chưa có mặt chắn trong suốt.
  function placements(DATA, H) {
    if (!DATA.instances?.length) return {};
    const first = code => (H.by(code) || [])[0];
    const touch = first('BE-2257'), motor = first('BE-3581');
    const clone = (code, point) => {
      const src = first(code);
      return src ? [H.make(src, point, src.rotation)] : [];
    };
    return {
      'trigger:boostTrigger': clone('BP-7524A', touch ? [touch.pos[0] + 0.012, touch.pos[1] - 0.012, 0] : [0.12, 0.05, 0]),
      'handle:sideHandle': clone('BP-7078', [0.018, 0.033, 0.044]),
      'gauge:depthGauge': clone('BP-7528', motor ? [motor.pos[0] + 0.018, motor.pos[1] + 0.035, 0] : [0.02, 0.13, 0]),
      'shield:dustShield': clone('BP-7073', [-0.085, 0.099, 0.025])
    };
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const src = `assets/lop1-bai04/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Hình bước ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: d.page === 23 ? 'Máy khoan đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
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
