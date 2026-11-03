# Lớp 1 Bài 9 — Chương trình mẫu đúng và sai

Cập nhật: 2026-11-04. Sinh bằng `node scripts/thu-chuong-trinh.js lop1-bai09 --md` từ `content/lop1/bai09/mau-lap-trinh.json`, chạy trên bộ mô phỏng thật của bài (chế độ Bé). Test `tests/mau-lap-trinh.test.js` giữ cho kết quả không đổi.

Mở một ca trên trang bài: `bai.html?id=lop1-bai09&mau=<id ca>`; chương trình được nạp sẵn ở chặng Lập trình, bấm Chạy để xem.

## Luật của bài (đọc từ `js/simulation-engine.js`)

- Tốc độ: Quay nhanh (mức 8) = vệ tinh quay **180°/giây**; Motor Power 4 = **90°/giây**. Khối Melody kéo dài 1 giây, motor vẫn quay trong lúc phát.
- Vành đai thiên thạch ở **110°**. Đi qua 110° theo chiều thuận là "đụng".
- **NV2**: chương trình giống hệt mẫu trong sách (cả số giây) và chạy hết ít nhất một vòng lặp.
- **NV3** (sửa 2026-11-04): khi vệ tinh đang ở **60°–110°**, đảo chiều hoặc Stop là đạt. Có Melody B ngay trước Stop (cách không quá 50°) thì ghi thêm là "có báo trạm".
- Hết khối mà motor còn quay thì vệ tinh vẫn quay (như kit thật), phải bấm Dừng.

## Kết quả

| Ca | Chương trình | Kết quả trên robot ảo | NV2 | NV3 | Đúng như mong đợi |
|---|---|---|---|---|---|
| ✔ Đúng: Chương trình mẫu trong sách | Bắt đầu → Bắt đầu lặp → Âm thanh A → Quay nhanh → Chờ 3s → Âm thanh B → Quay nhanh → Chờ 3s → Lặp lại | đụng thiên thạch; dừng ở 184° (5.51 vòng) | ✅ | — | ✅ |
| ✔ Đúng: Tránh thiên thạch: chậm lại, báo hiệu rồi dừng | Bắt đầu → Tốc độ động cơ 4 → Âm thanh B → Dừng motor | không đụng; dừng ở 90° (0.25 vòng); tránh bằng Melody B + dừng | — | ✅ | ✅ |
| ✔ Đúng: Tránh thiên thạch: đảo chiều trước vành đai | Bắt đầu → Quay nhanh → Chờ 0.5s → Đổi chiều quay → Chờ 2s → Dừng motor | không đụng; dừng ở 90° (-0.75 vòng); tránh bằng đảo chiều | — | ✅ | ✅ |
| ✔ Đúng: Tránh thiên thạch: chậm lại rồi dừng | Bắt đầu → Tốc độ động cơ 4 → Chờ 1s → Dừng motor | không đụng; dừng ở 90° (0.25 vòng); tránh bằng Melody B + dừng | — | ✅ | ✅ |
| ✘ Sai: Quay nhanh mãi, không tránh | Bắt đầu → Quay nhanh → Chờ 5s | đụng thiên thạch; dừng ở 4° (3.01 vòng) | — | — | ✅ |
| ✘ Sai: Đảo chiều quá muộn | Bắt đầu → Quay nhanh → Chờ 1s → Đổi chiều quay → Chờ 2s → Dừng motor | đụng thiên thạch; dừng ở 180° (-0.5 vòng) | — | — | ✅ |
| ✘ Sai: Dừng quá sớm, chưa tới gần đám đá | Bắt đầu → Quay nhanh → Chờ 0.1s → Dừng motor | không đụng; dừng ở 18° (0.05 vòng) | — | — | ✅ |
| ✘ Sai: Melody B ở tốc độ nhanh: dừng không kịp | Bắt đầu → Quay nhanh → Âm thanh B → Dừng motor | đụng thiên thạch; dừng ở 180° (0.5 vòng) | — | — | ✅ |
| ✘ Sai: Ghép gần giống mẫu nhưng thiếu khối | Bắt đầu → Bắt đầu lặp → Âm thanh A → Quay nhanh → Chờ 3s → Lặp lại | đụng thiên thạch; dừng ở 184° (3.51 vòng) | — | — | ✅ |
| ✘ Sai: Đúng các khối nhưng sai số giây | Bắt đầu → Bắt đầu lặp → Âm thanh A → Quay nhanh → Chờ 2s → Âm thanh B → Quay nhanh → Chờ 3s → Lặp lại | đụng thiên thạch; dừng ở 184° (5.51 vòng) | — | — | ✅ |

## Link mở từng ca

- ✔ Chương trình mẫu trong sách: `bai.html?id=lop1-bai09&mau=dung-mau-sach` — Đúng thứ tự khối của sách nên đạt NV2. Mẫu chưa biết tránh: vệ tinh quay nhanh 3 giây và đi qua vành đai thiên thạch. Sa bàn báo "Mẫu trong sách chưa biết tránh đá" và mời em sang NV3 để sửa.
- ✔ Tránh thiên thạch: chậm lại, báo hiệu rồi dừng: `bai.html?id=lop1-bai09&mau=dung-melody-dung` — Motor Power mức 4 quay 90°/giây. Melody B kéo dài 1 giây nên vệ tinh tới khoảng 90°, vừa trước vành đai (110°); Stop dừng lại kịp. Đạt NV3.
- ✔ Tránh thiên thạch: đảo chiều trước vành đai: `bai.html?id=lop1-bai09&mau=dung-dao-chieu` — Quay nhanh 180°/giây. Chờ 0,5 giây là tới 90°, đảo chiều thì vệ tinh quay ngược ra xa đám đá. Đạt NV3.
- ✔ Tránh thiên thạch: chậm lại rồi dừng: `bai.html?id=lop1-bai09&mau=dung-chi-dung` — Motor Power 4 quay 90°/giây, chờ 1 giây là tới 90°, dừng trước vành đai (110°). Đạt NV3. Thêm Melody B trước khi dừng thì được ghi là có báo trạm.
- ✘ Quay nhanh mãi, không tránh: `bai.html?id=lop1-bai09&mau=sai-chay-mai` — Không có khối nào dừng hay đổi chiều, vệ tinh đi thẳng vào vành đai thiên thạch.
- ✘ Đảo chiều quá muộn: `bai.html?id=lop1-bai09&mau=sai-dao-chieu-muon` — Chờ 1 giây ở tốc độ nhanh là vệ tinh đã tới 180°, đi qua vành đai (110°) rồi mới đảo chiều.
- ✘ Dừng quá sớm, chưa tới gần đám đá: `bai.html?id=lop1-bai09&mau=sai-dung-som` — Dừng ở khoảng 18° là an toàn, nhưng vệ tinh chưa tới gần đám đá (vùng 60°–110°) nên chưa phải là tránh: chưa tính NV3.
- ✘ Melody B ở tốc độ nhanh: dừng không kịp: `bai.html?id=lop1-bai09&mau=sai-melody-qua-muon` — Ở tốc độ nhanh, trong 1 giây phát Melody B vệ tinh đi tới 180°, qua vành đai trước khi gặp khối Stop.
- ✘ Ghép gần giống mẫu nhưng thiếu khối: `bai.html?id=lop1-bai09&mau=sai-thieu-khoi-mau` — Thiếu khối Melody B và khối Quay nhanh thứ hai so với sách nên chưa đạt NV2.
- ✘ Đúng các khối nhưng sai số giây: `bai.html?id=lop1-bai09&mau=sai-sai-so-giay` — Khối Chờ 2 giây thay vì 3 giây như sách: NV2 cần đúng cả số giây.

## Đã sửa theo quyết định 2026-11-04

1. NV3: dừng hoặc đảo chiều ở 60°–110° là đạt; Melody B là điểm cộng "báo trạm" (trước đây bắt buộc Melody B, không khớp chữ trên thẻ).
2. Mẫu trong sách vẫn đụng đá, nhưng sa bàn báo "Mẫu trong sách chưa biết tránh đá" và mời em sang NV3.
3. Thẻ NV3 ghi rõ "khi vệ tinh tới gần đám đá"; dừng quá sớm (trước 60°) vẫn chưa tính.
