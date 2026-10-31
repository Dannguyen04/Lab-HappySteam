// Lớp 3 Bài 8 – Giải cứu máy bay: 30 bước theo sách hướng dẫn lắp (references/lop3/bai08/bai8.pdf).
// Chỉ số trong `parts` là thứ tự linh kiện khi trải model2.ldr của file .io (0–43 = SubModel Group 1: cụm trên – động cơ M1,
// cần quay, máy bay; 44–71 = SubModel Group 2: cụm dưới – động cơ M2, trục vít, tay quay; 72–100 = đế + bộ não), KHÔNG phải mã.
// Bảng đọc sách: docs/pdf3d/lop3-bai08/anti-steps.md (Antigravity, 01/11/2026), Claude đối chiếu tọa độ CAD từng linh kiện.
// Sách: 1–10 cụm dưới (9, 10 chỉ thử chuyển động), 11–22 lắp riêng cụm trên (22 chỉ quan sát), 23 ghép cụm trên lên
// 2 thanh 9 lỗ, 24–29 thanh giằng, đế, bộ não, 30 quan sát.
'use strict';

const UPPER = 'Main/Upper';
const UPPER_NAME = 'cụm máy bay';
const COUNT = 101;

const lower = [
  { parts: [45, 47, 48], text: 'Đặt động cơ M2 nằm ngang, cắm 2 chốt đen lên lưng động cơ.' },
  { parts: [44], text: 'Dựng khung 5×7 xanh ngọc lên 2 chốt đen.' },
  { parts: [49, 50, 51, 46, 53, 52], text: 'Luồn trục 8 đen qua khung: bạc xám, bạc nửa vàng, trục vít, bạc nửa vàng, bạc xám, cắm vào động cơ.' },
  { parts: [54, 55, 56, 57], text: 'Cắm 4 chốt trục xanh dương vào 4 góc trong của khung.' },
  { parts: [58, 59, 60, 61], text: 'Lắp 4 khớp chốt xám làm giá đỡ trục ngang.' },
  { parts: [62, 63, 65, 64], text: 'Luồn trục 9 nằm ngang, xâu bánh răng 24 răng ăn khớp với trục vít.' },
  { parts: [66, 67, 68, 69], text: 'Lắp 2 tay quay đen vào 2 đầu trục 9 và cắm 2 chốt xám.' },
  { parts: [70, 71], text: 'Gắn 2 thanh 9 lỗ xanh ngọc đứng lên 2 tay quay.' },
  { parts: [], text: 'Thử xoay trục vít: tay quay đẩy 2 thanh đứng lên xuống.' },
  { parts: [], text: 'Kiểm tra cụm động cơ dưới đã hoàn chỉnh.' }
];
const upper = [
  { parts: [0, 39, 40, 32, 33, 42, 43], text: 'Đặt động cơ M1, cắm 2 chốt đen, 2 chốt dài màu be và 2 chốt xám.' },
  { parts: [38, 41, 34, 35, 36, 37], text: 'Lắp 2 thanh vàng 3 lỗ, 2 khớp nối tròn và 2 chốt xám hai bên cổ động cơ.' },
  { parts: [11, 12], text: 'Cắm 2 chốt đen lên lưng động cơ.' },
  { parts: [13, 16, 14], text: 'Lắp thanh trắng 7 lỗ, trục 4 có gờ chặn và trục 3 vào động cơ.' },
  { parts: [17, 31, 15], text: 'Lắp bánh răng 8 răng, bạc xám và bánh răng 24 răng ăn khớp nhau.' },
  { parts: [30, 29, 28], text: 'Nối trục 10 đen dựng đứng và lắp khớp nối thẳng trên đỉnh.' },
  { parts: [23, 24, 26, 27, 25], text: 'Lắp khối nối 4 chốt, 2 khối nối trục xanh ngọc, trục 4 và trục 3 trên đỉnh cột.' },
  { parts: [21, 22, 19, 20], text: 'Lắp 2 thanh trắng 15 lỗ làm cần quay, khớp góc và chốt dài ở đầu cần.' },
  { parts: [18, 10, 9], text: 'Treo trục 10 đen ở đầu cần, lắp khớp góc và chốt dài ở đầu dưới.' },
  { parts: [2, 1, 3, 4, 5], text: 'Lắp thân máy bay chữ L xanh ngọc và 2 cánh trắng bằng 2 chốt dài xanh dương.' },
  { parts: [6, 7, 8], text: 'Lắp trục 3 và 2 bạc xám ở đuôi máy bay.' },
  { parts: [], text: 'Quan sát cụm máy bay đã hoàn chỉnh.' }
];
const main = [
  { parts: [74, 75, 72, 73], text: 'Lắp 2 thanh dài 13 lỗ xanh ngọc giằng phía sau tháp bằng 2 chốt xám.' },
  { parts: [79, 80, 77, 78], text: 'Gắn 2 chốt có lỗ ngang và 2 khối nối 4 chốt quanh động cơ dưới.' },
  { parts: [81, 82, 84, 85, 86, 87, 88, 89], text: 'Lắp 2 thanh trắng 7 lỗ và 6 chốt đen làm khung đế.' },
  { parts: [83, 92], text: 'Lắp 2 thanh trắng 15 lỗ làm bệ đế.' },
  { parts: [76, 90, 91, 93, 94], text: 'Đặt bộ não M5-RCU giữa 2 thanh 15 lỗ, cố định bằng 4 chốt xám.' },
  { parts: [99, 100, 95, 96, 97, 98], text: 'Lắp 2 thanh chữ L xanh ngọc làm chân chống lật phía sau.' }
];

const steps = [];
lower.forEach(s => steps.push({ ...s, scope: 'Main', group: '', sub: 0, subCount: 0, joins: [] }));
upper.forEach((s, i) => steps.push({ ...s, scope: UPPER, group: UPPER_NAME, sub: i + 1, subCount: upper.length, joins: [] }));
steps.push({ parts: [], text: 'Ghép cụm máy bay lên 2 thanh 9 lỗ của cụm động cơ dưới.', scope: 'Main', group: '', sub: 0, subCount: 0, joins: [UPPER_NAME] });
const joinStep = steps.length;
main.forEach(s => steps.push({ ...s, scope: 'Main', group: '', sub: 0, subCount: 0, joins: [] }));
steps.push({ parts: [], text: 'Hoàn thành giàn bay máy bay cứu hộ!', scope: 'Main', group: '', sub: 0, subCount: 0, joins: [] });
steps.forEach((s, i) => (s.page = i + 1)); // số bước in trong sách = số trang

const upperCount = 44;
const byPart = new Map();
steps.forEach((step, index) => {
  for (const part of step.parts) {
    if (byPart.has(part)) throw Error('Linh kiện bị lặp: ' + part);
    byPart.set(part, { step: index + 1, groupPath: step.scope });
  }
});
if (byPart.size !== COUNT || [...byPart.keys()].some(i => !Number.isInteger(i) || i < 0 || i >= COUNT))
  throw Error(`Sơ đồ lắp không đủ ${COUNT} vị trí: ${byPart.size}`);
for (const [i, a] of byPart) if ((i < upperCount) !== (a.groupPath === UPPER)) throw Error('Linh kiện ' + i + ' sai cụm');
if (steps.length !== 30) throw Error('Sách có 30 bước, sơ đồ có ' + steps.length);
if (joinStep !== 23) throw Error('Sách ghép cụm ở bước 23');

module.exports = {
  steps,
  byPart,
  joinsOf: idx => (idx < upperCount ? [joinStep] : []),
  stepInfo: steps.map(({ scope, group, sub, subCount, joins, page }) => ({ scope, group, sub, subCount, joins, page })),
  stepDescriptions: steps.map(({ text }) => text),
  finalStep: steps.length,
  joinStep,
  upperCount,
  count: COUNT
};
