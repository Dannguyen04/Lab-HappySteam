// Cấu hình Bài 3 lớp 3 – Cơ cấu đòn bẩy – Máy bắn đá. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop3/bai03/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop3/bai03/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop3-bai03",
    "label": "Bài 3",
    "code": "ZM3-03",
    "sheetName": "Lớp 3 · Bài 03: Cơ cấu đòn bẩy – Máy bắn đá",
    "store": "zm3b03_",
    "baseName": "Mô hình đòn bẩy",
    "Engine": "LeverEngine",
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
        "title": "Lắp mô hình cơ khí",
        "text": "Quan sát đủ 24 trang hướng dẫn, đánh dấu hoàn thành từng bước lắp ráp.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Quan sát một lượt thả bóng",
        "text": "Thử mức 1 mặc định, chạm Thả bóng và quan sát trọn một vòng hoạt động của đòn bẩy."
      },
      "m3": {
        "n": 3,
        "title": "Chọn đúng nấc lực ảo",
        "text": "Ba nấc cho ba vị trí rơi khác nhau. Chọn mức phù hợp để bóng mềm ảo dừng trong vòng đích giữa sân."
      },
      "m4": {
        "n": 4,
        "title": "Thử một gói trang trí",
        "text": "Gắn một gói sáng tạo trên mô hình 3D, quay lại sa bàn và thả bóng một lượt.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Đưa bóng vào ba vòng đổi chỗ",
        "text": "Nâng cao: vòng điểm đổi chỗ qua ba lượt. Chọn lại nấc mô phỏng ở mỗi lượt để chạm đúng cả ba vòng liên tiếp; sai sẽ thử lại từ đầu."
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
      "store": "zm3b03.creative",
      "emptyText": "Mô hình đòn bẩy cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Các gói tạo hình minh họa bằng CAD sẵn có; chưa kiểm kho linh kiện thật.
  const KIT = {};
  const NAMES = {};
  const FEATURES = {
    ballBasket: { text: 'Giỏ đựng bóng mềm ảo cạnh xe; giúp sắp xếp dụng cụ thí nghiệm.' },
    teamSign: { text: 'Biển số đội ở đầu mô hình để nhận biết tại hội khoa học.' },
    distanceMarks: { text: 'Vạch đánh dấu để so sánh vị trí bóng trên sa bàn ảo.' },
    wheelBrake: { text: 'Chốt giữ bánh minh họa, nhắc giữ mô hình ổn định khi quan sát.' }
  };
  const SLOTS = [
    { id: 'side', name: 'Bên thân xe', options: [{ id: 'basket', label: 'Giỏ bóng mềm', feature: 'ballBasket', parts: {} }] },
    { id: 'front', name: 'Đầu thân xe', options: [{ id: 'sign', label: 'Biển số đội', feature: 'teamSign', parts: {} }] },
    { id: 'base', name: 'Cạnh sa bàn', options: [{ id: 'marks', label: 'Vạch cự ly', feature: 'distanceMarks', parts: {} }] },
    { id: 'wheels', name: 'Khóa bánh', options: [{ id: 'brake', label: 'Chốt giữ bánh', feature: 'wheelBrake', parts: {} }] }
  ];
  const PRESETS = [
    { id: 'basket', title: '🧺 Giỏ bóng mềm', text: 'Sắp xếp bóng thử nghiệm.', pick: { side: 'basket' } },
    { id: 'sign', title: '🏷️ Biển đội', text: 'Gắn biển nhận biết.', pick: { front: 'sign' } },
    { id: 'marks', title: '📏 Vạch cự ly', text: 'Quan sát điểm rơi ảo.', pick: { base: 'marks' } },
    { id: 'brake', title: '🛞 Chốt giữ bánh', text: 'Trang trí chốt an toàn.', pick: { wheels: 'brake' } }
  ];
  const thumb = (shape, color) => '<svg viewBox="0 0 72 50" aria-hidden="true"><rect x="8" y="26" width="54" height="10" rx="3" fill="#5ac6d4" stroke="#243a47" stroke-width="2"/><circle cx="18" cy="39" r="6" fill="#344b5b"/><circle cx="55" cy="39" r="6" fill="#344b5b"/><g fill="' + color + '" stroke="#314453" stroke-width="2">' + shape + '</g></svg>';
  const PICS = {
    basket: thumb('<rect x="34" y="10" width="22" height="17" rx="3"/>', '#dfae6f'),
    sign: thumb('<path d="M18 27V5h25v15H18z"/>', '#fae1a1'),
    marks: thumb('<path d="M5 43h60v4H5zM16 39v8M28 39v8M40 39v8M52 39v8"/>', '#f8dc62'),
    brake: thumb('<rect x="8" y="36" width="18" height="9" rx="2"/>', '#f59a75')
  };
  // Mỗi lựa chọn nhân bản linh kiện 3D có sẵn, không khẳng định lắp thực được.
  function placements(DATA, H) {
    const first = name => (H.by(name) || [])[0];
    const pin = first('BP-7014'), bush = first('BP-7024');
    const beam = first('BP-7528'), bracket = first('BP-7549');
    if (!DATA.instances?.length) return {};
    const ps = DATA.instances.map(i => i.pos);
    const top = Math.max(...ps.map(p => p[1]));
    const low = Math.min(...ps.map(p => p[1]));
    const left = Math.min(...ps.map(p => p[0]));
    const right = Math.max(...ps.map(p => p[0]));
    const front = Math.min(...ps.map(p => p[2]));
    const back = Math.max(...ps.map(p => p[2]));
    const copy = (part, xyz) => part ? [H.make(part, xyz, part.rotation)] : [];
    return {
      'side:basket': [
        ...copy(bracket, [right + 0.019, low + 0.032, back - 0.01]),
        ...copy(bracket, [right + 0.019, low + 0.032, back + 0.013])
      ],
      'front:sign': [...copy(beam, [(left + right) / 2, top + 0.026, front - 0.005])],
      'base:marks': [
        ...copy(pin, [left - 0.018, low + 0.004, front - 0.01]),
        ...copy(pin, [left - 0.018, low + 0.004, front + 0.015]),
        ...copy(pin, [left - 0.018, low + 0.004, front + 0.04])
      ],
      'wheels:brake': [
        ...copy(bush, [left - 0.012, low + 0.014, front]),
        ...copy(bush, [right + 0.012, low + 0.014, front])
      ]
    };
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const src = `assets/lop3-bai03/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Hình bước ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: d.page === 24 ? 'Trang cuối sách. So sánh mô hình với kit thật; bản 3D hiện thiếu dây thun.' : 'Quan sát hình sách gốc và đối chiếu vị trí linh kiện trên mô hình 3D.',
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
