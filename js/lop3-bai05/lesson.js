// Cấu hình Bài 5 lớp 3 – Xe đổ rác. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop3/bai05/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop3/bai05/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop3-bai05",
    "label": "Bài 5",
    "code": "ZM3-05",
    "sheetName": "Lớp 3 · Bài 5: Xe đổ rác",
    "store": "zm3b05_",
    "baseName": "Xe thu gom rác",
    "Engine": "GarbageTruckEngine",
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
        "title": "Lắp xe thu gom rác",
        "text": "Bấm “Đã lắp xong bước này” ở cả 24 bước của chặng Lắp ráp.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Chạy một vòng chương trình mẫu",
        "text": "Chạy đúng 4 khối như giáo án cho xe di chuyển liên tục ở tốc độ cao; hoàn tất ít nhất một vòng lặp."
      },
      "m3": {
        "n": 3,
        "title": "Đỗ xe ở điểm thu gom",
        "text": "Đặt thời gian động cơ chạy 3 giây rồi dừng đúng ô xanh. 2 giây xe chưa tới, 4 giây xe vượt ô và chạm dải chắn."
      },
      "m4": {
        "n": 4,
        "title": "Cải tiến xe thu gom",
        "text": "Lắp thùng ben thủ công, tấm gạt trước, nắp khoang hoặc vách ngăn hai loại rác; quan sát phụ kiện trên mô phỏng.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Đỗ xe khi chở rác nặng",
        "text": "Nâng cao: tải đầy khiến xe trôi thêm lúc phanh. Thử lại 2 giây thay cho 3 giây để dừng vừa ô xanh; 1 hoặc 3 giây sẽ trượt ô."
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
        "lowSpeed",
        "mediumSpeed",
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
      "store": "zm3b05.creative",
      "emptyText": "Xe thu gom rác cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Số lượng trong hộp kit ZM Alpha 330 (set2321A)
  const KIT = { 'BP-3976': 2, 'BP-7012': 40, 'BP-7011': 15, 'BP-7017': 2, 'BP-7018': 2, 'BP-7023': 6 };
  const NAMES = {
    'BP-3976': 'Khung 5×7 (thùng, nắp)',
    'BP-7012': 'Chốt đen',
    'BP-7011': 'Chốt dài xanh dương (bản lề ben)',
    'BP-7017': 'Cánh trắng trái (tấm gạt)',
    'BP-7018': 'Cánh trắng phải (vách ngăn)',
    'BP-7023': 'Bạc chặn trục'
  };
  const FEATURES = {
    ben: { text: 'Thùng ben lật thủ công phía sau: nâng thùng bằng tay để đổ rác tại trạm (không thêm motor)' },
    plow: { text: 'Tấm gạt phía trước: gạt rác nhẹ vào đường xe, thao tác bằng tay' },
    lid: { text: 'Nắp khoang phía trên: đóng khoang để rác không rơi vãi' },
    divider: { text: 'Vách ngăn hai khoang: tách rác hữu cơ và rác tái chế' }
  };
  const SLOTS = [
    { id: 'rear', name: 'Phía sau xe', options: [{ id: 'ben', label: 'Thùng ben', parts: { 'BP-3976': 1, 'BP-7011': 2 }, feature: 'ben' }] },
    { id: 'front', name: 'Phía trước xe', options: [{ id: 'plow', label: 'Tấm gạt', parts: { 'BP-7017': 1, 'BP-7012': 2 }, feature: 'plow' }] },
    { id: 'top', name: 'Trên khoang rác', options: [{ id: 'lid', label: 'Nắp khoang', parts: { 'BP-3976': 1, 'BP-7012': 2 }, feature: 'lid' }] },
    { id: 'inside', name: 'Trong khoang rác', options: [{ id: 'divider', label: 'Vách ngăn', parts: { 'BP-7018': 1, 'BP-7023': 1, 'BP-7012': 2 }, feature: 'divider' }] }
  ];
  const PRESETS = [
    { id: 'ben', title: 'Thùng ben', text: 'Nâng thùng bằng tay để đổ rác.', pick: { rear: 'ben' } },
    { id: 'plow', title: 'Tấm gạt', text: 'Gạt rác nhẹ phía đầu xe.', pick: { front: 'plow' } },
    { id: 'lid', title: 'Nắp khoang', text: 'Che khoang cho rác khỏi rơi.', pick: { top: 'lid' } },
    { id: 'divider', title: 'Vách ngăn', text: 'Chia hai ngăn rác hữu cơ và tái chế.', pick: { inside: 'divider' } }
  ];
  // Hình gói: lấy từ js/lop3-bai05/art.js (window.TruckArt.PICS) khi có
  const PICS = new Proxy({}, { get: (_, k) => window.TruckArt && window.TruckArt.PICS && window.TruckArt.PICS[k] });
  // Bản dựng 3D chưa có mesh riêng cho phụ kiện: gói sáng tạo hiển thị trên cảnh mô phỏng
  function placements() {
    return {};
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const src = `assets/lop3-bai05/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Hình bước ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: d.page === 24 ? 'Xe thu gom rác đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
        pdf: src
      };
    },
    details(t) {
      const out = [];
      if (t.state.best) out.push(`Đỗ đúng ô sau ${t.state.best.secs} giây${t.state.best.heavy ? ' (chở nặng)' : ''}`);
      if (t.state.upgrades && t.state.upgrades.length) out.push('Gói nâng cấp: ' + t.state.upgrades.join(', '));
      return out.join(' · ');
    },
    creative: { ...SPEC.creative, kit: KIT, names: NAMES, features: FEATURES, slots: SLOTS, pics: PICS, presets: PRESETS, placements }
  };
})();
