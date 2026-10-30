# PHÒNG LAB ZMROBO ẢO — BÀI 9: THÔNG TIN LIÊN LẠC VŨ TRỤ

Ứng dụng học tập cho học sinh tiểu học: lắp mô hình vệ tinh 3D theo 28 bước của sách hướng dẫn chính thức, lập trình bằng khối và mô phỏng chuyển động. Giao diện tiếng Việt, chạy **trực tiếp từ tệp `index.html`**, không cần máy chủ, npm hay tài khoản.

## 1. Mở và sử dụng

1. Giữ nguyên cấu trúc thư mục, mở `index.html` bằng **Chrome** hoặc **Edge**. Địa chỉ trên thanh trình duyệt có dạng `file:///.../Lab-HappySteam/index.html`.
2. Tab **Hướng dẫn lắp ráp** có hai cách xem nối với nhau: **Lắp ráp theo bài giảng gốc** (hình in từng bước của sách) và **Lắp ráp 3D (28 bước)** (kéo để xoay, phóng to, linh kiện mới rơi từ trên xuống vào vị trí, đố vui đoán linh kiện). Nút **📖 Sách hướng dẫn · bước N** trong 3D mở đúng hình in; nút **🏗️ Xem trong 3D** ở trang sách mở đúng bước trong 3D.
3. **Sáng tạo mô hình 3D** (xưởng sáng tạo): mô hình vệ tinh hoàn chỉnh hiện trong 3D; chọn gói gợi ý (cánh pin kép, chảo ra-đa, cảm biến né thiên thạch) hoặc tự gắn chi tiết vào 4 vị trí (hai đầu cánh pin, mặt ngoài đầu vệ tinh, phía trước thân). Chi tiết mới rơi vào mô hình, bảng bên cạnh tính linh kiện cần lấy thêm và báo khi hộp kit không đủ. Bấm **🚀 Thử trong sa bàn** để mang tất cả tính năng sang Tab 2 (gắn được nhiều gói cùng lúc).
4. Mở **Lập trình & Mô phỏng**, chạm khối trong khay để thêm khối. Chạm khối đã đặt để điều chỉnh tham số. Nhấn **Chạy chương trình**, xem vệ tinh quay, bánh răng chuyển động và kết quả nhiệm vụ.
5. Bấm nút giao diện trên thanh đầu trang để chuyển **Sáng/Tối**. Tiến độ các bước đã lắp, tên học sinh, lớp và giao diện được lưu cục bộ trong trình duyệt khi khả dụng.

**Chạy offline:** Ứng dụng chính sử dụng HTML/CSS/JS và mô hình 3D đóng gói cùng thư mục, không tải thư viện hay font từ mạng. WebGL cần trình duyệt có hỗ trợ tăng tốc đồ họa; đọc hướng dẫn bằng giọng nói và hiệu ứng âm thanh tùy thuộc trình duyệt/thiết bị và thường chỉ khởi động sau tương tác người dùng. Tính năng gửi điểm về Google Sheets **cần Internet**.

## 2. Nội dung chính và phạm vi chính xác

- **Lắp ráp 3D:** hình 3D là **hình CAD gốc** trong file `Bài 9 -Thông tin liên lạc vũ trụ.io` (BrickLink Studio; 61 linh kiện, 32 mesh). File này không lưu thứ tự lắp, nên 28 bước được xếp tay theo ô linh kiện và viền đỏ của từng trang sách (`scripts/assembly-plan.js`): bước 19–20 chỉ đổi góc nhìn, 21–27 lắp riêng đầu vệ tinh, 28 ghép lên cột anten. Hoạt ảnh "rơi từ trên xuống" chỉ để minh họa; hướng đưa linh kiện thật xem trong sách.
- **Mã linh kiện:** file .io dùng mã LEGO/LDraw và **mã màu BrickLink**. Mã ZMROBO tương ứng (`scripts/bai9-parts.js`) lấy từ công cụ `RBB_Studio/io2rbb` (so hình học với 268 linh kiện RoboBuilder, ưu tiên mã có trong kit set2321A). Động cơ là **BE-3581** (file CAD gọi BE-3578). Khớp góc đen ở bước 16–17 trên kit thật bẻ ~22° nhưng RoboBuilder không có mã tương ứng; bảng ghi tạm BP-7029.
- **Kiểm thử:** `node tests/mission.test.js` (dữ liệu 3D: số linh kiện từng bước khớp sách, mã/màu; chấm điểm mô phỏng) và `node tests/ui.smoke.js` (Playwright: hai cách xem liên kết, hoạt ảnh, desktop/mobile 375px).
- **Dựng lại dữ liệu 3D:** chạy `node scripts/generate-from-embedded-ldraw.js` để tạo `js/data-bai-09.js` từ `references/original_models/model2.ldr`. Bản trước khi nâng cấp (25 mốc suy luận) lưu trong `.backup/2026-10-30-truoc-nang-cap/`.
- **Sa bàn (Tab 2):** chính mô hình vệ tinh 3D học sinh vừa lắp (kèm gói nâng cấp đã đưa từ xưởng sáng tạo) đứng trên thảm sa bàn và **quay theo chương trình**: bánh răng 8 trên động cơ dẫn bánh răng 40, cột anten và đầu vệ tinh quay chậm hơn 5 lần, ngược chiều bánh răng nhỏ. Góc dưới là bản đồ quỹ đạo 2D (trạm Alpha/ISS/Beta, vành đai thiên thạch 110°–160°); nút **⇄ Đổi khung** phóng to bản đồ. Đây là mô phỏng minh họa, không điều khiển robot thật.
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
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || '',
      data.className || '',
      data.lesson || '',
      data.score || '',
      data.assemblyDone ? 'Có' : 'Không',
      data.sampleProgram ? 'Có' : 'Không',
      data.asteroidAvoided ? 'Có' : 'Không',
      data.avoidanceMethod || '',
      data.upgrades || '',
      data.verificationCode || ''
    ]);
    return ContentService.createTextOutput('OK');
  } catch (err) {
    return ContentService.createTextOutput('ERROR: ' + err.message);
  }
}
```

Hàng 1 của Sheet có thể đặt 11 tiêu đề tương ứng: **Thời gian | Họ tên | Lớp | Bài học | Điểm | Lắp 28 bước | Chương trình mẫu | Né thiên thạch | Cách né | Gói nâng cấp | Mã tham chiếu**.

> **Đã dùng bản cũ (3 nhiệm vụ)?** Cột thay đổi từ 31/10/2026: hãy dán lại mã trên vào Apps Script và **triển khai phiên bản mới**, nếu không các cột Bánh răng/Melody B sẽ để trống.

Tiếp theo giáo viên chọn **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**; chọn tài khoản thực thi và phạm vi người truy cập phù hợp, cấp quyền khi được hỏi. Sao chép URL **/exec** của ứng dụng web. Tại trang Lab, mở **⚙️ GV**, dán URL và bấm **Lưu cấu hình**. Thử nộp một bài mẫu rồi trực tiếp kiểm tra Sheet đã có hàng dữ liệu mới.

**Giới hạn quan trọng:** nút nộp sử dụng yêu cầu POST ở chế độ `no-cors`. Trình duyệt chỉ biết đã yêu cầu gửi; **không thể xác nhận dữ liệu thực sự ghi vào Google Sheets**. Nếu không có cấu hình, không có mạng hoặc giáo viên chưa thấy hàng mới, học sinh nên lưu ảnh màn hình và mã tham chiếu để đối chiếu thủ công. URL webhook và thông tin học sinh lưu trong trình duyệt; giáo viên nên quản lý quyền truy cập Sheet và chỉ thu thập dữ liệu cần thiết.

## 5. Thư mục dự án

```text
Lab-HappySteam/
├── index.html
├── README.md
├── css/
│   ├── main.css
│   └── assembly.css
├── js/
│   ├── app.js
│   ├── assembly-viewer.js
│   ├── creative-lab.js           # Xưởng sáng tạo 3D
│   ├── sandbox-3d.js             # Sa bàn 3D ở Tab 2
│   ├── official-assembly.js      # Hình in từng bước của sách
│   ├── data-bai-09.js
│   ├── simulation-engine.js
│   ├── blocks-engine.js
│   ├── mission-tracker.js
│   └── audio-sfx.js
├── assets/official-assembly/      # Hình in từng bước của sách lắp
├── references/
│   ├── official/                  # PDF sách lắp (bản trên GitHub chỉ có file này)
│   ├── original_models/           # File .io/.ldr gốc – chỉ ở máy
│   └── drive_bai9/                # Tài liệu tải từ Drive – chỉ ở máy
└── tests/
    ├── mission.test.js
    ├── ui.smoke.js
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
```

Kiểm thử giao diện mở chính tệp `file:///index.html` trên desktop **1280×800** và mobile **375×667**, kiểm tra mô hình 3D, giao diện Sáng/Tối, nâng cấp, chương trình hoàn thành **4/4 nhiệm vụ** và ảnh chụp trong `tests/screenshots/`. Kết quả cuối cùng cần dựa trên lần chạy kiểm thử thực tế; nội dung này không khẳng định đã kiểm thử toàn bộ điện thoại, phiên bản trình duyệt hay thiết bị robot thật.

**Bản online (GitHub Pages):** https://dannguyen04.github.io/Lab-HappySteam/ – chạy giống hệt khi mở `index.html` trên máy. Repo chỉ chứa file cần để chạy app; tài liệu gốc từ Drive (giáo án, slide, PDF gốc), file mô hình `.io/.ldr` và bản sao lưu được giữ ở máy (xem `.gitignore`), nên muốn dựng lại `js/data-bai-09.js` cần có `references/original_models/model2.ldr` trên máy. Liên kết Google Sheets thực tế cần giáo viên cấu hình, kiểm tra riêng.
