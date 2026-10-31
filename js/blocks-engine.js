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
    motorStop: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><circle cx="20" cy="20" r="12"/><path d="M14 20h12" stroke-width="4"/></svg>`,
    melody: (tune) => `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3"><circle cx="21" cy="22" r="13"/><text x="21" y="28.5" text-anchor="middle" fill="#fff" stroke="none" font-family="'Chakra Petch', sans-serif" font-weight="700" font-size="18">${tune}</text><path d="M5 4v8" stroke-width="2.2"/><circle cx="3.6" cy="12" r="2.2" fill="#fff" stroke="none"/></svg>`,
    wait: (s) => `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2.5"><path d="M12 8h16M12 32h16M15 8v4c0 3 5 6 5 8s-5 5-5 8v4M25 8v4c0 3-5 6-5 8s5 5 5 8v4" stroke-linecap="round"/><circle cx="20" cy="25" r="2.2" fill="#fff"/></svg>`,
    display: `<svg viewBox="0 0 40 40" fill="#fff"><rect x="9" y="9" width="5" height="5" rx="1.5"/><rect x="17.5" y="9" width="5" height="5" rx="1.5"/><rect x="26" y="9" width="5" height="5" rx="1.5"/><rect x="9" y="17.5" width="5" height="5" rx="1.5"/><rect x="17.5" y="17.5" width="5" height="5" rx="1.5"/><rect x="26" y="17.5" width="5" height="5" rx="1.5"/><rect x="9" y="26" width="5" height="5" rx="1.5"/><rect x="17.5" y="26" width="5" height="5" rx="1.5"/><rect x="26" y="26" width="5" height="5" rx="1.5"/></svg>`,
    motorReverse: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15h18l-5-5M30 25H12l5 5"/></svg>`,
    obstacle: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><rect x="8" y="15" width="24" height="14" rx="3"/><circle cx="15" cy="22" r="2.8" fill="#fff"/><circle cx="25" cy="22" r="2.8" fill="#fff"/><path d="M14 10a8 8 0 0 1 12 0"/></svg>`,
    // Motor Power: đồng hồ tốc độ, số mức 1–8 ở giữa
    motorPower: p => `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><path d="M7 27a14 14 0 1 1 26 0"/><path d="M20 27l${(-7 + p * 1.75).toFixed(1)} -9" stroke-width="3.5"/><text x="20" y="38" text-anchor="middle" fill="#fff" stroke="none" font-family="Chakra Petch, sans-serif" font-weight="800" font-size="11">${p}</text></svg>`,
    // Nâng cao: đợi đường trống (đồng hồ cát + mắt cảm biến), Nếu thấy vật lạ (hình thoi ?), Hết Nếu, chụp ảnh gửi về
    waitClear: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6h12M6 34h12M8 6v4c0 3 4 6 4 10s-4 7-4 10v4M16 6v4c0 3-4 6-4 10s4 7 4 10v4"/><rect x="21" y="14" width="15" height="12" rx="3"/><circle cx="25.5" cy="20" r="1.8" fill="#fff"/><circle cx="31.5" cy="20" r="1.8" fill="#fff"/></svg>`,
    ifSee: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"><path d="M20 4l16 16-16 16L4 20z"/><text x="20" y="26.5" text-anchor="middle" fill="#fff" stroke="none" font-family="Chakra Petch, sans-serif" font-weight="800" font-size="17">?</text></svg>`,
    ifEnd: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6l-6 14 6 14"/><path d="M18 20h16"/><path d="M28 14l6 6-6 6"/></svg>`,
    photo: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round"><path d="M5 13h7l3-5h10l3 5h7v19H5z"/><circle cx="20" cy="22" r="6"/><path d="M31 4l4-3M33 8h5" stroke-linecap="round" stroke-width="2.4"/></svg>`,
    touch: `<svg viewBox="0 0 40 40" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><rect x="9" y="24" width="22" height="7" rx="2" fill="#fff"/><path d="M20 7v13M14 15l6 6 6-6"/></svg>`
  };

  const BLOCK_TEMPLATES = {
    start: { type: 'start', name: 'Start', color: 'start', label: 'Bắt đầu' },
    repeatStart: { type: 'repeatStart', name: 'Repeat Start', color: 'control', label: 'Bắt đầu lặp' },
    repeatEnd: { type: 'repeatEnd', name: 'Repeat End', color: 'control', label: 'Lặp lại' },
    melodyA: { type: 'melody', name: 'Melody A', tune: 'A', color: 'melody', label: 'Âm thanh A' },
    melodyB: { type: 'melody', name: 'Melody B', tune: 'B', color: 'melody', label: 'Âm thanh B' },
    highSpeed: { type: 'motor', name: 'High Speed', speed: 'high', dir: 'cw', color: 'motor', label: 'Quay nhanh' },
    lowSpeed: { type: 'motor', name: 'Low Speed', speed: 'low', dir: 'cw', color: 'motor', label: 'Quay chậm' },
    motorPower: { type: 'motor_power', name: 'Motor Power', power: 8, color: 'motor', label: 'Tốc độ động cơ' },
    motorReverse: { type: 'motor_reverse', name: 'Motor This Way', color: 'motor', label: 'Đổi chiều quay' },
    motorStop: { type: 'stop', name: 'Stop', color: 'motor', label: 'Dừng motor' },
    wait: { type: 'wait', name: 'Wait', duration: 3, color: 'wait', label: 'Chờ' },
    display: { type: 'display', name: 'Display', icon: 'smile', color: 'display', label: 'Màn hình' },
    obstacle: { type: 'sensor_obstacle', name: 'Chờ vật cản', color: 'sensor', label: 'Chờ vật cản' },
    touch: { type: 'sensor_touch', name: 'Wait Pressed', color: 'sensor', label: 'Chờ nút bấm' },
    // Nâng cao (cấp 2–3)
    waitClear: { type: 'wait_clear', name: 'Đợi đường trống', color: 'sensor', label: 'Đợi đường trống' },
    ifSee: { type: 'if_see', name: 'Nếu thấy vật lạ', color: 'control', label: 'Nếu thấy vật lạ' },
    ifEnd: { type: 'if_end', name: 'Hết Nếu', color: 'control', label: 'Hết Nếu' },
    photo: { type: 'photo', name: 'Chụp ảnh gửi về', color: 'display', label: 'Chụp ảnh & gửi' }
  };
  const PRO_BLOCKS = ['waitClear', 'ifSee', 'photo'];

  class BlockEngine {
    constructor(containerId, toolboxId) {
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

    // Chương trình mẫu trong sách (ảnh "Lập trình.png" của Bài 9): phát âm A, quay nhanh 3 giây,
    // phát âm B, quay tiếp 3 giây, lặp lại liên tục
    loadDefaultProgram() {
      this.blocks = sampleProgram();
      this.selected = -1;
      this.render();
      this.notifyChange();
    }

    clearProgram() {
      this.selected = -1;
      this.blocks = [
        { ...BLOCK_TEMPLATES.start },
        { ...BLOCK_TEMPLATES.repeatStart },
        { ...BLOCK_TEMPLATES.repeatEnd }
      ];
      this.render();
      this.notifyChange();
    }

    renderToolbox() {
      if (!this.toolbox) return;
      this.toolbox.innerHTML = '';

      const available = [
        'melodyA', 'melodyB', 'highSpeed', 'motorPower', 'motorReverse', 'wait', 'motorStop', 'obstacle', ...PRO_BLOCKS
      ];

      available.forEach(key => {
        const tpl = BLOCK_TEMPLATES[key];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `zb-item zb-${tpl.color}` + (PRO_BLOCKS.includes(key) ? ' pro-only' : '');
        btn.dataset.key = key;
        btn.title = `Thêm khối ${tpl.name}`;
        
        let iconHtml = '';
        if (tpl.type === 'start') iconHtml = SVG_ICONS.start;
        else if (tpl.type === 'repeatStart') iconHtml = SVG_ICONS.repeatStart;
        else if (tpl.type === 'repeatEnd') iconHtml = SVG_ICONS.repeatEnd;
        else if (tpl.type === 'melody') iconHtml = SVG_ICONS.melody(tpl.tune);
        else if (tpl.type === 'motor') iconHtml = tpl.speed === 'high' ? SVG_ICONS.motorHighCW : SVG_ICONS.motorLow;
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
      if (toIdx < 1 || toIdx >= this.blocks.length) return; // Không vượt trước Start
      const item = this.blocks.splice(fromIdx, 1)[0];
      this.blocks.splice(toIdx, 0, item);
      if (window.SFX) window.SFX.click();
      this.render();
      this.notifyChange();
    }

    cycleParam(index) {
      const b = this.blocks[index];
      if (!b) return;

      if (b.type === 'wait') {
        const options = [1, 2, 3, 4, 5];
        const curIdx = options.indexOf(b.duration);
        b.duration = options[(curIdx + 1) % options.length];
      } else if (b.type === 'melody') {
        b.tune = b.tune === 'A' ? 'B' : 'A';
        b.name = 'Melody ' + b.tune;
        b.label = 'Âm thanh ' + b.tune;
      } else if (b.type === 'motor_power') {
        // Giáo án: đổi mức mặc định 8 xuống 2 – mỗi lần chạm giảm 1 mức, sau 1 quay về 8
        b.power = b.power > 1 ? b.power - 1 : 8;
      } else if (b.type === 'motor') {
        b.speed = b.speed === 'high' ? 'low' : 'high';
        b.name = b.speed === 'high' ? 'High Speed' : 'Low Speed';
        b.label = b.speed === 'high' ? 'Quay nhanh' : 'Quay chậm';
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
        el.className = `zb-block zb-${b.color}` + (b.type === 'start' ? ' zb-block-start' : '') + (b.type === 'repeatEnd' ? ' zb-block-end' : '') +
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
          iconContent = b.speed === 'high' ? SVG_ICONS.motorHighCW : SVG_ICONS.motorLow;
          paramLabel = b.speed === 'high' ? 'High (chạm đổi)' : 'Low (chạm đổi)';
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
          paramLabel = 'Chờ vật cản';
        } else {
          iconContent = iconOf(b);
        }

        // Nút xóa/dịch chỉ hiện ở khối vừa chạm (to, khó bấm nhầm bằng ngón tay)
        if (i === this.selected) el.classList.add('is-selected');
        el.innerHTML = `
          <div class="zb-badge-idx">${i + 1}</div>
          <div class="zb-inner-icon">${iconContent}</div>
          <span class="zb-text-tag">${b.name}</span>
          ${b.type !== 'start' && b.type !== 'repeatStart' && b.type !== 'repeatEnd' && b.type !== 'if_end' ? `
            <button type="button" class="zb-del-btn" title="Xóa khối này" aria-label="Xóa khối ${b.name}">×</button>
          ` : ''}
          ${i > 1 && i < this.blocks.length - 1 ? `
            <div class="zb-move-btns">
              <button type="button" class="zb-mv-btn zb-mv-l" title="Dịch sang trái" aria-label="Dịch sang trái">◀</button>
              <button type="button" class="zb-mv-btn zb-mv-r" title="Dịch sang phải" aria-label="Dịch sang phải">▶</button>
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
          // Như phần mềm ZMrobo: chạm khối Start màu vàng để chạy (giáo án Bài 9)
          if (b.type === 'start') {
            if (this.onStartTap) this.onStartTap();
            return;
          }
          this.selected = i;
          if (b.type === 'wait' || b.type === 'melody' || b.type === 'motor' || b.type === 'motor_power') {
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
            if (i - 1 >= 1) this.selected = i - 1;
            this.moveBlock(i, i - 1);
          });
        }
        const mvR = el.querySelector('.zb-mv-r');
        if (mvR) {
          mvR.addEventListener('click', (e) => {
            e.stopPropagation();
            if (i + 1 < this.blocks.length) this.selected = i + 1;
            this.moveBlock(i, i + 1);
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
      const sig = b => !b ? '' : b.type === 'melody' ? 'm' + b.tune : b.type === 'wait' ? 'w' + b.duration
        : b.type === 'motor' || b.type === 'motor_power' ? 'motor' : b.type;
      const sample = sampleProgram();
      let right = 0;
      this.ghost.innerHTML = '';
      sample.forEach((b, i) => {
        const ok = sig(this.blocks[i]) === sig(b);
        if (ok) right++;
        const el = document.createElement('div');
        el.className = `zb-block zb-ghost zb-${b.color}` + (b.type === 'start' ? ' zb-block-start' : '') +
          (b.type === 'repeatEnd' ? ' zb-block-end' : '') + (ok ? ' is-match' : '');
        el.setAttribute('aria-label', `${i + 1}. ${b.name}${ok ? ' – đã đúng' : ''}`);
        el.innerHTML = `<div class="zb-inner-icon">${iconOf(b)}</div><span class="zb-text-tag">${b.name}</span>`;
        this.ghost.appendChild(el);
      });
      this.ghost.dataset.right = right;
      this.ghost.dataset.total = sample.length;
    }
  }

  function iconOf(b) {
    if (b.type === 'start') return SVG_ICONS.start;
    if (b.type === 'repeatStart') return SVG_ICONS.repeatStart;
    if (b.type === 'repeatEnd') return SVG_ICONS.repeatEnd;
    if (b.type === 'melody') return SVG_ICONS.melody(b.tune);
    if (b.type === 'motor') return b.speed === 'high' ? SVG_ICONS.motorHighCW : SVG_ICONS.motorLow;
    if (b.type === 'wait') return `<span class="zb-big-time">${b.duration}s</span>`;
    if (b.type === 'wait_clear') return SVG_ICONS.waitClear;
    if (b.type === 'if_see') return SVG_ICONS.ifSee;
    if (b.type === 'if_end') return SVG_ICONS.ifEnd;
    if (b.type === 'photo') return SVG_ICONS.photo;
    return '';
  }
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
  // Chương trình mẫu trong sách (ảnh "Lập trình.png" của Bài 9)
  function sampleProgram() {
    return [
      { ...BLOCK_TEMPLATES.start },
      { ...BLOCK_TEMPLATES.repeatStart },
      { ...BLOCK_TEMPLATES.melodyA },
      { ...BLOCK_TEMPLATES.highSpeed },
      { ...BLOCK_TEMPLATES.wait, duration: 3 },
      { ...BLOCK_TEMPLATES.melodyB },
      { ...BLOCK_TEMPLATES.highSpeed },
      { ...BLOCK_TEMPLATES.wait, duration: 3 },
      { ...BLOCK_TEMPLATES.repeatEnd }
    ];
  }

  window.BlockEngine = BlockEngine;
  window.BLOCK_TEMPLATES = BLOCK_TEMPLATES;
})();
