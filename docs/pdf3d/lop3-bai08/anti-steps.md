# Bảng từng bước lắp ráp Lớp 3 Bài 8 "Giải cứu máy bay" (Antigravity độc lập)

> **Tài liệu nguồn:** `references/lop3/bai08/bai8.pdf` (30 trang sách lắp ráp)  
> **Ảnh mô hình hoàn chỉnh:** `references/lop3/bai08/cover.png`  
> **File CAD đối chiếu:** `references/lop3/bai08/bai8.io` (`references/lop3/bai08/x/io/model.ldr`: 103 dòng khai báo, 101 linh kiện vật lý)  
> **Bộ kit đối chiếu:** ZM Alpha 330 (`references/drive_bai02/kit_set2321A.txt`)  
> **Người thực hiện:** Antigravity (đọc ảnh độc lập từng trang từ `p-01.png` đến `p-30.png`, đối chiếu mô hình CAD và cơ chế hoạt động)

---

## 1. Tóm tắt tổng quan

- **Tổng số trang trong sách:** 30 trang (Bước 1 đến Bước 30).
  - **26 bước lắp ráp thực tế:** Bước 1–8, 11–21, 23–29.
  - **4 bước chỉ xem / kiểm tra chuyển động (`view_only: true`):**
    - Bước 9: Xoay thử cơ cấu bánh răng trục vít kiểm tra chuyển động nâng hạ hai thanh đứng.
    - Bước 10: Kiểm tra độ trơn tru toàn bộ cụm động cơ dưới hoàn chỉnh.
    - Bước 22: Kiểm tra cụm máy bay gắn trên cần treo trước khi ghép nối.
    - Bước 30: Toàn cảnh giàn bay giải cứu hoàn chỉnh.
- **Cấu trúc phân đoạn cụm con (Subassemblies):**
  - **Cụm con 1 (Bước 1 – 10):** Cụm động cơ dưới (đế tháp, khung 5×7, trục đứng chứa 2 bạc nửa vàng + 1 trục vít kẹp giữa 2 bạc xám, trục ngang 9L có bánh răng 24T và 2 tay đòn đen, 2 thanh đứng 9L xanh ngọc).
  - **Cụm con 2 (Bước 11 – 22):** Cụm động cơ trên, tháp trục đứng 10L, cần quay ngang 15L và máy bay cánh trắng.
  - **Ghép cụm con (Bước 23):** Gắn Cụm con 2 lên trên hai thanh đứng 9L của Cụm con 1.
  - **Cụm chính hoàn thiện (Bước 24 – 29):** Lắp 2 thanh giằng sau tháp 13L, khung bệ đế (2 thanh trắng 7L + 2 thanh trắng 15L), bộ não điều khiển WeDo và 2 thanh chân đế chữ L chống lật.
- **Tổng số linh kiện:** **101 linh kiện vật lý** (khớp chính xác 100% với 101 chi tiết trong CAD `model.ldr`, 2 dòng còn lại trong CAD là lệnh gọi `submodel group 1` và `submodel group 2`).

---

## 2. Bảng chi tiết từng bước lắp ráp

| Bước | Trang | Cụm | Chi tiết mới (Mã, Màu, SL, Tên) | Gắn vào đâu / Vị trí | Độ tin cậy | Ghi chú & Góc nhìn |
|:---:|:---:|:---:|---|---|:---:|---|
| **1** | 1 | Cụm con 1 | • `BE-3578` (trắng/xanh) ×1: Động cơ thông minh<br>• `2780` (đen) ×2: Chốt ma sát 2L | Động cơ BE-3578 đặt nằm ngang làm chi tiết cơ sở, đĩa xoay tròn màu xanh ngọc úp xuống dưới, đầu có lỗ trục quay về phía trước. Cắm 2 chốt đen vào 2 lỗ trên lưng động cơ gần phía đầu đĩa xoay. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Ghi chú:* Ô linh kiện ghi `1x` động cơ, `2x` chốt đen. Đĩa xoay hướng xuống đáy để đón trục đứng ở bước 3. |
| **2** | 2 | Cụm con 1 | • `BP-3976(16)` (xanh ngọc) ×1: Khung chữ nhật 5×7 | Khung 5×7 lỗ đặt dựng đứng lên 2 chốt đen ở bước 1; cạnh ngắn 5 lỗ úp xuống cắm vào 2 chốt đen tại lỗ thứ 2 và thứ 4 của cạnh. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Lỗ đếm:* Kích thước ngoài 5×7 lỗ, khoang trong 3×5 lỗ dựng đứng chứa bộ truyền trục vít. |
| **3** | 3 | Cụm con 1 | • `3707` (đen) ×1: Trục 8L<br>• `3713` (xám) ×2: Ống lót / bạc 1L<br>• `32123a` (vàng) ×2: Bạc nửa 1/2 bush<br>• `4716` (xám) ×1: Trục vít bánh răng sâu 2L | Trục 8L đen xỏ thẳng đứng từ trên xuống qua lỗ giữa (lỗ 3) của cạnh trên khung 5×7, lần lượt xâu: 1 bạc xám sát đỉnh, 1 bạc nửa vàng, 1 trục vít xám ở giữa, 1 bạc nửa vàng, 1 bạc xám sát đáy khung; đầu dưới trục cắm vào lỗ chữ thập của đĩa xoay động cơ. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Lỗ đếm:* Trục có số 8 trong ô linh kiện. Chi tiết màu vàng là 2 bạc nửa (1/2 bush) định vị trục vít, không phải giảm xóc. |
| **4** | 4 | Cụm con 1 | • `43093` (xanh dương) ×4: Chốt trục có ma sát 2L | Cắm phần đầu chốt tròn vào 4 lỗ góc trong của khung 5×7 (2 lỗ ở cạnh trên và 2 lỗ ở cạnh dưới); đầu trục chữ thập nhô ngang ra ngoài hai bên sườn (mặt trước và mặt sau). | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Ghi chú:* 4 chốt trục tạo điểm đỡ vững chắc cho các thanh tam giác ở bước 5. |
| **5** | 5 | Cụm con 1 | • `99773` (xám) ×4: Thanh tam giác mỏng 3×5 | Gắn vào 4 đầu trục chữ thập của các chốt trục xanh dương (2 thanh ốp mặt trước, 2 thanh ốp mặt sau khung); đỉnh tam giác nhọn chìa sang bên phải đối diện trục vít. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Ghi chú:* Thanh tam giác đóng vai trò giá đỡ ổ trục ngang cho bánh răng 24 răng ở bước 6. |
| **6** | 6 | Cụm con 1 | • `60485` (xám) ×1: Trục 9L<br>• `3648b` (xám đậm) ×1: Bánh răng 24 răng<br>• `62462` (xám) ×2: Ống nối chốt tròn 2L | Luồn trục 9L nằm ngang qua lỗ đỉnh các thanh tam giác xám và lỗ bên cạnh khung 5×7. Giữa 2 thanh tam giác, trục xâu lần lượt: 1 ống nối xám, bánh răng 24T (ăn khớp trực tiếp với trục vít xám), 1 ống nối xám. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Lỗ đếm:* Trục có số 9 trong ô linh kiện. Bánh răng 24 răng ăn khớp vuông góc với trục vít tạo bộ giảm tốc tự hãm. |
| **7** | 7 | Cụm con 1 | • `60483` (đen) ×2: Khối nối 1×2 lỗ trục-chốt<br>• `3673` (xám) ×2: Chốt trơn 2L | Lỗ chữ thập của 2 khối nối đen gắn vào 2 đầu thò ra của trục 9L ở mặt trước và mặt sau (lỗ tròn quay sang phải). Cắm 2 chốt xám không ma sát vào lỗ tròn còn lại của khối nối, đầu chốt hướng ra trước và sau. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Ghi chú:* Hai khối nối đen đóng vai trò tay đòn quay (crank arm) truyền lực nâng hạ. |
| **8** | 8 | Cụm con 1 | • `BP-7526A(16)` (xanh ngọc) ×2: Thanh thẳng 9 lỗ | Gắn lỗ đầu tiên ở đáy của 2 thanh vào 2 chốt xám không ma sát trên khối nối đen ở bước 7. Hai thanh dựng đứng hướng lên trên. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Lỗ đếm:* Thanh thẳng 9 lỗ (Beam 9M). Hai thanh này đóng vai trò cần nâng di động đẩy động cơ trên. |
| **9** | 9 | Cụm con 1 | *(Không thêm chi tiết mới - `view_only: true`)* | Không có ô linh kiện. Hình vẽ thể hiện tay đòn xoay đi một góc, minh họa cơ cấu bánh răng trục vít nâng hạ hai thanh đứng. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Thao tác:* Thử xoay trục vít để thấy hai thanh đứng 9L được nâng lên hạ xuống mượt mà. |
| **10** | 10 | Cụm con 1 | *(Không thêm chi tiết mới - `view_only: true`)* | Không có ô linh kiện. Kiểm tra toàn bộ Cụm con 1 (cơ cấu truyền động trục vít - bánh răng hoàn chỉnh) trước khi bắt đầu dựng Cụm con 2. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao (góc mở rộng).<br>*Ghi chú:* Cụm con 1 gồm đúng 28 chi tiết vật lý. |
| **11** | 11 | Cụm con 2 | • `BE-3578` (trắng/xanh) ×1: Động cơ thông minh<br>• `2780` (đen) ×2: Chốt ma sát 2L<br>• `3673` (xám) ×2: Chốt trơn 2L<br>• `32556` (vàng cát) ×2: Chốt dài 3L có gờ | Động cơ BE-3578 thứ hai đặt nằm ngang làm chi tiết cơ sở cụm 2, đĩa xoay úp xuống dưới. Cắm 2 chốt đen vào 2 lỗ trên lưng động cơ gần đầu trước. Cắm 2 chốt xám vào 2 lỗ bên hông phía sau. Cắm 2 chốt dài 3L màu tan xuyên qua lỗ ngang ở cổ động cơ, nhô đều sang hai bên. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Ghi chú:* Bắt đầu dựng Cụm con 2 (có ô preview ở góc trên-phải). |
| **12** | 12 | Cụm con 2 | • `32523` (vàng) ×2: Thanh thẳng 3 lỗ<br>• `62462` (xám) ×2: Ống nối chốt tròn 2L<br>• `3673` (xám) ×2: Chốt trơn 2L | Gắn 2 thanh vàng 3L đứng ở hai bên cổ động cơ: lỗ trên xỏ vào chốt đen, lỗ dưới xỏ vào chốt 3L tan bước 11. Gắn 2 ống nối tròn xám vào đầu chốt 3L tan thò ra, rồi cắm 2 chốt xám trơn vào đầu ngoài của ống nối, nhô sang hai bên. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Lỗ đếm:* Thanh vàng 3 lỗ (3L). Hai chốt xám nhô sang hai bên dùng để đón 2 thanh đứng 9L ở bước 23. |
| **13** | 13 | Cụm con 2 | • `2780` (đen) ×2: Chốt ma sát 2L | Cắm 2 chốt đen vào 2 lỗ trên mặt lưng động cơ, nằm ngay phía sau lỗ trục xanh ngọc của động cơ. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Ghi chú:* Dùng để gắn thanh trắng 7 lỗ ở bước 14. |
| **14** | 14 | Cụm con 2 | • `BP-7525A(16)` (trắng) ×1: Thanh thẳng 7 lỗ<br>• `87083` (đen) ×1: Trục 4L có gờ chặn<br>• `4519` (xám) ×1: Trục 3L | Gắn thanh trắng 7 lỗ dọc trên lưng động cơ qua 2 chốt đen ở bước 13 (vào lỗ 2 và lỗ 4 tính từ đầu trước). Luồn trục 4L có gờ từ dưới lên qua lỗ 3 của thanh trắng. Cắm trục 3L xám thẳng đứng vào lỗ chữ thập của đĩa động cơ qua lỗ 1 của thanh trắng. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Lỗ đếm:* Thanh 7 lỗ (Beam 7M). Trục 3L có số 3 trong ô linh kiện. Trục 4L có gờ chặn ở đáy. |
| **15** | 15 | Cụm con 2 | • `10928` (xám đậm) ×1: Bánh răng 8 răng<br>• `3713` (xám) ×1: Ống lót / bạc 1L<br>• `3648b` (xám đậm) ×1: Bánh răng 24 răng | Xỏ bánh răng 8 răng vào trục 3L xám sát mặt thanh trắng, rồi xỏ 1 bạc xám lên trên để chặn. Xỏ bánh răng 24 răng vào trục 4L có gờ bên cạnh, ăn khớp trực tiếp với bánh răng 8 răng. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Ghi chú:* Cặp bánh răng giảm tốc 8T/24T (tỉ số 1:3), tăng lực xoay cho trục đứng dẫn lên cần ngang. |
| **16** | 16 | Cụm con 2 | • `59443` (đen) ×1: Ống nối trục thẳng 2L<br>• `3737` (đen) ×1: Trục 10L<br>• `32034` (đen) ×1: Khớp nối trục góc số 2 | Cắm ống nối trục 2L đen vào đầu trên của trục 4L có gờ (trên bánh răng 24T). Cắm trục 10L đen dựng đứng vào ống nối trục. Gắn khớp nối góc số 2 lên đầu đỉnh của trục 10L, lỗ tròn quay sang bên. | Cao | *Góc nhìn:* Nghiêng từ trước.<br>*Lỗ đếm:* Trục có số 10 trong ô linh kiện. Khớp nối có số 2 in trên thân. |
| **17** | 17 | Cụm con 2 | • `48989` (xám) ×1: Khớp nối 4 chốt vuông góc<br>• `32184` (xanh ngọc) ×2: Khớp nối đôi 3L<br>• `87083` (đen) ×1: Trục 4L có gờ chặn<br>• `4519` (xám) ×1: Trục 3L | Khớp nối xám 48989 đặt ở giữa đỉnh (4 chốt tròn nhô sang 2 bên), 2 khớp nối xanh ngọc 32184 ốp vào mặt trên và mặt dưới. Xỏ trục 4L có gờ từ trên xuống qua một lỗ trục đứng vào đầu khớp số 2 bước 16. Xỏ trục 3L xám thẳng đứng qua lỗ trục còn lại để khóa cụm. | Cao | *Góc nhìn:* Trước-phải, hơi trên cao.<br>*Lỗ đếm:* Trục 3L xám có số 3. Tạo khớp quay chữ T ở đỉnh cột trục. |
| **18** | 18 | Cụm con 2 | • `32278` (trắng) ×2: Thanh thẳng 15 lỗ<br>• `32013` (đen) ×1: Khớp nối trục góc số 1<br>• `32556` (vàng cát) ×1: Chốt dài 3L có gờ | Hai thanh trắng 15L đặt nằm ngang song song làm cần quay, đầu phải kẹp vào các chốt nhô ra từ khớp nối xám 48989 ở bước 17. Đặt khớp nối góc số 1 đen kẹp giữa 2 thanh trắng ở lỗ đầu tiên ngoài cùng bên trái (lỗ trục hướng xuống), dùng chốt dài 3L tan xỏ xuyên qua để cố định. | Cao | *Góc nhìn:* Trước-trái, hơi trên cao.<br>*Lỗ đếm:* Thanh thẳng 15 lỗ (15L). Khớp nối có số 1 in trên thân. |
| **19** | 19 | Cụm con 2 | • `3737` (đen) ×1: Trục 10L<br>• `32013` (đen) ×1: Khớp nối trục góc số 1<br>• `32556` (vàng cát) ×1: Chốt dài 3L có gờ | Cắm trục 10L đen thẳng đứng vào lỗ trục của khớp nối góc số 1 ở đầu cần ngang (bước 18), thả thõng xuống dưới làm thanh treo máy bay. Gắn khớp nối góc số 1 đen vào đầu dưới cùng của trục 10L và xỏ chốt dài 3L tan ngang qua lỗ tròn để đón máy bay. | Cao | *Góc nhìn:* Trước-trái, hơi trên cao.<br>*Lỗ đếm:* Trục có số 10 trong ô linh kiện. Khớp nối có số 1 in trên thân. |
| **20** | 20 | Cụm con 2 | • `BP-7075(16)` (xanh ngọc) ×1: Thanh chữ L 4×6M<br>• `BP-7018M` (trắng) ×1: Cánh máy bay trái<br>• `BP-7017M` (trắng) ×1: Cánh máy bay phải<br>• `6558` (xanh dương) ×2: Chốt ma sát dài 3L | Thanh chữ L xanh ngọc làm thân máy bay, gắn lỗ giữa nhánh dài vào chốt 3L tan ở đáy trục treo bước 19 (nhánh ngắn chéo lên làm đuôi đứng). Hai cánh máy bay trắng ốp hai bên thân, dùng 2 chốt dài 3L xanh dương cắm xuyên qua cánh và thân để khóa chặt. | Cao | *Góc nhìn:* Trước-trái, cận cảnh máy bay.<br>*Ghi chú:* Cánh máy bay trái và phải dạng tấm cong khí động học. |
| **21** | 21 | Cụm con 2 | • `4519` (xám) ×1: Trục 3L<br>• `3713` (xám) ×2: Ống lót / bạc 1L | Xỏ trục 3L xám ngang qua lỗ trên cùng ở phần đuôi dựng đứng của thanh chữ L xanh ngọc. Xỏ 2 bạc xám vào hai đầu trục nhô ra ở hai bên đuôi máy bay. | Cao | *Góc nhìn:* Trước-trái, cận cảnh đuôi máy bay.<br>*Lỗ đếm:* Trục có số 3 trong ô linh kiện. Tạo hình động cơ phản lực đuôi máy bay. |
| **22** | 22 | Cụm con 2 | *(Không thêm chi tiết mới - `view_only: true`)* | Không có ô linh kiện. Quan sát và kiểm tra Cụm con 2 (cần quay và máy bay hoàn chỉnh trên trục treo) trước khi ghép vào Cụm con 1. | Cao | *Góc nhìn:* Trước-trái, cận cảnh máy bay hoàn chỉnh.<br>*Ghi chú:* Cụm con 2 gồm đúng 44 chi tiết vật lý. |
| **23** | 23 | Cụm chính | *(Ghép hai cụm con - Không chi tiết rời mới)* | Ghép toàn bộ Cụm con 2 lên Cụm con 1: Hai chốt xám nhô sang hai bên cổ động cơ trên (ở bước 12) được cắm vào hai lỗ trên cùng của hai thanh xanh ngọc 9L (ở bước 8). | Cao | *Góc nhìn:* Trước-phải, trên cao (toàn cảnh).<br>*Ghi chú:* Không có ô linh kiện, viền đỏ bao quanh toàn bộ Cụm con 2 khi ghép vào Cụm con 1. |
| **24** | 24 | Cụm chính | • `BP-7021(16)` (xanh ngọc) ×2: Thanh thẳng dài 13L<br>• `3673` (xám) ×2: Chốt trơn 2L | Cắm 2 chốt xám vào 2 lỗ bên hông phía sau của động cơ dưới. Hai thanh dài xanh ngọc 13L dựng chéo ở mặt sau tháp: lỗ trên gắn vào chốt xám ở hông sau động cơ trên (bước 11), lỗ dưới gắn vào 2 chốt xám vừa cắm ở động cơ dưới. | Cao | *Góc nhìn:* Sau-trái, cận cảnh thân tháp.<br>*Lỗ đếm:* Thanh thẳng dài (BP-7021(16) / Beam 13M). Tạo thành 2 thanh giằng sau tháp trong hệ 4 khâu. |
| **25** | 25 | Cụm chính | • `87082` (đen) ×2: Khớp nối vuông góc 2L<br>• `48989` (xám) ×2: Khớp nối 4 chốt vuông góc | Gắn 2 khớp nối đen 87082 vào 2 lỗ ở đuôi sau của động cơ dưới (chốt tròn nhô sang hai bên). Gắn 2 khớp nối xám 48989 vào các lỗ bên hông phía trước của động cơ dưới (mỗi bên 1 cái, các chốt nhô sang ngang). | Cao | *Góc nhìn:* Sau-trái, cận cảnh chân đế động cơ dưới.<br>*Ghi chú:* Tạo các điểm liên kết để lắp khung đế ở bước 26 và 27. |
| **26** | 26 | Cụm chính | • `BP-7525A(16)` (trắng) ×2: Thanh thẳng 7 lỗ<br>• `2780` (đen) ×6: Chốt ma sát 2L | Một thanh trắng 7L gắn ngang vào 2 khớp nối đen ở đuôi sau động cơ dưới; một thanh trắng 7L gắn ngang vào 2 khớp nối xám ở đầu trước động cơ dưới. Cắm 4 chốt đen vào thanh trắng phía trước (hướng ra ngoài) và 2 chốt đen vào thanh trắng phía sau. | Cao | *Góc nhìn:* Sau-trái, cận cảnh chân đế động cơ dưới.<br>*Lỗ đếm:* Thanh 7 lỗ (Beam 7M). Hàng 6 chốt đen chuẩn bị liên kết với 2 thanh đế dài 15L. |
| **27** | 27 | Cụm chính | • `32278` (trắng) ×2: Thanh thẳng 15 lỗ | Hai thanh trắng 15L đặt nằm ngang song song gắn vào các chốt đen ở bước 26 (mỗi bên sườn 1 thanh), kéo dài về phía trước làm bệ đỡ cho bộ não WeDo. | Cao | *Góc nhìn:* Sau-trái, góc nhìn bệ đế.<br>*Lỗ đếm:* Thanh thẳng 15 lỗ (15L). Tạo khung đế chịu lực chính cho toàn bộ giàn bay. |
| **28** | 28 | Cụm chính | • `BE-5158` (trắng/xanh) ×1: Bộ não điều khiển WeDo<br>• `3673`/`32054` (xám) ×4: Chốt trơn 2L | Đặt bộ não WeDo BE-5158 vào giữa hai thanh trắng 15L ở phần đế phía trước (mặt có 3 nút bấm hướng lên trên). Cắm 4 chốt xám từ ngoài xuyên qua lỗ thanh trắng 15L vào 2 lỗ bên hông bộ não (mỗi bên 2 chốt). | Cao | *Góc nhìn:* Trước-phải, góc nhìn bệ đế.<br>*Ghi chú:* Bộ não thông minh M5-RCU (BE-5158) nằm vững chắc ở đầu bệ đế. |
| **29** | 29 | Cụm chính | • `BP-7079(16)` (xanh ngọc) ×2: Thanh chữ L 2×4M<br>• `2780` (đen) ×4: Chốt ma sát 2L | Cắm 4 chốt đen vào đuôi hai thanh đế trắng 15L (mỗi bên 2 chốt). Gắn 2 thanh chữ L xanh ngọc ốp ra ngoài cùng phía sau, nhánh ngắn quay xuống dưới làm chân đế sau chống lật. | Cao | *Góc nhìn:* Sau-phải, góc nhìn chân đế.<br>*Ghi chú:* Thanh chữ L (Angular Beam 2x4M) làm chân đế chống lật khi giàn bay quay tốc độ cao. |
| **30** | 30 | Cụm chính | *(Không thêm chi tiết mới - `view_only: true`)* | Không có ô linh kiện. Toàn cảnh mô hình giàn bay giải cứu hoàn chỉnh sau khi lắp xong. | Cao | *Góc nhìn:* Trước-phải, trên cao (toàn cảnh).<br>*view_only:* `true`, `new_parts: []`. Mô hình hoàn tất sẵn sàng kết nối dây động cơ vào bộ não để lập trình. |

---

## 3. Bảng tổng hợp linh kiện (Totals) đối chiếu CAD & Hộp kit

| STT | Tên gọi & Đặc điểm | Mã CAD / LDraw | Mã hộp kit (set2321A) | Màu sắc | Số lượng dùng |
|:---:|---|:---:|:---:|:---:|:---:|
| 1 | Động cơ thông minh (vỏ trắng, đĩa quay xanh ngọc) | `be-3578.dat` | `BE-3581` / `BE-1154` | Trắng / Xanh ngọc | 2 |
| 2 | Bộ não điều khiển WeDo M5-RCU (3 nút bấm) | `be-5158.dat` | `BE-5158` | Trắng / Xanh ngọc | 1 |
| 3 | Chốt ma sát 2L (chốt đen tiêu chuẩn) | `2780.dat` | `BP-7012 (02)` | Đen | 16 |
| 4 | Chốt không ma sát 2L (chốt xám xoay trơn) | `3673.dat` | `BP-7011 (09)` / `BP-7013` | Xám | 8 |
| 5 | Chốt trơn 2L / 3L cố định bộ não WeDo | `32054.dat` | `BP-7011 (09)` | Xám | 4 |
| 6 | Chốt trục có ma sát 2L (1 đầu chốt, 1 đầu trục) | `43093.dat` | `BP-7014` / `BP-7016` | Xanh dương | 4 |
| 7 | Chốt ma sát dài 3L (cố định cánh máy bay) | `6558.dat` | `BP-7015` | Xanh dương | 2 |
| 8 | Chốt dài 3L có gờ chặn (cổ động cơ, đầu cần, treo máy bay) | `32556.dat` | `BP-7018 M` / `BP-7015` | Vàng cát (Tan) | 4 |
| 9 | Ống lót / Bạc tiêu chuẩn 1L | `3713.dat` | `BP-3990 (04)` | Xám | 5 |
| 10 | Bạc nửa 1/2 bush (định vị kẹp trục vít) | `32123a.dat` | `BP-7099 (02)` | Vàng | 2 |
| 11 | Ống nối chốt tròn 2L (định vị trục 9L & cổ động cơ) | `62462.dat` | `BP-7001 (16)` | Xám | 4 |
| 12 | Khớp nối chữ thập 4 chốt vuông góc | `48989.dat` | `BP-7006 (01)` | Xám | 3 |
| 13 | Khớp nối đôi 3L vuông góc | `32184.dat` | `BP-7549 B` | Xanh ngọc | 2 |
| 14 | Khớp nối trục góc số 1 (góc tù / 135°) | `32013.dat` | `BP-7023 (01)` | Đen | 2 |
| 15 | Khớp nối trục góc số 2 (thẳng / 180°) | `32034.dat` | `BP-7022 (02)` | Đen | 1 |
| 16 | Khớp nối vuông góc 2L (2 lỗ chốt) | `87082.dat` | `BP-7553 B` | Đen | 2 |
| 17 | Khối nối 1×2 lỗ trục-chốt (tay đòn nâng hạ) | `60483.dat` | `BP-7004 (01)` | Đen | 2 |
| 18 | Ống nối trục thẳng 2L | `59443.dat` | `BP-7002 (16)` | Đen | 1 |
| 19 | Bánh răng 24 răng | `3648b.dat` | `BP-7017 M` | Xám đậm | 2 |
| 20 | Bánh răng nhỏ 8 răng | `10928.dat` | `BP-7009 (01)` | Xám đậm | 1 |
| 21 | Bánh răng trục vít (worm screw) 2L | `4716.dat` | `BP-7003 (02)` | Xám | 1 |
| 22 | Trục 10L | `3737.dat` | `BP-7049 (02)` | Đen | 2 |
| 23 | Trục 8L | `3707.dat` | `BP-7047 (03)` | Đen | 1 |
| 24 | Trục 9L | `60485.dat` | `BP-7048 (02)` | Xám | 1 |
| 25 | Trục 4L có gờ chặn (axle with stop) | `87083.dat` | `BP-7628 (02)` | Đen | 2 |
| 26 | Trục 3L | `4519.dat` | `BP-3991 (01)` | Xám | 3 |
| 27 | Thanh thẳng 15 lỗ (cần ngang & bệ đế) | `32278.dat` | `BP-7021 (16)` | Trắng | 4 |
| 28 | Thanh thẳng 7 lỗ (lưng động cơ & nẹp ngang đế) | `bp-7525a(16).dat` | `BP-7525A (06)` | Trắng | 3 |
| 29 | Thanh thẳng dài giằng sau tháp (13L/15L) | `bp-7021(16).dat` | `BP-7021 (16)` | Xanh ngọc | 2 |
| 30 | Thanh thẳng 9 lỗ (cần nâng di động) | `bp-7526a(16).dat` | `BP-7526A (16)` | Xanh ngọc | 2 |
| 31 | Thanh chữ L 4×6M (thân và đuôi máy bay) | `bp-7075(16).dat` | `BP-7075 (16)` | Xanh ngọc | 1 |
| 32 | Thanh chữ L 2×4M (chân chống lật sau đế) | `bp-7079(16).dat` | `BP-7079 (16)` | Xanh ngọc | 2 |
| 33 | Khung chữ nhật 5×7 lỗ | `bp-3976(16).dat` | `BP-3976 (16)` | Xanh ngọc | 1 |
| 34 | Thanh thẳng 3 lỗ | `32523.dat` | `BP-7523A (12)` | Vàng | 2 |
| 35 | Thanh tam giác mỏng 3×5 | `99773.dat` | `BP-7094 (01)` | Xám | 4 |
| 36 | Cánh máy bay trái (tấm cong 3×11) | `bp-7018m.dat` | `BP-7018 M` | Trắng | 1 |
| 37 | Cánh máy bay phải (tấm cong 3×11) | `bp-7017m.dat` | `BP-7017 M` | Trắng | 1 |
| **TỔNG** | **37 loại chi tiết** | | | | **101** |

> *Ghi chú về con số 103:* File CAD `references/lop3/bai08/x/io/model.ldr` có tổng cộng 103 dòng khai báo phần tử `1 <color> <x> <y> <z> ... <part.dat|ldr>`. Trong đó có đúng **101 chi tiết linh kiện vật lý** và **2 thực thể gọi cụm con** (`submodel group 1` và `submodel group 2`). Do đó 101 chi tiết trong các bước lắp ráp khớp chính xác 100% với file CAD.

---

## 4. Phân tích cơ chế hoạt động và chuyển động

Mô hình "Giải cứu máy bay" (Bài 8 - Lớp 3) là một giàn bay mô phỏng (flight simulator / rescue rig) sử dụng cơ chế truyền động 2 động cơ độc lập rất thông minh:

### 4.1. Động cơ dưới: Cơ cấu nâng hạ / nghiêng tháp (Pitch/Elevation Mechanism)
- **Đường truyền lực:**
  $$\text{Động cơ dưới} \rightarrow \text{Đĩa quay} \rightarrow \text{Trục đứng 8L} \rightarrow \text{Trục vít xám} \rightarrow \text{Bánh răng 24 răng} \rightarrow \text{Trục ngang 9L} \rightarrow \text{2 tay đòn đen 1×2} \rightarrow \text{2 thanh đứng 9L}$$
- **Nguyên lý chuyển động:**
  - Hai thanh đứng 9L xanh ngọc được nối khớp trơn ở chân với 2 tay đòn đen trên trục 9L, và nối khớp trơn ở đỉnh với cổ của động cơ trên.
  - Phía sau tháp, hai thanh dài xanh ngọc (13L) nối khớp trơn từ hông động cơ dưới lên hông động cơ trên.
  - Tổ hợp này tạo thành một **cơ cấu 4 khâu bản lề (four-bar linkage)** dạng hình bình hành/hình thang biến dạng.
  - Khi động cơ dưới quay, trục vít làm quay bánh răng 24 răng từ từ, làm hai tay đòn quay gập hoặc duỗi, từ đó **đẩy cụm động cơ trên và cần treo máy bay nâng lên cao hoặc hạ thấp xuống (thay đổi độ nghiêng của cột tháp)**.
- **Tính chất tự hãm (Self-locking):**
  - Trục vít có đặc tính chỉ truyền động theo một chiều: Trục vít có thể quay bánh răng 24 răng, nhưng bánh răng 24 răng **không thể quay ngược lại trục vít**.
  - Nhờ đó, khi ngắt điện động cơ dưới, trọng lượng của toàn bộ cụm máy bay và cần quay phía trên không thể làm tháp bị sập hay tụt xuống, giữ nguyên độ cao ổn định ở bất kỳ vị trí nào.

### 4.2. Động cơ trên: Cơ cấu quay vòng máy bay (Yaw/Rotation Mechanism)
- **Đường truyền lực:**
  $$\text{Động cơ trên} \rightarrow \text{Trục 3L} \rightarrow \text{Bánh răng nhỏ 8T} \rightarrow \text{Bánh răng lớn 24T} \rightarrow \text{Cột trục đứng 10L} \rightarrow \text{Cần ngang 15L} \rightarrow \text{Trục treo 10L} \rightarrow \text{Máy bay}$$
- **Nguyên lý chuyển động:**
  - Cặp bánh răng 8T và 24T tạo thành một **bộ truyền giảm tốc với tỉ số truyền $i = \frac{24}{8} = 3$**, giúp giảm tốc độ quay 3 lần và tăng mô men xoắn lên 3 lần.
  - Trục đứng 10L quay kéo theo thanh cần ngang 15L quay tròn quanh tâm tháp.
  - Chiếc máy bay được treo ở đầu cần ngang sẽ bay lượn thành một quỹ đạo vòng tròn trên không trung quanh giàn cứu hộ.

---

## 5. Câu hỏi cho chủ sản phẩm & Cần kiểm trên kit thật

1. **Về chuyển động của động cơ dưới:**
   - **Xác nhận:** Động cơ dưới làm **nghiêng cột tháp để nâng hạ độ cao** của máy bay giải cứu. Khi tay đòn xoay, thanh 9L đẩy động cơ trên di chuyển, khiến cột tháp ngả về trước hoặc dựng thẳng lên, làm thay đổi độ cao của máy bay trong không gian. Chức năng này khớp hoàn toàn với phiếu học tập PHT slide 2: *"tạo cho mình một mô hình máy bay có thể thay đổi tốc độ khi độ cao máy bay thay đổi"*.
2. **Làm rõ chi tiết "giảm xóc vàng" trong phiếu giao việc:**
   - Phiếu giao việc ghi *"khung có giảm xóc vàng"*. Tuy nhiên qua ảnh sách trang `p-03.png` và file CAD `model.ldr` (dòng 100 và 102: `32123a.dat`), hai chi tiết màu vàng bên trong khung 5×7 thực chất là **hai bạc nửa màu vàng (1/2 bush, mã Lego 32123a)** dùng để chêm định vị trục vít kẹp giữa hai bạc xám 1L (3713), không phải là lò xo hay giảm xóc (shock absorber).
3. **Độ dài thực tế của thanh xanh ngọc dài (bước 24):**
   - Trong file CAD, thanh giằng sau tháp mang tên `bp-7021(16).dat` ghi chú là `Beam 13M` (13 lỗ). Trong bảng kit `kit_set2321A.txt`, mã `BP-7021 (16)` tương ứng với thanh thẳng 15 lỗ. Cần người kiểm tra đối chiếu trực tiếp trên hộp kit thật xem thanh giằng sau tháp là thanh 13 lỗ hay 15 lỗ.
4. **Độ dài thực tế của hai thanh nâng di động (bước 8):**
   - Trong file CAD, hai thanh nâng mang mã `bp-7526a(16).dat` ghi chú là `Beam 9M` (9 lỗ). Đếm lỗ trên ảnh trang `p-08.png` cho thấy thanh có 9 lỗ. Cần người kiểm tra trên bộ kit thực tế xem đúng là thanh 9 lỗ màu xanh ngọc.
5. **Đối chiếu số lượng 101 linh kiện vật lý vs 103 trong CAD:**
   - File CAD `model.ldr` có 103 thực thể, trong đó gồm 101 chi tiết vật lý và 2 thực thể gọi submodel (`submodel group 1` và `submodel group 2`). Tổng `qty` trong 30 bước sách lắp ráp là 101 linh kiện, khớp chính xác 100% với 101 linh kiện CAD.
