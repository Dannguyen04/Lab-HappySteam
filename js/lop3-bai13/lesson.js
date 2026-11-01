// Cấu hình Bài 13 lớp 3 – Phi thuyền không gian. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop3/bai13/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop3/bai13/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop3-bai13",
    "label": "Bài 13",
    "code": "ZM3-13",
    "sheetName": "Lớp 3 · Bài 13: Phi thuyền không gian",
    "store": "zm3b13_",
    "baseName": "Thân phi thuyền",
    "Engine": "RocketEngine",
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
        "title": "Lắp phi thuyền",
        "text": "Bấm “Đã lắp xong bước này” ở cả 41 bước của chặng Lắp ráp.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Chạy hết một vòng mẫu",
        "text": "Lắp đúng 10 khối của ảnh lập trình và chạy hết một vòng, kể cả khi phải phanh."
      },
      "m3": {
        "n": 3,
        "title": "Cất cánh trước cuối đường băng",
        "text": "Chỉnh thời gian chạy từng cấp. Mẫu 3–3–3 giây thiếu một chút vận tốc; tăng khối Chờ sau cấp Nhanh lên 4 giây để thử lại."
      },
      "m4": {
        "n": 4,
        "title": "Nâng cấp phi thuyền",
        "text": "Gắn ít nhất một gói sáng tạo và chạy mô phỏng để thấy ảnh hưởng tới tăng tốc.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Cất cánh ở ba thiên thể",
        "text": "Nâng cao: trọng lực thay đổi theo lượt. Quan sát quãng lấy đà rồi chỉnh thời gian để cất cánh ở cả ba môi trường."
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
        "melodyB",
        "lowSpeed",
        "mediumSpeed",
        "highSpeed",
        "wait"
      ],
      "pro": [
        "motorPower",
        "motorReverse",
        "motorStop"
      ],
      "sample": [
        "start",
        "melodyB",
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
        [
          "highSpeed",
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
      "melody",
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
      "store": "zm3b13.creative",
      "emptyText": "Thân phi thuyền cơ bản – chưa có tính năng mới."
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
    wings: { text: 'Cánh phụ thăng bằng: nhẹ, giúp tàu ổn định nên gia tốc tăng khoảng 2%.' },
    boosters: { text: 'Cụm động cơ đẩy: thêm lực đẩy, gia tốc tăng khoảng 8%.' },
    radar: { text: 'Ăng-ten radar: thêm khối lượng nên gia tốc giảm khoảng 2%.' },
    legs: { text: 'Chân đáp giảm chấn: nặng hơn nên gia tốc giảm khoảng 3%, đổi lại hạ cánh êm.' }
  };
  const SLOTS = [
    { id: 'wing', name: 'Hai bên mũi tàu', options: [{ id: 'wings', label: 'Cánh phụ thăng bằng', feature: 'wings', parts: { 'BP-7528': 1, 'BP-7073': 2, 'BP-7012': 4 } }] },
    { id: 'tail', name: 'Đuôi tàu', options: [{ id: 'boosters', label: 'Cụm động cơ đẩy', feature: 'boosters', parts: { 'BP-8818': 1, 'BP-7524A': 2, 'BP-7012': 3 } }] },
    { id: 'top', name: 'Trên nóc tàu', options: [{ id: 'radar', label: 'Ăng-ten radar', feature: 'radar', parts: { 'BP-7024': 2, 'BP-7073': 1, 'BP-7012': 2 } }] },
    { id: 'belly', name: 'Dưới bụng tàu', options: [{ id: 'legs', label: 'Chân đáp giảm chấn', feature: 'legs', parts: { 'BP-3976': 1, 'BP-7524A': 2, 'BP-7012': 2 } }] }
  ];
  const PRESETS = [
    { id: 'wings', title: 'Cánh phụ thăng bằng', text: 'Tăng nhẹ gia tốc.', pick: { wing: 'wings' } },
    { id: 'boosters', title: 'Cụm động cơ đẩy', text: 'Lực đẩy mạnh hơn.', pick: { tail: 'boosters' } },
    { id: 'radar', title: 'Ăng-ten radar', text: 'Liên lạc nhưng nặng hơn.', pick: { top: 'radar' } },
    { id: 'legs', title: 'Chân đáp giảm chấn', text: 'Hạ cánh êm, hơi nặng.', pick: { belly: 'legs' } }
  ];
  const card = (color, icon) => `<svg viewBox="0 0 64 48" aria-hidden="true"><ellipse cx="32" cy="26" rx="26" ry="9" fill="#f5efe0" stroke="#2b303b" stroke-width="2"/><circle cx="18" cy="38" r="5" fill="#2b303b"/><circle cx="46" cy="38" r="5" fill="#2b303b"/><g fill="${color}" stroke="#283c49" stroke-width="1.3">${icon}</g></svg>`;
  const PICS = {
    wings: card('#60d9e5', '<path d="M30 20L14 8h14l8 12z"/><path d="M34 32l-16 8h14l8-8z"/>'),
    boosters: card('#ff9a4d', '<rect x="2" y="18" width="14" height="6" rx="2"/><rect x="2" y="27" width="14" height="6" rx="2"/>'),
    radar: card('#e1e6ee', '<path d="M32 17V8" fill="none"/><path d="M22 8h20l-6 5h-8z"/>'),
    legs: card('#9eabb8', '<path d="M22 32v8h-6M42 32v8h6" fill="none" stroke-width="3"/>')
  };
  // Vị trí 3D của chi tiết mỗi gói: trả về { 'slot:option': [chi tiết…] }. Mũi tàu ở phía +z.
  function placements(DATA, H) {
    const parts = DATA.instances || [];
    if (!parts.length) return {};
    const meshes = DATA.creative || {};
    const pos = parts.map(p => p.pos);
    const top = Math.max(...pos.map(p => p[1]));
    const front = Math.max(...pos.map(p => p[2]));
    const back = Math.min(...pos.map(p => p[2]));
    const middle = (Math.min(...pos.map(p => p[0])) + Math.max(...pos.map(p => p[0]))) / 2;
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const mk = (kind, center) => meshes[kind]?.length ? [H.make(null, center, I, meshes[kind], kind)] : [];
    return {
      'wing:wings': mk('wings', [middle, 0.03, front - 0.03]),
      'tail:boosters': mk('boosters', [middle, 0.04, back - 0.015]),
      'top:radar': mk('radar', [middle, top + 0.01, 0.02]),
      'belly:legs': mk('legs', [middle - 0.05, 0.004, -0.02])
    };
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const n = d.step || d.page;
      const src = `assets/lop3-bai13/step-${String(n).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Bước ${n}: hình sách hướng dẫn lắp ráp phi thuyền`,
        loc: `Bước ${n} · trang ${d.page || n}`,
        cap: n === 41 ? 'Thân phi thuyền đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
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
