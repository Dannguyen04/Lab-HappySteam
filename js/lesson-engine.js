// Lớp gốc cho bộ mô phỏng của mọi bài mô hình. Phần chung nằm ở đây: vòng lặp khung hình, nhật ký,
// chạy khối lệnh (Start, Lặp, động cơ, Đợi, Giai điệu, Chờ nhấn nút…), gói nâng cấp, chế độ Nâng cao, gửi nhiệm vụ.
// Mỗi bài chỉ viết lớp con với phần riêng:
//   resetState()        – đặt lại trạng thái vật lý của bài
//   integrate(dt)       – vật lý mỗi bước thời gian (nhớ cộng this.runT)
//   onMotor(b)          – sau khi chạy khối động cơ (this.power, this.motorOn đã đặt)
//   onStopBlock(wasOn)  – sau khi chạy khối Dừng
//   onInstant(b)        – khối tức thì của bài (Màn hình…); trả về true nếu đã xử lý
//   onBlock(b)          – khối riêng của bài có thời lượng; trả về số giây khối chiếm (mặc định 0)
//   opts.levels         – mức động cơ của khối chậm/vừa/nhanh (mặc định 4/6/8); opts.sig – cách so chương trình mẫu
//   opts.orphanEnd      – 'stop': gặp Lặp lại mà không có Bắt đầu lặp thì kết thúc chương trình
//   missionExtra()      – dữ liệu thêm gửi kèm nhiệm vụ (best, upgrades…)
//   updateUI()          – gọi super.updateUI() rồi điền các ô số đo
// Cùng giao diện với SimulationEngine của Bài 9 để js/app.js dùng chung.
(function () {
  'use strict';

  // Mức chuẩn cho mọi bài (theo Bài 9 – KHGD chỉ ghi chậm/vừa/nhanh, Motor Power mặc định 8)
  const LEVEL = { low: 4, medium: 6, high: 8 };
  const TIMED = new Set(['wait', 'melody', 'sensor_touch', 'sensor_obstacle']);
  const sig = b => (b.type === 'motor' ? 'motor:' + b.speed : b.type === 'wait' ? 'wait:' + b.duration : b.type === 'drive' ? 'drive:' + b.move : b.type);

  class LessonEngine {
    // opts: { sample, labels, baseLabel, core, melodyTime, logLimit, touch }
    constructor(opts = {}) {
      this.opts = opts;
      this.sample = opts.sample || [];
      this.touchTypes = new Set(opts.touch || ['sensor_touch']);
      this.prog = [];
      this.logs = [];
      this.t = 0;
      this.upgrades = new Set();
      this.advanced = false;
      this.assemblyDone = false;
      this.done = {};
      this.best = null;
      this.rafId = null;
      this.loopActive = true;
      this.reset();
    }
    init() {
      this.startLoop();
    }
    resizeCanvas() {}
    reset() {
      this.running = false;
      this.pc = 0;
      this.entered = false;
      this.blkT = 0;
      this.motorOn = false;
      this.power = 0;
      this.dir = 1;
      this.runT = 0;
      this.pressed = false;
      this.pressT = 0;
      this.waitingPress = false;
      this.resetState();
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
    }
    resetState() {}
    emit(type, data) {
      if (this.onEvent) this.onEvent(type, data);
    }
    log(kind, text) {
      this.logs.unshift({ time: this.runT.toFixed(1) + 's', kind, text });
      if (this.logs.length > (this.opts.logLimit || 8)) this.logs.length = this.opts.logLimit || 8;
      const el = document.getElementById('sim-log-list');
      if (el)
        el.innerHTML = this.logs
          .map(e => `<li class="log-item" data-kind="${e.kind}"><time class="log-time">${e.time}</time><span class="log-dot"></span><span class="log-text">${e.text}</span></li>`)
          .join('');
    }
    set(id, html) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    }

    setProgram(blocks) {
      this.prog = blocks || [];
      this.stop(true);
      this.reset();
    }
    start() {
      this.reset();
      this.running = true;
      if (window.SFX) window.SFX.init();
      this.log('info', 'Bắt đầu chạy chương trình.');
      this.emit('start');
      this.onStart();
    }
    onStart() {}
    stop(silent) {
      const was = this.running;
      this.running = false;
      this.motorOn = false;
      this.waitingPress = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      if (was && !silent) {
        this.log('info', 'Đã dừng chương trình.');
        this.emit('stop');
      }
    }
    // Học sinh nhấn nút đỏ (cảm biến chạm)
    press() {
      this.pressed = true;
      this.pressT = 0.3;
      this.emit('press');
    }
    setAssemblyDone(done) {
      if (this.assemblyDone === !!done) return;
      this.assemblyDone = !!done;
      this.checkMissions();
    }
    setUpgrades(list) {
      this.upgrades = new Set(list || []);
      this.upgradeRun = false;
      const labels = this.opts.labels || {};
      const names = [...this.upgrades].map(t => labels[t] || t);
      const badge = document.getElementById('sim-active-upgrade-badge');
      if (badge) badge.textContent = names.length ? names.join(' · ') : this.opts.baseLabel || '';
      this.log('ok', names.length ? 'Đã gắn: ' + names.join(', ') : this.opts.baseLabel || '');
    }
    has(t) {
      return this.upgrades.has(t);
    }
    // Lần chạy đầu tiên có gói nâng cấp → tính cho nhiệm vụ sáng tạo (m4)
    noteUpgradeRun() {
      if (this.upgrades.size && !this.upgradeRun) {
        this.upgradeRun = true;
        this.checkMissions();
      }
    }
    setAdvanced(on) {
      on = !!on;
      if (this.advanced === on) return;
      this.advanced = on;
      this.stop(true);
      this.reset();
      this.checkMissions();
    }
    matchesSample(sample = this.sample) {
      const f = this.opts.sig || sig;
      return this.prog.length === sample.length && this.prog.every((b, i) => f(b) === sample[i]);
    }

    advance(dt) {
      if (this.pressed && (this.pressT -= dt) <= 0) this.pressed = false;
      if (!this.running) return;
      let budget = dt,
        guard = 0;
      while (this.running && guard++ < 40) {
        if (this.pc >= this.prog.length) {
          this.finish();
          break;
        }
        const b = this.prog[this.pc];
        if (b.type === 'start' || b.type === 'repeatStart') {
          this.pc++;
          continue;
        }
        if (b.type === 'repeatEnd') {
          const r = this.prog.findIndex(x => x.type === 'repeatStart');
          this.pc = r < 0 ? (this.opts.orphanEnd === 'stop' ? this.prog.length : this.pc + 1) : r + 1;
          this.onLoopEnd();
          // vòng lặp không có khối nào tốn thời gian: nhường khung hình sau
          if (r >= 0 && !this.prog.slice(r + 1).some(x => TIMED.has(x.type) || this.touchTypes.has(x.type))) break;
          continue;
        }
        if (b.type === 'motor' || b.type === 'motor_power') {
          this.power = b.type === 'motor_power' ? Math.max(1, Math.min(8, b.power || 8)) : (this.opts.levels || LEVEL)[b.speed] || 8;
          this.motorOn = true;
          this.onMotor(b);
          this.pc++;
          continue;
        }
        if (b.type === 'motor_reverse') {
          this.dir = -this.dir;
          this.pc++;
          continue;
        }
        if (b.type === 'stop') {
          const wasOn = this.motorOn;
          this.motorOn = false;
          this.pc++;
          this.onStopBlock(wasOn);
          continue;
        }
        if (this.touchTypes.has(b.type)) {
          if (!this.entered) {
            this.entered = true;
            this.waitingPress = true;
            this.pressed = false; // cần một lần nhấn mới cho mỗi khối
            if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(this.pc);
          }
          if (this.pressed) {
            this.pressed = false;
            this.waitingPress = false;
            this.entered = false;
            this.pc++;
            continue;
          }
          this.integrate(budget);
          budget = 0;
          break;
        }
        // Khối tức thì của bài (Màn hình, bật đèn…): onInstant(b) trả về true thì đi tiếp ngay, không đánh dấu khối
        if (!this.entered && this.onInstant(b)) {
          this.pc++;
          continue;
        }
        // Khối có thời lượng (Đợi, Giai điệu, khối riêng của bài)
        if (!this.entered) {
          this.entered = true;
          this.blkT = 0;
          if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(this.pc);
          this.blkDur = this.enterBlock(b);
        }
        const need = this.blkDur - this.blkT;
        if (budget < need) {
          this.blkT += budget;
          this.integrate(budget);
          budget = 0;
          break;
        }
        this.integrate(need);
        budget -= need;
        this.entered = false;
        this.pc++;
      }
      if (budget > 0 && this.running) this.integrate(budget);
    }
    // Vào một khối có thời lượng: trả về số giây khối chiếm
    enterBlock(b) {
      if (b.type === 'wait') return b.duration || 3;
      if (b.type === 'melody') {
        if (window.SFX) window.SFX.melody(b.tune);
        this.emit('melody', b.tune);
        return this.opts.melodyTime || 1;
      }
      return this.onBlock(b) || 0;
    }
    onMotor() {}
    onStopBlock() {}
    onLoopEnd() {}
    onInstant() {
      return false;
    }
    onBlock() {
      return 0;
    }
    integrate(dt) {
      if (this.running) this.runT += dt;
    }

    finish() {
      this.running = false;
      this.motorOn = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      this.emit('end');
      this.checkMissions();
    }

    checkMissions() {
      const s = { m1: this.assemblyDone, ...this.done, m4: this.upgrades.size > 0 && !!this.upgradeRun };
      s.allDone = (this.opts.core || ['m1', 'm2', 'm3', 'm4']).every(k => s[k]);
      Object.assign(s, this.missionExtra());
      if (this.onMissionUpdate) this.onMissionUpdate(s);
    }
    missionExtra() {
      return { upgrades: [...this.upgrades], best: this.best };
    }

    // Đèn trạng thái; lớp con gọi super.updateUI() rồi điền ô số đo bằng this.set(id, html)
    updateUI() {
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.running ? (this.waitingPress ? 'Chờ nhấn nút' : 'Đang chạy') : 'Đã dừng';
        pill.dataset.k = this.running ? (this.waitingPress ? 'warn' : 'ok') : 'muted';
      }
    }

    startLoop() {
      cancelAnimationFrame(this.rafId);
      this.loopActive = true;
      let last = performance.now();
      const loop = now => {
        if (!this.loopActive) return;
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        this.t += dt;
        this.advance(dt);
        this.updateUI();
        this.rafId = requestAnimationFrame(loop);
      };
      this.rafId = requestAnimationFrame(loop);
    }
    pauseLoop() {
      this.loopActive = false;
      cancelAnimationFrame(this.rafId);
    }
    resumeLoop() {
      if (!this.loopActive) this.startLoop();
    }
  }

  LessonEngine.LEVEL = LEVEL;
  LessonEngine.sig = sig;
  window.LessonEngine = LessonEngine;
})();
