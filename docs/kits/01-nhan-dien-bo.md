# Nhận diện các bộ kit ZMROBO và ghép mã RoboBuilder

Tài liệu đối chiếu và ghép nối giữa tên gọi thương mại của các bộ kit robot ZMROBO, mã model tiêu chuẩn của nhà sản xuất (tiền tố `JMC-NY-`) và mã bộ linh kiện trong RoboBuilder (`robobuilder-sets.json`).

---

## 1. Bảng ghép nối các bộ kit ZMROBO với mã RoboBuilder

| Tên bộ | Model JMC | Mã RoboBuilder | Số chi tiết (Web vs RoboBuilder) | Linh kiện điện tử nổi bật | Mức chắc chắn | Link nguồn |
|---|---|---|---|---|---|---|
| **Alpha Set A** | JMC-NY-2321AE | set2321A | ~330 (330 PCS) vs 316 chi tiết (82 loại) | M5-RCU (BE-5158, LED ma trận 5x7, đầu đọc thẻ lệnh OID), Động cơ vừa (BE-3581), Nút bấm (BE-1154), Đèn LED (BE-1537), Cảm ứng chạm (BE-2257) | Chắc | [ZMROBO Alpha Set A](https://www.zmrobo.net/products/80) |
| **Alpha Set B** | JMC-NY-2322E | set2322 | 350+ accessories vs 377 chi tiết (90 loại) | Cảm biến siêu âm (BE-2222), Cảm biến âm thanh MIC (BE-2260), Cảm biến góc nghiêng (BE-2701), Cảm biến chiết áp xoay (BE-6313) | Chắc | [ZMROBO Alpha Set B](https://www.zmrobo.net/products/83) |
| **Alpha Set C** | JMC-NY-2323E | set2323 | 380+ accessories (81 loại khối) vs 390 chi tiết (85 loại) | Động cơ vừa (BE-3581), Cảm biến màu sắc (BE-1153), Cảm biến quang / ánh sáng (BE-1416), Cảm biến khoảng cách hồng ngoại (BE-6208) | Chắc | [ZMROBO Alpha Set C](https://www.zmrobo.net/products/86) |
| **Alpha Set D** | JMC-NY-2324E | set2324 | 350+ accessories (51 loại khối) vs 271 chi tiết (55 loại) | Động cơ vừa (BE-3581), Cảm biến quang điện (BE-1152), Module thu hồng ngoại / giọng nói (BE-1322), Điều khiển từ xa hồng ngoại (BE-2209) | Chắc | [ZMROBO Alpha Set D](https://www.zmrobo.net/products/128) |
| **Beta Set** | JMC-NY-2421 | set2421 | 100+ đến 133 accessories vs 125 chi tiết (39 loại) | C6-RCU (BE-5161, màn hình màu 1.8 inch, pin sạc 2100mAh, Bluetooth), 2 Động cơ trục đôi có đĩa encoder (BE-3581 x2), Module dò line 7 kênh (BE-1157) | Chắc | [ZMROBO Beta Set](https://www.zmrobo.net/products/89) |
| **Innovation Storm** | JMC-NY-2508E | set2508 | 428+ pieces (80 loại khối) vs 437 chi tiết (88 loại) | E7-RCU (BE-5166, Cortex-M7, màn hình cảm ứng 3.2 inch, 8 cổng motor, 8 cổng chung), Camera AI (BE-1756, AI CAM V2.0 màn hình 2.4 inch), 2 Động cơ lớn encoder (BE-3582 x2), Cảm biến laser (BE-1245), Cảm biến chạm (BE-1536), Cảm biến AHRS (BE-1624), Cảm biến quang điện (BE-1158) | Chắc | [ZMROBO Innovation Storm](https://www.zmrobo.net/products/349) |
| **Gamma Series** | JMC-NY-2521E | set2521 | ~120+ chi tiết vs 127 chi tiết (33 loại) | Bộ điều khiển tích hợp All-in-one RCU (BE-5168, tích hợp nút bấm, động cơ, cảm biến trong một khối) | Chắc | [ZMROBO Gamma Series](https://www.zmrobo.net/products/355) |
| **Defender WiseKit** | JMC-NY-2106+E | set2106+ | 400+ đến 466 chi tiết vs 464 chi tiết (91 loại) | M6-RCU (BE-5147), 2 Động cơ giảm tốc (BE-3579 x2), Cảm biến siêu âm / quang (BE-1146 x2), Cảm biến chạm (BE-1536), Đèn LED đổi màu (BE-1624) | Chắc | [ZMROBO Defender WiseKit](https://www.zmrobo.net/products/68) |
| **Intelligence Storm** | JMC-NY-2108+E | set2108+ | 620+ chi tiết vs 628 chi tiết (97 loại) | E6-RCU (BE-5148, Cortex-M4, màn hình màu 2.4 inch, MP3 16MB), Module thị giác AI (BE-1743), 2 Động cơ lớn (BE-3570 x2), 1 Động cơ vừa (BE-3571), Cảm biến siêu âm / quang / chạm / đèn (BE-1146, BE-1147, BE-1536, BE-1624, BE-6311) | Chắc | [ZMROBO Intelligence Storm](https://www.zmrobo.net/products/67) |

---

## 2. Bộ không tìm được mã RoboBuilder

### **Super AI (Hệ sinh thái kit thi đấu & gói mở rộng Super AI)**

- **Tên thương mại:** Super AI / Super AI Track Competition Kits.
- **Model tiêu biểu:**
  - `JMC-NY-2681`: Gói mở rộng thi đấu *2026 Super AI - Star Cruise* (Bảng B/C/D).
  - `JMC-NY-2681B`: Gói mở rộng thi đấu *2026 Super AI - Star Journey* (Bảng A Tiểu học).
  - `JMC-NY-2685`: Gói thi đấu *2026 Super AI SmartCraft Challenge*.
  - `JMC-NY-2486`: Gói mở rộng thi đấu *2024 Super AI - Interstellar Crossing*.
  - `JMC-CD-2471` / `JMC-CD-2571` / `JMC-CD-2671`: Bộ đạo cụ và sa bàn nhiệm vụ (Prop Sets).
- **Mã RoboBuilder:** `null` (Không có mã bộ tương ứng trong 9 bộ RoboBuilder hiện tại).
- **Linh kiện điện tử nổi bật:**
  - **Camera AI (AI CAM / AI Vision Module):** Mã linh kiện `JMP-BE-1748` hoặc AI CAM V2.0 trên bộ Innovation Storm, hỗ trợ nhận diện khuôn mặt, màu sắc, vạch kẻ đường, AprilTag và nhận dạng giọng nói.
  - **Module RFID & Thẻ RFID mã hóa:** Mã linh kiện `JMP-BE-1548A` (RFID Module) hoặc *Info-Tag Module* (chuẩn giao tiếp NFC/RFID với màn hình tròn 1.28 inch), kết hợp thẻ RFID mã hóa dùng để kích hoạt trạm, ghi nhận checkpoint và giải mã tín hiệu trên sa bàn.
  - **Cảm biến dò vạch thông minh 7 kênh:** Tự động quét ngưỡng ánh sáng (Intelligent Tracking Module).
  - **Động cơ kỹ thuật số mini servo:** Mã linh kiện `JMP-BE-9528A`.
- **Lý do không có mã RoboBuilder tương ứng:**
  - "Super AI" thực tế không phải là một bộ kit đóng hộp cơ bản duy nhất, mà là **chuỗi giải đấu robot & AI quốc tế thường niên** đi kèm các **gói công cụ mở rộng theo mùa giải** (Expansion Sets).
  - Trong cấu hình thi đấu chính thức của ZMROBO, các đội thi bắt buộc phải sử dụng **một bộ kit nền tảng** (Base Set) như *Defender WiseKit* (`set2106+`), *Innovation Storm* (`set2508`), *Beta Set* (`set2421`), hoặc *Intelligence Storm* (`set2108+`), sau đó ghép thêm **Gói mở rộng Super AI** (`JMC-NY-2681` hoặc `JMC-NY-2486`) cùng module Camera AI và RFID.
  - Trong tệp cơ sở dữ liệu `robobuilder-sets.json`, cả 9 bộ kit đều khớp chính xác 1-1 với 9 bộ kit học tập/cơ bản độc lập (`set2321A`, `set2322`, `set2323`, `set2324`, `set2421`, `set2508`, `set2521`, `set2106+`, `set2108+`). Không có bộ nào chứa mã linh kiện RFID (`BE-1548`) hay gói mở rộng 2681/2486.
- **Link nguồn:**
  - [2026 Super AI - Star Cruise (JMC-NY-2681)](https://www.zmrobo.net/products/352)
  - [2024 Super AI - Interstellar Crossing (JMC-NY-2486)](https://www.zmrobo.net/products/91)

---

## 3. Tổng kết quy luật mã hóa

1. **Quy luật 4 số cuối:** Mã bộ RoboBuilder luôn trùng khớp với 4 số chỉ phiên bản trong mã model thương mại của ZMROBO:
   - `set2321A` ↔ `JMC-NY-2321AE` (Alpha Set A)
   - `set2322` ↔ `JMC-NY-2322E` (Alpha Set B)
   - `set2323` ↔ `JMC-NY-2323E` (Alpha Set C)
   - `set2324` ↔ `JMC-NY-2324E` (Alpha Set D)
   - `set2421` ↔ `JMC-NY-2421` (Beta Set)
   - `set2508` ↔ `JMC-NY-2508E` (Innovation Storm)
   - `set2521` ↔ `JMC-NY-2521E` (Gamma Series)
   - `set2106+` ↔ `JMC-NY-2106+E` (Defender WiseKit)
   - `set2108+` ↔ `JMC-NY-2108+E` (Intelligence Storm)
2. **Quy luật phân loại linh kiện điện tử:**
   - Dòng `BE-51xx`: Các bộ điều khiển trung tâm (M5-RCU là BE-5158, C6-RCU là BE-5161, M6-RCU là BE-5147, E6-RCU là BE-5148, E7-RCU là BE-5166, All-in-one là BE-5168).
   - Dòng `BE-35xx`: Các loại động cơ (động cơ encoder vừa BE-3581, động cơ lớn encoder BE-3582, động cơ giảm tốc BE-3579, BE-3570, BE-3571).
   - Dòng `BE-11xx`, `BE-14xx`, `BE-22xx`, `BE-62xx`: Các cảm biến quang, màu sắc, siêu âm, hồng ngoại, góc nghiêng.
   - Dòng `BE-17xx`: Các module thị giác và camera AI (AI CAM BE-1756, AI Vision BE-1743).
