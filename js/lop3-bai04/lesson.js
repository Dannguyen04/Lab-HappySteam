// Cấu hình Bài 4 lớp 3 – Trạm phân loại rác thông minh. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop3/bai04/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop3/bai04/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop3-bai04",
    "label": "Bài 4",
    "code": "ZM3-04",
    "sheetName": "Lớp 3 · Bài 4: Phân loại, tái chế rác thải",
    "store": "zm3b04_",
    "baseName": "Trạm phân loại",
    "Engine": "SorterEngine",
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
        "title": "Lắp trạm phân loại",
        "text": "Bấm “Đã lắp xong bước này” ở cả 18 bước của chặng Lắp ráp.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Chạy một vòng chương trình mẫu",
        "text": "Ghép đúng 13 khối như giáo án và chạy trọn một chu kỳ đỏ–xanh. Bài mẫu có thể gạt chưa chính xác."
      },
      "m3": {
        "n": 3,
        "title": "Phân loại chính xác bốn túi",
        "text": "Phân loại đúng 2 túi đỏ về ngăn trái và 2 túi xanh về ngăn phải. Thời gian gạt xanh 1 giây khiến túi văng ra ngoài."
      },
      "m4": {
        "n": 4,
        "title": "Cải tiến trạm thu gom",
        "text": "Thử phễu dẫn hướng, tay gạt nối dài, nắp ngăn tự đóng hoặc khay hứng tràn.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Phân loại khi rác đến nhanh",
        "text": "Nâng cao: rác đến nhanh hơn. Giữ thời gian 1 giây sẽ trễ nhịp; đặt cả hai thời gian gạt 0,5 giây để đạt."
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
        "sensorColorRed",
        "sensorColorBlue",
        "noteDo",
        "noteMi",
        "m1Motor",
        "motorStop",
        "wait"
      ],
      "pro": [
        "motorPower",
        "motorReverse"
      ],
      "sample": [
        "start",
        "repeatStart",
        "sensorColorRed",
        "noteDo",
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
        "sensorColorBlue",
        "noteMi",
        [
          "m1Motor",
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
      "sensor_color_red",
      "melody",
      "motor:low",
      "wait:1",
      "stop",
      "sensor_color_blue",
      "melody",
      "motor:low",
      "wait:1",
      "stop",
      "repeatEnd"
    ],
    "creative": {
      "store": "zm3b04.creative",
      "emptyText": "Trạm phân loại cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Số lượng trong hộp kit và tên tiếng Việt của các chi tiết gói sáng tạo
  // Bộ chi tiết sáng tạo minh họa, không thay đổi kit Alpha330 gốc.
  const KIT = { 'BP-7528': 2, 'BP-7073': 4, 'BP-7012': 12, 'BP-8818': 2, 'BP-3976': 2, 'BP-7524A': 4, 'BP-7024': 4 };
  const NAMES = {
    'BP-7528': 'Thanh dài 15 lỗ', 'BP-7073': 'Thanh cong', 'BP-7012': 'Chốt đen',
    'BP-8818': 'Khung đế 7×11', 'BP-3976': 'Khung 5×7',
    'BP-7524A': 'Thanh 5 lỗ', 'BP-7024': 'Bạc chặn nửa'
  };
  const FEATURES = {
    funnel: { text: 'Phễu dẫn hướng đưa túi vào giữa đường, giảm nguy cơ kẹt khi đi vào cảm biến.' },
    paddedArm: { text: 'Tay gạt nối dài có lớp đệm mềm giúp tiếp xúc túi nhẹ nhàng hơn; thay đổi hình dáng cần gạt.' },
    lids: { text: 'Nắp ngăn tự đóng giúp khu thu gom gọn gàng; nắp bật khi túi rơi vào ngăn.' },
    tray: { text: 'Khay hứng tràn giữ lại túi bị gạt trượt, nhưng vẫn tính là phân loại sai.' }
  };
  const SLOTS = [
    { id: 'mouth', name: 'Cửa nạp rác', options: [{ id: 'funnel', label: 'Phễu dẫn hướng', feature: 'funnel', parts: { 'BP-7073': 2, 'BP-7012': 3 } }] },
    { id: 'arm', name: 'Đầu tay gạt M1', options: [{ id: 'paddedArm', label: 'Tay gạt có đệm', feature: 'paddedArm', parts: { 'BP-7528': 1, 'BP-7024': 2, 'BP-7012': 3 } }] },
    { id: 'bins', name: 'Hai ngăn phân loại', options: [{ id: 'lids', label: 'Nắp ngăn tự đóng', feature: 'lids', parts: { 'BP-7524A': 2, 'BP-7012': 4 } }] },
    { id: 'bottom', name: 'Dưới trạm phân loại', options: [{ id: 'tray', label: 'Khay hứng tràn', feature: 'tray', parts: { 'BP-8818': 1, 'BP-3976': 1, 'BP-7024': 2 } }] }
  ];
  const PRESETS = [
    { id: 'funnel', title: 'Phễu dẫn hướng', text: 'Hạn chế kẹt tại cửa quét màu.', pick: { mouth: 'funnel' } },
    { id: 'paddedArm', title: 'Tay gạt có đệm', text: 'Gạt nhẹ nhàng bằng đầu tay nối dài.', pick: { arm: 'paddedArm' } },
    { id: 'lids', title: 'Nắp ngăn tự đóng', text: 'Che hai ngăn khi chưa có túi rác.', pick: { bins: 'lids' } },
    { id: 'tray', title: 'Khay hứng tràn', text: 'Thu gom túi trượt để dọn lại.', pick: { bottom: 'tray' } }
  ];
  const card = (color, icon) => `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="5" y="31" width="54" height="8" rx="3" fill="#d5e8e7" stroke="#274653" stroke-width="2"/><g fill="${color}" stroke="#274653" stroke-width="1.5">${icon}</g></svg>`;
  const PICS = {
    funnel: card('#52d6a4', '<path d="M8 9h48L38 29H26z"/>'),
    paddedArm: card('#e1c888', '<rect x="13" y="12" width="38" height="10" rx="5"/>'),
    lids: card('#48b5ee', '<path d="M7 18h23v7H7zM34 18h23v7H34z"/>'),
    tray: card('#e5a96d', '<path d="M9 23h46l-7 11H16z"/>')
  };
  // Vị trí 3D của chi tiết mỗi gói: trả về { 'slot:option': [chi tiết…] }
  function placements(DATA, H) {
    const parts = DATA.instances || [];
    if (!parts.length || typeof H?.make !== 'function') return {};
    const positions = parts.map(p => p.pos);
    const xmin = Math.min(...positions.map(p => p[0]));
    const xmax = Math.max(...positions.map(p => p[0]));
    const zmin = Math.min(...positions.map(p => p[2]));
    const zmax = Math.max(...positions.map(p => p[2]));
    const top = Math.max(...positions.map(p => p[1]));
    const mid = (xmin + xmax) / 2;
    const rot = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    // Tận dụng mesh từ bộ Alpha330 để phụ kiện hiển thị được dù build.json gốc không có creative.
    const reusable = {
      funnel: [8], paddedArm: [17], lids: [1], tray: [2]
    };
    const mk = (kind, pos, copies = 1) => {
      const mesh = reusable[kind].filter(i => i < DATA.meshes.length);
      return mesh.length ? Array.from({ length: copies }, (_, i) => H.make(null,
        [pos[0] + (copies === 2 ? (i ? .027 : -.027) : 0), pos[1], pos[2]], rot, mesh, kind)) : [];
    };
    return {
      'mouth:funnel': mk('funnel', [xmax + .012, top + .015, 0]),
      'arm:paddedArm': mk('paddedArm', [mid, top + .025, 0]),
      'bins:lids': mk('lids', [mid, top + .001, zmin - .022], 2),
      'bottom:tray': mk('tray', [mid, -.012, (zmin + zmax) / 2])
    };
  }

  window.LESSON = {
    ...SPEC,
    blocks: { ...SPEC.blocks, waits: [0.5] },
    book(d) {
      const src = `assets/lop3-bai04/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Hình bước ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: d.page === 18 ? 'Trạm phân loại đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
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
