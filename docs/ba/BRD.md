# BRD — Happy STEAM Lab

Phiên bản 0.2 · 2026-11-01 · Người viết: Claude (vai BA) cùng chủ sản phẩm.
Tài liệu nghiệp vụ, không nói về công nghệ. Quyết định kỹ thuật nằm ở `docs/kien-truc.md`.

**Thay đổi ở v0.2** (theo góp ý của thầy, 2026-11-01):

- Lập trình có **hai kiểu xem** cho cùng một chương trình: khối ngang ZMrobo và khối dọc kiểu Scratch. Cả hai kiểu đều kéo thả được (GD-15, F-10).
- Dự án được đánh giá từ **ba nguồn**: giáo viên, các bạn trong lớp, và khách đến lớp quét phiếu QR. Đánh giá của các bạn và khách chỉ để tham khảo (GD-16 – GD-19, F-11 – F-14).

---

## 0. Thay đổi phạm vi & sổ giả định

### 0.1. Thay đổi so với hiện trạng

| Thay đổi | Vì sao |
|---|---|
| Thêm tài khoản Giáo viên, Phụ huynh; Lớp; danh sách học sinh | Học sinh học cả trên lớp lẫn ở nhà, giáo viên chấm từng em → phải biết "ai làm" và tiến độ phải theo em, không theo máy |
| Kết quả không còn gửi một chiều lên bảng tính; lưu tập trung, giáo viên chấm trong ứng dụng, xuất được ra bảng tính | Bảng tính không phân quyền theo giáo viên và không đọc ngược tiến độ về máy ở nhà được |
| Bài tự mở theo lịch tuần của từng lớp | Chủ sản phẩm chọn (thay cho "mở hết") |
| Đánh giá theo Hoàn thành tốt / Hoàn thành / Chưa hoàn thành | Chủ sản phẩm chọn; khớp quy định đánh giá tiểu học |
| Dự án nhóm lưu tập trung thay cho lưu trên một máy | Nhóm làm tiếp ở nhà và trên nhiều máy |
| **(v0.2)** Lập trình: thêm kéo thả, thêm kiểu khối dọc (Scratch) bên cạnh khối ngang (ZMrobo) | Hiện em chỉ chạm để thêm khối vào **cuối** chương trình, đổi chỗ bằng ◀ ▶. Thầy muốn em kéo thả được như phần mềm thật, và em lớn làm quen kiểu Scratch |
| **(v0.2)** Phòng trưng bày lưu tập trung; các bạn và khách chấm sao theo tiêu chí, kèm câu nhận xét | Hiện cả lớp bấm sao trên một máy chiếu, số sao mất khi tắt trang và không biết ai chấm. Thầy muốn có đánh giá từ giáo viên, các bạn và khách đến lớp |

### 0.2. Sổ giả định

| Mã | Giả định | Chi phí nếu đổi |
|---|---|---|
| GD-01 | **(ĐÃ SỬA)** Một Lớp có đúng một giáo viên **chủ lớp** và 0..n giáo viên **phụ** (qua Phân công giáo viên). Giáo viên phụ mở buổi học và chấm được; chỉ chủ lớp mời/gỡ giáo viên, sửa danh sách, kết thúc hoặc chuyển chủ lớp | Trung bình — thêm vai trò thứ ba (ví dụ "chỉ xem") là thêm một giá trị và sửa bảng quyền |
| GD-14 | **(MỚI)** Trước khi phụ huynh đồng ý, hệ thống chỉ lưu dữ liệu **không định danh**: tên gọi ngắn + ảnh con vật + tiến độ + mức đánh giá. Họ tên đầy đủ, ngày sinh, nhận xét chỉ lưu sau khi phụ huynh đồng ý | Lớn — đổi sang "lưu hết rồi xin đồng ý sau" là rủi ro pháp lý về dữ liệu trẻ em |
| GD-02 | Không có vai trò Quản trị trung tâm. Mỗi giáo viên tự đăng ký và tự quản lý lớp mình | Trung bình — thêm Trung tâm/Trường làm cấp trên của Lớp; làm ngay từ đầu thì rẻ (xem 11) |
| GD-03 | Học sinh không có tài khoản đăng nhập riêng. Ở nhà vào qua tài khoản Phụ huynh; trên lớp vào qua Buổi học do giáo viên mở | Lớn — nếu sau này học sinh lớn (Lớp 3–5) cần tự đăng nhập, phải thêm danh tính học sinh và luồng mật khẩu |
| GD-04 | Một học sinh tại một thời điểm chỉ thuộc một Lớp đang hoạt động | Trung bình — nếu em học hai lớp (ví dụ lớp chính + câu lạc bộ) thì Bài làm phải gắn thêm Lớp |
| GD-05 | Tiến độ nhiệm vụ chỉ tăng: nhiệm vụ đã xong ở máy nào thì xong ở mọi máy. Gộp, không ghi đè | Nhỏ |
| GD-06 | Mức đánh giá máy gợi ý chỉ tính từ nhiệm vụ **cơ bản**; nhiệm vụ **Nâng cao** không ảnh hưởng mức, chỉ hiện để giáo viên tham khảo | Nhỏ — đổi công thức ở mục 6 |
| GD-07 | Sổ dự án nhóm: mọi thành viên sửa được ở mọi nơi; hai người sửa cùng lúc thì bản lưu sau thắng, có lịch sử phiên bản để lấy lại | Trung bình — đổi sang "chỉ sửa trên lớp" thì đơn giản hơn; đổi sang sửa đồng thời thời gian thực thì tốn nhiều |
| GD-08 | **(ĐÃ SỬA 2 lần)** Lớp 1 và Lớp 3 dùng chung bộ loại bài. Theo khung chương trình (`js/catalog.js`), Lớp 3 có 31 bài mô hình + Ôn tập/Kiểm tra mỗi học kì (tuần 17–18, 34–35), **không có tuần dự án/trưng bày**. Cây thư mục Drive chỉ có tài liệu cho bài mô hình và Kiểm tra HK II | Nhỏ — chỉ là dữ liệu danh mục |
| GD-09 | Kiểm tra học kì chấm theo cùng thang 3 mức, không có điểm 10 | Nhỏ |
| GD-10 | Dữ liệu một năm học giữ 2 năm sau khi lớp kết thúc, rồi xoá; phụ huynh yêu cầu xoá thì xoá ngay | Nhỏ — chỉ là luật dọn dữ liệu |
| GD-11 | Mã Buổi học 4 chữ số, hiệu lực 90 phút | Nhỏ |
| GD-12 | Mã mời phụ huynh dùng được nhiều lần cho tới khi giáo viên thu hồi; tối đa 2 phụ huynh mỗi em | Nhỏ |
| GD-13 | Ứng dụng luôn có mạng. Mất mạng giữa chừng: thao tác đang làm giữ trên máy và gửi lại khi có mạng; không làm chế độ ngoại tuyến đầy đủ | Trung bình |
| GD-15 | **(v0.2)** **Một chương trình, hai kiểu xem.** Chương trình chỉ lưu một bản. Kiểu ZMrobo (ngang) và kiểu Scratch (dọc) là hai cách hiển thị cùng bản đó, đổi qua lại không mất khối. Hai kiểu dùng chung hộp lệnh của bài và chạy y hệt nhau. Kiểu mặc định là **ngang (ZMrobo)** cho mọi khối lớp, giống phần mềm thật các em dùng trên lớp. Kiểu dọc là lựa chọn thêm. Em tự đổi được, trừ khi giáo viên khoá một kiểu cho lớp | Lớn — nếu đổi sang "mỗi kiểu một chương trình riêng" thì phải lưu hai bản, tính lại cách chấm M2/M3 và cách gộp khi hai máy cùng sửa |
| GD-16 | **(v0.2)** Sao và nhận xét của các bạn và khách **chỉ để tham khảo**: không vào công thức mức gợi ý (mục 6.2), giáo viên xem bên cạnh ô chấm rồi tự chọn mức | Trung bình — nếu muốn tính vào mức thì phải chốt trọng số và cách xử lý khi nhóm có quá ít lượt chấm |
| GD-17 | **(v0.2)** Khách **không đăng nhập** và không để lại thông tin cá nhân. Chống trùng bằng **phiếu khách in sẵn**: mỗi phiếu có mã QR riêng, mỗi phiếu chấm mỗi nhóm **một lần** (chấm lại thì ghi đè), và được chấm nhiều nhóm | Trung bình — đổi sang "QR chung + nhớ theo điện thoại" thì bỏ được bước in phiếu nhưng người cố ý vẫn chấm trùng được |
| GD-18 | **(v0.2)** Bộ tiêu chí chấm sao do **giáo viên đặt cho từng buổi trưng bày**, dùng chung cho cả ba nguồn (giáo viên, bạn, khách). Hệ thống điền sẵn mẫu 3 tiêu chí: Ý tưởng · Mô hình chạy được · Trình bày. Thang **1–3 sao** để vừa với trẻ Lớp 1 | Nhỏ — thang 5 sao chỉ đổi quy tắc kiểm tra và cách hiển thị |
| GD-19 | **(v0.2)** Nhận xét: **sao và câu mẫu** (chọn từ danh sách có sẵn) hiện ngay cho nhóm. **Chữ tự gõ** chỉ hiện sau khi giáo viên duyệt. Các bạn Lớp 1 chỉ dùng câu mẫu, không gõ chữ. Khách được gõ tối đa 200 ký tự | Nhỏ |
| GD-20 | **(v0.2)** Các bạn chấm **ẩn danh với nhóm**: nhóm chỉ thấy "Một bạn trong lớp", còn giáo viên thấy tên người chấm. Mỗi em **tự chọn** nhóm để chấm (mọi nhóm trừ nhóm mình), mỗi nhóm một lần | Nhỏ — đổi sang "máy chia 2–3 nhóm" chỉ thêm bước phân công khi mở buổi |
| GD-21 | **(v0.2)** Giáo viên chấm sao theo tiêu chí là **không bắt buộc**. Đánh giá chính thức của giáo viên vẫn là mức HTT/HT/CHT + nhận xét (F-06) | Nhỏ |
| GD-22 | **(v0.2)** Màn chiếu trưng bày **có bảng xếp hạng** (chủ sản phẩm chọn, 2026-11-01), mặc định bật, giáo viên tắt được cho từng buổi. Xếp theo điểm xếp hạng 6.6. Nhóm có dưới 3 lượt chấm thì ghi "Chưa xếp hạng" | Nhỏ — đổi cách tính chỉ đổi mục 6.6 |

---

## 1. Tổng quan

### 1.1. Mục tiêu — sau MVP người dùng làm được 9 việc

1. Giáo viên tạo lớp, nhập danh sách học sinh, đặt lịch tuần.
2. Giáo viên mở Buổi học; học sinh trên lớp vào bằng mã + chọn tên trong ≤ 20 giây.
3. Phụ huynh liên kết với con bằng mã mời và cho con học tiếp ở nhà.
4. Học sinh làm bài (lắp 3D → sáng tạo → lập trình & thử) và tiến độ theo em ở mọi máy.
5. Nhóm học sinh làm dự án 4 tuần, nộp poster, trưng bày.
6. Giáo viên xem bảng tiến độ lớp và chấm mức + nhận xét cho từng em × từng bài.
7. Giáo viên xuất kết quả lớp ra bảng tính; phụ huynh xem mức và nhận xét của con.
8. **(v0.2)** Học sinh lập trình bằng kéo thả, chọn kiểu khối ngang (ZMrobo) hoặc khối dọc (Scratch) cho cùng một chương trình.
9. **(v0.2)** Trong buổi trưng bày, các bạn trong lớp và khách (quét phiếu QR) chấm sao theo tiêu chí và để lại nhận xét. Nhóm đọc được nhận xét đã duyệt, giáo viên xem tổng hợp khi chấm.

### 1.2. Trong phạm vi
- Lớp 1 (kit ZM Alpha 330) và Lớp 3 (kit ZM Alpha Set A — cùng kit Alpha 330 của Lớp 1, mã JMC-NY-2321AE), 35 tuần mỗi khối.
- Vai trò: Giáo viên, Phụ huynh, Học sinh (không đăng nhập riêng — GD-03).
- Bài làm, Đánh giá, Dự án nhóm, Trưng bày.
- Xuất bảng tính.
- **(v0.2)** Hai kiểu lập trình (ngang / dọc) có kéo thả; đánh giá dự án từ ba nguồn (giáo viên, bạn, khách).
- **(v0.2)** Khách là người không có tài khoản. Khách chỉ dùng được màn hình chấm qua phiếu QR (S-16) và không thấy gì khác.

### 1.3. Ngoài phạm vi
- Lớp 2, 4, 5 (khung cho phép thêm sau).
- Trang soạn bài cho giáo viên (nội dung bài do đội phát triển đưa vào — xem 11).
- Báo cáo học kì tự động gửi phụ huynh (MVP chỉ có trang phụ huynh xem; gửi định kỳ để sau).
- Nhắn tin giáo viên ↔ phụ huynh.
- Thanh toán, gói dịch vụ.
- Chế độ ngoại tuyến đầy đủ (GD-13).
- **(v0.2)** Khối lệnh mới chỉ có ở kiểu Scratch (biến, phép toán, sự kiện…). Hai kiểu luôn dùng chung một hộp lệnh (GD-15).

---

## 2. Mô hình dữ liệu

### 2.1. Danh sách thực thể

| Thực thể | Vai trò |
|---|---|
| Giáo viên | Người có tài khoản, sở hữu lớp |
| Phụ huynh | Người có tài khoản, xem và cho con học ở nhà |
| Học sinh | Một em, tồn tại qua nhiều năm học |
| Lớp | Một khối × một năm học, có lịch tuần |
| Phân công giáo viên | **Thực thể nối theo thời gian**: Giáo viên ↔ Lớp, vai trò chủ lớp / phụ (GD-01) |
| Đồng ý của phụ huynh | Bản ghi phụ huynh đồng ý cho lưu dữ liệu định danh của con (GD-14) |
| Ghi danh | **Thực thể nối theo thời gian**: Học sinh ↔ Lớp trong một khoảng thời gian |
| Liên kết phụ huynh | Phụ huynh ↔ Học sinh |
| Mã mời | Mã giáo viên phát cho từng em để phụ huynh liên kết |
| Tuần nghỉ | Tuần lớp không học |
| Buổi học | Một tiết trên lớp, có mã vào |
| Bài | Một bài trong chương trình (khối, học kì, tuần, loại) |
| Phiên bản bài | Nội dung cụ thể của bài tại một thời điểm (nhiệm vụ, khối lệnh…) |
| Bài làm | **Thực thể nối theo thời gian**: Ghi danh × Bài; tiến độ của em |
| Đánh giá | Mức + nhận xét giáo viên cho một Bài làm |
| Nhóm dự án | Nhóm học sinh trong một Lớp cho một đợt dự án |
| Thành viên nhóm | Học sinh ↔ Nhóm, có vai trò, có thời gian |
| Sổ dự án | Nội dung dự án của nhóm (ý tưởng, chương trình, poster), có lịch sử phiên bản |
| **Buổi trưng bày** (v0.2) | Khoảng thời gian giáo viên mở cho cả lớp và khách chấm các nhóm của một đợt dự án; giữ bộ tiêu chí của buổi |
| **Phiếu khách** (v0.2) | Một mã QR in sẵn thuộc một Buổi trưng bày, thay cho danh tính của một khách |
| **Lượt chấm** (v0.2) | Một người (giáo viên / bạn / khách) chấm một Nhóm trong một Buổi trưng bày: sao theo tiêu chí, câu mẫu, chữ tự gõ |
| **Câu mẫu** (v0.2) | Danh sách câu khen / góp ý có sẵn để chọn thay vì gõ chữ |

### 2.2. Chi tiết thuộc tính

**Giáo viên**: mã, họ tên, email đăng nhập, ngày tạo.

**Phụ huynh**: mã, họ tên, email đăng nhập, ngày tạo.

**Học sinh**: mã, tên gọi ngắn (hiện trên nút chọn tên, bắt buộc), ảnh con vật (bắt buộc), họ tên đầy đủ (chỉ khi đã có đồng ý), ngày sinh (chỉ khi đã có đồng ý, không bắt buộc), trạng thái đồng ý (tính tự động: `chưa | đã đồng ý`), trạng thái `đang học | đã xoá`.

> **Vì sao giáo viên chỉ nhập tên gọi ngắn khi tạo lớp.** GD-14: chưa có đồng ý thì chưa được lưu họ tên đầy đủ. Tên gọi ngắn kiểu "Nam B." đủ để giáo viên và em nhận ra nhau, nhưng không đủ định danh một đứa trẻ ngoài lớp. Họ tên đầy đủ do phụ huynh xác nhận khi đồng ý.

**Lớp**: mã, tên (ví dụ "1A – 2026"), khối `1 | 3`, năm học, đơn vị (để trống — mục 11), ngày học tuần 1, trạng thái `đang mở | đã kết thúc`.

**Phân công giáo viên**: lớp, giáo viên, vai trò `chủ lớp | phụ`, từ ngày, tới ngày (trống khi còn hiệu lực).

> **Vì sao Phân công có thời gian.** Giáo viên phụ dạy thay 2 tuần rồi rời. Đánh giá họ đã chấm phải vẫn ghi tên họ, nhưng họ không còn vào lớp được.

**Đồng ý của phụ huynh**: học sinh, phụ huynh, đồng ý lúc, nội dung điều khoản (sao chép văn bản tại thời điểm đồng ý), rút lại lúc (trống nếu còn hiệu lực).

**Ghi danh**: mã, học sinh, lớp, ngày vào, ngày ra (trống khi còn học), trạng thái `đang học | đã rời`.

> **Vì sao Bài làm gắn với Ghi danh chứ không gắn thẳng với Học sinh.** Em học 1A năm nay, lên Lớp 3 hai năm sau. Đánh giá phải hiện dưới đúng lớp và đúng giáo viên đã chấm. Nếu gắn thẳng vào Học sinh, khi em chuyển lớp giữa năm, giáo viên mới sẽ thấy và sửa được đánh giá của giáo viên cũ.

**Liên kết phụ huynh**: phụ huynh, học sinh, ngày liên kết, mã mời đã dùng.

**Mã mời**: mã (8 ký tự), học sinh, tạo bởi giáo viên, trạng thái `hiệu lực | đã thu hồi`, số lần đã dùng.

**Tuần nghỉ**: lớp, ngày bắt đầu tuần (thứ Hai), ghi chú ("Tết").

**Buổi học**: mã, lớp, mã vào (4 chữ số), mở lúc, hết hạn lúc, trạng thái `đang mở | đã đóng`.

**Bài**: mã (ví dụ `lop1-bai09`), khối, học kì, số tuần, tên, loại `mô hình | dự án | trưng bày | lý thuyết | kiểm tra`, phiên bản hiện hành, trạng thái `sắp có | đã có`.

**Phiên bản bài**: bài, số phiên bản, danh sách nhiệm vụ (mã, tên, `cơ bản | nâng cao`), ngày phát hành.

> **Vì sao cần Phiên bản bài.** M3 của Bài 9 hôm nay là "tránh thiên thạch". Nếu năm sau đổi nhiệm vụ, các Bài làm cũ vẫn phải đọc đúng nghĩa của M3 lúc em làm. Bài làm trỏ tới phiên bản, không trỏ tới "bài hiện tại".

**Bài làm**: mã, ghi danh, bài, phiên bản bài (đóng băng lúc bắt đầu), nhiệm vụ đã xong (danh sách mã + thời điểm xong), chế độ đã dùng `bé | nâng cao`, chương trình khối lệnh gần nhất, gói sáng tạo đã chọn, bắt đầu lúc, cập nhật lúc, trạng thái (tính tự động — mục 3).

**Đánh giá**: bài làm, mức `HTT | HT | CHT`, mức máy gợi ý (sao chép lúc chấm), nhận xét (≤ 500 ký tự), giáo viên chấm, chấm lúc, nguồn `chấm trực tiếp | chép từ nhóm`.

> **Vì sao lưu cả mức máy gợi ý trong Đánh giá.** Công thức gợi ý có thể đổi (GD-06). Khi phụ huynh hỏi "sao con chỉ Hoàn thành", giáo viên cần thấy lúc chấm máy gợi ý gì.

**Nhóm dự án**: mã, lớp, bài dự án (đợt), tên nhóm, tạo bởi `giáo viên | học sinh`, trạng thái `đang làm | đã nộp`.

**Thành viên nhóm**: nhóm, học sinh, vai trò (tự do, ví dụ "thợ lắp"), ngày vào, ngày rời.

**Sổ dự án**: nhóm, giai đoạn hiện tại `ý tưởng | chế tạo | poster | chia sẻ`, nội dung từng giai đoạn, danh sách phiên bản (người lưu, thời điểm).

**Chương trình** (v0.2, là một trường của Bài làm và của Sổ dự án, không phải thực thể riêng): danh sách khối, trong đó khối Lặp / Nếu **chứa** các khối con. Thêm trường *kiểu xem gần nhất* `ngang | dọc` để mở lại đúng kiểu em đang dùng.

> **Vì sao lưu chương trình dạng có lồng, không lưu dạng "Bắt đầu lặp … Lặp lại".** Dạng lồng chuyển sang kiểu ngang luôn đúng: chỉ cần mở khối và đóng khối. Chiều ngược lại thì gặp chương trình thiếu khối đóng, phải có luật sửa (mục 6.5). Lưu dạng lồng nghĩa là chỉ phải sửa một lần, ngay lúc em kéo thả ở kiểu ngang.

**Lớp** thêm trường (v0.2): *kiểu lập trình* `tự chọn | chỉ ngang | chỉ dọc`, mặc định `tự chọn`.

**Buổi trưng bày**: mã, lớp, bài dự án (đợt), bộ tiêu chí (1–5 tên tiêu chí, có thứ tự), mở lúc, đóng lúc, tự đóng lúc (= mở lúc + 24 giờ), mở bởi giáo viên, trạng thái (mục 3).

**Phiếu khách**: mã (8 ký tự, như Mã mời), buổi trưng bày, số thứ tự trên tờ in, trạng thái `chưa dùng | đã dùng | đã thu hồi`, dùng lần đầu lúc.

**Lượt chấm**: buổi trưng bày, nhóm được chấm, nguồn `giáo viên | bạn | khách`, người chấm (giáo viên / ghi danh / phiếu khách, tuỳ theo nguồn), sao theo từng tiêu chí (1–3), các câu mẫu đã chọn (0–2), chữ tự gõ (≤ 200 ký tự, chỉ khách và giáo viên), trạng thái chữ `không có | chờ duyệt | đã duyệt | đã ẩn`, duyệt bởi, tạo lúc, sửa lúc.
**Khoá duy nhất:** (buổi trưng bày, nhóm, người chấm). Chấm lại thì ghi đè lên lượt cũ, không tạo lượt mới.

> **Vì sao người chấm "bạn" là Ghi danh, không phải Học sinh.** Giáo viên cần biết em nào chấm để xử lý khi em chấm bừa (GD-20). Ghi danh còn cho biết em có thuộc lớp này không (BR-TB-04).

**Câu mẫu**: mã, nội dung (≤ 60 ký tự), loại `khen | góp ý`, hiện cho `bạn | khách | cả hai`. Danh sách chung cho cả hệ thống. Bản nháp ở `docs/ba/cau-mau.md` (BA soạn, thầy duyệt).

---

## 3. Máy trạng thái

**Bài làm** (tính tự động, không ai đặt bằng tay):

```
 (chưa có) --em mở bài lần đầu--> ĐANG LÀM --đủ nhiệm vụ cơ bản--> XONG CƠ BẢN
                                     ^                                  |
                                     +------ em "Làm lại từ đầu" -------+
 ĐANG LÀM / XONG CƠ BẢN --giáo viên chấm--> ĐÃ CHẤM (thêm cờ, giữ trạng thái tiến độ)
 ĐÃ CHẤM --em xong thêm nhiệm vụ--> ĐÃ CHẤM + cờ "có tiến bộ mới" --giáo viên chấm lại--> ĐÃ CHẤM
```
"Làm lại từ đầu" xoá chương trình và mô hình trên màn hình, **không** xoá nhiệm vụ đã xong (GD-05).

**Ghi danh**: `ĐANG HỌC --giáo viên chuyển lớp / xoá khỏi lớp--> ĐÃ RỜI --giáo viên thêm lại--> ĐANG HỌC`.

**Lớp**: `ĐANG MỞ --chủ lớp kết thúc năm học--> ĐÃ KẾT THÚC --chủ lớp mở lại--> ĐANG MỞ`.

**Phân công giáo viên**: `ĐANG HIỆU LỰC --chủ lớp gỡ / giáo viên phụ tự rời--> ĐÃ KẾT THÚC --chủ lớp mời lại--> ĐANG HIỆU LỰC` (tạo bản ghi mới). Chủ lớp chỉ rời được sau khi chuyển vai chủ lớp cho người khác.

**Đồng ý (của mỗi học sinh)**: `CHƯA --một phụ huynh đồng ý--> ĐÃ ĐỒNG Ý --mọi phụ huynh đã đồng ý đều rút lại--> CHƯA`. Khi về CHƯA: xoá họ tên đầy đủ, ngày sinh, nhận xét; giữ tiến độ và mức.

**Buổi học**: `ĐANG MỞ --giáo viên đóng / hết hạn--> ĐÃ ĐÓNG` (trạng thái cuối; muốn học tiếp thì mở buổi mới).

**Nhóm dự án**: `ĐANG LÀM --nhóm nộp poster--> ĐÃ NỘP --giáo viên trả lại--> ĐANG LÀM`.

**Bài (với học sinh)**: `KHOÁ --tới tuần mở / giáo viên mở sớm--> MỞ`. Trạng thái `sắp có` của Bài (chưa có nội dung) hiện thẻ mờ bất kể tuần.

**Buổi trưng bày** (v0.2):

```
 CHUẨN BỊ --giáo viên bấm "Mở"--> ĐANG MỞ --giáo viên bấm "Đóng" / hết 24 giờ--> ĐÃ ĐÓNG
 (sửa tiêu chí,                      ^                                              |
  in phiếu)                          +------- giáo viên "Mở lại" (đếm lại 24 giờ) --+
```

Chỉ ĐANG MỞ mới nhận lượt chấm. Khi ĐÃ ĐÓNG, giáo viên vẫn duyệt chữ được. Tiêu chí chỉ sửa được khi chưa có lượt chấm nào (BR-TB-07).

**Phiếu khách**: `CHƯA DÙNG --lượt chấm đầu tiên--> ĐÃ DÙNG`. Giáo viên thu hồi được từ bất kỳ trạng thái nào → ĐÃ THU HỒI, và các lượt chấm của phiếu đó bị ẩn. Phiếu không dùng được ở buổi khác.

**Chữ tự gõ trong Lượt chấm**: `CHỜ DUYỆT --giáo viên duyệt--> ĐÃ DUYỆT`, `CHỜ DUYỆT / ĐÃ DUYỆT --giáo viên ẩn--> ĐÃ ẨN`. Nếu người chấm sửa chữ thì chữ quay về CHỜ DUYỆT. Sao và câu mẫu không qua bước duyệt (GD-19).

---

## 4. Cấu hình & tham số

| Tham số | Đặt ở | Thứ tự ưu tiên |
|---|---|---|
| Bài mở hay khoá với lớp | Lớp | Mở sớm thủ công của giáo viên → lịch tuần |
| Ngày học tuần 1, tuần nghỉ | Lớp | — |
| Nhiệm vụ cơ bản / nâng cao | Phiên bản bài | — |
| **(v0.2)** Kiểu lập trình được dùng | Lớp | Giáo viên khoá (`chỉ ngang` / `chỉ dọc`) → em tự chọn → ngang |
| **(v0.2)** Kiểu lập trình mở ra lần đầu | Bài làm / Sổ dự án | Kiểu xem gần nhất → ngang (ZMrobo) |
| **(v0.2)** Bộ tiêu chí sao | Buổi trưng bày | Giáo viên sửa → mẫu 3 tiêu chí (GD-18) |
| **(v0.2)** Hiện bảng xếp hạng trên màn chiếu | Buổi trưng bày | Giáo viên tắt → bật (GD-22) |
| **(v0.2)** Số phiếu khách | Buổi trưng bày | Giáo viên nhập khi in (mặc định 30); in thêm được khi đang mở |

**Đóng băng:** Bài làm sao chép số phiên bản bài khi em mở bài lần đầu. Đánh giá sao chép mức máy gợi ý khi giáo viên bấm lưu.

---

## 5. Luồng nghiệp vụ

**F-01 Giáo viên tạo lớp**
1. Giáo viên đăng nhập, bấm "Tạo lớp": tên, khối, năm học, ngày học tuần 1.
2. Đánh dấu tuần nghỉ (sửa được về sau).
3. Dán danh sách **tên gọi ngắn** (mỗi dòng một tên). Hệ thống tạo Học sinh + Ghi danh, gán ngẫu nhiên ảnh con vật không trùng trong lớp (giáo viên đổi được).
4. Hệ thống tạo sẵn Mã mời cho từng em; giáo viên in phiếu mời (mỗi em một phiếu).
5. (Tuỳ chọn) Chủ lớp mời giáo viên phụ bằng email → người đó nhận lời thì có Phân công vai trò `phụ`.

**F-02 Mở buổi học trên lớp**
1. Giáo viên bấm "Bắt đầu buổi học". Hệ thống tạo mã 4 số, hiện lớn để chiếu lên bảng.
2. Học sinh mở ứng dụng → "Em ở trên lớp" → nhập mã → chọn tên mình trong lưới tên.
3. Hệ thống ghi máy đó vào tài khoản em cho tới khi buổi đóng.
4. Giáo viên bấm "Kết thúc" hoặc hết 90 phút (GD-11): mọi máy trong buổi tự thoát. *Bước này bắt buộc. Không có nó thì em sau dùng máy đó sẽ làm bài vào tài khoản em trước.*

**F-03 Phụ huynh liên kết**
1. Phụ huynh tạo tài khoản bằng email, nhập mã mời trên phiếu.
2. Hệ thống hiện điều khoản lưu dữ liệu của con. Phụ huynh nhập/xác nhận họ tên đầy đủ của con và bấm "Đồng ý". *Bước này bắt buộc. Không có nó thì hệ thống lưu dữ liệu định danh trẻ em khi chưa được phép.* Phụ huynh bấm "Không đồng ý" thì vẫn liên kết được, con vẫn học ở nhà, chỉ không lưu họ tên đầy đủ và nhận xét.
3. Hệ thống tạo Liên kết phụ huynh (+ Đồng ý nếu có); phụ huynh thấy con trong danh sách.
4. Phụ huynh bấm tên con → ứng dụng vào chế độ học sinh (giao diện trẻ em, không thấy trang phụ huynh tới khi phụ huynh bấm giữ nút thoát).

**F-04 Học sinh làm bài mô hình**
1. Màn hình chọn bài chỉ hiện bài MỞ của lớp em.
2. Em làm 3 giai đoạn: ① Lắp ráp → ② Sáng tạo → ③ Lập trình & thử.
3. Mỗi khi xong một nhiệm vụ, hệ thống lưu ngay (GD-05, GD-13).
4. Ở máy khác mở lại bài: hiện đúng nhiệm vụ đã xong, bước lắp gần nhất, chương trình gần nhất.

**F-05 Dự án nhóm**
1. Tuần đầu đợt: giáo viên tạo nhóm và xếp em, **hoặc** em tự tạo nhóm trong buổi học và chọn bạn. Giáo viên sửa được mọi nhóm.
2. Mỗi tuần nhóm làm tiếp Sổ dự án trên lớp hoặc ở nhà (GD-07).
3. Nhóm nộp poster → Nhóm ĐÃ NỘP; poster vào phòng trưng bày của lớp.

**F-06 Giáo viên chấm**
1. Giáo viên mở bảng lớp: hàng = học sinh, cột = bài đã mở; ô hiện tiến độ + mức (nếu đã chấm).
2. Bấm một ô: thấy nhiệm vụ đã xong, chương trình, mức máy gợi ý (mục 6). Chọn mức, ghi nhận xét, lưu.
3. Chấm nhanh: chọn nhiều ô → "Chấp nhận mức gợi ý".
4. Bài dự án: chấm Nhóm một lần → hệ thống chép mức + nhận xét cho từng thành viên (nguồn `chép từ nhóm`); giáo viên sửa riêng từng em được.

**F-07 Xuất kết quả**: giáo viên chọn lớp + học kì → tải bảng tính (hàng học sinh, cột bài, ô = mức; trang 2 = nhận xét).

**F-08 Phụ huynh xem kết quả**: thấy danh sách bài đã mở, tiến độ, mức và nhận xét đã chấm.

**F-09 Sửa sai**
- Gõ sai tên học sinh: giáo viên sửa tên; không ảnh hưởng dữ liệu.
- Thêm nhầm em vào lớp: giáo viên "Xoá khỏi lớp" → Ghi danh ĐÃ RỜI; Bài làm giữ lại, ẩn khỏi bảng.
- Em chọn nhầm tên bạn trong buổi học: em bấm "Không phải em" → về lưới tên. Nhiệm vụ đã ghi vào tài khoản bạn **không** tự gỡ; giáo viên gỡ từng nhiệm vụ trong ô Bài làm (luật BR-BL-03).
- Chấm nhầm: giáo viên chấm lại; lưu lần chấm sau, giữ lịch sử lần trước.

**F-10 Lập trình kéo thả, hai kiểu xem** (v0.2; áp dụng cho trang bài mô hình và Sổ dự án)
1. Em mở phần Lập trình. Chương trình hiện theo kiểu xem gần nhất, nếu chưa có thì theo kiểu ngang (mục 4).
2. Thêm khối: **kéo** khối từ hộp lệnh thả vào chỗ bất kỳ (giữa hai khối, hoặc vào trong khối Lặp / Nếu ở kiểu dọc), **hoặc chạm** vào khối để thêm vào cuối như hiện nay.
3. Đổi chỗ: kéo khối trong chương trình sang chỗ khác. Xoá: kéo khối ra thùng rác hoặc ra ngoài vùng chương trình.
4. Đổi kiểu: em bấm nút "Ngang ⇄ Dọc" và chương trình hiện lại ở kiểu kia theo luật 6.5. Nếu giáo viên đã khoá kiểu cho lớp thì nút này bị ẩn.
5. Bấm ▶ hoặc chạm khối Bắt đầu thì chương trình chạy. Kết quả và nhiệm vụ đạt được giống hệt nhau ở cả hai kiểu.

**F-11 Giáo viên mở buổi trưng bày** (v0.2; tuần trưng bày 18 và 35 của Lớp 1)
1. Giáo viên vào lớp, chọn đợt dự án rồi bấm "Chuẩn bị trưng bày". Hệ thống tạo Buổi trưng bày CHUẨN BỊ với 3 tiêu chí mẫu.
2. Giáo viên sửa tiêu chí (1–5 tiêu chí) và nhập số phiếu khách, rồi bấm "In phiếu". Hệ thống tạo ra một tờ A4 gồm nhiều ô phiếu, mỗi ô có mã QR, số thứ tự và dòng hướng dẫn ngắn "Quét để chấm các nhóm".
3. Đến giờ, giáo viên bấm "Mở". Màn hình chiếu hiện poster của các nhóm ĐÃ NỘP, số lượt chấm của từng nhóm và bảng xếp hạng (6.6). Giáo viên tắt được bảng xếp hạng (GD-22).
4. Giáo viên bấm "Đóng" khi xong, nếu quên thì hệ thống tự đóng sau 24 giờ.

**F-12 Các bạn chấm nhóm khác** (v0.2)
1. Em vào bằng Buổi học như thường lệ (F-02), hoặc ở nhà qua tài khoản phụ huynh, rồi mở "Trưng bày".
2. Em thấy lưới các nhóm đã nộp. Nhóm của em bị làm mờ và có nhãn "Nhóm em". Nhóm em đã chấm thì có dấu ✓.
3. Chạm một nhóm để xem poster. Với mỗi tiêu chí, em chạm 1–3 sao (có hình và âm thanh, không cần đọc). Em chọn tối đa 2 câu mẫu (có loa đọc to câu), rồi bấm "Gửi".
4. Em chấm lại nhóm đã chấm được: lượt mới ghi đè lượt cũ.

**F-13 Khách chấm qua phiếu QR** (v0.2)
1. Giáo viên phát cho mỗi khách một phiếu ở cửa lớp. Khách dùng điện thoại quét mã QR.
2. Màn hình mở ra ngay danh sách nhóm của buổi đó, không cần đăng nhập và không hỏi tên. Khách chỉ thấy tên nhóm, poster và ảnh mô hình, **không thấy tên học sinh** (GD-14).
3. Khách chọn nhóm, chấm sao theo tiêu chí, chọn câu mẫu và nếu muốn thì gõ thêm nhận xét (≤ 200 ký tự), rồi bấm "Gửi". Lời cảm ơn hiện ra, nhóm vừa chấm có dấu ✓.
4. Khách chấm tiếp nhóm khác bằng cùng phiếu. Mã phiếu được nhớ trên điện thoại, nên khách không cần quét lại.

**F-14 Duyệt và đọc nhận xét** (v0.2)
1. Giáo viên mở "Hộp duyệt" của buổi. Mỗi dòng gồm nhóm, nguồn, người chấm (tên em, hoặc "Phiếu #12") và chữ tự gõ. Giáo viên bấm Duyệt hoặc Ẩn, hoặc Duyệt tất cả.
2. Nhóm mở Sổ dự án, vào giai đoạn ④ Chia sẻ, xem mục "Mọi người nói gì". Mục này hiện sao trung bình theo từng nguồn (mục 6.4), các câu mẫu và chữ đã duyệt. Lời của các bạn ghi "Một bạn trong lớp", lời của khách ghi "Một vị khách".
3. Khi giáo viên chấm nhóm (F-06 bước 4), bên cạnh ô chấm có bảng tổng hợp sao của 3 nguồn và số lượt chấm. Giáo viên chấm sao theo tiêu chí nếu muốn (GD-21), rồi chọn mức HTT/HT/CHT như thường lệ.
4. Phụ huynh của các thành viên trong nhóm xem được cùng nội dung như nhóm (F-08).

---

## 6. Công thức tính toán

### 6.1. Tuần học hiện tại của lớp

```
số_tuần_lịch = số tuần thứ Hai từ (ngày học tuần 1) tới (hôm nay), tính cả tuần đầu
tuần_học     = số_tuần_lịch − số Tuần nghỉ nằm trong khoảng đó
Bài tuần N MỞ  ⇔  N ≤ tuần_học  HOẶC giáo viên đã mở sớm
```

### 6.2. Mức gợi ý (GD-06)

```
C = số nhiệm vụ cơ bản của phiên bản bài
X = số nhiệm vụ cơ bản em đã xong
X = C                → HTT
X ≥ ⌈C / 2⌉, X < C   → HT
X < ⌈C / 2⌉          → CHT
```

### 6.3. Ví dụ bằng số thật (dùng làm test đầu tiên)

**Tuần học** — Lớp 1A, ngày học tuần 1 = thứ Hai 07/09/2026.

| # | Hôm nay | Số tuần lịch | Tuần nghỉ trong khoảng | Tuần học | Bài mở tới |
|---|---|---|---|---|---|
| 1 | Thứ Tư 04/11/2026 | 9 | 0 | 9 | Tuần 9 |
| 2 | Thứ Hai 22/02/2027 (Tết nghỉ 08/02 và 15/02) | 25 | 2 | 23 | Tuần 23 |
| 3 | Chủ nhật 06/09/2026 (trước tuần 1) | 0 | 0 | 0 | Không bài nào |
| 4 | Lớp tạo ngày 16/11/2026, tuần 1 đặt 07/09/2026 | 11 | 0 | 11 | Tuần 1–11 mở ngay |

**Mức gợi ý**

| # | Bài | C | X | ⌈C/2⌉ | Mức |
|---|---|---|---|---|---|
| 1 | Bài 9 (M1–M4 cơ bản, M5–M6 nâng cao), em xong M1–M4 + M5 | 4 | 4 | 2 | HTT |
| 2 | Bài 9, em xong M1, M2 | 4 | 2 | 2 | HT |
| 3 | Bài 9, em chỉ mở bài, chưa xong gì | 4 | 0 | 2 | CHT |
| 4 | Bài lý thuyết có 3 câu hỏi, xong 1 | 3 | 1 | 2 | CHT |
| 5 | Bài không có nhiệm vụ cơ bản (C = 0) | 0 | 0 | — | Không gợi ý; giáo viên tự chọn (BR-DG-02) |

### 6.4. Tổng hợp sao của một nhóm (v0.2, chỉ để tham khảo — GD-16)

```text
Với mỗi nguồn s ∈ {giáo viên, bạn, khách} và mỗi tiêu chí c của buổi:
  n(s)      = số Lượt chấm của nguồn s cho nhóm (không tính lượt của phiếu ĐÃ THU HỒI)
  TB(s, c)  = tổng sao tiêu chí c ÷ n(s), làm tròn 1 chữ số thập phân, nửa lên (2,25 → 2,3)
  TB(s)     = trung bình các TB(s, c), làm tròn 1 chữ số
n(s) = 0  → hiện "Chưa có", không hiện 0
Không gộp ba nguồn thành một con số
```

> **Vì sao không gộp ba nguồn.** 25 bạn trong lớp chấm hào phóng, trong khi 3 vị khách chấm khắt khe hơn. Nếu gộp chung, lời khách gần như biến mất trong con số trung bình, và giáo viên không biết sao cao là nhờ ai.

**Ví dụ** — buổi trưng bày HK I của 1A, 3 tiêu chí (Ý tưởng · Mô hình chạy · Trình bày), nhóm "Tàu Lá":

| # | Nguồn | Lượt chấm (Ý tưởng / Mô hình / Trình bày) | n | TB theo tiêu chí | TB nguồn |
|---|---|---|---|---|---|
| 1 | Bạn | 3/2/3 · 3/3/2 · 2/2/2 · 3/2/3 | 4 | 2,8 / 2,3 / 2,5 | 2,5 |
| 2 | Khách | 2/1/3 · 3/2/2 | 2 | 2,5 / 1,5 / 2,5 | 2,2 |
| 3 | Khách, thêm 1 lượt của phiếu sau đó bị thu hồi (1/1/1) | — | 2 | Như dòng 2 | 2,2 |
| 4 | Giáo viên | Không chấm sao | 0 | Chưa có | Chưa có |
| 5 | Bạn ở dòng 1 chấm lại nhóm: lượt 3/3/2 sửa thành 3/3/3 | 3/2/3 · 3/3/3 · 2/2/2 · 3/2/3 | 4 | 2,8 / 2,3 / 2,8 | 2,6 |

Cách tính dòng 1: Ý tưởng (3+3+2+3)/4 = 2,75 → 2,8. TB nguồn = (2,75 + 2,25 + 2,5)/3 = 2,5. TB nguồn được tính từ các số **chưa làm tròn**.

### 6.5. Đổi kiểu xem chương trình (v0.2 — GD-15)

| Kiểu ngang (ZMrobo) | Kiểu dọc (Scratch) |
|---|---|
| Khối đầu tiên "Bắt đầu" | Khối mũ "Khi bấm Bắt đầu" |
| Các khối liền nhau từ trái qua phải | Các khối xếp từ trên xuống dưới, cùng thứ tự |
| "Bắt đầu lặp" … "Lặp lại" | Khối chữ C "Lặp lại mãi" chứa các khối ở giữa |
| "Nếu thấy vật lạ" … "Hết Nếu" | Khối chữ C "Nếu thấy vật lạ" chứa các khối ở giữa |

- **Dọc → ngang luôn đúng**: mỗi khối chữ C tách thành khối mở và khối đóng.
- **Ngang → dọc**: chương trình được lưu dạng lồng (mục 2.2), nên luật ghép cặp chạy ngay khi em kéo thả ở kiểu ngang:
  - Khối mở thiếu khối đóng: hệ thống **tự thêm khối đóng ở cuối chương trình** và rung nhẹ khối vừa thêm để em thấy.
  - Khối đóng thừa (không có khối mở nào ở trước): khối hiện màu xám có dấu "?" và **không chạy**.
  - Kéo một khối mở hay khối đóng thì chỉ khối đó di chuyển. Phần lồng được tính lại theo luật ghép cặp: khối đóng ghép với khối mở cùng loại gần nhất ở phía trước mà chưa có cặp.

**Ví dụ** (dùng làm test):

| # | Em làm ở kiểu ngang | Lưu / hiện ở kiểu dọc |
|---|---|---|
| 1 | Bắt đầu · Bắt đầu lặp · Quay nhanh · Đợi 3s · Lặp lại | Khi bấm Bắt đầu → Lặp lại mãi { Quay nhanh, Đợi 3s } |
| 2 | Bắt đầu · Bắt đầu lặp · Quay nhanh (chưa đặt Lặp lại) | Lặp lại mãi { Quay nhanh }, và khối "Lặp lại" được tự thêm ở cuối kiểu ngang |
| 3 | Bắt đầu · Quay nhanh · Lặp lại | Quay nhanh, sau đó là khối "Lặp lại" xám có "?" và không chạy |
| 4 | Ví dụ 1, kéo "Lặp lại" lên trước "Đợi 3s" | Lặp lại mãi { Quay nhanh }, Đợi 3s (khối Đợi 3s nằm ngoài vòng lặp nên không bao giờ chạy tới) |


### 6.6. Điểm xếp hạng trên màn chiếu (v0.2 — GD-22)

Chỉ dùng để xếp hạng trên màn chiếu. Không đưa vào mức gợi ý, và không thay cho bảng tách theo nguồn ở 6.4.

```text
L       = các Lượt chấm của nguồn bạn + khách cho nhóm (không tính giáo viên, không tính phiếu ĐÃ THU HỒI)
điểm    = tổng mọi sao trong L ÷ (số lượt trong L × số tiêu chí), làm tròn 1 chữ số, nửa lên
số lượt < 3       → "Chưa xếp hạng", đứng cuối bảng
Bằng điểm (đã làm tròn) → nhóm nhiều lượt hơn đứng trước → bằng nữa thì cùng hạng
```

> **Vì sao không tính giáo viên và cần ít nhất 3 lượt.** Bảng xếp hạng là tiếng nói của các bạn và khách. Sao của giáo viên nằm ở bảng chấm riêng. Nếu một nhóm chỉ có 1 lượt 3/3/3 thì nhóm đó sẽ đứng đầu vì may mắn.

**Ví dụ** (Tàu Lá lấy từ 6.4 dòng 1 + 2; ba nhóm còn lại là số giả định, 3 tiêu chí):

| # | Nhóm | Lượt bạn + khách | Tổng sao | Điểm | Hạng |
|---|---|---|---|---|---|
| 1 | Cá Voi | 7 | 52 | 52 ÷ 21 = 2,48 → 2,5 | 1 |
| 2 | Ong Vàng | 10 | 72 | 72 ÷ 30 = 2,4 | 2 |
| 3 | Tàu Lá | 4 bạn + 2 khách = 6 | 30 + 13 = 43 | 43 ÷ 18 = 2,39 → 2,4 | 3 (bằng điểm Ong Vàng nhưng ít lượt hơn) |
| 4 | Mây Xanh | 2 | 18 | — | Chưa xếp hạng |

---

## 7. Business rules

| Mã | Luật | Hành vi |
|---|---|---|
| BR-LP-01 | Giáo viên chỉ xem/sửa lớp có Phân công **đang hiệu lực** của mình | Chặn |
| BR-LP-04 | Giáo viên phụ sửa danh sách lớp, mời/gỡ giáo viên, kết thúc lớp | Chặn |
| BR-LP-05 | Chủ lớp rời lớp khi chưa chuyển vai chủ lớp | Chặn |
| BR-DY-01 | Lưu họ tên đầy đủ / ngày sinh của em chưa có đồng ý | Chặn |
| BR-DY-02 | Ghi nhận xét cho em chưa có đồng ý | Chặn (chỉ lưu được mức; giao diện ghi "Chờ phụ huynh đồng ý") |
| BR-LP-02 | Hai học sinh cùng lớp trùng tên gọi ngắn | **Chặn lưu** (PO 01/11): bắt buộc thêm chữ cái họ, hệ thống tự gợi ý ("An B.", "An T.") |
| BR-LP-03 | Kết thúc lớp khi còn Bài làm XONG CƠ BẢN chưa chấm | Cảnh báo |
| BR-BH-01 | Vào buổi học bằng mã đã đóng/hết hạn | Chặn |
| BR-BH-02 | Chọn tên đang được dùng trên máy khác trong cùng buổi | Cảnh báo ("Bạn này đang học ở máy khác"), cho tiếp tục; danh sách duyệt của giáo viên đánh dấu trùng để thầy cô quyết (PO 01/11) |
| BR-PH-01 | Mã mời đã thu hồi hoặc đã có 2 phụ huynh (GD-12) | Chặn |
| BR-PH-02 | Phụ huynh chỉ thấy con đã liên kết | Chặn |
| BR-BA-01 | Học sinh mở bài đang KHOÁ | Chặn |
| BR-BA-02 | Ghi danh ĐÃ RỜI thì em không mở bài của lớp đó | Chặn |
| BR-BL-01 | Nhiệm vụ đã xong không tự chuyển về chưa xong | Chặn |
| BR-BL-02 | Bỏ qua giai đoạn Lắp ráp để sang Lập trình | Cảnh báo (cho qua — em có thể đã lắp kit thật trên lớp) |
| BR-BL-03 | Chỉ giáo viên của lớp gỡ được nhiệm vụ khỏi Bài làm | Chặn với người khác |
| BR-DG-01 | Giáo viên chọn mức khác mức gợi ý | Cảnh báo (vẫn lưu) |
| BR-DG-02 | Lưu đánh giá không có mức | Chặn |
| BR-DG-03 | Chấm Bài làm thuộc Ghi danh ĐÃ RỜI | Chặn |
| BR-DA-01 | Một học sinh ở hai nhóm cùng đợt dự án | Chặn |
| BR-DA-02 | Nhóm nộp poster khi giai đoạn Ý tưởng còn trống | Cảnh báo |
| BR-DA-03 | Học sinh sửa Sổ dự án của nhóm không phải nhóm mình | Chặn |
| BR-LT-01 | **(v0.2)** Em đổi kiểu xem khi lớp đã bị khoá một kiểu | Chặn (nút đổi kiểu bị ẩn) |
| BR-LT-02 | **(v0.2)** Chạy chương trình còn khối đóng thừa (6.5 ví dụ 3) | Cảnh báo (vẫn chạy, bỏ qua khối thừa) |
| BR-TB-01 | **(v0.2)** Em chấm nhóm của chính mình | Chặn |
| BR-TB-02 | **(v0.2)** Chấm khi Buổi trưng bày không ĐANG MỞ | Chặn ("Buổi trưng bày đã đóng") |
| BR-TB-03 | **(v0.2)** Phiếu khách đã thu hồi, hoặc phiếu của buổi khác | Chặn |
| BR-TB-04 | **(v0.2)** Em không có Ghi danh ĐANG HỌC ở lớp của buổi mà vẫn chấm với tư cách "bạn" | Chặn |
| BR-TB-05 | **(v0.2)** Gửi lượt chấm còn tiêu chí chưa chọn sao | Chặn (tiêu chí còn thiếu nhấp nháy) |
| BR-TB-06 | **(v0.2)** Cùng một người chấm một nhóm lần thứ hai | Không tạo lượt mới; ghi đè lượt cũ (GD-17, GD-20) |
| BR-TB-07 | **(v0.2)** Sửa bộ tiêu chí khi buổi đã có lượt chấm | Chặn (lượt cũ sẽ mất nghĩa) |
| BR-TB-08 | **(v0.2)** Nhóm ĐANG LÀM (chưa nộp hoặc bị trả lại) | Không hiện trong lưới chấm; lượt đã có được giữ lại |
| BR-TB-09 | **(v0.2)** Chữ tự gõ chưa duyệt | Không hiện cho nhóm và phụ huynh |
| BR-TB-10 | **(v0.2)** Em Lớp 1 gõ chữ khi chấm | Chặn (chỉ có câu mẫu — GD-19) |
| BR-TB-11 | **(v0.2)** Giáo viên đóng buổi khi còn chữ CHỜ DUYỆT | Cảnh báo ("Còn 5 nhận xét chưa duyệt") |

- **BR-BL-02 là Cảnh báo, không Chặn**: ứng dụng là bổ trợ cho kit thật; bắt em lắp lại 28 bước trên màn hình rồi mới được lập trình ở nhà là phạt em đã lắp xong trên lớp.
- **Ghi chú cho giai đoạn code:** Chặn = từ chối thao tác và báo lỗi. Cảnh báo = trả về danh sách cảnh báo để giao diện hỏi lại. Hai loại phải cài khác nhau.

---

## 8. Quy tắc kiểm tra dữ liệu

| Trường | Quy tắc |
|---|---|
| Họ tên học sinh | 1–60 ký tự, bỏ khoảng trắng thừa |
| Tên gọi ngắn | 1–12 ký tự, mặc định = tên cuối của họ tên |
| Ngày học tuần 1 | Phải là thứ Hai; nhập ngày khác thì tự lùi về thứ Hai cùng tuần |
| Tuần nghỉ | Nằm sau ngày học tuần 1; không trùng |
| Nhận xét | ≤ 500 ký tự |
| Mã vào buổi học | 4 chữ số, không trùng với buổi đang mở khác |
| Mã mời | 8 ký tự, bỏ các ký tự dễ nhầm (0/O, 1/I/l) |
| **(v0.2)** Mã phiếu khách | Như Mã mời; duy nhất trên toàn hệ thống (không chỉ trong buổi) để không đoán được |
| **(v0.2)** Tiêu chí | 1–5 tiêu chí mỗi buổi; tên 1–30 ký tự, không trùng trong buổi |
| **(v0.2)** Sao | Số nguyên 1–3, bắt buộc với mọi tiêu chí |
| **(v0.2)** Câu mẫu đã chọn | 0–2 câu mỗi lượt |
| **(v0.2)** Chữ tự gõ | ≤ 200 ký tự, bỏ khoảng trắng thừa; để trống = `không có` |
| **(v0.2)** Số phiếu khách | 1–200 mỗi lần in |

---

## 9. Tình huống biên

| Tình huống | Xử lý |
|---|---|
| Em vào lớp giữa năm | Ghi danh từ ngày vào; mọi bài đã mở đều mở với em; bài trước ngày vào hiện "chưa làm", giáo viên không bắt buộc chấm |
| Em chuyển lớp giữa năm (cùng khối) | Ghi danh cũ ĐÃ RỜI, tạo Ghi danh mới; Bài làm cũ **chép tiến độ** sang Ghi danh mới (đánh giá cũ không chép) |
| Em vắng một tuần | Bài vẫn mở, em làm ở nhà; không có hạn chót |
| Tuần nghỉ được thêm sau khi bài đã mở | Bài đã mở không khoá lại |
| Hai máy làm cùng bài một lúc | Gộp nhiệm vụ (GD-05); chương trình khối lệnh lấy bản lưu sau |
| Em chọn nhầm tên bạn | F-09 |
| Phụ huynh có 2 con ở 2 lớp | Một tài khoản, chọn con khi vào |
| Phiên bản bài mới phát hành giữa năm | Bài làm đang dở giữ phiên bản cũ; em mới mở bài dùng phiên bản mới |
| Mất mạng giữa chừng | GD-13: giữ trên máy, gửi lại khi có mạng; báo "chưa lưu" nhỏ ở góc |
| Thành viên rời nhóm giữa đợt dự án | Thành viên nhóm có ngày rời; khi chấm nhóm, em đã rời **không** được chép mức |
| Nhóm chỉ còn 1 em | Cho phép |
| Phụ huynh không liên kết | Em vẫn học trên lớp; chỉ không học ở nhà được |
| Giáo viên nghỉ, lớp cần người khác | Chủ lớp mời giáo viên phụ; nghỉ hẳn thì chuyển vai chủ lớp (GD-01) |
| Chủ lớp mất tài khoản, không ai chuyển vai được | Giáo viên phụ lâu nhất gửi yêu cầu; đội vận hành chuyển tay (ngoài ứng dụng trong MVP) |
| Phụ huynh không bao giờ liên kết | Em học trên lớp bình thường; xuất bảng tính hiện tên gọi ngắn; không có nhận xét (BR-DY-02) |
| Bố đồng ý, mẹ không đồng ý | Một đồng ý là đủ; chỉ khi mọi đồng ý bị rút mới về CHƯA |
| Phụ huynh rút đồng ý | Xoá họ tên đầy đủ, ngày sinh, nhận xét; giữ tiến độ và mức (mục 3) |
| Phụ huynh yêu cầu xoá dữ liệu | Học sinh `đã xoá`: xoá họ tên, Bài làm, Đánh giá; giữ số liệu đếm ẩn danh (GD-10) |
| **(v0.2)** Một khách là phụ huynh của em trong nhóm | Vẫn tính là khách. Hệ thống không biết và cũng không cần biết (GD-17) |
| **(v0.2)** Khách chụp ảnh QR của phiếu người khác rồi chấm | Cùng một phiếu thì cùng một người chấm, lượt sau ghi đè lượt trước. Thiệt hại nhiều nhất là một lượt chấm bị đổi |
| **(v0.2)** Khách làm mất phiếu giữa chừng | Giáo viên phát phiếu mới, các lượt của phiếu cũ vẫn giữ. Nếu nghi phiếu bị lạm dụng thì giáo viên thu hồi phiếu cũ |
| **(v0.2)** Em vắng buổi trưng bày | Em chấm ở nhà qua tài khoản phụ huynh khi buổi còn ĐANG MỞ (tối đa 24 giờ) |
| **(v0.2)** Em rời nhóm hoặc rời lớp sau khi đã chấm | Lượt chấm của em giữ nguyên. Giáo viên vẫn thấy tên em |
| **(v0.2)** Nhóm bị trả lại (ĐÃ NỘP → ĐANG LÀM) khi buổi đang mở | Nhóm biến mất khỏi lưới chấm, lượt đã có giữ nguyên. Nộp lại thì nhóm hiện lại |
| **(v0.2)** Poster có ghi họ tên các em | Khách sẽ đọc được. Khi nộp, hệ thống nhắc nhóm "Chỉ ghi tên gọi ngắn hoặc tên nhóm". Giáo viên ẩn được poster khỏi buổi |
| **(v0.2)** Phụ huynh rút đồng ý | Không ảnh hưởng lượt chấm em đã gửi, vì lượt chấm không chứa dữ liệu định danh của em |
| **(v0.2)** Lớp 3 | Theo GD-08, Lớp 3 chưa có tuần dự án nên chưa có buổi trưng bày. Phần lập trình hai kiểu vẫn áp dụng cho Lớp 3 |
| **(v0.2)** Mở bài làm cũ (lưu trước v0.2, dạng phẳng) | Chuyển một lần sang dạng lồng theo luật 6.5 khi mở |

---

## 10. Danh sách màn hình

| Mã | Màn hình | Ưu tiên |
|---|---|---|
| S-01 | Học sinh: nhập mã buổi học + lưới chọn tên | P0 |
| S-02 | Học sinh: chọn bài (bài mở / khoá / sắp có) | P0 |
| S-03 | Học sinh: trang bài mô hình (3 giai đoạn) | P0 — đã có |
| S-04 | Học sinh: sổ dự án nhóm | P0 — đã có, cần lưu tập trung |
| S-05 | Giáo viên: đăng nhập, danh sách lớp, tạo lớp, lịch tuần | P0 |
| S-06 | Giáo viên: bắt đầu buổi học (mã chiếu bảng, ai đã vào) | P0 |
| S-07 | Giáo viên: bảng lớp + chấm | P0 |
| S-08 | Giáo viên: nhóm dự án | P1 |
| S-09 | Giáo viên: in phiếu mời phụ huynh | P1 |
| S-10 | Phụ huynh: đăng nhập, nhập mã mời, chọn con | P1 |
| S-11 | Phụ huynh: kết quả của con | P1 |
| S-12 | Phòng trưng bày | P1 — đã có |
| S-13 | Xuất bảng tính | P2 |
| S-14 | **(v0.2)** Giáo viên: chuẩn bị buổi trưng bày (tiêu chí, in phiếu khách), mở/đóng, hộp duyệt nhận xét | P1 |
| S-15 | **(v0.2)** Học sinh: lưới nhóm + màn hình chấm sao và chọn câu mẫu | P1 |
| S-16 | **(v0.2)** Khách: màn hình mở từ phiếu QR, gồm danh sách nhóm và màn hình chấm (trên điện thoại) | P1 |
| S-17 | **(v0.2)** Nhóm: mục "Mọi người nói gì" trong Sổ dự án, giai đoạn ④ | P1 |
| S-03/S-04 | **(v0.2)** Thêm kéo thả và nút đổi kiểu Ngang ⇄ Dọc ở phần Lập trình | P1 |

**Màn hình quan trọng nhất: S-01 (vào buổi học).** Mỗi tiết, cả lớp 25–30 em Lớp 1 chạm vào nó cùng lúc trên máy tính bảng, ngồi bàn, một tay cầm máy. Các em chưa đọc thạo. Nếu bước này mất quá 20 giây hoặc em chọn nhầm tên, cả tiết học bị trễ và dữ liệu sai từ đầu. Thiết kế: số mã to, bàn phím số riêng; lưới tên dạng nút lớn có ảnh đại diện con vật (giáo viên gán) để em nhận ra mình không cần đọc.

**(v0.2) S-16 (khách chấm)** cũng quan trọng, dù không thường xuyên. Khách đứng giữa lớp đông, cầm điện thoại của chính họ, chưa từng dùng ứng dụng, và chỉ chịu bỏ khoảng 30 giây cho mỗi nhóm. Nếu phải đăng nhập, phải cài app, hoặc phải đọc hướng dẫn, họ sẽ bỏ ngay. Thiết kế: quét xong là thấy ngay các nhóm, mỗi tiêu chí là một hàng 3 ngôi sao to, nút "Gửi" luôn nằm ở đáy màn hình.

Thứ hai là **S-07 (bảng lớp + chấm)**: giáo viên làm cuối mỗi tuần cho 30 em × nhiều lớp, trên máy tính; phải chấm nhanh được bằng "Chấp nhận mức gợi ý".

---

## 11. Lộ trình sau MVP

| Giai đoạn | Nội dung |
|---|---|
| MVP | Mục 1.1, Lớp 1 các bài đã có + bài mới |
| 2 | Lớp 3 (cùng kit); báo cáo học kì cho phụ huynh (in/gửi) |
| 3 | Trang soạn bài cho giáo viên/người soạn nội dung; Trung tâm/Trường quản lý nhiều giáo viên |
| 4 | Học sinh lớn tự đăng nhập (Lớp 3–5); Lớp 2, 4, 5 |

**Chuẩn bị ngay từ bây giờ (rẻ lúc này, đắt về sau):**
- Thêm trường "đơn vị" (trung tâm/trường) vào Lớp, để trống trong MVP (GD-02).
- Nội dung bài lưu dạng dữ liệu có Phiên bản bài, không viết cứng trong mã — để trang soạn bài sau này chỉ là màn hình sửa dữ liệu.
- Ảnh đại diện con vật của học sinh lưu như một trường của Học sinh — dùng lại làm "mật khẩu hình" nếu sau này học sinh tự đăng nhập (GD-03).

---

## 12. Câu hỏi còn mở

| # | Câu hỏi | Ảnh hưởng |
|---|---|---|
| 12.1 | ~~Lớp 3 tuần 17, 18, 34, 35?~~ ĐÃ TRẢ LỜI theo khung chương trình: Ôn tập HK I, Kiểm tra HK I, Ôn tập HK II, Kiểm tra HK II → GD-08 | — |
| 12.2 | ~~Giáo viên phụ?~~ ĐÃ TRẢ LỜI: có → GD-01 | — |
| 12.3 | ~~Đồng ý phụ huynh?~~ ĐÃ TRẢ LỜI: có, khi liên kết → GD-14 | — |
| 12.4 | Bài lý thuyết / kiểm tra: **có** dạng thử thách lập trình (dùng lại mô hình cũ, nhiệm vụ mới — khớp công thức 6.2). Các dạng khác (trắc nghiệm, kéo thả) để tới tuần đó | Phiên bản bài |
| 12.5 | ~~Sổ dự án ở nhà?~~ ĐÃ TRẢ LỜI: sửa được, có lịch sử → GD-07 giữ nguyên | — |
| 12.6 | Nội dung điều khoản đồng ý (văn bản pháp lý) do ai soạn? | F-03 |

| 12.7 | ~~Màn chiếu hiện xếp hạng?~~ ĐÃ TRẢ LỜI: có bảng xếp hạng, giáo viên tắt được → GD-22, mục 6.6 | — |
| 12.8 | Danh sách câu mẫu: BA đã soạn nháp ở `docs/ba/cau-mau.md`, **chờ thầy duyệt** | Câu mẫu |
| 12.9 | ~~Lớp 3 mặc định kiểu nào?~~ ĐÃ TRẢ LỜI: ngang (ZMrobo), em tự đổi sang dọc được → GD-15 | — |
| 12.10 | ~~Điều khoản nhắc buổi trưng bày?~~ ĐÃ TRẢ LỜI: có, đã thêm vào bản nháp `dieu-khoan-dong-y.md` mục 3 | — |

**Không còn câu nào chặn MVP.** Câu 12.8 (thầy duyệt câu mẫu) cần xong trước khi làm màn hình S-15 – S-16. 12.1 cần trước khi làm Lớp 3; 12.6 cần trước khi phát hành cho phụ huynh thật.

---

## Phụ lục — Quyết định PO 01/11/2026 (sau đối chiếu code S-01/05/06)
- **Duyệt máy:** giữ bước giáo viên duyệt máy sau khi em chọn tên (bổ sung so với F-02, vì chống dò mã 4 số và chọn nhầm tên).
- **Bài đã mở không khoá lại:** thêm tuần nghỉ sau khi bài đã mở thì bài vẫn mở (lưu mốc mở bài), §9 giữ nguyên.
- **Mở buổi mới khi buổi cũ còn mở:** tự đóng buổi cũ (mã cũ hết hiệu lực ngay).
- **Chọn nhầm tên ở màn chờ duyệt:** quay lại lưới tên thì huỷ yêu cầu đang chờ.
- **"Không phải em?":** quay về lưới tên của cùng buổi (không bắt nhập lại mã) khi buổi còn mở.
- **Ngày giờ:** mọi phép tính tuần/ngày dùng múi giờ Asia/Ho_Chi_Minh.
- **Ảnh con vật:** gán ngẫu nhiên trong các con vật chưa dùng.
