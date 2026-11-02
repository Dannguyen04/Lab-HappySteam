/* ==========================================================================
   Phiếu 73a – Logic tương tác Giáo viên (S-07 Bảng lớp & Chấm, S-08 Nhóm dự án, S-13 Xuất CSV)
   Thuần JavaScript, không phụ thuộc mạng, lưu trạng thái vào localStorage (mock.*).
   ========================================================================== */
(function () {
  'use strict';

  const STORAGE_KEY = 'mock.73a.state';
  const STORAGE_GRADES_KEY = 'mock.grades.1A2';
  const STORAGE_GROUPS_KEY = 'mock.groups.1A2';

  /* ---------- Biểu tượng con vật dạng SVG thuần (không dùng emoji trang trí) ---------- */
  function animalSvg(index) {
    const shapes = [
      // Tai tròn (Gấu, Sư tử, Hổ, Gấu trúc...)
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><circle cx="12" cy="13" r="7"/><circle cx="9.5" cy="12" r="1" fill="currentColor"/><circle cx="14.5" cy="12" r="1" fill="currentColor"/><path d="M10 15.5c1.2 1 2.8 1 4 0"/></svg>',
      // Tai nhọn (Cáo, Mèo, Sói, Thỏ...)
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 11L7 4l4 4h2l4-4 2 7"/><path d="M5 11a7 7 0 0 0 14 0"/><circle cx="9.5" cy="12.5" r="1" fill="currentColor"/><circle cx="14.5" cy="12.5" r="1" fill="currentColor"/><path d="M11 15.5h2"/></svg>',
      // Chim / Cú / Đại bàng / Cánh cụt
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="9" cy="10.5" r="1.5"/><circle cx="15" cy="10.5" r="1.5"/><path d="M10.5 14l1.5 2 1.5-2z"/></svg>',
      // Sinh vật biển (Cá heo, Cá voi, Rùa, Hải cẩu...)
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13c3-5 9-6 14-2 2 1.5 4 1 4-1v6c0-2-2-2.5-4-1-5 4-11 3-14-2z"/><circle cx="13" cy="11.5" r="1" fill="currentColor"/></svg>'
    ];
    return shapes[index % shapes.length];
  }

  /* ---------- Danh sách 28 học sinh Lớp 1A2 (5 em chưa có đồng ý PH theo GD-14/BR-DY-02) ---------- */
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

  /* ---------- Danh sách các bài học Lớp 1 Học kì I (bám sát js/catalog.js & js/bai09/lesson.js) ---------- */
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

  const ROLES = ['Thợ lắp chính', 'Lập trình viên', 'Thiết kế poster', 'Người trình bày'];

  /* ---------- Trạng thái ứng dụng ---------- */
  let state = null;
  let activeDrawerKey = null; // `${studentId}_${lessonId}`
  let tempDrawerGrade = null;
  let pickedStudentId = null; // dùng cho thao tác chạm xếp nhóm ở S-08
  let toastTimer = null;

  /* ---------- Công thức BRD 6.2 ---------- */
  function computeSuggestedGrade(coreDoneCount, totalCore) {
    if (totalCore <= 0) return 'HT';
    const halfCeil = Math.ceil(totalCore / 2);
    if (coreDoneCount >= totalCore) return 'HTT';
    if (coreDoneCount >= halfCeil) return 'HT';
    return 'CHT';
  }

  function gradeFullName(g) {
    if (g === 'HTT') return 'Hoàn thành tốt';
    if (g === 'HT') return 'Hoàn thành';
    if (g === 'CHT') return 'Chưa hoàn thành';
    return 'Chưa chấm';
  }

  /* ---------- Khởi tạo dữ liệu mẫu ---------- */
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

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.students) && parsed.cells) {
          state = parsed;
          return;
        }
      }
    } catch (_) {
      // Bỏ qua lỗi đọc localStorage
    }
    state = buildDefaultState();
    saveState();
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(STORAGE_GRADES_KEY, JSON.stringify(state.cells));
      localStorage.setItem(STORAGE_GROUPS_KEY, JSON.stringify(state.groups));
    } catch (_) {
      // Bỏ qua nếu trình duyệt chặn localStorage
    }
    updateHeaderKPIs();
  }

  function showToast(msg) {
    const el = document.getElementById('gv-toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 2800);
  }

  /* ---------- Cập nhật chỉ số đầu trang ---------- */
  function updateHeaderKPIs() {
    const totalStudents = state.students.length;
    let b9DoneCount = 0;
    let gradedCount = 0;
    let totalCells = 0;

    state.students.forEach((st) => {
      const b9Cell = state.cells[`${st.id}_B9`];
      if (b9Cell && b9Cell.coreFlags.filter(Boolean).length === 4) {
        b9DoneCount++;
      }
      LESSONS.forEach((ls) => {
        totalCells++;
        const c = state.cells[`${st.id}_${ls.id}`];
        if (c && c.isGraded) gradedCount++;
      });
    });

    document.getElementById('kpi-total-students').textContent = `${totalStudents} em`;
    document.getElementById('kpi-b9-done').textContent = `${b9DoneCount}/${totalStudents} em`;
    document.getElementById('kpi-graded-cells').textContent = `${gradedCount}/${totalCells}`;
    document.getElementById('kpi-groups-count').textContent = `${state.groups.length} nhóm`;
  }

  /* ---------- Điều hướng Tab (S-07 / S-08 / S-13) ---------- */
  function switchTab(tabId, updateHash = true) {
    const valid = ['s07', 's08', 's13'];
    const target = valid.includes(tabId) ? tabId : 's07';
    state.activeTab = target;
    saveState();

    valid.forEach((id) => {
      const btn = document.getElementById(`tab-${id}`);
      const pane = document.getElementById(`pane-${id}`);
      const isSelected = id === target;
      if (btn) btn.setAttribute('aria-selected', String(isSelected));
      if (pane) pane.hidden = !isSelected;
    });

    if (target === 's07') renderMatrix();
    if (target === 's08') renderGroupsView();
    if (target === 's13') renderS13Preview();

    if (updateHash && history.replaceState) {
      history.replaceState(null, '', `#${target}`);
    }
  }

  /* =====================================================================
     MÀN HÌNH S-07: BẢNG LỚP & CHẤM BÀI
     ===================================================================== */
  function getVisibleLessons() {
    if (state.lessonScope === 'b9') {
      return LESSONS.filter(l => l.id === 'B9' || l.id === 'DA1');
    }
    return LESSONS;
  }

  function renderMatrix() {
    const thead = document.getElementById('matrix-thead');
    const tbody = document.getElementById('matrix-tbody');
    if (!thead || !tbody) return;

    const visibleLessons = getVisibleLessons();
    const query = (state.searchQuery || '').trim().toLowerCase();

    // Lọc danh sách học sinh
    const filteredStudents = state.students.filter((st) => {
      if (query) {
        const matchName = st.nickname.toLowerCase().includes(query) || st.animal.toLowerCase().includes(query);
        if (!matchName) return false;
      }
      if (state.filterUnfinished) {
        const b9 = state.cells[`${st.id}_B9`];
        const done = b9 ? b9.coreFlags.filter(Boolean).length : 0;
        if (done >= 4) return false;
      }
      return true;
    });

    // Render Header
    const headRow = document.createElement('tr');
    const cornerTh = document.createElement('th');
    cornerTh.className = 'gv-corner-th gv-col-student';
    cornerTh.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
        <span>HỌC SINH (${filteredStudents.length}/${state.students.length})</span>
        <span style="font-weight:500; font-size:11px; color:var(--muted);">Con vật · Nhóm</span>
      </div>
    `;
    headRow.appendChild(cornerTh);

    visibleLessons.forEach((ls) => {
      const th = document.createElement('th');
      if (ls.isFocus) th.className = 'is-focus-lesson';
      else if (ls.isProject) th.className = 'is-project-col';
      th.title = ls.title;
      th.innerHTML = `
        <div>${ls.shortLabel}</div>
        <div style="font-weight:500; font-size:10.5px; margin-top:2px;">Tuần ${ls.week}</div>
      `;
      headRow.appendChild(th);
    });
    thead.replaceChildren(headRow);

    // Render Body
    tbody.replaceChildren();
    filteredStudents.forEach((st, idx) => {
      const tr = document.createElement('tr');
      const groupObj = state.groups.find(g => g.id === st.groupId);
      const groupLabel = groupObj ? groupObj.name : 'Chưa xếp nhóm';

      const tdStudent = document.createElement('td');
      tdStudent.className = 'gv-col-student';
      tdStudent.innerHTML = `
        <div class="st-row-info">
          <div class="st-identity">
            <span class="st-avatar-badge" aria-hidden="true">${animalSvg(st.id)}</span>
            <div class="st-name-wrap">
              <span class="st-name">${st.nickname}</span>
              <span class="st-sub">${st.animal} · ${groupLabel}</span>
            </div>
          </div>
          ${!st.hasConsent ? '<span class="st-consent-tag" title="GD-14 & BR-DY-02: Chưa có phụ huynh đồng ý lưu dữ liệu định danh. Chỉ lưu mức, không lưu nhận xét.">Chờ PH</span>' : ''}
        </div>
      `;
      tr.appendChild(tdStudent);

      visibleLessons.forEach((ls) => {
        const key = `${st.id}_${ls.id}`;
        const cell = state.cells[key];
        const coreDone = cell.coreFlags.filter(Boolean).length;
        const advDone = cell.advFlags.filter(Boolean).length;
        cell.suggested = computeSuggestedGrade(coreDone, 4);

        const td = document.createElement('td');
        const classes = ['gv-cell'];
        if (ls.isFocus) classes.push('is-focus-col');
        if (cell.selected) classes.push('is-selected');
        if (activeDrawerKey === key) classes.push('is-editing');
        if (state.filterUngraded && cell.isGraded) classes.push('is-dimmed');
        td.className = classes.join(' ');
        td.id = `cell-${key}`;

        const pct = Math.round((coreDone / 4) * 100);
        const nvLabel = advDone > 0 ? `<strong>${coreDone}/4</strong> +NV5` : `<strong>${coreDone}/4</strong> NV`;
        const gradeBadge = cell.isGraded && cell.teacherGrade
          ? `<span class="gv-grade-pill" data-g="${cell.teacherGrade}">${cell.teacherGrade}</span>`
          : `<span class="gv-grade-pill" data-g="NONE">Chưa chấm</span>`;

        td.innerHTML = `
          <div class="gv-cell-inner">
            <div class="gv-cell-top">
              <input type="checkbox" class="gv-cell-check" ${cell.selected ? 'checked' : ''} aria-label="Chọn ô ${st.nickname} ${ls.shortLabel}">
              <span class="gv-cell-nv">${nvLabel}</span>
              ${cell.hasRecentProgress ? '<span class="gv-dot-new" title="Em vừa hoàn thành thêm nhiệm vụ sau khi chấm"></span>' : ''}
            </div>
            <div class="gv-mini-bar">
              <b style="width:${pct}%" data-level="${cell.suggested}"></b>
            </div>
            <div class="gv-cell-bottom">
              ${gradeBadge}
              <span class="gv-suggest-hint" title="Mức máy gợi ý theo BRD 6.2">Gợi ý:${cell.suggested}</span>
            </div>
          </div>
        `;

        const checkbox = td.querySelector('.gv-cell-check');
        checkbox.addEventListener('click', (e) => {
          e.stopPropagation();
          cell.selected = checkbox.checked;
          saveState();
          td.classList.toggle('is-selected', cell.selected);
          updateBatchBar();
        });

        td.addEventListener('click', () => openDrawer(st.id, ls.id));
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    updateBatchBar();
  }

  function updateBatchBar() {
    const selectedKeys = Object.keys(state.cells).filter(k => state.cells[k].selected);
    const bar = document.getElementById('batch-bar');
    if (!bar) return;
    bar.hidden = selectedKeys.length === 0;
    document.getElementById('batch-count').textContent = String(selectedKeys.length);
    document.getElementById('batch-btn-count').textContent = String(selectedKeys.length);
  }

  /* ---------- Ngăn kéo chấm bài (Drawer) ---------- */
  function openDrawer(studentId, lessonId) {
    const st = state.students.find(s => s.id === studentId);
    const ls = LESSONS.find(l => l.id === lessonId);
    if (!st || !ls) return;

    const key = `${st.id}_${ls.id}`;
    activeDrawerKey = key;
    const cell = state.cells[key];
    const coreDone = cell.coreFlags.filter(Boolean).length;
    cell.suggested = computeSuggestedGrade(coreDone, 4);

    document.querySelectorAll('.gv-cell.is-editing').forEach(el => el.classList.remove('is-editing'));
    const activeCell = document.getElementById(`cell-${key}`);
    if (activeCell) activeCell.classList.add('is-editing');

    // Đầu ngăn kéo
    document.getElementById('dw-avatar').innerHTML = animalSvg(st.id);
    document.getElementById('dw-student-name').textContent = st.nickname + (st.hasConsent && st.fullName ? ` (${st.fullName})` : '');
    document.getElementById('dw-animal-tag').textContent = st.animal;
    document.getElementById('dw-consent-badge').hidden = st.hasConsent;
    document.getElementById('dw-lesson-title').textContent = `${ls.title} · Tuần ${ls.week}`;

    renderDrawerMissions(st, ls, cell);
    renderDrawerProgramOrProject(st, ls, cell);
    updateDrawerSuggestionUI(cell);

    tempDrawerGrade = cell.teacherGrade || cell.suggested;
    updateDrawerGradeButtons(cell);

    // Xử lý chép nhóm nếu là cột Dự án (F-06 bước 4)
    const groupApplyWrap = document.getElementById('dw-group-apply-wrap');
    const grp = state.groups.find(g => g.id === st.groupId);
    if (ls.isProject && grp) {
      const members = state.students.filter(m => m.groupId === grp.id);
      groupApplyWrap.hidden = false;
      document.getElementById('dw-apply-group-text').textContent =
        `Chấm cả ${grp.name} (${members.length} thành viên — nguồn: chép từ nhóm, F-06.4)`;
    } else {
      groupApplyWrap.hidden = true;
    }

    // Ô nhận xét & khoá BR-DY-02
    const commentEl = document.getElementById('dw-comment');
    const lockAlert = document.getElementById('dw-consent-lock');
    const quickChips = document.getElementById('dw-quick-comments');

    if (!st.hasConsent) {
      commentEl.disabled = true;
      commentEl.value = '';
      commentEl.placeholder = 'Chờ phụ huynh đồng ý (BR-DY-02)';
      lockAlert.hidden = false;
      quickChips.hidden = true;
    } else {
      commentEl.disabled = false;
      commentEl.placeholder = 'Ghi nhận xét khích lệ hoặc góp ý cho em...';
      commentEl.value = cell.teacherComment || '';
      lockAlert.hidden = true;
      quickChips.hidden = false;
    }
    updateCommentCounter();

    document.getElementById('drawer-backdrop').hidden = false;
    document.getElementById('grading-drawer').hidden = false;
  }

  function renderDrawerMissions(st, ls, cell) {
    const coreWrap = document.getElementById('dw-core-missions');
    const advWrap = document.getElementById('dw-adv-missions');
    coreWrap.replaceChildren();
    advWrap.replaceChildren();

    ls.coreMissions.forEach((mTitle, idx) => {
      const isDone = Boolean(cell.coreFlags[idx]);
      const row = document.createElement('div');
      row.className = 'gv-mission-row';
      row.innerHTML = `
        <div class="gv-mission-left">
          <span class="gv-m-dot ${isDone ? 'is-done' : 'is-todo'}">${isDone ? '✓' : '–'}</span>
          <span style="${isDone ? 'font-weight:600;' : 'color:var(--muted);'}">${mTitle}</span>
        </div>
        <button type="button" class="gv-m-toggle">${isDone ? 'Gỡ (BR-BL-03)' : 'Đánh dấu xong'}</button>
      `;
      row.querySelector('.gv-m-toggle').addEventListener('click', () => {
        cell.coreFlags[idx] = !cell.coreFlags[idx];
        const newCoreDone = cell.coreFlags.filter(Boolean).length;
        cell.suggested = computeSuggestedGrade(newCoreDone, 4);
        saveState();
        renderDrawerMissions(st, ls, cell);
        updateDrawerSuggestionUI(cell);
        updateDrawerGradeButtons(cell);
        renderMatrix();
        showToast(`Đã cập nhật nhiệm vụ cơ bản NV${idx + 1} của ${st.nickname} → Mức gợi ý: ${cell.suggested}`);
      });
      coreWrap.appendChild(row);
    });

    ls.advMissions.forEach((mTitle, idx) => {
      const isDone = Boolean(cell.advFlags[idx]);
      const row = document.createElement('div');
      row.className = 'gv-mission-row';
      row.innerHTML = `
        <div class="gv-mission-left">
          <span class="gv-m-dot ${isDone ? 'is-done' : 'is-todo'}">${isDone ? '✓' : '–'}</span>
          <span style="${isDone ? 'font-weight:600;' : 'color:var(--muted);'}">${mTitle}</span>
        </div>
        <button type="button" class="gv-m-toggle">${isDone ? 'Gỡ' : 'Đánh dấu xong'}</button>
      `;
      row.querySelector('.gv-m-toggle').addEventListener('click', () => {
        cell.advFlags[idx] = !cell.advFlags[idx];
        saveState();
        renderDrawerMissions(st, ls, cell);
        renderMatrix();
        showToast(`Đã cập nhật NV5 nâng cao (GD-06: không làm đổi mức gợi ý ${cell.suggested})`);
      });
      advWrap.appendChild(row);
    });
  }

  function renderDrawerProgramOrProject(st, ls, cell) {
    const heading = document.getElementById('dw-prog-heading');
    const box = document.getElementById('dw-code-box');
    const grp = state.groups.find(g => g.id === st.groupId);

    if (ls.isProject && grp) {
      heading.textContent = '2. Thông tin Nhóm dự án & Sao tham khảo 3 nguồn (BRD 6.4, GD-16)';
      box.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap;">
          <strong>${grp.name} · Vai trò: ${st.role}</strong>
          <span class="pill" data-k="${grp.status === 'submitted' ? 'ok' : 'warn'}">${grp.status === 'submitted' ? 'Đã nộp poster' : 'Đang làm'}</span>
        </div>
        <div style="font-size:12.5px; color:#cbd5e1;">Đề tài: ${grp.topic}</div>
        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:4px; background:#0f1820; padding:8px 10px; border-radius:8px; font-size:12px;">
          <div><span style="color:#94a3b8;">Bạn trong lớp:</span><br><strong>${grp.starsPeer} / 3,0 sao</strong></div>
          <div><span style="color:#94a3b8;">Khách QR:</span><br><strong>${grp.starsGuest} / 3,0 sao</strong></div>
          <div><span style="color:#94a3b8;">Giáo viên:</span><br><strong>${grp.starsTeacher}</strong></div>
        </div>
      `;
      return;
    }

    heading.textContent = '2. Chương trình khối lệnh (ZMrobo ngang) & Gói sáng tạo';
    const hasAdv = cell.advFlags[0];
    box.innerHTML = `
      <div class="gv-block-chain">
        <span class="gv-block-pill" data-b="start">Bắt đầu</span>
        <span class="gv-block-pill" data-b="ctrl">Bắt đầu lặp</span>
        <span class="gv-block-pill" data-b="motor">Motor Power 4</span>
        ${hasAdv ? '<span class="gv-block-pill" data-b="sensor">Chờ vật cản</span>' : '<span class="gv-block-pill" data-b="melody">Melody B</span>'}
        <span class="gv-block-pill" data-b="motor">Dừng M1</span>
        ${hasAdv ? '<span class="gv-block-pill" data-b="wait">Đợi đường trống</span>' : '<span class="gv-block-pill" data-b="wait">Đợi 3s</span>'}
        <span class="gv-block-pill" data-b="ctrl">Lặp lại</span>
      </div>
      <div style="display:flex; justify-content:space-between; gap:8px; flex-wrap:wrap; font-size:12px; color:#9fb2c4;">
        <span>Gói sáng tạo: <strong style="color:#fff;">${cell.upgradePick}</strong></span>
        <span>Lưu lúc: ${cell.savedAt}</span>
      </div>
    `;
  }

  function updateDrawerSuggestionUI(cell) {
    const coreDone = cell.coreFlags.filter(Boolean).length;
    const s = cell.suggested;
    const pill = document.getElementById('dw-suggest-pill');
    pill.setAttribute('data-g', s);
    pill.textContent = `GỢI Ý: ${s}`;

    document.getElementById('dw-suggest-label').textContent = `Máy gợi ý: ${s} (${gradeFullName(s)})`;
    document.getElementById('dw-suggest-math').textContent =
      `C = 4 nhiệm vụ cơ bản, em đã xong X = ${coreDone} (Ngưỡng ⌈C/2⌉ = 2 → ${s}).`;
  }

  function updateDrawerGradeButtons(cell) {
    document.querySelectorAll('.gv-grade-btn').forEach((btn) => {
      const g = btn.getAttribute('data-grade');
      btn.classList.toggle('is-active', g === tempDrawerGrade);
    });

    const warnBox = document.getElementById('dw-warn-diff');
    if (cell && tempDrawerGrade && tempDrawerGrade !== cell.suggested) {
      warnBox.hidden = false;
      document.getElementById('dw-diff-expected').textContent = cell.suggested;
    } else {
      warnBox.hidden = true;
    }
  }

  function updateCommentCounter() {
    const commentEl = document.getElementById('dw-comment');
    document.getElementById('dw-char-count').textContent = `${commentEl.value.length} / 500`;
  }

  function closeDrawer() {
    document.getElementById('drawer-backdrop').hidden = true;
    document.getElementById('grading-drawer').hidden = true;
    document.querySelectorAll('.gv-cell.is-editing').forEach(el => el.classList.remove('is-editing'));
    activeDrawerKey = null;
  }

  function saveCurrentDrawerGrade(goNext = false) {
    if (!activeDrawerKey) return;
    const cell = state.cells[activeDrawerKey];
    const st = state.students.find(s => s.id === cell.studentId);
    const ls = LESSONS.find(l => l.id === cell.lessonId);
    if (!cell || !st || !ls) return;

    const chosenGrade = tempDrawerGrade || cell.suggested;
    const rawComment = document.getElementById('dw-comment').value.trim();

    // Kiểm tra nếu đang chấm Dự án và bật "Áp dụng cho cả nhóm" (F-06 bước 4)
    const applyGroup = ls.isProject && st.groupId && document.getElementById('dw-apply-to-group').checked;

    if (applyGroup) {
      const members = state.students.filter(m => m.groupId === st.groupId);
      members.forEach((member) => {
        const mCell = state.cells[`${member.id}_${ls.id}`];
        if (!mCell) return;
        mCell.isGraded = true;
        mCell.teacherGrade = chosenGrade;
        mCell.hasRecentProgress = false;
        mCell.source = 'group_copy';
        mCell.teacherComment = member.hasConsent ? rawComment : '';
      });
      const grp = state.groups.find(g => g.id === st.groupId);
      saveState();
      renderMatrix();
      showToast(`Đã lưu mức [${chosenGrade}] cho cả ${grp ? grp.name : 'nhóm'} (${members.length} học sinh)`);
    } else {
      cell.isGraded = true;
      cell.teacherGrade = chosenGrade;
      cell.hasRecentProgress = false;
      cell.source = 'direct';
      cell.teacherComment = st.hasConsent ? rawComment : '';
      saveState();
      renderMatrix();
      showToast(`Đã lưu mức [${chosenGrade}] cho ${st.nickname} (${ls.shortLabel})`);
    }

    if (goNext) {
      // Tìm học sinh tiếp theo trong cùng bài học
      const idx = state.students.findIndex(s => s.id === st.id);
      const nextSt = state.students[(idx + 1) % state.students.length];
      openDrawer(nextSt.id, ls.id);
    } else {
      closeDrawer();
    }
  }

  /* =====================================================================
     MÀN HÌNH S-08: NHÓM DỰ ÁN (KÉO THẢ HOẶC CHẠM ĐỂ XẾP EM VÀO NHÓM)
     ===================================================================== */
  function moveStudentToGroup(studentId, targetGroupId) {
    const st = state.students.find(s => s.id === Number(studentId));
    if (!st) return;

    const normalizedGroup = targetGroupId === 'NONE' ? '' : targetGroupId;
    const oldGroup = state.groups.find(g => g.id === st.groupId);
    const newGroup = state.groups.find(g => g.id === normalizedGroup);

    // BR-DA-01: Một học sinh chỉ thuộc tối đa 1 nhóm trong cùng đợt dự án
    st.groupId = normalizedGroup;
    pickedStudentId = null;
    saveState();
    renderGroupsView();

    if (newGroup) {
      showToast(`Đã xếp ${st.nickname} (${st.animal}) vào ${newGroup.name}${oldGroup && oldGroup.id !== newGroup.id ? ' (tự gỡ khỏi ' + oldGroup.name + ' theo BR-DA-01)' : ''}`);
    } else {
      showToast(`Đã đưa ${st.nickname} về khay Chưa xếp nhóm`);
    }
  }

  function renderStudentChipS08(st, inGroup) {
    const item = document.createElement('div');
    item.className = 's08-student-chip' + (pickedStudentId === st.id ? ' is-picked' : '');
    item.draggable = true;
    item.dataset.studentId = String(st.id);

    const roleSelectHtml = inGroup
      ? `<select class="s08-role-select" aria-label="Vai trò của ${st.nickname}">
           ${ROLES.map(r => `<option value="${r}" ${st.role === r ? 'selected' : ''}>${r}</option>`).join('')}
         </select>
         <button type="button" class="s08-remove-btn" title="Đưa về khay chưa xếp nhóm">Gỡ</button>`
      : `<span class="pill" data-k="info">Chạm hoặc kéo</span>`;

    item.innerHTML = `
      <div class="st-identity" style="cursor:pointer;">
        <span class="st-avatar-badge" aria-hidden="true">${animalSvg(st.id)}</span>
        <div class="st-name-wrap">
          <span class="st-name">${st.nickname}</span>
          <span class="st-sub">${st.animal}${!st.hasConsent ? ' · Chờ PH' : ''}</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:6px;">
        ${roleSelectHtml}
      </div>
    `;

    // Kéo thả HTML5
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', String(st.id));
      e.dataTransfer.effectAllowed = 'move';
    });

    // Chạm để chọn học sinh (hỗ trợ màn cảm ứng / chuột không cần kéo)
    item.querySelector('.st-identity').addEventListener('click', () => {
      pickedStudentId = pickedStudentId === st.id ? null : st.id;
      renderGroupsView();
    });

    if (inGroup) {
      const sel = item.querySelector('.s08-role-select');
      sel.addEventListener('change', (e) => {
        e.stopPropagation();
        st.role = sel.value;
        saveState();
        showToast(`Đã đổi vai trò của ${st.nickname} thành "${st.role}"`);
      });

      const removeBtn = item.querySelector('.s08-remove-btn');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveStudentToGroup(st.id, 'NONE');
      });
    }

    return item;
  }

  function bindDropZone(zoneEl, targetGroupId) {
    zoneEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      zoneEl.classList.add('is-drop-target');
    });
    zoneEl.addEventListener('dragleave', () => {
      zoneEl.classList.remove('is-drop-target');
    });
    zoneEl.addEventListener('drop', (e) => {
      e.preventDefault();
      zoneEl.classList.remove('is-drop-target');
      const studentId = Number(e.dataTransfer.getData('text/plain'));
      if (studentId) moveStudentToGroup(studentId, targetGroupId);
    });
  }

  function renderGroupsView() {
    const unassignedWrap = document.getElementById('unassigned-list');
    const groupsGrid = document.getElementById('groups-grid');
    const touchBanner = document.getElementById('s08-touch-banner');
    if (!unassignedWrap || !groupsGrid) return;

    // Thanh báo khi đang chạm chọn 1 học sinh
    if (pickedStudentId) {
      const pickedSt = state.students.find(s => s.id === pickedStudentId);
      touchBanner.hidden = !pickedSt;
      if (pickedSt) {
        document.getElementById('s08-picked-name').textContent = `${pickedSt.nickname} (${pickedSt.animal})`;
      }
    } else {
      touchBanner.hidden = true;
    }

    // Học sinh chưa có nhóm
    const unassignedStudents = state.students.filter(s => !s.groupId);
    document.getElementById('unassigned-count').textContent = String(unassignedStudents.length);
    unassignedWrap.replaceChildren();

    if (unassignedStudents.length === 0) {
      const emptyNote = document.createElement('p');
      emptyNote.className = 'hint';
      emptyNote.style.padding = '8px';
      emptyNote.textContent = 'Tất cả 28 học sinh Lớp 1A2 đã được xếp vào nhóm. Kéo học sinh vào đây nếu muốn tách nhóm.';
      unassignedWrap.appendChild(emptyNote);
    } else {
      unassignedStudents.forEach((st) => {
        unassignedWrap.appendChild(renderStudentChipS08(st, false));
      });
    }
    bindDropZone(unassignedWrap, 'NONE');

    // Render các thẻ nhóm
    groupsGrid.replaceChildren();
    state.groups.forEach((grp) => {
      const members = state.students.filter(s => s.groupId === grp.id);
      const card = document.createElement('article');
      card.className = 's08-group-card';
      card.dataset.groupId = grp.id;

      const countTone = members.length === 4 ? 'ok' : (members.length === 0 ? 'bad' : 'warn');
      const statusText = grp.status === 'submitted' ? 'Đã nộp poster' : 'Đang làm';

      card.innerHTML = `
        <div class="s08-group-head">
          <div>
            <h3 class="s08-group-title">${grp.name}</h3>
            <div class="s08-group-meta">${grp.topic}</div>
          </div>
          <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap;">
            <span class="pill" data-k="${countTone}">${members.length}/4 em</span>
            <button type="button" class="gv-m-toggle btn-toggle-group-status" title="Đổi trạng thái nộp poster">${statusText}</button>
          </div>
        </div>
        <div class="s08-member-rows"></div>
        <div class="row" style="border-top:1px solid var(--line); padding-top:8px;">
          <button type="button" class="link-btn btn-rename-group">Đổi tên nhóm</button>
          <button type="button" class="gv-m-toggle btn-grade-group">Chấm cả nhóm (F-06.4)</button>
        </div>
      `;

      const rowsWrap = card.querySelector('.s08-member-rows');
      if (members.length === 0) {
        const p = document.createElement('p');
        p.className = 'hint';
        p.textContent = 'Nhóm chưa có thành viên. Kéo hoặc chạm học sinh để thêm vào.';
        rowsWrap.appendChild(p);
      } else {
        members.forEach((m) => {
          rowsWrap.appendChild(renderStudentChipS08(m, true));
        });
      }

      // Nếu đang chọn học sinh bằng thao tác chạm, hiện nút chuyển vào nhóm này
      if (pickedStudentId) {
        const pickedSt = state.students.find(s => s.id === pickedStudentId);
        if (pickedSt && pickedSt.groupId !== grp.id) {
          const assignBtn = document.createElement('button');
          assignBtn.type = 'button';
          assignBtn.className = 's08-assign-here-btn';
          assignBtn.textContent = `+ Chuyển ${pickedSt.nickname} (${pickedSt.animal}) vào ${grp.name}`;
          assignBtn.addEventListener('click', () => moveStudentToGroup(pickedSt.id, grp.id));
          card.insertBefore(assignBtn, card.lastElementChild);
        }
      }

      // Đổi trạng thái Đang làm / Đã nộp poster
      card.querySelector('.btn-toggle-group-status').addEventListener('click', () => {
        grp.status = grp.status === 'submitted' ? 'working' : 'submitted';
        saveState();
        renderGroupsView();
        showToast(`Đã chuyển ${grp.name} sang trạng thái "${grp.status === 'submitted' ? 'Đã nộp poster' : 'Đang làm'}"`);
      });

      // Đổi tên nhóm
      card.querySelector('.btn-rename-group').addEventListener('click', () => {
        const nextName = window.prompt('Nhập tên mới cho nhóm dự án:', grp.name);
        if (nextName && nextName.trim()) {
          grp.name = nextName.trim().slice(0, 40);
          saveState();
          renderGroupsView();
          showToast(`Đã đổi tên nhóm thành "${grp.name}"`);
        }
      });

      // Chấm cả nhóm
      card.querySelector('.btn-grade-group').addEventListener('click', () => {
        if (members.length === 0) {
          showToast('Nhóm chưa có thành viên nào để chấm.');
          return;
        }
        openDrawer(members[0].id, 'DA1');
      });

      bindDropZone(card, grp.id);
      groupsGrid.appendChild(card);
    });
  }

  /* =====================================================================
     MÀN HÌNH S-13: XUẤT BẢNG TÍNH CSV (CÓ BOM UTF-8 CHO EXCEL)
     ===================================================================== */
  function buildCsvMatrixData(mode) {
    let headers = [];
    const rows = [];

    if (mode === 'grades') {
      headers = [
        'STT', 'Tên gọi ngắn', 'Con vật', 'Đồng ý PH (GD-14)', 'Nhóm dự án',
        ...LESSONS.map(l => `${l.shortLabel} (Tuần ${l.week})`)
      ];
      state.students.forEach((st, idx) => {
        const grp = state.groups.find(g => g.id === st.groupId);
        const grades = LESSONS.map((ls) => {
          const c = state.cells[`${st.id}_${ls.id}`];
          return c && c.isGraded && c.teacherGrade ? c.teacherGrade : `Chưa chấm (Gợi ý ${c ? c.suggested : 'HT'})`;
        });
        rows.push([
          String(idx + 1),
          st.nickname,
          st.animal,
          st.hasConsent ? 'Đã đồng ý' : 'Chờ PH đồng ý',
          grp ? grp.name : 'Chưa xếp nhóm',
          ...grades
        ]);
      });
    } else if (mode === 'comments') {
      headers = [
        'STT', 'Tên gọi ngắn', 'Họ tên đầy đủ (GD-14)', 'Con vật', 'Đồng ý PH',
        'Mức Bài 9', 'Nhận xét Bài 9 (BR-DY-02)', 'Mức Dự án HK I', 'Nhận xét Dự án HK I'
      ];
      state.students.forEach((st, idx) => {
        const b9 = state.cells[`${st.id}_B9`];
        const da = state.cells[`${st.id}_DA1`];
        rows.push([
          String(idx + 1),
          st.nickname,
          st.hasConsent ? st.fullName : '',
          st.animal,
          st.hasConsent ? 'Đã đồng ý' : 'Chờ PH đồng ý (Khoá nhận xét)',
          b9 && b9.isGraded ? b9.teacherGrade : 'Chưa chấm',
          st.hasConsent && b9 ? b9.teacherComment : '',
          da && da.isGraded ? da.teacherGrade : 'Chưa chấm',
          st.hasConsent && da ? da.teacherComment : ''
        ]);
      });
    } else {
      // Chế độ đầy đủ (mặc định)
      headers = [
        'STT', 'Tên gọi ngắn', 'Họ tên đầy đủ (GD-14)', 'Con vật', 'Đồng ý PH', 'Nhóm dự án', 'Vai trò nhóm',
        'Bài 9: NV cơ bản (C=4)', 'Bài 9: NV5 nâng cao', 'Bài 9: Mức gợi ý', 'Bài 9: Mức chính thức',
        'Dự án HK I: Mức', 'Nhận xét của giáo viên (Bài 9)'
      ];
      state.students.forEach((st, idx) => {
        const grp = state.groups.find(g => g.id === st.groupId);
        const b9 = state.cells[`${st.id}_B9`];
        const da = state.cells[`${st.id}_DA1`];
        const coreDone = b9 ? b9.coreFlags.filter(Boolean).length : 0;
        const advDone = b9 && b9.advFlags[0] ? 'Đã xong NV5' : 'Chưa làm';
        rows.push([
          String(idx + 1),
          st.nickname,
          st.hasConsent ? st.fullName : '',
          st.animal,
          st.hasConsent ? 'Đã đồng ý' : 'Chờ PH đồng ý',
          grp ? grp.name : 'Chưa xếp nhóm',
          st.role,
          `${coreDone}/4`,
          advDone,
          b9 ? b9.suggested : 'HT',
          b9 && b9.isGraded ? b9.teacherGrade : 'Chưa chấm',
          da && da.isGraded ? da.teacherGrade : 'Chưa chấm',
          st.hasConsent && b9 ? b9.teacherComment : ''
        ]);
      });
    }

    return { headers, rows };
  }

  function escapeCsvCell(val) {
    const str = String(val ?? '');
    if (/[",\r\n]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function renderS13Preview() {
    const modeEl = document.getElementById('s13-mode');
    const thead = document.getElementById('s13-preview-thead');
    const tbody = document.getElementById('s13-preview-tbody');
    if (!modeEl || !thead || !tbody) return;

    const { headers, rows } = buildCsvMatrixData(modeEl.value);

    const trHead = document.createElement('tr');
    headers.forEach((h) => {
      const th = document.createElement('th');
      th.textContent = h;
      trHead.appendChild(th);
    });
    thead.replaceChildren(trHead);

    tbody.replaceChildren();
    rows.forEach((r) => {
      const tr = document.createElement('tr');
      r.forEach((cellVal) => {
        const td = document.createElement('td');
        td.textContent = cellVal || '—';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function downloadCsvFile() {
    const modeEl = document.getElementById('s13-mode');
    const mode = modeEl ? modeEl.value : 'full';
    const { headers, rows } = buildCsvMatrixData(mode);

    const csvLines = [
      headers.map(escapeCsvCell).join(','),
      ...rows.map(r => r.map(escapeCsvCell).join(','))
    ];
    // Đính kèm BOM UTF-8 (\uFEFF) ở đầu file để Excel đọc đúng tiếng Việt
    const csvWithBom = '\uFEFF' + csvLines.join('\r\n');
    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
    const fileName = `happy-steam-lop-1A2-HK1-${mode}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);

    const timestamp = new Date().toLocaleTimeString('vi-VN');
    state.lastExport = { fileName, rows: rows.length, bytes: blob.size, timestamp };
    saveState();

    const statusEl = document.getElementById('s13-export-status');
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.className = 'gv-alert is-info';
      statusEl.innerHTML = `Đã tải xuống tệp <strong>${fileName}</strong> (${rows.length} dòng học sinh · ${blob.size} byte · có BOM UTF-8) lúc ${timestamp}.`;
    }
    showToast(`Đã tải xuống file CSV: ${fileName} (UTF-8 BOM)`);
  }

  /* =====================================================================
     KHỞI TẠO SỰ KIỆN TRÊN TRANG
     ===================================================================== */
  function bindEvents() {
    // Chuyển tab S-07 / S-08 / S-13
    document.querySelectorAll('.gv-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    window.addEventListener('hashchange', () => {
      const hash = location.hash.replace('#', '').toLowerCase();
      if (['s07', 's08', 's13'].includes(hash)) {
        switchTab(hash, false);
      }
    });

    // Nút đặt lại dữ liệu mẫu
    document.getElementById('btn-reset-mock').addEventListener('click', () => {
      state = buildDefaultState();
      pickedStudentId = null;
      closeDrawer();
      saveState();
      renderMatrix();
      renderGroupsView();
      renderS13Preview();
      showToast('Đã khôi phục dữ liệu mẫu gốc của Lớp 1A2 (28 học sinh).');
    });

    // Bộ lọc S-07
    const scopeSel = document.getElementById('sel-lesson-scope');
    scopeSel.value = state.lessonScope || 'all';
    scopeSel.addEventListener('change', () => {
      state.lessonScope = scopeSel.value;
      saveState();
      renderMatrix();
    });

    const chkUnfinished = document.getElementById('filter-unfinished');
    chkUnfinished.checked = Boolean(state.filterUnfinished);
    document.getElementById('pill-filter-unfinished').classList.toggle('is-active', chkUnfinished.checked);
    chkUnfinished.addEventListener('change', () => {
      state.filterUnfinished = chkUnfinished.checked;
      document.getElementById('pill-filter-unfinished').classList.toggle('is-active', chkUnfinished.checked);
      saveState();
      renderMatrix();
    });

    const chkUngraded = document.getElementById('filter-ungraded');
    chkUngraded.checked = Boolean(state.filterUngraded);
    document.getElementById('pill-filter-ungraded').classList.toggle('is-active', chkUngraded.checked);
    chkUngraded.addEventListener('change', () => {
      state.filterUngraded = chkUngraded.checked;
      document.getElementById('pill-filter-ungraded').classList.toggle('is-active', chkUngraded.checked);
      saveState();
      renderMatrix();
    });

    const searchInput = document.getElementById('search-student');
    searchInput.value = state.searchQuery || '';
    searchInput.addEventListener('input', () => {
      state.searchQuery = searchInput.value;
      renderMatrix();
    });

    // Chọn nhanh các ô chưa chấm của Bài 9
    document.getElementById('btn-select-b9-ungraded').addEventListener('click', () => {
      let count = 0;
      state.students.forEach((st) => {
        const c = state.cells[`${st.id}_B9`];
        if (c && !c.isGraded) {
          c.selected = true;
          count++;
        }
      });
      saveState();
      renderMatrix();
      showToast(count > 0 ? `Đã chọn ${count} ô chưa chấm của Bài 9.` : 'Tất cả 28 học sinh ở Bài 9 đều đã được chấm!');
    });

    // Chọn tất cả ô chưa chấm trên toàn bảng
    document.getElementById('btn-select-all-ungraded').addEventListener('click', () => {
      let count = 0;
      Object.keys(state.cells).forEach((k) => {
        if (!state.cells[k].isGraded) {
          state.cells[k].selected = true;
          count++;
        }
      });
      saveState();
      renderMatrix();
      showToast(`Đã chọn toàn bộ ${count} ô chưa chấm.`);
    });

    // Chấp nhận mức gợi ý cho các ô đã chọn (F-06 bước 3)
    document.getElementById('btn-batch-accept').addEventListener('click', () => {
      const keys = Object.keys(state.cells).filter(k => state.cells[k].selected);
      if (!keys.length) return;
      keys.forEach((k) => {
        const c = state.cells[k];
        const st = state.students.find(s => s.id === c.studentId);
        const coreDone = c.coreFlags.filter(Boolean).length;
        c.suggested = computeSuggestedGrade(coreDone, 4);
        c.isGraded = true;
        c.teacherGrade = c.suggested;
        c.hasRecentProgress = false;
        c.selected = false;
        if (st && st.hasConsent && !c.teacherComment) {
          c.teacherComment = 'Hoàn thành nhiệm vụ theo đúng mức gợi ý của bài học.';
        }
      });
      saveState();
      renderMatrix();
      showToast(`Đã chấm nhanh ${keys.length} ô theo mức máy gợi ý (BRD 6.2).`);
    });

    // Bỏ chọn
    document.getElementById('btn-batch-clear').addEventListener('click', () => {
      Object.keys(state.cells).forEach((k) => {
        state.cells[k].selected = false;
      });
      saveState();
      renderMatrix();
    });

    // Nút mở nhanh Bài 9 của Nam B.
    document.getElementById('btn-open-sample-b9').addEventListener('click', () => {
      openDrawer(1, 'B9');
    });

    // Nút Xuất CSV trên thanh công cụ S-07 -> tải file CSV thật ngay lập tức
    document.getElementById('btn-quick-csv').addEventListener('click', () => {
      downloadCsvFile();
    });

    // Sự kiện trong Ngăn kéo chấm bài
    document.getElementById('btn-close-drawer').addEventListener('click', closeDrawer);
    document.getElementById('drawer-backdrop').addEventListener('click', closeDrawer);

    document.querySelectorAll('.gv-grade-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        tempDrawerGrade = btn.getAttribute('data-grade');
        const cell = activeDrawerKey ? state.cells[activeDrawerKey] : null;
        updateDrawerGradeButtons(cell);
      });
    });

    document.querySelectorAll('.gv-quick-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const commentEl = document.getElementById('dw-comment');
        if (commentEl.disabled) return;
        const sample = chip.getAttribute('data-sample');
        commentEl.value = commentEl.value ? `${commentEl.value.trim()} ${sample}` : sample;
        updateCommentCounter();
      });
    });

    document.getElementById('dw-comment').addEventListener('input', updateCommentCounter);
    document.getElementById('btn-save-grade').addEventListener('click', () => saveCurrentDrawerGrade(false));
    document.getElementById('btn-save-next').addEventListener('click', () => saveCurrentDrawerGrade(true));

    // Sự kiện màn hình S-08 (Nhóm dự án)
    document.getElementById('btn-cancel-pick').addEventListener('click', () => {
      pickedStudentId = null;
      renderGroupsView();
    });

    document.getElementById('btn-move-to-unassigned').addEventListener('click', () => {
      if (pickedStudentId) moveStudentToGroup(pickedStudentId, 'NONE');
    });

    document.getElementById('btn-demo-unassign').addEventListener('click', () => {
      // Tách 2 em cuối về khay chờ để thử kéo thả / chạm
      const s27 = state.students.find(s => s.id === 27);
      const s28 = state.students.find(s => s.id === 28);
      if (s27) s27.groupId = '';
      if (s28) s28.groupId = '';
      pickedStudentId = null;
      saveState();
      renderGroupsView();
      showToast('Đã tách 2 em (Trâm, Vũ) ra khay Chưa xếp nhóm để thầy cô thử kéo thả hoặc chạm.');
    });

    document.getElementById('btn-auto-group').addEventListener('click', () => {
      state.students.forEach((st, idx) => {
        const grpIndex = Math.floor(idx / 4);
        if (state.groups[grpIndex]) {
          st.groupId = state.groups[grpIndex].id;
          st.role = ROLES[idx % ROLES.length];
        }
      });
      pickedStudentId = null;
      saveState();
      renderGroupsView();
      showToast('Đã xếp đều 28 học sinh vào 7 nhóm dự án (mỗi nhóm đúng 4 em).');
    });

    document.getElementById('btn-add-group').addEventListener('click', () => {
      const nextNum = state.groups.length + 1;
      const name = window.prompt('Tên nhóm dự án mới:', `Nhóm Sáng Tạo ${nextNum}`);
      if (!name || !name.trim()) return;
      const newGrp = {
        id: 'G' + Date.now(),
        name: name.trim().slice(0, 40),
        topic: 'Giải pháp tiết kiệm và lọc nước sinh hoạt',
        status: 'working',
        starsPeer: 'Chưa có',
        starsGuest: 'Chưa có',
        starsTeacher: 'Chưa có'
      };
      state.groups.push(newGrp);
      saveState();
      renderGroupsView();
      showToast(`Đã tạo "${newGrp.name}". Hãy kéo hoặc chạm học sinh để xếp vào nhóm.`);
    });

    // Sự kiện màn hình S-13 (Xuất bảng tính CSV)
    document.getElementById('s13-mode').addEventListener('change', renderS13Preview);
    document.getElementById('s13-term').addEventListener('change', renderS13Preview);
    document.getElementById('btn-download-csv').addEventListener('click', downloadCsvFile);
  }

  /* ---------- Khởi chạy ---------- */
  loadState();
  bindEvents();
  updateHeaderKPIs();

  const initialHash = location.hash.replace('#', '').toLowerCase();
  if (['s07', 's08', 's13'].includes(initialHash)) {
    switchTab(initialHash, false);
  } else {
    switchTab(state.activeTab || 's07', false);
  }
})();
