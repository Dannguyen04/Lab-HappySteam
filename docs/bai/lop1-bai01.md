# Phiếu soạn bài — Lớp 1 · HK I · Bài 1 "Làm quen bộ công cụ" (NHÁP)

Nháp do Claude điền từ tài liệu Drive có trong `references/drive_bai01/`. Ô `?` = chưa có nguồn, xem mục "Câu hỏi cho chủ sản phẩm". Mục ghi "ĐỀ XUẤT" cần chủ sản phẩm duyệt.

Lưu ý nguồn: thư mục Bài 1 trên Drive **không có** giáo án KHGD, không có PDF lắp ráp, không có ảnh chương trình, không có ảnh từng bước (thư mục "Step by step" và "Bài giảng" trống theo cây thư mục). Chỉ có `.io`, ảnh mô hình, phiếu học tập (PHT).

---

## A. Phần chung

### A1. Định danh
| Ô | Điền |
|---|---|
| Khối / Học kì / Tuần | Lớp 1 / HK I / Tuần 1 (theo catalog, `js/catalog.js` dòng 20) |
| Số bài và tên bài | Bài 1 · Làm quen bộ công cụ (tên thư mục Drive: "Làm quen với bộ công cụ"; PHT: "Làm quen với robot") |
| Loại bài | mô hình |
| Bộ kit | ZM Alpha 330 |
| Một câu giới thiệu (≤ 120 ký tự) | "Làm quen thanh thẳng, trục, chốt, bánh xe; lắp xe trượt dốc rồi thử xem xe chạy nhanh hay chậm." (96 ký tự, đề xuất) |

### A2. Tài liệu nguồn
| Tài liệu | Có? | Đường dẫn |
|---|---|---|
| Giáo án (KHGD / KHBG .docx) | KHÔNG | Drive: Khối 1 / Học kì 1 I Lớp 1 / Bài 1 không có |
| Sách lắp ráp PDF | KHÔNG | |
| File CAD `.io` | Có | `references/drive_bai01/bai1.io` (486 KB) |
| Ảnh từng bước (Step by step) | KHÔNG (thư mục trống) | |
| Slide bài giảng `.pptx` | KHÔNG (thư mục "2. Bài giảng" trống; chỉ có file tạm `~$Bài 1…pptx` không dùng được) | |
| Phiếu học tập (PHT) + đáp án | PHT có, đáp án KHÔNG | `references/drive_bai01/pht-bai1.pdf` (4 trang) |
| Ảnh chương trình mẫu (khối lệnh) | KHÔNG | |
| Ảnh mô hình thật đã lắp | Chỉ có ảnh dựng 3D (800×600), chưa có ảnh kit thật | `references/drive_bai01/bai1.png` |

### A3. Mục tiêu bài học
Không có giáo án để chép. Suy từ PHT (cần giáo viên xác nhận):
1. Biết robot là gì, kể tên robot và lợi ích của robot (PHT phần I, câu 1–4).
2. Nhận biết các bộ phận chính của bộ công cụ: bộ điều khiển, động cơ, cảm biến, bánh xe, thanh thẳng, bánh đai (PHT phần II, câu 1).
3. Lắp xe trượt dốc, thử và nêu yếu tố ảnh hưởng tới tốc độ xe; hiểu lực ma sát (PHT câu 7, phần II câu 3).

### A4. Những điều cần kiểm trên kit thật
- Ảnh `.png` chỉ là xe 4 bánh: 2 bánh sau to màu xanh ngọc, 2 bánh trước nhỏ xám, thân là một thanh dài trắng. Chưa thấy ảnh thật.
- `.io` có 22 chi tiết, **không có động cơ, cảm biến hay bộ điều khiển**. Nhưng PHT lại bảo học sinh chú thích "bộ điều khiển, động cơ, cảm biến, bánh đai", nên PHT nói về bộ công cụ chung, không phải riêng xe này.
- Trong thư viện hình 3D (`content/kits/alpha330/meshes/`) mới thấy 2780 (chốt), 32278, 3713 (bạc), bp-8841, bp-8850. Chưa thấy 3707 (trục) và 4185 (moay-ơ bánh). Cần kiểm trước khi dựng.
- 32278 trong `.io` có 4 chi tiết, trong ảnh trông là thanh trắng dài; chưa rõ độ dài (số lỗ) vì không có sách lắp.

---

## B. Bài mô hình

### B1. Lắp ráp
| Ô | Điền |
|---|---|
| Tổng số bước trong sách | ? (không có sách; `.io` không chia bước, 0 dòng `STEP`) |
| Bước chỉ xoay xem | ? |
| Cụm lắp riêng | ? (đoán: cụm bánh trước và cụm bánh sau, chưa xác nhận) |
| Bước sách bị thiếu/lỗi | ? |
| Động cơ | KHÔNG có trong `.io` |
| Cảm biến / nút bấm | KHÔNG có trong `.io` |
| Bộ phận chuyển động khi chạy | 4 bánh lăn tự do trên 2 trục (xe trượt xuống dốc nhờ trọng lực, không có động cơ) |
| Truyền động | Không (không có động cơ, không bánh răng, không dây đai) |

Danh sách 22 chi tiết trong `bai1.io` (đếm từ `model.ldr`):
| Mã | Số lượng | Ghi chú |
|---|---|---|
| 2780 | 6 | chốt |
| 32278 | 4 | thanh thẳng (số lỗ chưa rõ) |
| 3713 | 4 | bạc |
| 3707 | 2 | trục |
| 4185 | 2 | moay-ơ bánh xe (suy đoán, chưa xác nhận) |
| bp-8841 | 2 | bánh xe tùy chỉnh (bánh lớn xanh ngọc, suy đoán) |
| bp-8850 | 2 | bánh xe tùy chỉnh (bánh nhỏ xám, suy đoán) |

### B2. Câu chuyện mô phỏng (chặng ③) — ĐỀ XUẤT, cần chủ sản phẩm duyệt
Giáo án không có chặng lập trình. Đề xuất thay bằng thí nghiệm "xe trượt dốc" (khớp PHT phần II câu 3: "rút ra các yếu tố ảnh hưởng đến tốc độ của xe").

| Ô | Điền |
|---|---|
| Bối cảnh | Sân chơi có một cái dốc gỗ, vạch xuất phát trên đỉnh, vạch đích dưới chân dốc |
| Robot làm gì trong cảnh | Xe vừa lắp được thả từ đỉnh dốc, tự trượt xuống, không lập trình |
| Thế nào là thành công | Xe tới vạch đích; hiện đồng hồ bấm giờ và ngôi sao |
| Thất bại | Dốc quá thoải: xe dừng giữa dốc, "Hừm, xe chưa tới đích, thử dốc cao hơn nhé!" |
| Điều khiển trên màn hình | Thanh trượt đổi độ dốc (3 nấc: thoải / vừa / dốc); nút "Thả xe" |
| Âm thanh | Tiếng bánh lăn, tiếng "ting" khi tới đích |

### B3. Lập trình
| Ô | Điền |
|---|---|
| Chương trình mẫu | KHÔNG CÓ. Mô hình không có động cơ nên bài không có lập trình khối lệnh (không có ảnh "Lập trình.png" trong thư mục Bài 1, khác Bài 9–12) |
| Khối cần có trong khay (Bé) | Không dùng |
| Khối thêm cho Nâng cao | Không dùng |
| Khối chưa có trong hệ thống | Không cần |

Hệ quả kỹ thuật: bài này không dùng `LESSON.blocks`; cần chế độ bài "không lập trình" (bỏ chặng ③ khối lệnh, thay bằng thí nghiệm). Xem câu hỏi 1.

### B4. Nhiệm vụ (ĐỀ XUẤT)
| Mã | Loại | Tên | Hướng dẫn trên thẻ | Điều kiện xong đo được |
|---|---|---|---|---|
| M1 | cơ bản | Lắp xong xe trượt dốc | Bấm "Đã lắp xong" ở cả N bước | Đủ N bước đánh dấu (N = ?, chờ số bước thật) |
| M2 | cơ bản | Gọi tên các bộ phận | Chạm tên đúng vào từng bộ phận của xe (thanh thẳng, trục, chốt, bánh xe) | Ghép đúng 4/4 bộ phận (thay cho phiếu chú thích PHT; cần duyệt) |
| M3 | cơ bản | Thả xe xuống dốc | Chọn độ dốc, bấm "Thả xe" | Xe tới vạch đích ít nhất 1 lần |
| M4 | cơ bản | Thử xe sáng tạo | Gắn chi tiết ở chặng Sáng tạo rồi thả xe | ≥ 1 gói sáng tạo được gắn **và** đã thả xe |
| M5 | nâng cao | Xe nhanh nhất | Tìm độ dốc và gói gắn để xe tới đích nhanh nhất | Thời gian xuống dốc nhỏ hơn mốc (mốc = ?) |

Không có nhiệm vụ "ghép khối giống mẫu" vì bài không lập trình.

### B5. Xưởng sáng tạo (chặng ②) — ĐỀ XUẤT, số lượng hộp kit chưa biết
Chỉ dùng mã đã thấy trong `.io` hoặc trong thư viện kit. Số lượng trong hộp: ? (xem câu hỏi 4).

| Vị trí gắn | Lựa chọn | Chi tiết cần | Tác dụng (đo được) | Câu giải thích cho trẻ |
|---|---|---|---|---|
| Bánh sau | Bánh to (mặc định) / bánh nhỏ | 2 bánh bp-8841 hoặc bp-8850 (đã có trong `.io`) | ? (chưa có số liệu thật, cần chủ sản phẩm quyết hệ số) | "Bánh to lăn được xa hơn." |
| Thân xe | Thêm thanh thẳng làm xe dài hơn | thanh 32278 × ? | ? | "Xe dài, chắc hơn." |
| Phía trên | Thêm "hàng hóa" bằng thanh/chốt cho nặng hơn | chốt 2780 × ?, thanh 32278 × ? | ? (khối lượng ảnh hưởng tốc độ?) | "Xe nặng hay nhẹ, bé thử xem." |
| Phía trước | Trang trí (mũi xe) | chốt 2780 × ? | trang trí | "Mũi xe cho xe thật xinh." |

Kiểm PS-05: không tính được vì chưa có số lượng hộp kit.

### B6. Thử thách Nâng cao
| Ô | Điền |
|---|---|
| Điều gì thay đổi trong cảnh | ĐỀ XUẤT: mặt dốc đổi vật liệu (trơn / nhám) để thấy lực ma sát (PHT câu 7) |
| Học sinh phải lập trình gì | Không có lập trình; phải chọn bánh và độ dốc phù hợp |
| Phép tính cho Lớp 3–5 | Không (bài Lớp 1) |
| Chỉ số hiện ở Nâng cao (≤ 4) | thời gian xuống dốc, độ dốc, loại mặt dốc, loại bánh (chỉ hiện ở Nâng cao; Bé không có số) |

### B7. Hình vẽ cần đặt (giao Antigravity)
- Nền sân chơi có dốc 3 độ nghiêng, vạch xuất phát và vạch đích.
- Xe trượt dốc (nếu dùng ảnh 3D hệ thống thì không cần vẽ).
- Mặt dốc trơn và mặt dốc nhám (Nâng cao).
- 4 hình nhỏ cho 4 lựa chọn sáng tạo.
- Hình robot/thiết bị trong bộ công cụ (bộ điều khiển, động cơ, cảm biến, bánh đai) để làm bài "gọi tên bộ phận", chỉ vẽ nếu duyệt M2.

---

## Nội dung PHT (đọc được từ PDF)
- Phần I Khám phá: robot là gì; đánh dấu hình là robot; kể tên robot; lợi ích của robot; tạo mô hình robot cần làm gì; tên bộ công cụ và các thiết bị thông minh trong đó; lực ma sát là gì, có lợi hay có hại.
- Phần II Sáng tạo: làm xe trượt dốc di chuyển dựa vào độ cao của dốc; chú thích 6 bộ phận (1 Bộ điều khiển, 2 Động cơ, 3 Cảm biến, 4 Bánh xe, 5 Thanh thẳng, 6 Bánh đai); "mô hình trên có phải là Robot?"; nâng cấp xe và rút ra yếu tố ảnh hưởng tới tốc độ.
- Chia sẻ: ghi điều đã học. Không có đáp án.

---

## Câu hỏi cho chủ sản phẩm
1. Bài 1 không có động cơ, không lập trình: có đồng ý thay chặng ③ bằng thí nghiệm "độ dốc / khối lượng" không (ĐỀ XUẤT B2, B4)? Nếu không, ý chủ sản phẩm là gì?
2. Có giáo án KHGD và PDF lắp ráp Bài 1 ở nơi khác không (Drive không có)? Cần để biết số bước (N cho M1), cụm lắp, và mục tiêu bài chính thức.
3. Nhiệm vụ M2 "gọi tên bộ phận" có đưa vào hệ thống không, hay chỉ làm trên phiếu giấy? Bộ phận nào cần nhận biết (thanh thẳng, trục, chốt theo catalog; PHT còn bộ điều khiển, động cơ, cảm biến, bánh đai)?
4. Số lượng chi tiết trong hộp kit Lớp 1 (chốt 2780, thanh 32278, bạc 3713, trục 3707, bánh 4185/bp-8841/bp-8850) là bao nhiêu, để chốt gói sáng tạo?
5. Thanh thẳng 32278 dài bao nhiêu lỗ, và 3707, 4185 có trong kit thật không (thư viện hình hệ thống thiếu hai mã này)?
6. Hệ số tác dụng của gói sáng tạo (bánh to/nhỏ, xe nặng/nhẹ) có lấy theo thực nghiệm trên kit thật không, hay chủ sản phẩm chọn số tượng trưng?

## Tài liệu đã đọc
- `C:\Users\DAN\Documents\Lab-HappySteam\docs\ba\phieu-soan-bai.md`
- `C:\Users\DAN\Documents\Lab-HappySteam\docs\ba\cau-truc-bai-hien-trang.md` (mục 4)
- `C:\Users\DAN\Documents\Lab-HappySteam\references\drive_khung\drive_tree.txt`
- `C:\Users\DAN\Documents\Lab-HappySteam\references\drive_bai01\bai1.io`
- `C:\Users\DAN\Documents\Lab-HappySteam\references\drive_bai01\bai1.png`
- `C:\Users\DAN\Documents\Lab-HappySteam\references\drive_bai01\pht-bai1.pdf`
- `C:\Users\DAN\Documents\Lab-HappySteam\js\catalog.js` (dòng 20) và danh sách `content/kits/alpha330/meshes/`

## Quyết định của chủ sản phẩm (2026-10-31)
- Chặng ③ = **thí nghiệm độ dốc / khối lượng** (bài không có động cơ, không lập trình). Duyệt đề xuất.
- Không có giáo án: mục tiêu bài lấy từ phiếu học tập.
- Số lượng chi tiết trong hộp kit: lấy từ `KIT` trong `js/bai03|09|10/lesson.js` (set2321A); Claude điền khi dựng bài.
