// Cấu hình Lớp 1 · Bài 12 – Thiên tai, lũ lụt – Đê ngăn lũ. Phần dùng chung (js/app.js, blocks-engine.js, mission-tracker.js)
// đọc window.LESSON; phần riêng của bài là js/bai12/dam-engine.js + flood-scene.js (+ art.js).
// Giáo án không có phần gắn thêm chi tiết nên không khai báo creative (xưởng sáng tạo dùng chung tự tắt); NV4 là "cải tiến, thi đấu lần 2".
(function () {
  'use strict';

  window.LESSON = {
    id: 'lop1-bai12',
    label: 'Bài 12',
    code: 'ZM12',
    sheetName: 'Bài 12: Thiên tai, lũ lụt – Đê ngăn lũ',
    store: 'zm12_',
    baseName: 'Khung đê',
    Engine: 'DamEngine',

    book(d) {
      const page = Math.max(1, Math.min(24, Number(d.page) || Number(d.step) || 1));
      return {
        src: `assets/lop1-bai12/step-${String(page).padStart(2, '0')}.jpg`,
        alt: `Hình lắp ráp gốc Bước ${page} của đê ngăn lũ`,
        loc: `Bước ${page} / 24`,
        cap: 'Làm theo hình bước này và đối chiếu mô hình 3D.',
        pdf: `references/lop1/bai12/bai12.pdf#page=${page}`
      };
    },

    missions: { core: ['m1', 'm2', 'm3', 'm4'], pro: ['m5'] },
    cards: {
      m2: { n: 2, title: 'Ghép khối giống hàng mẫu', text: 'Đặt các khối giống hàng mẫu mờ, chạm Start, rồi bấm ✋ để nhấn cảm biến chạm: nhấn một lần đê nâng lên, nhấn lần nữa đê hạ xuống.' },
      m3: { n: 3, title: 'Dựng đê trước khi lũ về', text: 'Lũ tràn tới đê ở giây thứ 5. Nhấn cảm biến để nâng đê lên ít nhất 40° và giữ đê dựng cho tới khi nước rút, làng không bị ngập. Gợi ý: nhấn một lần thôi, đừng hạ đê sớm.' },
      m4: { n: 4, title: 'Cải tiến và thi đấu lần 2', text: 'Chạy thắng lần 1, rồi đổi chương trình (đổi tốc độ hoặc số giây chờ) cho đê dựng nhanh hơn và chạy thắng lần 2.' },
      m5: { n: 5, title: 'Tính góc nâng đê', text: 'Mỗi lần lũ có mức khác nhau, đê phải nâng trong khoảng ô vàng (không thấp hơn mức lũ, không cao quá 20° để thuyền cứu hộ qua). Tính: góc = 11,25 × mức × số giây. Chặn đúng 3 mức lũ khác nhau.' },
      m1: { n: 1, title: 'Lắp xong đê ngăn lũ', text: 'Bấm “Đã lắp xong bước này” ở mọi bước của chặng Lắp ráp.', go: ['assembly', 'Đến chặng lắp ráp'] }
    },
    cardOrder: { kid: ['m2', 'm3', 'm4', 'm1'], pro: ['m2', 'm3', 'm4', 'm5', 'm1'] },

    // Chương trình mẫu trong giáo án: Start → lặp [Chờ nhấn → Quay chậm → Chờ 0,5s → Dừng → Chờ nhấn → Đổi chiều → Quay chậm → Chờ 0,5s → Dừng]
    blocks: {
      toolbox: ['touch', 'lowSpeed', 'highSpeed', 'motorPower', 'motorReverse', 'wait', 'motorStop', 'melodyA'],
      pro: [],
      sample: [
        'start', 'repeatStart',
        'touch', 'lowSpeed', ['wait', { duration: 0.5 }], 'motorStop',
        'touch', 'motorReverse', 'lowSpeed', ['wait', { duration: 0.5 }], 'motorStop',
        'repeatEnd'
      ],
      empty: ['start', 'repeatStart', 'repeatEnd']
    },

    details(t) {
      const out = [];
      const r = t.state.lastRun;
      if (r) out.push(`Chặn lũ mức ${r.level}°: đê nâng ${r.angle}°, tốc độ mức ${r.power}`);
      if (t.state.bHits && t.state.bHits.length) out.push('Đã chặn các mức lũ: ' + t.state.bHits.join(', ') + '°');
      return out.join(' · ');
    }
  };
})();
