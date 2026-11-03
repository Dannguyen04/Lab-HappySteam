# Bản thiết kế sản phẩm — Happy STEAM Lab

Cập nhật: 2026-11-03. Trạng thái: **ĐÃ DUYỆT 2026-11-03** (đang làm bước 0–1).
Đây là trang "thước đo" của cả dự án. Khi thêm hay sửa một thứ gì, hãy hỏi trước: nó nằm ở ô nào trong trang này? Nếu không nằm ở ô nào thì không làm, hoặc phải sửa trang này trước.
Nghiệp vụ chi tiết xem `docs/ba/BRD.md`; công nghệ xem `docs/kien-truc.md`; bản đồ file xem `docs/ban-do-he-thong.md`.

---

## 1. Một câu

**Happy STEAM Lab là một app học robot kiểu LEGO Education, dùng được cho nhiều bộ kit (ZMROBO, LEGO và các bộ khác). Điểm khác: thay cho hub và động cơ thật là một robot ảo 3D, nên học sinh học tiếp ở nhà được mà không cần kit.**

Trên lớp, em lắp và lập trình kit thật. Về nhà, em mở Lab, gặp lại đúng mô hình đó dưới dạng 3D, lập trình nó, thử lại, sửa cho tốt hơn, rồi ghi vào sổ. Giáo viên và phụ huynh thấy được em đã làm gì.

### 1.1. Nguyên tắc nhiều bộ kit (quyết định 2026-11-03)

Cả hệ thống, không riêng khối lệnh, **không được gắn cứng với một hãng kit**. Hôm nay chỉ có ZMROBO Alpha 330, nhưng mọi phần đều phải nhận thêm được kit mới (bộ ZMROBO khác, LEGO WeDo/SPIKE…) mà **chỉ cần thêm dữ liệu**, không phải sửa code.

| Phần | Phần chung (viết một lần) | Phần riêng của từng kit (`content/kits/<kit>/`) |
|---|---|---|
| Lắp 3D | Trình xem lắp từng bước | Thư viện chi tiết 3D, tên chi tiết tiếng Việt |
| Robot ảo | Vật lý, cảnh, cách gắn thiết bị | Danh sách thiết bị (động cơ, cảm biến), thông số (tốc độ, tầm đo), cổng |
| Khối lệnh | Bộ khối theo ý nghĩa + 3 cách hiển thị | Kit làm được khối nào, tên cổng hiện cho em |
| Bài học | Mạch 5 chặng, nhiệm vụ, sổ ghi chép | Bài khai báo `kit: "alpha330"`; kit có thể có bộ bài riêng |
| Lớp học | Lớp, buổi học, chấm, phụ huynh | Lớp ghi kit đang dùng (BRD đã có thực thể Kit, GD-23) |
| Trang chủ | Bài học, Dự án của em, Phòng lập trình | Lọc theo kit của lớp |

Luật:
- Không có chữ "ZMROBO", "Alpha", "M1", "LEGO" hay mã chi tiết nằm cứng trong code chung. Những thứ đó chỉ có trong dữ liệu kit.
- Thêm một kit = thêm một thư mục `content/kits/<kit>/` cộng các bài của kit đó. Một bài kiểm tra tự động xác nhận kit mới đủ dữ liệu.
- Kit LEGO: hình chi tiết lấy từ thư viện mở LDraw (giấy phép CC BY), không lấy hình, tên nhân vật hay giao diện của app LEGO. Tên LEGO chỉ dùng để nói "bài này dùng bộ LEGO …", không dùng làm tên hay logo của Lab.

---

## 2. LEGO làm gì, vì sao hiệu quả, Lab áp dụng thế nào

Mình xét ba app LEGO mà bạn đã dùng thử: WeDo 2.0, SPIKE (Essential và Prime) và MINDSTORMS Robot Inventor. Bảng dưới chỉ ghi những gì **áp dụng được**, xếp theo mức quan trọng với Lab.

Cột "Hiện trạng": ✅ có rồi · 🟡 có một phần hoặc chỉ ở vài bài · ❌ chưa có.

### 2.1. Bài học

| # | LEGO làm gì | Vì sao hiệu quả | Lab áp dụng thế nào | Hiện trạng |
|---|---|---|---|---|
| L1 | **Mạch bài cố định.** WeDo: Khám phá → Tạo → Chia sẻ. Giáo án SPIKE theo 5 bước (Gợi mở, Khám phá, Giải thích, Mở rộng, Đánh giá) | Em biết luôn mình đang ở đâu và còn bao nhiêu bước. Giáo viên dạy bài nào cũng một nhịp | Mọi bài đều có 5 chặng giống nhau (mục 4) | 🟡 có ở lớp 1 bài 9 (`flow.json`) |
| L2 | **Mở đầu bằng một câu chuyện có vấn đề cần giải** (video hoặc nhân vật nói chuyện), rồi hỏi "theo em thì sao?" | Em có lý do để lắp và lập trình, chứ không phải "lắp vì cô bảo" | Truyện Bin & Na kèm 1 câu đoán. Cuối bài hỏi lại đúng câu đó để em thấy mình đã hiểu thêm | 🟡 lớp 1 bài 9 |
| L3 | **Lắp trước, rồi "chế" (remix)**: lắp mô hình gốc, sau đó đổi một phần và xem robot khác đi thế nào | Có một mô hình chắc chắn chạy được, rồi mới sáng tạo | Lắp 3D từng bước, sau đó là gói Sáng tạo (đổi bánh, đổi bánh răng) có hiệu ứng thật trên robot ảo | ✅ lắp 3D · 🟡 sáng tạo |
| L4 | **Chương trình mẫu + gợi ý "thử đổi số này xem"** | Lớp 1 không phải viết từ trang trắng | Chương trình mẫu mờ, em kéo khối vào cho khớp. Thêm gợi ý "thử đổi tốc độ" | ✅ có mẫu mờ |
| L5 | **Phân hóa có sẵn trong bài**: phần Hỗ trợ cho em chậm hơn, phần Mở rộng cho em nhanh | Một lớp 25 em, tốc độ rất khác nhau | Mỗi bài có NV1–NV3 bắt buộc và NV4–NV5 mở rộng, cộng mức gợi ý tăng dần (BRD 6.2) | ✅ nhiệm vụ · ✅ gợi ý |
| L6 | **Thử thách cuối bài không có một đáp án duy nhất** (WeDo "Open project", Robot Inventor "Activities") | Để em sáng tạo, không chỉ làm theo | Chặng Thử thách: một mục tiêu đo được trên robot ảo (đi xa nhất, dừng đúng vạch…), em tự chọn cách làm | 🟡 NV4–5 ở vài bài |
| L7 | **Tự đánh giá** (em tự chấm mình, tự chọn câu nói về bài làm của mình) | Em học cách nhìn lại; giáo viên đỡ phải hỏi từng em | Câu hỏi chọn hình ở chặng Chia sẻ, cộng "em thấy bài này dễ / vừa / khó" | 🟡 lớp 1 bài 9 |

### 2.2. Lập trình và robot

| # | LEGO làm gì | Vì sao hiệu quả | Lab áp dụng thế nào | Hiện trạng |
|---|---|---|---|---|
| R1 | **Một bộ lệnh, ba cách nhìn**: SPIKE có khối hình (Essential), khối chữ (Prime) và Python, cùng điều khiển một hub | Em lớn lên mà không phải học lại từ đầu; lớp 1 và lớp 5 dùng chung một app | **Một định nghĩa khối duy nhất**, ba cách hiển thị: khối hình ngang (lớp 1–2), khối chữ dọc (lớp 3+), Python (lớp 5 hoặc em giỏi). Bài học và Phòng lập trình dùng chung | ❌ đang có 2 hệ khối riêng (mục 6) |
| R2 | **Bảng thiết bị trực tiếp**: thấy động cơ đang quay bao nhiêu, cảm biến đang đọc số gì | Lập trình cảm biến mà không thấy số thì em chỉ đoán | Bảng thiết bị bên cạnh robot ảo: mỗi cảm biến hiện số và hình (sáng/tối, xa/gần). Có ở mọi bài, không chỉ ở Phòng lập trình | 🟡 chỉ có ở Phòng lập trình |
| R3 | **Điều khiển tay** (Robot Inventor có màn hình nút lái tự thiết kế) | Lớp nhỏ hiểu "động cơ quay thì bánh đi" trước khi lập trình | Nút "Lái thử" ở chặng Lập trình: bấm giữ để chạy từng động cơ trên robot ảo | ❌ |
| R4 | **Chạy từng bước / xem khối nào đang chạy** | Tìm lỗi là kỹ năng chính của lập trình | Khối đang chạy sáng lên; nút chạy từng bước | ✅ sáng khối · 🟡 từng bước (chỉ ở Phòng lập trình) |
| R5 | **Trợ giúp ngay trên khối** (bấm vào khối thì thấy khối đó làm gì) | Em không phải hỏi cô | Giữ lâu hoặc bấm "?" trên khối: một hình động 2–3 giây cho thấy khối làm gì | ❌ |
| R6 | **Hub là thứ thật** | — | **Đây là chỗ Lab khác LEGO.** Robot ảo 3D lắp từ đúng chi tiết Alpha 330, có vật lý, chạy trên máy ở nhà. Xem mục 5 | 🟡 mỗi bài tự viết engine riêng |

### 2.3. Dự án và ghi chép

| # | LEGO làm gì | Vì sao hiệu quả | Lab áp dụng thế nào | Hiện trạng |
|---|---|---|---|---|
| D1 | **"Dự án của em" ngay trang chủ**: mọi chương trình đã làm nằm ở đó, mở lại là làm tiếp | Học là quá trình nhiều buổi, không phải một lần | Trang chủ có ô "Dự án của em": mỗi bài đã mở là một dự án (mô hình, chương trình, sổ ghi chép), cộng các dự án tự do ở Phòng lập trình. Lưu theo em, mở được ở mọi máy | ❌ (bảng `attempts` trong DB đã có, chưa có màn hình) |
| D2 | **Công cụ ghi chép tích hợp** (WeDo): chụp ảnh, quay video, chụp màn hình, viết chữ, rồi xuất ra để in | Biến "làm xong" thành "kể lại được", đây là phần giáo viên chấm | Sổ ghi chép trong mỗi dự án: ảnh mô hình thật (chụp trên lớp), ảnh tự động từ robot ảo khi đạt nhiệm vụ, câu trả lời chọn hình, ghi âm câu trả lời cho em chưa biết viết. In ra một trang | 🟡 lớp 1 bài 9 · sổ dự án nhóm có riêng |
| D3 | **Bắt đầu nhanh**: một vài bài làm quen ngắn trước khi vào bài thật | Em không bị kẹt ở cách dùng app | 3 bài "Làm quen" 5 phút: kéo khối, chạy robot ảo, chụp ảnh vào sổ | ❌ |

### 2.4. Giáo viên

| # | LEGO làm gì | Vì sao hiệu quả | Lab áp dụng thế nào | Hiện trạng |
|---|---|---|---|---|
| G1 | **Giáo án đi kèm từng bài**: mục tiêu, thời lượng, câu hỏi gợi mở, lỗi hay gặp, cách phân hóa | Giáo viên mới dạy được ngay | Mỗi bài có "Ghi chú giáo viên" (một trang, in được) sinh từ cùng `lesson.json` | ❌ |
| G2 | **Phiếu quan sát và thang đánh giá** | Chấm nhất quán giữa các giáo viên | Đã có thang HTT/HT/CHT theo BRD. Thêm: mỗi mức có mô tả cụ thể cho từng bài | 🟡 |
| G3 | **LEGO không có lớp học**, không có mã vào lớp, không có phụ huynh | — | **Đây là chỗ Lab hơn LEGO**: mã buổi học, bảng lớp, chấm từng em, phụ huynh, trưng bày, giao thử thách | 🟡 đang làm theo BRD |

### 2.5. Cái KHÔNG bắt chước

- Tên, nhân vật, hình vẽ, màu, bố cục màn hình của LEGO (Max & Mia, giao diện WeDo/SPIKE). Lab có Bin & Na và giao diện riêng.
- Sách lắp, ảnh chụp, file PDF của ZMROBO (GD-34): chỉ dùng mô hình 3D tự dựng.
- Kết nối Bluetooth với hub thật: Lab không nạp chương trình xuống kit. Trên lớp em vẫn dùng app của ZMROBO để chạy kit thật.

---

## 3. Lab gồm một app, ba cửa vào

```
                        HAPPY STEAM LAB
   ┌──────────────────────┬──────────────────────┬──────────────────────┐
   │   CỬA HỌC SINH        │   CỬA GIÁO VIÊN       │   CỬA PHỤ HUYNH       │
   │ Trên lớp: mã + tên    │ Đăng nhập             │ Đăng nhập + mã mời    │
   │ Ở nhà: qua phụ huynh  │                       │                       │
   ├──────────────────────┼──────────────────────┼──────────────────────┤
   │ Trang chủ của em      │ Lớp của tôi           │ Con của tôi           │
   │ ├ Bài học (theo tuần) │ ├ Mở buổi học         │ ├ Cho con vào học     │
   │ ├ Dự án của em        │ ├ Bảng lớp + chấm     │ ├ Sổ ghi chép của con │
   │ ├ Phòng lập trình     │ ├ Giao thử thách      │ └ Kết quả, nhận xét   │
   │ └ Làm quen            │ ├ Ghi chú giáo viên   │                       │
   │                       │ └ Trưng bày           │                       │
   └──────────┬───────────┴──────────────────────┴──────────────────────┘
              ▼
       TRANG BÀI (một trang cho mọi bài)
       Khám phá → Lắp → Lập trình + Robot ảo → Thử thách → Chia sẻ
```

Học sinh chỉ thấy **một trang chủ**. Mọi thứ khác đều mở ra từ đó.

---

## 4. Mạch bài chung (bài nào cũng vậy)

| Chặng | Em làm gì | Trên lớp (có kit) | Ở nhà (không kit) | Dữ liệu trong `content/<bài>/` |
|---|---|---|---|---|
| ① **Khám phá** | Xem truyện 3–4 khung, trả lời 1 câu đoán | Cả lớp xem trên màn chiếu | Em tự xem | `flow.json` → `explore` |
| ② **Lắp** | Lắp mô hình theo từng bước 3D | Nhìn 3D để lắp kit thật | Lắp robot ảo (bỏ qua được nếu đã lắp trên lớp, BR-BL-02) | `build.json` |
| ③ **Lập trình + Robot ảo** | Kéo khối, chạy, xem robot ảo và bảng thiết bị, đạt NV1–NV3 | Lập trình kit thật bằng app ZMROBO; Lab để xem mẫu | Lập trình robot ảo | `lesson.json` → khối, nhiệm vụ, cảnh |
| ④ **Thử thách** | Đổi mô hình hoặc chương trình để đạt mục tiêu mở (NV4–NV5) | Tùy giờ | Phần chính ở nhà | `lesson.json` → thử thách |
| ⑤ **Chia sẻ** | Chụp ảnh, trả lời câu chọn hình, tự đánh giá → vào sổ | Chụp mô hình thật | Ảnh tự chụp từ robot ảo | `flow.json` → `share` |

Luật:
- Thanh 5 chặng luôn hiện ở trên cùng; em nhảy qua lại tự do, không bị khóa.
- Không chặng nào cần code riêng của bài (theo `kien-truc.md` mục 0). Bài chỉ là dữ liệu.
- Chặng ① và ⑤ dùng chung một câu hỏi để em thấy mình đã hiểu thêm (như lớp 1 bài 9).

---

## 5. Robot ảo — thứ thay cho hub LEGO

Đây là phần khó nhất và cũng là lý do Lab tồn tại. Hiện mỗi bài tự vẽ và tự tính vật lý (~45.000 dòng). Đích là **một robot ảo dùng chung**:

1. **Mô hình**: lắp từ chi tiết thật của Alpha 330 (`content/kits/alpha330`), giống chặng ② và giống xe trong Phòng lập trình.
2. **Thiết bị**: động cơ, đèn, loa, cảm biến (chạm, ánh sáng, siêu âm, dò line…) khai báo trong `lesson.json`: "cổng A có động cơ, gắn vào trục bánh trái".
3. **Vật lý**: một engine chung (Rapier). Bài chỉ khai báo tham số: ma sát, dốc, gió, vật cản.
4. **Cảnh**: sa bàn 3D chung, ghép từ các mảnh có sẵn (đường, dốc, vạch, vật cản) cộng ảnh nền.
5. **Bảng thiết bị** (R2) và **Lái thử** (R3) đi kèm robot ở mọi bài.
6. **Chấm nhiệm vụ**: luật khai báo (`{"khi": "xe.quangDuong", ">=": 50}`), cho ra cùng kết quả trên máy nhanh hay chậm (BRD 13.3).

Phòng lập trình là robot ảo này đặt trên sân thi đấu, không phải một hệ thống riêng.

---

## 6. Một hệ khối lệnh

Hiện có hai hệ:
- **Dải khối ngang** trong bài học (`js/blocks-engine.js` + `lesson-engine.js`).
- **Blockly dọc + Python** trong Phòng lập trình (`js/code-lab/`).

Đích (R1):

```
     MỘT danh sách khối (định nghĩa 1 lần: tên, tham số, hình, thiết bị cần)
                         │
      ┌──────────────────┼──────────────────┐
  Khối hình ngang     Khối chữ dọc        Python
  (lớp 1–2)           (lớp 3–5)           (lớp 5 / em giỏi)
      └──────────────────┼──────────────────┘
                         ▼
          MỘT bộ chạy → robot ảo (mục 5)
```

- **Khối không gắn với một hãng kit** (áp dụng nguyên tắc ở mục 1.1). Khối nói theo ý nghĩa: "động cơ quay", "đọc cảm biến ánh sáng", chứ không nói "cổng M1 của ZMROBO". Mỗi bộ kit có một **hồ sơ kit** (`content/kits/<kit>/`) ghi kit có những thiết bị nào, cổng nào và chi tiết 3D nào. Bài chọn kit; khay chỉ hiện những khối mà kit đó làm được. Hôm nay có Alpha 330; sau này thêm bộ ZMROBO khác hay bộ LEGO thì chỉ cần thêm hồ sơ kit, không phải viết lại khối hay robot ảo.
- Hình khối là của Lab. Nó giống app của hãng ở **loại lệnh và thứ tự**, để em chuyển sang kit thật dễ dàng, nhưng không chép hình vẽ của hãng nào.
- Một chương trình lưu một kiểu, xem được bằng cả ba cách (BRD GD-15).
- Bài khai báo dùng mức nào và khay có những khối nào; không bài nào tự định nghĩa khối.
- Lớp 1 không bao giờ thấy chữ trên khối, chỉ thấy hình (WeDo làm rất tốt điều này).

---

## 7. Dự án của em

| Điều | Thiết kế |
|---|---|
| Một dự án là gì | Một bài em đã mở (mô hình + chương trình + sổ ghi chép), **hoặc** một chương trình tự do ở Phòng lập trình |
| Ở đâu | Ô đầu tiên trên trang chủ: "Làm tiếp" (dự án mở gần nhất) và lưới các dự án khác |
| Lưu | Tự lưu lên Supabase theo em (bảng `attempts` / `notebook_revisions` đã có). Mất mạng thì lưu tạm trên máy rồi đẩy lên sau |
| Mở ở nhà | Phụ huynh đăng nhập → chọn con → con thấy đúng trang chủ và dự án như trên lớp |
| Dự án nhóm | Dự án 4 tuần (BRD S-04) là một dự án có nhiều thành viên; nằm cùng lưới, có huy hiệu "Nhóm" |

---

## 8. Sổ ghi chép và phụ huynh

- **Mỗi dự án có một sổ.** Trong sổ có: ảnh (chụp mô hình thật hoặc ảnh tự chụp từ robot ảo lúc đạt nhiệm vụ), câu trả lời chọn hình, ghi âm (cho lớp 1 chưa viết được), tự đánh giá, và nhận xét của giáo viên.
- **In một trang**: dùng cho góc trưng bày lớp, hoặc gửi về nhà.
- **Phụ huynh** thấy sổ của con theo dòng thời gian (bài nào, làm gì, ảnh nào, cô nhận xét gì). Họ chỉ đọc; nhận xét do giáo viên duyệt.
- Giữ đúng luật dữ liệu trẻ em của BRD (đồng ý của phụ huynh, xóa dữ liệu, mục 15.7).

---

## 9. Đối chiếu hiện trạng: giữ, gom hay bỏ

| Đang có | Thuộc ô nào | Quyết định |
|---|---|---|
| `index.html` (chọn bài) | Trang chủ học sinh | **Giữ**, thêm "Dự án của em", "Làm tiếp", "Làm quen" |
| `vao-hoc.html` (mã + tên) | Cửa học sinh trên lớp | **Giữ** |
| `bai.html?id=…` | Trang bài | **Giữ**, chuyển dần mọi bài sang mạch 5 chặng |
| `code-lab.html` | Phòng lập trình | **Giữ**, mở từ trang chủ; dùng chung hệ khối và robot ảo |
| `lop1-du-an.html` | Dự án nhóm | **Gom** vào "Dự án của em" |
| `lop1-trung-bay.html` | Trưng bày | **Giữ** làm trang sự kiện do giáo viên mở |
| `giao-vien.html` | Cửa giáo viên | **Giữ** |
| `mock/*` (8 trang: lớp GV, phụ huynh, trưng bày, khách, phiếu mời) | Bản mẫu cho cửa giáo viên và phụ huynh | **Giữ tạm** ở gốc vì đang được build ra `/mock/` để demo; xóa từng trang khi trang thật xong |
| `docs/mau/wireframes/*` | Bản mẫu S-01/06/07 | ✅ Đã chuyển từ `docs/wireframes/` (2026-11-03) |
| `js/bai*/`, `js/lop*-bai*/` (code riêng từng bài) | Trái luật "bài là dữ liệu" | **Bỏ dần**: mỗi lần chuyển một bài sang robot ảo chung thì xóa thư mục của bài đó |
| `js/blocks-engine.js` + `js/code-lab/blocks-vertical.js` | Hai hệ khối | **Gom** thành một (mục 6) |
| `scratch/` | Không thuộc ô nào | ✅ Đã xóa (2026-11-03) |
| `scripts/*-parts.js`, `*-plan.js` | Dữ liệu lắp của bài cũ; test và `rbb2content.js` còn dùng | **Giữ** tới khi các bài đó chuyển sang `build.json` |

---

## 10. Thứ tự làm (đề xuất)

0. ✅ **Chốt nhánh đang dở** (2026-11-03): 3 commit c0a8e03, 3fae5b7, 78a3364. Ảnh sách ZMROBO mới để ngoài git (GD-34).
1. ✅ **Dọn** (2026-11-03): xóa `scratch/`, chuyển `wireframes/`. D2, D3, D7 đã làm từ trước. Còn chờ: dọn 357 ảnh sách cũ đã lên git (BRD 12.19) và mesh RoboBuilder (12.18).
2. **Mạch 5 chặng cho mọi bài đã có**: thêm `flow.json` cho các bài lớp 1 và lớp 3 học kì I. Đây là việc soạn dữ liệu, giao được cho Codex/Antigravity theo mẫu lớp 1 bài 9.
3. **Dự án của em + tự lưu theo em**: màn hình trang chủ và lưu Supabase. Phần này gắn với BRD MVP (mục tiêu số 4).
4. **Sổ ghi chép chung + trang phụ huynh** (BRD S-10, S-11).
5. **Một hệ khối lệnh** (mục 6).
6. **Robot ảo chung**: chuyển từng bài sang, bắt đầu từ lớp 3 bài 13 và lớp 1 bài 1 như `kien-truc.md` đã định.
7. **Bổ sung kiểu LEGO**: bảng thiết bị ở mọi bài, Lái thử, trợ giúp trên khối, 3 bài Làm quen, ghi chú giáo viên.

Các quy tắc giao diện P0 ở mục 11 (U1–U6, U8–U9) áp dụng ngay từ bước 2: mỗi màn hình mới hoặc sửa phải đạt các quy tắc đó.

Bước 2–4 mang lại cảm giác "giống LEGO" nhanh nhất mà chưa phải viết lại phần lõi. Bước 5–6 là phần lõi lớn, làm sau khi khung đã rõ.

---

## 11. Quy tắc giao diện học từ LEGO (đã kiểm trên app thật)

Nguồn: báo cáo nghiên cứu `docs/giao-viec/85-bao-cao-ux-lego.md` (tài liệu trên mạng) và báo cáo kiểm tra trực tiếp `docs/giao-viec/85b-bao-cao-app-that.md` (SPIKE bản web 3.6.1, 2026-11-04). Cả hai chỉ để trên máy. Chỉ học **cách làm**, không chép hình, màu hay bố cục của LEGO.

### 11.1. Lấy về dùng

| # | LEGO làm (đã thấy trên app) | Lab làm | Ưu tiên |
|---|---|---|---|
| U1 | Vào app không đăng nhập; từ mở app tới bấm Chạy mất 5–6 thao tác | Ở nhà: trang chủ → bài → Chạy, **tối đa 3 lần bấm**; trên lớp chỉ thêm bước mã + chọn tên | P0 |
| U2 | **Khay khối lọc theo bài**: chỉ hiện các khối bài cần (khoảng 7 khối, vừa một màn hình), có nút mở đủ bộ | Giữ khay theo bài như hiện có; thêm nút "Tất cả khối" | P0 |
| U3 | Khi chạy: cả chuỗi khối sáng viền; nút Chạy có vòng quay; nút Dừng đổi màu | Chuỗi khối sáng lên, **cộng** khối đang chạy sáng riêng (rõ hơn LEGO, giúp tìm lỗi) | P0 |
| U4 | **Nhắc kiểu đèn chiếu**: làm tối màn hình, khoét sáng đúng nút cần bấm, kèm bong bóng chỉ vào nút | Dùng cho mọi lời nhắc và bài Làm quen thay cho hộp thông báo chữ | P0 |
| U5 | Chạy được ngay trong trình duyệt những khối không cần hub (âm thanh, chờ, lặp) | Lab chạy được **mọi khối** trên robot ảo: không bao giờ có nút Chạy bị khóa | P0 |
| U6 | Tiến độ trong bài: dãy chấm tròn kèm "1/2" cho bước con, luôn hiện ở trên cùng kể cả khi thu gọn | Thanh 5 chặng (mục 4), mỗi chặng có chấm bước con; luôn hiện | P0 |
| U7 | Thẻ "Khối" ngay cạnh thẻ "Bài học", giải thích từng khối có hình | Trợ giúp trên khối (R5) cộng một thẻ "Khối" trong bài | P1 |
| U8 | Dự án tự lưu, hiện ở "Gần đây" trên trang chủ | "Dự án của em" (mục 7), lưu theo em trên máy chủ, không chỉ trên trình duyệt | P0 |
| U9 | Nút Chạy/Dừng to (60–74 px), cố định ở góc dưới phải vùng ghép khối | Nút Chạy/Dừng/Từng bước ≥ 64 px, luôn một chỗ ở mọi bài và ở Phòng lập trình | P0 |

### 11.2. LEGO còn yếu, Lab làm tốt hơn

| LEGO (đã thấy trên app) | Lab |
|---|---|
| Hướng dẫn lắp là **ảnh 2D tĩnh**, không xoay, không phóng to | Lắp **3D xoay và phóng to được**, chi tiết mới làm nổi; giữ lợi thế này |
| Tải lại trang là **quên đang ở bước mấy** (cả bài học lẫn bước lắp) | Nhớ chặng và bước của em, lưu theo em, mở ở máy khác vẫn đúng chỗ |
| Không có hub thì khối động cơ bị bỏ qua mà nút vẫn báo "đang chạy" mãi | Robot ảo luôn có; chạy xong thì nút tự trở về |
| SPIKE Prime mặc định tạo dự án kiểu khối hình dù học sinh dùng khối chữ | Kiểu khối mặc định theo lớp của em (mục 6) |
| Hộp kết nối hub chiếm cả màn hình | Không cần kết nối; chấm "Robot sẵn sàng" chỉ để báo |


---

## 12. Câu hỏi còn mở

1. ~~Khối có giống app ZMROBO?~~ ĐÃ TRẢ LỜI 2026-11-03: dùng được cho nhiều bộ kit, cả ZMROBO lẫn LEGO, nên khối không gắn với hãng nào và mỗi kit có hồ sơ riêng (mục 6).
2. Ở nhà, em có được mở **bài chưa học trên lớp** không, hay chỉ những bài giáo viên đã mở?
3. Ghi âm trong sổ ghi chép: có cần không, khi nó làm việc lưu dữ liệu trẻ em phức tạp hơn?
4. Ba bài "Làm quen": làm chung cho cả lớp 1 và lớp 3, hay mỗi khối một bộ?
