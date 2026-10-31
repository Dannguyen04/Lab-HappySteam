// Dùng cùng trình nạp 3D của trình duyệt, thay fetch bằng đọc tệp từ ổ đĩa.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

module.exports = async function loadLesson3D(context, lesson) {
  const root = path.resolve(__dirname, '../..');
  context.fetch = async url => {
    const file = path.resolve(root, url);
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return { ok: false, status: 404 };
    return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(file, 'utf8')) };
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/lesson-data.js'), 'utf8'), context);
  return context.window.loadLesson3D(lesson);
};
