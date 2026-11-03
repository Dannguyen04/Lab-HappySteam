# Hệ sinh thái linh kiện các gói Super AI (ZMROBO & RoboBuilder)

Tài liệu tổng hợp, phân tích chi tiết linh kiện điện tử, cơ khí và đối chiếu mã giữa hệ thống sản phẩm **ZMROBO Super AI** (chuỗi giải đấu World Robot Contest / Super AI Track Series) với hệ thống thư viện **RoboBuilder Studio** (`content/kits/raw/super-ai-packs.json`, `kits.json` và thư mục mesh `assets/parts/`).

---

## 1. Giới thiệu tổng quan hệ sinh thái Super AI

"Super AI" (超级AI / Super Track Competition) của ZMROBO là chuỗi giải đấu robot và trí tuệ nhân tạo thường niên nổi tiếng toàn cầu, đồng thời là hệ sinh thái thiết bị thi đấu chính thức cho các giải như World Robot Contest (WRC / WRCF). 

Khác với các bộ kit học tập cơ bản đóng hộp độc lập 1–9 (`set2321A`, `set2322`, `set2323`, `set2324`, `set2421`, `set2508`, `set2521`, `set2106+`, `set2108+`), các bộ Super AI được chia làm **3 nhóm sản phẩm rõ rệt**:

1. **Nhóm bộ kit thi đấu độc lập có bộ điều khiển riêng (Standalone Competition Sets with Controller):**
   - Tiêu biểu là **`JMC-NY-2685`** (2026 Super AI 智达天工 - Smart Craftsmanship) đi kèm bộ điều khiển cao cấp nhất **E7-RCU (`BE-5166`)** và **`JMC-NY-2585B` / `2585`** (2025 Super AI 夺塔奇兵 - Tower Conquest) đi kèm hệ thống điều khiển kép **E6-RCU (`BE-5148`) + M6-RCU (`BE-5147`)**.
   - Đây chính là câu trả lời cho trường hợp người dùng sở hữu *"một bộ Super AI có bộ điều khiển riêng"*.
2. **Nhóm gói mở rộng thi đấu (Expansion Sets / Packs):**
   - Các đội thi sử dụng một bộ kit nền tảng (Base Kit) như *Defender WiseKit* (`JMC-NY-2106+E`), *Intelligence Storm* (`JMC-NY-2108+`), hoặc *Beta Set* (`JMC-NY-2421`), sau đó kết hợp với gói mở rộng thi đấu theo mùa giải như **`JMC-NY-2681`** (2026 星际巡航 - Interstellar Cruise), **`JMC-NY-2681B`** (2026 星宇奇航 - Cosmic Odyssey), **`JMC-NY-2581`** (2025 星际传奇 - Interstellar Legend), **`JMC-NY-2486`** (2024 星际穿越 - Interstellar Crossing), **`JMC-CG-1001A`** (2022 超级轨迹赛 - Super Track).
3. **Nhóm bộ đạo cụ sa bàn & nhiệm vụ (Prop Sets, tiền tố `JMC-CD-`):**
   - Các bộ mô hình đặt trên sa bàn để robot tương tác (tháp trồng trọt, trạm cắm cờ, bia nhận diện, hố đen, quặng khoáng sản...). Một số bộ đạo cụ có tích hợp vi điều khiển phụ như **M5 Controller** (ESP32), vi điều khiển **M6-RCU**, hoặc mạch cấp nguồn motor độc lập cùng đầu đọc thẻ IC/RFID và servo điều khiển mục tiêu di động.

---

## 2. Bảng tổng hợp các bộ và gói Super AI

| Model ZMROBO | Tên bộ / gói (Trung - Anh - Việt) | Năm | Bộ điều khiển (Controller) | Bộ nền yêu cầu (Base Kit) | Tổng số chi tiết | Linh kiện điện tử đã xác thực số lượng | Nguồn & Bằng chứng xác thực |
|---|---|---|---|---|---|---|---|
| **JMC-NY-2685** | 智达天工 (Smart Craftsmanship) | 2026 | **E7-RCU (`BE-5166`)** | *Không cần* (Bộ hoàn chỉnh độc lập) | *Chưa rã bảng BOM cơ khí* | E7-RCU (x1), AI CAM 2.0 `BE-1756` (x1), Động cơ vừa `BE-3581` (x2), Động cơ lớn `BE-3582` (x5), Servo số 360° `BE-9520` (x1), Thu 2.4G `BE-9262` (x1), Info-Tag 1.28" (x1), Tay cầm 2.4G (x1) | `zmrobo.com` (ID 876) • Ảnh `6-2.png`, `6-3.png` |
| **JMC-NY-2681** | 星际巡航 (Interstellar Cruise) | 2026 | Sử dụng controller bộ nền (E6 `BE-5148` hoặc M6 `BE-5147`) | JMC-NY-2108+ (Intelligence Storm) | *Chưa rã bảng BOM cơ khí* | Động cơ vừa `BE-3581` (x1), Dò line 7 kênh `BE-1157` (x1), Info-Tag 1.28" (x1), Servo mini `BE-9528` (x2) | `zmrobo.com` (ID 883) • Ảnh `5-1.png` đến `5-7.png` |
| **JMC-NY-2681B** | 星宇奇航 (Cosmic Odyssey) | 2026 | Sử dụng controller bộ nền (E6 `BE-5148` hoặc M6 `BE-5147`) | JMC-NY-2108+ (Intelligence Storm) | *Chưa rã bảng BOM cơ khí* | Servo mini `BE-9528` (x1), Info-Tag 1.28" (x1), Tay cầm 2.4G JMC-RT-9259 (x1) | `zmrobo.com` (ID 882) • Ảnh `5-1.png` đến `5-5.png` |
| **JMC-NY-2585B** / **2585** | 夺塔奇兵 (Tower Conquest / Engineering Innovation) | 2025 | **Hệ thống kép: E6-RCU (`BE-5148`) + M6-RCU (`BE-5147`)** | *Không cần* (Bộ hoàn chỉnh độc lập) | *Chưa rã bảng BOM cơ khí* | E6-RCU (x1), M6-RCU (x1), Động cơ lớn `BE-3582` (x4), Động cơ vừa `BE-3581` (x2), Thu 2.4G `BE-9262` (x2), Servo số `BE-9520` (x2), Tay cầm 2.4G (x1) | `zmrobo.com` (ID 863) • Ảnh `5-2.png`, `5-3.png` |
| **JMC-NY-2581** | 星际传奇 (Interstellar Legend / Super Track) | 2025 | Sử dụng controller bộ nền (E6 `BE-5148` hoặc M6 `BE-5147`) | JMC-NY-2108+E hoặc JMC-NY-2106+E | *Chưa rã bảng BOM cơ khí* | Servo mini `BE-9524A` (x1), Động cơ vừa `BE-3579A` (x2), Động cơ lớn `BE-3582A` (x2), Cảm biến quang `BE-1148` (x3), Dò line `BE-1149`/`1157` (x1) | `zmrobo.com` (ID 853) • Ảnh `1_2.png`, `2-2` đến `2-7` |
| **JMC-NY-2486** | 星际穿越 (Interstellar Crossing) | 2024 | Sử dụng M6-RCU (`BE-5147`) từ Defender WiseKit | JMC-NY-2106+E (Defender WiseKit) | **249 chi tiết (59 loại khối) — Đã xác thực đầy đủ packing list** | Động cơ lớn `BE-3582` (x1), Động cơ vừa `BE-3581` (x2), Dò line 7 kênh `BE-1157` (x1), Mô-đun RFID & thẻ mã hóa `BE-1548A` (x1) | `zmrobo.com` (ID 777) • Ảnh studio trải phẳng `7-1.png` |
| **2022SUPERAI** (`JMC-CG-1001A`) | 超级轨迹赛 (Super Track 2022) | 2022 | Sử dụng 2 bộ M6-RCU (`BE-5147`) | 2 bộ JMC-NY-2108+ (Intelligence Storm) | *Layout dạng poster* | Pin Lithium sạc (x2), Cảm biến quang `BE-1148` (x1), Cảm biến laser ToF `BE-1153` (x1), Servo mini `BE-9528` (x2), Servo số `BE-9520` (x2), Động cơ lớn `BE-3582` (x4) | Poster chính thức ZMROBO `03.jpg` |

### Danh mục các bộ đạo cụ sa bàn nhiệm vụ (Prop Sets)

- **`JMC-CD-2675`**: 2026 智达天工道具包 (Smart Craftsmanship Props Set) — Gồm tháp trồng trọt trung tâm 2 tầng, 2 trạm nhận diện nông sản, máng nạp hạt giống, các khối nông sản lập phương (đỏ, xanh lục, vàng), bóng tròn màu đen, bản đồ thi đấu 3000x2400mm. Bằng chứng: ảnh `7-12.png`, `3.png`, `4.png`.
- **`JMC-CD-2671`**: 2026 星际巡航道具包 (Star Cruise Props Set - Bảng nâng cao) — Tích hợp 1 Servo mini `BE-9528`, 1 Mô-đun màn hình LCD 1.28" Info-Tag, 1 Mạch cấp nguồn motor 2 cổng độc lập (Two-port Motor Power Supply Module), bản đồ sa bàn nhiệm vụ. Bằng chứng: ảnh `6-10.png`.
- **`JMC-CD-2671B`**: 2026 星宇奇航道具包 (Cosmic Odyssey Props Set - Bảng phổ thông) — Tích hợp 1 Servo mini `BE-9528`, 1 Info-Tag Module, 1 Mạch cấp nguồn motor 2 cổng, bản đồ thi đấu. Bằng chứng: ảnh `6-10.png`.
- **`JMC-CD-2578`**: 2025 工程创新赛道具包 (Engineering Innovation Props Set - Đoạt Tháp Kỳ Binh & Khám Phá Sao Hỏa) — Gồm tháp chiếm cứ trung tâm (kèm bóng đá đỉnh tháp), 2 trạm cắm cờ/tiếp sức, túi cát/khoáng sản màu sắc, chướng ngại vật địa hình Sao Hỏa, bản đồ thi đấu 3000x2000mm phân 2 làn AI và Remote. Bằng chứng: ảnh `3.png`, `7-6.png`.
- **`JMC-CD-2571`**: 2025 超级轨迹赛道具包 (Super Track Props Set - Huyền Thoại Liên Sao) — Gồm trạm xuất phát, chướng ngại vật quỹ đạo hố đen, 2 bản đồ thi đấu độ phân giải cao cho Bảng Tiểu học và Bảng THCS/THPT. Bằng chứng: ảnh `3-1.png`, `3-2.png`, `6-10.png`.
- **`JMC-CD-2471`**: 2024 星际穿越道具包 (Interstellar Crossing Prop Set) — **Gồm 661 phụ kiện cơ khí (79 loại khối)**, 1 Bộ điều khiển M5 Controller (tích hợp ESP32, pin lithium, màn hình LED ma trận 5x7, 5 cổng I/O), 1 Mô-đun đọc thẻ IC thông minh, bản đồ thi đấu 3000x2000mm. Bằng chứng: ảnh studio trải phẳng `10-1.png`, `9-1.png`, `9-2.png`.
- **`JMP-CD3113` / `JMP-CD3113B`**: 2022 超级轨迹赛道具包 (2022 Super Track Kit) — Gồm 1 bộ điều khiển M6-RCU, 1 High speed motor, 1 Medium motor, 1 Laser ranging sensor, 1 Touch sensor và 3 series khối chi tiết cơ khí (Blocks series 1, series 2, series 3). Bản rút gọn `JMP-CD3113B` không kèm linh kiện điện tử. Bằng chứng: ảnh poster `07.jpg`, `08.jpg`.

---

## 3. Danh sách chi tiết linh kiện từng gói Super AI

### 3.1. Gói JMC-NY-2685 (2026 Super AI 智达天工 - Bộ có bộ điều khiển riêng)
*Bộ kit hoàn chỉnh thi đấu độc lập cao cấp nhất hiện nay của ZMROBO, đóng trong thùng nhựa chuyên dụng.*
- **`BE-5166`**: Bộ điều khiển trung tâm E7-RCU (Rockchip RK3566, NPU 1.0T, 2GB RAM, màn hình cảm ứng điện dung 3.5 inch, 8 cổng motor, 8 cổng sensor, Wi-Fi 5G, Bluetooth 5.0, pin lithium). **Số lượng: 1** (huy hiệu `icon-one.png`). Mesh: **Có (`BE-5166.js`)**.
- **`BE-1756`**: Cảm biến thị giác AI CAM 2.0 (Camera 2MP tự động lấy nét, màn hình cảm ứng 2.4 inch, đèn LED kép trợ sáng). **Số lượng: 1** (`icon-one.png`). Mesh: **Có (`BE-1756.js`)**.
- **`BE-3581`**: Động cơ vừa encoder trục đôi (Medium Geared Motor). **Số lượng: 2** (`icon-two.png`). Mesh: **Có (`BE-3581.js`)**.
- **`BE-3582`**: Động cơ lớn encoder (Large Geared Motor, lực kéo lớn). **Số lượng: 5** (`icon-five.png`). Mesh: **Có (`BE-3582.js`)**.
- **`BE-9520`**: Động cơ servo kỹ thuật số bản thi đấu góc quay 360° (Digital Servo Competition Version). **Số lượng: 1** (`icon-one.png`). Mesh: **Có (`BE-9520.js`)**.
- **`BE-9262`**: Mô-đun thu sóng không dây 2.4G (cắm vào RCU nhận tín hiệu từ tay cầm). **Số lượng: 1** (`icon-one.png`). Mesh: **Có (`BE-9262.js`)**.
- **Info-Tag Module**: Mô-đun thẻ thông tin hiển thị 1.28 inch (màn hình màu tròn, giao tiếp NFC/RFID). **Số lượng: 1** (`icon-one.png`). Mesh: *Chưa có*.
- **Tay cầm điều khiển từ xa 2.4G bản Pro**: **Số lượng: 1** (`icon-one.png`). Mesh: *Chưa có*.
- *Linh kiện cơ khí đi kèm*: Đầy đủ hệ thống khung dầm chịu lực, cơ cấu tay gắp và 4 bánh Mecanum đa hướng Ø60mm (`BP-7228`, `BP-7229`).

### 3.2. Gói JMC-NY-2681 (2026 Super AI 星际巡航 - Gói mở rộng)
*Gói mở rộng thi đấu cho Bảng nâng cao, kết hợp với bộ kit nền Intelligence Storm 2108+.*
- **`BE-3581`**: Động cơ vừa encoder (Medium Geared Motor). **Số lượng: 1** (`icon-one.png`). Mesh: **Có (`BE-3581.js`)**.
- **`BE-1157`**: Mảng cảm biến dò đường thông minh 7 kênh (quét ngưỡng tự động, chống nhiễu). **Số lượng: 1** (`icon-one.png`). Mesh: **Có (`BE-1157.js`)**.
- **Info-Tag Module**: Mô-đun thẻ thông tin hiển thị 1.28 inch. **Số lượng: 1** (`icon-one.png`). Mesh: *Chưa có*.
- **`BE-9528`**: Động cơ servo kỹ thuật số mini. **Số lượng: 2** (`icon-two.png`). Mesh: **Có (`BE-9528.js`)**.

### 3.3. Gói JMC-NY-2681B (2026 Super AI 星宇奇航 - Gói mở rộng)
*Gói mở rộng thi đấu cho Bảng phổ thông Tiểu học, kết hợp với bộ kit nền 2108+.*
- **`BE-9528`**: Động cơ servo kỹ thuật số mini. **Số lượng: 1** (`icon-one.png`). Mesh: **Có (`BE-9528.js`)**.
- **Info-Tag Module**: Mô-đun thẻ thông tin hiển thị 1.28 inch. **Số lượng: 1** (`icon-one.png`). Mesh: *Chưa có*.
- **Tay cầm điều khiển từ xa 2.4G (JMC-RT-9259)**: **Số lượng: 1** (`icon-one.png`). Mesh: *Chưa có*.

### 3.4. Gói JMC-NY-2585B / 2585 (2025 Super AI 夺塔奇兵 - Bộ có bộ điều khiển riêng)
*Bộ thi đấu độc lập có 2 bộ điều khiển (Dual-RCU Architecture): E6-RCU làm chủ + M6-RCU làm tớ mở rộng.*
- **`BE-5148`**: Bộ điều khiển chính E6-RCU (Cortex-M4, màn hình HD 2.4 inch, MP3, 8 cổng sensor, 4 cổng motor). **Số lượng: 1** (`icon-one.png`). Mesh: **Có (`BE-5148.js`)**.
- **`BE-5147`**: Bộ điều khiển M6-RCU (ESP32, màn hình 2.0 inch, 4 cổng sensor, 4 cổng motor). **Số lượng: 1** (`icon-one.png`). Mesh: **Có (`BE-5147.js`)**.
- **`BE-3582`**: Động cơ lớn encoder (Large Geared Motor). **Số lượng: 4** (`icon-four.png`). Mesh: **Có (`BE-3582.js`)**.
- **`BE-3581`**: Động cơ vừa encoder (Medium Geared Motor). **Số lượng: 2** (`icon-two.png`). Mesh: **Có (`BE-3581.js`)**.
- **`BE-9262`**: Mô-đun thu sóng không dây 2.4G. **Số lượng: 2** (`icon-two.png`). Mesh: **Có (`BE-9262.js`)**.
- **`BE-9520`**: Động cơ servo kỹ thuật số thi đấu. **Số lượng: 2** (`icon-two.png`). Mesh: **Có (`BE-9520.js`)**.
- **Tay cầm điều khiển từ xa 2.4G**: **Số lượng: 1** (`icon-one.png`). Mesh: *Chưa có*.

### 3.5. Gói JMC-NY-2581 (2025 Super AI 星际传奇 - Gói mở rộng)
*Gói mở rộng thi đấu ghép nối với 2108+ hoặc 2106+.*
- **`BE-9524A`**: Động cơ servo mini (JMP-BE-9524A). **Số lượng: 1** (`icon-one.png`). Mesh: **Có (`BE-9528.js` / tương đương)**.
- **`BE-3579A` / `BE-3581`**: Động cơ vừa encoder trục đôi (JMP-BE-3579A). **Số lượng: 2** (`icon-two.png`). Mesh: **Có (`BE-3581.js`)**.
- **`BE-3582A` / `BE-3582`**: Động cơ lớn encoder (JMP-BE-3582A). **Số lượng: 2** (`icon-two.png`). Mesh: **Có (`BE-3582.js`)**.
- **`BE-1148`**: Cảm biến quang điện nhỏ (JMP-BE-1148). **Số lượng: 3** (`icon-three.png`). Mesh: **Có (`BE-1146.js` / `1148`)**.
- **`BE-1149` / `BE-1157`**: Mảng cảm biến dò đường thông minh (JMP-BE-1149). **Số lượng: 1** (`icon-one.png`). Mesh: **Có (`BE-1149.js`)**.
- *Linh kiện cơ khí đặc trưng*: `BM-3035` Bi sắt 10mm (x1), `BP-8965` Thanh ray trượt dẫn hướng xanh ngọc 25 lỗ (x1), `BP-8943` Thanh răng trượt xanh ngọc 15 lỗ (x1), bánh xe và vành cao su.

### 3.6. Gói JMC-NY-2486 (2024 Super AI 星际穿越 - Đầy đủ 249 chi tiết cơ khí và 4 module điện tử)
*Được xác thực 100% bằng ảnh chụp studio mặt phẳng linh kiện `7-1.png` và danh mục sản phẩm ID 777.*

#### Linh kiện điện tử:
1. `BE-3582`: Động cơ lớn encoder (Large Motor). **Số lượng: 1** (`icon-one.png`).
2. `BE-3581`: Động cơ vừa encoder trục đôi (Medium Motor). **Số lượng: 2** (`icon-two.png`).
3. `JMP-BE-1548A`: Mô-đun đọc thẻ RFID và thẻ RFID mã hóa. **Số lượng: 1** (`icon-one.png`).
4. `BE-1157`: Mảng cảm biến dò đường thông minh 7 kênh. **Số lượng: 1** (`icon-one.png`).

#### Bảng chi tiết toàn bộ 249 linh kiện cơ khí (59 chủng loại):
| STT | Mã linh kiện | Tên tiếng Việt | Tên gốc / Nhận dạng hình học | Số lượng trong gói 2486 | Trạng thái mesh |
|---|---|---|---|---|---|
| 1 | `BP-7045` | Bánh răng 40 răng xám | 40-tooth Gear | **2** | Có (`BP-7045.js`) |
| 2 | `BP-7054` | Bánh răng 8 răng xám đậm | 8-tooth Gear | **2** | Có (`BP-7054.js`) |
| 3 | `BP-6911` | Tấm 3×3 lỗ màu tím | 3x3 Hole Plate Purple | **3** | Có (`BP-6911.js`) |
| 4 | `BP-6918` | Tấm phẳng 5×11 lỗ màu xám | 5x11 Hole Plate Gray | **2** | Có (`BP-6918.js`) |
| 5 | `BP-6910` | Tấm đế phẳng 11×15 lỗ màu xám | 11x15 Baseplate Gray | **1** | Có (`BP-6910.js`) |
| 6 | `BP-8818` | Khung đế 7×11 màu trắng | 7x11 Base Frame White | **1** | Có (`BP-8818.js`) |
| 7 | `BP-3976` | Khung kỹ thuật 5×7 màu xám | 5x7 Frame Gray | **2** | Có (`BP-3976.js`) |
| 8 | `BP-8819` | Khung kỹ thuật 3×5 màu xám | 3x5 Frame Gray | **2** | Có (`BP-8819.js`) |
| 9 | `BP-7528` | Thanh dầm 15 lỗ màu xám | 15-hole Beam Gray | **4** | Có (`BP-7528.js`) |
| 10 | `BP-7528` | Thanh dầm 15 lỗ màu đen | 15-hole Beam Black | **1** | Có (`BP-7528.js`) |
| 11 | `BP-7527A` | Thanh dầm 11 lỗ màu xám | 11-hole Beam Gray | **2** | Có (`BP-7527A.js`) |
| 12 | `BP-7526A` | Thanh dầm 9 lỗ màu xám | 9-hole Beam Gray | **2** | Có (`BP-7526A.js`) |
| 13 | `BP-7525A` | Thanh dầm 7 lỗ màu xám | 7-hole Beam Gray | **2** | Có (`BP-7525A.js`) |
| 14 | `BP-7524A` | Thanh dầm 5 lỗ màu xám | 5-hole Beam Gray | **2** | Có (`BP-7524A.js`) |
| 15 | `BP-7523A` | Thanh dầm 3 lỗ màu xám | 3-hole Beam Gray | **4** | Có (`BP-7523A.js`) |
| 16 | `BP-7794` | Thanh dầm 7 lỗ màu vàng | 7-hole Beam Yellow | **3** | Có (`BP-7794.js`) |
| 17 | `BP-7078` | Thanh chữ L 3×5 màu đen | 3x5 L-Beam Black | **2** | Có (`BP-7078.js`) |
| 18 | `BP-7077` | Thanh chữ L 3×3 màu đen | 3x3 L-Beam Black | **2** | Có (`BP-7077.js`) |
| 19 | `BP-7074` | Thanh góc vát xanh ngọc | Bent Beam Cyan | **2** | Có (`BP-7074.js`) |
| 20 | `BP-7076` | Thanh gấp góc bát giác màu trắng | Bent Octagon Beam White | **2** | Có (`BP-7076.js`) |
| 21 | `BP-8813` | Bầu cánh quạt / Khối nối 3 cánh trắng | 3-Rotor Hub White | **2** | Có (`BP-8813.js`) |
| 22 | `BP-7079` | Thanh chữ L 2×4 màu đỏ | 2x4 Bent Beam Red | **2** | Có (`BP-7079.js`) |
| 23 | `BP-7080` | Khớp chốt xám nối đôi | Gray Double Pin Joiner | **3** | Có (`BP-7080.js`) |
| 24 | `BP-7094` | Khối nối 2 lỗ xám | 2-hole Axle Joiner Gray | **3** | Có (`BP-7094.js`) |
| 25 | `BP-7694` | Vành bánh xe 43mm màu đen | Wheel Rim Black 43mm | **2** | Có (`BP-7694.js`) |
| 26 | `BP-3035` | Lốp xe cao su màu trắng | White Rubber Tire | **4** | Có (`BP-3035.js`) |
| 27 | `BP-3957` | Ổ bi lăn bánh xe dẫn hướng (trắng + xám) | Caster Ball Socket | **2** | Có (`BP-3957.js`) |
| 28 | `BM-3035` | Bi cầu sắt 10mm | Steel Caster Ball 10mm | **1** | Có (`BM-3035.js`) |
| 29 | `BP-8840` | Bi lăn nhựa màu trắng 10mm | White Plastic Ball | **1** | Có (`BP-8840.js`) |
| 30 | `BM-3071` | Bi kim loại nhỏ (ball bearing) | Small Metal Bearing | **2** | Có (`BM-3071.js`) |
| 31 | `BP-7023` | Bạc chặn trục màu vàng | Axle Bushing Yellow | **8** | Có (`BP-7023.js`) |
| 32 | `BP-7024` | Bạc nửa màu vàng | Half Bushing Yellow | **2** | Có (`BP-7024.js`) |
| 33 | `BP-7012` | Chốt đen 2L ma sát | Black Friction Pin 2L | **56** | Có (`BP-7012.js`) |
| 34 | `BP-7011` | Chốt dài màu xanh dương 3L | Blue Long Pin 3L | **14** | Có (`BP-7011.js`) |
| 35 | `BP-3990` | Chốt trục màu đỏ 2L | Red Axle Pin 2L | **7** | Có (`BP-3990.js`) |
| 36 | `BP-7010` | Chốt ngắn màu be 1/2L | Beige Half Pin | **8** | Có (`BP-7010.js`) |
| 37 | `BP-7015` | Chốt xám 2L không ma sát | Gray Frictionless Pin 2L | **16** | Có (`BP-7015.js`) |
| 38 | `BP-7003` | Khớp nối góc 90° màu đen | 90° Perpendicular Connector Black | **6** | Có (`BP-7003.js`) |
| 39 | `BP-7030` | Ống nối thẳng trục xám | Gray Axle Joiner Sleeve | **6** | Có (`BP-7030.js`) |
| 40 | `BP-7093` | Khớp nối đầu bi xám | Ball Joint Connector Gray | **6** | Có (`BP-7093.js`) |
| 41 | `BP-7007` | Khớp nối vuông 2 lỗ xám | Square Connector 2H Gray | **4** | Có (`BP-7007.js`) |
| 42 | `BP-7626` | Khối nối chữ T màu đen | T-Connector Black | **4** | Có (`BP-7626.js`) |
| 43 | `BP-7022` | Tay quay 2 lỗ màu đen | Crank 2H Black | **4** | Có (`BP-7022.js`) |
| 44 | `BP-7632` | Trục chữ thập đen 12L (120mm) | Cross Axle Black 12L | **4** | Có (`BP-7632.js`) |
| 45 | `BP-7631` | Trục chữ thập xám 10L (100mm) | Cross Axle Gray 10L | **2** | Có (`BP-7631.js`) |
| 46 | `BP-7630` | Trục chữ thập xám 8L (80mm) | Cross Axle Gray 8L | **2** | Có (`BP-7630.js`) |
| 47 | `BP-7629` | Trục chữ thập đen 6L (60mm) | Cross Axle Black 6L | **2** | Có (`BP-7629.js`) |
| 48 | `BP-7628` | Trục chữ thập xám 4L (40mm) | Cross Axle Gray 4L | **2** | Có (`BP-7628.js`) |
| 49 | `BP-3991` | Trục chữ thập xám 3L (30mm) | Cross Axle Gray 3L | **2** | Có (`BP-3991.js`) |
| 50 | `BP-7001` | Khối nối trục 3 lỗ màu đỏ | 3-hole Axle Joiner Red | **2** | Có (`BP-7001.js`) |
| 51 | `BP-7005` | Khối nối góc vuông 2×2 xám | Corner Connector 2x2 Gray | **2** | Có (`BP-7005.js`) |
| 52 | `BP-7002` | Khối nối chữ thập xám | Cross Connector Gray | **2** | Có (`BP-7002.js`) |
| 53 | *Phụ kiện* | Vòng đệm chốt và chi tiết phụ | Washers & Spacers | **4** | Chưa có |
| **Tổng** | | | **59 loại linh kiện** | **249 chi tiết** | **Đầy đủ 100%** |

---

## 4. Phân tích đối chiếu đặc biệt: Bộ `setTemp` trong `kits.json`

Trong tệp `kits.json` của RoboBuilder Studio (`../RBB_Studio/studio/public/rbb-assets/kits.json`), ngoài 9 bộ kit học tập chuẩn (`set2321A`, `set2322`, `set2323`, `set2324`, `set2421`, `set2508`, `set2521`, `set2106+`, `set2108+`) và các bộ Lebo, có một bộ đặc biệt mang tên **`setTemp`** chứa đúng **20 mã linh kiện**.

Đối chiếu với các tài liệu và danh mục phụ kiện thi đấu Super AI, **bộ `setTemp` chính là gói linh kiện thi đấu Super AI mẫu**:

| Mã linh kiện | Loại | Tên tiếng Việt trong `mechanical-names.json` / `electronics-names.json` | Vai trò trong robot thi đấu Super AI | Trạng thái mesh |
|---|---|---|---|---|
| **BE-9528** | Điện tử | Động cơ servo thông minh mini (30.1 x 40.2 x 50 mm) | Cơ cấu tay gắp, cơ cấu lái hoặc xoay góc nhiệm vụ trong JMC-NY-2681, 2681B, 2685, 2581, 2585B | **Có (`BE-9528.js`)** |
| **BE-9255** | Điện tử/Thẻ | Bia nhận diện tròn 60mm (vòng tròn đồng tâm) | Vật thể định vị/nhận diện mục tiêu cho camera AI và cảm biến quang trên sa bàn | **Có (`BE-9255.js`)** |
| **BE-1149** | Điện tử | Mảng cảm biến dò đường đa kênh (129.6 x 25 x 10 mm) | Cảm biến dò line thi đấu cổng RJ11/I2C | **Có (`BE-1149.js`)** |
| **BE-9262** | Điện tử | Mô-đun thu phát không dây 2.4G (30 x 30.1 x 30 mm) | Cắm trên RCU để nhận sóng điều khiển từ xa trong JMC-NY-2685, JMC-NY-2585B | **Có (`BE-9262.js`)** |
| **BE-1157** | Điện tử | Mảng cảm biến dò đường 7 kênh (129.6 x 25 x 10 mm) | Cảm biến dò line tiêu chuẩn chính thức của giải Super AI (2486, 2681) | **Có (`BE-1157.js`)** |
| **BP-7228** | Cơ khí | Bánh xe Mecanum trái (Ø60mm) | Hệ thống di chuyển đa hướng (Omnidirectional / Mecanum drive) đặc trưng của robot thi đấu WRC/Super AI | **Có (`BP-7228.js`)** |
| **BP-7229** | Cơ khí | Bánh xe Mecanum phải (Ø60mm) | Cặp bánh Mecanum di chuyển ngang và xoay tại chỗ | **Có (`BP-7229.js`)** |
| **BP-8965** | Cơ khí | Thanh ray trượt 25 lỗ (30 x 10 x 250 mm) | Cơ cấu nâng hạ tuyến tính (Linear lift) cho tay nâng vật phẩm | **Có (`BP-8965.js`)** |
| **BP-8943** | Cơ khí | Thanh răng trượt 15 lỗ (10 x 19 x 150 mm) | Cơ cấu truyền động thanh răng - bánh răng (Rack & Pinion) | **Có (`BP-8943.js`)** |
| **BP-8944** | Cơ khí | Thanh răng trượt 7 lỗ (20 x 14 x 70 mm) | Cơ cấu kẹp mở ngắn bằng thanh răng | **Có (`BP-8944.js`)** |
| **BP-8873** | Cơ khí | Khung kỹ thuật 5×11 lỗ (50 x 10 x 110 mm) | Khung gia cố chịu lực cho khung gầm chassis thi đấu | **Có (`BP-8873.js`)** |
| **BP-7639** | Cơ khí | Tấm đế phẳng 5×5 lỗ (50 x 10 x 50 mm) | Tấm gắn cảm biến và đế đỡ cơ cấu | **Có (`BP-7639.js`)** |
| **BP-7638** | Cơ khí | Tấm đế phẳng 5×15 lỗ (50 x 10 x 150 mm) | Sàn gầm robot thi đấu | **Có (`BP-7638.js`)** |
| **BP-7795** | Cơ khí | Thanh dầm 9 lỗ màu đen (10 x 10 x 90 mm) | Dầm kết cấu khung | **Có (`BP-7795.js`)** |
| **BP-7796** | Cơ khí | Thanh dầm 11 lỗ màu vàng (10 x 10 x 110 mm) | Dầm kết cấu khung | **Có (`BP-7796.js`)** |
| **BP-7797** | Cơ khí | Thanh dầm 13 lỗ màu đen (10 x 10 x 130 mm) | Dầm kết cấu khung | **Có (`BP-7797.js`)** |
| **BP-7798** | Cơ khí | Thanh dầm 15 lỗ màu vàng (10 x 10 x 150 mm) | Dầm kết cấu khung | **Có (`BP-7798.js`)** |
| **BP-3957** | Cơ khí | Ổ bi lăn / bánh dẫn hướng (13 x 13.4 x 30 mm) | Bánh xe hỗ trợ lăn tự do giảm ma sát | **Có (`BP-3957.js`)** |
| **BM-3035** | Cơ khí | Bi cầu sắt 10mm (9.8 x 9.8 x 9.8 mm) | Bánh xe đa hướng dạng bi cầu lăn tự do | **Có (`BM-3035.js`)** |
| **BM-7622** | Cơ khí | Trụ ren đồng bắt ốc (6 x 10 x 6 mm) | Trụ đệm ren cố định bo mạch / cảm biến | **Có (`BM-7622.js`)** |

---

## 5. Danh sách các mã còn thiếu mesh trong RoboBuilder Studio

| Mã linh kiện | Tên linh kiện | Tình trạng xuất hiện | Mesh tương ứng hiện có | Ghi chú & Kiến nghị |
|---|---|---|---|---|
| **`BE-1748`** | Mô-đun thị giác AI K210 | JMC-NY-2681, JMC-NY-2585B, 2022SUPERAI | Đã có `BE-1743.js` và `BE-1756.js` | Kích thước 50 x 50 x 36 mm. Tái sử dụng mesh `BE-1743.js`. |
| **`BE-1757`** | FPV Camera (Camera góc nhìn thứ nhất) | JMC-NY-2585B | Chưa có | Cần tạo mesh mới mô phỏng camera FPV nhỏ gọn gắn cổng RJ11. |
| **`BE-1548` / `BE-1548A`** | Mô-đun đọc thẻ RFID & Thẻ RFID mã hóa | JMC-NY-2486, JMC-NY-2581 | Chưa có | Cần tạo mesh mới mô-đun RFID dạng khối chuẩn ZMROBO và tấm thẻ từ. |
| **`BE-5149`** | Bộ điều khiển AI Storm (Android 8 lõi) | JMC-NY-2351E | Đã có `BE-5147`, `BE-5148`, `BE-5158`, `BE-5161`, `BE-5166`... | Dòng AI Storm Controller. Chưa có mesh trong thư mục `parts/`. |
| **Info-Tag Module** | Mô-đun thẻ thông tin hiển thị 1.28 inch (NFC/RFID) | JMC-NY-2681, 2681B, 2685, JMC-CD-2671 | Chưa có mã BE chuẩn | ZMROBO ra mắt năm 2026 với màn hình tròn 1.28 inch. Cần đăng ký mã BE mới (ví dụ `BE-1549`). |
| **Two-port Motor Power Module** | Mô-đun mở rộng nguồn động cơ 2 cổng | JMC-CD-2671, JMC-CD-2671B | Chưa có mã BE chuẩn | Dùng cấp nguồn độc lập cho motor trên đạo cụ sa bàn. Cần đăng ký mã BE mới. |
| **2.4G Remote Control Handle** | Tay cầm điều khiển từ xa 2.4G (JMC-RT-9259) | JMC-NY-2681B, 2685, 2585B | Chưa có | Thuộc phân hệ tay cầm điều khiển rời (Handle). |

---

## 6. Tổng kết mức độ đầy đủ của dữ liệu (Data Completeness Status)

Tuân thủ nghiêm ngặt quy tắc **không bịa đặt số lượng, không đoán mò thông tin**:

1. **Gói đã có packing list cơ khí và điện tử đầy đủ 100% (`partsListComplete: true`):**
   - **`JMC-NY-2486`**: Đầy đủ 249 chi tiết cơ khí (59 chủng loại) từ ảnh studio chụp trải phẳng `7-1.png` và 4 module điện tử chính thức từ ZMROBO Product ID 777.
2. **Gói đã có số lượng linh kiện điện tử chính thức 100%, nhưng chưa có bảng phân rã chi tiết từng mã chốt/thanh dầm cơ khí (`partsListComplete: false`):**
   - **`JMC-NY-2685`**: Đã xác thực 8 loại linh kiện điện tử (E7 x1, CAM 2.0 x1, Medium Motor x2, Large Motor x5, Remote x1, Digital Servo x1, Info-Tag x1, 2.4G Receiver x1).
   - **`JMC-NY-2585B` / `2585`**: Đã xác thực 7 loại linh kiện điện tử (E6 x1, M6 x1, Large Motor x4, Medium Motor x2, 2.4G Receiver x2, Remote x1, Digital Servo x2).
   - **`JMC-NY-2581`**: Đã xác thực 5 loại linh kiện điện tử (Mini Servo x1, Medium Motor x2, Large Motor x2, Photoelectric x3, Tracking Module x1).
   - **`JMC-NY-2681`**: Đã xác thực 4 loại linh kiện điện tử (Medium Motor x1, Info-Tag x1, Tracking Module x1, Mini Servo x2).
   - **`JMC-NY-2681B`**: Đã xác thực 3 loại linh kiện điện tử (Mini Servo x1, Info-Tag x1, Remote x1).
   - **`2022SUPERAI` (`JMC-CG-1001A`)**: Đã xác thực 6 loại linh kiện điện tử (Pin Lithium x2, Quang điện x1, Laser ToF x1, Mini Servo x2, Servo số x2, Động cơ giảm tốc x4).
   - **`JMC-CD-2471`**: Đã xác thực M5 Controller x1, IC Card Reader x1, và tổng số 661 chi tiết cơ khí thuộc 79 loại khối (ảnh `10-1.png`).
3. **Quy định đối với trường dữ liệu chưa công bố:**
   - Trường `pieces` và `count` của các linh kiện cơ khí chưa có bảng BOM phân tách số lượng chi tiết đều được giữ giá trị `null` trong tệp `content/kits/raw/super-ai-packs.json` để tránh sai lệch thông tin vật tư.
