# Phòng lập trình chung (Code Lab) – thiết kế

Cập nhật: 2026-11-02 · Trạng thái: **CHỜ DUYỆT** · Nguồn nghiên cứu: mục 2, báo cáo Codex `docs/giao-viec/71-bao-cao-codex.md`.

## 1. Đã chốt với người dùng (2026-11-02)

| Câu hỏi | Trả lời |
|---|---|
| Tham khảo | **RoboSim của ZMROBO** (robosim.zmrobo.net) – phần mềm giả lập giáo viên cho xem; thêm VEXcode VR, Open Roberta Lab |
| Phạm vi | **Một khu "Phòng lập trình" dùng chung**, tách khỏi bài học. 16 bài hiện có giữ nguyên |
| Khối lệnh | **Hai cấp.** Bé (Lớp 1): khối ngang biểu tượng như hiện nay. Lớp 3+: vẫn xếp ngang, dễ chạm, thêm Lặp n lần, Nếu/Không thì, Chờ đến khi, tốc độ −100…100 |
| Sa bàn | **2D trước, 3D sau** – một trạng thái chung, 3D chỉ là lớp hiển thị |
| Bản đầu (MVP) | Chạy từng khối + bảng cảm biến · Bản đồ thử thách có sẵn · Lưu/chia sẻ chương trình · Giáo viên tự vẽ sa bàn |
| Robot ảo | **Theo kit Alpha 330** (xe 2 động cơ, cảm biến chạm, sóng âm, dò vạch/màu, đèn, loa, màn LED). Sau này mở rộng như RoboSim (servo, dò vạch nhiều kênh, camera AI) |

## 2. RoboSim làm gì (sổ tay chính thức www.yuque.com/zmrobo/robosim)

- 5 chức năng ở màn hình chính: thi trực tuyến, luyện theo chủ đề, lắp tự do, tài nguyên khóa học, **thiết kế sa bàn**. Trong một sa bàn có 4 nút: Về trang chủ · **Lắp robot** · **Viết chương trình** · **Mô phỏng** (có vật lý).
- Lắp robot: 10 nhóm chi tiết (robot mẫu, dầm, chốt, trục, bánh răng, điện tử…), gắn cảm biến và chọn cổng P1–P4. File robot `.rsr`.
- Lập trình: khối **xếp dọc** kiểu Scratch, kèm ô xem mã Python/C. File chương trình `.rsp`. Có 9 nhóm khối:
  - Bộ điều khiển: Nhiệm vụ 1, đồng hồ, còi.
  - Động cơ: M1 tốc độ −100…100, servo theo góc.
  - Cảm biến: chạm, quang (0–4095), màu, sóng âm (0–180 cm, ngoài tầm trả 888), đèn màu.
  - AI thị giác.
  - Âm thanh.
  - Card dò vạch: đi theo vạch theo thời gian hoặc số độ quay, rẽ đến khi gặp vạch, nhận ngã ba chữ T.
  - Di chuyển: tiến/rẽ với tốc độ trong n giây hoặc n độ, dừng.
  - Hiển thị biến.
  - Điều khiển: Chờ n giây, Lặp n lần, Lặp mãi, Nếu/Không thì.
- Thiết kế sa bàn: ảnh nền (có thể kèm ảnh "dò lệch vạch"), kéo thả đạo cụ nhiệm vụ (điểm xuất phát, đích…), xoay bằng phím mũi tên, lưu file `.RSM`.
- Lớp học: giáo viên tạo lớp, giao bài, xem báo cáo học tập; học sinh vào lớp, học, thực hành.
- Bản web robosim.zmrobo.net là React; phần giả lập nạp từ oss.zmrobo.com (bản PC chỉ chạy Windows).

**Ta học theo:** vòng làm việc trong một sa bàn (lắp/chọn thiết bị → viết chương trình → mô phỏng), bộ khối có cấu trúc, thiết kế sa bàn bằng ảnh nền + đạo cụ. Phần chạy từng khối và bảng cảm biến học theo VEXcode VR.
**Ta không làm:** lắp robot tự do từ chi tiết, AI thị giác, thi đấu toàn quốc. Ta dùng khối ngang thay cho khối dọc để hợp với máy tính bảng và Lớp 1.

## 3. Kiến trúc

```
code-lab.html  ── js/code-lab/
  program.ts     Chương trình: chuỗi khối ngang ⇄ cây lệnh (AST) + kiểm lỗi, báo đúng khối sai
  interpreter.ts Thông dịch cây lệnh: tick(dt), step(), pause(), tốc độ 0.25×/1×/2×; tô khối đang chạy
  robot.ts       Hồ sơ robot Alpha 330 + trạng thái (x, y, θ, M1, M2, đèn, LED, loa)
  world.ts       Sa bàn: tường, vật cản, vạch, vùng màu, đích, hộp đẩy được; va chạm; đọc cảm biến
  missions.ts    Luật chấm theo sự kiện (tới đích, không đụng, ≤ n giây, ≤ n khối…) → sao 1–3
  view2d.ts      Vẽ canvas 2D (chỉ đọc trạng thái); vệt bánh xe; tia sóng âm
  sensor-panel.ts Bảng số đo trực tiếp: M1/M2, sóng âm cm, chạm, vạch trái/phải, màu, thời gian
  editor.ts      Mở rộng js/blocks-engine.js cho cấp Lớp 3 (khối có tham số, cặp mở/đóng)
  map-editor.ts  Trình vẽ sa bàn cho giáo viên
  storage.ts     Tự lưu localStorage, xuất/nhập file .json, gửi lên lớp (Supabase)
content/code-lab/maps/*.json   Sa bàn có sẵn
```

Nguyên tắc:
- **Lõi không chạm DOM.** program, interpreter, robot, world và missions chạy được trong Node để test (giống `tests/engine-fuzz.test.js`).
- **Bước thời gian cố định 1/60 s, số ngẫu nhiên có hạt giống** → cùng chương trình cho cùng kết quả, chấm điểm tin được.
- Ngữ nghĩa khối giống `js/lesson-engine.js`: mức Bé 4/6/8, Chờ có thời lượng, "Chờ nhấn nút" là khối chặn. Lặp có ghép cặp và có lặp lồng nhau, như bản đã sửa ngày 2026-11-02.
- **Chặn treo máy:** mỗi khung hình chạy tối đa N khối tức thời. Vòng lặp không có khối tốn thời gian thì nhường sang khung sau. Mỗi sa bàn có thời gian tối đa.
- File mới viết TypeScript (theo `docs/kien-truc.md`); trang mới dùng chung `css/lab.css`.

### 3.1 Khối lệnh hai cấp (vẫn xếp ngang)

| Nhóm | Bé (Lớp 1) | Lớp 3+ |
|---|---|---|
| Bắt đầu | Start | Start |
| Di chuyển | Tiến, Lùi, Rẽ trái, Rẽ phải (chậm/vừa/nhanh = 4/6/8) | Di chuyển (hướng, tốc độ −100…100) trong n giây · M1/M2 tốc độ riêng |
| Dừng / Chờ | Dừng, Chờ 1–5 s | Chờ n s · **Chờ đến khi** ‹điều kiện› |
| Lặp | Bắt đầu lặp … Lặp lại (lặp mãi) | **Lặp n lần [ … ]** · Lặp mãi |
| Rẽ nhánh | – | **Nếu ‹điều kiện› [ … ] Không thì [ … ]** |
| Cảm biến | Chờ vật cản, Chờ nhấn nút | Điều kiện: sóng âm ‹ / › n cm · chạm được nhấn · vạch trái/phải thấy đen · màu = ‹đỏ/xanh/…› |
| Hiển thị | Âm thanh A/B, Mặt cười/buồn/tim | + Đèn màu, hiện số trên LED |

Trên dải ngang, khối có thân (Lặp n, Nếu) hiện thành **cặp khối mở/đóng cùng màu**, phần giữa được gạch dưới, giống cách "Nếu thấy vật lạ … Hết Nếu" đang có. "Không thì" là khối ngăn giữa. Tham số chỉnh bằng cách chạm để đổi (số, hướng) hoặc mở bảng chọn lớn. Không cần gõ phím.

### 3.2 Định dạng chương trình (lưu / chia sẻ)

```json
{ "v": 1, "map": "me-cung-1", "level": "lop3",
  "blocks": [ {"t":"start"}, {"t":"repeat","n":4}, {"t":"move","dir":"fwd","speed":60,"sec":1},
              {"t":"turn","dir":"left","speed":40,"sec":0.5}, {"t":"end"} ] }
```
Dữ liệu lưu là chuỗi khối phẳng, cấu trúc cây do `program.ts` dựng khi chạy. Nhờ vậy dải khối ngang không phải đổi kiểu dữ liệu.

### 3.3 Định dạng sa bàn

```json
{ "id": "do-vach-1", "name": "Dò vạch", "size": [200, 150], "bg": "#f4f1e8", "image": null,
  "start": {"x": 20, "y": 75, "dir": 0},
  "items": [ {"k":"line","pts":[[20,75],[120,75],[160,30]],"w":2},
             {"k":"wall","x":0,"y":0,"w":200,"h":2}, {"k":"box","x":90,"y":40,"w":10,"h":10,"push":true},
             {"k":"zone","x":170,"y":20,"w":20,"h":20,"color":"green","goal":true} ],
  "sensors": ["ultrasonic", "line", "touch"], "blocks": "lop3",
  "rules": { "goal": true, "noCrash": true, "stars": {"time": [30, 20], "blocks": 10} } }
```
Đơn vị là cm. Xe Alpha 330: bánh Ø5 cm, 150 vòng/phút ở mức 8 → **39,3 cm/giây** (đúng như `js/bai02/race-engine.js`); khoảng cách hai bánh đo lại từ mô hình 3D của bài xe.

### 3.4 Lưu và chia sẻ

- Tự lưu vào localStorage theo từng sa bàn. Có nút **Xuất / Nhập file** `.zmcode.json`.
- **Gửi cho lớp:** ghi một dòng vào bảng `attempts` hoặc `notebook_revisions` đã có trong Supabase, kèm chương trình, số sao và thời gian. Cần xem lại lược đồ trước khi chọn bảng. Giáo viên mở lại và chạy được chương trình đó.
- Sa bàn do giáo viên vẽ lưu cùng kiểu; nếu cần bảng mới thì viết migration riêng.

## 4. Sa bàn có sẵn (bản đầu: 8)

| # | Tên | Học gì | Cấp |
|---|---|---|---|
| 1 | Về đích | Tiến n giây, Dừng | Bé |
| 2 | Góc vuông | Rẽ, thời gian rẽ | Bé |
| 3 | Hình vuông | Lặp 4 lần | Bé/L3 |
| 4 | Mê cung nhỏ | Trình tự nhiều khối | Bé/L3 |
| 5 | Dừng trước tường | Chờ đến khi sóng âm < 15 cm | L3 |
| 6 | Tránh vật cản | Lặp mãi + Nếu/Không thì | L3 |
| 7 | Dò vạch | Vạch trái/phải, hai động cơ | L3 |
| 8 | Đẩy hộp vào kho | Kết hợp tất cả | L3 |

Mỗi sa bàn có: mô tả 1–2 câu, chương trình gợi ý giáo viên được xem, và 3 sao (tới đích · dưới thời gian · ít khối).

## 5. Giao diện (máy tính bảng ngang)

```
┌───────────── thanh trên: ← Phòng lập trình · tên sa bàn · ★★☆ · Bé/Lớp 3 ─────────────┐
│  SA BÀN 2D (60%)                                │ BẢNG CẢM BIẾN                        │
│  xe, vạch, tường, tia sóng âm, vệt đường đi     │ M1 60  M2 60  · sóng âm 42 cm        │
│                                                 │ chạm ○ · vạch ●○ · màu xanh · 3,2 s  │
├──────────────── ▶ Chạy  ⏯ Từng khối  ⏸  ⟲  tốc độ 0.25× 1× 2× ─────────────────────────┤
│  DẢI KHỐI NGANG (khối đang chạy sáng lên)                                              │
│  KHAY KHỐI theo nhóm: Di chuyển · Chờ · Lặp · Nếu · Cảm biến · Hiển thị                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

## 6. Lộ trình

| Giai đoạn | Nội dung | Ai làm | Xong khi |
|---|---|---|---|
| P1 Lõi | program + interpreter + robot + world + missions, test Node (đúng/sai, fuzz, không treo) | Codex | Test chấm 8 sa bàn bằng chương trình mẫu đạt; fuzz không lỗi |
| P2 Trang | code-lab.html, view2d, sensor-panel, chạy/từng khối/tốc độ; dùng khối Bé hiện có | Codex + Antigravity (hình xe, đạo cụ) | Chơi được sa bàn 1–4 trên máy tính bảng; smoke Playwright |
| P3 Khối Lớp 3 | Lặp n, Nếu/Không thì, Chờ đến khi, tham số −100…100, điều kiện cảm biến | Codex, Claude duyệt ngữ nghĩa | Sa bàn 5–8 đạt |
| P4 Lưu/chia sẻ | localStorage, xuất/nhập, gửi lên lớp qua Supabase | Codex, Claude duyệt RLS | Giáo viên mở lại bài của học sinh |
| P5 Vẽ sa bàn | Map editor: ảnh nền, vẽ vạch, kéo thả tường/hộp/đích, chọn cảm biến, đặt luật sao | Codex + Antigravity (giao diện) | Giáo viên tạo sa bàn mới không cần sửa code |
| P6 3D | Góc nhìn 3D dùng mô hình xe từ bài lắp, cùng trạng thái 2D | Codex | Bật/tắt 3D không đổi kết quả |
| Sau | Servo, dò vạch nhiều kênh, chọn cổng P1–P4, xem mã Python như RoboSim | – | – |

Vẫn theo quy trình cũ: mỗi giai đoạn có phiếu trong `docs/giao-viec/`, chạy qua hàng đợi, Claude duyệt và chạy `npm test` trước khi gộp.

## 7. Câu hỏi còn mở (không chặn P1)

1. Nên lấy khoảng cách hai bánh và tốc độ rẽ từ bài xe nào (Lớp 1 Bài 13 xe gạt tuyết hay Lớp 1 Bài 19 ốc sên)? Đề xuất: lấy Bài 13.
2. Trang chủ đặt lối vào Phòng lập trình ở đâu: thẻ riêng trên trang chọn bài, hay mở khóa sau khi học xong một số bài?
3. Có cần giáo viên khóa/mở từng sa bàn theo lớp như bảng `class_unlocks` đang làm với bài học không?
