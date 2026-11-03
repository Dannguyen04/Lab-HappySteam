// Cấu hình Bài 1 lớp 3 – Cấu trúc bền vững – Phòng thí nghiệm động đất. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop3/bai01/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop3/bai01/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop3-bai01",
    "label": "Bài 1",
    "code": "ZM3-01",
    "sheetName": "Lớp 3 · Bài 1: Cấu trúc bền vững",
    "store": "zm3b01_",
    "baseName": "Bàn rung địa chấn",
    "Engine": "QuakeEngine",
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
        "title": "Lắp bàn rung và khung nhà",
        "text": "Bấm “Đã lắp xong bước này” ở cả 27 bước của chặng Lắp ráp.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Thử rung ba cấp tốc độ",
        "text": "Chạy một vòng chậm → vừa → nhanh theo đúng 9 vị trí khối của giáo án; quan sát kết cấu khi rung mạnh."
      },
      "m3": {
        "n": 3,
        "title": "Rút ngắn nhịp rung mạnh",
        "text": "Giữ tốc độ và chiều quay đúng mẫu; đổi thời gian rung ở cấp nhanh từ 3 giây xuống 1 giây để nhà trụ vững."
      },
      "m4": {
        "n": 4,
        "title": "Thử bốn cách gia cố nhà",
        "text": "Thử ít nhất một gói kết cấu: giằng tam giác, con lắc giảm chấn, cột góc hay đệm chân móng.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Điều chỉnh theo tải địa chấn",
        "text": "Nâng cao: kiểm định ba đợt địa chấn với nhịp rung mạnh yêu cầu lần lượt 1, 2, 1 giây. Sau mỗi lượt đạt, thay thời gian Wait cuối và chạy lại."
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
        "lowSpeed",
        "mediumSpeed",
        "highSpeedCCW",
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
        [
          "lowSpeed",
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
        [
          "mediumSpeed",
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
        "highSpeedCCW",
        [
          "wait",
          {
            "duration": 3
          }
        ],
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
      "wait:3",
      "motor:medium",
      "wait:3",
      "motor:high",
      "wait:3",
      "repeatEnd"
    ],
    "creative": {
      "store": "zm3b01.creative",
      "emptyText": "Bàn rung địa chấn cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Định mức THAM KHẢO cho bài tập sáng tạo; kiểm phụ kiện rời với kit thực trước khi lắp.
  const KIT = { 'BP-7526A': 3, 'BP-3976': 3, 'BP-7079': 10, 'BP-7009': 8, 'BP-7012': 40 };
  const NAMES = {
    'BP-7526A': 'Thanh giằng dài', 'BP-3976': 'Khung chữ nhật',
    'BP-7079': 'Thanh góc', 'BP-7009': 'Chốt / đệm ngắn', 'BP-7012': 'Chốt liên kết'
  };
  const FEATURES = {
    brace: { text: 'Giằng chéo tam giác: chia lực ngang lên bộ khung, giúp nhà giảm biến dạng.' },
    damper: { text: 'Con lắc giảm chấn ở mái: đối trọng dịch chuyển ngược chiều rung của khung.' },
    columns: { text: 'Cột góc gia cường: thêm trụ để liên kết khung và chống xiêu vẹo.' },
    pads: { text: 'Đệm giảm chấn chân móng: giảm truyền dao động từ bàn rung lên nhà.' }
  };
  const SLOTS = [
    { id: 'walls', name: 'Hai mặt tường', options: [{ id: 'brace', label: 'Giằng tam giác', feature: 'brace', parts: { 'BP-7526A': 2, 'BP-7012': 4 } }] },
    { id: 'roof', name: 'Đỉnh mái', options: [{ id: 'damper', label: 'Con lắc giảm chấn', feature: 'damper', parts: { 'BP-3976': 1, 'BP-7012': 2 } }] },
    { id: 'corners', name: 'Bốn góc nhà', options: [{ id: 'columns', label: 'Cột gia cường', feature: 'columns', parts: { 'BP-7079': 4, 'BP-7012': 4 } }] },
    { id: 'foundation', name: 'Bốn chân móng', options: [{ id: 'pads', label: 'Đệm chân móng', feature: 'pads', parts: { 'BP-7009': 4 } }] }
  ];
  const PRESETS = [
    { id: 'brace', title: 'Giằng tam giác', text: 'Khung ít bị xô lệch khi rung.', pick: { walls: 'brace' } },
    { id: 'damper', title: 'Con lắc mái', text: 'Giảm biên độ lắc mái.', pick: { roof: 'damper' } },
    { id: 'columns', title: 'Cột gia cường', text: 'Tăng sức chịu lực ở bốn góc.', pick: { corners: 'columns' } },
    { id: 'pads', title: 'Đệm chân móng', text: 'Hấp thu rung động từ đế.', pick: { foundation: 'pads' } }
  ];
  const card = (color, shape) => `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="8" y="33" width="48" height="7" rx="2" fill="#c3e1e4"/><path d="M15 32V12H49V32" stroke="#375c6d" stroke-width="4" fill="none"/><g stroke="${color}" stroke-width="5" stroke-linecap="round" fill="none">${shape}</g></svg>`;
  const PICS = {
    brace: card('#ecaa4c', '<path d="M16 32L48 12M48 32L16 12"/>'),
    damper: card('#fa977a', '<path d="M32 12V4M32 4L23 24"/><circle cx="23" cy="24" r="7" fill="#fa977a"/>'),
    columns: card('#fb9d67', '<path d="M17 32V11M47 32V11"/>'),
    pads: card('#f2b15a', '<path d="M11 37H24M39 37H53"/>')
  };
  function placements(DATA, H) {
    if (!DATA?.instances?.length) return {};
    // Dùng mesh đã có trong build gốc để biểu diễn phụ kiện 3D mới, không thay build.json.
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const mk = (name, mesh, points) => points.map(p => H.make(null, p, I, [mesh], name));
    const roof = Math.max(...DATA.instances.map(p => p.pos[1]));
    const house = DATA.instances.filter(p => p.groupPath.includes('/1'));
    const cx = house.reduce((n, p) => n + p.pos[0], 0) / (house.length || 1);
    const cz = house.reduce((n, p) => n + p.pos[2], 0) / (house.length || 1);
    return {
      'walls:brace': mk('brace', 12, [[cx - .025, .09, cz - .025], [cx + .025, .09, cz + .025]]),
      'roof:damper': [...mk('damper', 21, [[cx, roof + .027, cz]]), ...mk('weight', 16, [[cx, roof + .04, cz]])],
      'corners:columns': mk('columns', 14, [[cx - .035, .08, cz - .04], [cx + .035, .08, cz - .04], [cx - .035, .08, cz + .04], [cx + .035, .08, cz + .04]]),
      'foundation:pads': mk('pads', 16, [[cx - .035, .01, cz - .04], [cx + .035, .01, cz - .04], [cx - .035, .01, cz + .04], [cx + .035, .01, cz + .04]])
    };
  }

  window.LESSON = {
    ...SPEC,
    blocks: { ...SPEC.blocks, motorDirections: true },
    book(d) {
      const src = `assets/lop3-bai01/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Hình bước ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: d.page === 27 ? 'Bàn rung địa chấn đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
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
