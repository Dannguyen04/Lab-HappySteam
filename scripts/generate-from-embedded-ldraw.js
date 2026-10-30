// Tạo dữ liệu 3D Bài 9 từ hình học CAD nhúng trong model2.ldr (file .io của BrickLink Studio).
// Hình 3D giữ nguyên CAD gốc; mã/tên/màu theo bảng scripts/bai9-parts.js; bước theo sách (scripts/assembly-plan.js).
// Màu trong model.ldr là mã màu BrickLink, nên linh kiện thường được tô một màu theo bảng mã ZMROBO.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const plan = require('./assembly-plan');
const table = require('./bai9-parts');

const ROOT = path.join(__dirname, '..');
const source = path.join(ROOT, 'references', 'original_models', 'model2.ldr');
const target = path.join(ROOT, 'js', 'data-bai-09.js');

const sections = new Map();
let active;
for (const rawLine of fs.readFileSync(source, 'utf8').split(/\r?\n/)) {
  const line = rawLine.replace(/^\uFEFF/, '');
  if (line.startsWith('0 FILE ')) {
    active = line.slice(7).trim().toLowerCase();
    if (sections.has(active)) throw Error('Trùng CAD section: ' + active);
    sections.set(active, []);
  } else if (active && line.startsWith('0 Name:')) {
    // Các primitive 48/ được lưu bằng tên file rút gọn nhưng khai báo đường dẫn chuẩn ở Name.
    const declaredName = line.slice('0 Name:'.length).trim().replace(/\\/g, '/').toLowerCase();
    if (declaredName && declaredName !== active) {
      if (sections.has(declaredName)) throw Error('Trùng tên CAD: ' + declaredName);
      sections.set(declaredName, sections.get(active));
    }
  } else if (active && (line.startsWith('1 ') || line.startsWith('3 ') || line.startsWith('4 '))) {
    sections.get(active).push(line);
  }
}
const rootName = 'bài 9 -thông tin liên lạc vũ trụ';
if (!sections.has(rootName)) throw Error('Thiếu mô hình chính');
const REFLECT = [1, 0, 0, 0, -1, 0, 0, 0, 1];
const IDENT = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const mat = (A, B) => {
  const C = new Array(9).fill(0);
  for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++)
    for (let k = 0; k < 3; k++) C[c * 3 + r] += A[k * 3 + r] * B[c * 3 + k];
  return C;
};
const vec = (M, v) => [
  M[0] * v[0] + M[3] * v[1] + M[6] * v[2],
  M[1] * v[0] + M[4] * v[1] + M[7] * v[2],
  M[2] * v[0] + M[5] * v[1] + M[8] * v[2],
];
const add = (a, b) => a.map((v, i) => v + b[i]);
const readRef = line => {
  const t = line.trim().split(/\s+/);
  return {
    color: t[1], pos: t.slice(2, 5).map(Number),
    rot: [Number(t[5]), Number(t[8]), Number(t[11]), Number(t[6]), Number(t[9]), Number(t[12]), Number(t[7]), Number(t[10]), Number(t[13])],
    file: t.slice(14).join(' ').toLowerCase(),
  };
};
const rootParts = [];
for (const line of sections.get(rootName)) {
  if (!line.startsWith('1 ')) continue;
  const group = readRef(line);
  if (!sections.has(group.file)) throw Error('Thiếu nhóm CAD: ' + group.file);
  for (const child of sections.get(group.file)) {
    if (!child.startsWith('1 ')) continue;
    const p = readRef(child);
    rootParts.push({
      file: p.file, color: p.color,
      pos: add(group.pos, vec(group.rot, p.pos)),
      rot: mat(group.rot, p.rot),
    });
  }
}
if (rootParts.length !== 61) throw Error(`Lỗi CAD: có ${rootParts.length} thay vì 61 vị trí`);

// Cột anten (bước 16–17): file CAD dùng trục 9 (60485, 180 LDU) nhưng sách và kit thật dùng trục 7 (140 LDU,
// người dùng xác nhận 30/10/2026). Thay bằng trục 7: đầu dưới giữ nguyên trong lỗ, phần phía trên cột hạ theo trục.
// Chuỗi: khớp nối 44 → trục 47 → khớp góc 45 → trục 48 → khớp góc 46 → trục 49 → cụm đầu (0–22).
const AXLE_SHORTEN = 40; // LDU
for (const [axle, below, above] of [
  [47, 44, [45, 46, 48, 49]],
  [48, 45, [46, 49]],
]) {
  const p = rootParts[axle];
  if (p.file !== '60485.dat') throw Error('Linh kiện ' + axle + ' không phải trục 9');
  let u = [p.rot[0], p.rot[1], p.rot[2]]; // cột 0 (rot lưu theo cột) = trục X cục bộ = chiều dài trục
  const toBelow = rootParts[below].pos.map((v, k) => v - p.pos[k]);
  if (toBelow[0] * u[0] + toBelow[1] * u[1] + toBelow[2] * u[2] > 0) u = u.map(v => -v); // u hướng lên đầu trên
  p.pos = p.pos.map((v, k) => v - u[k] * AXLE_SHORTEN / 2);
  p.axle7 = true;
  const moved = [...above, ...Array.from({ length: plan.headCount }, (_, i) => i)];
  for (const i of moved) rootParts[i].pos = rootParts[i].pos.map((v, k) => v - u[k] * AXLE_SHORTEN);
}

// Lấy cùng gốc quy chiếu của model.ldr: tâm X/Z và mặt đáy Y của các origin.
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
rootParts.forEach(p => p.pos.forEach((v, i) => { min[i] = Math.min(min[i], v); max[i] = Math.max(max[i], v); }));
const centerX = (min[0] + max[0]) / 2, centerZ = (min[2] + max[2]) / 2, bottomY = max[1];

// Bảng mã từ bản cũ chỉ phục vụ nhãn hiển thị, tuyệt đối không dùng mesh thư viện thay thế.
// Mã màu BrickLink (Studio ghi trong .io): dùng cho linh kiện điện tử nhiều màu (động cơ, bộ điều khiển)
const ldrawPalette = {
  '1': [0.9, 0.91, 0.9], // White
  '5': [0.7, 0.09, 0.08], // Red
  '11': [0.07, 0.075, 0.09], // Black
  '33': [0.75, 0.8, 0.85], // Trans-Clear
  '85': [0.33, 0.36, 0.39], // Dark Bluish Gray
  '86': [0.63, 0.65, 0.67], // Light Bluish Gray
  '156': [0.22, 0.76, 0.85], // Medium Azure
};
const inheritedColor = (num, parent) => (num === '-1' || num === '16' || num === '-2' || num === '24') ? parent : num;
const names = { types: {}, colors: table.colors, names: {}, defaults: {} };
for (const t of Object.values(table.parts)) {
  names.names[t.code] = t.name;
  names.types[t.code] = t.type;
}
const meshes = [], meshCache = new Map();
const stats = { missing: new Set(), triangles: 0, degenerate: 0, references: 0 };

function geometry(file, rootColor) {
  const buckets = new Map();
  function visit(name, pos, rot, inherited, stack) {
    const lines = sections.get(name);
    if (!lines) { stats.missing.add(name); return; }
    if (stack.has(name)) throw Error('CAD tham chiếu vòng: ' + [...stack, name].join(' -> '));
    const next = new Set([...stack, name]);
    for (const line of lines) {
      const t = line.trim().split(/\s+/);
      if (t[0] === '1') {
        const part = readRef(line);
        stats.references++;
        visit(part.file, add(pos, vec(rot, part.pos)), mat(rot, part.rot), inheritedColor(part.color, inherited), next);
        continue;
      }
      if (t[0] !== '3' && t[0] !== '4') continue;
      const color = inheritedColor(t[1], inherited);
      const vertices = [];
      for (let offset = 2; offset + 2 < t.length; offset += 3) {
        const v = add(pos, vec(rot, t.slice(offset, offset + 3).map(Number)));
        vertices.push([v[0] * .0005, -v[1] * .0005, v[2] * .0005]);
      }
      // Đối xứng Y đổi dấu orientation, do đó đảo thứ tự đỉnh để pháp tuyến hướng ra ngoài.
      const triangles = t[0] === '3' ? [[0, 2, 1]] : [[0, 2, 1], [0, 3, 2]];
      if (!buckets.has(color)) buckets.set(color, []);
      const bucket = buckets.get(color);
      for (const ids of triangles) {
        const a = vertices[ids[0]], b = vertices[ids[1]], c = vertices[ids[2]];
        const u = b.map((v, i) => v - a[i]), v = c.map((n, i) => n - a[i]);
        const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
        const length = Math.hypot(...n);
        if (length < 1e-12) { stats.degenerate++; continue; }
        for (const point of [a, b, c]) bucket.push({ point, normal: n.map(x => x / length) });
        stats.triangles++;
      }
    }
  }
  visit(file, [0, 0, 0], IDENT, rootColor, new Set());
  if (!buckets.size) throw Error('Chi tiết CAD không có mặt tam giác: ' + file);
  return buckets;
}

// Dạng lưu tương thích unpackMesh() của viewer: position Uint16, normal Int8, indices Uint16/32, gzip.
function encodeMesh(vertices, color, file, rgb) {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const { point } of vertices) for (let k = 0; k < 3; k++) {
    lo[k] = Math.min(lo[k], point[k]); hi[k] = Math.max(hi[k], point[k]);
  }
  const positions = [], normals = [], indices = [], seen = new Map();
  for (const { point, normal } of vertices) {
    const p = point.map((x, k) => hi[k] === lo[k] ? 0 : Math.max(0, Math.min(65535, Math.round((x - lo[k]) / (hi[k] - lo[k]) * 65535))));
    const n = normal.map(x => Math.max(-127, Math.min(127, Math.round(x * 127))));
    const key = p.join(',') + '/' + n.join(',');
    let id = seen.get(key);
    if (id === undefined) { id = positions.length / 3; seen.set(key, id); positions.push(...p); normals.push(...n); }
    indices.push(id);
  }
  const v = positions.length / 3, count = indices.length;
  const align = n => (n + 3) & ~3;
  const header = align(v * 9), length = header + (v > 65535 ? count * 4 : count * 2);
  const data = Buffer.alloc(length);
  positions.forEach((n, i) => data.writeUInt16LE(n, i * 2));
  normals.forEach((n, i) => data.writeInt8(n, v * 6 + i));
  indices.forEach((n, i) => v > 65535 ? data.writeUInt32LE(n, header + i * 4) : data.writeUInt16LE(n, header + i * 2));
  return {
    name: file + '/' + color, count, color: rgb || ldrawPalette[color] || ldrawPalette['86'],
    texture: -1, lo, hi, material: color, v,
    z: zlib.gzipSync(data, { level: 7 }).toString('base64'),
  };
}

const instances = rootParts.map((p, idx) => {
  const key = p.file + '|' + p.color + (p.axle7 ? '|7' : '');
  if (!meshCache.has(key)) {
    const ids = [],
      info = table.parts[p.file];
    if (!info) throw Error('Chưa có mã ZMROBO cho ' + p.file + ' trong scripts/bai9-parts.js');
    const buckets = geometry(p.file, p.color);
    // Trục 7 từ hình trục 9: co theo chiều dài (trục X cục bộ), tiết diện giữ nguyên
    if (p.axle7) for (const list of buckets.values()) for (const v of list) v.point = [v.point[0] * 140 / 180, v.point[1], v.point[2]];
    if (info.color) {
      // Linh kiện một màu: gộp mọi mặt, tô theo màu ZMROBO
      const all = [].concat(...buckets.values());
      ids.push(meshes.length);
      meshes.push(encodeMesh(all, info.color, p.file, table.rgb[info.color].map(v => +(v / 255).toFixed(3))));
    } else
      for (const [color, vertices] of buckets) {
        ids.push(meshes.length);
        meshes.push(encodeMesh(vertices, color, p.file));
      }
    meshCache.set(key, ids);
  }
  const assignment = plan.byPart.get(idx);
  const info = table.parts[p.file];
  return {
    name: info.code,
    colorCode: info.color,
    originalPart: p.file,
    step: assignment.step,
    rotation: mat(REFLECT, mat(p.rot, REFLECT)).map(v => +v.toFixed(6)),
    pos: [(p.pos[0] - centerX) * .0005, (bottomY - p.pos[1]) * .0005, (p.pos[2] - centerZ) * .0005].map(v => +v.toFixed(6)),
    groupPath: assignment.groupPath,
    joins: idx < plan.headCount ? [plan.finalStep] : [],
    meshes: meshCache.get(key),
  };
});
if (stats.missing.size) throw Error('CAD còn thiếu primitive: ' + [...stats.missing].join(', '));
if (instances.some(p => p.meshes.length === 0)) throw Error('Chi tiết không có mesh');
// Mô-đun cảm biến minh họa cho xưởng sáng tạo (không có trong file CAD): khối trắng 30 mm, mắt đọc tròn
// màu tối ở mặt trước (+Z). Đơn vị mét, đáy ở y = 0. Không phải hình của một mã cảm biến cụ thể.
function boxTris(lo, hi) {
  const out = [];
  const quad = (a, b, c, d, n) => {
    for (const p of [a, b, c, a, c, d]) out.push({ point: p, normal: n });
  };
  const [x0, y0, z0] = lo, [x1, y1, z1] = hi;
  quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1]);
  quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1]);
  quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0]);
  quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0]);
  quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0]);
  quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0]);
  return out;
}
function discTris(c, r, depth, n = 24) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2;
    const p = t => [c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)];
    const [ax, ay] = p(a), [bx, by] = p(b), zf = c[2] + depth;
    for (const q of [[c[0], c[1], zf], [ax, ay, zf], [bx, by, zf]]) out.push({ point: q, normal: [0, 0, 1] });
    const side = [Math.cos((a + b) / 2), Math.sin((a + b) / 2), 0];
    for (const q of [[ax, ay, c[2]], [bx, by, c[2]], [bx, by, zf], [ax, ay, c[2]], [bx, by, zf], [ax, ay, zf]])
      out.push({ point: q, normal: side });
  }
  return out;
}
const creativeMeshes = { sensor: [] };
creativeMeshes.sensor.push(meshes.length);
meshes.push(encodeMesh(boxTris([-0.015, 0, -0.015], [0.015, 0.028, 0.015]), 'sensor-body', 'proc', [0.9, 0.91, 0.9]));
creativeMeshes.sensor.push(meshes.length);
meshes.push(encodeMesh(discTris([0, 0.016, 0.015], 0.006, 0.0015), 'sensor-lens', 'proc', [0.08, 0.09, 0.12]));

// Bộ truyền động cho sa bàn (Tab 2): bánh răng 8 răng (động cơ) dẫn bánh răng 40 răng; mọi thứ gắn trên trục
// bánh răng 40 (trục, bạc, khớp nối, cột anten, cụm đầu) quay cùng nhau quanh trục đứng qua tâm bánh răng.
const DRIVE = {
  output: { gear: 40, parts: [37, 40, 41, 44, 45, 46, 47, 48, 49, ...Array.from({ length: plan.headCount }, (_, i) => i)] },
  motor: { gear: 43, parts: [36, 43] }
};
for (const [key, d] of Object.entries(DRIVE)) {
  const expect = key === 'output' ? 'BP-7045' : 'BP-7054';
  if (instances[d.gear].name !== expect) throw Error('Bộ truyền: linh kiện ' + d.gear + ' không phải ' + expect);
  d.point = instances[d.gear].pos;
  d.axis = [0, 1, 0];
}
for (const i of DRIVE.output.parts)
  if (Math.abs(instances[i].pos[0] - DRIVE.output.point[0]) > 0.2) throw Error('Bộ truyền: linh kiện lạ ' + i);

const data = {
  source: 'Bài 9 -Thông tin liên lạc vũ trụ.io (hình CAD gốc, 61 linh kiện); 28 bước theo sách hướng dẫn chính thức',
  meshes, textures: [], instances,
  steps: plan.finalStep, stepDescriptions: plan.stepDescriptions, stepInfo: plan.stepInfo,
  warnings: [],
  labels: names,
  creative: creativeMeshes,
  drive: DRIVE,
};
fs.writeFileSync(target, 'window.LESSON_3D_DATA = ' + JSON.stringify(data) + ';\n');
console.log('CAD gốc:', sections.size, 'section,', rootParts.length, 'chi tiết,', meshes.length, 'mesh,', stats.triangles, 'tam giác;', (fs.statSync(target).size / 1024 / 1024).toFixed(2), 'MiB');
