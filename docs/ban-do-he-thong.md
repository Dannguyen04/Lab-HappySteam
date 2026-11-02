# Bản đồ hệ thống Happy STEAM Lab (đọc 10 phút)

Cập nhật: 2026-11-02. Chi tiết công nghệ xem `docs/kien-truc.md`; nghiệp vụ xem `docs/ba/BRD.md`.

## 1. Hệ thống có 4 phần

```
                ┌──────────────────── TRANG WEB (Vercel) ────────────────────┐
 Học sinh ──►   │ index.html  Trang chọn bài (Lớp 1–5)       js/home.js, catalog.js │
                │ vao-hoc.html Vào buổi học: mã + chọn tên   js/student-join.js     │
                │ bai.html?id=lop1-bai03   MỘT trang cho mọi bài mô hình  (phần ②)  │
                │ lop1-du-an.html / lop1-trung-bay.html  Bài dự án, trưng bày       │
 Giáo viên ──►  │ giao-vien.html  Lớp, danh sách, lịch, mở buổi  js/teacher-*.js    │
                └───────────────┬──────────────────────────────────┬───────────────┘
                                │ đọc nội dung                      │ đăng nhập, lưu
                ┌───────────────▼──────────┐          ┌─────────────▼──────────────┐
                │ ③ NỘI DUNG content/       │          │ ④ SUPABASE (cơ sở dữ liệu) │
                │ lop1/bai03/page.html      │          │ supabase/migrations/*.sql  │
                │   build.json (3D từng bước)│          │ lớp, học sinh, buổi học,   │
                │ kits/alpha330 (hình chi    │          │ bài làm, đánh giá          │
                │   tiết dùng chung)         │          └────────────────────────────┘
                │ assets/<bài>/step-NN.jpg   │
                └───────────────────────────┘
```

## 2. Một bài học chạy thế nào (phần ②, ví dụ `bai.html?id=lop1-bai03`)

1. `js/lesson-boot.js` đọc `id`, tra **sổ đăng ký `js/lessons.js`** để biết bài cần những file nào, rồi nạp lần lượt.
2. File **riêng của bài**, thư mục `js/bai03/`:

   | File | Vai trò | Cỡ |
   |---|---|---|
   | `lesson.js` | Cấu hình: tên, nhiệm vụ NV1–NV5, khối lệnh trong khay, chương trình mẫu, gói sáng tạo | ~150 dòng |
   | `*-engine.js` | Vật lý và luật chấm của bài (xe chạy bao xa, khi nào đạt NV3…) | ~300 dòng |
   | `*-scene.js` | Vẽ sa bàn 2D, nhận sự kiện từ engine | ~250 dòng |
   | `art.js` | Tranh vẽ chi tiết (xe, nền, nhân vật) | **~1.300 dòng** |

3. File **dùng chung** cho mọi bài:

   | File | Vai trò |
   |---|---|
   | `assembly-viewer.js` | Chặng 1: lắp 3D theo bước, kèm ảnh sách |
   | `creative-lab.js` | Gói nâng cấp sáng tạo |
   | `blocks-engine.js` | Chặng 2: dải khối lệnh ngang (thêm, đổi tham số, dịch, mẫu mờ) |
   | `lesson-engine.js` | Lớp gốc chạy khối lệnh theo thời gian (Lặp, Chờ, động cơ, nút bấm) |
   | `scene-kit.js` | Khung vẽ sa bàn |
   | `sandbox-3d.js` | Sa bàn 3D |
   | `mission-tracker.js` | Đánh dấu nhiệm vụ đã đạt |
   | `app.js` | Nối tất cả lại với nhau |

4. Luồng dữ liệu khi học sinh bấm Chạy: `blocks-engine` (chuỗi khối) → `*-engine` (tính vật lý mỗi khung hình) → `*-scene` + `art` (vẽ) và `mission-tracker` (tick NV).

## 3. Thêm một bài mới

`content/<lớp>/<bài>/lesson.json` → `node scripts/new-lesson.js` (sinh khung) → viết engine/scene/art → đăng ký ở `js/lessons.js` và `js/catalog.js` → `node scripts/check-lessons.js` → `npm test`. Quy trình đầy đủ: `docs/phieu-thiet-ke-bai.md`.

## 4. Kiểm tra

| Lệnh | Kiểm gì | Thời gian |
|---|---|---|
| `npm test` | 22 test logic: mỗi bài một file + test thử ngẫu nhiên mọi engine + test trình ghép khối | ~1 phút |
| `npm run test:smoke` | 21 test mở trang thật bằng Playwright | ~6 phút |
| `node scripts/check-lessons.js` | Mỗi bài đủ file, đủ ảnh, số bước khớp | vài giây |

## 5. Hệ thống to ở đâu (~45.000 dòng JS)

```
art.js của 14 bài     ██████████████████████████████████  18.700  (42%)  tranh vẽ
engine riêng bài      █████████                            5.200
lõi dùng chung        ████████                             4.300
scene riêng bài       ███████                              3.700
lesson.js             █████                                2.600
trang chủ, GV, HS, dự án ███                               1.750
(test 5.900, script 2.350, chưa tính ở trên)
```
**Kết luận:** gần một nửa là tranh vẽ từng bài. Phần logic thật sự (lõi chung + engine) chỉ khoảng 9.500 dòng. Muốn nắm hệ thống thì đọc mục 2 là đủ; `art.js` không cần đọc.

---

## 6. Đề xuất dọn gọn (chờ duyệt, chưa làm)

| # | Việc | Lợi | Rủi ro | Đề xuất |
|---|---|---|---|---|
| D1 | Xóa thư mục máy `scratch/` (file tạm của các lượt giao việc, không lên git) | Thư mục gọn khi mở | Không | **Làm** |
| D2 | Chuyển 13 script dùng một lần sang `scripts/cu/`: `generate-bai02/03/10`, `generate-lop3-bai08`, `bai01/03/10-parts`, `bai03/10-plan`, `lop3-bai08-parts/plan`, `generate-from-embedded-ldraw`, `add-kit-parts`. Bài mới đã dùng `new-lesson.js` + `rbb2content.js` | Còn 8 script đang dùng | Test kit-library hoặc rbb2content có thể còn gọi tới; sửa đường dẫn | **Làm** |
| D3 | Xóa `tests/legacy-browser-test.js` (test cũ, không nằm trong bộ chạy) và chuyển `tests/measure-network.js` sang `scripts/` | Thư mục test chỉ còn test thật | Không | **Làm** |
| D4 | Bỏ 3 trang chuyển hướng `lop1-bai03/09/10.html` (đã thay bằng `bai.html?id=`) | Gốc dự án bớt 3 file | Link cũ đã gửi phụ huynh/giáo viên sẽ hỏng | Giữ, trừ khi chắc chưa ai dùng link cũ |
| D5 | Gom vòng chạy khối: 7 engine (Lớp 1 Bài 12, 13, 19; Lớp 3 Bài 10, 11, 12; Lớp 3 Bài 8) tự viết lại vòng lặp của lớp gốc. Chuyển chúng sang dùng `lesson-engine.js`, kiểm bằng `scripts/engine-trace.js` (phải "khác: 0") | Bớt ~700 dòng trùng; sửa lỗi một chỗ là đúng mọi bài (hôm nay phải sửa Lặp ở 9 nơi) | Trung bình; có engine-trace và fuzz bảo vệ | **Làm**, giao Codex từng bài |
| D6 | Chuyển Bài 9 (`simulation-engine.js`, 1.337 dòng, viết trước khi có lớp gốc) sang lớp gốc + scene-kit | Bài 9 theo cùng khuôn với các bài khác | Cao: bài lâu đời, nhiều luật chấm | Để sau D5 |
| D7 | Sửa ghi chú lỗi thời ở đầu `js/catalog.js` ("tạo trang lopX-baiYY.html") theo quy trình `bai.html?id=` | Tránh hiểu sai | Không | **Làm** |
| D8 | `js/art-kit.js` (thư viện tranh chung ZMArt) chưa được trang bài nạp; 5 `art.js` có kiểm tra nó nhưng đang dùng hình dự phòng | Nạp thật thì tranh các bài đồng bộ | Thấp: hình có thể đổi chút | Quyết định: nạp vào `lessons.js` hay bỏ |
| D9 | Tạm dừng "Phòng lập trình" (`docs/phong-lap-trinh.md`) tới khi xong dọn gọn | Không phình thêm | – | **Đã dừng** |
