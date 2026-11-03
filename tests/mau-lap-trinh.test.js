// Mọi bài có content/<bài>/mau-lap-trinh.json: các ca đúng/sai phải ra đúng kết quả mong đợi trên bộ mô phỏng thật.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const reg = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'js/lessons.js'), 'utf8'), reg);
const ids = Object.entries(reg.window.ZM_LESSONS).filter(([, e]) => fs.existsSync(path.join(ROOT, 'content', e.content, 'mau-lap-trinh.json'))).map(([id]) => id);
for (const id of ids) {
  const out = execFileSync(process.execPath, [path.join(ROOT, 'scripts/thu-chuong-trinh.js'), id], { encoding: 'utf8' });
  console.log(`PASS: ${id} – ${out.trim().split('\n').pop()}`);
}
if (!ids.length) console.log('PASS: chưa bài nào có mau-lap-trinh.json');
