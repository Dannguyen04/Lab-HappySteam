// Cấu hình Bài 8 lớp 1 – Ngôi nhà thông minh – Cổng tự động. Dữ liệu chung (nhiệm vụ, khối lệnh, mã bài) nằm trong khối SPEC,
// sinh từ content/lop1/bai08/lesson.json. Phần viết tay ở dưới: ảnh sách, chi tiết gửi Google Sheets, gói sáng tạo.
(function () {
  'use strict';

  // <lesson.json> – phần dưới do scripts/new-lesson.js sinh từ content/lop1/bai08/lesson.json, đừng sửa tay – sửa lesson.json rồi chạy lại
  const SPEC = {
    "id": "lop1-bai08",
    "label": "Bài 8",
    "code": "ZM8",
    "sheetName": "Lớp 1 · Bài 8: Ngôi nhà thông minh – Cổng tự động",
    "store": "zm8_",
    "baseName": "Cổng tự động",
    "Engine": "GateEngine",
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
        "title": "Lắp cổng thông minh",
        "text": "Hoàn thành đủ 19 bước lắp cổng, mắt siêu âm và động cơ M1.",
        "go": [
          "assembly",
          "Đến chặng lắp ráp"
        ]
      },
      "m2": {
        "n": 2,
        "title": "Cổng biết đón khách",
        "text": "Ghép đúng 13 khối theo sách, chạy đủ một lần mở rồi đóng cổng."
      },
      "m3": {
        "n": 3,
        "title": "Cho bạn bước vào an toàn",
        "text": "Đổi đúng khối Chờ đầu tiên thành 1 giây để cửa mở đủ rộng cho bạn đi qua."
      },
      "m4": {
        "n": 4,
        "title": "Thiết kế cổng nhà của em",
        "text": "Gắn thêm mái hiên, đèn xanh GO, biển số nhà hoặc hàng rào hoa rồi chạy thử.",
        "go": [
          "creative",
          "Đến xưởng sáng tạo"
        ]
      },
      "m5": {
        "n": 5,
        "title": "Chọn đúng khoảng cách",
        "text": "Chạm khối Chờ vật cản để chọn khoảng cách 15–20 cm. Đừng chọn quá gần hoặc quá xa!"
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
        "displayGO",
        "displayArrowDown",
        "highSpeedCCWM1",
        "highSpeedM1",
        "wait",
        "motorStop"
      ],
      "pro": [
        "displaySmile",
        "lowSpeed"
      ],
      "sample": [
        "start",
        "repeatStart",
        "obstacle",
        "displayGO",
        [
          "highSpeedCCW",
          {
            "port": "M1"
          }
        ],
        [
          "wait",
          {
            "duration": 0.2
          }
        ],
        "motorStop",
        "obstacle",
        "displayArrowDown",
        [
          "highSpeed",
          {
            "port": "M1"
          }
        ],
        [
          "wait",
          {
            "duration": 0.2
          }
        ],
        "motorStop",
        "repeatEnd"
      ],
      "empty": [
        "start",
        "repeatStart",
        "repeatEnd"
      ],
      "sensorRange": true
    },
    "sampleSig": [
      "start",
      "repeatStart",
      "sensor_obstacle",
      "display",
      "motor:high",
      "wait:0.2",
      "stop",
      "sensor_obstacle",
      "display",
      "motor:high",
      "wait:0.2",
      "stop",
      "repeatEnd"
    ],
    "creative": {
      "store": "zm8.creative",
      "emptyText": "Cổng tự động cơ bản – chưa có tính năng mới."
    }
  };
  // </lesson.json>

  // Định mức giả định cho hoạt động sáng tạo, cần kiểm số lượng thực trong hộp Alpha 330.
  const KIT = { 'BP-7021': 4, 'BP-7525A': 4, 'BP-7012': 12,
    'BP-8814': 4, 'BP-8819': 4, 'BP-7075': 4, 'BP-7526A': 3 };
  const NAMES = { 'BP-7021': 'Thanh hiên dài', 'BP-7525A': 'Thanh ngang',
    'BP-7012': 'Chốt gắn', 'BP-8814': 'Thanh hàng rào',
    'BP-8819': 'Trụ hàng rào', 'BP-7075': 'Khớp đèn', 'BP-7526A': 'Tấm biển' };
  const FEATURES = {
    canopy: { text: 'Mái hiên che mưa: đứng chờ vẫn khô ráo.' },
    led: { text: 'Đèn xanh GO: nhìn rõ lúc cửa mời bạn vào.' },
    number: { text: 'Biển số nhà: ai cũng nhận ra nhà của em.' },
    flowers: { text: 'Hàng rào hoa: khu vườn rực rỡ sắc màu.' }
  };
  const SLOTS = [
    { id:'roof', name:'Mái trước cổng', options:[
      { id:'canopy', label:'Mái hiên che mưa', feature:'canopy', parts:{'BP-7021':2,'BP-7012':2} }] },
    { id:'lamp', name:'Phía trên mắt cổng', options:[
      { id:'led', label:'Đèn xanh GO', feature:'led', parts:{'BP-7075':1,'BP-7012':1} }] },
    { id:'sign', name:'Cạnh thân cổng', options:[
      { id:'number', label:'Biển số nhà', feature:'number', parts:{'BP-7526A':1,'BP-7012':2} }] },
    { id:'garden', name:'Ven lối vào', options:[
      { id:'flowers', label:'Hàng rào hoa', feature:'flowers', parts:{'BP-8814':2,'BP-8819':2,'BP-7012':2} }] }
  ];
  const PRESETS = [
    { id:'canopy', title:'☂️ Mái hiên', text:'Che mưa cho khách.', pick:{roof:'canopy'} },
    { id:'led', title:'💡 Đèn cổng', text:'GO sáng rõ hơn.', pick:{lamp:'led'} },
    { id:'number', title:'🏡 Biển số nhà', text:'Nhận ra nhà số 8.', pick:{sign:'number'} },
    { id:'flowers', title:'🌼 Hàng rào hoa', text:'Trang trí lối vào.', pick:{garden:'flowers'} }
  ];
  const icon = (drawing, color) => `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="21" y="18" width="22" height="26" rx="4" fill="#b7d8eb"/><g fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${drawing}</g></svg>`;
  const PICS = {
    canopy: icon('<path d="M6 19L32 4l26 15H6zM12 20v22m40-22v22"/>','#ec8d57'),
    led: icon('<circle cx="32" cy="14" r="11"/><path d="M26 28h12m-10 6h8"/>','#4ba95c'),
    number: icon('<rect x="15" y="8" width="34" height="28" rx="4"/><path d="M24 16h16m-8 0v14"/>','#426d9e'),
    flowers: icon('<path d="M4 41h56M12 41V24m20 17V17m20 24V23M6 23l6-8 6 8m8-6 6-9 6 9m8 6 6-8 6 8"/>','#d97d9f')
  };
  // Vị trí 3D minh họa: tái sử dụng mesh sẵn có, không thêm chi tiết vào mô hình lắp chuẩn.
  function placements(DATA, H) {
    if (!DATA.instances?.length) return {};
    const one = name => (H.by(name) || [])[0];
    const hub = one('BE-5158');
    const sensor = one('BE-6313');
    const roof = sensor?.pos || [0, .15, 0];
    const base = hub?.pos || [0, .05, 0];
    const place = (name, xyz) => {
      const item = one(name);
      return item ? [H.make(item, xyz, item.rotation)] : [];
    };
    return {
      'roof:canopy': [
        ...place('BP-7021',[roof[0]-.03,roof[1]+.065,roof[2]]),
        ...place('BP-7021',[roof[0]+.03,roof[1]+.065,roof[2]])
      ],
      'lamp:led': place('BP-7075',[roof[0],roof[1]+.038,roof[2]-.025]),
      'sign:number': place('BP-7526A',[base[0]-.065,base[1]+.06,base[2]-.025]),
      'garden:flowers': [
        ...place('BP-8814',[base[0]-.1,base[1]-.025,base[2]-.04]),
        ...place('BP-8819',[base[0]-.13,base[1]-.025,base[2]-.04])
      ]
    };
  }

  window.LESSON = {
    ...SPEC,
    defaultMode:'kid',
    blocks: { ...SPEC.blocks, sensorRanges:[5,15,20,50] },
    book(d) {
      const src = `assets/lop1-bai08/step-${String(d.page).padStart(2, '0')}.jpg`;
      return {
        src,
        alt: `Hình bước ${d.page} trong sách hướng dẫn lắp ráp`,
        loc: `Bước ${d.page} · trang ${d.page}`,
        cap: d.page === 19 ? 'Cổng tự động đã hoàn thành.' : 'Ô nền xanh là linh kiện cần lấy, viền đỏ là chỗ lắp.',
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
