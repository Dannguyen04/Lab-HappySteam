# Thẻ lệnh ZMROBO: cách dùng thật và cách Lab đang làm

Cập nhật: 2026-11-04. Mục tiêu của chủ dự án: **thẻ lệnh trên web phải chạy đúng như thẻ lệnh trong app ZMROBO**.
Tài liệu này tách rõ: điều đã có nguồn chính thức, điều Lab tự đặt, và điều phải thử trên app/kit thật (phiếu thử ở mục 4).

Nguồn đã đọc: 70 file KHGD (kế hoạch dạy), PHT (phiếu học tập), slide của Drive ZMROBO (Lớp 1 và Lớp 3), ảnh chương trình mẫu `references/drive_bai9/lap_trinh.png`. Không tìm được sách hướng dẫn riêng cho từng thẻ trên mạng.

## 1. Những điều đã có nguồn chính thức

| Thẻ | Điều tài liệu nói | Nguồn |
|---|---|---|
| **Start** (vàng, lá cờ) | Chạm vào để khởi chạy dòng lệnh | KHGD bài 9, bài 10, lớp 3 bài 1 |
| **Repeat Start / Repeat End** | Chạy "liên tục nhiều lần" (lặp mãi) | Ý nghĩa dòng lệnh bài 9, 11, 12 |
| **High Speed** | Động cơ quay nhanh, "chiều từ phải qua trái". Thẻ **không** có biểu tượng đồng hồ cát | `lap_trinh.png`, bài 2, 9 |
| **Wait 3s** | Có đồng hồ cát (chiếm thời gian). Số giây đổi được | `lap_trinh.png`, bài 7, 12 |
| **Melody A / B** | Có đồng hồ cát (chiếm thời gian). Chương trình mẫu bài 9: "phát âm thanh B **rồi tiếp tục di chuyển** trong 3 giây" | `lap_trinh.png`, KHGD bài 9, 11 |
| **Motor Power** | Tốc độ mặc định là **8**, chạm để đổi (ví dụ thành 2) | KHGD bài 9 |
| **Motor This Way** | "Chạm vào khối để **thay đổi hướng xoay** của động cơ" | KHGD bài 9 |
| **Chờ thấy vật cản** (cảm biến siêu âm) | Chương trình chờ tới khi cảm biến thấy vật, rồi chạy tiếp | KHGD bài 3, 5, 8 |
| **Chờ nhấn / chờ nhả** (cảm biến chạm) | Chờ tới khi nút được nhấn; lần nhấn kế tiếp qua thẻ chờ kế tiếp | KHGD bài 4, 7, 10, 12 |
| **Chờ màu** (cảm biến màu) | Chờ thấy màu xanh, vàng hoặc đỏ rồi chạy tiếp | KHGD bài 6 |
| **Kiểm tra cảm biến "nếu có vật cản thì… "** | Có một thẻ điều kiện (Lớp 1 bài 8, 13, 19, 20, 23, 24, 26): kiểm tra cảm biến, nếu có vật thì làm nhánh này | KHGD các bài đó |
| **Màn hình, âm thanh** | Hiện hình (trái tim, mặt cười, GO, mũi tên) kèm âm thanh | KHGD bài 5, 8, 11 |

Thêm một điểm đáng chú ý: slide bài 9 của ZMROBO có chữ "WEDO 2.0", và tên thẻ (Motor Power, Motor This Way) trùng với LEGO WeDo 2.0. Rất có thể thẻ ZMROBO sao theo WeDo 2.0 (trong WeDo, thẻ hướng quay đặt hướng và giữ nguyên cho tới khi đổi). Đây là suy đoán, chưa phải nguồn.

## 2. Lab đang làm gì (đối chiếu với mục 1)

| Thẻ | Lab (js/lesson-engine.js, js/simulation-engine.js) | Khớp nguồn? |
|---|---|---|
| Start, Repeat | Giống | ✅ |
| High Speed, Low, Medium | Đặt tốc độ và bật motor, **không chiếm thời gian** | ✅ |
| Wait | Chiếm đúng số giây, motor vẫn quay | ✅ |
| Melody A/B | Chiếm **1 giây** (con số Lab tự đặt), motor vẫn quay | ✅ chiếm giờ; ⚠ 1 giây chưa kiểm chứng |
| Motor Power | Mức 1–8, mặc định 8, chạm giảm dần | ✅ |
| Motor This Way | Từ 2026-11-04: **đặt hướng** (thuận hoặc ngược), hướng giữ nguyên cho tới khi có thẻ hướng khác; chạm để đổi hướng | ⚠ ý "chạm để đổi hướng" khớp; việc hướng giữ lại hay chỉ áp cho thẻ quay kế tiếp **chưa biết** |
| Stop | Tắt motor | ✅ |
| Chờ vật cản | Cần gói Cảm biến; ở bài 9 đợi vệ tinh vào vùng 60°–110° | ⚠ ý "chờ thấy vật" khớp; điều kiện vùng 60°–110° là của Lab |
| Hết khối mà motor còn bật | Motor tiếp tục quay, bấm Dừng mới tắt (bài 9) | ⚠ chưa kiểm chứng |

## 3. Thẻ chỉ có trong Lab, không có trong tài liệu ZMROBO

Các thẻ này do Lab tự thêm cho chế độ Nâng cao bài 9: **Đợi đường trống**, **Nếu thấy vật lạ / Hết Nếu**, **Chụp ảnh và gửi**. Nếu mục tiêu là "đúng ZMROBO", nên đánh dấu rõ là "thẻ của Lab" hoặc bỏ. Cũng nên kiểm lại các bài dùng thẻ điều kiện "nếu có vật cản" của ZMROBO (Lớp 1 bài 8, 13, 19, 20, 23, 24, 26): thẻ này hiện chưa có tên chung trong khay của Lab.

## 4. Phiếu thử trên app và kit ZMROBO thật

Bạn chạy từng chương trình ngắn, ghi lại điều quan sát. Một dòng là đủ. Không cần đúng giờ chính xác, chỉ cần so sánh được.

| # | Chương trình | Câu hỏi cần trả lời |
|---|---|---|
| 1 | Start → Melody A → High Speed → Wait 3s → Stop | Âm thanh phát xong rồi motor mới quay, hay quay cùng lúc? Melody kéo dài khoảng mấy giây? |
| 2 | Start → High Speed → Melody B → Wait 3s → Stop | Trong lúc phát Melody B, motor có vẫn quay không? |
| 3 | Start → High Speed → Wait 2s → **Motor This Way** → Wait 2s → Stop | Motor có đổi hướng ngay giữa chừng không? Chạm thẻ This Way thì mũi tên đổi sang kiểu gì? |
| 4 | Start → **Motor This Way** (đã chạm sang hướng khác) → High Speed → Wait 2s → Stop | Motor quay ngược lại ngay từ đầu phải không? |
| 5 | Start → High Speed → Wait 1s → **Motor This Way** → High Speed → Wait 1s → Stop | Sau This Way, High Speed thứ hai quay hướng nào? High Speed có tự đặt lại về hướng mặc định không? |
| 6 | Repeat Start → **Motor This Way** → High Speed → Wait 1s → Stop → Wait 1s → Repeat End | Mỗi vòng quay cùng hướng, hay đổi hướng lần lượt? |
| 7 | Start → Motor Power 4 → Wait 2s → Stop, rồi thử High Speed → Wait 2s → Stop | Motor Power 4 chậm hơn High Speed? High Speed ứng với mức nào (có phải 8)? Motor Power đứng một mình có tự bật motor không? |
| 8 | Start → High Speed → Wait 2s (không có Stop) | Hết chương trình thì motor tiếp tục quay hay tự tắt? |
| 9 | Start → **Chờ vật cản** → High Speed → Wait 3s → Stop, đưa vật vào trước cảm biến lúc đang chờ, rồi thử để vật sẵn từ lúc bấm Start | Có chạy tiếp ngay nếu vật đã ở sẵn không? Cảm biến thấy vật ở khoảng cách bao nhiêu cm? |
| 10 | Chạm Start khi chương trình đang chạy | Chương trình chạy lại từ đầu, hay bỏ qua? Nút Dừng có tắt cả motor không? |

Gửi kết quả bằng cách nhắn số thứ tự và một câu, ví dụ: "3: đổi ngay giữa chừng; 5: High Speed quay lại hướng cũ". Mình sẽ sửa Lab đúng theo và thêm vào bộ test để không lệch lại.
