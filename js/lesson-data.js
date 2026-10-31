// Nạp dữ liệu 3D một bài từ content/: build.json của bài + các hình chi tiết trong thư viện kit dùng chung.
// Ghép lại đúng y đối tượng window.LESSON_3D_DATA cũ (xem scripts/lib/kit-library.js) để assembly-viewer/creative-lab không đổi.
// Dùng: await window.loadLesson3D('lop1/bai09')  → trả và gán window.LESSON_3D_DATA. Cần chạy qua http (fetch).
(function () {
  'use strict';

  async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Không tải được ${url} (${res.status})`);
    return res.json();
  }

  window.loadLesson3D = async function (lesson) {
    const build = await getJSON(`content/${lesson}/build.json`);
    const unique = [...new Set(build.meshes)];
    const loaded = new Map(await Promise.all(unique.map(async ref => [ref, await getJSON(ref)])));
    // Giữ nguyên thứ tự khoá như bản cũ; "kit" chỉ là thông tin của build.json
    const data = {};
    for (const [key, value] of Object.entries(build)) {
      if (key === 'kit') continue;
      data[key] = key === 'meshes' ? value.map(ref => loaded.get(ref)) : value;
    }
    window.LESSON_3D_DATA = data;
    return data;
  };
})();
