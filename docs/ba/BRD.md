# BRD — Happy STEAM Lab

Phiên bản 0.1 · 2026-10-31 · Người viết: Claude (vai BA) cùng chủ sản phẩm.
Tài liệu nghiệp vụ, không nói về công nghệ. Quyết định kỹ thuật nằm ở `docs/kien-truc.md`.

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

---

## 1. Tổng quan

### 1.1. Mục tiêu — sau MVP người dùng làm được 7 việc

1. Giáo viên tạo lớp, nhập danh sách học sinh, đặt lịch tuần.
2. Giáo viên mở Buổi học; học sinh trên lớp vào bằng mã + chọn tên trong ≤ 20 giây.
3. Phụ huynh liên kết với con bằng mã mời và cho con học tiếp ở nhà.
4. Học sinh làm bài (lắp 3D → sáng tạo → lập trình & thử) và tiến độ theo em ở mọi máy.
5. Nhóm học sinh làm dự án 4 tuần, nộp poster, trưng bày.
6. Giáo viên xem bảng tiến độ lớp và chấm mức + nhận xét cho từng em × từng bài.
7. Giáo viên xuất kết quả lớp ra bảng tính; phụ huynh xem mức và nhận xét của con.

### 1.2. Trong phạm vi
- Lớp 1 (kit ZM Alpha 330) và Lớp 3 (kit ZM Alpha Set A — cùng kit Alpha 330 của Lớp 1, mã JMC-NY-2321AE), 35 tuần mỗi khối.
- Vai trò: Giáo viên, Phụ huynh, Học sinh (không đăng nhập riêng — GD-03).
- Bài làm, Đánh giá, Dự án nhóm, Trưng bày.
- Xuất bảng tính.

### 1.3. Ngoài phạm vi
- Lớp 2, 4, 5 (khung cho phép thêm sau).
- Trang soạn bài cho giáo viên (nội dung bài do đội phát triển đưa vào — xem 11).
- Báo cáo học kì tự động gửi phụ huynh (MVP chỉ có trang phụ huynh xem; gửi định kỳ để sau).
- Nhắn tin giáo viên ↔ phụ huynh.
- Thanh toán, gói dịch vụ.
- Chế độ ngoại tuyến đầy đủ (GD-13).

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

---

## 4. Cấu hình & tham số

| Tham số | Đặt ở | Thứ tự ưu tiên |
|---|---|---|
| Bài mở hay khoá với lớp | Lớp | Mở sớm thủ công của giáo viên → lịch tuần |
| Ngày học tuần 1, tuần nghỉ | Lớp | — |
| Nhiệm vụ cơ bản / nâng cao | Phiên bản bài | — |

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

---

## 7. Business rules

| Mã | Luật | Hành vi |
|---|---|---|
| BR-LP-01 | Giáo viên chỉ xem/sửa lớp có Phân công **đang hiệu lực** của mình | Chặn |
| BR-LP-04 | Giáo viên phụ sửa danh sách lớp, mời/gỡ giáo viên, kết thúc lớp | Chặn |
| BR-LP-05 | Chủ lớp rời lớp khi chưa chuyển vai chủ lớp | Chặn |
| BR-DY-01 | Lưu họ tên đầy đủ / ngày sinh của em chưa có đồng ý | Chặn |
| BR-DY-02 | Ghi nhận xét cho em chưa có đồng ý | Chặn (chỉ lưu được mức; giao diện ghi "Chờ phụ huynh đồng ý") |
| BR-LP-02 | Hai học sinh cùng lớp trùng tên gọi ngắn | Cảnh báo (gợi ý thêm chữ cái họ) |
| BR-LP-03 | Kết thúc lớp khi còn Bài làm XONG CƠ BẢN chưa chấm | Cảnh báo |
| BR-BH-01 | Vào buổi học bằng mã đã đóng/hết hạn | Chặn |
| BR-BH-02 | Chọn tên đang được dùng trên máy khác trong cùng buổi | Cảnh báo ("Bạn này đang học ở máy khác") |
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

**Màn hình quan trọng nhất: S-01 (vào buổi học).** Mỗi tiết, cả lớp 25–30 em Lớp 1 chạm vào nó cùng lúc trên máy tính bảng, ngồi bàn, một tay cầm máy. Các em chưa đọc thạo. Nếu bước này mất quá 20 giây hoặc em chọn nhầm tên, cả tiết học bị trễ và dữ liệu sai từ đầu. Thiết kế: số mã to, bàn phím số riêng; lưới tên dạng nút lớn có ảnh đại diện con vật (giáo viên gán) để em nhận ra mình không cần đọc.

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

**Không còn câu nào chặn MVP.** 12.1 cần trước khi làm Lớp 3; 12.6 cần trước khi phát hành cho phụ huynh thật.
