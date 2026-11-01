// Cấu hình Bài 16 lớp 3 – Xe chở tên lửa vũ trụ. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop3/bai16/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop3/bai16/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop3-bai16",
    "label": "Bài 16",
    "code": "ZM3-16",
    "sheetName": "Lớp 3 · Bài 16: Xe chở tên lửa vũ trụ",
    "store": "zm3b16_",
    "baseName": "Xe chở tên lửa",
    "Engine": "LaunchTransportEngine",
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
        "title": "Lắp xe chở tên lửa",
        "text": "Bấm “Đã lắp xong bước này” ở cả 32 bước của chặng Lắp ráp.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Chạy trọn một vòng chương trình mẫu",
        "text": "Lắp đúng 10 khối theo ảnh lập trình và chạy hết một vòng. Xe hiển thị mặt cười, phát A, chạy nhanh 3 giây, dừng, hiện mặt buồn rồi phát B."
      },
      "m3": {
        "n": 3,
        "title": "Đỗ xe đúng ô bệ phóng",
        "text": "Dùng vạch cự ly để tính thời gian xe chạy. Chỉnh thời gian Chờ để xe dừng đúng ô; đúng thì tên lửa vũ trụ phóng lên, sai thì màn LED báo mặt buồn. Khi đúng, em có thể đổi khối mặt buồn thành mặt cười."
      },
      "m4": {
        "n": 4,
        "title": "Thử xe sáng tạo",
        "text": "Gắn thêm chi tiết ở chặng Sáng tạo, rồi quay lại chạy chương trình.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Tính đúng cự ly ngẫu nhiên",
        "text": "Mỗi lượt bệ phóng được đặt ngẫu nhiên ở vạch gần, vừa hoặc xa. Quan sát vạch, tính thời gian chạy rồi cho xe dừng đúng ô bệ phóng."
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
        "displaySmile",
        "displaySad",
        "melodyA",
        "melodyB",
        "highSpeed",
        "motorStop",
        "wait"
      ],
      "pro": [
        "lowSpeed",
        "mediumSpeed",
        "motorPower"
      ],
      "sample": [
        "start",
        "repeatStart",
        "displaySmile",
        "melodyA",
        "highSpeed",
        [
          "wait",
          {
            "duration": 3
          }
        ],
        "motorStop",
        "displaySad",
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
      "display",
      "melody",
      "motor:high",
      "wait:3",
      "stop",
      "display",
      "melody",
      "repeatEnd"
    ],
    "creative": {
      "store": "zm3b16.creative",
      "emptyText": "Xe chở tên lửa cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Định mức minh họa cho phụ kiện trong xưởng (chỉ áp dụng cho gói sáng tạo, không thay danh mục kit gốc).
  const KIT = { 'BP-7528': 2, 'BP-7073': 4, 'BP-7012': 12, 'BP-8818': 2, 'BP-3976': 2, 'BP-7524A': 4, 'BP-7024': 4 };
  const NAMES = {
    'BP-7528': 'Thanh dài 15 lỗ', 'BP-7073': 'Thanh cong', 'BP-7012': 'Chốt đen',
    'BP-8818': 'Khung đế 7×11', 'BP-3976': 'Khung 5×7',
    'BP-7524A': 'Thanh 5 lỗ', 'BP-7024': 'Bạc chặn nửa'
  };
  const FEATURES = {
    solarPanel: { text: 'Tấm pin mặt trời: xe có thêm nguồn điện; chỉ để quan sát, không đổi thời gian chạy.' },
    antenna: { text: 'Ăng-ten vệ tinh: giữ liên lạc với trung tâm điều khiển phóng.' },
    dualHeadlights: { text: 'Đèn pha kép: chiếu sáng đường lăn khi xe ra bệ phóng.' },
    frontShield: { text: 'Tấm chắn trước: bảo vệ đầu xe khi chạy nhanh.' }
  };
  const SLOTS = [
    { id: 'roof', name: 'Trên nóc xe', options: [{ id: 'solarPanel', label: 'Tấm pin mặt trời', feature: 'solarPanel', parts: { 'BP-3976': 1, 'BP-7012': 2 } }] },
    { id: 'mast', name: 'Cột phía sau', options: [{ id: 'antenna', label: 'Ăng-ten vệ tinh', feature: 'antenna', parts: { 'BP-7528': 1, 'BP-7073': 1, 'BP-7012': 2 } }] },
    { id: 'lights', name: 'Đầu xe', options: [{ id: 'dualHeadlights', label: 'Đèn pha kép', feature: 'dualHeadlights', parts: { 'BP-7024': 2, 'BP-7012': 2 } }] },
    { id: 'bumper', name: 'Phía trước xe', options: [{ id: 'frontShield', label: 'Tấm chắn trước', feature: 'frontShield', parts: { 'BP-8818': 1, 'BP-7524A': 2, 'BP-7012': 3 } }] }
  ];
  const PRESETS = [
    { id: 'solarPanel', title: 'Tấm pin mặt trời', text: 'Thêm nguồn điện cho xe.', pick: { roof: 'solarPanel' } },
    { id: 'antenna', title: 'Ăng-ten vệ tinh', text: 'Liên lạc với trung tâm phóng.', pick: { mast: 'antenna' } },
    { id: 'dualHeadlights', title: 'Đèn pha kép', text: 'Soi sáng đường ra bệ phóng.', pick: { lights: 'dualHeadlights' } },
    { id: 'frontShield', title: 'Tấm chắn trước', text: 'Bảo vệ đầu xe.', pick: { bumper: 'frontShield' } }
  ];
  const card = (color, icon) => `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="8" y="24" width="46" height="11" rx="3" fill="#f5efe0" stroke="#2b303b" stroke-width="2"/><circle cx="19" cy="39" r="6" fill="#2b303b"/><circle cx="45" cy="39" r="6" fill="#2b303b"/><g fill="${color}" stroke="#283c49" stroke-width="1.3">${icon}</g></svg>`;
  const PICS = {
    solarPanel: card('#4088cf', '<rect x="12" y="6" width="40" height="14"/><path d="M26 6v14M39 6v14" fill="none"/>'),
    antenna: card('#60d9e5', '<path d="M32 24V10" fill="none"/><path d="M20 12q12-12 24 0z"/>'),
    dualHeadlights: card('#ffe57d', '<circle cx="46" cy="16" r="5"/><circle cx="34" cy="16" r="5"/>'),
    frontShield: card('#40d5ab', '<path d="M46 6h8v18h-8z"/>')
  };
  // Chi tiết 3D sáng tạo chưa có mô hình riêng: hiện bằng thẻ hình, bản 3D vẫn là xe cơ bản.
  function placements() {
    return {};
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const src = `assets/lop3-bai16/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Bước ${d.step || d.page}: hình sách hướng dẫn lắp xe chở tên lửa vũ trụ`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: d.page === 32 ? 'Xe chở tên lửa đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
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
