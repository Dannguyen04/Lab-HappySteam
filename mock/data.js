/* Dữ liệu mẫu duy nhất cho mọi vai. Không gọi mạng; Node và trình duyệt cùng sử dụng. */
(function (root, factory) {
  const value = factory();
  if (typeof module === 'object' && module.exports) module.exports = value;
  if (root) root.MockData = value;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  function computeSuggestedGrade(completed, total) {
    if (total === 0) return null;
    if (total < 0 || completed < 0 || completed > total) throw new RangeError('Số nhiệm vụ không hợp lệ');
    if (completed === total) return 'HTT';
    if (completed >= Math.ceil(total / 2)) return 'HT';
    return 'CHT';
  }
  const INITIAL_STUDENTS = [
    { id: 1,  nickname: 'Nam B.',  fullName: 'Bùi Hoàng Nam',     animal: 'Sư tử',      hasConsent: true,  groupId: 'G1', role: 'Thợ lắp chính' },
    { id: 2,  nickname: 'An B.',   fullName: '',                  animal: 'Gấu trúc',   hasConsent: false, groupId: 'G1', role: 'Lập trình viên' },
    { id: 3,  nickname: 'An T.',   fullName: 'Trần Bình An',      animal: 'Koala',      hasConsent: true,  groupId: 'G1', role: 'Thiết kế poster' },
    { id: 4,  nickname: 'Bảo',     fullName: 'Nguyễn Gia Bảo',    animal: 'Cáo đỏ',     hasConsent: true,  groupId: 'G1', role: 'Người trình bày' },
    { id: 5,  nickname: 'Chi',     fullName: 'Lê Khánh Chi',      animal: 'Thỏ trắng',  hasConsent: true,  groupId: 'G2', role: 'Thợ lắp chính' },
    { id: 6,  nickname: 'Dũng',    fullName: 'Phạm Tiến Dũng',    animal: 'Hổ vàng',    hasConsent: true,  groupId: 'G2', role: 'Lập trình viên' },
    { id: 7,  nickname: 'Đạt',     fullName: '',                  animal: 'Gấu nâu',    hasConsent: false, groupId: 'G2', role: 'Thiết kế poster' },
    { id: 8,  nickname: 'Giang',   fullName: 'Hoàng Hương Giang', animal: 'Khỉ con',    hasConsent: true,  groupId: 'G2', role: 'Người trình bày' },
    { id: 9,  nickname: 'Hà',      fullName: 'Vũ Ngân Hà',        animal: 'Cá heo',     hasConsent: true,  groupId: 'G3', role: 'Thợ lắp chính' },
    { id: 10, nickname: 'Hải',     fullName: 'Đỗ Thanh Hải',      animal: 'Ếch xanh',   hasConsent: true,  groupId: 'G3', role: 'Lập trình viên' },
    { id: 11, nickname: 'Hiếu',    fullName: 'Ngô Minh Hiếu',     animal: 'Kỳ lân',     hasConsent: true,  groupId: 'G3', role: 'Thiết kế poster' },
    { id: 12, nickname: 'Hương',   fullName: 'Đặng Thu Hương',    animal: 'Cú mèo',     hasConsent: true,  groupId: 'G3', role: 'Người trình bày' },
    { id: 13, nickname: 'Khánh',   fullName: 'Trịnh Quốc Khánh',  animal: 'Cánh cụt',   hasConsent: true,  groupId: 'G4', role: 'Thợ lắp chính' },
    { id: 14, nickname: 'Khoa',    fullName: 'Lý Đăng Khoa',      animal: 'Hươu cao cổ',hasConsent: true,  groupId: 'G4', role: 'Lập trình viên' },
    { id: 15, nickname: 'Lâm',     fullName: 'Phan Tùng Lâm',     animal: 'Nhím nhỏ',   hasConsent: true,  groupId: 'G4', role: 'Thiết kế poster' },
    { id: 16, nickname: 'Linh',    fullName: '',                  animal: 'Ong chăm',   hasConsent: false, groupId: 'G4', role: 'Người trình bày' },
    { id: 17, nickname: 'Mai',     fullName: 'Đinh Ngọc Mai',     animal: 'Rùa biển',   hasConsent: true,  groupId: 'G5', role: 'Thợ lắp chính' },
    { id: 18, nickname: 'Minh H.', fullName: 'Hồ Nhật Minh',      animal: 'Voi con',    hasConsent: true,  groupId: 'G5', role: 'Lập trình viên' },
    { id: 19, nickname: 'Minh N.', fullName: 'Nguyễn Quang Minh', animal: 'Hồng hạc',   hasConsent: true,  groupId: 'G5', role: 'Thiết kế poster' },
    { id: 20, nickname: 'My',      fullName: 'Trương Hà My',      animal: 'Hải cẩu',    hasConsent: true,  groupId: 'G5', role: 'Người trình bày' },
    { id: 21, nickname: 'Nhi',     fullName: 'Võ Yến Nhi',        animal: 'Cua đỏ',     hasConsent: true,  groupId: 'G6', role: 'Thợ lắp chính' },
    { id: 22, nickname: 'Phong',   fullName: 'Lương Hải Phong',   animal: 'Sóc nâu',    hasConsent: true,  groupId: 'G6', role: 'Lập trình viên' },
    { id: 23, nickname: 'Phúc',    fullName: 'Cao Hoàng Phúc',    animal: 'Rái cá',     hasConsent: true,  groupId: 'G6', role: 'Thiết kế poster' },
    { id: 24, nickname: 'Quang',   fullName: '',                  animal: 'Khủng long', hasConsent: false, groupId: 'G6', role: 'Người trình bày' },
    { id: 25, nickname: 'Quân',    fullName: 'Tạ Minh Quân',      animal: 'Cá voi',     hasConsent: true,  groupId: 'G7', role: 'Thợ lắp chính' },
    { id: 26, nickname: 'Sơn',     fullName: 'Mai Trường Sơn',    animal: 'Vẹt xanh',   hasConsent: true,  groupId: 'G7', role: 'Lập trình viên' },
    { id: 27, nickname: 'Trâm',    fullName: '',                  animal: 'Chuột túi',  hasConsent: false, groupId: '',   role: 'Thiết kế poster' },
    { id: 28, nickname: 'Vũ',      fullName: 'Đoàn Tuấn Vũ',      animal: 'Công xanh',  hasConsent: true,  groupId: '',   role: 'Người trình bày' }
  ];

  const INITIAL_GROUPS = [
    { id: 'G1', name: 'Nhóm Tia Chớp',     topic: 'Trạm bơm nước tự động bằng năng lượng mặt trời', status: 'submitted', starsPeer: '2,8', starsGuest: '2,5', starsTeacher: '3,0' },
    { id: 'G2', name: 'Nhóm Sao Băng',     topic: 'Cửa đê ngăn lũ cảnh báo mực nước dâng',         status: 'submitted', starsPeer: '2,6', starsGuest: '2,4', starsTeacher: 'Chưa có' },
    { id: 'G3', name: 'Nhóm Vệ Tinh Xanh', topic: 'Guồng nước tưới vườn rau trường học',           status: 'submitted', starsPeer: '2,9', starsGuest: '2,7', starsTeacher: '3,0' },
    { id: 'G4', name: 'Nhóm Sóng Ngầm',    topic: 'Phễu lọc rác nổi trên kênh đào',                status: 'submitted', starsPeer: '2,4', starsGuest: '2,2', starsTeacher: 'Chưa có' },
    { id: 'G5', name: 'Nhóm Cối Xoay Gió', topic: 'Cối xoay gió kéo gàu nước vùng cao',            status: 'working',   starsPeer: 'Chưa có', starsGuest: 'Chưa có', starsTeacher: 'Chưa có' },
    { id: 'G6', name: 'Nhóm Đê Ngăn Lũ',   topic: 'Cầu phao tự nâng khi nước lũ về',               status: 'submitted', starsPeer: '2,5', starsGuest: '2,3', starsTeacher: 'Chưa có' },
    { id: 'G7', name: 'Nhóm Giọt Nước',    topic: 'Hệ thống hứng nước mưa tưới cây tự động',       status: 'working',   starsPeer: 'Chưa có', starsGuest: 'Chưa có', starsTeacher: 'Chưa có' }
  ];

  const LESSONS = [
    {
      id: 'B1', code: 'lop1-bai01', shortLabel: 'BÀI 1', week: 1,
      title: 'Bài 1: Làm quen bộ công cụ',
      coreMissions: ['NV1: Nhận biết thanh thẳng, trục, chốt', 'NV2: Lắp khung xe trượt dốc', 'NV3: Thử thả xe trên mặt phẳng nghiêng', 'NV4: Thu dọn linh kiện đúng khay'],
      advMissions: ['NV5 (Nâng cao): Nối dài thân xe để chở thêm tải']
    },
    {
      id: 'B2', code: 'lop1-bai02', shortLabel: 'BÀI 2', week: 2,
      title: 'Bài 2: Động cơ',
      coreMissions: ['NV1: Lắp xe leo dốc có động cơ', 'NV2: Nối dây động cơ vào bộ điều khiển', 'NV3: Ghép khối chạy tiến mức 3', 'NV4: Dừng đúng vạch đích'],
      advMissions: ['NV5 (Nâng cao): Đổi tốc độ khi lên dốc cao']
    },
    {
      id: 'B3', code: 'lop1-bai03', shortLabel: 'BÀI 3', week: 3,
      title: 'Bài 3: Robot thám hiểm',
      coreMissions: ['NV1: Lắp robot Milo 22 bước', 'NV2: Ghép khối di chuyển trên sao Hỏa', 'NV3: Dừng khi gặp mẫu cây', 'NV4: Chở mẫu cây về trạm'],
      advMissions: ['NV5 (Nâng cao): Phát âm báo khi tìm thấy mẫu vật']
    },
    {
      id: 'B4', code: 'lop1-bai04', shortLabel: 'BÀI 4', week: 4,
      title: 'Bài 4: Cảm biến của robot',
      coreMissions: ['NV1: Lắp giá đỡ cảm biến', 'NV2: Thử cảm biến phát hiện khoảng cách', 'NV3: Lập trình dừng trước chướng ngại', 'NV4: Đổi chiều khi gặp vật cản'],
      advMissions: ['NV5 (Nâng cao): Kết hợp đèn và âm thanh cảnh báo']
    },
    {
      id: 'B5', code: 'lop1-bai05', shortLabel: 'BÀI 5', week: 5,
      title: 'Bài 5: Chào hỏi, kết bạn – Spy robot',
      coreMissions: ['NV1: Lắp mô hình Spy robot', 'NV2: Gắn cảm biến phía trước', 'NV3: Phát giai điệu chào khi thấy bạn', 'NV4: Lặp lại chu kỳ quan sát'],
      advMissions: ['NV5 (Nâng cao): Ghi âm lời chào của nhóm']
    },
    {
      id: 'B6', code: 'lop1-bai06', shortLabel: 'BÀI 6', week: 6,
      title: 'Bài 6: Luật giao thông',
      coreMissions: ['NV1: Lắp mô hình xe mô tô', 'NV2: Nhận biết tín hiệu đèn giao thông', 'NV3: Lập trình xe dừng trước vạch đỏ', 'NV4: Khởi hành an toàn khi đèn xanh'],
      advMissions: ['NV5 (Nâng cao): Bấm còi báo hiệu khi qua ngã tư']
    },
    {
      id: 'B7', code: 'lop1-bai07', shortLabel: 'BÀI 7', week: 7,
      title: 'Bài 7: Trò chơi của bé',
      coreMissions: ['NV1: Lắp khung xích đu vững chắc', 'NV2: Gắn trục truyền động động cơ', 'NV3: Lập trình quay hai chiều êm ái', 'NV4: Dừng an toàn sau 3 vòng'],
      advMissions: ['NV5 (Nâng cao): Thêm nhạc nền khu vui chơi']
    },
    {
      id: 'B8', code: 'lop1-bai08', shortLabel: 'BÀI 8', week: 8,
      title: 'Bài 8: Ngôi nhà thông minh',
      coreMissions: ['NV1: Lắp khung cửa tự động', 'NV2: Gắn cảm biến nhận diện người đến', 'NV3: Mở cửa và đợi 3 giây', 'NV4: Đóng cửa nhẹ nhàng'],
      advMissions: ['NV5 (Nâng cao): Bật còi báo khi cửa kẹt vật cản']
    },
    {
      id: 'B9', code: 'lop1-bai09', shortLabel: 'BÀI 9 ★', week: 9, isFocus: true,
      title: 'Bài 9: Thông tin liên lạc vũ trụ',
      coreMissions: [
        'NV1: Lắp xong vệ tinh (đủ 28 bước)',
        'NV2: Ghép khối giống hàng mẫu',
        'NV3: Tránh đám đá thiên thạch',
        'NV4: Thử vệ tinh sáng tạo (Cánh pin kép / Chảo ra-đa)'
      ],
      advMissions: [
        'NV5 (Nâng cao): Đợi thiên thạch bay qua (gắn Cảm biến vật cản)'
      ]
    },
    {
      id: 'DA1', code: 'lop1-duan1', shortLabel: 'DỰ ÁN HK I', week: 14, isProject: true,
      title: 'Dự án HK I: Hành trình dòng nước',
      coreMissions: [
        'NV1: Chọn vấn đề về nước & vẽ phác thảo',
        'NV2: Chế tạo mô hình & ghép chương trình',
        'NV3: Nâng cấp giải pháp & hoàn thiện poster',
        'NV4: Chia sẻ giải pháp & tự đánh giá'
      ],
      advMissions: [
        'NV5 (Nâng cao): Tích hợp cảm biến tự động đóng/mở dòng nước'
      ]
    }
  ];
  const DEFAULT_STUDENTS = [
    { id: 1, shortName: 'Nam B.', fullName: 'Bùi Hoàng Nam', dob: '2020-04-15', animal: 'Sư tử', animalKey: 'lion', code: 'K7M9P2X4', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-10 19:20', groupRole: 'Thợ lắp chính', inProjectTeam: true },
    { id: 2, shortName: 'An P.', fullName: '', dob: '', animal: 'Gấu trúc', animalKey: 'panda', code: 'H3N8Q5R2', status: 'active', linkedCount: 1, hasConsent: false, consentAt: '', groupRole: 'Lập trình', inProjectTeam: false },
    { id: 3, shortName: 'Bảo K.', fullName: 'Trần Gia Bảo', dob: '2020-08-22', animal: 'Gấu Koala', animalKey: 'koala', code: 'B6V4C9M3', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-09 20:05', groupRole: 'Lập trình', inProjectTeam: true },
    { id: 4, shortName: 'Chi L.', fullName: 'Lê Mai Chi', dob: '2020-02-11', animal: 'Cáo đỏ', animalKey: 'fox', code: 'F4T6W8Y9', status: 'active', linkedCount: 2, hasConsent: true, consentAt: '2026-09-08 18:10', groupRole: 'Vẽ poster', inProjectTeam: true },
    { id: 5, shortName: 'Dũng V.', fullName: 'Vũ Tiến Dũng', dob: '2020-06-03', animal: 'Thỏ trắng', animalKey: 'rabbit', code: 'D2G7J5K8', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-11 21:00', groupRole: 'Thợ lắp', inProjectTeam: false },
    { id: 6, shortName: 'Đạt N.', fullName: '', dob: '', animal: 'Gấu nâu', animalKey: 'bear', code: 'R9X2C5V7', status: 'revoked', linkedCount: 0, hasConsent: false, consentAt: '', groupRole: 'Kiểm thử', inProjectTeam: false },
    { id: 7, shortName: 'Hà T.', fullName: 'Trịnh Thu Hà', dob: '2020-11-19', animal: 'Khỉ con', animalKey: 'monkey', code: 'P5S8W3Z6', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-12 08:30', groupRole: 'Trình bày', inProjectTeam: false },
    { id: 8, shortName: 'Hải Đ.', fullName: 'Đỗ Minh Hải', dob: '2020-01-27', animal: 'Cá heo', animalKey: 'dolphin', code: 'M4N7B2V9', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-10 17:45', groupRole: 'Thợ lắp', inProjectTeam: false },
    { id: 9, shortName: 'Hiếu M.', fullName: 'Mai Trung Hiếu', dob: '2020-05-14', animal: 'Ếch xanh', animalKey: 'frog', code: 'T3Y6U8P4', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-10 20:15', groupRole: 'Lập trình', inProjectTeam: false },
    { id: 10, shortName: 'Hương N.', fullName: 'Nguyễn Lan Hương', dob: '2020-09-05', animal: 'Kỳ lân', animalKey: 'unicorn', code: 'W7E3R9T2', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-11 19:00', groupRole: 'Vẽ poster', inProjectTeam: false },
    { id: 11, shortName: 'Khánh P.', fullName: 'Phạm Quốc Khánh', dob: '2020-09-02', animal: 'Cú mèo', animalKey: 'owl', code: 'L8K4J2H6', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-12 20:40', groupRole: 'Thợ lắp', inProjectTeam: false },
    { id: 12, shortName: 'Khoa Đ.', fullName: 'Đặng Anh Khoa', dob: '2020-03-18', animal: 'Chim cánh cụt', animalKey: 'penguin', code: 'Z5X9C3V8', status: 'active', linkedCount: 2, hasConsent: true, consentAt: '2026-09-09 19:15', groupRole: 'Lập trình', inProjectTeam: false },
    { id: 13, shortName: 'Lâm H.', fullName: 'Hoàng Tùng Lâm', dob: '2020-07-30', animal: 'Hươu cao cổ', animalKey: 'giraffe', code: 'Q4W8E2R6', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-13 10:00', groupRole: 'Thợ lắp', inProjectTeam: false },
    { id: 14, shortName: 'Linh C.', fullName: '', dob: '', animal: 'Nhím gai', animalKey: 'hedgehog', code: 'A9S4D7F2', status: 'active', linkedCount: 0, hasConsent: false, consentAt: '', groupRole: 'Vẽ poster', inProjectTeam: false },
    { id: 15, shortName: 'Mai Đ.', fullName: 'Đoàn Ngọc Mai', dob: '2020-10-12', animal: 'Ong vàng', animalKey: 'bee', code: 'G6H2J8K5', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-10 21:10', groupRole: 'Trình bày', inProjectTeam: false },
    { id: 16, shortName: 'Minh H.', fullName: 'Hồ Nhật Minh', dob: '2020-12-01', animal: 'Rùa xanh', animalKey: 'turtle', code: 'C7V3B9N4', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-08 20:30', groupRole: 'Trình bày', inProjectTeam: true },
    { id: 17, shortName: 'My L.', fullName: 'Lương Thảo My', dob: '2020-04-08', animal: 'Voi con', animalKey: 'elephant', code: 'Y2U7P5A8', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-11 18:20', groupRole: 'Vẽ poster', inProjectTeam: false },
    { id: 18, shortName: 'Nhi T.', fullName: 'Trương Yến Nhi', dob: '2020-08-09', animal: 'Hồng hạc', animalKey: 'flamingo', code: 'N6M3K9J4', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-12 19:50', groupRole: 'Trình bày', inProjectTeam: false },
    { id: 19, shortName: 'Phong V.', fullName: 'Võ Hải Phong', dob: '2020-02-24', animal: 'Hải cẩu', animalKey: 'seal', code: 'R5T8Y2U6', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-10 22:00', groupRole: 'Thợ lắp', inProjectTeam: false },
    { id: 20, shortName: 'Phúc N.', fullName: 'Nguyễn Hồng Phúc', dob: '2020-06-17', animal: 'Cua đỏ', animalKey: 'crab', code: 'E4R7T3Y9', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-11 09:15', groupRole: 'Lập trình', inProjectTeam: false },
    { id: 21, shortName: 'Quang B.', fullName: '', dob: '', animal: 'Bướm vàng', animalKey: 'butterfly', code: 'U8P3A6S4', status: 'active', linkedCount: 0, hasConsent: false, consentAt: '', groupRole: 'Thợ lắp', inProjectTeam: false },
    { id: 22, shortName: 'Quân L.', fullName: 'Lê Minh Quân', dob: '2020-05-29', animal: 'Khủng long', animalKey: 'dino', code: 'D9F4G7H3', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-10 19:45', groupRole: 'Lập trình', inProjectTeam: false },
    { id: 23, shortName: 'Sơn T.', fullName: 'Trần Thái Sơn', dob: '2020-11-04', animal: 'Cá voi', animalKey: 'whale', code: 'J6K2L8Z5', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-12 17:30', groupRole: 'Thợ lắp', inProjectTeam: false },
    { id: 24, shortName: 'Thảo P.', fullName: 'Phan Phương Thảo', dob: '2020-03-07', animal: 'Vẹt xanh', animalKey: 'parrot', code: 'X3C8V4B7', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-09 21:20', groupRole: 'Trình bày', inProjectTeam: false },
    { id: 25, shortName: 'Trâm N.', fullName: '', dob: '', animal: 'Chuột túi', animalKey: 'kangaroo', code: 'B9N4M2Q7', status: 'active', linkedCount: 0, hasConsent: false, consentAt: '', groupRole: 'Vẽ poster', inProjectTeam: false },
    { id: 26, shortName: 'Tú H.', fullName: 'Huỳnh Anh Tú', dob: '2020-07-14', animal: 'Sói xám', animalKey: 'wolf', code: 'W5E9R4T7', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-13 11:10', groupRole: 'Lập trình', inProjectTeam: false },
    { id: 27, shortName: 'Việt K.', fullName: 'Kiều Quốc Việt', dob: '2020-01-12', animal: 'Hổ vằn', animalKey: 'tiger', code: 'S7D3F8G2', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-10 18:00', groupRole: 'Thợ lắp', inProjectTeam: false },
    { id: 28, shortName: 'Vũ Đ.', fullName: 'Đinh Tuấn Vũ', dob: '2020-10-25', animal: 'Chim công', animalKey: 'peacock', code: 'H4J9K3L7', status: 'active', linkedCount: 1, hasConsent: true, consentAt: '2026-09-11 20:05', groupRole: 'Trình bày', inProjectTeam: false }
  ];

  const STUDENT_LESSONS = {
    1: [
      {
        id: 'lop1-bai09',
        week: 9,
        title: 'Bài 9: Thông tin liên lạc vũ trụ',
        cover: '../assets/covers/lop1-bai09.jpg',
        featured: true,
        updatedAt: '02/11/2026 · 09:15',
        creativePack: 'Gói vệ tinh năng lượng mặt trời + đĩa radar thu phát',
        programMode: 'Kiểu ngang (ZMrobo)',
        programBlocks: ['Bắt đầu', 'Bắt đầu lặp', 'Quay anten phải (M1)', 'Đợi 2 giây', 'Phát tín hiệu bíp', 'Nếu thấy thiên thạch → Thu cánh pin', 'Lặp lại'],
        suggestedGrade: 'HTT',
        teacherGrade: 'HTT',
        gradedBy: 'Cô Nguyễn Thu Hà',
        gradedAt: '02/11/2026',
        comment: 'Em Nam lắp mô hình vệ tinh rất chắc chắn, tự gắn thêm tấm pin mặt trời ở chặng Sáng tạo và hoàn thành cả nhiệm vụ nâng cao NV5 tránh thiên thạch.',
        missions: [
          { code: 'NV1', name: 'Lắp hoàn chỉnh trạm vệ tinh liên lạc (28 bước)', type: 'basic', done: true },
          { code: 'NV2', name: 'Gắn thêm tấm pin mặt trời và đĩa radar ở Xưởng sáng tạo', type: 'basic', done: true },
          { code: 'NV3', name: 'Lập trình động cơ quay anten bắt đúng hướng sóng', type: 'basic', done: true },
          { code: 'NV4', name: 'Truyền đủ 3 bản tin tín hiệu về Trái Đất an toàn', type: 'basic', done: true },
          { code: 'NV5', name: 'Cảm biến phát hiện và gập cánh tránh thiên thạch', type: 'advanced', done: true }
        ]
      },
      {
        id: 'lop1-bai03',
        week: 3,
        title: 'Bài 3: Robot thám hiểm',
        cover: '../assets/covers/lop1-bai03.jpg',
        featured: false,
        updatedAt: '21/09/2026 · 10:05',
        creativePack: 'Gói bánh xích vượt địa hình sao Hỏa',
        programMode: 'Kiểu ngang (ZMrobo)',
        programBlocks: ['Bắt đầu', 'Chạy tiến tốc độ 2', 'Đợi cảm biến khoảng cách', 'Dừng lại', 'Phát âm báo'],
        suggestedGrade: 'HTT',
        teacherGrade: 'HTT',
        gradedBy: 'Cô Nguyễn Thu Hà',
        gradedAt: '22/09/2026',
        comment: 'Em nhận biết nhanh các thanh truyền động, lắp robot Milo đúng 22 bước và biết đặt khối cảm biến dừng trước vật cản.',
        missions: [
          { code: 'NV1', name: 'Lắp hoàn chỉnh khung và động cơ robot Milo (22 bước)', type: 'basic', done: true },
          { code: 'NV2', name: 'Gắn giỏ chở mẫu cây trên sao Hỏa', type: 'basic', done: true },
          { code: 'NV3', name: 'Lập trình robot đi thẳng tới trạm thu mẫu', type: 'basic', done: true },
          { code: 'NV4', name: 'Dừng lại đúng lúc khi gặp đá cản đường', type: 'basic', done: true },
          { code: 'NV5', name: 'Lùi lại và phát âm thanh báo hiệu về trạm', type: 'advanced', done: false }
        ]
      },
      {
        id: 'lop1-bai10',
        week: 10,
        title: 'Bài 10: Bạn gió tinh nghịch, gió ở đâu?',
        cover: '../assets/covers/lop1-bai10.jpg',
        featured: false,
        updatedAt: '01/11/2026 · 20:10 (Làm ở nhà)',
        creativePack: 'Cối xay gió 4 cánh lớn + đèn trạm sạc',
        programMode: 'Kiểu dọc (Scratch)',
        programBlocks: ['Khi bấm Bắt đầu', 'Lặp lại mãi { Nếu nhấn nút chạm → Quay cánh quạt nhanh }'],
        suggestedGrade: 'HT',
        teacherGrade: 'NONE',
        gradedBy: 'Chưa chấm',
        gradedAt: 'Đang làm',
        comment: '',
        missions: [
          { code: 'NV1', name: 'Lắp trụ và cánh cối xay gió (15 bước)', type: 'basic', done: true },
          { code: 'NV2', name: 'Nối nút nhấn cảm biến chạm với bộ điều khiển', type: 'basic', done: true },
          { code: 'NV3', name: 'Nhấn nút để đổi 2 cấp tốc độ quay cánh quạt', type: 'basic', done: true },
          { code: 'NV4', name: 'Sạc đầy bình điện thắp sáng ngôi nhà', type: 'basic', done: false },
          { code: 'NV5', name: 'Tự động giảm tốc khi gió quá mạnh', type: 'advanced', done: false }
        ]
      }
    ],
    2: [
      {
        id: 'lop1-bai09',
        week: 9,
        title: 'Bài 9: Thông tin liên lạc vũ trụ',
        cover: '../assets/covers/lop1-bai09.jpg',
        featured: true,
        updatedAt: '02/11/2026 · 09:12',
        creativePack: 'Gói anten định hướng cơ bản',
        programMode: 'Kiểu ngang (ZMrobo)',
        programBlocks: ['Bắt đầu', 'Quay anten phải (M1)', 'Đợi 3 giây', 'Phát tín hiệu bíp'],
        suggestedGrade: 'HT',
        teacherGrade: 'HT',
        gradedBy: 'Cô Nguyễn Thu Hà',
        gradedAt: '02/11/2026',
        comment: 'Em An lắp xong khung vệ tinh và cho anten quay bắt sóng được. Em cần thử thêm vòng lặp để truyền đủ 3 bản tin.',
        missions: [
          { code: 'NV1', name: 'Lắp hoàn chỉnh trạm vệ tinh liên lạc (28 bước)', type: 'basic', done: true },
          { code: 'NV2', name: 'Gắn thêm tấm pin mặt trời và đĩa radar ở Xưởng sáng tạo', type: 'basic', done: true },
          { code: 'NV3', name: 'Lập trình động cơ quay anten bắt đúng hướng sóng', type: 'basic', done: true },
          { code: 'NV4', name: 'Truyền đủ 3 bản tin tín hiệu về Trái Đất an toàn', type: 'basic', done: false },
          { code: 'NV5', name: 'Cảm biến phát hiện và gập cánh tránh thiên thạch', type: 'advanced', done: false }
        ]
      },
      {
        id: 'lop1-bai03',
        week: 3,
        title: 'Bài 3: Robot thám hiểm',
        cover: '../assets/covers/lop1-bai03.jpg',
        featured: false,
        updatedAt: '21/09/2026 · 09:50',
        creativePack: 'Gói tiêu chuẩn',
        programMode: 'Kiểu ngang (ZMrobo)',
        programBlocks: ['Bắt đầu', 'Chạy tiến tốc độ 2', 'Dừng lại'],
        suggestedGrade: 'HTT',
        teacherGrade: 'HTT',
        gradedBy: 'Cô Nguyễn Thu Hà',
        gradedAt: '22/09/2026',
        comment: 'Em An hoàn thành tốt cả 4 nhiệm vụ cơ bản của bài Robot thám hiểm.',
        missions: [
          { code: 'NV1', name: 'Lắp hoàn chỉnh khung và động cơ robot Milo (22 bước)', type: 'basic', done: true },
          { code: 'NV2', name: 'Gắn giỏ chở mẫu cây trên sao Hỏa', type: 'basic', done: true },
          { code: 'NV3', name: 'Lập trình robot đi thẳng tới trạm thu mẫu', type: 'basic', done: true },
          { code: 'NV4', name: 'Dừng lại đúng lúc khi gặp đá cản đường', type: 'basic', done: true },
          { code: 'NV5', name: 'Lùi lại và phát âm thanh báo hiệu về trạm', type: 'advanced', done: false }
        ]
      }
    ]
  };

  const PROJECT_TEAM_DATA = {
    teamName: 'Nhóm Tàu Lá',
    topic: 'Dự án "Hành trình dòng nước" – Mô hình Cửa đê ngăn lũ tự động',
    cover: '../assets/covers/lop1-bai12.jpg',
    stage: 'Giai đoạn 4/4 · Đã nộp poster & trưng bày',
    teacherGrade: 'HTT',
    teacherComment: 'Nhóm Tàu Lá (4 em) phân công rõ ràng: mô hình cửa đê nâng hạ mượt, poster giải thích dễ hiểu nguyên lý giữ nước.',
    memberIds: [1, 3, 4, 16],
    ratingsBySource: [
      {
        source: 'Các bạn trong lớp',
        count: 4,
        note: '4 lượt chấm ẩn danh từ bạn cùng lớp 1A2',
        avgTotal: '2,5',
        criteria: [
          { name: 'Ý tưởng', score: '2,8' },
          { name: 'Mô hình chạy', score: '2,3' },
          { name: 'Trình bày', score: '2,5' }
        ]
      },
      {
        source: 'Khách đến lớp (quét QR)',
        count: 2,
        note: '2 phiếu hợp lệ (không gộp chung với sao của bạn – BRD 6.4)',
        avgTotal: '2,2',
        criteria: [
          { name: 'Ý tưởng', score: '2,5' },
          { name: 'Mô hình chạy', score: '1,5' },
          { name: 'Trình bày', score: '2,5' }
        ]
      },
      {
        source: 'Giáo viên chấm sao',
        count: 0,
        note: 'Giáo viên đánh giá chính thức bằng mức HTT (GD-21)',
        avgTotal: 'Chưa có',
        criteria: []
      }
    ],
    approvedQuotes: [
      { author: 'Một bạn trong lớp', type: 'Câu mẫu', text: 'Mô hình chạy êm và chắc chắn!' },
      { author: 'Một bạn trong lớp', type: 'Câu mẫu', text: 'Poster vẽ rõ ràng, màu sắc đẹp.' },
      { author: 'Một vị khách', type: 'Nhận xét đã duyệt', text: 'Ý tưởng gắn cảm biến mực nước rất thực tế, các con thuyết trình tự tin.' },
      { author: 'Một vị khách', type: 'Câu mẫu', text: 'Trình bày dễ hiểu, mô hình sáng tạo.' }
    ]
  };
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
  function buildDefaultState() {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    const groups = JSON.parse(JSON.stringify(INITIAL_GROUPS));
    const cells = {};

    students.forEach((st) => {
      LESSONS.forEach((ls, lIdx) => {
        const key = `${st.id}_${ls.id}`;
        let coreFlags = [true, true, true, true];
        let advFlags = [false];

        if (ls.id === 'B9') {
          // Tạo phân bổ thực tế cho Bài 9 (NV1-NV5):
          // - 14 em xong đủ 4/4 NV cơ bản (HTT), trong đó 8 em xong cả NV5 nâng cao
          // - 9 em xong 2/4 hoặc 3/4 NV cơ bản (HT) -> thuộc diện "em chưa xong"
          // - 5 em mới xong 1/4 NV cơ bản (CHT) -> thuộc diện "em chưa xong"
          if (st.id % 5 === 0) {
            coreFlags = [true, false, false, false];
            advFlags = [false];
          } else if (st.id % 3 === 0) {
            coreFlags = [true, true, true, false];
            advFlags = [false];
          } else if (st.id % 7 === 0) {
            coreFlags = [true, true, false, false];
            advFlags = [false];
          } else {
            coreFlags = [true, true, true, true];
            advFlags = [st.id % 2 === 1];
          }
        } else if (ls.id === 'DA1') {
          const grp = groups.find(g => g.id === st.groupId);
          if (grp && grp.status === 'submitted') {
            coreFlags = [true, true, true, true];
            advFlags = [st.id % 2 === 0];
          } else {
            coreFlags = [true, true, false, false];
            advFlags = [false];
          }
        } else {
          // Bài 1 -> Bài 8
          const mod = (st.id + lIdx) % 6;
          if (mod === 0) {
            coreFlags = [true, true, false, false];
          } else if (mod === 1) {
            coreFlags = [true, true, true, false];
          } else {
            coreFlags = [true, true, true, true];
          }
          advFlags = [(st.id + lIdx) % 3 === 0];
        }

        const coreDone = coreFlags.filter(Boolean).length;
        const suggested = computeSuggestedGrade(coreDone, 4);

        // Bài 1..6 đã chấm phần lớn; Bài 9 đã chấm 10/28 em để giáo viên bấm thử chấm tiếp
        let isGraded = false;
        let teacherGrade = '';
        let teacherComment = '';
        let hasRecentProgress = false;

        if (lIdx <= 5 || (lIdx <= 7 && st.id % 2 === 0) || (ls.id === 'B9' && st.id <= 10)) {
          isGraded = true;
          teacherGrade = suggested;
          if (st.hasConsent) {
            if (ls.id === 'B9') {
              teacherComment = coreDone === 4
                ? `Em ${st.nickname} lắp xong vệ tinh 28 bước, lập trình tránh thiên thạch chính xác.`
                : `Em ${st.nickname} đã lắp được thân vệ tinh, cần thử thêm khối lệnh tránh đá thiên thạch.`;
            } else {
              teacherComment = `Em ${st.nickname} hoàn thành tốt thao tác lắp ráp và chạy thử mô hình.`;
            }
          }
        }

        if (isGraded && ls.id === 'B9' && (st.id === 3 || st.id === 8)) {
          hasRecentProgress = true;
        }

        const upgrades = ['Cánh pin kép (2 khung 5×7)', 'Chảo ra-đa (Bánh răng 40 răng)', 'Cảm biến né thiên thạch'];
        const upgradePick = upgrades[(st.id - 1) % upgrades.length];

        cells[key] = {
          studentId: st.id,
          lessonId: ls.id,
          coreFlags,
          advFlags,
          suggested,
          isGraded,
          teacherGrade,
          teacherComment,
          hasRecentProgress,
          selected: false,
          upgradePick,
          savedAt: '08:40 · Máy bảng #' + String((st.id % 14) + 1).padStart(2, '0'),
          source: 'direct'
        };
      });
    });

    return {
      activeTab: 's07',
      lessonScope: 'all',
      filterUnfinished: false,
      filterUngraded: false,
      searchQuery: '',
      students,
      groups,
      cells,
      lastExport: null
    };
  }
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
  // Một danh tính dùng xuyên suốt S-07, S-11, S-15/S-17.
  INITIAL_STUDENTS[2].nickname = 'Minh Anh';
  INITIAL_STUDENTS[2].fullName = 'Nguyễn Minh Anh';
  DEFAULT_STUDENTS[2].shortName = 'Minh Anh';
  DEFAULT_STUDENTS[2].fullName = 'Nguyễn Minh Anh';
  DEFAULT_STUDENTS[2].animal = INITIAL_STUDENTS[2].animal;
  INITIAL_STUDENTS[26].groupId = 'G7';
  INITIAL_STUDENTS[27].groupId = 'G7';
  // Cùng mã nhóm và tên nhóm từ buổi trưng bày (BRD 6.6).
  const exhibitGroups = createDefaultState().groups;
  INITIAL_GROUPS.forEach((group, index) => {
    const existing = exhibitGroups[index];
    group.name = existing.name;
    group.topic = existing.projectTitle;
    group.status = existing.status === 'DA_NOP' ? 'submitted' : 'working';
  });
  PROJECT_TEAM_DATA.memberIds = [9, 10, 11, 12];
  PROJECT_TEAM_DATA.teamName = 'Nhóm Tàu Lá';
  PROJECT_TEAM_DATA.topic = exhibitGroups[2].projectTitle;

  function createSeed() {
    const teacher = buildDefaultState();
    const exhibition = createDefaultState();
    const profiles = clone(DEFAULT_STUDENTS).map(profile => {
      const st = teacher.students.find(s => s.id === profile.id);
      return Object.assign(profile, {
        shortName: st.nickname, animal: st.animal,
        fullName: st.hasConsent ? st.fullName : '', hasConsent: st.hasConsent,
        groupRole: st.role, inProjectTeam: Boolean(st.groupId)
      });
    });
    return {
      version: 76,
      teacher,
      parent: {
        loggedIn: true, parentName: 'Phụ huynh Minh Anh', parentEmail: 'phuhuynh@example.test',
        step: 's11', s11Tab: 'lessons', linkedStudentIds: [3], selectedStudentId: 3,
        pendingInviteStudentId: null, kidModeOpen: false
      },
      parentProfiles: profiles,
      exhibition
    };
  }
  return {
    clone, createSeed, computeSuggestedGrade,
    lessons: clone(LESSONS), parentLessons: clone(STUDENT_LESSONS),
    projectTeam: clone(PROJECT_TEAM_DATA), presetComments: clone(PRESET_COMMENTS)
  };
});
