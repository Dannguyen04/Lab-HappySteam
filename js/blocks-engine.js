// js/blocks-engine.js - ZMrobo Visual Block Programming Engine
(function() {
  'use strict';

  const SVG_ICONS = {
    start: `<svg viewBox="0 0 40 40"><path d="M12 34V6" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/><path d="M13 7h17l-4.5 6 4.5 6H13z" fill="currentColor"/></svg>`,
    repeatStart: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 33c-6 0-8-4-8-9s3-9 9-9h17"/><path d="M26 9l6 6-6 6"/><circle cx="31" cy="4.5" r="2.4" stroke-width="2.2"/><circle cx="36" cy="4.5" r="2.4" stroke-width="2.2"/></svg>`,
    repeatEnd: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 10h17c6 0 9 4 9 9s-3 9-9 9H10"/><path d="M15 22l-6 6 6 6"/><circle cx="9" cy="35.5" r="2.4" stroke-width="2.2"/><circle cx="14" cy="35.5" r="2.4" stroke-width="2.2"/></svg>`,
    motorHighCW: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path d="M31 11a14 14 0 1 0 3 12"/><path d="M33 4v8h-8" stroke-linejoin="round"/><circle cx="20" cy="21" r="7" fill="#fff" stroke="none"/><g fill="#1E9BD7" stroke="none"><circle cx="20" cy="17" r="1.6"/><circle cx="20" cy="25" r="1.6"/><circle cx="16" cy="21" r="1.6"/><circle cx="24" cy="21" r="1.6"/></g></svg>`,
    motorHighCCW: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><path d="M9 11a14 14 0 1 1-3 12"/><path d="M7 4v8h8" stroke-linejoin="round"/><circle cx="20" cy="21" r="7" fill="#fff" stroke="none"/><g fill="#1E9BD7" stroke="none"><circle cx="20" cy="17" r="1.6"/><circle cx="20" cy="25" r="1.6"/><circle cx="16" cy="21" r="1.6"/><circle cx="24" cy="21" r="1.6"/></g></svg>`,
    motorLow: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M30 13a13 13 0 1 0 2 11"/><path d="M31 7v7h-7" stroke-linejoin="round"/><circle cx="20" cy="21" r="6" fill="#fff" stroke="none"/></svg>`,
    // Quay vừa: vòng cung dài hơn Low, ngắn hơn High
    motorMedium: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3.3" stroke-linecap="round"><path d="M30 12a13.5 13.5 0 1 0 2.5 11.5"/><path d="M32 5.5v7.5h-7.5" stroke-linejoin="round"/><circle cx="20" cy="21" r="6.5" fill="#fff" stroke="none"/><g fill="#1E9BD7" stroke="none"><circle cx="20" cy="18" r="1.4"/><circle cx="20" cy="24" r="1.4"/></g></svg>`,
    motorStop: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><circle cx="20" cy="20" r="12"/><path d="M14 20h12" stroke-width="4"/></svg>`,
    melody: (tune) => `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3"><circle cx="21" cy="22" r="13"/><text x="21" y="28.5" text-anchor="middle" fill="#fff" stroke="none" font-family="'Chakra Petch', sans-serif" font-weight="700" font-size="18">${tune}</text><path d="M5 4v8" stroke-width="2.2"/><circle cx="3.6" cy="12" r="2.2" fill="#fff" stroke="none"/></svg>`,
    wait: (s) => `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2.5"><path d="M12 8h16M12 32h16M15 8v4c0 3 5 6 5 8s-5 5-5 8v4M25 8v4c0 3-5 6-5 8s5 5 5 8v4" stroke-linecap="round"/><circle cx="20" cy="25" r="2.2" fill="#fff"/></svg>`,
    display: `<svg viewBox="0 0 40 40" fill="#fff"><rect x="9" y="9" width="5" height="5" rx="1.5"/><rect x="17.5" y="9" width="5" height="5" rx="1.5"/><rect x="26" y="9" width="5" height="5" rx="1.5"/><rect x="9" y="17.5" width="5" height="5" rx="1.5"/><rect x="17.5" y="17.5" width="5" height="5" rx="1.5"/><rect x="26" y="17.5" width="5" height="5" rx="1.5"/><rect x="9" y="26" width="5" height="5" rx="1.5"/><rect x="17.5" y="26" width="5" height="5" rx="1.5"/><rect x="26" y="26" width="5" height="5" rx="1.5"/></svg>`,
    motorReverse: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15h18l-5-5M30 25H12l5 5"/></svg>`,
    obstacle: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><rect x="8" y="15" width="24" height="14" rx="3"/><circle cx="15" cy="22" r="2.8" fill="#fff"/><circle cx="25" cy="22" r="2.8" fill="#fff"/><path d="M14 10a8 8 0 0 1 12 0"/></svg>`,
    trafficLight: color => `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="11" y="2" width="18" height="36" rx="7" fill="#27364b" stroke="#fff" stroke-width="1.5"/><circle cx="20" cy="9" r="5" fill="${color === 'red' ? '#ff5454' : '#708091'}"/><circle cx="20" cy="20" r="5" fill="${color === 'yellow' ? '#ffdd55' : '#708091'}"/><circle cx="20" cy="31" r="5" fill="${color === 'green' ? '#45e59a' : '#708091'}"/></svg>`,
    colorSensor: color => `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="8" width="30" height="24" rx="6" fill="#283b49" stroke="#fff" stroke-width="2"/><circle cx="20" cy="20" r="9" fill="${color === 'red' ? '#ff6268' : '#519efc'}" stroke="#fff" stroke-width="2"/><circle cx="20" cy="20" r="3" fill="#fff"/></svg>`,
    // Motor Power: đồng hồ tốc độ, số mức 1–8 ở giữa
    motorPower: p => `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M7 27a14 14 0 1 1 26 0"/><path d="M20 27l${(-7 + p * 1.75).toFixed(1)} -9" stroke-width="3.5"/><text x="20" y="38" text-anchor="middle" fill="#fff" stroke="none" font-family="Chakra Petch, sans-serif" font-weight="800" font-size="11">${p}</text></svg>`,
    // Nâng cao: đợi đường trống (đồng hồ cát + mắt cảm biến), Nếu thấy vật lạ (hình thoi ?), Hết Nếu, chụp ảnh gửi về
    waitClear: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h12M6 34h12M8 6v4c0 3 4 6 4 10s-4 7-4 10v4M16 6v4c0 3-4 6-4 10s4 7 4 10v4"/><rect x="21" y="14" width="15" height="12" rx="3"/><circle cx="25.5" cy="20" r="1.8" fill="#fff"/><circle cx="31.5" cy="20" r="1.8" fill="#fff"/></svg>`,
    ifSee: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"><path d="M20 4l16 16-16 16L4 20z"/><text x="20" y="26.5" text-anchor="middle" fill="#fff" stroke="none" font-family="Chakra Petch, sans-serif" font-weight="800" font-size="17">?</text></svg>`,
    ifEnd: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6l-6 14 6 14"/><path d="M18 20h16"/><path d="M28 14l6 6-6 6"/></svg>`,
    photo: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"><path d="M5 13h7l3-5h10l3 5h7v19H5z"/><circle cx="20" cy="22" r="6"/><path d="M31 4l4-3M33 8h5" stroke-linecap="round" stroke-width="2.4"/></svg>`,
    // Xe hai động cơ (KHGD Lớp 1 Bài 13): Move Forward – mũi tên thẳng; Turn Left – xe nghiêng, mũi tên cong sang trái
    moveForward: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="10" y="4" width="20" height="16" rx="4"/><path d="M20 36V24M14 29l6-6 6 6"/></svg>`,
    turnLeft: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="14" width="18" height="16" rx="4" transform="rotate(-25 23 22)"/><path d="M10 18c0-8 6-12 12-12M6 10l4 8 7-4"/></svg>`,
    touch: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><rect x="9" y="24" width="22" height="7" rx="2" fill="#fff"/><path d="M20 7v13M14 15l6 6 6-6"/></svg>`,
    release: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><rect x="9" y="26" width="22" height="7" rx="2" fill="#fff"/><path d="M20 22V6M14 12l6-6 6 6"/></svg>`
  };

  const BLOCK_TEMPLATES = {
    start: { type: 'start', name: 'Start', color: 'start', label: 'Bắt đầu' },
    repeatStart: { type: 'repeatStart', name: 'Repeat Start', color: 'control', label: 'Bắt đầu lặp' },
    repeatEnd: { type: 'repeatEnd', name: 'Repeat End', color: 'control', label: 'Lặp lại' },
    melodyA: { type: 'melody', name: 'Melody A', tune: 'A', color: 'melody', label: 'Âm thanh A' },
    melodyB: { type: 'melody', name: 'Melody B', tune: 'B', color: 'melody', label: 'Âm thanh B' },
    noteDo: { type: 'melody', name: 'Nốt Do', tune: 'Do', color: 'melody', label: 'Phát nốt Do' },
    noteMi: { type: 'melody', name: 'Nốt Mi', tune: 'Mi', color: 'melody', label: 'Phát nốt Mi' },
    highSpeed: { type: 'motor', name: 'High Speed', speed: 'high', dir: 'cw', color: 'motor', label: 'Quay nhanh' },
    highSpeedCCW: { type: 'motor', name: 'High Speed ngược', speed: 'high', dir: 'ccw', color: 'motor', label: 'Quay nhanh ngược chiều' },
    highSpeedM1: { type: 'motor', name: 'M1 High Speed', speed: 'high', dir: 'cw', port: 'M1', color: 'motor', label: 'M1 quay nhanh thuận' },
    highSpeedCCWM1: { type: 'motor', name: 'M1 High Speed ngược', speed: 'high', dir: 'ccw', port: 'M1', color: 'motor', label: 'M1 quay nhanh ngược' },
    lowSpeed: { type: 'motor', name: 'Low Speed', speed: 'low', dir: 'cw', color: 'motor', label: 'Quay chậm' },
    mediumSpeed: { type: 'motor', name: 'Medium Speed', speed: 'medium', dir: 'cw', color: 'motor', label: 'Quay vừa' },
    motorPower: { type: 'motor_power', name: 'Motor Power', power: 8, color: 'motor', label: 'Tốc độ động cơ' },
    motorReverse: { type: 'motor_reverse', name: 'Motor This Way', color: 'motor', label: 'Đổi chiều quay' },
    motorStop: { type: 'stop', name: 'Stop', color: 'motor', label: 'Dừng motor' },
    wait: { type: 'wait', name: 'Wait', duration: 3, color: 'wait', label: 'Chờ' },
    display: { type: 'display', name: 'Display', icon: 'smile', color: 'display', label: 'Màn hình' },
    moveForward: { type: 'drive', name: 'Move Forward', move: 'forward', speed: 'high', color: 'motor', label: 'Tiến thẳng' },
    turnLeft: { type: 'drive', name: 'Turn Left', move: 'left', speed: 'high', color: 'motor', label: 'Rẽ trái' },
    displayHeart: { type: 'display', name: 'Trái tim', icon: 'heart', color: 'display', label: 'Hiện trái tim' },
    displaySmile: { type: 'display', name: 'Mặt cười', icon: 'smile', color: 'display', label: 'Hiện mặt cười' },
    displayWink: { type: 'display', name: 'Nháy mắt', icon: 'wink', color: 'display', label: 'Hiện mặt nháy mắt' },
    displaySad: { type: 'display', name: 'Mặt buồn', icon: 'sad', color: 'display', label: 'Hiện mặt buồn' },
    displayGO: { type: 'display', name: 'GO', icon: 'go', color: 'display', label: 'Hiện chữ GO' },
    displayArrowDown: { type: 'display', name: 'Mũi tên xuống', icon: 'down', color: 'display', label: 'Hiện mũi tên xuống' },
    obstacle: { type: 'sensor_obstacle', name: 'Chờ vật cản', color: 'sensor', label: 'Chờ vật cản' },
    sensorGreen: { type: 'sensor_green', name: 'Wait For Green', color: 'sensor', label: '🟢 Chờ đèn xanh' },
    sensorYellow: { type: 'sensor_yellow', name: 'Wait For Yellow', color: 'sensor', label: '🟡 Chờ đèn vàng' },
    sensorRed: { type: 'sensor_red', name: 'Wait For Red', color: 'sensor', label: '🔴 Chờ đèn đỏ' },
    sensorColorRed: { type: 'sensor_color_red', name: 'Wait For Red', color: 'sensor', label: '🔴 Chờ vật màu đỏ' },
    sensorColorBlue: { type: 'sensor_color_blue', name: 'Wait For Blue', color: 'sensor', label: '🔵 Chờ vật màu xanh' },
    // Khối động cơ có cổng (Lớp 3 Bài 8 – hai động cơ M1, M2): chạm đổi chậm → nhanh → chậm ngược → nhanh ngược
    m1Motor: { type: 'motor', name: 'Low Speed', speed: 'low', dir: 'cw', port: 'M1', color: 'motor', label: 'Động cơ M1' },
    m2Motor: { type: 'motor', name: 'Low Speed', speed: 'low', dir: 'cw', port: 'M2', color: 'motor', label: 'Động cơ M2' },
    touch: { type: 'sensor_touch', name: 'Waiting for Pressed', color: 'sensor', label: 'Chờ nhấn nút' },
    release: { type: 'sensor_release', name: 'Waiting for Released', color: 'sensor', label: 'Chờ nhả nút' },
    // Nâng cao (cấp 2–3)
    waitClear: { type: 'wait_clear', name: 'Đợi đường trống', color: 'sensor', label: 'Đợi đường trống' },
    ifSee: { type: 'if_see', name: 'Nếu thấy vật lạ', color: 'control', label: 'Nếu thấy vật lạ' },
    ifEnd: { type: 'if_end', name: 'Hết Nếu', color: 'control', label: 'Hết Nếu' },
    photo: { type: 'photo', name: 'Chụp ảnh gửi về', color: 'display', label: 'Chụp ảnh & gửi' }
  };

  class BlockEngine {
    // opts (từ window.LESSON.blocks): toolbox – khối trong khay; pro – khối chỉ hiện ở chế độ Nâng cao;
    // sample – chương trình mẫu trong sách; empty – chương trình lúc mở trang. Mỗi khối: 'tên' hoặc ['tên', { thuộc tính }]
    constructor(containerId, toolboxId, opts = {}) {
      this.opts = opts;
      this.container = document.getElementById(containerId);
      this.toolbox = document.getElementById(toolboxId);
      this.blocks = [];
      this.activeBlockIndex = -1;
      this.onChangeCallback = null;
      this.onStartTap = null; // chạm khối Start → chạy chương trình
      this.selected = -1; // khối đang chọn: hiện nút xóa/dịch
    }

    init() {
      this.renderToolbox();
      // Bắt đầu với chương trình trống: học sinh tự ghép theo sách (NV2); nút "Mẫu trong sách" nạp mẫu
      this.clearProgram();
    }

    setOnChange(cb) {
      this.onChangeCallback = cb;
    }

    notifyChange() {
      if (this.onChangeCallback) {
        this.onChangeCallback(this.blocks);
      }
    }
    // Chương trình mẫu trong sách của bài (window.LESSON.blocks.sample)
    loadDefaultProgram() {
      this.blocks = this.sampleProgram();
      this.selected = -1;
      this.render();
      this.notifyChange();
    }

    // Nạp một chương trình theo cùng dạng với LESSON.blocks.sample (dùng cho link ?mau= ca mẫu đúng/sai)
    loadProgram(spec) {
      this.blocks = makeBlocks(spec);
      this.selected = -1;
      this.render();
      this.notifyChange();
    }

    clearProgram() {
      this.selected = -1;
      this.blocks = makeBlocks(this.opts.empty || ['start']);
      this.render();
      this.notifyChange();
    }

    renderToolbox() {
      if (!this.toolbox) return;
      this.toolbox.innerHTML = '';

      const pro = this.opts.pro || [];
      const available = [...(this.opts.toolbox || []), ...pro];

      available.forEach(key => {
        const tpl = BLOCK_TEMPLATES[key];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `zb-item zb-${tpl.color}` + (pro.includes(key) ? ' pro-only' : '');
        btn.dataset.key = key;
        btn.title = `Thêm khối ${tpl.name}`;
        
        let iconHtml = '';
        if (tpl.type === 'start') iconHtml = SVG_ICONS.start;
        else if (tpl.type === 'repeatStart') iconHtml = SVG_ICONS.repeatStart;
        else if (tpl.type === 'repeatEnd') iconHtml = SVG_ICONS.repeatEnd;
        else if (tpl.type === 'melody') iconHtml = SVG_ICONS.melody(tpl.tune);
        else if (tpl.type === 'motor') iconHtml = portTag(tpl) + motorIcon(tpl.speed, tpl.dir);
        else if (tpl.type === 'motor_power') iconHtml = SVG_ICONS.motorPower(tpl.power);
        else if (tpl.type === 'motor_reverse') iconHtml = SVG_ICONS.motorReverse;
        else if (tpl.type === 'stop') iconHtml = SVG_ICONS.motorStop;
        else if (tpl.type === 'wait') iconHtml = `<span class="zb-param-val">${tpl.duration || 3}s</span>`;
        else if (tpl.type === 'sensor_obstacle') iconHtml = SVG_ICONS.obstacle;
        else iconHtml = iconOf(tpl);

        btn.innerHTML = `
          <div class="zb-icon-wrap">${iconHtml}</div>
          <span class="zb-caption">${tpl.label}</span>
          <span class="zb-plus">+ Thêm</span>
        `;

        btn.addEventListener('click', () => {
          if (window.SFX) window.SFX.click();
          if (tpl.type === 'if_see') {
            // Khối Nếu luôn đi kèm khối Hết Nếu; chọn sẵn khối Nếu để các khối thêm sau nằm bên trong
            const at = this.insertAt();
            this.blocks.splice(at, 0, { ...tpl }, { ...BLOCK_TEMPLATES.ifEnd });
            this.selected = at;
            this.render();
            this.notifyChange();
            return;
          }
          this.insertBlock({ ...tpl });
        });

        this.toolbox.appendChild(btn);
      });
    }

    // Chỗ chèn khối mới: đang chọn khối "Nếu" thì vào trong (trước "Hết Nếu"), không thì trước Repeat End
    insertAt() {
      const sel = this.blocks[this.selected];
      if (sel && sel.type === 'if_see') {
        const end = matchIfEnd(this.blocks, this.selected);
        if (end !== -1) return end;
      }
      const endIdx = this.blocks.findIndex(b => b.type === 'repeatEnd');
      return endIdx !== -1 ? endIdx : this.blocks.length;
    }

    insertBlock(blockData, index = -1) {
      this.blocks.splice(index === -1 ? this.insertAt() : index, 0, blockData);
      this.render();
      this.notifyChange();
    }

    removeBlock(index) {
      if (index >= 0 && index < this.blocks.length) {
        const b = this.blocks[index];
        // Không xóa Start hoặc Repeat End bắt buộc
        if (b.type === 'start' || b.type === 'if_end') return;
        // Xóa khối Nếu thì xóa luôn khối Hết Nếu đi kèm (các khối bên trong giữ lại)
        const end = b.type === 'if_see' ? matchIfEnd(this.blocks, index) : -1;
        if (end !== -1) this.blocks.splice(end, 1);
        this.blocks.splice(index, 1);
        if (window.SFX) window.SFX.click();
        this.render();
        this.notifyChange();
      }
    }

    moveBlock(fromIdx, toIdx) {
      if (toIdx < 1 || toIdx >= this.blocks.length) return false; // Không vượt trước Start
      const next = this.blocks.slice();
      next.splice(toIdx, 0, next.splice(fromIdx, 1)[0]);
      // Không cho "Lặp lại" lên trước "Bắt đầu lặp", "Hết Nếu" lên trước "Nếu"
      if (!pairsOk(next)) {
        if (window.SFX) window.SFX.buzz();
        return false;
      }
      this.blocks = next;
      if (window.SFX) window.SFX.click();
      this.render();
      this.notifyChange();
      return true;
    }

    // Các mức của khối Chờ: 1–5 giây, thêm mức lẻ có trong mẫu của bài (0,5 s, 0,2 s…) để học sinh tự ghép được đúng mẫu
    waitSteps() {
      const extra = [...(this.opts.waits || []), ...this.sampleProgram().filter(b => b.type === 'wait').map(b => b.duration)];
      return [...new Set([1, 2, 3, 4, 5, ...extra])].filter(v => v > 0).sort((a, b) => a - b);
    }

    cycleParam(index) {
      const b = this.blocks[index];
      if (!b) return;

      if (b.type === 'wait') {
        const options = this.waitSteps();
        const curIdx = options.indexOf(b.duration);
        b.duration = curIdx === -1 ? options.find(v => v > b.duration) || options[0] : options[(curIdx + 1) % options.length];
      } else if (b.type === 'melody') {
        b.tune = b.tune === 'Do' ? 'Mi' : b.tune === 'Mi' ? 'Do' : b.tune === 'A' ? 'B' : 'A';
        b.name = b.tune === 'Do' || b.tune === 'Mi' ? 'Nốt ' + b.tune : 'Melody ' + b.tune;
        b.label = b.tune === 'Do' || b.tune === 'Mi' ? 'Phát nốt ' + b.tune : 'Âm thanh ' + b.tune;
      } else if (b.type === 'motor_power') {
        // Giáo án: đổi mức mặc định 8 xuống 2 – mỗi lần chạm giảm 1 mức, sau 1 quay về 8
        b.power = b.power > 1 ? b.power - 1 : 8;
      } else if (b.type === 'sensor_obstacle' && this.opts.sensorRange && document.documentElement.dataset.mode === 'pro') {
        const options = this.opts.sensorRanges || [20, 30, 50];
        b.range = options[(options.indexOf(b.range ?? 30) + 1) % options.length];
      } else if (b.type === 'motor' && this.opts.motorDirections) {
        const order = ['high:cw', 'high:ccw', 'low:cw', 'low:ccw', 'medium:cw', 'medium:ccw'];
        [b.speed, b.dir] = order[(order.indexOf(b.speed + ':' + (b.dir || 'cw')) + 1) % order.length].split(':');
        b.name = SPEEDS[b.speed].name + (b.dir === 'ccw' ? ' ngược' : '');
        b.label = SPEEDS[b.speed].label + (b.dir === 'ccw' ? ' ngược' : '');
      } else if (b.type === 'motor' && b.port) {
        const order = ['low:cw', 'high:cw', 'low:ccw', 'high:ccw'];
        [b.speed, b.dir] = order[(order.indexOf(b.speed + ':' + (b.dir || 'cw')) + 1) % order.length].split(':');
        b.name = SPEEDS[b.speed].name;
        b.label = SPEEDS[b.speed].label + (b.dir === 'ccw' ? ' ngược' : '');
      } else if (b.type === 'motor') {
        const order = (this.opts.toolbox || []).includes('mediumSpeed') ? ['low', 'medium', 'high'] : ['low', 'high'];
        b.speed = order[(order.indexOf(b.speed) + 1) % order.length];
        b.name = SPEEDS[b.speed].name;
        b.label = SPEEDS[b.speed].label;
      }

      if (window.SFX) window.SFX.click();
      this.render();
      this.notifyChange();
    }

    setActiveBlock(index) {
      this.activeBlockIndex = index;
      const allDomBlocks = this.container.querySelectorAll('.zb-block');
      allDomBlocks.forEach((el, i) => {
        if (i === index) {
          el.classList.add('is-active');
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        } else {
          el.classList.remove('is-active');
        }
      });
    }

    render() {
      if (!this.container) return;
      this.container.innerHTML = '';
      const trafficLesson = (this.opts.toolbox || []).includes('sensorGreen');
      // Khối nằm giữa "Nếu" và "Hết Nếu" được gạch chân màu cam
      let depth = 0;
      const inIf = this.blocks.map(b => {
        if (b.type === 'if_end') depth = Math.max(0, depth - 1);
        const inside = depth > 0;
        if (b.type === 'if_see') depth++;
        return inside;
      });

      this.blocks.forEach((b, i) => {
        const el = document.createElement('div');
        el.className = `zb-block zb-${b.color}` + (trafficLesson ? ' zb-traffic-card' : '') + (b.type === 'start' ? ' zb-block-start' : '') + (b.type === 'repeatEnd' ? ' zb-block-end' : '') +
          (inIf[i] ? ' zb-in-if' : '');
        el.id = `code-block-${i}`;
        el.title = b.name;
        if (b.type === 'motor_power') el.dataset.power = b.power;

        let iconContent = '';
        let paramLabel = b.name;

        if (b.type === 'start') {
          iconContent = SVG_ICONS.start;
          paramLabel = 'Start';
        } else if (b.type === 'repeatStart') {
          iconContent = SVG_ICONS.repeatStart;
          paramLabel = 'Repeat';
        } else if (b.type === 'repeatEnd') {
          iconContent = SVG_ICONS.repeatEnd;
          paramLabel = 'Lặp lại';
        } else if (b.type === 'melody') {
          iconContent = SVG_ICONS.melody(b.tune);
          paramLabel = `Melody ${b.tune} (chạm để đổi)`;
        } else if (b.type === 'motor') {
          iconContent = portTag(b) + motorIcon(b.speed, b.dir);
          paramLabel = (b.port ? b.port + ' ' : '') + SPEEDS[b.speed].name + (b.dir === 'ccw' ? ' ngược chiều' : '') + ' (chạm đổi)';
        } else if (b.type === 'motor_power') {
          iconContent = SVG_ICONS.motorPower(b.power);
          paramLabel = `Tốc độ mức ${b.power} (chạm để đổi)`;
        } else if (b.type === 'motor_reverse') {
          iconContent = SVG_ICONS.motorReverse;
          paramLabel = 'Đổi chiều quay';
        } else if (b.type === 'stop') {
          iconContent = SVG_ICONS.motorStop;
          paramLabel = 'Stop';
        } else if (b.type === 'wait') {
          iconContent = `<span class="zb-big-time">${b.duration}s</span>`;
          paramLabel = `Chờ ${b.duration}s (chạm đổi)`;
        } else if (b.type === 'sensor_obstacle') {
          iconContent = SVG_ICONS.obstacle;
          if (this.opts.sensorRange && document.documentElement.dataset.mode === 'pro') {
            iconContent += `<span class="zb-big-time">${b.range ?? 30}cm</span>`;
            paramLabel = `Chờ vật cản trong ${b.range ?? 30} cm (chạm đổi)`;
          } else paramLabel = 'Chờ vật cản';
        } else {
          iconContent = iconOf(b);
        }

        // Nút xóa/dịch chỉ hiện ở khối vừa chạm (to, khó bấm nhầm bằng ngón tay)
        if (i === this.selected) el.classList.add('is-selected');
        el.innerHTML = `
          <div class="zb-badge-idx">${i + 1}</div>
          <div class="zb-inner-icon">${iconContent}</div>
          <span class="zb-text-tag">${trafficLesson ? trafficCaption(b) : b.name}</span>
          ${b.type !== 'start' && b.type !== 'repeatStart' && b.type !== 'repeatEnd' && b.type !== 'if_end' ? `
            <button type="button" class="zb-del-btn" title="Xóa khối này" aria-label="Xóa khối ${b.name}">×</button>
          ` : ''}
          ${i >= 1 && this.blocks.length > 2 ? `
            <div class="zb-move-btns">
              ${i > 1 ? '<button type="button" class="zb-mv-btn zb-mv-l" title="Dịch sang trái" aria-label="Dịch sang trái">◀</button>' : ''}
              ${i < this.blocks.length - 1 ? '<button type="button" class="zb-mv-btn zb-mv-r" title="Dịch sang phải" aria-label="Dịch sang phải">▶</button>' : ''}
            </div>
          ` : ''}
        `;
        if (b.type === 'start') {
          el.title = 'Chạm khối Start để chạy chương trình';
          el.setAttribute('role', 'button');
          el.setAttribute('aria-label', 'Start – chạm để chạy chương trình');
        }

        el.addEventListener('click', (e) => {
          if (e.target.closest('.zb-del-btn') || e.target.closest('.zb-mv-btn')) return;
          // Như phần mềm ZMrobo: chạm khối Start màu vàng để chạy (giáo án)
          if (b.type === 'start') {
            if (this.onStartTap) this.onStartTap();
            return;
          }
          this.selected = i;
          if (b.type === 'wait' || b.type === 'melody' || b.type === 'motor' || b.type === 'motor_power' || (b.type === 'sensor_obstacle' && this.opts.sensorRange && document.documentElement.dataset.mode === 'pro')) {
            this.cycleParam(i);
          } else {
            this.render();
          }
        });

        const delBtn = el.querySelector('.zb-del-btn');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selected = -1;
            this.removeBlock(i);
          });
        }
        const mvL = el.querySelector('.zb-mv-l');
        if (mvL) {
          mvL.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.moveBlock(i, i - 1)) {
              this.selected = i - 1;
              this.render();
            }
          });
        }
        const mvR = el.querySelector('.zb-mv-r');
        if (mvR) {
          mvR.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.moveBlock(i, i + 1)) {
              this.selected = i + 1;
              this.render();
            }
          });
        }

        this.container.appendChild(el);
      });
      this.renderGhost();
    }

    // Dải "mẫu mờ": chương trình mẫu trong sách, khối nào học sinh đã đặt đúng chỗ thì hiện rõ
    setGhost(el) {
      this.ghost = el;
      this.renderGhost();
    }
    renderGhost() {
      if (!this.ghost) return;
      const trafficLesson = (this.opts.toolbox || []).includes('sensorGreen');
      const sig = b => !b ? '' : b.type === 'melody' ? 'm' + b.tune : b.type === 'display' ? 'display:' + b.icon : b.type === 'wait' ? 'w' + b.duration
        : b.type === 'motor' && b.port ? ['motor', b.port, b.speed, b.dir || 'cw'].join(':')
        : b.type === 'motor' && this.opts.motorDirections ? ['motor', b.speed, b.dir || 'cw'].join(':')
        : b.type === 'motor' || b.type === 'motor_power' ? 'motor' : b.type;
      const sample = this.sampleProgram();
      let right = 0;
      this.ghost.innerHTML = '';
      sample.forEach((b, i) => {
        const ok = sig(this.blocks[i]) === sig(b);
        if (ok) right++;
        const el = document.createElement('div');
        el.className = `zb-block zb-ghost zb-${b.color}` + (trafficLesson ? ' zb-traffic-card' : '') + (b.type === 'start' ? ' zb-block-start' : '') +
          (b.type === 'repeatEnd' ? ' zb-block-end' : '') + (ok ? ' is-match' : '');
        el.setAttribute('aria-label', `${i + 1}. ${b.name}${ok ? ' – đã đúng' : ''}`);
        el.innerHTML = `<div class="zb-inner-icon">${iconOf(b)}</div><span class="zb-text-tag">${trafficLesson ? trafficCaption(b) : b.name}</span>`;
        this.ghost.appendChild(el);
      });
      this.ghost.dataset.right = right;
      this.ghost.dataset.total = sample.length;
    }
  }

  // Bài giao thông lớp 1: chế độ Bé đọc biểu tượng; Nâng cao hiện tên song ngữ.
  function trafficCaption(b) {
    const icons = { start: '🚩', repeatStart: '🔁', repeatEnd: '🔁',
      sensor_green: '🟢', sensor_yellow: '🟡', sensor_red: '🔴', stop: '✋' };
    const kid = b.type === 'motor' ? (b.speed === 'high' ? '🐇' : '🐢') : icons[b.type] || '❔';
    return `<span class="zb-traffic-kid">${kid}</span><span class="zb-traffic-pro">${b.label || b.name}<br>${b.name}</span>`;
  }

  function iconOf(b) {
    if (b.type === 'start') return SVG_ICONS.start;
    if (b.type === 'repeatStart') return SVG_ICONS.repeatStart;
    if (b.type === 'repeatEnd') return SVG_ICONS.repeatEnd;
    if (b.type === 'melody') return SVG_ICONS.melody(b.tune);
    if (b.type === 'motor') return portTag(b) + motorIcon(b.speed, b.dir);
    if (b.type === 'sensor_touch') return SVG_ICONS.touch;
    if (b.type === 'sensor_release') return SVG_ICONS.release;
    if (b.type === 'sensor_obstacle') return SVG_ICONS.obstacle;
    if (b.type === 'sensor_green') return SVG_ICONS.trafficLight('green');
    if (b.type === 'sensor_yellow') return SVG_ICONS.trafficLight('yellow');
    if (b.type === 'sensor_red') return SVG_ICONS.trafficLight('red');
    if (b.type === 'sensor_color_red') return SVG_ICONS.colorSensor('red');
    if (b.type === 'sensor_color_blue') return SVG_ICONS.colorSensor('blue');
    if (b.type === 'display') {
      if (b.icon === 'go') return '<svg viewBox="0 0 40 40" fill="none"><rect x="2" y="7" width="36" height="26" rx="6" stroke="#fff" stroke-width="2.5"/><text x="20" y="25" text-anchor="middle" fill="#fff" font-size="17" font-weight="900" font-family="sans-serif">GO</text></svg>';
      if (b.icon === 'down') return '<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6v25M9 20l11 11 11-11"/></svg>';
      const eye = b.icon === 'wink' ? '<path d="M23 15h7" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' : '<circle cx="26" cy="15" r="2.4" fill="#fff"/>';
      const mouth = b.icon === 'sad' ? '<path d="M12 29q8-11 16 0"/>' : '<path d="M11 24q9 12 18 0"/>';
      return `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><circle cx="20" cy="20" r="16"/><circle cx="14" cy="15" r="2.4" fill="#fff"/>${eye}${b.icon === 'heart' ? '<path d="M13 23q-4-7 3-7q3 0 4 3q3-6 7-3q7 5-7 15z" fill="#fff"/>' : mouth}</svg>`;
    }
    if (b.type === 'wait') return `<span class="zb-big-time">${b.duration}s</span>`;
    if (b.type === 'wait_clear') return SVG_ICONS.waitClear;
    if (b.type === 'if_see') return SVG_ICONS.ifSee;
    if (b.type === 'if_end') return SVG_ICONS.ifEnd;
    if (b.type === 'photo') return SVG_ICONS.photo;
    if (b.type === 'drive') return b.move === 'left' ? SVG_ICONS.turnLeft : SVG_ICONS.moveForward;
    return '';
  }
  const SPEEDS = {
    low: { name: 'Low Speed', label: 'Quay chậm' },
    medium: { name: 'Medium Speed', label: 'Quay vừa' },
    high: { name: 'High Speed', label: 'Quay nhanh' }
  };
  // dir 'ccw' (chỉ khối có cổng M1/M2): lật ngang hình mũi tên
  function motorIcon(speed, dir) {
    const svg = speed === 'high' ? SVG_ICONS.motorHighCW : speed === 'medium' ? SVG_ICONS.motorMedium : SVG_ICONS.motorLow;
    return dir === 'ccw' ? svg.replace(/<svg ([^>]*)>/, '<svg $1><g transform="matrix(-1 0 0 1 40 0)">').replace(/<\/svg>$/, '</g></svg>') : svg;
  }
  const portTag = b => (b.port ? `<span class="zb-port">${b.port}</span>` : '');
  function matchIfEnd(blocks, i) {
    let depth = 0;
    for (let j = i + 1; j < blocks.length; j++) {
      if (blocks[j].type === 'if_see') depth++;
      else if (blocks[j].type === 'if_end') {
        if (!depth) return j;
        depth--;
      }
    }
    return -1;
  }
  // Khối đóng không đứng trước khối mở của nó: Lặp lại sau Bắt đầu lặp, Hết Nếu sau Nếu
  function pairsOk(blocks) {
    let loop = 0, cond = 0;
    for (const b of blocks) {
      if (b.type === 'repeatStart') loop++;
      else if (b.type === 'repeatEnd' && --loop < 0) return false;
      else if (b.type === 'if_see') cond++;
      else if (b.type === 'if_end' && --cond < 0) return false;
    }
    return true;
  }
  // ['wait', { duration: 3 }] hoặc 'start' → khối mới từ mẫu
  function makeBlocks(list) {
    return list.map(k => (Array.isArray(k) ? { ...BLOCK_TEMPLATES[k[0]], ...k[1] } : { ...BLOCK_TEMPLATES[k] }));
  }
  // Chương trình mẫu trong sách của bài (window.LESSON.blocks.sample)
  BlockEngine.prototype.sampleProgram = function () {
    return makeBlocks(this.opts.sample || ['start']);
  };

  window.BlockEngine = BlockEngine;
  window.BLOCK_TEMPLATES = BLOCK_TEMPLATES;
})();
