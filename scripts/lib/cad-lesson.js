// Phần dùng chung để dựng dữ liệu 3D một bài học (js/data-bai-XX.js) từ hình học CAD nhúng trong model2.ldr
// (file .io của BrickLink Studio). Mỗi bài có script riêng (scripts/generate-*.js) gọi các hàm ở đây và tự lo:
// đường dẫn, số linh kiện, sơ đồ bước theo sách, bảng mã ZMROBO, chỉnh sửa theo kit thật, dữ liệu sa bàn.
//
// Quy ước: ma trận rot lưu theo CỘT (rot[0..2] = trục X cục bộ); 1 LDU = 0,5 mm; LDraw (Y xuống) → viewer (Y lên)
// bằng phép lật Y. Màu trong .io là mã màu BrickLink.
'use strict';
const fs = require('node:fs');
const zlib = require('node:zlib');

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

// Tách file MPD thành các mục: Map<tên viết thường, dòng 1/3/4>
function readSections(source) {
  const sections = new Map();
  let active;
  for (const rawLine of fs.readFileSync(source, 'utf8').split(/\r?\n/)) {
    const line = rawLine.replace(/^﻿/, '');
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
  return sections;
}

// Trải mô hình chính → danh sách linh kiện theo thứ tự file: mỗi dòng của mô hình chính là một mô hình con
// (SubModel Group …), linh kiện trong mô hình con được đặt vào toạ độ mô hình chính.
// flat = true: file không chia mô hình con, mỗi dòng của mô hình chính là một linh kiện.
function flattenRoot(sections, rootName, expected, flat = false) {
  if (!sections.has(rootName)) throw Error('Thiếu mô hình chính: ' + rootName);
  const parts = [];
  for (const line of sections.get(rootName)) {
    if (!line.startsWith('1 ')) continue;
    const group = readRef(line);
    if (flat) {
      parts.push({ file: group.file, color: group.color, pos: group.pos, rot: group.rot });
      continue;
    }
    if (!sections.has(group.file)) throw Error('Thiếu nhóm CAD: ' + group.file);
    for (const child of sections.get(group.file)) {
      if (!child.startsWith('1 ')) continue;
      const p = readRef(child);
      parts.push({ file: p.file, color: p.color, pos: add(group.pos, vec(group.rot, p.pos)), rot: mat(group.rot, p.rot) });
    }
  }
  if (parts.length !== expected) throw Error(`Lỗi CAD: có ${parts.length} thay vì ${expected} vị trí`);
  return parts;
}

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

function geometry(sections, stats, file, rootColor) {
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

// Dựng instances + meshes. rootParts: kết quả flattenRoot (đã chỉnh theo kit nếu cần).
// opts.plan: { byPart: Map<chỉ số, {step, groupPath}>, joinsOf(i) → [bước ghép] }
// opts.table: { parts: { 'file.dat': { code, color, name, type } }, rgb }
// opts.shape(p, buckets): chỉnh hình một linh kiện trước khi mã hoá (vd. co trục 9 thành trục 7); opts.meshKey(p) → hậu tố khoá
function buildInstances(sections, rootParts, opts) {
  const { plan, table, tableName } = opts;
  // Lấy cùng gốc quy chiếu của model.ldr: tâm X/Z và mặt đáy Y của các origin.
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  rootParts.forEach(p => p.pos.forEach((v, i) => { min[i] = Math.min(min[i], v); max[i] = Math.max(max[i], v); }));
  const centerX = (min[0] + max[0]) / 2, centerZ = (min[2] + max[2]) / 2, bottomY = max[1];

  const meshes = [], meshCache = new Map();
  const stats = { missing: new Set(), triangles: 0, degenerate: 0, references: 0 };
  const instances = rootParts.map((p, idx) => {
    const key = p.file + '|' + p.color + (opts.meshKey ? opts.meshKey(p) : '');
    const info = table.parts[p.file];
    if (!info) throw Error('Chưa có mã ZMROBO cho ' + p.file + ' trong ' + tableName);
    if (!meshCache.has(key)) {
      const ids = [];
      const buckets = geometry(sections, stats, p.file, p.color);
      if (opts.shape) opts.shape(p, buckets);
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
    return {
      name: info.code,
      colorCode: info.color,
      originalPart: p.file,
      step: assignment.step,
      rotation: mat(REFLECT, mat(p.rot, REFLECT)).map(v => +v.toFixed(6)),
      pos: [(p.pos[0] - centerX) * .0005, (bottomY - p.pos[1]) * .0005, (p.pos[2] - centerZ) * .0005].map(v => +v.toFixed(6)),
      groupPath: assignment.groupPath,
      joins: plan.joinsOf(idx),
      meshes: meshCache.get(key),
    };
  });
  if (stats.missing.size) throw Error('CAD còn thiếu primitive: ' + [...stats.missing].join(', '));
  if (instances.some(p => p.meshes.length === 0)) throw Error('Chi tiết không có mesh');
  return { instances, meshes, stats };
}

function labelsOf(table) {
  const names = { types: {}, colors: table.colors, names: {}, defaults: {} };
  for (const t of Object.values(table.parts)) {
    names.names[t.code] = t.name;
    names.types[t.code] = t.type;
  }
  return names;
}

// Hình học tự dựng (đơn vị mét) cho chi tiết minh họa ở xưởng sáng tạo: hộp và đĩa
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

function writeData(target, data, summary) {
  fs.writeFileSync(target, 'window.LESSON_3D_DATA = ' + JSON.stringify(data) + ';\n');
  console.log(summary, (fs.statSync(target).size / 1024 / 1024).toFixed(2), 'MiB');
}

module.exports = {
  readSections, flattenRoot, buildInstances, labelsOf, encodeMesh, boxTris, discTris, writeData,
  mat, vec, add, IDENT, REFLECT,
};
