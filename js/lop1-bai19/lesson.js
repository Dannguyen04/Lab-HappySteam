// Cấu hình Bài 19 lớp 1 – Ốc sên quý hiếm. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop1/bai19/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop1/bai19/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop1-bai19",
    "label": "Bài 19",
    "code": "ZM19",
    "sheetName": "Bài 19: Ốc sên quý hiếm",
    "store": "zm19_",
    "baseName": "Thân ốc sên",
    "Engine": "SnailEngine",
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
        "title": "Lắp xong ốc sên robot",
        "text": "Bấm “Đã lắp xong bước này” ở cả 21 bước của chặng Lắp ráp.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Ghép khối giống hàng mẫu",
        "text": "Đặt các khối giống hàng mẫu mờ rồi chạm Start. Ốc sên bò tới đá, dừng và rẽ."
      },
      "m3": {
        "n": 3,
        "title": "Ăn đủ 3 lá rau non",
        "text": "Rẽ 0,2 giây còn ít, ốc sên húc đá. Chạm khối Chờ sau Rẽ trái để rẽ lâu hơn."
      },
      "m4": {
        "n": 4,
        "title": "Thử ốc sên sáng tạo",
        "text": "Gắn thêm râu, đèn hoặc bánh gai ở chặng Sáng tạo. Rồi cho ốc sên bò thử.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Bò qua vệt nhớt dính",
        "text": "Đoạn đầu vườn có nhớt dính, ốc sên bò chậm còn 0,4 lần. Xem ô Quãng đường rồi tăng thời gian Tiến, hoặc gắn bánh gai."
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
        "obstacle",
        "moveForward",
        "turnLeft",
        "motorPower",
        "wait",
        "motorStop",
        "melodyA"
      ],
      "pro": [],
      "sample": [
        "start",
        "repeatStart",
        "obstacle",
        "moveForward",
        [
          "wait",
          {
            "duration": 1
          }
        ],
        "obstacle",
        "motorStop",
        "turnLeft",
        [
          "wait",
          {
            "duration": 0.2
          }
        ],
        "repeatEnd"
      ],
      "empty": [
        "start"
      ]
    },
    "sampleSig": [
      "start",
      "repeatStart",
      "sensor_obstacle",
      "drive",
      "wait:1",
      "sensor_obstacle",
      "stop",
      "drive",
      "wait:0.2",
      "repeatEnd"
    ],
    "creative": {
      "store": "zm19.creative",
      "emptyText": "Thân ốc sên cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Số lượng trong hộp kit ZM Alpha 330 (set2321A, theo thư viện RoboBuilder)
  const KIT = { 'BP-3993': 3, 'BP-7024': 6, 'BP-7027': 4, 'BP-3976': 2, 'BP-7528': 4, 'BP-7073': 3, 'BP-7012': 40 };
  const NAMES = {
    'BP-3993': 'Trục 7 (râu, đèn)',
    'BP-7024': 'Bạc nửa (đầu râu, đèn)',
    'BP-7027': 'Khớp góc',
    'BP-3976': 'Khung 5×7 (đế đèn mai)',
    'BP-7528': 'Thanh 15 lỗ (vành gai)',
    'BP-7073': 'Thanh cong (gai bánh)',
    'BP-7012': 'Chốt đen'
  };
  const FEATURES = {
    antenna: { text: 'Râu kép dài: thêm hai râu ngọ nguậy, chỉ để trang trí' },
    glow: { text: 'Mai phát quang: viền sáng xanh quanh mai, chỉ để trang trí' },
    grip: { text: 'Vành bánh gai: bánh bám tốt, không bị nhớt dính làm chậm' },
    eyes: { text: 'Đèn mắt kép: hai đèn pha vàng soi đường phía trước, chỉ để trang trí' }
  };
  const SLOTS = [
    { id: 'head', name: 'Đầu ốc sên', options: [{ id: 'antenna', label: 'Râu kép dài', parts: { 'BP-3993': 2, 'BP-7024': 2 }, feature: 'antenna' }] },
    { id: 'shell', name: 'Mai ốc', options: [{ id: 'glow', label: 'Mai phát quang', parts: { 'BP-3976': 1, 'BP-7024': 2 }, feature: 'glow' }] },
    { id: 'wheel', name: 'Hai bên bánh xe', options: [{ id: 'grip', label: 'Vành bánh gai', parts: { 'BP-7528': 1, 'BP-7073': 2, 'BP-7012': 4 }, feature: 'grip' }] },
    { id: 'eye', name: 'Trước mặt', options: [{ id: 'eyes', label: 'Đèn mắt kép', parts: { 'BP-7027': 2, 'BP-7024': 2 }, feature: 'eyes' }] }
  ];
  const PRESETS = [
    { id: 'antenna', title: 'Râu kép dài', text: 'Thêm hai râu dài ngọ nguậy.', pick: { head: 'antenna' } },
    { id: 'glow', title: 'Mai phát quang', text: 'Mai ốc sáng xanh trong đêm.', pick: { shell: 'glow' } },
    { id: 'grip', title: 'Vành bánh gai', text: 'Gai nhỏ giúp bánh không dính nhớt.', pick: { wheel: 'grip' } },
    { id: 'eyes', title: 'Đèn mắt kép', text: 'Hai đèn pha vàng chiếu phía trước.', pick: { eye: 'eyes' } }
  ];
  // Hình gói: lấy từ js/lop1-bai19/art.js (SnailArt.PICS) khi có; tạm dùng hình đơn giản này
  const FALLBACK_PICS = {
    antenna: '<svg viewBox="0 0 64 48" aria-hidden="true"><ellipse cx="30" cy="38" rx="22" ry="7" fill="#d9c9a3" stroke="#1e2a34" stroke-width="1.8"/><path d="M44 34l8-22M38 34l2-24" stroke="#1e2a34" stroke-width="2.2" stroke-linecap="round"/><circle cx="52" cy="11" r="4" fill="#8ee06a" stroke="#1e2a34" stroke-width="1.6"/><circle cx="40" cy="9" r="4" fill="#8ee06a" stroke="#1e2a34" stroke-width="1.6"/></svg>',
    glow: '<svg viewBox="0 0 64 48" aria-hidden="true"><circle cx="30" cy="26" r="17" fill="#b8f08a" opacity=".45"/><circle cx="30" cy="26" r="12" fill="#6fcf4a" stroke="#1e2a34" stroke-width="1.8"/><path d="M30 26m-5 0a5 5 0 1 1 5 5" fill="none" stroke="#1e2a34" stroke-width="1.8"/><ellipse cx="30" cy="42" rx="22" ry="4" fill="#d9c9a3" stroke="#1e2a34" stroke-width="1.5"/></svg>',
    grip: '<svg viewBox="0 0 64 48" aria-hidden="true"><circle cx="32" cy="26" r="14" fill="#3dc1dc" stroke="#1e2a34" stroke-width="1.8"/><circle cx="32" cy="26" r="19" fill="none" stroke="#1e2a34" stroke-width="3" stroke-dasharray="2.5 3.5"/><circle cx="32" cy="26" r="4" fill="#fff" stroke="#1e2a34" stroke-width="1.5"/></svg>',
    eyes: '<svg viewBox="0 0 64 48" aria-hidden="true"><path d="M20 22l-14-8v22zM44 22l14-8v22z" fill="#ffe27a" opacity=".6"/><circle cx="20" cy="24" r="6" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.8"/><circle cx="44" cy="24" r="6" fill="#ffd23f" stroke="#1e2a34" stroke-width="1.8"/></svg>'
  };
  const PICS = new Proxy({}, { get: (_, k) => (window.SnailArt && window.SnailArt.PICS && window.SnailArt.PICS[k]) || FALLBACK_PICS[k] });

  // Vị trí gắn theo linh kiện thực tế của Bài 19; đầu ốc sên ở phía -X, mai (Smart Hub) ở giữa.
  function placements(DATA, H) {
    const { make, box, by } = H;
    const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const c = DATA.creative || {};
    const safe = fn => {
      try {
        return fn() || [];
      } catch (e) {
        return [];
      }
    };
    const rcu = () => box(by('BE-5158')),
      sensor = () => box(by('BE-6313')),
      wheel = () => by('BP-8850');
    return {
      'head:antenna': safe(() => {
        const b = sensor();
        return [-1, 1].map(side => make(null, [b.center[0] - 0.018, b.center[1] + 0.012, side * 0.042], I, c.antenna, 'antenna'));
      }),
      'shell:glow': safe(() => {
        const b = rcu();
        return [make(null, [b.center[0], b.hi[1], b.center[2]], I, c.glow, 'glow')];
      }),
      'wheel:grip': safe(() => wheel().map(w => make(null, w.pos.slice(), w.rotation.slice(), c.grip, 'grip'))),
      'eye:eyes': safe(() => {
        const b = sensor();
        // mesh đèn có hai bóng cách nhau theo X; xoay quanh Y để hai bóng nằm hai bên theo Z
        return [make(null, [b.lo[0] - 0.006, b.center[1] - 0.012, b.center[2]], [0, 0, 1, 0, 1, 0, -1, 0, 0], c.eyes, 'eyes')];
      })
    };
  }

  window.LESSON = {
    ...SPEC,
    book(d) {
      const src = `assets/lop1-bai19/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Hình bước ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: d.page === 21 ? 'Thân ốc sên đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
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
