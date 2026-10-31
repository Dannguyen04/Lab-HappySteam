// js/catalog.js – danh mục bài học Khối 1–5 cho trang chọn bài (index.html).
// Nguồn: khung chương trình AI Robotics tiểu học (phân phối theo tuần) và thư mục tài liệu từng bài trên Drive.
// Lớp 1 đủ 35 tuần theo khung chương trình; Lớp 2–5 lấy theo tên thư mục bài trên Drive (chưa đủ mọi tuần).
//
// Mỗi bài: L(lớp, học kì, số bài, tên, kiểu, thêm)
//   kiểu: 'model'   – bài mô hình: lắp ráp 3D → sáng tạo → lập trình & mô phỏng (mặc định)
//         'project' – bài dự án / trưng bày: ý tưởng → chế tạo → nâng cấp, poster → chia sẻ
//         'theory'  – bài không có mô hình: nội dung + phiếu học tập tương tác
//         'test'    – kiểm tra học kì
//   thêm: { href: trang bài đã làm xong (có href = mở được, không có = "Sắp có"), cover: ảnh thẻ, about: một câu giới thiệu }
// Thêm một bài mới đã làm xong: tạo trang lopX-baiYY.html rồi điền href (và cover) cho bài đó ở đây.
(function () {
  'use strict';

  const L = (grade, term, no, title, type = 'model', more = {}) => ({ grade, term, no, title, type, ...more });
  const PROJECT_WATER = 'Dự án “Hành trình dòng nước”';

  const LESSONS = [
    // ---------- Lớp 1 · Học kì I (tuần 1–18) ----------
    L(1, 1, 1, 'Làm quen bộ công cụ', 'model', { about: 'Nhận biết thanh thẳng, trục, chốt; lắp xe trượt dốc.' }),
    L(1, 1, 2, 'Động cơ', 'model', { about: 'Động cơ hoạt động thế nào; lắp và lập trình xe leo dốc.' }),
    L(1, 1, 3, 'Robot thám hiểm', 'model', { about: 'Robot tự hành khám phá nơi con người không tới được.' }),
    L(1, 1, 4, 'Cảm biến của robot', 'model', { about: 'Cảm biến chuyển động và cảm biến nghiêng.' }),
    L(1, 1, 5, 'Chào hỏi, kết bạn – Spy robot', 'model', { about: 'Lập trình với cảm biến, âm thanh và ghi âm.' }),
    L(1, 1, 6, 'Luật giao thông', 'model', { about: 'Đèn giao thông, biển báo; mô hình xe mô tô.' }),
    L(1, 1, 7, 'Trò chơi của bé', 'model', { about: 'Mô hình xích đu, khu vui chơi; lập trình động cơ.' }),
    L(1, 1, 8, 'Ngôi nhà thông minh', 'model', { about: 'Thiết bị tự động trong nhà; lập trình cửa tự động.' }),
    L(1, 1, 9, 'Thông tin liên lạc vũ trụ', 'model', {
      href: 'lop1-bai09.html',
      cover: 'assets/covers/lop1-bai09.jpg',
      about: 'Lắp vệ tinh 28 bước, gắn thêm chi tiết, lập trình anten bắt sóng và tránh thiên thạch.'
    }),
    L(1, 1, 10, 'Bạn gió tinh nghịch, gió ở đâu?', 'model', { about: 'Lợi ích của năng lượng gió; mô hình cối xoay gió.' }),
    L(1, 1, 11, 'Nước từ đâu đến', 'model', { about: 'Vòng tuần hoàn của nước; bánh xe nước, bánh răng truyền động.' }),
    L(1, 1, 12, 'Thiên tai, lũ lụt – Đê ngăn lũ', 'model', { about: 'Cửa đê tự động điều chỉnh mực nước sông.' }),
    L(1, 1, 13, 'Hiện tượng thiên nhiên – Tuyết rơi', 'model', { about: 'Tuyết hình thành thế nào; xe dọn tuyết với cảm biến.' }),
    L(1, 1, 14, 'Tìm hiểu đề tài dự án – Phác thảo ý tưởng', 'project', { about: PROJECT_WATER + ': thảo luận ý tưởng, phác thảo mô hình.' }),
    L(1, 1, 15, 'Chế tạo mô hình – Lập trình', 'project', { about: PROJECT_WATER + ': chế tạo, lập trình, kiểm tra và chỉnh sửa.' }),
    L(1, 1, 16, 'Nâng cấp ý tưởng, mô hình – Làm poster', 'project', { about: PROJECT_WATER + ': nâng cấp giải pháp, làm poster.' }),
    L(1, 1, 17, 'Chia sẻ giải pháp sáng tạo', 'project', { about: PROJECT_WATER + ': trình bày giải pháp.' }),
    L(1, 1, 18, 'Trưng bày tổng kết học kì I', 'project', { about: 'Trưng bày các sản phẩm sáng tạo.' }),
    // ---------- Lớp 1 · Học kì II (tuần 19–35) ----------
    L(1, 2, 19, 'Ốc sên quý hiếm', 'model', { about: 'Lắp và lập trình chú ốc sên; mini game ốc sên siêu tốc.' }),
    L(1, 2, 20, 'Nhà tôi dưới biển – Dolphin', 'model', { about: 'Cá heo di chuyển và phát âm thanh.' }),
    L(1, 2, 21, 'Thực vật và các tác nhân thụ phấn', 'model', { about: 'Con ong và bông hoa: mối liên hệ thụ phấn.' }),
    L(1, 2, 22, 'Mèo con tinh nghịch', 'model', { about: 'Mô hình con mèo; mini game mèo con thông minh.' }),
    L(1, 2, 23, 'Máy quạt thông minh', 'model', { about: 'Quạt điều khiển bằng cảm biến.' }),
    L(1, 2, 24, 'Robot dọn vệ sinh tự động', 'model', { about: 'Robot dọn dẹp điều khiển bằng cảm biến.' }),
    L(1, 2, 25, 'Xe ô tô thông minh', 'model', { about: 'Phương tiện giao thông thông minh; mini game ai nhanh hơn.' }),
    L(1, 2, 26, 'Sáng tạo phương tiện di chuyển thông minh', 'model', { about: 'Sáng tạo và lập trình xe; an toàn giao thông.' }),
    L(1, 2, 27, 'Cầu thủ đỉnh cao', 'model', { about: 'Môn bóng đá và lợi ích của thể dục.' }),
    L(1, 2, 28, 'Thủ môn xuất sắc', 'model', { about: 'Mô hình thủ môn bắt bóng.' }),
    L(1, 2, 29, 'Cổ động viên cuồng nhiệt', 'model', { about: 'Mô hình cổ động viên.' }),
    L(1, 2, 30, 'Bóng chày', 'model', { about: 'Môn bóng chày; lắp và lập trình cầu thủ bóng chày.' }),
    L(1, 2, 31, 'Tìm hiểu đề tài dự án – Phác thảo ý tưởng', 'project', { about: PROJECT_WATER + ': thảo luận ý tưởng, phác thảo mô hình.' }),
    L(1, 2, 32, 'Chế tạo mô hình – Lập trình', 'project', { about: PROJECT_WATER + ': chế tạo, lập trình, kiểm tra và chỉnh sửa.' }),
    L(1, 2, 33, 'Nâng cấp ý tưởng, mô hình – Làm poster', 'project', { about: PROJECT_WATER + ': nâng cấp giải pháp, làm poster.' }),
    L(1, 2, 34, 'Chia sẻ giải pháp sáng tạo', 'project', { about: PROJECT_WATER + ': trình bày giải pháp.' }),
    L(1, 2, 35, 'Trưng bày tổng kết học kì II', 'project', { about: 'Trưng bày các sản phẩm sáng tạo.' }),

    // ---------- Lớp 2 ----------
    L(2, 1, 1, 'Truyền động bánh đai – dây đai'),
    L(2, 1, 2, 'Truyền động bánh răng'),
    L(2, 1, 3, 'Lực kéo'),
    L(2, 1, 4, 'Lực cân bằng'),
    L(2, 1, 5, 'Các yếu tố ảnh hưởng vận tốc'),
    L(2, 1, 6, 'Cứu trợ và cứu hộ'),
    L(2, 1, 7, 'Xuất khẩu thực phẩm'),
    L(2, 1, 8, 'Khám phá đại dương'),
    L(2, 1, 9, 'Giáng sinh an lành'),
    L(2, 1, 10, 'Cảnh báo nguy hiểm'),
    L(2, 1, 11, 'Siêu thị – Super Market'),
    L(2, 1, 12, 'Máy may quần áo'),
    L(2, 1, 13, 'Thiết bị đo lường'),
    L(2, 2, 19, 'Quá trình biến đổi của loài ếch'),
    L(2, 2, 20, 'Quá trình biến đổi của loài ếch (tiếp theo)'),
    L(2, 2, 21, 'Nhà tôi dưới biển – Cá vàng'),
    L(2, 2, 22, 'Những chú chim vui vẻ'),
    L(2, 2, 23, 'Cún con dễ thương'),
    L(2, 2, 24, 'Khủng long bạo chúa'),
    L(2, 2, 25, 'Khủng long ăn cỏ'),
    L(2, 2, 26, 'Tom and Jerry'),
    L(2, 2, 27, 'Ghế bay – Flying chair'),
    L(2, 2, 28, 'Trò chơi dân gian – Cướp cờ'),
    L(2, 2, 29, 'Robot họa sĩ'),
    L(2, 2, 30, 'Nhạc trưởng'),
    L(2, 2, null, 'Kiểm tra học kì II', 'test'),

    // ---------- Lớp 3 ----------
    L(3, 1, 1, 'Cấu trúc bền vững'),
    L(3, 1, 2, 'Di chuyển vật thể'),
    L(3, 1, 3, 'Cơ cấu đòn bẩy – Máy bắn đá'),
    L(3, 1, 4, 'Phân loại, tái chế rác thải'),
    L(3, 1, 5, 'Xe đổ rác'),
    L(3, 1, 6, 'Năng lượng sạch – Cối xoay gió'),
    L(3, 1, 7, 'Giao thông đường sắt'),
    L(3, 1, 8, 'Giải cứu máy bay'),
    L(3, 1, 9, 'Vượt bão'),
    L(3, 1, 10, 'Robot thám hiểm sao Hỏa'),
    L(3, 1, 11, 'Sống trên sao Hỏa – Tìm kiếm nguồn nước'),
    L(3, 1, 12, 'Sống trên sao Hỏa – Trồng cây'),
    L(3, 1, 13, 'Phi thuyền không gian'),
    L(3, 1, 14, 'Cây đàn ghi-ta'),
    L(3, 1, 15, 'Robot đẩy xe'),
    L(3, 1, 16, 'Xe tên lửa'),
    L(3, 2, 19, 'Truyền động bánh đai – dây đai'),
    L(3, 2, 20, 'Cánh tay robot'),
    L(3, 2, 21, 'Xe cứu hỏa'),
    L(3, 2, 22, 'Tàu vận chuyển thương mại'),
    L(3, 2, 23, 'Thang máy'),
    L(3, 2, 24, 'Khỉ Gorilla'),
    L(3, 2, 25, 'Thằn lằn hoa'),
    L(3, 2, 26, 'Nhà tôi dưới biển'),
    L(3, 2, 27, 'Cá sấu tham ăn'),
    L(3, 2, 28, 'Robo Sumo'),
    L(3, 2, 29, 'Bóng rổ'),
    L(3, 2, 30, 'Olympic Game'),
    L(3, 2, 31, 'Con rồng phép thuật'),
    L(3, 2, 32, 'Đua bò tót'),
    L(3, 2, 33, 'Bơi lội'),
    L(3, 2, null, 'Kiểm tra học kì II', 'test'),

    // ---------- Lớp 4 ----------
    L(4, 1, 1, 'Robot dò đường – Line follower'),
    L(4, 1, 2, 'Cấu trúc đòn bẩy'),
    L(4, 1, 3, 'Lực đàn hồi'),
    L(4, 1, 4, 'Hươu cao cổ'),
    L(4, 1, 5, 'Chú thỏ dễ thương'),
    L(4, 1, 6, 'Chú voi con ở bản Đôn'),
    L(4, 1, 7, 'Chú khủng long'),
    L(4, 1, 8, 'Con rắn'),
    L(4, 1, 9, 'Xe điều khiển'),
    L(4, 1, 10, 'Xiếc thú – Khỉ đu dây'),
    L(4, 1, 11, 'Vòng xoay ngựa gỗ'),
    L(4, 1, 12, 'Trượt tuyết'),
    L(4, 1, 13, 'Đua thuyền'),
    L(4, 1, 14, 'Xe ô tô vượt địa hình'),
    L(4, 1, 15, 'Xe đạp'),
    L(4, 1, 16, 'Tàu hải tặc'),
    L(4, 1, 17, 'Kiểm tra học kì I', 'test'),
    L(4, 2, 19, 'Xe vượt địa hình'),
    L(4, 2, 20, 'Máy đánh trứng'),
    L(4, 2, 21, 'Máy chiếu phim'),
    L(4, 2, 22, 'Cáp treo'),
    L(4, 2, 23, 'Bò kéo lúa'),
    L(4, 2, 24, 'Cần câu cá'),
    L(4, 2, 25, 'Xe tự động – Batmobile'),
    L(4, 2, 26, 'Vận chuyển container tự động ở cảng'),
    L(4, 2, 27, 'Máy nhồi bột làm bánh'),
    L(4, 2, 28, 'Công nghệ sinh học'),
    L(4, 2, 29, 'Xe tăng chiến đấu'),
    L(4, 2, 30, 'Máy bay quân sự'),
    L(4, 2, 31, 'Tàu quân sự'),
    L(4, 2, 32, 'Robot dò tìm bom đạn'),
    L(4, 2, 33, 'Sáng tạo mô hình bảo vệ Tổ quốc', 'project'),
    L(4, 2, 34, 'Kiểm tra học kì II', 'test'),

    // ---------- Lớp 5 (Drive mới có một phần) ----------
    L(5, 1, 1, 'Xe buýt tự động'),
    L(5, 1, 8, 'Sư tử dũng mãnh'),
    L(5, 1, 10, 'Con sâu đo'),
    L(5, 1, 11, 'Con cua'),
    L(5, 1, 16, 'Robot đi bộ – Robot walk'),
    L(5, 2, 24, 'Thuyền dọn rác'),
    L(5, 2, 30, 'Nhạc trưởng')
  ];

  const TYPES = {
    model: { label: 'Mô hình', hint: 'Lắp ráp 3D · sáng tạo · lập trình' },
    project: { label: 'Dự án', hint: 'Ý tưởng · chế tạo · trình bày' },
    theory: { label: 'Tìm hiểu', hint: 'Nội dung · phiếu học tập' },
    test: { label: 'Kiểm tra', hint: 'Đánh giá cuối học kì' }
  };

  window.ZM_CATALOG = { lessons: LESSONS, types: TYPES, grades: [1, 2, 3, 4, 5] };
})();
