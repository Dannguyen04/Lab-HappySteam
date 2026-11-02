// mock/trung-bay.js – Dữ liệu giả & nghiệp vụ S-14, Màn chiếu 6.6, S-15, S-16, S-17 (Phiếu 73c)
(function () {
  'use strict';

  const STORAGE_KEY = 'mock.trungBay.v1';
  const GUEST_TICKET_KEY = 'mock.trungBay.currentTicket';

  // Bộ 12 câu mẫu từ docs/ba/cau-mau.md (GD-19)
  const PRESET_COMMENTS = [
    { id: 'K1', kind: 'khen', text: 'Ý tưởng của nhóm hay quá!' },
    { id: 'K2', kind: 'khen', text: 'Nhóm giúp được người khác, tuyệt vời!' },
    { id: 'K3', kind: 'khen', text: 'Mô hình chạy rất êm.' },
    { id: 'K4', kind: 'khen', text: 'Mô hình chắc chắn, lắp khéo ghê!' },
    { id: 'K5', kind: 'khen', text: 'Chương trình của nhóm thông minh quá!' },
    { id: 'K6', kind: 'khen', text: 'Poster đẹp và dễ hiểu.' },
    { id: 'K7', kind: 'khen', text: 'Nhóm kể về dự án rất hay.' },
    { id: 'K8', kind: 'khen', text: 'Cả nhóm làm việc cùng nhau rất vui!' },
    { id: 'G1', kind: 'gop_y', text: 'Nhóm thử cho mô hình chạy nhanh hơn nhé.' },
    { id: 'G2', kind: 'gop_y', text: 'Nhóm thử thêm một chi tiết sáng tạo nữa nhé.' },
    { id: 'G3', kind: 'gop_y', text: 'Mình muốn nghe nhóm kể thêm về dự án.' },
    { id: 'G4', kind: 'gop_y', text: 'Nhóm thử vẽ thêm hình lên poster nhé.' }
  ];

  // Danh sách 28 học sinh lớp 1A2 (tên gọi ngắn tiếng Việt + con vật đại diện không trùng, chia 7 nhóm × 4 em)
  const STUDENTS_1A2 = [
    // Nhóm 1: Cá Voi
    { id: 'hs01', nickname: 'An B.', animal: 'Cá heo', groupId: 'g1', consent: true },
    { id: 'hs02', nickname: 'Bình', animal: 'Gấu trúc', groupId: 'g1', consent: true },
    { id: 'hs03', nickname: 'Châu', animal: 'Thỏ trắng', groupId: 'g1', consent: true },
    { id: 'hs04', nickname: 'Dũng', animal: 'Sư tử', groupId: 'g1', consent: true },
    // Nhóm 2: Ong Vàng
    { id: 'hs05', nickname: 'Đạt', animal: 'Hổ con', groupId: 'g2', consent: true },
    { id: 'hs06', nickname: 'Giang', animal: 'Cáo đỏ', groupId: 'g2', consent: true },
    { id: 'hs07', nickname: 'Hà', animal: 'Mèo mướp', groupId: 'g2', consent: true },
    { id: 'hs08', nickname: 'Hải', animal: 'Cún con', groupId: 'g2', consent: true },
    // Nhóm 3: Tàu Lá
    { id: 'hs09', nickname: 'Hân', animal: 'Gấu túi', groupId: 'g3', consent: true },
    { id: 'hs10', nickname: 'Hiếu', animal: 'Voi con', groupId: 'g3', consent: true },
    { id: 'hs11', nickname: 'Hoàng', animal: 'Chim cú', groupId: 'g3', consent: true },
    { id: 'hs12', nickname: 'Huy', animal: 'Chim cánh cụt', groupId: 'g3', consent: true },
    // Nhóm 4: Mây Xanh
    { id: 'hs13', nickname: 'Khang', animal: 'Rùa xanh', groupId: 'g4', consent: true },
    { id: 'hs14', nickname: 'Khánh', animal: 'Hươu cao cổ', groupId: 'g4', consent: true },
    { id: 'hs15', nickname: 'Khôi', animal: 'Ngựa vằn', groupId: 'g4', consent: true },
    { id: 'hs16', nickname: 'Lam', animal: 'Sóc nâu', groupId: 'g4', consent: false },
    // Nhóm 5: Sao Băng
    { id: 'hs17', nickname: 'Linh', animal: 'Nhím nhỏ', groupId: 'g5', consent: true },
    { id: 'hs18', nickname: 'Long', animal: 'Rái cá', groupId: 'g5', consent: true },
    { id: 'hs19', nickname: 'Mai', animal: 'Gấu nâu', groupId: 'g5', consent: true },
    { id: 'hs20', nickname: 'Minh C.', animal: 'Ếch cốm', groupId: 'g5', consent: true },
    // Nhóm 6: Tia Chớp
    { id: 'hs21', nickname: 'Minh T.', animal: 'Khỉ con', groupId: 'g6', consent: true },
    { id: 'hs22', nickname: 'My', animal: 'Bạch tuộc', groupId: 'g6', consent: true },
    { id: 'hs23', nickname: 'Nam', animal: 'Kỳ lân', groupId: 'g6', consent: true },
    { id: 'hs24', nickname: 'Ngân', animal: 'Bướm vàng', groupId: 'g6', consent: true },
    // Nhóm 7: Giọt Sương (ĐANG LÀM)
    { id: 'hs25', nickname: 'Ngọc', animal: 'Ong mật', groupId: 'g7', consent: true },
    { id: 'hs26', nickname: 'Nhi', animal: 'Bọ rùa', groupId: 'g7', consent: true },
    { id: 'hs27', nickname: 'Phong', animal: 'Ốc sên', groupId: 'g7', consent: true },
    { id: 'hs28', nickname: 'Quân', animal: 'Công xanh', groupId: 'g7', consent: false }
  ];

  function createDefaultState() {
    return {
      session: {
        id: 'tb-1a2-hk1',
        className: '1A2',
        teacherName: 'Cô Nguyễn Thị Lan',
        title: 'Trưng bày Học kì I: Hành trình dòng nước & Liên lạc vũ trụ',
        state: 'DANG_MO', // CHUAN_BI | DANG_MO | DA_DONG
        showLeaderboard: true,
        openedAt: '2026-11-02T08:00:00+07:00',
        autoCloseAt: '2026-11-03T08:00:00+07:00',
        criteria: ['Ý tưởng', 'Mô hình chạy được', 'Trình bày']
      },
      groups: [
        {
          id: 'g1',
          name: 'Cá Voi',
          projectTitle: 'Trạm phao vệ tinh báo mực nước sông',
          baseLesson: 'Bài 9 · Thông tin liên lạc vũ trụ (NV1–NV5)',
          idea: 'Gắn anten vệ tinh lên phao nổi để phát tín hiệu cảnh báo về đất liền khi nước sông dâng cao.',
          upgrade: 'Thêm còi báo và chương trình quay anten 3 hướng bắt sóng.',
          cover: '../assets/covers/lop1-bai09.jpg',
          status: 'DA_NOP',
          teacherGrade: 'HTT',
          teacherComment: 'Nhóm kết hợp tốt mô hình vệ tinh Bài 9 với chủ đề dòng nước, chương trình chạy đủ 5 nhiệm vụ.'
        },
        {
          id: 'g2',
          name: 'Ong Vàng',
          projectTitle: 'Cối xoay gió bơm nước tưới vườn trường',
          baseLesson: 'Bài 10 · Bạn gió tinh nghịch',
          idea: 'Dùng sức gió quay cánh quạt để bơm nước tự động từ bể chứa ra luống rau của lớp.',
          upgrade: 'Lắp thêm nút bấm đổi 2 tốc độ quay nhanh và chậm.',
          cover: '../assets/covers/lop1-bai10.jpg',
          status: 'DA_NOP',
          teacherGrade: 'HTT',
          teacherComment: 'Khung cối xoay chắc chắn, các em chia việc rõ ràng và giải thích nguyên lý mạch lạc.'
        },
        {
          id: 'g3',
          name: 'Tàu Lá',
          projectTitle: 'Guồng nước tự động vớt lá và rác mặt hồ',
          baseLesson: 'Bài 11 · Nước từ đâu đến',
          idea: 'Bánh xe nước vừa quay tạo dòng chảy vừa đưa lưới nhỏ vớt lá khô trên mặt hồ công viên.',
          upgrade: 'Thêm khay đựng lá phía sau bánh răng truyền động.',
          cover: '../assets/covers/lop1-bai11.jpg',
          status: 'DA_NOP',
          teacherGrade: 'HTT',
          teacherComment: 'Ý tưởng gần gũi và thiết thực, mô hình guồng quay êm, poster vẽ sơ đồ rất sáng rõ.'
        },
        {
          id: 'g4',
          name: 'Mây Xanh',
          projectTitle: 'Cửa đê thông minh ngăn lũ về làng',
          baseLesson: 'Bài 12 · Thiên tai, lũ lụt – Đê ngăn lũ',
          idea: 'Khi cảm biến phát hiện mực nước dâng, động cơ tự hạ cửa đê xuống để bảo vệ nhà dân.',
          upgrade: 'Thêm đèn hiệu cảnh báo trên đỉnh trụ đê.',
          cover: '../assets/covers/lop1-bai12.jpg',
          status: 'DA_NOP',
          teacherGrade: 'HT',
          teacherComment: 'Mô hình cửa đê đóng mở đúng lúc, nhóm cần luyện nói to hơn khi chia sẻ.'
        },
        {
          id: 'g5',
          name: 'Sao Băng',
          projectTitle: 'Xe dọn băng tuyết mở đường cấp nước',
          baseLesson: 'Bài 13 · Hiện tượng thiên nhiên – Tuyết rơi',
          idea: 'Xe tự hành gắn lưỡi gạt dọn tuyết chắn đường ống dẫn nước sạch trên vùng núi lạnh.',
          upgrade: 'Lập trình cảm biến dừng lại khi gặp chướng ngại vật lớn.',
          cover: '../assets/covers/lop1-bai13.jpg',
          status: 'DA_NOP',
          teacherGrade: 'HT',
          teacherComment: 'Xe chạy khỏe, phần lập trình cảm biến hoạt động ổn định.'
        },
        {
          id: 'g6',
          name: 'Tia Chớp',
          projectTitle: 'Robot Milo chở bình nước sạch vượt đồi',
          baseLesson: 'Bài 3 · Robot thám hiểm',
          idea: 'Robot Milo kéo rơ-moóc chở bình nước sạch lên đồi cao giúp các chú kiểm lâm.',
          upgrade: 'Gia cố khung giữ bình nước không bị nghiêng khi leo dốc.',
          cover: '../assets/covers/lop1-bai03.jpg',
          status: 'DA_NOP',
          teacherGrade: 'HT',
          teacherComment: 'Mô hình Milo kéo hàng tốt, nhóm hợp tác vui vẻ.'
        },
        {
          id: 'g7',
          name: 'Giọt Sương',
          projectTitle: 'Ốc sên cảm biến đo độ ẩm đất vườn',
          baseLesson: 'Bài 19 · Ốc sên quý hiếm',
          idea: 'Robot ốc sên bò quanh bồn cây và phát tiếng kêu báo hiệu khi đất bị khô.',
          upgrade: 'Đang vẽ hoàn thiện mục kết quả thử nghiệm trên poster.',
          cover: '../assets/covers/lop1-bai19.jpg',
          status: 'DANG_LAM', // BR-TB-08: Nhóm ĐANG LÀM không hiện trong lưới chấm
          teacherGrade: '',
          teacherComment: ''
        }
      ],
      tickets: [
        { no: 1, code: 'K7M4P9X2', status: 'DA_DUNG', firstUsedAt: '08:25' },
        { no: 2, code: 'R3N8W5T4', status: 'DA_DUNG', firstUsedAt: '08:30' },
        { no: 3, code: 'B6Y2H8J5', status: 'DA_DUNG', firstUsedAt: '08:34' },
        { no: 4, code: 'P4Q9D7F3', status: 'CHUA_DUNG', firstUsedAt: '' },
        { no: 5, code: 'H9V2C6B8', status: 'DA_THU_HOI', firstUsedAt: '08:28' },
        { no: 6, code: 'M5X3Z8N7', status: 'CHUA_DUNG', firstUsedAt: '' }
      ],
      // Các lượt chấm khớp chính xác số liệu ví dụ BRD 6.4 và 6.6:
      // - Tàu Lá (g3): 4 bạn (3/2/3, 3/3/2, 2/2/2, 3/2/3 = 30 sao) + 2 khách (2/1/3, 3/2/2 = 13 sao) + 1 phiếu thu hồi (1/1/1)
      //   -> TB Bạn: 2,8 / 2,3 / 2,5 (TB 2,5); TB Khách: 2,5 / 1,5 / 2,5 (TB 2,2); Xếp hạng: 6 lượt, 43 sao -> 2,4 (Hạng 3)
      // - Cá Voi (g1): 7 lượt (5 bạn + 2 khách), tổng 52 sao -> 52/21 = 2,48 -> 2,5 (Hạng 1)
      // - Ong Vàng (g2): 10 lượt (7 bạn + 3 khách), tổng 72 sao -> 72/30 = 2,4 (Hạng 2, 10 lượt)
      // - Sao Băng (g5): 4 lượt (3 bạn + 1 khách), tổng 26 sao -> 26/12 = 2,17 -> 2,2 (Hạng 4)
      // - Tia Chớp (g6): 3 lượt (2 bạn + 1 khách), tổng 19 sao -> 19/9 = 2,11 -> 2,1 (Hạng 5)
      // - Mây Xanh (g4): 2 lượt (1 bạn + 1 khách), tổng 18 sao -> < 3 lượt -> "Chưa xếp hạng" (Đứng cuối bảng)
      votes: [
        // --- Nhóm Tàu Lá (g3) ---
        { id: 'v-g3-b1', groupId: 'g3', source: 'BAN', raterId: 'hs01', stars: [3, 2, 3], presets: ['K1', 'K6'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:20' },
        { id: 'v-g3-b2', groupId: 'g3', source: 'BAN', raterId: 'hs05', stars: [3, 3, 2], presets: ['K3'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:22' },
        { id: 'v-g3-b3', groupId: 'g3', source: 'BAN', raterId: 'hs13', stars: [2, 2, 2], presets: ['G1'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:24' },
        { id: 'v-g3-b4', groupId: 'g3', source: 'BAN', raterId: 'hs17', stars: [3, 2, 3], presets: ['K2', 'K8'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:26' },
        { id: 'v-g3-k1', groupId: 'g3', source: 'KHACH', raterId: 'K7M4P9X2', stars: [2, 1, 3], presets: ['K1', 'K7'], text: 'Mô hình guồng nước quay đều, các con thuyết trình rất tự tin và lễ phép.', textStatus: 'DA_DUYET', updatedAt: '08:27' },
        { id: 'v-g3-k2', groupId: 'g3', source: 'KHACH', raterId: 'R3N8W5T4', stars: [3, 2, 2], presets: ['K6', 'G1'], text: 'Nếu thêm phễu hứng rác rộng hơn một chút thì guồng nước sẽ vớt được nhiều lá hơn.', textStatus: 'CHO_DUYET', updatedAt: '08:31' },
        { id: 'v-g3-k5', groupId: 'g3', source: 'KHACH', raterId: 'H9V2C6B8', stars: [1, 1, 1], presets: [], text: 'Thử bấm nhầm trên phiếu cũ.', textStatus: 'DA_AN', updatedAt: '08:29' },

        // --- Nhóm Cá Voi (g1): 7 lượt = 52 sao (5 bạn = 37 sao, 2 khách = 15 sao) ---
        { id: 'v-g1-b1', groupId: 'g1', source: 'BAN', raterId: 'hs05', stars: [3, 3, 2], presets: ['K5', 'K6'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:18' },
        { id: 'v-g1-b2', groupId: 'g1', source: 'BAN', raterId: 'hs09', stars: [3, 2, 2], presets: ['K1'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:19' },
        { id: 'v-g1-b3', groupId: 'g1', source: 'BAN', raterId: 'hs10', stars: [3, 3, 2], presets: ['K4', 'K8'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:21' },
        { id: 'v-g1-b4', groupId: 'g1', source: 'BAN', raterId: 'hs13', stars: [2, 3, 2], presets: ['K3'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:23' },
        { id: 'v-g1-b5', groupId: 'g1', source: 'BAN', raterId: 'hs21', stars: [2, 2, 3], presets: ['K7'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:25' },
        { id: 'v-g1-k1', groupId: 'g1', source: 'KHACH', raterId: 'K7M4P9X2', stars: [3, 3, 2], presets: ['K1', 'K5'], text: 'Ứng dụng bài học Thông tin liên lạc vũ trụ vào cảnh báo lũ rất sáng tạo!', textStatus: 'DA_DUYET', updatedAt: '08:28' },
        { id: 'v-g1-k2', groupId: 'g1', source: 'KHACH', raterId: 'B6Y2H8J5', stars: [2, 3, 2], presets: ['K4'], text: 'Anten vệ tinh quay đổi hướng mượt, các con hiểu rõ từng khối lệnh.', textStatus: 'CHO_DUYET', updatedAt: '08:35' },
        { id: 'v-g1-gv', groupId: 'g1', source: 'GIAO_VIEN', raterId: 'gv-lan', stars: [3, 3, 3], presets: ['K5', 'K6'], text: 'Nhóm vận dụng xuất sắc kiến thức Bài 9.', textStatus: 'DA_DUYET', updatedAt: '08:40' },

        // --- Nhóm Ong Vàng (g2): 10 lượt = 72 sao (7 bạn = 51 sao, 3 khách = 21 sao) ---
        { id: 'v-g2-b1', groupId: 'g2', source: 'BAN', raterId: 'hs01', stars: [3, 2, 3], presets: ['K2', 'K4'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:15' },
        { id: 'v-g2-b2', groupId: 'g2', source: 'BAN', raterId: 'hs02', stars: [2, 3, 2], presets: ['K3'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:16' },
        { id: 'v-g2-b3', groupId: 'g2', source: 'BAN', raterId: 'hs09', stars: [3, 2, 2], presets: ['K6'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:17' },
        { id: 'v-g2-b4', groupId: 'g2', source: 'BAN', raterId: 'hs11', stars: [3, 3, 2], presets: ['K1', 'K8'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:18' },
        { id: 'v-g2-b5', groupId: 'g2', source: 'BAN', raterId: 'hs14', stars: [2, 2, 3], presets: ['K7'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:19' },
        { id: 'v-g2-b6', groupId: 'g2', source: 'BAN', raterId: 'hs18', stars: [3, 2, 2], presets: ['G2'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:20' },
        { id: 'v-g2-b7', groupId: 'g2', source: 'BAN', raterId: 'hs22', stars: [2, 3, 2], presets: ['K4'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:21' },
        { id: 'v-g2-k1', groupId: 'g2', source: 'KHACH', raterId: 'K7M4P9X2', stars: [3, 2, 2], presets: ['K2', 'K4'], text: 'Cối xoay gió rất cứng cáp, ý tưởng tưới rau sân trường rất đáng khen.', textStatus: 'DA_DUYET', updatedAt: '08:26' },
        { id: 'v-g2-k2', groupId: 'g2', source: 'KHACH', raterId: 'R3N8W5T4', stars: [2, 3, 2], presets: ['K3'], text: 'Các con phối hợp nhịp nhàng khi bấm nút đổi tốc độ gió.', textStatus: 'CHO_DUYET', updatedAt: '08:32' },
        { id: 'v-g2-k3', groupId: 'g2', source: 'KHACH', raterId: 'B6Y2H8J5', stars: [2, 2, 3], presets: ['K7'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:36' },

        // --- Nhóm Mây Xanh (g4): 2 lượt = 18 sao (< 3 lượt -> Chưa xếp hạng) ---
        { id: 'v-g4-b1', groupId: 'g4', source: 'BAN', raterId: 'hs01', stars: [3, 3, 3], presets: ['K1', 'K4'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:29' },
        { id: 'v-g4-k1', groupId: 'g4', source: 'KHACH', raterId: 'B6Y2H8J5', stars: [3, 3, 3], presets: ['K2'], text: 'Mô hình cửa đê rất có ý nghĩa với vùng hay ngập lụt.', textStatus: 'DA_DUYET', updatedAt: '08:37' },

        // --- Nhóm Sao Băng (g5): 4 lượt = 26 sao -> 2,2 ---
        { id: 'v-g5-b1', groupId: 'g5', source: 'BAN', raterId: 'hs02', stars: [2, 2, 2], presets: ['K3'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:22' },
        { id: 'v-g5-b2', groupId: 'g5', source: 'BAN', raterId: 'hs06', stars: [3, 2, 2], presets: ['K4'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:24' },
        { id: 'v-g5-b3', groupId: 'g5', source: 'BAN', raterId: 'hs10', stars: [2, 3, 2], presets: ['G4'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:27' },
        { id: 'v-g5-k1', groupId: 'g5', source: 'KHACH', raterId: 'R3N8W5T4', stars: [2, 2, 2], presets: ['K5'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:33' },

        // --- Nhóm Tia Chớp (g6): 3 lượt = 19 sao -> 2,1 ---
        { id: 'v-g6-b1', groupId: 'g6', source: 'BAN', raterId: 'hs03', stars: [2, 2, 2], presets: ['K8'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:23' },
        { id: 'v-g6-b2', groupId: 'g6', source: 'BAN', raterId: 'hs07', stars: [3, 2, 2], presets: ['K4'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:25' },
        { id: 'v-g6-k1', groupId: 'g6', source: 'KHACH', raterId: 'K7M4P9X2', stars: [2, 2, 2], presets: ['G1'], text: '', textStatus: 'KHONG_CO', updatedAt: '08:30' }
      ]
    };
  }

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.session && Array.isArray(parsed.groups) && Array.isArray(parsed.votes)) {
          return parsed;
        }
      }
    } catch (_) {
      // Bỏ qua lỗi đọc bộ nhớ
    }
    const fresh = createDefaultState();
    saveState(fresh);
    return fresh;
  }

  function saveState(nextState) {
    if (nextState) state = nextState;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {
      // Bỏ qua nếu trình duyệt chặn localStorage
    }
  }

  // ---------- Các hàm tính toán chuẩn theo BRD 6.4 & 6.6 ----------
  function roundHalfUp1(val) {
    return Math.floor(val * 10 + 0.5) / 10;
  }

  function formatVNNum(val) {
    if (val === null || val === undefined || Number.isNaN(val)) return 'Chưa có';
    return val.toFixed(1).replace('.', ',');
  }

  function isTicketRevoked(code) {
    const t = state.tickets.find(tk => tk.code === code);
    return Boolean(t && t.status === 'DA_THU_HOI');
  }

  function getValidVotesForGroup(groupId, sourceFilter) {
    return state.votes.filter(v => {
      if (v.groupId !== groupId) return false;
      if (sourceFilter && v.source !== sourceFilter) return false;
      if (v.source === 'KHACH' && isTicketRevoked(v.raterId)) return false;
      return true;
    });
  }

  // BRD 6.4: Tổng hợp sao của một nhóm theo từng nguồn s ∈ {GIAO_VIEN, BAN, KHACH}
  function calcGroupSourceSummary(groupId, source) {
    const votes = getValidVotesForGroup(groupId, source);
    const n = votes.length;
    const critCount = state.session.criteria.length;
    if (n === 0 || critCount === 0) {
      return {
        n: 0,
        perCriterionRounded: state.session.criteria.map(() => null),
        sourceAvg: null
      };
    }
    const unroundedList = [];
    const roundedList = [];
    for (let c = 0; c < critCount; c++) {
      let sumC = 0;
      for (const v of votes) {
        sumC += Number(v.stars[c] || 0);
      }
      const rawAvg = sumC / n;
      unroundedList.push(rawAvg);
      roundedList.push(roundHalfUp1(rawAvg));
    }
    const sumUnrounded = unroundedList.reduce((a, b) => a + b, 0);
    const sourceAvg = roundHalfUp1(sumUnrounded / critCount);
    return {
      n,
      perCriterionRounded: roundedList,
      sourceAvg
    };
  }

  // BRD 6.6: Điểm xếp hạng trên màn chiếu (chỉ tính BAN + KHACH hợp lệ, < 3 lượt -> Chưa xếp hạng)
  function calcProjectorLeaderboard() {
    const critCount = state.session.criteria.length;
    const submittedGroups = state.groups.filter(g => g.status === 'DA_NOP');
    const items = submittedGroups.map(g => {
      const peerVotes = getValidVotesForGroup(g.id, 'BAN');
      const guestVotes = getValidVotesForGroup(g.id, 'KHACH');
      const combined = [...peerVotes, ...guestVotes];
      const voteCount = combined.length;
      let totalStars = 0;
      for (const v of combined) {
        for (let c = 0; c < critCount; c++) {
          totalStars += Number(v.stars[c] || 0);
        }
      }
      const unranked = voteCount < 3 || critCount === 0;
      const score = unranked ? null : roundHalfUp1(totalStars / (voteCount * critCount));
      return {
        group: g,
        peerCount: peerVotes.length,
        guestCount: guestVotes.length,
        voteCount,
        totalStars,
        unranked,
        score
      };
    });

    items.sort((a, b) => {
      if (a.unranked && !b.unranked) return 1;
      if (!a.unranked && b.unranked) return -1;
      if (a.unranked && b.unranked) return b.voteCount - a.voteCount;
      if (b.score !== a.score) return b.score - a.score;
      if (b.voteCount !== a.voteCount) return b.voteCount - a.voteCount;
      return a.group.name.localeCompare(b.group.name, 'vi');
    });

    // Gán thứ hạng (bằng điểm và bằng số lượt thì cùng hạng)
    let currentRank = 1;
    items.forEach((item, idx) => {
      if (item.unranked) {
        item.rank = null;
        return;
      }
      if (idx > 0 && !items[idx - 1].unranked) {
        const prev = items[idx - 1];
        if (prev.score === item.score && prev.voteCount === item.voteCount) {
          item.rank = prev.rank;
        } else {
          item.rank = idx + 1;
        }
      } else {
        item.rank = currentRank;
      }
    });

    return items;
  }

  // Âm báo nhẹ bằng Web Audio API & đọc câu mẫu bằng SpeechSynthesis
  function playTone(freq = 660, duration = 0.09) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
      setTimeout(() => ctx.close(), duration * 1000 + 50);
    } catch (_) {
      // Bỏ qua nếu trình duyệt chặn tự phát âm thanh
    }
  }

  function speakVietnamese(text, onNotice) {
    playTone(580, 0.08);
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'vi-VN';
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
        if (onNotice) onNotice(`Đang đọc to: "${text}"`, 'ok');
        return;
      } catch (_) {
        // Fallback bên dưới
      }
    }
    if (onNotice) onNotice(`Phát lời đọc câu mẫu: "${text}"`, 'ok');
  }

  // Tạo mã phiếu 8 ký tự bỏ 0/O, 1/I/l (BRD mục 8)
  function generateSafeCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const existing = new Set(state.tickets.map(t => t.code));
    for (let attempt = 0; attempt < 50; attempt++) {
      let code = '';
      for (let i = 0; i < 8; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      if (!existing.has(code)) return code;
    }
    return 'K8M3P7X9';
  }

  // Vẽ SVG giả mã QR theo mã phiếu
  function createFakeQrSvg(code) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 36 36');
    svg.setAttribute('width', '54');
    svg.setAttribute('height', '54');
    svg.setAttribute('aria-hidden', 'true');

    const drawRect = (x, y, w, h, fill = '#15212b') => {
      const r = document.createElementNS(ns, 'rect');
      r.setAttribute('x', String(x));
      r.setAttribute('y', String(y));
      r.setAttribute('width', String(w));
      r.setAttribute('height', String(h));
      r.setAttribute('fill', fill);
      svg.appendChild(r);
    };

    // 3 góc định vị QR
    const corner = (cx, cy) => {
      drawRect(cx, cy, 9, 9, '#15212b');
      drawRect(cx + 1.5, cy + 1.5, 6, 6, '#ffffff');
      drawRect(cx + 3, cy + 3, 3, 3, '#15212b');
    };
    corner(2, 2);
    corner(25, 2);
    corner(2, 25);

    // Các điểm dữ liệu sinh từ mã code
    for (let i = 0; i < code.length; i++) {
      const val = code.charCodeAt(i);
      const gx = 13 + (i % 3) * 3;
      const gy = 4 + Math.floor(i / 3) * 8;
      if (val % 2 === 0) drawRect(gx, gy, 2.5, 2.5);
      if (val % 3 === 0) drawRect(gx + 3, gy + 3, 2.5, 2.5);
      drawRect(13 + ((val * 3) % 18), 14 + ((val * 5) % 18), 2.5, 2.5);
    }

    const txt = document.createElementNS(ns, 'text');
    txt.setAttribute('x', '18');
    txt.setAttribute('y', '21');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('font-size', '6.5');
    txt.setAttribute('font-family', 'monospace');
    txt.setAttribute('font-weight', '700');
    txt.setAttribute('fill', '#0080b8');
    txt.textContent = 'QR';
    svg.appendChild(txt);
    return svg;
  }

  function getGroupMembers(groupId) {
    return STUDENTS_1A2.filter(s => s.groupId === groupId);
  }

  function getPresetText(presetId) {
    const found = PRESET_COMMENTS.find(p => p.id === presetId);
    return found ? found.text : presetId;
  }

  function nowShortTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  // =========================================================================
  // KHỞI TẠO GIAO DIỆN CHUNG (NÚT ĐỔI GIAO DIỆN SÁNG/TỐI, ĐỒNG BỘ TAB)
  // =========================================================================
  function initThemeToggle() {
    const btn = document.getElementById('btn-toggle-theme');
    if (!btn) return;
    const saved = localStorage.getItem('mock.theme') || 'light';
    document.documentElement.dataset.theme = saved;
    btn.textContent = saved === 'dark' ? 'Giao diện sáng' : 'Giao diện tối';
    btn.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      localStorage.setItem('mock.theme', next);
      btn.textContent = next === 'dark' ? 'Giao diện sáng' : 'Giao diện tối';
    });
  }

  // =========================================================================
  // TRANG 1: mock/trung-bay.html (S-14, Màn chiếu 6.6, S-15, S-17)
  // =========================================================================
  function initTrungBayPage() {
    const $ = id => document.getElementById(id);
    if (!$('pane-s14')) return;

    let activeTab = 's14';
    let modFilter = 'ALL';
    let s15CurrentStudentId = 'hs09'; // Mặc định em Hân (Gấu túi) thuộc Nhóm Tàu Lá
    let s15EditingGroupId = null;
    let s15DraftStars = [];
    let s15DraftPresets = [];
    let s17SelectedGroupId = 'g3'; // Mặc định xem Nhóm Tàu Lá để khớp ví dụ BRD 6.4

    function showToast(msg, kind = 'ok') {
      const box = $('tb-toast');
      $('tb-toast-text').textContent = msg;
      box.dataset.kind = kind;
      box.hidden = false;
    }

    $('tb-toast-close').addEventListener('click', () => {
      $('tb-toast').hidden = true;
    });

    $('btn-reset-mock').addEventListener('click', () => {
      saveState(createDefaultState());
      s15EditingGroupId = null;
      renderAll();
      showToast('Đã khôi phục toàn bộ dữ liệu mẫu Lớp 1A2 về trạng thái chuẩn BRD.', 'ok');
    });

    // Chuyển tab S-14 / Màn chiếu / S-15 / S-17
    const tabButtons = document.querySelectorAll('.role-tab[data-tab]');
    function switchTab(tabName) {
      activeTab = tabName;
      tabButtons.forEach(btn => {
        const selected = btn.dataset.tab === tabName;
        btn.setAttribute('aria-selected', String(selected));
      });
      ['s14', 'projector', 's15', 's17'].forEach(k => {
        const pane = $('pane-' + k);
        if (pane) pane.hidden = k !== tabName;
      });
      renderAll();
    }
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Thanh trạng thái buổi trưng bày
    function renderSessionBanner() {
      const st = state.session.state;
      const badge = $('session-state-badge');
      badge.dataset.state = st;
      const labels = {
        CHUAN_BI: 'CHUẨN BỊ (CHƯA MỞ CHẤM)',
        DANG_MO: 'ĐANG MỞ NHẬN LƯỢT CHẤM',
        DA_DONG: 'ĐÃ ĐÓNG'
      };
      badge.textContent = labels[st] || st;

      const timerText = $('session-timer-text');
      const btnToggle = $('btn-toggle-session');
      if (st === 'CHUAN_BI') {
        timerText.textContent = 'Chưa đếm ngược 24 giờ · Sửa được tiêu chí';
        btnToggle.textContent = 'Mở buổi trưng bày';
        btnToggle.className = 'btn btn-primary';
      } else if (st === 'DANG_MO') {
        timerText.textContent = 'Tự đóng sau 23 giờ 15 phút (GD-11 / Mục 3)';
        btnToggle.textContent = 'Đóng buổi trưng bày';
        btnToggle.className = 'btn';
      } else {
        timerText.textContent = 'Buổi trưng bày đã đóng · Vẫn duyệt nhận xét được';
        btnToggle.textContent = 'Mở lại buổi (đếm lại 24 giờ)';
        btnToggle.className = 'btn btn-primary';
      }

      const submittedCount = state.groups.filter(g => g.status === 'DA_NOP').length;
      const workingCount = state.groups.length - submittedCount;
      $('session-summary-line').textContent =
        `${submittedCount} nhóm đã nộp poster · ${workingCount} nhóm đang làm · Tổng cộng ${state.votes.length} lượt chấm đã ghi nhận.`;
    }

    function performCloseSession() {
      state.session.state = 'DA_DONG';
      saveState();
      renderAll();
      showToast('Đã đóng buổi trưng bày. Các máy của học sinh và khách tạm ngừng gửi lượt chấm mới (BR-TB-02).', 'warn');
    }

    $('btn-toggle-session').addEventListener('click', () => {
      const st = state.session.state;
      if (st === 'DANG_MO') {
        // BR-TB-11: Giáo viên đóng buổi khi còn chữ CHỜ DUYỆT -> Cảnh báo
        const pendingCount = state.votes.filter(v => v.text && v.textStatus === 'CHO_DUYET').length;
        if (pendingCount > 0) {
          $('close-modal-msg').textContent =
            `Còn ${pendingCount} nhận xét chưa duyệt (BR-TB-11). Thầy cô muốn quay lại duyệt trước hay vẫn đóng buổi trưng bày ngay?`;
          $('close-confirm-modal').classList.add('is-open');
          return;
        }
        performCloseSession();
      } else {
        state.session.state = 'DANG_MO';
        saveState();
        renderAll();
        showToast('Đã mở buổi trưng bày! Học sinh và khách có thể chấm sao trong 24 giờ tới.', 'ok');
      }
    });

    $('btn-cancel-close').addEventListener('click', () => {
      $('close-confirm-modal').classList.remove('is-open');
    });
    $('btn-confirm-close').addEventListener('click', () => {
      $('close-confirm-modal').classList.remove('is-open');
      performCloseSession();
    });

    // ---------- S-14: 1. Bộ tiêu chí ----------
    function renderS14Criteria() {
      const hasVotes = state.votes.length > 0;
      const list = $('criteria-list');
      list.replaceChildren();

      $('criteria-lock-note').textContent = hasVotes
        ? `BR-TB-07: Đang khóa sửa (${state.votes.length} lượt chấm)`
        : 'Chưa có lượt chấm · Được phép sửa (1–5 tiêu chí)';

      state.session.criteria.forEach((cName, idx) => {
        const li = document.createElement('li');
        li.className = 'criteria-item';

        const badge = document.createElement('span');
        badge.className = 'criteria-idx';
        badge.textContent = String(idx + 1);

        const inp = document.createElement('input');
        inp.type = 'text';
        inp.maxLength = 30;
        inp.value = cName;
        inp.disabled = hasVotes;
        inp.setAttribute('aria-label', `Tiêu chí ${idx + 1}`);
        inp.addEventListener('change', () => {
          if (state.votes.length > 0) {
            showToast('Chặn (BR-TB-07): Không thể sửa bộ tiêu chí khi buổi trưng bày đã có lượt chấm.', 'bad');
            renderS14Criteria();
            return;
          }
          const val = inp.value.trim();
          if (!val) {
            showToast('Tên tiêu chí cần từ 1 đến 30 ký tự.', 'bad');
            inp.value = state.session.criteria[idx];
            return;
          }
          const dup = state.session.criteria.some((c, i) => i !== idx && c.toLocaleLowerCase('vi') === val.toLocaleLowerCase('vi'));
          if (dup) {
            showToast('Tên tiêu chí không được trùng trong cùng buổi trưng bày.', 'bad');
            inp.value = state.session.criteria[idx];
            return;
          }
          state.session.criteria[idx] = val;
          saveState();
          renderAll();
          showToast(`Đã cập nhật tiêu chí #${idx + 1} thành "${val}".`, 'ok');
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'btn';
        delBtn.textContent = 'Xóa';
        delBtn.disabled = state.session.criteria.length <= 1;
        delBtn.addEventListener('click', () => {
          if (state.votes.length > 0) {
            showToast('Chặn (BR-TB-07): Buổi đã có lượt chấm, không thể xóa tiêu chí vì lượt cũ sẽ mất nghĩa.', 'bad');
            return;
          }
          if (state.session.criteria.length <= 1) {
            showToast('Cần tối thiểu 1 tiêu chí cho buổi trưng bày.', 'warn');
            return;
          }
          const removed = state.session.criteria.splice(idx, 1)[0];
          saveState();
          renderAll();
          showToast(`Đã xóa tiêu chí "${removed}".`, 'ok');
        });

        li.append(badge, inp, delBtn);
        list.appendChild(li);
      });
    }

    $('form-add-criterion').addEventListener('submit', e => {
      e.preventDefault();
      if (state.votes.length > 0) {
        showToast('Chặn (BR-TB-07): Buổi đã có lượt chấm, không thể thêm hoặc sửa bộ tiêu chí.', 'bad');
        return;
      }
      if (state.session.criteria.length >= 5) {
        showToast('Mỗi buổi trưng bày đặt tối đa 5 tiêu chí (BRD mục 8).', 'warn');
        return;
      }
      const val = $('input-new-criterion').value.trim();
      if (!val || val.length > 30) {
        showToast('Vui lòng nhập tên tiêu chí từ 1 đến 30 ký tự.', 'bad');
        return;
      }
      const dup = state.session.criteria.some(c => c.toLocaleLowerCase('vi') === val.toLocaleLowerCase('vi'));
      if (dup) {
        showToast('Tiêu chí này đã có trong danh sách.', 'bad');
        return;
      }
      state.session.criteria.push(val);
      $('input-new-criterion').value = '';
      saveState();
      renderAll();
      showToast(`Đã thêm tiêu chí "${val}".`, 'ok');
    });

    $('btn-demo-unlock-criteria').addEventListener('click', () => {
      if (state.votes.length > 0) {
        state.votes = [];
        state.session.state = 'CHUAN_BI';
        saveState();
        renderAll();
        showToast('Đã xóa tạm các lượt chấm và đưa buổi về CHUẨN BỊ. Thầy cô có thể sửa/thêm tiêu chí ngay!', 'warn');
      } else {
        saveState(createDefaultState());
        renderAll();
        showToast('Đã nạp lại các lượt chấm mẫu của Lớp 1A2.', 'ok');
      }
    });

    $('btn-restore-default-criteria').addEventListener('click', () => {
      if (state.votes.length > 0) {
        showToast('Chặn (BR-TB-07): Buổi đã có lượt chấm, không thể đặt lại tiêu chí.', 'bad');
        return;
      }
      state.session.criteria = ['Ý tưởng', 'Mô hình chạy được', 'Trình bày'];
      saveState();
      renderAll();
      showToast('Đã đặt lại 3 tiêu chí mẫu (GD-18).', 'ok');
    });

    // ---------- S-14: 2. Phiếu khách QR ----------
    function renderS14Tickets() {
      const total = state.tickets.length;
      const used = state.tickets.filter(t => t.status === 'DA_DUNG').length;
      const revoked = state.tickets.filter(t => t.status === 'DA_THU_HOI').length;
      $('ticket-stats-label').textContent = `${total} phiếu (${used} đã dùng · ${revoked} thu hồi)`;

      const wrap = $('ticket-list');
      wrap.replaceChildren();
      state.tickets.forEach(tk => {
        const div = document.createElement('div');
        div.className = 'ticket-pill';
        div.dataset.status = tk.status;

        const info = document.createElement('div');
        const stText = tk.status === 'DA_DUNG' ? 'Đã dùng' : tk.status === 'DA_THU_HOI' ? 'Đã thu hồi' : 'Chưa dùng';
        info.innerHTML = `<strong>#${String(tk.no).padStart(2, '0')}</strong> · <code>${tk.code}</code><br><small class="hint">${stText}</small>`;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn';
        btn.style.padding = '5px 9px';
        btn.style.fontSize = '12px';
        if (tk.status === 'DA_THU_HOI') {
          btn.textContent = 'Khôi phục';
          btn.addEventListener('click', () => {
            tk.status = tk.firstUsedAt ? 'DA_DUNG' : 'CHUA_DUNG';
            saveState();
            renderAll();
            showToast(`Đã khôi phục Phiếu #${tk.no} (${tk.code}).`, 'ok');
          });
        } else {
          btn.textContent = 'Thu hồi';
          btn.addEventListener('click', () => {
            tk.status = 'DA_THU_HOI';
            saveState();
            renderAll();
            showToast(`Đã thu hồi Phiếu #${tk.no} (${tk.code}). Các lượt chấm của phiếu này đã bị ẩn khỏi điểm 6.4 và 6.6.`, 'warn');
          });
        }

        div.append(info, btn);
        wrap.appendChild(div);
      });
    }

    $('btn-create-tickets').addEventListener('click', () => {
      const count = Number($('input-ticket-batch').value);
      if (!Number.isInteger(count) || count < 1 || count > 200) {
        showToast('Số phiếu khách mỗi lần in cần từ 1 đến 200 (BRD mục 8).', 'bad');
        return;
      }
      const startNo = state.tickets.length + 1;
      for (let i = 0; i < count; i++) {
        state.tickets.push({
          no: startNo + i,
          code: generateSafeCode(),
          status: 'CHUA_DUNG',
          firstUsedAt: ''
        });
      }
      saveState();
      renderAll();
      showToast(`Đã tạo thêm ${count} phiếu khách mới (tổng cộng ${state.tickets.length} phiếu).`, 'ok');
    });

    function openPrintTicketsModal() {
      // Đảm bảo có ít nhất 12 ô để xem mẫu tờ in A4 đẹp
      const grid = $('qr-sheet-grid');
      grid.replaceChildren();
      state.tickets.forEach(tk => {
        if (tk.status === 'DA_THU_HOI') return;
        const card = document.createElement('div');
        card.className = 'qr-ticket-card';
        const qrBox = document.createElement('div');
        qrBox.className = 'qr-fake-box';
        qrBox.appendChild(createFakeQrSvg(tk.code));

        const meta = document.createElement('div');
        meta.className = 'qr-ticket-meta';
        meta.innerHTML = `
          <strong>Phiếu khách #${String(tk.no).padStart(2, '0')}</strong>
          <span>Lớp 1A2 · Trưng bày HK I</span>
          <code>Mã: ${tk.code}</code>
          <span>Quét để chấm các nhóm</span>
        `;
        card.append(qrBox, meta);
        grid.appendChild(card);
      });
      $('print-tickets-modal').classList.add('is-open');
    }

    $('btn-preview-print').addEventListener('click', openPrintTicketsModal);
    $('btn-open-print-modal').addEventListener('click', openPrintTicketsModal);
    $('btn-close-print-modal').addEventListener('click', () => {
      $('print-tickets-modal').classList.remove('is-open');
    });
    $('btn-trigger-print').addEventListener('click', () => {
      window.print();
    });

    // ---------- S-14: 3. Hộp duyệt nhận xét (F-14) ----------
    document.querySelectorAll('[data-mod-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        modFilter = btn.dataset.modFilter;
        document.querySelectorAll('[data-mod-filter]').forEach(b => {
          b.classList.toggle('active', b.dataset.modFilter === modFilter);
        });
        renderS14Moderation();
      });
    });

    $('btn-approve-all').addEventListener('click', () => {
      let count = 0;
      state.votes.forEach(v => {
        if (v.text && v.textStatus === 'CHO_DUYET') {
          v.textStatus = 'DA_DUYET';
          count++;
        }
      });
      if (count === 0) {
        showToast('Không còn nhận xét nào đang chờ duyệt.', 'warn');
        return;
      }
      saveState();
      renderAll();
      showToast(`Đã duyệt tất cả ${count} nhận xét chờ duyệt. Các nhóm và phụ huynh đã đọc được ở S-17.`, 'ok');
    });

    function renderS14Moderation() {
      const textVotes = state.votes.filter(v => v.text && v.text.trim().length > 0);
      const pendingCount = textVotes.filter(v => v.textStatus === 'CHO_DUYET').length;
      $('mod-pending-badge').textContent = `${pendingCount} chờ duyệt / ${textVotes.length} nhận xét chữ`;

      const filtered = textVotes.filter(v => modFilter === 'ALL' || v.textStatus === modFilter);
      const list = $('mod-list');
      list.replaceChildren();

      if (filtered.length === 0) {
        const empty = document.createElement('li');
        empty.className = 'hint';
        empty.textContent = 'Không có nhận xét nào trong mục lọc này.';
        list.appendChild(empty);
        return;
      }

      filtered.forEach(v => {
        const grp = state.groups.find(g => g.id === v.groupId);
        const li = document.createElement('li');
        li.className = 'mod-item';
        li.dataset.mod = v.textStatus;

        let raterLabel = v.raterId;
        if (v.source === 'KHACH') {
          const tk = state.tickets.find(t => t.code === v.raterId);
          raterLabel = tk ? `Phiếu #${String(tk.no).padStart(2, '0')} (${tk.code})` : `Phiếu ${v.raterId}`;
        } else if (v.source === 'GIAO_VIEN') {
          raterLabel = state.session.teacherName;
        }

        const statusMap = {
          CHO_DUYET: { label: 'Chờ duyệt', k: 'warn' },
          DA_DUYET: { label: 'Đã duyệt (Hiện ở S-17)', k: 'ok' },
          DA_AN: { label: 'Đã ẩn', k: 'bad' }
        };
        const stInfo = statusMap[v.textStatus] || { label: v.textStatus, k: 'info' };

        const top = document.createElement('div');
        top.className = 'mod-item-top';
        top.innerHTML = `
          <span>Gửi tới <strong>Nhóm ${grp ? grp.name : v.groupId}</strong> · Nguồn: <b>${v.source === 'KHACH' ? 'Khách QR' : 'Giáo viên'}</b> (${raterLabel}) · Lúc ${v.updatedAt}</span>
          <span class="pill" data-k="${stInfo.k}">${stInfo.label}</span>
        `;

        const quote = document.createElement('p');
        quote.className = 'mod-quote';
        quote.textContent = v.text;

        const actions = document.createElement('div');
        actions.className = 'mod-actions';
        const starsStr = v.stars.join('/');
        const presetsStr = v.presets.length ? ` · Câu mẫu: ${v.presets.join(', ')}` : '';
        const metaSpan = document.createElement('span');
        metaSpan.className = 'hint';
        metaSpan.textContent = `Sao đã chấm: ${starsStr}${presetsStr}`;

        const btns = document.createElement('div');
        btns.className = 'mod-actions-btns';

        const btnApprove = document.createElement('button');
        btnApprove.type = 'button';
        btnApprove.className = 'btn btn-primary';
        btnApprove.style.padding = '5px 10px';
        btnApprove.style.fontSize = '12.5px';
        btnApprove.textContent = 'Duyệt';
        btnApprove.disabled = v.textStatus === 'DA_DUYET';
        btnApprove.addEventListener('click', () => {
          v.textStatus = 'DA_DUYET';
          saveState();
          renderAll();
          showToast(`Đã duyệt lời nhận xét cho Nhóm ${grp ? grp.name : ''}.`, 'ok');
        });

        const btnHide = document.createElement('button');
        btnHide.type = 'button';
        btnHide.className = 'btn';
        btnHide.style.padding = '5px 10px';
        btnHide.style.fontSize = '12.5px';
        btnHide.textContent = 'Ẩn';
        btnHide.disabled = v.textStatus === 'DA_AN';
        btnHide.addEventListener('click', () => {
          v.textStatus = 'DA_AN';
          saveState();
          renderAll();
          showToast(`Đã ẩn nhận xét khỏi trang của Nhóm ${grp ? grp.name : ''}.`, 'warn');
        });

        btns.append(btnApprove, btnHide);
        actions.append(metaSpan, btns);
        li.append(top, quote, actions);
        list.appendChild(li);
      });
    }

    // ---------- S-14: 4. Bảng tổng hợp 3 nguồn & Giáo viên chấm nhóm ----------
    function renderS14TeacherTable() {
      const tbody = $('teacher-groups-tbody');
      tbody.replaceChildren();

      state.groups.forEach(g => {
        const tr = document.createElement('tr');
        const members = getGroupMembers(g.id);
        const peerSum = calcGroupSourceSummary(g.id, 'BAN');
        const guestSum = calcGroupSourceSummary(g.id, 'KHACH');
        const teacherVote = state.votes.find(v => v.groupId === g.id && v.source === 'GIAO_VIEN');

        // Cột 1: Nhóm & 4 thành viên
        const tdGroup = document.createElement('td');
        tdGroup.innerHTML = `
          <strong>Nhóm ${g.name}</strong>
          <div class="hint">${g.projectTitle}</div>
          <div class="hint" style="margin-top: 2px;">4 em: ${members.map(m => `${m.nickname} (${m.animal})`).join(', ')}</div>
        `;

        // Cột 2: Trạng thái nộp (cho phép bấm thử BR-TB-08)
        const tdStatus = document.createElement('td');
        const stPill = document.createElement('span');
        stPill.className = 'pill';
        stPill.dataset.k = g.status === 'DA_NOP' ? 'ok' : 'warn';
        stPill.textContent = g.status === 'DA_NOP' ? 'ĐÃ NỘP' : 'ĐANG LÀM';
        const toggleSubmitBtn = document.createElement('button');
        toggleSubmitBtn.type = 'button';
        toggleSubmitBtn.className = 'link-btn';
        toggleSubmitBtn.style.display = 'block';
        toggleSubmitBtn.style.marginTop = '6px';
        toggleSubmitBtn.textContent = g.status === 'DA_NOP' ? 'Trả lại sửa' : 'Cho nộp poster';
        toggleSubmitBtn.addEventListener('click', () => {
          g.status = g.status === 'DA_NOP' ? 'DANG_LAM' : 'DA_NOP';
          saveState();
          renderAll();
          showToast(
            g.status === 'DA_NOP'
              ? `Nhóm ${g.name} đã chuyển sang ĐÃ NỘP và hiện lại trên lưới chấm.`
              : `Nhóm ${g.name} chuyển về ĐANG LÀM: ẩn khỏi lưới chấm nhưng giữ nguyên lượt chấm cũ (BR-TB-08).`,
            'ok'
          );
        });
        tdStatus.append(stPill, toggleSubmitBtn);

        // Cột 3: TB Bạn (6.4)
        const tdPeer = document.createElement('td');
        tdPeer.className = 'num';
        tdPeer.innerHTML = peerSum.n
          ? `<strong>${formatVNNum(peerSum.sourceAvg)} ★</strong><br><small class="hint">${peerSum.n} lượt (${peerSum.perCriterionRounded.map(formatVNNum).join(' / ')})</small>`
          : `<span class="hint">Chưa có</span>`;

        // Cột 4: TB Khách (6.4)
        const tdGuest = document.createElement('td');
        tdGuest.className = 'num';
        tdGuest.innerHTML = guestSum.n
          ? `<strong>${formatVNNum(guestSum.sourceAvg)} ★</strong><br><small class="hint">${guestSum.n} lượt (${guestSum.perCriterionRounded.map(formatVNNum).join(' / ')})</small>`
          : `<span class="hint">Chưa có</span>`;

        // Cột 5: Sao của Giáo viên (GD-21: Không bắt buộc)
        const tdGvStars = document.createElement('td');
        const gvStarBtn = document.createElement('button');
        gvStarBtn.type = 'button';
        gvStarBtn.className = 'btn';
        gvStarBtn.style.padding = '5px 9px';
        gvStarBtn.style.fontSize = '12px';
        if (teacherVote) {
          const avgGv = roundHalfUp1(teacherVote.stars.reduce((a, b) => a + b, 0) / teacherVote.stars.length);
          gvStarBtn.textContent = `GV: ${formatVNNum(avgGv)} ★ (${teacherVote.stars.join('/')}) · Xóa`;
          gvStarBtn.addEventListener('click', () => {
            state.votes = state.votes.filter(v => v !== teacherVote);
            saveState();
            renderAll();
            showToast(`Đã gỡ sao tham khảo của giáo viên cho Nhóm ${g.name} (trở về "Chưa có" theo GD-21).`, 'ok');
          });
        } else {
          gvStarBtn.textContent = 'Chưa có · Chấm 3/3/3 ★';
          gvStarBtn.addEventListener('click', () => {
            state.votes.push({
              id: 'v-gv-' + g.id,
              groupId: g.id,
              source: 'GIAO_VIEN',
              raterId: 'gv-lan',
              stars: state.session.criteria.map(() => 3),
              presets: ['K1', 'K8'],
              text: '',
              textStatus: 'KHONG_CO',
              updatedAt: nowShortTime()
            });
            saveState();
            renderAll();
            showToast(`Đã ghi nhận sao của giáo viên cho Nhóm ${g.name}.`, 'ok');
          });
        }
        tdGvStars.appendChild(gvStarBtn);

        // Cột 6: Đánh giá chính thức HTT / HT / CHT cho cả nhóm (F-06 bước 4)
        const tdGrade = document.createElement('td');
        const gradeWrap = document.createElement('div');
        gradeWrap.style.display = 'grid';
        gradeWrap.style.gap = '6px';

        const sel = document.createElement('select');
        sel.style.padding = '6px 8px';
        sel.style.borderRadius = '6px';
        sel.style.border = '1px solid var(--line)';
        sel.setAttribute('aria-label', `Mức đánh giá nhóm ${g.name}`);
        [
          { v: '', t: '-- Chọn mức (HTT/HT/CHT) --' },
          { v: 'HTT', t: 'HTT – Hoàn thành tốt' },
          { v: 'HT', t: 'HT – Hoàn thành' },
          { v: 'CHT', t: 'CHT – Chưa hoàn thành' }
        ].forEach(optData => {
          const opt = document.createElement('option');
          opt.value = optData.v;
          opt.textContent = optData.t;
          sel.appendChild(opt);
        });
        sel.value = g.teacherGrade || '';

        const cmtInput = document.createElement('input');
        cmtInput.type = 'text';
        cmtInput.maxLength = 500;
        cmtInput.placeholder = 'Nhận xét nhóm (chép cho 4 em)...';
        cmtInput.value = g.teacherComment || '';
        cmtInput.style.padding = '6px 8px';
        cmtInput.style.borderRadius = '6px';
        cmtInput.style.border = '1px solid var(--line)';

        const saveBtn = document.createElement('button');
        saveBtn.type = 'button';
        saveBtn.className = 'btn btn-primary';
        saveBtn.style.padding = '6px 10px';
        saveBtn.style.fontSize = '12.5px';
        saveBtn.textContent = 'Lưu & Chép cho 4 em';
        saveBtn.addEventListener('click', () => {
          if (!sel.value) {
            showToast('Chặn (BR-DG-02): Vui lòng chọn mức đánh giá (HTT / HT / CHT) trước khi lưu.', 'bad');
            return;
          }
          g.teacherGrade = sel.value;
          g.teacherComment = cmtInput.value.trim();
          saveState();
          renderAll();
          const noConsent = members.filter(m => !m.consent);
          const consentNote = noConsent.length
            ? ` (Lưu ý BR-DY-02: em ${noConsent.map(m => m.nickname).join(', ')} chưa có đồng ý phụ huynh nên chỉ lưu mức ${g.teacherGrade}, không lưu nhận xét).`
            : '.';
          showToast(`Đã lưu mức ${g.teacherGrade} cho Nhóm ${g.name} và chép cho ${members.length} thành viên${consentNote}`, 'ok');
        });

        gradeWrap.append(sel, cmtInput, saveBtn);
        tdGrade.appendChild(gradeWrap);

        tr.append(tdGroup, tdStatus, tdPeer, tdGuest, tdGvStars, tdGrade);
        tbody.appendChild(tr);
      });
    }

    // ---------- PANE 2: MÀN CHIẾU & BẢNG XẾP HẠNG (BRD 6.6 / GD-22) ----------
    $('toggle-leaderboard').addEventListener('change', e => {
      state.session.showLeaderboard = e.target.checked;
      saveState();
      renderProjector();
      showToast(
        state.session.showLeaderboard
          ? 'Đã bật bảng xếp hạng trên màn chiếu (GD-22).'
          : 'Đã tắt bảng xếp hạng trên màn chiếu (GD-22).',
        'ok'
      );
    });

    function openZoomPoster(group) {
      const members = getGroupMembers(group.id);
      const peerSum = calcGroupSourceSummary(group.id, 'BAN');
      const guestSum = calcGroupSourceSummary(group.id, 'KHACH');
      $('zoom-modal-title').textContent = `Poster Nhóm ${group.name} · ${group.projectTitle}`;
      const body = $('zoom-modal-body');
      body.innerHTML = `
        <div class="rate-poster-box">
          <div class="rate-poster-visual">
            <img src="${group.cover}" alt="Mô hình nhóm ${group.name}">
          </div>
          <div style="display: grid; gap: 8px;">
            <span class="pill" data-k="info">${group.baseLesson}</span>
            <p style="margin: 0;"><strong>Ý tưởng giải quyết vấn đề:</strong> ${group.idea}</p>
            <p style="margin: 0;"><strong>Nâng cấp sáng tạo:</strong> ${group.upgrade}</p>
            <p class="hint">Thành viên (tên gọi ngắn): ${members.map(m => `${m.nickname} (${m.animal})`).join(' · ')}</p>
            <div class="row">
              <span class="pill" data-k="ok">Bạn chấm: ${formatVNNum(peerSum.sourceAvg)} ★ (${peerSum.n} lượt)</span>
              <span class="pill" data-k="ok">Khách chấm: ${formatVNNum(guestSum.sourceAvg)} ★ (${guestSum.n} lượt)</span>
            </div>
          </div>
        </div>
      `;
      $('poster-zoom-modal').classList.add('is-open');
    }

    $('btn-close-zoom').addEventListener('click', () => {
      $('poster-zoom-modal').classList.remove('is-open');
    });

    function renderProjector() {
      $('toggle-leaderboard').checked = Boolean(state.session.showLeaderboard);
      $('leaderboard-panel').hidden = !state.session.showLeaderboard;
      $('projector-layout').classList.toggle('no-leaderboard', !state.session.showLeaderboard);

      const rankedItems = calcProjectorLeaderboard();
      $('proj-submitted-count').textContent = `${rankedItems.length} nhóm đã nộp poster`;

      // Lưới poster
      const posterGrid = $('proj-posters-grid');
      posterGrid.replaceChildren();
      state.groups
        .filter(g => g.status === 'DA_NOP')
        .forEach(g => {
          const itemStat = rankedItems.find(x => x.group.id === g.id);
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'proj-poster-card';
          card.innerHTML = `
            <div class="proj-poster-preview">
              <img src="${g.cover}" alt="Poster Nhóm ${g.name}">
              <span class="proj-poster-tag">${g.baseLesson.split('·')[0].trim()}</span>
            </div>
            <div class="proj-poster-meta">
              <b>Nhóm ${g.name}</b>
              <span>${itemStat ? itemStat.voteCount : 0} lượt chấm</span>
            </div>
            <small style="color: #9bb0c3; font-size: 12.5px;">${g.projectTitle}</small>
          `;
          card.addEventListener('click', () => openZoomPoster(g));
          posterGrid.appendChild(card);
        });

      // Bảng xếp hạng 6.6
      const lbList = $('leaderboard-list');
      lbList.replaceChildren();
      rankedItems.forEach(item => {
        const li = document.createElement('li');
        li.className = 'rank-row';
        if (item.unranked) {
          li.dataset.unranked = 'true';
        } else {
          li.dataset.rank = String(item.rank);
        }

        const badge = document.createElement('div');
        badge.className = 'rank-badge';
        badge.textContent = item.unranked ? '—' : String(item.rank);

        const info = document.createElement('div');
        info.className = 'rank-info';
        info.innerHTML = `
          <b>Nhóm ${item.group.name}</b>
          <small>${item.peerCount} bạn + ${item.guestCount} khách = ${item.voteCount} lượt (${item.totalStars} sao)</small>
        `;

        const scoreBox = document.createElement('div');
        scoreBox.className = 'rank-score';
        if (item.unranked) {
          scoreBox.innerHTML = `<strong style="font-size: 14px; color: #9bb0c3;">Chưa xếp hạng</strong><span>Dưới 3 lượt chấm</span>`;
        } else {
          scoreBox.innerHTML = `<strong>${formatVNNum(item.score)} ★</strong><span>Hạng ${item.rank}</span>`;
        }

        li.append(badge, info, scoreBox);
        lbList.appendChild(li);
      });
    }

    // ---------- PANE 3: S-15 HỌC SINH CHẤM NHÓM BẠN ----------
    function initS15StudentPicker() {
      const sel = $('s15-student-select');
      sel.replaceChildren();
      STUDENTS_1A2.forEach(st => {
        const grp = state.groups.find(g => g.id === st.groupId);
        const opt = document.createElement('option');
        opt.value = st.id;
        opt.textContent = `${st.nickname} (${st.animal}) — Thuộc Nhóm ${grp ? grp.name : ''}`;
        sel.appendChild(opt);
      });
      sel.value = s15CurrentStudentId;
      sel.addEventListener('change', () => {
        s15CurrentStudentId = sel.value;
        s15EditingGroupId = null;
        renderS15();
      });
    }

    $('s15-back-btn').addEventListener('click', () => {
      s15EditingGroupId = null;
      renderS15();
    });

    function openS15RateGroup(groupId) {
      const student = STUDENTS_1A2.find(s => s.id === s15CurrentStudentId);
      const grp = state.groups.find(g => g.id === groupId);
      if (!student || !grp) return;

      // BR-TB-01: Chặn em chấm nhóm của chính mình
      if (student.groupId === groupId) {
        showToast('Chặn (BR-TB-01): Em không chấm nhóm của chính mình nhé! Hãy chọn một nhóm bạn khác.', 'warn');
        return;
      }

      s15EditingGroupId = groupId;
      const existing = state.votes.find(v => v.groupId === groupId && v.source === 'BAN' && v.raterId === student.id);
      s15DraftStars = existing ? [...existing.stars] : state.session.criteria.map(() => 0);
      s15DraftPresets = existing ? [...existing.presets] : [];
      renderS15();
    }

    function renderS15() {
      const student = STUDENTS_1A2.find(s => s.id === s15CurrentStudentId) || STUDENTS_1A2[0];
      const submittedGroups = state.groups.filter(g => g.status === 'DA_NOP');

      if (!s15EditingGroupId) {
        $('s15-grid-view').hidden = false;
        $('s15-rate-view').hidden = true;

        const doneCount = submittedGroups.filter(g =>
          state.votes.some(v => v.groupId === g.id && v.source === 'BAN' && v.raterId === student.id)
        ).length;
        $('s15-student-progress').textContent =
          `Em ${student.nickname} (${student.animal}) đã chấm ${doneCount}/${submittedGroups.length - 1} nhóm bạn.`;

        const grid = $('s15-groups-grid');
        grid.replaceChildren();
        submittedGroups.forEach(g => {
          const isOwn = g.id === student.groupId;
          const existing = state.votes.find(v => v.groupId === g.id && v.source === 'BAN' && v.raterId === student.id);
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 's15-group-card';
          if (isOwn) card.dataset.own = 'true';
          if (existing) card.dataset.done = 'true';

          let tagHtml = '<span class="s15-tag">Chưa chấm</span>';
          let ctaText = 'Chạm để chấm sao';
          if (isOwn) {
            tagHtml = '<span class="s15-tag is-own">Nhóm của em</span>';
            ctaText = 'Nhóm của em (Không tự chấm)';
          } else if (existing) {
            tagHtml = `<span class="s15-tag is-done">✓ Đã chấm (${existing.stars.join('/')})</span>`;
            ctaText = 'Chấm lại (Ghi đè lượt cũ)';
          }

          card.innerHTML = `
            <div class="s15-card-cover">
              <img src="${g.cover}" alt="Mô hình Nhóm ${g.name}">
            </div>
            <div class="s15-card-head">
              <b>Nhóm ${g.name}</b>
              ${tagHtml}
            </div>
            <div style="font-size: 14.5px; color: var(--muted);">${g.projectTitle}</div>
            <div class="s15-card-cta">${ctaText}</div>
          `;
          card.addEventListener('click', () => openS15RateGroup(g.id));
          grid.appendChild(card);
        });
        return;
      }

      // Màn chấm 1 nhóm của học sinh
      $('s15-grid-view').hidden = true;
      $('s15-rate-view').hidden = false;

      const grp = state.groups.find(g => g.id === s15EditingGroupId);
      const members = getGroupMembers(grp.id);
      const existing = state.votes.find(v => v.groupId === grp.id && v.source === 'BAN' && v.raterId === student.id);

      $('s15-rate-title').textContent = `Nhóm ${grp.name}`;
      $('s15-rate-status-tag').textContent = existing ? `✓ Đã chấm (${existing.stars.join('/')})` : 'Đang chấm';
      $('s15-rate-status-tag').className = 's15-tag' + (existing ? ' is-done' : '');
      $('s15-rate-img').src = grp.cover;
      $('s15-rate-project-name').textContent = grp.projectTitle;
      $('s15-rate-idea').textContent = grp.idea;
      $('s15-rate-members').textContent = `Các bạn trong nhóm: ${members.map(m => `${m.nickname} (${m.animal})`).join(' · ')}`;

      // Danh sách tiêu chí 3 ngôi sao lớn
      const critList = $('s15-crit-list');
      critList.replaceChildren();
      state.session.criteria.forEach((cName, cIdx) => {
        const row = document.createElement('div');
        row.className = 'crit-rate-row';
        row.id = `s15-crit-row-${cIdx}`;

        const label = document.createElement('div');
        label.className = 'crit-rate-label';
        label.innerHTML = `<b>${cIdx + 1}. ${cName}</b><small>Chạm 1, 2 hoặc 3 ngôi sao</small>`;

        const trio = document.createElement('div');
        trio.className = 'star-trio';
        const curVal = s15DraftStars[cIdx] || 0;
        for (let s = 1; s <= 3; s++) {
          const sBtn = document.createElement('button');
          sBtn.type = 'button';
          sBtn.className = 'star-big-btn' + (s <= curVal ? ' is-on' : '');
          sBtn.setAttribute('aria-label', `${cName}: ${s} sao`);
          sBtn.innerHTML = `<span class="star-glyph">★</span><span class="star-num">${s} sao</span>`;
          sBtn.addEventListener('click', () => {
            s15DraftStars[cIdx] = s;
            playTone(440 + s * 110, 0.08);
            renderS15();
          });
          trio.appendChild(sBtn);
        }

        row.append(label, trio);
        critList.appendChild(row);
      });

      // Danh sách câu mẫu có nút Nghe đọc to
      $('s15-preset-count').textContent = `Đã chọn ${s15DraftPresets.length}/2 câu`;
      const pGrid = $('s15-preset-grid');
      pGrid.replaceChildren();
      PRESET_COMMENTS.forEach(p => {
        const wrap = document.createElement('div');
        wrap.className = 'preset-item';
        const isPicked = s15DraftPresets.includes(p.id);

        const pickBtn = document.createElement('button');
        pickBtn.type = 'button';
        pickBtn.className = 'preset-pick-btn';
        pickBtn.setAttribute('aria-pressed', String(isPicked));
        pickBtn.innerHTML = `<span>${p.text}</span><span class="preset-kind">${p.kind === 'khen' ? 'Khen' : 'Góp ý'}</span>`;
        pickBtn.addEventListener('click', () => {
          if (isPicked) {
            s15DraftPresets = s15DraftPresets.filter(id => id !== p.id);
          } else {
            if (s15DraftPresets.length >= 2) {
              showToast('Em chọn tối đa 2 câu mẫu cho mỗi nhóm nhé (BRD mục 8).', 'warn');
              return;
            }
            s15DraftPresets.push(p.id);
          }
          playTone(520, 0.06);
          renderS15();
        });

        const ttsBtn = document.createElement('button');
        ttsBtn.type = 'button';
        ttsBtn.className = 'preset-tts-btn';
        ttsBtn.setAttribute('aria-label', `Nghe đọc câu: ${p.text}`);
        ttsBtn.textContent = 'Nghe';
        ttsBtn.addEventListener('click', () => speakVietnamese(p.text, showToast));

        wrap.append(pickBtn, ttsBtn);
        pGrid.appendChild(wrap);
      });
    }

    $('s15-submit-btn').addEventListener('click', () => {
      if (state.session.state !== 'DANG_MO') {
        showToast('Chặn (BR-TB-02): Buổi trưng bày hiện đã đóng, không nhận thêm lượt chấm.', 'bad');
        return;
      }
      const student = STUDENTS_1A2.find(s => s.id === s15CurrentStudentId);
      const grp = state.groups.find(g => g.id === s15EditingGroupId);
      if (!student || !grp) return;

      // BR-TB-05: Kiểm tra tiêu chí chưa chọn sao
      let missingIdx = -1;
      for (let i = 0; i < state.session.criteria.length; i++) {
        if (!s15DraftStars[i] || s15DraftStars[i] < 1) {
          missingIdx = i;
          const rowEl = document.getElementById(`s15-crit-row-${i}`);
          if (rowEl) rowEl.classList.add('is-missing');
        }
      }
      if (missingIdx !== -1) {
        showToast(`Chặn (BR-TB-05): Em còn chưa chọn số sao cho mục "${state.session.criteria[missingIdx]}".`, 'bad');
        return;
      }

      // BR-TB-06: Ghi đè nếu đã chấm trước đó
      const existingIdx = state.votes.findIndex(
        v => v.groupId === grp.id && v.source === 'BAN' && v.raterId === student.id
      );
      const voteRecord = {
        id: existingIdx >= 0 ? state.votes[existingIdx].id : `v-${grp.id}-${student.id}`,
        groupId: grp.id,
        source: 'BAN',
        raterId: student.id,
        stars: [...s15DraftStars],
        presets: [...s15DraftPresets],
        text: '',
        textStatus: 'KHONG_CO',
        updatedAt: nowShortTime()
      };
      if (existingIdx >= 0) {
        state.votes[existingIdx] = voteRecord;
      } else {
        state.votes.push(voteRecord);
      }
      saveState();
      playTone(784, 0.14);
      s15EditingGroupId = null;
      renderAll();
      showToast(
        existingIdx >= 0
          ? `Đã cập nhật (ghi đè lượt cũ theo BR-TB-06) đánh giá của em ${student.nickname} cho Nhóm ${grp.name}!`
          : `Cảm ơn em ${student.nickname}! Đã gửi sao và lời khen cho Nhóm ${grp.name}.`,
        'ok'
      );
    });

    // ---------- PANE 4: S-17 NHÓM XEM "MỌI NGƯỜI NÓI GÌ" ----------
    function initS17GroupPicker() {
      const sel = $('s17-group-select');
      sel.replaceChildren();
      state.groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = `Nhóm ${g.name} — ${g.projectTitle}`;
        sel.appendChild(opt);
      });
      sel.value = s17SelectedGroupId;
      sel.addEventListener('change', () => {
        s17SelectedGroupId = sel.value;
        renderS17();
      });
    }

    function renderS17() {
      const grp = state.groups.find(g => g.id === s17SelectedGroupId) || state.groups[0];
      const members = getGroupMembers(grp.id);
      $('s17-group-img').src = grp.cover;
      $('s17-group-title').textContent = `Nhóm ${grp.name} · ${grp.projectTitle}`;
      $('s17-group-desc').textContent = `${grp.baseLesson} — ${grp.idea}`;
      $('s17-group-members').textContent = `Thành viên: ${members.map(m => `${m.nickname} (${m.animal})`).join(' · ')}`;

      const gradePill = $('s17-teacher-grade-pill');
      if (grp.teacherGrade) {
        gradePill.textContent = `Đánh giá chính thức của GV: ${grp.teacherGrade}`;
        gradePill.dataset.k = grp.teacherGrade === 'HTT' ? 'ok' : 'info';
      } else {
        gradePill.textContent = 'Giáo viên chưa chấm mức chính thức';
        gradePill.dataset.k = 'warn';
      }

      $('s17-teacher-comment').textContent = grp.teacherComment
        ? `Nhận xét của ${state.session.teacherName}: "${grp.teacherComment}"`
        : 'Chưa có nhận xét chính thức của giáo viên.';

      // 3 thẻ nguồn tách riêng theo BRD 6.4
      const sourcesGrid = $('s17-sources-grid');
      sourcesGrid.replaceChildren();
      const sourceConfigs = [
        { code: 'GIAO_VIEN', title: '1. Giáo viên', sub: 'Tham khảo (GD-21)' },
        { code: 'BAN', title: '2. Các bạn trong lớp', sub: 'Ẩn danh người chấm (GD-20)' },
        { code: 'KHACH', title: '3. Khách tham quan', sub: 'Quét phiếu QR (GD-17)' }
      ];

      sourceConfigs.forEach(sc => {
        const sum = calcGroupSourceSummary(grp.id, sc.code);
        const card = document.createElement('div');
        card.className = 'source-score-card';

        const breakdownItems = state.session.criteria
          .map((cName, idx) => {
            const val = sum.perCriterionRounded[idx];
            return `<li><span>${cName}</span><b>${val !== null ? formatVNNum(val) + ' ★' : 'Chưa có'}</b></li>`;
          })
          .join('');

        card.innerHTML = `
          <div class="source-score-top">
            <div>
              <h3>${sc.title}</h3>
              <small class="hint">${sc.sub} · ${sum.n} lượt chấm</small>
            </div>
            <div class="source-big-avg">${sum.sourceAvg !== null ? formatVNNum(sum.sourceAvg) + ' ★' : 'Chưa có'}</div>
          </div>
          <ul class="source-crit-breakdown">${breakdownItems}</ul>
        `;
        sourcesGrid.appendChild(card);
      });

      // Danh sách lời nhận xét hiển thị cho nhóm & phụ huynh (GD-19, GD-20, BR-TB-09)
      const validVotes = getValidVotesForGroup(grp.id, null);
      const feedList = $('s17-feedback-list');
      feedList.replaceChildren();

      let hiddenPendingCount = 0;
      const visibleEntries = [];

      validVotes.forEach(v => {
        const hasPresets = Array.isArray(v.presets) && v.presets.length > 0;
        const hasApprovedText = Boolean(v.text && v.textStatus === 'DA_DUYET');
        if (v.text && v.textStatus !== 'DA_DUYET') {
          hiddenPendingCount++;
        }
        if (hasPresets || hasApprovedText) {
          visibleEntries.push({
            vote: v,
            hasPresets,
            hasApprovedText
          });
        }
      });

      $('s17-hidden-note').textContent = hiddenPendingCount > 0
        ? `BR-TB-09: Đang ẩn ${hiddenPendingCount} chữ tự gõ chưa được giáo viên duyệt.`
        : 'Tất cả chữ tự gõ của nhóm này đã được duyệt hiển thị.';

      if (visibleEntries.length === 0) {
        const li = document.createElement('li');
        li.className = 'hint';
        li.textContent = 'Chưa có lời nhận xét nào cho nhóm này.';
        feedList.appendChild(li);
        return;
      }

      visibleEntries.forEach(({ vote, hasPresets, hasApprovedText }) => {
        const li = document.createElement('li');
        li.className = 'feedback-card';

        // GD-20 & F-14: Lời của bạn ghi "Một bạn trong lớp", lời của khách ghi "Một vị khách"
        let senderLabel = 'Một bạn trong lớp';
        if (vote.source === 'KHACH') senderLabel = 'Một vị khách';
        else if (vote.source === 'GIAO_VIEN') senderLabel = state.session.teacherName;

        const who = document.createElement('div');
        who.className = 'feedback-who';
        who.innerHTML = `<strong>${senderLabel}</strong><span>Sao: ${vote.stars.join('/')} ★ · Lúc ${vote.updatedAt}</span>`;
        li.appendChild(who);

        if (hasPresets) {
          const tags = document.createElement('div');
          tags.className = 'feedback-tags';
          vote.presets.forEach(pid => {
            const sp = document.createElement('span');
            sp.className = 'feedback-tag';
            sp.textContent = getPresetText(pid);
            tags.appendChild(sp);
          });
          li.appendChild(tags);
        }

        if (hasApprovedText) {
          const p = document.createElement('p');
          p.className = 'feedback-text';
          p.textContent = `"${vote.text}"`;
          li.appendChild(p);
        }

        feedList.appendChild(li);
      });
    }

    function renderAll() {
      renderSessionBanner();
      renderS14Criteria();
      renderS14Tickets();
      renderS14Moderation();
      renderS14TeacherTable();
      renderProjector();
      renderS15();
      renderS17();
    }

    initS15StudentPicker();
    initS17GroupPicker();
    renderAll();

    window.addEventListener('storage', e => {
      if (e.key === STORAGE_KEY) {
        state = loadState();
        renderAll();
      }
    });
  }

  // =========================================================================
  // TRANG 2: mock/khach.html (S-16 KHÁCH TRÊN ĐIỆN THOẠI 375 PX)
  // =========================================================================
  function initGuestPage() {
    const $ = id => document.getElementById(id);
    if (!$('guest-ticket-select')) return;

    let currentTicketCode = localStorage.getItem(GUEST_TICKET_KEY) || 'K7M4P9X2';
    // Mặc định mở ngay nhóm đầu tiên để khách thấy ngay các hàng 3 sao to và nút Gửi ở đáy
    let selectedGroupId = 'g3';
    let draftStars = [];
    let draftPresets = [];
    let draftText = '';

    function showGuestToast(msg, kind = 'ok') {
      const box = $('guest-toast');
      $('guest-toast-text').textContent = msg;
      box.dataset.kind = kind;
      box.hidden = false;
    }

    $('guest-toast-close').addEventListener('click', () => {
      $('guest-toast').hidden = true;
    });

    function loadDraftForGroup(groupId) {
      selectedGroupId = groupId;
      const existing = state.votes.find(
        v => v.groupId === groupId && v.source === 'KHACH' && v.raterId === currentTicketCode
      );
      draftStars = existing ? [...existing.stars] : state.session.criteria.map(() => 0);
      draftPresets = existing ? [...existing.presets] : [];
      draftText = existing ? existing.text || '' : '';
      $('guest-free-text').value = draftText;
      $('guest-char-count').textContent = `${draftText.length}/200 ký tự`;
    }

    $('guest-free-text').addEventListener('input', e => {
      draftText = e.target.value;
      $('guest-char-count').textContent = `${draftText.length}/200 ký tự`;
    });

    $('guest-back-list').addEventListener('click', () => {
      selectedGroupId = null;
      renderGuest();
    });

    function renderGuestTicketSelect() {
      const sel = $('guest-ticket-select');
      sel.replaceChildren();
      state.tickets.forEach(tk => {
        const opt = document.createElement('option');
        opt.value = tk.code;
        const stText = tk.status === 'DA_THU_HOI' ? 'Đã thu hồi' : tk.status === 'DA_DUNG' ? 'Đang dùng' : 'Phiếu mới';
        opt.textContent = `Phiếu #${String(tk.no).padStart(2, '0')} · ${tk.code} (${stText})`;
        sel.appendChild(opt);
      });
      if (!state.tickets.some(t => t.code === currentTicketCode) && state.tickets.length > 0) {
        currentTicketCode = state.tickets[0].code;
      }
      sel.value = currentTicketCode;
    }

    $('guest-ticket-select').addEventListener('change', e => {
      currentTicketCode = e.target.value;
      localStorage.setItem(GUEST_TICKET_KEY, currentTicketCode);
      if (selectedGroupId) loadDraftForGroup(selectedGroupId);
      renderGuest();
      const tk = state.tickets.find(t => t.code === currentTicketCode);
      if (tk && tk.status === 'DA_THU_HOI') {
        showGuestToast('Lưu ý (BR-TB-03): Phiếu này đã bị giáo viên thu hồi, hệ thống sẽ chặn gửi đánh giá.', 'warn');
      }
    });

    function renderGuest() {
      const st = state.session.state;
      const badge = $('guest-session-badge');
      badge.dataset.state = st;
      badge.textContent = st === 'DANG_MO' ? 'ĐANG MỞ' : st === 'CHUAN_BI' ? 'CHUẨN BỊ' : 'ĐÃ ĐÓNG';

      const submittedGroups = state.groups.filter(g => g.status === 'DA_NOP');
      const doneCount = submittedGroups.filter(g =>
        state.votes.some(v => v.groupId === g.id && v.source === 'KHACH' && v.raterId === currentTicketCode)
      ).length;
      $('guest-done-summary').textContent = `Phiếu này đã chấm ${doneCount}/${submittedGroups.length} nhóm`;

      // Danh sách nhóm (GD-14: tuyệt đối không hiện tên học sinh!)
      const gList = $('guest-group-list');
      gList.replaceChildren();
      submittedGroups.forEach(g => {
        const existing = state.votes.find(
          v => v.groupId === g.id && v.source === 'KHACH' && v.raterId === currentTicketCode
        );
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'guest-group-btn';
        if (existing) btn.dataset.done = 'true';

        btn.innerHTML = `
          <img class="guest-group-thumb" src="${g.cover}" alt="Mô hình Nhóm ${g.name}">
          <div class="guest-group-info">
            <b>Nhóm ${g.name}</b>
            <small>${g.projectTitle}</small>
          </div>
          <span class="s15-tag ${existing ? 'is-done' : ''}">${existing ? '✓ Đã chấm' : 'Chấm →'}</span>
        `;
        btn.addEventListener('click', () => {
          loadDraftForGroup(g.id);
          renderGuest();
        });
        gList.appendChild(btn);
      });

      if (!selectedGroupId) {
        $('guest-list-section').hidden = false;
        $('guest-rate-section').hidden = true;
        $('guest-submit-btn').textContent = 'Chọn nhóm đầu tiên để chấm sao';
        return;
      }

      // Màn chấm 1 nhóm trên điện thoại
      $('guest-list-section').hidden = true;
      $('guest-rate-section').hidden = false;

      const grp = state.groups.find(g => g.id === selectedGroupId) || submittedGroups[0];
      const existing = state.votes.find(
        v => v.groupId === grp.id && v.source === 'KHACH' && v.raterId === currentTicketCode
      );
      $('guest-current-group-tag').textContent = existing ? `✓ Đã chấm (${existing.stars.join('/')})` : 'Chưa chấm';
      $('guest-current-group-tag').className = 's15-tag' + (existing ? ' is-done' : '');
      $('guest-group-img').src = grp.cover;
      $('guest-group-name').textContent = `Nhóm ${grp.name}`;
      $('guest-group-project').textContent = grp.projectTitle;
      $('guest-group-idea').textContent = grp.idea;
      $('guest-submit-btn').textContent = existing
        ? `Cập nhật đánh giá Nhóm ${grp.name}`
        : `Gửi đánh giá Nhóm ${grp.name}`;

      // Mỗi tiêu chí một hàng 3 ngôi sao to (BRD mục 10)
      const cList = $('guest-crit-list');
      cList.replaceChildren();
      state.session.criteria.forEach((cName, cIdx) => {
        const row = document.createElement('div');
        row.className = 'guest-crit-row';
        row.id = `guest-crit-row-${cIdx}`;

        const title = document.createElement('b');
        title.textContent = `${cIdx + 1}. ${cName}`;

        const starsBox = document.createElement('div');
        starsBox.className = 'guest-stars-3';
        const curVal = draftStars[cIdx] || 0;
        for (let s = 1; s <= 3; s++) {
          const sBtn = document.createElement('button');
          sBtn.type = 'button';
          sBtn.className = 'guest-star-btn' + (s <= curVal ? ' is-on' : '');
          sBtn.setAttribute('aria-label', `${cName}: ${s} sao`);
          sBtn.innerHTML = `<span class="star-glyph">★</span><span>${s} sao</span>`;
          sBtn.addEventListener('click', () => {
            draftStars[cIdx] = s;
            playTone(480 + s * 90, 0.07);
            renderGuest();
          });
          starsBox.appendChild(sBtn);
        }

        row.append(title, starsBox);
        cList.appendChild(row);
      });

      // Danh sách câu mẫu
      $('guest-preset-counter').textContent = `${draftPresets.length}/2 câu`;
      const pList = $('guest-preset-list');
      pList.replaceChildren();
      PRESET_COMMENTS.forEach(p => {
        const isPicked = draftPresets.includes(p.id);
        const pBtn = document.createElement('button');
        pBtn.type = 'button';
        pBtn.className = 'guest-preset-btn';
        pBtn.setAttribute('aria-pressed', String(isPicked));
        pBtn.textContent = `${isPicked ? '✓ ' : ''}${p.text}`;
        pBtn.addEventListener('click', () => {
          if (isPicked) {
            draftPresets = draftPresets.filter(id => id !== p.id);
          } else {
            if (draftPresets.length >= 2) {
              showGuestToast('Quý khách chọn tối đa 2 câu nhận xét mẫu cho mỗi nhóm.', 'warn');
              return;
            }
            draftPresets.push(p.id);
          }
          renderGuest();
        });
        pList.appendChild(pBtn);
      });
    }

    $('guest-submit-btn').addEventListener('click', () => {
      const submittedGroups = state.groups.filter(g => g.status === 'DA_NOP');
      if (!selectedGroupId) {
        if (submittedGroups.length > 0) {
          loadDraftForGroup(submittedGroups[0].id);
          renderGuest();
        }
        return;
      }

      // BR-TB-02: Kiểm tra buổi trưng bày đang mở
      if (state.session.state !== 'DANG_MO') {
        showGuestToast('Chặn (BR-TB-02): Buổi trưng bày đã đóng, không nhận thêm lượt chấm.', 'bad');
        return;
      }

      // BR-TB-03: Kiểm tra phiếu khách bị thu hồi
      const ticket = state.tickets.find(t => t.code === currentTicketCode);
      if (!ticket || ticket.status === 'DA_THU_HOI') {
        showGuestToast('Chặn (BR-TB-03): Mã phiếu khách này đã bị thu hồi hoặc không hợp lệ.', 'bad');
        return;
      }

      // BR-TB-05: Kiểm tra đủ sao cho mọi tiêu chí
      let missingIdx = -1;
      for (let i = 0; i < state.session.criteria.length; i++) {
        if (!draftStars[i] || draftStars[i] < 1) {
          missingIdx = i;
          const rowEl = document.getElementById(`guest-crit-row-${i}`);
          if (rowEl) rowEl.classList.add('is-missing');
        }
      }
      if (missingIdx !== -1) {
        showGuestToast(`Vui lòng chạm chọn số sao cho tiêu chí "${state.session.criteria[missingIdx]}" (BR-TB-05).`, 'bad');
        return;
      }

      const cleanText = draftText.trim().slice(0, 200);
      const grp = state.groups.find(g => g.id === selectedGroupId);
      const existingIdx = state.votes.findIndex(
        v => v.groupId === grp.id && v.source === 'KHACH' && v.raterId === currentTicketCode
      );

      // Mục 3 BRD: Nếu người chấm sửa chữ thì chữ quay về CHỜ DUYỆT
      const newVote = {
        id: existingIdx >= 0 ? state.votes[existingIdx].id : `v-${grp.id}-${currentTicketCode}`,
        groupId: grp.id,
        source: 'KHACH',
        raterId: currentTicketCode,
        stars: [...draftStars],
        presets: [...draftPresets],
        text: cleanText,
        textStatus: cleanText ? 'CHO_DUYET' : 'KHONG_CO',
        updatedAt: nowShortTime()
      };

      if (existingIdx >= 0) {
        state.votes[existingIdx] = newVote;
      } else {
        state.votes.push(newVote);
      }

      if (ticket.status === 'CHUA_DUNG') {
        ticket.status = 'DA_DUNG';
        ticket.firstUsedAt = nowShortTime();
      }

      saveState();
      playTone(784, 0.14);
      selectedGroupId = null;
      renderGuestTicketSelect();
      renderGuest();
      showGuestToast(
        cleanText
          ? `Xin cảm ơn! Đã gửi sao cho Nhóm ${grp.name}. Lời nhắn của quý khách đã vào Hộp duyệt của giáo viên (GD-19).`
          : `Xin cảm ơn! Đã ghi nhận đánh giá cho Nhóm ${grp.name}. Quý khách có thể chấm tiếp nhóm khác.`,
        'ok'
      );
    });

    renderGuestTicketSelect();
    loadDraftForGroup(selectedGroupId);
    renderGuest();

    window.addEventListener('storage', e => {
      if (e.key === STORAGE_KEY) {
        state = loadState();
        renderGuestTicketSelect();
        renderGuest();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initTrungBayPage();
    initGuestPage();
  });
})();
