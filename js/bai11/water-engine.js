// Bộ mô phỏng Bài 11 – Cối xoay nước. Động cơ M5 quay hai bánh răng 40 răng ăn khớp (tỉ số 1:1, quay ngược chiều nhau)
// rồi tới bánh gầu: mức công suất p (1–8) → 150·p/8 vòng/phút. Mỗi vòng gầu múc 5 lít nước từ sông lên bể chứa.
// Chế độ Bé: bể 100 lít, không hao. Nâng cao: bể 150 lít, nắng làm bay hơi 2 lít/giây (vòng tuần hoàn của nước),
// mỗi lần bể đầy thì dân làng dùng hết nước, cần đầy bể 3 lần.
// Chương trình mẫu trong giáo án: Start, Lặp, Trái tim, Âm thanh A, Quay nhanh, Chờ 3s, Mặt cười, Âm thanh B, Chờ 3s, Hết lặp.
// Cùng giao diện với SimulationEngine của Bài 9 để js/app.js dùng chung.
(function () {
  'use strict';

  const MAX_RPM = 150;
  const GEAR = 1; // 40 răng ăn khớp 40 răng
  const PER_REV = 5; // lít nước mỗi vòng gầu
  const CAP = { kid: 100, pro: 150 };
  const EVAP = 2; // lít/giây (Nâng cao, đang chạy)
  const DRAIN_T = 1.5; // giây dân làng dùng hết nước sau khi bể đầy
  const BOOST = { scoop: 1.4, pipe: 1.1 }; // hệ số nước mỗi vòng
  const EVAP_K = { cover: 0.3 }; // hệ số bay hơi
  const MELODY_T = 1;
  const SAMPLE = ['start', 'repeatStart', 'display:heart', 'melody:A', 'motor:high', 'wait:3', 'display:smile', 'melody:B', 'wait:3', 'repeatEnd'];
  const sig = b =>
    b.type === 'wait' ? 'wait:' + b.duration : b.type === 'motor' ? 'motor:' + b.speed : b.type === 'display' ? 'display:' + b.icon : b.type === 'melody' ? 'melody:' + b.tune : b.type;
  const SPEED = { high: 8, medium: 6, low: 4 };
  const rpmOf = p => (MAX_RPM * p) / 8;

  // Khối Màn hình có hai kiểu: trái tim và mặt cười (khối dùng chung chỉ có một kiểu mặc định)
  if (window.BLOCK_TEMPLATES) {
    window.BLOCK_TEMPLATES.displayHeart = { type: 'display', name: 'Trái tim', icon: 'heart', color: 'display', label: 'Hiện trái tim' };
    window.BLOCK_TEMPLATES.displaySmile = { type: 'display', name: 'Mặt cười', icon: 'smile', color: 'display', label: 'Hiện mặt cười' };
  }

  class WaterEngine {
    constructor() {
      this.prog = [];
      this.logs = [];
      this.t = 0;
      this.upgrades = new Set();
      this.advanced = false;
      this.assemblyDone = false;
      this.done = { m2: false, m3: false };
      this.proFills = 0; // NV5: số lần đầy bể ở chế độ Nâng cao
      this.lastRun = null;
      this.loopActive = true;
      this.rafId = null;
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
      this.power = 8;
      this.dir = 1; // 1: đúng chiều (gầu múc nước lên), -1: ngược
      this.rev = 0; // số vòng gầu
      this.water = 0; // lít trong bể
      this.runT = 0;
      this.face = null; // 'heart' | 'smile' | null: hình trên màn hình M5
      this.note = null; // 'A' | 'B' | null: âm thanh đang phát
      this.drain = 0; // giây còn lại của lúc dân làng dùng nước
      this.wrongWay = false;
      this.evaporated = 0;
      this.upgradeRun = false; // NV4 cần chuyển động thật trong lượt chạy hiện tại
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
    }

    emit(type, data) {
      if (this.onEvent) this.onEvent(type, data);
    }
    log(kind, text) {
      this.logs.unshift({ time: this.runT.toFixed(1) + 's', kind, text });
      if (this.logs.length > 8) this.logs.length = 8;
      const el = document.getElementById('sim-log-list');
      if (el)
        el.innerHTML = this.logs
          .map(e => `<li class="log-item" data-kind="${e.kind}"><time class="log-time">${e.time}</time><span class="log-dot"></span><span class="log-text">${e.text}</span></li>`)
          .join('');
    }

    setProgram(blocks) {
      this.prog = blocks || [];
      this.stop(true);
      this.reset();
    }
    start() {
      this.reset();
      this.proFills = 0; // NV5 cần ba lần đầy liên tiếp trong cùng một lượt chạy
      this.running = true;
      if (window.SFX) window.SFX.init();
      this.log('info', 'Bắt đầu chạy chương trình.');
      this.emit('start');
    }
    stop(silent) {
      const was = this.running;
      this.running = false;
      this.motorOn = false;
      this.note = null;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      if (was && !silent) {
        this.log('info', 'Đã dừng chương trình.');
        this.emit('stop');
      }
    }

    setAssemblyDone(done) {
      if (this.assemblyDone === !!done) return;
      this.assemblyDone = !!done;
      this.checkMissions();
    }
    setUpgrades(list) {
      this.upgrades = new Set(list || []);
      this.upgradeRun = false;
      const labels = { scoop: 'Gầu to', pipe: 'Máng dẫn nước', cover: 'Mái che bể', filter: 'Bộ lọc nước' };
      const badge = document.getElementById('sim-active-upgrade-badge');
      if (badge) badge.textContent = this.upgrades.size ? [...this.upgrades].map(t => labels[t]).join(' · ') : 'Cối xoay nước cơ bản';
      this.log('ok', this.upgrades.size ? 'Đã gắn: ' + [...this.upgrades].map(t => labels[t]).join(', ') : 'Cối xoay nước cơ bản (chưa gắn thêm)');
    }
    has(t) {
      return this.upgrades.has(t);
    }
    setAdvanced(on) {
      on = !!on;
      if (this.advanced === on) return;
      this.advanced = on;
      this.stop(true);
      this.reset();
      this.proFills = 0;
      this.emit('mode', on);
      this.checkMissions();
    }
    cap() {
      return this.advanced ? CAP.pro : CAP.kid;
    }
    perRev() {
      let k = PER_REV;
      for (const u of this.upgrades) k *= BOOST[u] || 1;
      return k;
    }
    evapRate() {
      if (!this.advanced) return 0;
      let k = EVAP;
      for (const u of this.upgrades) k *= EVAP_K[u] || 1;
      return k;
    }
    // vòng/phút của gầu (qua bộ bánh răng)
    rpm() {
      return this.motorOn ? rpmOf(this.power) * GEAR : 0;
    }
    matchesSample() {
      return this.prog.length === SAMPLE.length && this.prog.every((b, i) => sig(b) === SAMPLE[i]);
    }
    // Sa bàn 3D: bánh gầu quay theo số vòng (chiều ngược khi đổi chiều động cơ)
    pose3d() {
      return { output: this.rev * Math.PI * 2, motor: 0 };
    }

    // ---------- chạy chương trình ----------
    advance(dt) {
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
          if (this.matchesSample() && !this.done.m2) {
            this.done.m2 = true;
            this.log('ok', 'Chương trình mẫu chạy đúng một vòng: tim → âm A → quay 3 giây → mặt cười → âm B → quay 3 giây.');
            this.checkMissions();
          }
          const r = this.prog.findIndex(x => x.type === 'repeatStart');
          this.pc = r < 0 ? this.prog.length : r + 1;
          // vòng lặp không có khối nào tốn thời gian: nhường khung hình sau
          if (r >= 0 && !this.prog.slice(r + 1).some(x => x.type === 'wait' || x.type === 'melody')) break;
          continue;
        }
        if (b.type === 'motor' || b.type === 'motor_power') {
          this.power = b.type === 'motor_power' ? Math.max(1, Math.min(8, b.power || 8)) : SPEED[b.speed] || 8;
          this.motorOn = true;
          this.pc++;
          continue;
        }
        if (b.type === 'motor_reverse') {
          this.dir = -this.dir;
          this.pc++;
          continue;
        }
        if (b.type === 'stop') {
          this.motorOn = false;
          this.pc++;
          continue;
        }
        if (b.type === 'display') {
          this.face = b.icon || 'smile';
          this.emit('face', this.face);
          this.pc++;
          continue;
        }
        if (b.type === 'wait' || b.type === 'melody') {
          if (!this.entered) {
            this.entered = true;
            this.blkT = 0;
            if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(this.pc);
            if (b.type === 'melody') {
              this.note = b.tune;
              if (window.SFX) window.SFX.melody(b.tune);
              this.emit('melody', b.tune);
            }
          }
          const dur = b.type === 'melody' ? MELODY_T : b.duration || 3;
          const need = dur - this.blkT;
          if (budget < need) {
            this.blkT += budget;
            this.integrate(budget);
            budget = 0;
            break;
          }
          this.integrate(need);
          budget -= need;
          this.entered = false;
          if (b.type === 'melody') this.note = null;
          this.pc++;
          continue;
        }
        this.pc++; // khối không dùng trong bài này: bỏ qua
      }
      if (budget > 0 && this.running) this.integrate(budget);
    }

    integrate(dt) {
      if (dt <= 0) return;
      this.runT += dt;
      let pumping = dt;
      // dân làng đang dùng nước: bể cạn dần, gầu vẫn quay nhưng nước chưa múc thêm
      if (this.drain > 0) {
        const d = Math.min(dt, this.drain);
        pumping -= d;
        this.water = Math.max(0, this.water - (this.cap() * d) / DRAIN_T);
        this.drain -= d;
        if (this.drain <= 0) {
          this.drain = 0;
          this.water = 0;
          this.emit('empty');
        }
      }
      if (this.motorOn) {
        const revs = (this.rpm() / 60) * dt;
        this.rev += revs * this.dir;
        if (revs > 0 && this.upgrades.size && !this.upgradeRun) {
          this.upgradeRun = true;
          this.checkMissions();
        }
        if (this.dir < 0) {
          if (!this.wrongWay) {
            this.wrongWay = true;
            this.log('warn', 'Gầu quay ngược chiều – nước chảy ngược xuống sông, bể không đầy.');
            this.emit('wrongWay');
          }
        } else if (pumping > 0) {
          this.water += (this.rpm() / 60) * pumping * this.perRev();
        }
      }
      const ev = this.evapRate();
      if (ev && pumping > 0 && this.water > 0) {
        const lost = Math.min(this.water, ev * pumping);
        this.water -= lost;
        this.evaporated += lost;
      }
      if (this.water >= this.cap() && this.drain <= 0) {
        this.water = this.cap();
        this.drain = DRAIN_T;
        this.done.m3 = true;
        this.lastRun = { secs: +this.runT.toFixed(1), power: this.power, advanced: this.advanced, liters: this.cap() };
        if (this.advanced) this.proFills++;
        this.log('ok', `Bể đầy ${this.cap()} lít sau ${this.runT.toFixed(1)} giây!`);
        this.emit('full', { secs: this.runT, fills: this.proFills });
        this.checkMissions();
      }
    }

    // Hết chương trình: động cơ dừng
    finish() {
      this.running = false;
      this.motorOn = false;
      this.note = null;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      if (this.water > 0 && this.water < this.cap() && this.drain <= 0) this.emit('partial', { water: this.water });
      this.log('info', 'Chương trình đã chạy xong.');
      this.emit('end');
      this.checkMissions();
    }

    checkMissions() {
      const m1 = this.assemblyDone;
      const m4 = this.upgrades.size > 0 && !!this.upgradeRun;
      if (this.onMissionUpdate)
        this.onMissionUpdate({
          m1, m2: this.done.m2, m3: this.done.m3, m4, m5: this.proFills >= 3,
          allDone: m1 && this.done.m2 && this.done.m3 && m4,
          upgrades: [...this.upgrades], lastRun: this.lastRun, fills: this.proFills
        });
    }

    updateUI() {
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.running ? 'Đang chạy' : 'Đã dừng';
        pill.dataset.k = this.running ? 'ok' : 'muted';
      }
      const set = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      const rpm = this.rpm();
      const vi = n => n.toFixed(1).replace('.', ',');
      set('m-rpm', `${Math.round(rpm)} <small>vòng/phút</small>`);
      set('m-rpm-note', this.motorOn ? `Mức ${this.power}/8 · ${this.dir > 0 ? 'đúng chiều' : 'ngược chiều'}` : 'Động cơ đang dừng');
      set('m-water', `${Math.round(this.water)} <small>lít</small>`);
      set('m-water-note', `Bể chứa ${this.cap()} lít`);
      set('m-flow', `${vi((rpm / 60) * this.perRev() * (this.dir > 0 ? 1 : 0))} <small>lít/giây</small>`);
      set('m-flow-note', this.advanced ? `Bay hơi −${vi(this.evapRate())} lít/giây` : 'Mỗi vòng gầu múc ' + vi(this.perRev()) + ' lít');
      set('m-face', this.face === 'heart' ? 'Trái tim' : this.face === 'smile' ? 'Mặt cười' : 'Trống');
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.running
          ? `Gầu quay ${Math.round(rpm)} vòng/phút, bể có ${Math.round(this.water)}/${this.cap()} lít.`
          : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const c1 = document.getElementById('calc-eq1');
      if (c1) c1.textContent = `Vòng/giây = vòng/phút ÷ 60. Nước mỗi giây = vòng/giây × ${vi(this.perRev())} lít.`;
      const c2 = document.getElementById('calc-eq2');
      if (c2) c2.textContent = `Ví dụ mức 8: 150 ÷ 60 = 2,5 vòng/giây → ${vi(2.5 * this.perRev())} lít/giây. Bể ${this.cap()} lít đầy sau khoảng ${vi(this.cap() / (2.5 * this.perRev() - this.evapRate()))} giây.`;
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

  WaterEngine.SPEED = rpmOf;
  WaterEngine.CAP = CAP;
  WaterEngine.PER_REV = PER_REV;
  window.WaterEngine = WaterEngine;
})();
