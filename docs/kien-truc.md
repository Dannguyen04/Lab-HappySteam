# Kiến trúc & kế hoạch chuyển đổi — Happy STEAM Lab

Cập nhật: 2026-10-31. Tài liệu này ghi lại các quyết định công nghệ và thứ tự làm.
Ai (người hay AI) sửa dự án đều đọc file này trước.

## 1. Yêu cầu đã chốt

| Câu hỏi | Trả lời |
|---|---|
| Thiết bị | Máy tính phòng lab + máy tính bảng, **luôn có mạng ổn định** → không cần chạy file:// nữa |
| Lưu kết quả | **(ĐÃ SỬA theo BRD)** Cơ sở dữ liệu tập trung: tài khoản giáo viên + phụ huynh, lớp, tiến độ theo học sinh ở mọi máy, giáo viên chấm HTT/HT/CHT, xuất ra bảng tính. Chi tiết nghiệp vụ: `docs/ba/BRD.md` |
| Ai soạn nội dung | Chưa biết → nội dung để dạng **dữ liệu**, sau này thêm được trang quản trị |
| Phạm vi gần | **Lớp 1** (kit ZM Alpha 330) và **Lớp 3** (kit **ZM Alpha Set A = Alpha 330**, cùng kit với Lớp 1, mã JMC-NY-2321AE; tài liệu nằm trong giáo trình tiểu học trên Drive) |

## 2. Công nghệ

| Hạng mục | Chọn | Ghi chú |
|---|---|---|
| Build | **Vite** | ES modules, dev server, build ra thư mục `dist/` |
| Ngôn ngữ | **TypeScript chuyển dần** (`allowJs`) | File mới viết `.ts`; file cũ đổi khi có dịp sửa |
| Giao diện | **Không framework** | Giữ renderer canvas 3D tự viết, DOM thuần |
| Nội dung | `content/<lop>/<bai>/` + lược đồ kiểm tra (zod) | Test chặn dữ liệu sai cấu trúc |
| 3D | **Thư viện chi tiết theo kit** + vị trí lắp theo bài | Hình dạng chi tiết dùng chung, không lặp ở mỗi bài |
| Trang | `index.html` (chọn bài) + `bai.html?id=lop1-bai09` | Một trang bài học cho mọi bài cùng loại |
| Lưu | **Supabase** (Postgres + đăng nhập + phân quyền theo hàng) — ĐÃ SỬA, thay Google Sheets | localStorage chỉ làm bộ đệm khi mất mạng; có nút xuất bảng tính |
| Test | **Vitest** (logic) + **Playwright** (mở trang thật) | Có `package.json` riêng, không mượn node_modules của RBB_Studio |
| Triển khai | **GitHub Actions → GitHub Pages** | Push lên `main` là build và đăng |

## 3. Cấu trúc thư mục đích

```
content/
  kits/
    alpha330/parts.bin(+ .json)   # hình dạng chi tiết kit Lớp 1, dùng chung
    (Lớp 3 dùng chung alpha330 – cùng kit set2321A)
  lop1/
    bai09/
      lesson.ts                   # nhiệm vụ, khối lệnh, thẻ, gói sáng tạo (window.LESSON hiện nay)
      build.json                  # các bước lắp: chi tiết nào, vị trí nào, bước mấy
      steps/step-01.jpg …         # ảnh hướng dẫn gốc
      scene.ts / engine.ts        # cảnh mô phỏng + luật vật lý riêng của bài
  catalog.ts                      # danh sách Lớp → Học kì → Bài (từ js/catalog.js)
src/
  core/      # assembly-viewer, blocks-engine, mission-tracker, creative-lab, sandbox-3d, audio
  pages/     # home, lesson, project, showcase
  styles/
scripts/     # CAD → build.json, sinh thư viện kit (chạy ở máy, không đưa lên web)
tests/
```

## 4. Kế hoạch chuyển đổi (mỗi bước xong đều phải: Bài 3, 9, 10, dự án, trưng bày chạy như cũ + test xanh + commit riêng)

1. **Bộ khung công cụ**: `package.json`, Vite, TS (`allowJs`), Vitest, Playwright; chuyển các test hiện có sang chạy bằng `npm test`. Chưa đổi mã ứng dụng.
2. **Triển khai tự động**: workflow GitHub Actions build `dist/` → Pages. Kiểm tra bản online trước khi đi tiếp.
3. **Module hoá**: đổi các `<script>` + biến toàn cục sang `import/export` trong `src/core`, giữ hành vi.
4. **Thư viện chi tiết theo kit**: tách hình dạng chi tiết khỏi `data-bai-XX.js`; mỗi bài chỉ còn `build.json`. Đo kích thước tải trước/sau.
5. **Một trang bài học**: `bai.html?id=…` đọc `content/…`. (Trang chuyển hướng cũ `lop1-bai03/09/10.html` đã bỏ ngày 2026-11-02.)
6. **Lược đồ nội dung + mẫu soạn bài**: định nghĩa "khung" từng loại bài (mô hình / dự án / lý thuyết) bằng TS + zod, kèm phiếu câu hỏi để người soạn điền thông tin một bài mới.
7. **Tài khoản & dữ liệu tập trung** theo `docs/ba/BRD.md` (lớp, buổi học, phụ huynh, chấm).
8. Làm tiếp bài mới (Lớp 1 còn lại, rồi Lớp 3 – cùng kit, cùng thư viện chi tiết).

## 5. Quy ước làm việc

- Việc vẽ (SVG, cảnh canvas) → brief trong `docs/giao-viec/` cho Antigravity, Claude chỉ review.
- Việc đọc/nhập liệu (đọc PDF vào catalog, …) → subagent Haiku.
- Nguồn đúng cho bước lắp và khối lệnh là PDF + giáo án chính thức trên Drive, không phải mô tả của AI khác.
