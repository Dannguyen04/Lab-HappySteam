// Cấu hình Bài 6 lớp 1 – Luật giao thông – Xe thông minh. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop1/bai06/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop1/bai06/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop1-bai06",
    "label": "Bài 6",
    "code": "ZM6",
    "sheetName": "Lớp 1 · Bài 6: Luật giao thông – Xe thông minh",
    "store": "zm6_",
    "baseName": "Xe giao thông",
    "Engine": "TrafficEngine",
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
        "title": "Lắp chiếc xe",
        "text": "Đánh dấu đủ 14 bước lắp xe.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Xe hiểu tín hiệu đèn",
        "text": "Ghép đúng 9 thẻ. Xanh chạy nhanh, vàng chạy chậm, đỏ dừng."
      },
      "m3": {
        "n": 3,
        "title": "Qua vạch kịp đèn xanh",
        "text": "Khi đèn xanh ngắn, chọn thỏ nhanh. Rùa chậm sẽ không kịp!"
      },
      "m4": {
        "n": 4,
        "title": "Xe an toàn sáng tạo",
        "text": "Gắn đèn ưu tiên, cản xe, biển an toàn hoặc kính chắn rồi chạy thử.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Lập trình theo nhịp đèn",
        "text": "Chạm đèn để đổi 3, 4, 5 giây. Thử thỏ nhanh và rùa chậm xem khi nào qua kịp."
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
        "sensorGreen",
        "sensorYellow",
        "sensorRed",
        "highSpeed",
        "lowSpeed",
        "motorStop"
      ],
      "pro": [],
      "sample": [
        "start",
        "repeatStart",
        "sensorGreen",
        "highSpeed",
        "sensorYellow",
        "lowSpeed",
        "sensorRed",
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
      "sensor_green",
      "motor:high",
      "sensor_yellow",
      "motor:low",
      "sensor_red",
      "stop",
      "repeatEnd"
    ],
    "creative": {
      "store": "zm6.creative",
      "emptyText": "Xe giao thông cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Số lượng trong hộp kit và tên tiếng Việt của các chi tiết gói sáng tạo
  // Dự toán chi tiết để thử ý tưởng 3D, không phải số lượng tồn kho trong hộp thật.
  const KIT = { 'BP-7525A': 4, 'BP-7628': 4, 'BP-7012': 12,
    'BP-7095': 4, 'BP-7549': 4 };
  const NAMES = { 'BP-7525A': 'Thanh cản', 'BP-7628': 'Trục dài',
    'BP-7012': 'Chốt nối', 'BP-7095': 'Chi tiết đèn', 'BP-7549': 'Thanh chắn kính' };
  const FEATURES = {
    beacon: { text: 'Đèn ưu tiên trên mui: trang trí và dễ nhận biết xe làm nhiệm vụ.' },
    bumper: { text: 'Thanh cản trước: bảo vệ phần mũi mô hình khi va chạm nhẹ.' },
    sign: { text: 'Biển an toàn ở đuôi: nhắc mọi người tuân thủ tín hiệu giao thông.' },
    shield: { text: 'Kính chắn gió: mô phỏng tấm che cho khoang điều khiển.' }
  };
  const SLOTS = [
    { id: 'roof', name: 'Trên mui xe', options: [
      { id: 'beacon', label: 'Đèn ưu tiên', feature: 'beacon', parts: { 'BP-7095': 1, 'BP-7012': 1 } }] },
    { id: 'front', name: 'Trước mũi xe', options: [
      { id: 'bumper', label: 'Thanh cản trước', feature: 'bumper', parts: { 'BP-7525A': 1, 'BP-7012': 2 } }] },
    { id: 'back', name: 'Đuôi xe', options: [
      { id: 'sign', label: 'Biển an toàn', feature: 'sign', parts: { 'BP-7628': 1, 'BP-7095': 1 } }] },
    { id: 'cab', name: 'Khoang điều khiển', options: [
      { id: 'shield', label: 'Kính chắn gió', feature: 'shield', parts: { 'BP-7549': 2, 'BP-7012': 2 } }] }
  ];
  const PRESETS = [
    { id: 'beacon', title: '🚨 Đèn ưu tiên', text: 'Đánh dấu xe làm nhiệm vụ.', pick: { roof: 'beacon' } },
    { id: 'bumper', title: '🛡️ Thanh cản', text: 'Giữ an toàn cho mũi xe.', pick: { front: 'bumper' } },
    { id: 'sign', title: '🚸 Biển an toàn', text: 'Nhắc mọi người chú ý.', pick: { back: 'sign' } },
    { id: 'shield', title: '🚙 Kính chắn gió', text: 'Che khoang điều khiển.', pick: { cab: 'shield' } }
  ];
  const icon = (path, color) => `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="15" y="19" width="34" height="19" rx="5" fill="#59bad4" stroke="#345" stroke-width="2"/><g stroke="${color}" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${path}</g></svg>`;
  const PICS = {
    beacon: icon('<path d="M26 17v-9h12v9M32 3v-2M16 10l-5-5M48 10l5-5"/>', '#ff6868'),
    bumper: icon('<path d="M8 34h48M8 29v9M56 29v9"/>', '#f9dc65'),
    sign: icon('<path d="M32 31V5M20 5h24v16H20zM26 12h12"/>', '#ffd34c'),
    shield: icon('<path d="M23 18l6-12h16l6 12M27 11h19"/>', '#a5edff')
  };
  // Vị trí 3D của chi tiết mỗi gói: trả về { 'slot:option': [chi tiết…] }
  function placements(DATA, H) {
    if (!DATA.instances?.length) return {};
    const first = name => (H.by(name) || [])[0];
    const hub = first('BE-5158'), sensor = first('BE-1153');
    const middle = hub?.pos || [0.0375, 0.04, 0.000533];
    const nose = sensor?.pos || [-0.0375, 0.035, 0];
    const clone = (name, pos) => {
      const source = first(name);
      return source ? [H.make(source, pos, source.rotation)] : [];
    };
    return {
      'roof:beacon': clone('BP-7095', [middle[0], middle[1] + 0.04, middle[2]]),
      'front:bumper': clone('BP-7525A', [nose[0] - 0.034, nose[1], nose[2]]),
      'back:sign': clone('BP-7628', [middle[0] + 0.05, middle[1] + 0.055, middle[2]]),
      'cab:shield': [
        ...clone('BP-7549', [nose[0] + 0.02, nose[1] + 0.026, nose[2] - 0.023]),
        ...clone('BP-7549', [nose[0] + 0.02, nose[1] + 0.026, nose[2] + 0.023])
      ]
    };
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const src = `assets/lop1-bai06/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Hình bước ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: d.page === 14 ? 'Xe giao thông đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
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
