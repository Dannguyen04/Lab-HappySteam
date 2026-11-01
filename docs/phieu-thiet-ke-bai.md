# Phiếu thiết kế một bài mô hình

Điền phiếu này **trước** khi làm bài mới. Mỗi câu trả lời được chép thẳng vào `content/lop{G}/bai{NN}/lesson.json`, rồi chạy:

```
node scripts/new-lesson.js lop1-bai05     # lần đầu: tạo lesson.json mẫu; điền xong chạy lại để sinh bài
node scripts/new-lesson.js lop1-bai05 --check
```

Mẫu đã điền đầy đủ: [content/lop1/bai10/lesson.json](../content/lop1/bai10/lesson.json).

## 1. Thông tin bài (lấy từ sách / KHGD)

| Câu hỏi | Trường trong lesson.json | Ví dụ (Bài 10) |
|---|---|---|
| Tên mô hình | `title` | Cối xoay gió |
| Tên chủ đề trong sách | `topic` | Bạn gió tinh nghịch, gió ở đâu? |
| Tên mô hình viết thường (dùng trong câu) | `model` | cối xoay gió |
| Sách lắp có bao nhiêu bước? | `steps` | 15 |
| Một câu giới thiệu bài: lắp gì, lập trình gì, để làm gì | `lede` | Lắp cối xoay gió theo 15 bước… |
| Câu chúc mừng khi xong | `victory` | Em đã lắp xong cối xoay gió… |

## 2. Lập trình

| Câu hỏi | Trường |
|---|---|
| Chương trình mẫu trong sách, từng khối theo thứ tự | `blocks.sample` |
| Những khối học sinh được dùng | `blocks.toolbox` |
| Khối chỉ mở ở chế độ Nâng cao | `blocks.pro` |
| Bài có nút bấm / cảm biến chạm không? | `scene.press` |

Tên khối có sẵn: `start`, `repeatStart`, `repeatEnd`, `lowSpeed`, `mediumSpeed`, `highSpeed`, `motorPower`, `motorReverse`, `motorStop`, `wait`, `melodyA`, `melodyB`, `display`, `touch`, `obstacle`, `m1Motor`, `m2Motor`. Khối có số thì viết `["wait", { "duration": 2 }]`.

## 3. Cảnh câu chuyện và nhiệm vụ

- **Cảnh:** robot đang ở đâu, làm việc gì? Có gì thắng, có gì thua (va chạm, rơi, gãy…)? → `scene.aria`, `scene.idle`
- **NV1 Lắp ráp** và **NV4 Sáng tạo** có sẵn, không cần điền.
- **NV2** chạy đúng chương trình mẫu → `missions.m2` (chip, tip, title, text)
- **NV3** thử thách chính của câu chuyện: học sinh phải làm được gì? Đo bằng gì? → `missions.m3`
- **NV5 (Nâng cao)** điều gì thay đổi để học sinh phải tính toán / sửa chương trình? → `missions.m5` với `"pro": true`
- **Ô số đo** (chế độ Nâng cao): tối đa 4 ô, mỗi ô gồm tên, đơn vị, dòng ghi chú → `meters`
- **Tính toán:** một dòng quan hệ cần hiểu (vd. "Quay nhanh hơn → nhiều điện hơn") → `calc`
- **Gợi ý** dưới chương trình → `hint`

## 4. Xưởng sáng tạo

- Lời dẫn → `creative.intro`
- Có mấy vị trí gắn thêm chi tiết? → `creative.slots`
- Mỗi gói: tên, chi tiết cần lấy trong kit, tác dụng lên mô phỏng (nhanh hơn, khỏe hơn…). Phần này viết trong `js/<bài>/lesson.js` (FEATURES, SLOTS, PRESETS) và `placements()`.

## 5. Phần vẫn phải làm tay sau khi sinh bài

1. Mô hình 3D `content/.../build.json` (kit3d: từ .io, .rbb hoặc PDF).
2. Vật lý và cách chấm NV3/NV5 trong `js/<bài>/<tên>-engine.js` (các mục TODO).
3. Hình vẽ cảnh `js/<bài>/art.js` (giao cho Antigravity) và phần vẽ trong `<tên>-scene.js`.
4. Gói sáng tạo trong `lesson.js`.
5. Ảnh sách `assets/<bài>/step-NN.jpg`.
