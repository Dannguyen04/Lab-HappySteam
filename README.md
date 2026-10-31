# PHÒNG LAB ZMROBO ẢO · HAPPY STEAM

Ứng dụng học tập cho học sinh tiểu học (bộ ZMrobo Alpha 330): lắp mô hình 3D theo sách hướng dẫn, sáng tạo, lập trình bằng khối và mô phỏng. Giao diện tiếng Việt, chạy **trực tiếp từ tệp `index.html`**, không cần máy chủ, npm hay tài khoản.

**Trang chọn bài (`index.html`):** chọn **Lớp 1–5 → Học kì I/II → bài học**. Danh mục bài nằm ở `js/catalog.js` (Lớp 1 đủ 35 tuần theo khung chương trình; Lớp 2–5 theo thư mục tài liệu hiện có). Bài đã làm xong mở được, các bài khác hiện mờ "Sắp có". Có thể gửi thẳng link một lớp/học kì: `index.html?lop=1&hk=2`. Hiện đã có **Lớp 1 · Bài 3 – Robot thám hiểm Milo** (`lop1-bai03.html`), **Bài 9 – Thông tin liên lạc vũ trụ** (`lop1-bai09.html`) và **Bài 10 – Bạn gió tinh nghịch (cối xoay gió)** (`lop1-bai10.html`); phần dưới đây mô tả Bài 9, Bài 3 và Bài 10 tóm tắt ngay sau.

**Thêm một bài mới (khung dùng chung):**
1. Giải nén `model2.ldr` từ file `.io` của bài, viết `scripts/baiXX-plan.js` (linh kiện từng bước theo sách), `scripts/baiXX-parts.js` (mã ZMROBO – dò bằng `RBB_Studio/io2rbb match`) và `scripts/generate-baiXX.js` (gọi `scripts/lib/cad-lesson.js`) → `js/data-bai-XX.js`.
2. Viết `js/baiXX/lesson.js` (`window.LESSON`: nhiệm vụ, thẻ nhiệm vụ, khối lệnh và chương trình mẫu, hình sách, gói sáng tạo) và bộ mô phỏng + cảnh của bài (`js/baiXX/*`) có cùng giao diện với `SimulationEngine`/`ZMScene`.
3. Tạo `lopX-baiYY.html` từ trang bài có sẵn, ảnh sách vào `assets/baiXX/`, rồi điền `href`/`cover` trong `js/catalog.js`. Kiểu bài trong danh mục: `model`, `project`, `theory`, `test`.

**Bài 3 – Robot thám hiểm Milo:** 40 linh kiện CAD gốc, 22 bước theo sách (`assets/bai03/`). Một động cơ quay thẳng hai bánh: mức 8 ≈ 39,3 cm/giây. Chặng ③ là cảnh sao Hỏa: chạm Start, bấm ✋ để đưa tay trước cảm biến siêu âm (khối "Chờ vật cản"), robot chở mẫu cây từ Trạm A tới điểm B (80 cm). Nhiệm vụ: NV1 lắp 22 bước, NV2 chương trình mẫu (Start → Chờ vật cản → Quay nhanh → Chờ 3s → Dừng), NV3 dừng đúng B mà mẫu không rơi (từ mức 6, không có thùng chở thì mẫu rơi), NV4 gói sáng tạo (thùng chở, ăng-ten–đèn, pin mặt trời, tay gắp); Nâng cao NV5: điểm B đổi chỗ, chở đúng 3 vị trí. Hình cảnh đẹp do `js/bai03/art.js` (phiếu giao việc `docs/giao-viec/01-bai03-ve-canh-sao-hoa.md`); khi chưa có file này trang dùng hình đơn giản.

**Bài 10 – Cối xoay gió:** 41 linh kiện CAD gốc (file .io không chia cụm), 15 bước theo sách (`assets/bai10/`), cảm biến chạm BE-2257. Chặng ③ là cánh đồng gió: chạm Start, nhấn **nút đỏ** trên cảnh (hoặc phím cách) – mỗi lần nhấn cánh quạt đổi chậm → vừa → nhanh → dừng (56 / 94 / 150 vòng/phút); cánh quay sạc pin, pin có điện thì ngôi nhà sáng đèn. Nhiệm vụ: NV1 lắp 15 bước, NV2 chương trình mẫu (Start → Repeat → Chờ nhấn → Quay chậm → Chờ nhấn → Quay vừa → Chờ nhấn → Quay nhanh → Chờ nhấn → Dừng → Repeat End), NV3 sạc đầy pin, NV4 gói sáng tạo (cánh dài, thêm cánh, đèn, đuôi lái gió – cánh dài/thêm cánh sạc nhanh hơn); Nâng cao NV5: thời tiết đổi gió nhẹ → mạnh → bão → nhẹ, quay trong bão quá 1,5 giây thì gãy cánh, phải dừng rồi sạc đầy sau bão. Hình cảnh đẹp do `js/bai10/art.js` (phiếu giao việc `docs/giao-viec/02-bai10-ve-canh-canh-dong-gio.md`).

**Bài dự án – Sổ dự án "Hành trình dòng nước"** (`lop1-du-an.html`, tuần 14–17 học kì I và 31–34 học kì II; thẻ tuần trên trang chọn bài mở đúng chặng bằng `?hk=1&chang=2`): làm theo nhóm (tên nhóm, lớp, 4 bạn với vai thợ lắp ráp / lập trình viên / họa sĩ / người trình bày). ① Ý tưởng – chọn vấn đề về nước bằng thẻ hình, chọn mô hình gốc từ các bài đã học, viết ý tưởng (có gợi ý), vẽ phác thảo hoặc chụp ảnh bản vẽ giấy; ② Chế tạo – đánh dấu việc chế tạo, chụp ảnh mô hình, ghép chương trình khối tự do, ghi các lần chạy thử; ③ Poster A4 tự ghép từ bài làm (tải ảnh PNG hoặc in); ④ Chia sẻ – tự đánh giá bằng sao, điều học được, nộp Google Sheets (cùng cột NV1–NV4 + Chi tiết). Bài làm tự lưu trên máy theo học kì, tuần sau mở lại làm tiếp.

## 1. Mở và sử dụng

1. Giữ nguyên cấu trúc thư mục, mở `index.html` bằng **Chrome** hoặc **Edge**, chọn Lớp 1 → Học kì I → **Bài 9** (hoặc mở thẳng `lop1-bai09.html`). Nút "← Tất cả bài học" ở đầu trang bài để quay lại.
2. Trang chia **ba chặng** theo tiết học (thanh dưới tiêu đề): **① Lắp ráp** – mô hình 3D 28 bước (kéo để xoay, linh kiện mới rơi vào vị trí, đố vui), bên phải là linh kiện của bước, **hình in của bước đó trong sách** và các công cụ xem; **② Sáng tạo**; **③ Lập trình & thử**. Ứng dụng nhớ chặng đang học.
3. **② Sáng tạo** (xưởng sáng tạo): mô hình vệ tinh hoàn chỉnh hiện trong 3D; chọn gói gợi ý (cánh pin kép, chảo ra-đa, cảm biến né thiên thạch) hoặc tự gắn chi tiết vào 4 vị trí (hai đầu cánh pin, mặt ngoài đầu vệ tinh, phía trước thân). Chi tiết mới rơi vào mô hình, bảng bên cạnh tính linh kiện cần lấy thêm và báo khi hộp kit không đủ. Bấm **Thử trong sa bàn** để mang tất cả tính năng sang chặng ③ (gắn được nhiều gói cùng lúc).
4. Ở **③ Lập trình & thử**, thẻ nhiệm vụ cho biết việc cần làm, hàng mẫu mờ cho thấy chương trình trong sách. Chạm khối trong khay để thêm, chạm khối đã đặt để đổi số giây/nốt nhạc/mức tốc độ (nút ×, ◀ ▶ chỉ hiện ở khối đang chọn). Chương trình **chỉ chạy khi chạm khối Start màu vàng** (như phần mềm ZMrobo) **hoặc nút ▶**.
5. Nút **Chế độ: Bé / Nâng cao** ở đầu trang: Bé (mặc định, lớp 1–2) ẩn số đo, tính toán, nhật ký và các công cụ chi tiết; Nâng cao (lớp 3–5, giáo viên) hiện đủ.
6. **Thử thách Nâng cao (cấp 2–3)**, chỉ hiện ở chế độ Nâng cao: thiên thạch không đứng yên mà bay ngang quỹ đạo 8 giây một lần (chặn đường 2,5 giây đầu, có đồng hồ đếm ngược); quanh quỹ đạo có vật lạ (sao chổi, mảnh vỡ, vật thể lạ). Thêm khối **Đợi đường trống**, **Nếu thấy vật lạ … Hết Nếu**, **Chụp ảnh & gửi**; ảnh hiện trên **Màn hình trạm**. Hai nhiệm vụ thêm: **NV5** dừng trước đường bay, đợi thiên thạch qua rồi đi tiếp (dùng cảm biến hoặc tự tính số giây Wait); **NV6** gửi ảnh vật lạ về trạm. NV5–6 không bắt buộc để nộp bài.
7. Bấm nút giao diện trên thanh đầu trang để chuyển **Sáng/Tối**. Tiến độ các bước đã lắp, tên học sinh, lớp và giao diện được lưu cục bộ trong trình duyệt khi khả dụng.

**Chạy offline:** Ứng dụng chính sử dụng HTML/CSS/JS và mô hình 3D đóng gói cùng thư mục, không tải thư viện hay font từ mạng. WebGL cần trình duyệt có hỗ trợ tăng tốc đồ họa; đọc hướng dẫn bằng giọng nói và hiệu ứng âm thanh tùy thuộc trình duyệt/thiết bị và thường chỉ khởi động sau tương tác người dùng. Tính năng gửi điểm về Google Sheets **cần Internet**.

## 2. Nội dung chính và phạm vi chính xác

- **Lắp ráp 3D:** hình 3D là **hình CAD gốc** trong file `Bài 9 -Thông tin liên lạc vũ trụ.io` (BrickLink Studio; 61 linh kiện, 32 mesh). File này không lưu thứ tự lắp, nên 28 bước được xếp tay theo ô linh kiện và viền đỏ của từng trang sách (`scripts/assembly-plan.js`): bước 19–20 chỉ đổi góc nhìn, 21–27 lắp riêng đầu vệ tinh, 28 ghép lên cột anten. Hoạt ảnh "rơi từ trên xuống" chỉ để minh họa; hướng đưa linh kiện thật xem trong sách.
- **Mã linh kiện:** file .io dùng mã LEGO/LDraw và **mã màu BrickLink**. Mã ZMROBO tương ứng (`scripts/bai9-parts.js`) lấy từ công cụ `RBB_Studio/io2rbb` (so hình học với 268 linh kiện RoboBuilder, ưu tiên mã có trong kit set2321A). Động cơ là **BE-3581** (file CAD gọi BE-3578). Khớp góc đen ở bước 16–17 trên kit thật bẻ ~22° nhưng RoboBuilder không có mã tương ứng; bảng ghi tạm BP-7029.
- **Kiểm thử:** `node tests/mission.test.js` (dữ liệu 3D: số linh kiện từng bước khớp sách, mã/màu; chấm điểm mô phỏng) và `node tests/ui.smoke.js` (Playwright: hai cách xem liên kết, hoạt ảnh, desktop/mobile 375px).
- **Dựng lại dữ liệu 3D:** chạy `node scripts/generate-from-embedded-ldraw.js` để tạo `js/data-bai-09.js` từ `references/original_models/model2.ldr`. Bản trước khi nâng cấp (25 mốc suy luận) lưu trong `.backup/2026-10-30-truoc-nang-cap/`.
- **Cảnh câu chuyện (chặng ③):** một khung lớn: Trái Đất có trạm mặt đất, vệ tinh (giống mô hình em lắp, có cánh pin kép/chảo/nón cảm biến nếu đã gắn) bay quanh quỹ đạo theo chương trình, đám đá thiên thạch ở 110°–160°. Phát nhạc → sóng tín hiệu bay về trạm; sắp tới đá → đá viền đỏ, biển báo nhấp nháy; đụng đá → rung màn hình, thông báo "Ối!" và nút Thử lại; tránh được → sao bay và "Giỏi quá!" rồi chương trình dừng. Nút **Xem robot thật** đổi sang mô hình 3D trên thảm, cột anten quay theo bánh răng 8 dẫn 40 (không hiện hai khung cùng lúc). Đây là mô phỏng minh họa, không điều khiển robot thật.
- **Khối lệnh** (puzzle ngang như phần mềm ZMrobo): Start, Repeat, Melody A/B, High Speed, **Motor Power** (mức 1–8), **Motor This Way** (đổi chiều), Wait, Stop và Chờ vật cản. Trang mở với chương trình trống; nút **Mẫu trong sách** nạp chương trình mẫu của bài.
- **Quy tắc tính tốc độ:** động cơ mức 8 = 150 vòng/phút (mức n = 150 × n/8); bánh răng 8 dẫn 40 ⇒ cột anten 150 × 8/40 = **30 vòng/phút** ở mức 8, tức 0,5 vòng/giây.

## 3. Bốn nhiệm vụ chấm điểm (theo phiếu học tập)

| Nhiệm vụ | Điều kiện đạt |
| --- | --- |
| **1. Lắp ráp** | Ở tab **Lắp ráp 3D (28 bước)**, bấm **✓ Đã lắp xong bước này** đủ 28 bước. |
| **2. Lập trình theo mẫu** | Chương trình đúng thứ tự trong sách: **Start → Repeat Start → Melody A → High Speed → Wait 3s → Melody B → High Speed → Wait 3s → Repeat End** (khối động cơ có thể thay bằng **Motor Power**) và chạy hết ít nhất một vòng lặp. |
| **3. Tránh thiên thạch** | Chạy mô phỏng thực sự tránh nguy hiểm **trước 110°**, khi vệ tinh đang tiến vào khoảng **60°–110°**: **Motor This Way** (đổi chiều) hoặc **phát Melody B trong lúc tiếp cận rồi dừng motor**. Chỉ kéo thả khối vào chương trình là chưa đủ. |
| **4. Sáng tạo** | Gắn ít nhất một gói nâng cấp ở **Xưởng sáng tạo**, bấm **🚀 Thử trong sa bàn** rồi cho động cơ chạy. |

**Khối động cơ:** **High Speed** bật động cơ mức 8 (150 vòng/phút). **Motor Power** bật động cơ ở mức 1–8 do học sinh chọn (chạm khối để giảm mức, ví dụ 8 → 2 như giáo án); tốc độ = 150 × mức / 8. **Motor This Way** đổi chiều quay. Bánh răng cố định **8 dẫn 40** như mô hình thật, nên cột anten quay chậm hơn động cơ 5 lần.

**Ví dụ thử nhiệm vụ 3:** Start → Repeat Start → Motor Power (mức 4) → Melody B → Stop → Repeat End. Khi phát Melody B, vệ tinh đang quay chậm tới gần 90°; lệnh Stop sau đó dừng trước vùng nguy hiểm.

Nếu dùng khối **Chờ vật cản**, học sinh cần gắn gói **Cảm biến** ở xưởng sáng tạo. Mỗi khi chỉnh sửa chương trình, kết quả chạy của lần trước được đặt lại. Học sinh đạt 4/4 sẽ thấy bảng chúc mừng và **mã tham chiếu** để giáo viên đối chiếu. Mã này được sinh tại máy, không phải xác nhận của máy chủ.

## 4. Giáo viên nhận điểm qua Google Sheets (tùy chọn)

Ứng dụng vẫn dùng bình thường khi **không** cấu hình Google Sheets. Nếu muốn thu bài, giáo viên tạo một Google Sheet, mở **Tiện ích mở rộng → Apps Script** và dán mã sau:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const yes = v => (v === true ? 'Có' : v === false ? 'Không' : '');
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.className || '',
      data.lesson || '',
      data.score || '',
      yes(data.m1), yes(data.m2), yes(data.m3), yes(data.m4), yes(data.m5), yes(data.m6),
      data.details || '',
      data.verificationCode || ''
    ]);
    return ContentService.createTextOutput('OK');
  } catch (err) {
    return ContentService.createTextOutput('ERROR: ' + err.message);
  }
}
```

Hàng 1 của Sheet có thể đặt 13 tiêu đề tương ứng: **Thời gian | Họ tên | Lớp | Bài học | Điểm | NV1 | NV2 | NV3 | NV4 | NV5 | NV6 | Chi tiết | Mã tham chiếu**. Dùng chung cho mọi bài: cột "Bài học" cho biết bài nào, NV1–NV4 là nhiệm vụ chính của bài đó (xem thẻ nhiệm vụ trong trang bài), NV5–NV6 là thử thách Nâng cao (để trống nếu bài không có). "Chi tiết" ghi thêm cách làm, gói sáng tạo… của từng bài.

> **Đã dán mã Apps Script bản trước?** Cột thay đổi từ 31/10/2026 (dùng chung cho nhiều bài): hãy dán lại mã trên vào Apps Script và **triển khai phiên bản mới**.

Tiếp theo giáo viên chọn **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**; chọn tài khoản thực thi và phạm vi người truy cập phù hợp, cấp quyền khi được hỏi. Sao chép URL **/exec** của ứng dụng web. Tại trang Lab, mở **⚙️ GV**, dán URL và bấm **Lưu cấu hình**. Thử nộp một bài mẫu rồi trực tiếp kiểm tra Sheet đã có hàng dữ liệu mới.

**Giới hạn quan trọng:** nút nộp sử dụng yêu cầu POST ở chế độ `no-cors`. Trình duyệt chỉ biết đã yêu cầu gửi; **không thể xác nhận dữ liệu thực sự ghi vào Google Sheets**. Nếu không có cấu hình, không có mạng hoặc giáo viên chưa thấy hàng mới, học sinh nên lưu ảnh màn hình và mã tham chiếu để đối chiếu thủ công. URL webhook và thông tin học sinh lưu trong trình duyệt; giáo viên nên quản lý quyền truy cập Sheet và chỉ thu thập dữ liệu cần thiết.

## 5. Thư mục dự án

```text
Lab-HappySteam/
├── index.html                    # Trang chọn bài: Lớp → Học kì → Bài
├── lop1-bai03.html               # Lớp 1 · Bài 3 – Robot thám hiểm Milo
├── lop1-bai09.html               # Lớp 1 · Bài 9 – Thông tin liên lạc vũ trụ
├── lop1-bai10.html               # Lớp 1 · Bài 10 – Cối xoay gió
├── lop1-du-an.html               # Lớp 1 · Sổ dự án "Hành trình dòng nước" (?hk=1|2)
├── README.md
├── css/
│   └── lab.css                   # Giao diện "bệ thử" (cùng phong cách Bài 7)
├── js/
│   ├── catalog.js                # Danh mục bài học Khối 1–5
│   ├── home.js                   # Trang chọn bài
│   ├── bai03/                    # Bài 3: lesson.js (cấu hình), rover-engine.js, mars-scene.js, art.js
│   ├── bai09/lesson.js           # Bài 9: cấu hình (nhiệm vụ, khối lệnh, gói sáng tạo…)
│   ├── bai10/                    # Bài 10: lesson.js, wind-engine.js, wind-scene.js, art.js
│   ├── project/project.js        # Sổ dự án
│   ├── data-bai-10.js
│   ├── data-bai-03.js
│   ├── app.js
│   ├── assembly-viewer.js
│   ├── creative-lab.js           # Xưởng sáng tạo 3D
│   ├── sandbox-3d.js             # Robot 3D quay theo chương trình (chặng ③)
│   ├── space-scene.js            # Cảnh câu chuyện vũ trụ (chặng ③)
│   ├── data-bai-09.js
│   ├── simulation-engine.js
│   ├── blocks-engine.js
│   ├── mission-tracker.js
│   └── audio-sfx.js
├── assets/official-assembly/      # Hình in từng bước của sách lắp (Bài 9)
├── assets/bai03/, assets/bai10/   # Hình từng bước sách lắp Bài 3, Bài 10
├── assets/covers/                 # Ảnh thẻ bài trên trang chọn bài
├── scripts/                       # Dựng dữ liệu 3D: lib/cad-lesson.js (dùng chung), generate-*.js, *-plan.js, *-parts.js
├── docs/giao-viec/                # Phiếu giao việc nhẹ cho công cụ AI khác
├── references/
│   ├── official/                  # PDF sách lắp (bản trên GitHub chỉ có file này)
│   ├── original_models/           # File .io/.ldr gốc – chỉ ở máy
│   └── drive_bai9/                # Tài liệu tải từ Drive – chỉ ở máy
└── tests/
    ├── mission.test.js
    ├── ui.smoke.js
    ├── home.smoke.js              # Trang chọn bài
    ├── bai03.test.js              # Bài 3: dữ liệu 3D + bộ mô phỏng
    ├── bai03.smoke.js             # Bài 3: giao diện
    ├── bai10.test.js, bai10.smoke.js   # Bài 10: dữ liệu + mô phỏng, giao diện
    ├── project.smoke.js           # Sổ dự án
    ├── legacy-browser-test.js
    └── screenshots/
```

Các tệp trong `references/` được giữ lại để tra cứu; trang web không cần đọc chúng khi hoạt động.

## 6. Kiểm tra kỹ thuật (chỉ dành cho người phát triển)

**Không cần Node.js hoặc Playwright để học sinh sử dụng.** Muốn chạy kiểm thử:

```powershell
node tests/mission.test.js
# Kiểm thử giao diện cần Playwright và Chrome/Edge đã cài trên máy.
# Nếu Playwright được cài ở thư mục node_modules bên ngoài:
$env:NODE_PATH = "C:\duong-dan\node_modules"
node tests/ui.smoke.js
node tests/home.smoke.js
node tests/bai03.test.js
node tests/bai03.smoke.js
node tests/bai10.test.js
node tests/bai10.smoke.js
node tests/project.smoke.js
```

Kiểm thử giao diện mở chính tệp `file:///lop1-bai09.html` (và trang chọn bài `index.html`) trên desktop **1280×800** và mobile **375×667**, kiểm tra mô hình 3D, giao diện Sáng/Tối, nâng cấp, chương trình hoàn thành **4/4 nhiệm vụ** và ảnh chụp trong `tests/screenshots/`. Kết quả cuối cùng cần dựa trên lần chạy kiểm thử thực tế; nội dung này không khẳng định đã kiểm thử toàn bộ điện thoại, phiên bản trình duyệt hay thiết bị robot thật.

**Bản online (GitHub Pages):** https://dannguyen04.github.io/Lab-HappySteam/ – chạy giống hệt khi mở `index.html` trên máy. Repo chỉ chứa file cần để chạy app; tài liệu gốc từ Drive (giáo án, slide, PDF gốc), file mô hình `.io/.ldr` và bản sao lưu được giữ ở máy (xem `.gitignore`), nên muốn dựng lại `js/data-bai-09.js` cần có `references/original_models/model2.ldr` trên máy. Liên kết Google Sheets thực tế cần giáo viên cấu hình, kiểm tra riêng.
