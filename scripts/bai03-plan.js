// Bài 3 – Robot thám hiểm Milo: 22 bước theo sách hướng dẫn lắp (references/drive_bai3/bai3_huong_dan_lap.pdf).
// Chỉ số trong `parts` là thứ tự linh kiện khi trải model2.ldr của file .io (0–17 cụm đầu = SubModel Group 2,
// 18–39 thân = SubModel Group 1), KHÔNG phải mã. Mỗi bước đã đối chiếu ô linh kiện + viền đỏ của trang PDF.
// Bước 13, 14 chỉ đổi góc nhìn; 15–20 lắp riêng cụm đầu (20 chỉ quan sát); 21 ghép cụm đầu; 22 quan sát.
'use strict';

const HEAD = 'Main/Head';
const HEAD_NAME = 'đầu robot';
const COUNT = 40;

const base = [
  { parts: [23, 25, 26, 27], text: 'Cắm 2 chốt đen và thanh vàng 3 lỗ vào động cơ.' },
  { parts: [28], text: 'Đặt động cơ vào giữa khung đế 7×11 màu xanh ngọc.' },
  { parts: [30], text: 'Luồn trục 4 màu đen qua khung vào động cơ.' },
  { parts: [29], text: 'Luồn trục 3 màu xám ở phía bên kia động cơ.' },
  { parts: [32, 33], text: 'Lắp vành bánh xe và lốp xanh ngọc vào trục 3.' },
  { parts: [31, 34], text: 'Lắp bánh xe thứ hai vào trục 4 – một động cơ quay cả hai bánh.' },
  { parts: [18, 19, 20, 21], text: 'Cắm 2 chốt đen và 2 chốt có lỗ ngang lên khung.' },
  { parts: [22], text: 'Lắp thanh trắng 7 lỗ lên các chốt.' },
  { parts: [35, 36], text: 'Lắp 2 khối nối 4 chốt màu xám hai bên động cơ.' },
  { parts: [24], text: 'Lắp bộ não M5-RCU lên trên.' },
  { parts: [38, 39], text: 'Cắm 2 khớp chốt màu đen ở đầu khung.' },
  { parts: [37], text: 'Lắp bánh bi trắng phía trước.' },
  { parts: [], text: 'Quan sát thân robot đã hoàn thành.' },
  { parts: [], text: 'Xoay sang góc nhìn khác để kiểm tra thân robot.' }
];
const head = [
  { parts: [2, 3, 6, 1, 7], text: 'Lắp thanh cong trắng, 2 trục 3 và 2 chốt xanh dương.' },
  { parts: [0, 4, 8, 9], text: 'Lắp 4 khớp nối đen vào hai đầu thanh cong.' },
  { parts: [5], text: 'Lắp cảm biến siêu âm – đôi mắt của robot.' },
  { parts: [11, 12], text: 'Cắm 2 chốt đen hai bên cảm biến.' },
  { parts: [10, 13, 14, 15, 16, 17], text: 'Lắp 2 khớp góc, 2 trục 4 và 2 bạc vàng làm râu ăng-ten.' },
  { parts: [], text: 'Quan sát cụm đầu robot đã hoàn thành.' }
];

const steps = [];
base.forEach(s => steps.push({ ...s, scope: 'Main', group: '', sub: 0, subCount: 0, joins: [] }));
head.forEach((s, i) => steps.push({ ...s, scope: HEAD, group: HEAD_NAME, sub: i + 1, subCount: head.length, joins: [] }));
steps.push({ parts: [], text: 'Ghép cụm đầu vào phía trước thân robot.', scope: 'Main', group: '', sub: 0, subCount: 0, joins: [HEAD_NAME] });
const joinStep = steps.length;
steps.push({ parts: [], text: 'Hoàn thành Robot thám hiểm Milo!', scope: 'Main', group: '', sub: 0, subCount: 0, joins: [] });
steps.forEach((s, i) => (s.page = i + 1)); // số bước in trong sách = số bước ở đây

const headCount = 18;
const byPart = new Map();
steps.forEach((step, index) => {
  for (const part of step.parts) {
    if (byPart.has(part)) throw Error('Linh kiện bị lặp: ' + part);
    byPart.set(part, { step: index + 1, groupPath: step.scope });
  }
});
if (byPart.size !== COUNT || [...byPart.keys()].some(i => !Number.isInteger(i) || i < 0 || i >= COUNT))
  throw Error(`Sơ đồ lắp không đủ ${COUNT} vị trí: ${byPart.size}`);
for (const [i, a] of byPart) if ((i < headCount) !== (a.groupPath === HEAD)) throw Error('Linh kiện ' + i + ' sai cụm');
if (steps.length !== 22) throw Error('Sách có 22 bước, sơ đồ có ' + steps.length);

module.exports = {
  steps,
  byPart,
  stepInfo: steps.map(({ scope, group, sub, subCount, joins, page }) => ({ scope, group, sub, subCount, joins, page })),
  stepDescriptions: steps.map(({ text }) => text),
  finalStep: steps.length,
  joinStep,
  headCount,
  count: COUNT
};
