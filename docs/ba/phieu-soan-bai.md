# Phiếu soạn bài — Happy STEAM Lab

Phiên bản 0.1 · 2026-10-31. Dùng trước khi làm **mỗi bài mới**.
Người soạn (chủ sản phẩm hoặc giáo viên) điền phiếu. Claude đọc phiếu và tài liệu nguồn rồi mới dựng bài.
Một phiếu điền đủ = bài làm đúng ngay lần đầu, không phải sửa đi sửa lại.

**Cách dùng:** chép phần **A** cộng đúng **một** trong các phần **B / C / D** theo loại bài vào file `docs/bai/<lop>-<bai>.md`, rồi điền. Ô nào chưa biết thì ghi `?`. Claude sẽ hỏi lại đúng những ô đó. Đừng bịa cho đủ.

Liên quan: nghiệp vụ ở `docs/ba/BRD.md` (Bài, Phiên bản bài, nhiệm vụ cơ bản/nâng cao, công thức mức gợi ý 6.2). Cấu trúc mã hiện có ở `docs/ba/cau-truc-bai-hien-trang.md`.

---

## Luật chung cho mọi bài

| Mã | Luật | Vì sao |
|---|---|---|
| PS-01 | Mỗi bài có **2–4 nhiệm vụ cơ bản** và **0–2 nhiệm vụ Nâng cao** | Mức gợi ý tính từ nhiệm vụ cơ bản (BRD 6.2). Có 1 nhiệm vụ thì chỉ ra HTT hoặc CHT; có trên 4 thì trẻ Lớp 1 không theo kịp trong 2 tiết |
| PS-02 | Mỗi nhiệm vụ có **điều kiện xong đo được trên máy** (ví dụ "pin đạt 100%"), cấm "hiểu được", "biết cách" | Máy phải tự đánh dấu xong, giáo viên không phải đoán |
| PS-03 | Nhiệm vụ 1 của bài mô hình luôn là "lắp xong N bước" | Quy ước chung của khung (m1) |
| PS-04 | Chương trình mẫu chép **đúng** từ giáo án/ảnh lập trình chính thức | Tài liệu chính thức là nguồn đúng; mô tả của AI khác từng bịa thông số |
| PS-05 | Chi tiết sáng tạo phải **có trong hộp kit** của khối đó, đủ số lượng | Học sinh làm theo trên kit thật |
| PS-06 | Không đưa logo, tên công ty biên soạn tài liệu gốc vào bài | Tài liệu gốc thuộc đơn vị khác |
| PS-07 | Chữ trong chế độ **Bé** không có số đo kỹ thuật (vòng/phút, tỉ số, độ) | Trẻ 6–7 tuổi không đọc được; số chỉ hiện ở Nâng cao |

---

## A. Phần chung (mọi loại bài)

### A1. Định danh
| Ô | Điền |
|---|---|
| Khối / Học kì / Tuần | |
| Số bài và tên bài (đúng giáo trình) | |
| Loại bài | mô hình / dự án / trưng bày / lý thuyết / kiểm tra |
| Bộ kit | ZM Alpha 330 (Lớp 1) / ZM Alpha Set A (Lớp 3) |
| Một câu giới thiệu (hiện ở thẻ chọn bài, ≤ 120 ký tự) | |

### A2. Tài liệu nguồn (đánh dấu cái đã có, ghi đường dẫn Drive hoặc thư mục máy)
| Tài liệu | Có? | Đường dẫn |
|---|---|---|
| Giáo án (KHGD / KHBG .docx) | | |
| Sách lắp ráp PDF | | |
| File CAD `.io` | | |
| Ảnh từng bước (Step by step) | | |
| Slide bài giảng `.pptx` | | |
| Phiếu học tập (PHT) + đáp án | | |
| Ảnh chương trình mẫu (khối lệnh) | | |
| Ảnh mô hình thật đã lắp | | |

> Thư mục Drive có thể bị lẫn file của bài khác (Lớp 3: Bài 22 chứa giáo án Bài 23). Mở từng file ra kiểm, đừng tin tên thư mục.

### A3. Mục tiêu bài học (chép từ giáo án, tối đa 3 dòng)
1.
2.
3.

### A4. Những điều cần kiểm trên kit thật
Liệt kê chỗ CAD/PDF có thể khác kit thật: chi tiết thiếu trong thư viện, góc khớp nối, màu, mã động cơ/cảm biến.
-

---

## B. Bài mô hình

### B1. Lắp ráp
| Ô | Điền |
|---|---|
| Tổng số bước trong sách | |
| Bước chỉ xoay xem, không lắp thêm (số bước) | |
| Cụm lắp riêng rồi ghép vào (bước nào → bước nào) | |
| Bước sách bị thiếu/lỗi | |
| Động cơ (mã, vị trí) | |
| Cảm biến / nút bấm (mã, loại: chạm, khoảng cách, màu…) | |
| Bộ phận chuyển động khi chạy (bánh xe, cánh quạt, anten…) và trục quay | |
| Truyền động (bánh răng a:b, nối thẳng…) | |

### B2. Câu chuyện mô phỏng (chặng ③)
Một cảnh minh hoạ lớn, kể chuyện bằng hình, không phải bảng số.
| Ô | Điền |
|---|---|
| Bối cảnh (nơi, lúc) | ví dụ: cánh đồng gió có ngôi nhà nhỏ |
| Robot làm gì trong cảnh | |
| Thế nào là **thành công** (hình ảnh khi đạt) | |
| Thế nào là **thất bại / va chạm** (hình ảnh + lời nhắc vui, ví dụ "Ối!") | |
| Cảm biến hiện trên màn hình ra sao (nút đỏ để chạm, vật cản xuất hiện…) | |
| Âm thanh cần có | |

### B3. Lập trình
| Ô | Điền |
|---|---|
| Chương trình mẫu (liệt kê đúng thứ tự khối, chép từ giáo án) | |
| Khối cần có trong khay (Bé) | |
| Khối thêm cho Nâng cao | |
| Khối **chưa có** trong hệ thống (tên, tác dụng, tham số) | |

Khối hiện có: Start, Repeat/Repeat End, Wait (giây), Low/Medium/High Speed, Motor Power 1–8, Motor This Way, Motor Stop, Melody A/B, Waiting for Pressed (chạm), Wait for Obstacles, Đợi đường trống, Nếu thấy vật lạ…Hết Nếu, Chụp ảnh. Danh sách đầy đủ: `docs/ba/cau-truc-bai-hien-trang.md` mục 4.

### B4. Nhiệm vụ (theo PS-01, PS-02, PS-03)
| Mã | Loại | Tên (≤ 6 từ, trẻ đọc được) | Hướng dẫn trên thẻ (1–2 câu) | Điều kiện xong đo được |
|---|---|---|---|---|
| M1 | cơ bản | Lắp xong … | Bấm "Đã lắp xong" ở cả N bước | Đủ N bước được đánh dấu |
| M2 | cơ bản | Ghép khối giống mẫu | | Chương trình khớp mẫu **và** đã chạy |
| M3 | cơ bản | | | |
| M4 | cơ bản | Thử … sáng tạo | Gắn chi tiết ở chặng Sáng tạo rồi chạy | ≥ 1 gói sáng tạo được gắn **và** chạy chương trình |
| M5 | nâng cao | | | |
| M6 | nâng cao | | | |

### B5. Xưởng sáng tạo (chặng ②) — 4 vị trí gắn
| Vị trí gắn (trên mô hình) | Lựa chọn | Chi tiết cần (mã × số) | Tác dụng trong mô phỏng (đo được) | Câu giải thích cho trẻ |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |
| | | | | |

Kiểm PS-05: cộng tổng chi tiết của mọi lựa chọn cùng lúc, so với số trong hộp kit (hệ thống tự cảnh báo thiếu, nhưng nên biết trước).

### B6. Thử thách Nâng cao
| Ô | Điền |
|---|---|
| Điều gì thay đổi trong cảnh (thời tiết, vật cản di chuyển, điểm đích đổi chỗ…) | |
| Học sinh phải lập trình gì để vượt qua | |
| Có phép tính cho Lớp 3–5 không (ví dụ quãng đường = tốc độ × thời gian) | |
| Các chỉ số hiện ở Nâng cao (≤ 4 ô đo) | |

### B7. Hình vẽ cần đặt (giao Antigravity)
Danh sách hình: nền cảnh, nhân vật/vật thể, hình nhỏ cho 4 gói sáng tạo. Claude sẽ viết phiếu vẽ từ mục này.
-

---

## C. Bài dự án / trưng bày

| Ô | Điền |
|---|---|
| Tên dự án, các tuần | |
| Câu hỏi lớn (vấn đề thực tế) | |
| Thẻ vấn đề cho trẻ chọn (3–6 thẻ: tên + 1 câu + hình gợi ý) | |
| Mô hình đã học được dùng làm gốc (danh sách bài) | |
| Vai trò trong nhóm (tên + việc) | |
| Nội dung poster bắt buộc (các ô) | |
| Tiêu chí tự đánh giá (sao) — tối đa 4 tiêu chí | |
| Nhiệm vụ cơ bản để chấm (theo PS-01, PS-02), ví dụ: chọn vấn đề; có chương trình chạy; nộp poster; chia sẻ | |
| Tuần trưng bày: ai bình chọn, bình chọn cái gì | |

---

## D. Bài lý thuyết / kiểm tra (dạng thử thách lập trình)

Theo BRD 12.4: hiện chỉ làm dạng **thử thách lập trình** trên mô hình đã học. Dạng câu hỏi khác để sau.

| Ô | Điền |
|---|---|
| Mô hình dùng lại (bài nào) | |
| Nội dung lý thuyết cần truyền tải (≤ 3 ý, chép giáo án) | |
| Các thử thách (mỗi thử thách = 1 nhiệm vụ cơ bản): mô tả + điều kiện xong đo được | |
| Khối được phép dùng (có thể giới hạn để tăng độ khó) | |
| Kiểm tra: có giới hạn thời gian / số lần chạy không? | |

---

## E. Phiếu sẵn sàng (Claude kiểm trước khi dựng)

- [ ] A1 đủ; loại bài khớp `js/catalog.js`.
- [ ] Có đủ tài liệu nguồn cần cho loại bài (mô hình: PDF + `.io` + giáo án; dự án: giáo án; thử thách: giáo án + bài gốc đã dựng).
- [ ] Mọi nhiệm vụ qua PS-01, PS-02; M1 theo PS-03.
- [ ] Chương trình mẫu khớp ảnh/giáo án (PS-04).
- [ ] Bảng sáng tạo qua PS-05.
- [ ] Không còn ô `?` ở B1, B3, B4 (các ô `?` khác Claude hỏi lại trong một lượt).

---

## F. Phiếu ánh xạ sang cấu hình bài (cho lập trình viên)

| Ô trong phiếu | Đi vào |
|---|---|
| A1 tên, giới thiệu, tuần, loại | danh mục bài (catalog) |
| B1 số bước, bước chỉ xoay, cụm | kế hoạch bước lắp (`scripts/<bai>-plan.js`) + `book()` |
| B1 động cơ, bộ phận chuyển động, truyền động | `drive` trong dữ liệu 3D; engine của bài |
| B2 câu chuyện | scene của bài + phiếu vẽ |
| B3 khối, mẫu | `LESSON.blocks` (toolbox / pro / sample) |
| B4 nhiệm vụ | `LESSON.missions`, `LESSON.cards`, `cardOrder`; điều kiện xong → engine `checkMissions` |
| B5 sáng tạo | `LESSON.creative` (slots, features, presets, kit, placements) |
| B6 Nâng cao | engine `setAdvanced`, nhiệm vụ M5–M6 |
| B7 hình | `js/<bai>/art.js` (Antigravity) |

---

## Ví dụ đã điền — Lớp 1 · Bài 10 Cối xoay gió (rút gọn)

**A1** · Lớp 1 / HK I / Tuần 10 · "Bạn gió tinh nghịch, gió ở đâu?" · mô hình · ZM Alpha 330 · "Lắp cối xoay gió 15 bước, nhấn nút đổi tốc độ cánh quạt, sạc pin thắp sáng ngôi nhà."

**A2** · Giáo án ✓ · PDF 15 trang ✓ · `.io` 41 chi tiết, một khối phẳng ✓ · ảnh bước ✓ · ảnh mô hình thật ✓ (`references/drive_bai10/`).

**A4** · Cảm biến chạm BE-2257 có trong hộp — cần kiểm vị trí nút đỏ trên kit thật.

**B1** · 15 bước; bước 15 chỉ xem · không có cụm riêng · động cơ BE-3581 · nút chạm BE-2257 · cánh quạt 3 thanh 7 lỗ quay quanh trục động cơ · nối thẳng.

**B2** · Cánh đồng gió, ngôi nhà nhỏ, cục pin nối dây · cánh quay tạo điện, dây sáng chấm vàng chạy về pin · thành công: pin đầy, cửa sổ nhà sáng vàng · thất bại (Nâng cao): cánh còn quay khi bão → cối xoay rung, "Ối!".

**B3** · Mẫu: Start, Repeat, Waiting for Pressed, Low Speed, Waiting for Pressed, Medium Speed, Waiting for Pressed, High Speed, Waiting for Pressed, Motor Stop, Repeat End · khối mới khi làm bài này: Medium Speed, Waiting for Pressed.

**B4**
| Mã | Loại | Tên | Điều kiện xong |
|---|---|---|---|
| M1 | cơ bản | Lắp xong cối xoay gió | 15/15 bước |
| M2 | cơ bản | Ghép khối giống mẫu | Chương trình khớp mẫu và đã nhấn nút đủ 4 lần |
| M3 | cơ bản | Sạc đầy pin ngôi nhà | Pin đạt 100% |
| M4 | cơ bản | Thử cối xoay gió sáng tạo | ≥ 1 gói gắn + chạy |
| M5 | nâng cao | Vượt qua cơn bão | Cánh dừng trong suốt cơn bão và chạy lại sau bão |

**B5** · Đầu cánh: cánh dài (thanh 7 lỗ × 3, chốt × 6) → sạc nhanh hơn 40% · Bầu cánh: thêm 3 cánh (khối 3 cánh × 1, thanh 7 lỗ × 3, chốt trục × 3) → nhanh hơn 30% · Đỉnh: đèn đỏ (trục 7 × 1, bạc nửa × 1) → trang trí · Phía sau: đuôi lái gió (khung 5×7 × 1, khớp góc × 1, chốt × 2) → trang trí.

**B6** · Thời tiết đổi: lặng → gió nhẹ → gió mạnh → bão · phải nhấn nút cho dừng khi bão · không có phép tính · ô đo: tốc độ cánh, mức pin, thời tiết, số lần nhấn.

**B7** · Nền cánh đồng + 4 kiểu thời tiết, vệt gió, cối xoay gió, ngôi nhà sáng/tối, cục pin, dây điện, 4 hình gói (phiếu `docs/giao-viec/02-…`).
