// Bổ sung hình chi tiết CAD từ file .io của một bài (chưa dựng thành bài học) vào thư viện kit + mục lục parts.json.
// Dùng khi một bài dựng từ PDF (.rbb) cần chi tiết chưa có trong bài CAD nào. Không tạo build.json.
// Chạy: node scripts/add-kit-parts.js bai01
//   Cần references/drive_bai01/model2.ldr (giải nén từ bai1.io, chỉ có ở máy) và scripts/bai01-parts.js.
'use strict';
const path = require('node:path');
const cad = require('./lib/cad-lesson');
const { writeKitParts } = require('./lib/kit-library');

const SOURCES = {
  bai01: { kit: 'alpha330', ldr: 'references/drive_bai01/model2.ldr', root: 'bài 1 - làm quen bộ công cụ', count: 22, table: './bai01-parts', flat: true }
};

const name = process.argv[2];
const src = SOURCES[name];
if (!src) {
  console.error('Cách dùng: node scripts/add-kit-parts.js <' + Object.keys(SOURCES).join('|') + '>');
  process.exit(2);
}
const table = require(src.table);
const sections = cad.readSections(path.join(__dirname, '..', src.ldr));
const rootParts = cad.flattenRoot(sections, src.root, src.count, src.flat);
const { instances, meshes } = cad.buildInstances(sections, rootParts, {
  plan: { byPart: new Map(rootParts.map((_, i) => [i, { step: 1, groupPath: 'Main' }])), joinsOf: () => [] },
  table,
  tableName: src.table
});
const r = writeKitParts(src.kit, instances, meshes, `${name} (.io)`);
console.log(`${name}: ${meshes.length} hình (${r.added} hình mới), ${r.indexed} mã+màu mới trong mục lục kit ${src.kit}`);
