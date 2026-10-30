// Bài 9: 28 bước theo sách hướng dẫn lắp chính thức (Bai9_Thong_tin_lien_lac_vu_tru.pdf).
// Chỉ số trong `parts` là thứ tự linh kiện khi trải model.ldr (0–22 cụm đầu vệ tinh, 23–60 thân), KHÔNG phải mã.
// Mỗi bước đã đối chiếu ô linh kiện + viền đỏ của trang PDF; cùng bảng với RBB_Studio/io2rbb/models/bai9.cjs.
// Bước 19, 20 chỉ đổi góc nhìn (không thêm linh kiện); 21–27 lắp riêng cụm đầu; 28 ghép cụm lên cột anten.
'use strict';

const HEAD = 'Main/Head';
const HEAD_NAME = 'đầu vệ tinh';

const base = [
  { parts: [25], text: 'Đặt khung đế 7×11 màu xanh ngọc.' },
  { parts: [26, 27, 28, 29], text: 'Cắm 4 chốt đen đứng vào khung – chỗ đặt bộ điều khiển.' },
  { parts: [24], text: 'Lắp bộ điều khiển M5-RCU lên 4 chốt.' },
  { parts: [30, 31], text: 'Cắm 2 chốt đen đứng ở phía trước khung.' },
  { parts: [32, 33], text: 'Lắp chốt vuông đen và khối nối 4 chốt màu xám.' },
  { parts: [23], text: 'Lắp động cơ vào khối nối.' },
  { parts: [38, 39, 50, 51], text: 'Cắm 4 chốt đen nằm ngang ở hai bên khung.' },
  { parts: [52, 53], text: 'Lắp 2 thanh trắng 15 lỗ hai bên khung.' },
  { parts: [54, 55, 56], text: 'Lắp thanh 15 lỗ ngang phía trước và 2 khớp chữ L màu xám.' },
  { parts: [58, 59, 60], text: 'Cắm 3 chốt đen nằm ngang vào thanh phía trước.' },
  { parts: [57], text: 'Lắp khung chữ H màu xanh ngọc phía trước.' },
  { parts: [34, 35], text: 'Cắm 2 chốt đen trên đỉnh động cơ.' },
  { parts: [37, 42], text: 'Lắp thanh trắng 7 lỗ lên động cơ và cắm trục đứng.' },
  { parts: [43, 36, 40], text: 'Lắp bánh răng nhỏ 8 răng (trục 3) ăn khớp với bánh răng lớn 40 răng.' },
  { parts: [41, 44], text: 'Lắp bạc chặn và khớp nối trục màu đen lên trục bánh răng lớn.' },
  { parts: [45, 47], text: 'Nối trục 7 và khớp góc đen – đoạn cột anten thứ nhất.' },
  { parts: [46, 48], text: 'Nối thêm trục 7 và khớp góc đen – cột anten cong dần.' },
  { parts: [49], text: 'Cắm trục 5 trên cùng của cột anten.' },
  { parts: [], text: 'Quan sát thân vệ tinh và cột anten đã hoàn thành.' },
  { parts: [], text: 'Xoay sang góc nhìn khác để kiểm tra cột anten.' }
];
const head = [
  { parts: [0, 1, 3], text: 'Cắm 2 chốt xanh dương vào khối nối màu xanh ngọc.' },
  { parts: [2, 4], text: 'Lắp 2 khối nối 3 lỗ màu xám.' },
  { parts: [6, 7, 5, 8, 9, 10], text: 'Luồn 2 trục 3 và lắp 4 khối nối 2 lỗ.' },
  { parts: [15, 16, 17, 18, 11, 12], text: 'Cắm 4 chốt xanh dương và 2 khối nối 4 chốt.' },
  { parts: [19, 20], text: 'Lắp 2 thanh vàng 3 lỗ.' },
  { parts: [13, 14], text: 'Lắp 2 thanh xanh ngọc 5 lỗ ở giữa.' },
  { parts: [21, 22], text: 'Lắp 2 khung cánh pin mặt trời 5×7 hai bên.' }
];

const steps = [];
base.forEach(s => steps.push({ ...s, scope: 'Main', group: '', sub: 0, subCount: 0, joins: [] }));
head.forEach((s, i) =>
  steps.push({ ...s, scope: HEAD, group: HEAD_NAME, sub: i + 1, subCount: head.length, joins: [] })
);
steps.push({
  parts: [],
  text: 'Ghép đầu vệ tinh lên đỉnh cột anten – hoàn thành vệ tinh!',
  scope: 'Main',
  group: '',
  sub: 0,
  subCount: 0,
  joins: [HEAD_NAME]
});
steps.forEach((s, i) => (s.page = i + 1)); // số bước in trong sách = số bước ở đây

const byPart = new Map();
steps.forEach((step, index) => {
  for (const part of step.parts) {
    if (byPart.has(part)) throw Error('Linh kiện bị lặp: ' + part);
    byPart.set(part, { step: index + 1, groupPath: step.scope });
  }
});
if (byPart.size !== 61 || [...byPart.keys()].some(i => !Number.isInteger(i) || i < 0 || i >= 61))
  throw Error(`Sơ đồ lắp không đủ 61 vị trí: ${byPart.size}`);
if (steps.length !== 28) throw Error('Sách có 28 bước, sơ đồ có ' + steps.length);

module.exports = {
  steps,
  byPart,
  stepInfo: steps.map(({ scope, group, sub, subCount, joins, page }) => ({ scope, group, sub, subCount, joins, page })),
  stepDescriptions: steps.map(({ text }) => text),
  finalStep: steps.length,
  headCount: 23
};
