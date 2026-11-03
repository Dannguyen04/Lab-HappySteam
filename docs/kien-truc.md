# Kiến trúc & kế hoạch chuyển đổi — Happy STEAM Lab

Cập nhật: 2026-11-03 (chốt tech stack mới, mục 0). Bản trước: 2026-10-31. Tài liệu này ghi lại các quyết định công nghệ và thứ tự làm.
Ai (người hay AI) sửa dự án đều đọc file này trước.

## 0. Quyết định 2026-11-03: bài học là DỮ LIỆU, không phải code

Lý do: 27 bài hiện có 37.800 dòng JS riêng (~1.400 dòng/bài: `art.js` vẽ canvas tay, `*-engine.js` vật lý tự viết, `*-scene.js`), chỉ 15.400 dòng dùng chung. Nhân lên ~150 bài K1–K5 là không bảo trì được.

**Luật:** một bài = `content/<lop>/<bai>/` gồm `lesson.json` + `build.json` + `assets/`. **Không có file JS/TS riêng cho bài.** Bài cần tính năng chưa có → thêm vào thư viện chung (`src/library`) để bài sau dùng lại.

| Lớp | Chọn |
|---|---|
| Ngôn ngữ | TypeScript **strict** |
| Giao diện | **React 19 + Vite** |
| 3D | **Three.js qua React Three Fiber + drei**; mọi bài dùng cảnh 3D chung (mô hình kit thật + prefab + ảnh nền/SVG), thống nhất với Code Lab |
| Vật lý | **Rapier** (`@react-three/rapier`), một engine chung, bài chỉ khai báo tham số |
| Lập trình khối | Blockly (giữ) |
| Hình 2D | File SVG/PNG trong `assets/`, bỏ vẽ bằng code |
| Nội dung | JSON + lược đồ **Zod** theo loại bài; nhiệm vụ/điều kiện đạt là luật khai báo (vd `{"khi":"rocket.altitude",">=":50}`) |
| Trạng thái | Zustand + TanStack Query |
| Backend | Supabase (giữ). Giai đoạn 2: nội dung bài vào DB + trang soạn bài |
| Test / Triển khai | Vitest + Playwright + kiểm lược đồ mọi bài trong CI / GitHub Pages |

Cấu trúc đích: `src/engine` (runtime bài: cảnh, vật lý, luật nhiệm vụ, Blockly) · `src/library` (prefab: dốc, đường băng, gió, cảm biến, motor…) · `src/apps` (student, teacher, parent, code-lab).

Chuyển đổi (strangler, không viết lại một lần):
1. Chứng minh mô hình dữ liệu bằng 2 bài vật lý khác hẳn nhau: lớp 3 bài 13 (tên lửa) và lớp 1 bài 1 (con dốc), chạy được mà không có code riêng.
2. Khung React; chuyển trang giáo viên/phụ huynh trước (MVP BRD).
3. Bài cũ chạy qua lớp chuyển tiếp, chuyển dần. **Bài mới viết dạng dữ liệu từ nay.**

Mục 1–4 dưới đây là kế hoạch cũ; chỗ nào mâu thuẫn thì mục 0 thắng.

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
