// Bài 10 – Bạn gió tinh nghịch, gió ở đâu (cối xoay gió): 15 bước theo sách hướng dẫn lắp
// (references/drive_bai10/bai10_huong_dan_lap.pdf). File .io không chia mô hình con: chỉ số trong `parts` là thứ tự
// dòng linh kiện của mô hình chính (model2.ldr). Mỗi bước đã đối chiếu ô linh kiện + viền đỏ của trang PDF.
// Bước 15 chỉ quan sát mô hình hoàn chỉnh.
'use strict';

const COUNT = 41;
const list = [
  { parts: [2], text: 'Đặt khung đế 7×11 màu xanh ngọc.' },
  { parts: [3, 4, 5, 6], text: 'Cắm 4 chốt đen đứng ở bốn góc khung.' },
  { parts: [1], text: 'Lắp bộ não M5-RCU lên 4 chốt.' },
  { parts: [7, 13, 8, 10, 11, 12], text: 'Lắp 2 thanh chữ L trắng và 4 chốt trục màu xám.' },
  { parts: [14, 15, 16, 17], text: 'Cắm 4 chốt đen vào 2 thanh chữ L.' },
  { parts: [9, 18], text: 'Lắp 2 thanh trắng 15 lỗ làm trụ cối xoay gió.' },
  { parts: [19, 20, 21, 22], text: 'Lắp 2 khối nối 4 chốt màu xám và 2 chốt có lỗ ngang trên đỉnh trụ.' },
  { parts: [0, 23], text: 'Lắp động cơ lên đỉnh trụ và cắm trục đỏ vào động cơ.' },
  { parts: [24, 25], text: 'Lắp 2 khối 3 cánh vào trục đỏ – đây là bầu cánh quạt.' },
  { parts: [26, 30, 31, 27, 28, 29], text: 'Cắm 3 chốt đen và 3 chốt trục xanh dương vào bầu cánh.' },
  { parts: [32, 33, 34], text: 'Lắp 3 thanh trắng 7 lỗ làm 3 cánh quạt.' },
  { parts: [36, 37], text: 'Cắm 2 chốt đen bên cạnh bộ não.' },
  { parts: [38, 39, 40], text: 'Lắp thanh chữ L và 2 chốt đen để giữ nút bấm.' },
  { parts: [35], text: 'Lắp cảm biến chạm (nút bấm màu đỏ).' },
  { parts: [], text: 'Hoàn thành cối xoay gió!' }
];

const steps = list.map((s, i) => ({ ...s, scope: 'Main', group: '', sub: 0, subCount: 0, joins: [], page: i + 1 }));
const byPart = new Map();
steps.forEach((step, index) => {
  for (const part of step.parts) {
    if (byPart.has(part)) throw Error('Linh kiện bị lặp: ' + part);
    byPart.set(part, { step: index + 1, groupPath: 'Main' });
  }
});
if (byPart.size !== COUNT || [...byPart.keys()].some(i => !Number.isInteger(i) || i < 0 || i >= COUNT))
  throw Error(`Sơ đồ lắp không đủ ${COUNT} vị trí: ${byPart.size}`);
if (steps.length !== 15) throw Error('Sách có 15 bước, sơ đồ có ' + steps.length);

module.exports = {
  steps,
  byPart,
  stepInfo: steps.map(({ scope, group, sub, subCount, joins, page }) => ({ scope, group, sub, subCount, joins, page })),
  stepDescriptions: steps.map(({ text }) => text),
  finalStep: steps.length,
  count: COUNT,
  // Cụm quay: trục đỏ, 2 khối 3 cánh, 6 chốt, 3 thanh cánh quạt
  rotor: [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34]
};
