// Bài 3 – Robot thám hiểm Milo; bánh quay trực tiếp theo công suất 1–8.
(function () {
  'use strict';
  const MAX_RPM = 150, WHEEL_R = 2.5, TRACK_END = 150, B_KID = 80;
  const TOL = { kid: 6, pro: 4 };
  const B_CHOICES = [40, 50, 60, 70, 90, 100, 110, 120, 130];
  const FAST = 6;
  const SAMPLE = ['start', 'sensor_obstacle', 'motor', 'wait:3', 'stop'];
  const sig = b => (b.type === 'wait' ? 'wait:' + b.duration : b.type === 'motor_power' ? 'motor' : b.type);
  const speedOf = p => (2 * Math.PI * WHEEL_R * MAX_RPM * p) / 8 / 60;

  class RoverEngine extends window.LessonEngine {
    constructor() {
      super({
        sample: SAMPLE, sig,
        levels: { low: 4, medium: 8, high: 8 }, // Bài 3 cũ: ngoài low, mọi mức đều là 8
        labels: { bin: 'Thùng chở mẫu', antenna: 'Ăng-ten, đèn', solar: 'Pin mặt trời', arm: 'Tay gắp' },
        baseLabel: 'Robot cơ bản (chưa gắn thêm)',
        core: ['m1', 'm2', 'm3', 'm4'],
        touch: [] // cảm biến siêu âm dùng putHand thay cho cảm biến nút nhấn
      });
      this.done = { m2: false, m3: false, m4: false };
      this.bHits = new Set();
      this.bPos = B_KID;
      this.lastRun = null;
      // Các trường phụ trợ mới của lớp gốc không phải trạng thái công khai Bài 3.
      for (const key of ['runT', 'pressed', 'pressT', 'waitingPress', 'blkDur'])
        Object.defineProperty(this, key, { value: this[key], writable: true, configurable: true, enumerable: false });
      // Giữ thứ tự các trường trạng thái để snapshot JSON trước/sau tương đồng.
      const stateKeys = ['t', 'advanced', 'assemblyDone', 'bPos', 'loopActive', 'running',
        'pc', 'entered', 'blkT', 'motorOn', 'power', 'dir', 'x', 'rev', 'hand',
        'handUsed', 'waitingHand', 'sample', 'crashed', 'maxPower', 'driveT'];
      const stateValues = stateKeys.map(key => this[key]);
      stateKeys.forEach(key => delete this[key]);
      stateKeys.forEach((key, i) => { this[key] = stateValues[i]; });
    }
    resetState() {
      this.power = 8;
      this.x = 0;
      this.rev = 0;
      this.hand = false;
      this.handUsed = false;
      this.waitingHand = false;
      this.sample = true; // Mẫu cây, khác opts.sample (chương trình mẫu)
      this.crashed = false;
      this.maxPower = 0;
      this.driveT = 0;
    }
    log(kind, text) {
      this.runT = this.t; // Nhật ký cũ hiển thị thời gian vòng vẽ
      super.log(kind, text);
    }
    press() {} // Bài này dùng cảm biến vật cản; giữ press không có tác dụng.
    putHand() {
      this.hand = true;
      this.handT = 1.2;
      this.emit('hand');
    }
    stop(silent) {
      super.stop(silent);
      this.waitingHand = false;
    }
    setUpgrades(list) {
      super.setUpgrades(list);
      const badge = document.getElementById('sim-active-upgrade-badge');
      if (badge && !this.upgrades.size) badge.textContent = 'Robot cơ bản';
    }
    setAdvanced(on) {
      if (this.advanced === !!on) return;
      super.setAdvanced(on);
      this.bPos = this.advanced ? this.pickB() : B_KID;
      this.emit('target', this.bPos);
    }
    pickB() {
      const choices = B_CHOICES.filter(c => c !== this.bPos && !this.bHits.has(c));
      return (choices.length ? choices : B_CHOICES)[Math.floor(Math.random() * (choices.length || B_CHOICES.length))];
    }
    tol() { return this.advanced ? TOL.pro : TOL.kid; }
    speed() { return this.motorOn ? speedOf(this.power) * this.dir : 0; }
    matchesSample() { return super.matchesSample(SAMPLE); }
    pose3d() { return { output: -this.rev * Math.PI * 2, motor: 0, offset: [this.x * 0.002, 0, 0] }; }

    onMotor() {
      this.maxPower = Math.max(this.maxPower, this.power);
      this.noteUpgradeRun();
    }
    onBlock(b) {
      if (b.type !== 'sensor_obstacle') return 0;
      this.waitingHand = true;
      this.log('warn', 'Cảm biến siêu âm đang chờ vật cản – đưa tay trước mắt robot.');
      this.emit('waitHand');
      if (this.hand) {
        this.seeHand();
        return 0;
      }
      return Infinity;
    }
    seeHand() {
      this.waitingHand = false;
      this.handUsed = true;
      this.log('ok', 'Cảm biến thấy bàn tay!');
      this.emit('seen');
    }
    advance(dt) {
      if (this.hand && (this.handT -= dt) <= 0) this.hand = false;
      if (this.running && this.waitingHand && this.hand) {
        this.seeHand();
        this.blkDur = this.blkT; // Kết thúc khối cảm biến để lớp gốc chạy tiếp
      }
      super.advance(dt);
      if (this.waitingHand) this.blkT = 0; // Khối cảm biến cũ không cộng blkT
    }
    integrate(dt) {
      if (!this.motorOn || this.crashed) return;
      const v = this.speed();
      this.driveT += dt;
      if (this.sample && !this.has('bin') && this.power >= FAST) {
        this.sample = false;
        this.log('warn', `Mức ${this.power} nhanh quá – mẫu cây rơi khỏi robot!`);
        this.emit('drop', this.x);
      }
      this.x += v * dt;
      this.rev += (v * dt) / (2 * Math.PI * WHEEL_R);
      if (this.x < -10) this.x = -10;
      if (this.x >= TRACK_END) {
        this.x = TRACK_END;
        this.crashed = true;
        this.motorOn = false;
        this.log('warn', 'Robot chạy quá xa và đụng tảng đá cuối đường!');
        this.emit('crash');
        this.finish();
      }
    }
    finish() {
      // Bài 3 báo khối kết thúc trước kết quả giao hàng; engine chung báo sau.
      this.running = false;
      this.motorOn = false;
      if (this.onActiveBlockUpdate) this.onActiveBlockUpdate(-1);
      if (this.matchesSample() && this.handUsed && !this.done.m2) {
        this.done.m2 = true;
        this.log('ok', 'Chương trình mẫu chạy đúng: thấy tay → chạy nhanh 3 giây → dừng.');
      }
      const off = this.x - this.bPos;
      if (this.crashed) {
        // Đã phát crash.
      } else if (Math.abs(off) <= this.tol()) {
        if (this.sample) {
          this.done.m3 = true;
          this.lastRun = { power: this.maxPower, secs: +this.driveT.toFixed(1), b: this.bPos };
          this.log('ok', `Đã chở mẫu cây tới điểm B (${Math.round(this.x)} cm)!`);
          this.emit('deliver', { x: this.x, b: this.bPos });
          if (this.advanced) {
            this.bHits.add(this.bPos);
            const next = this.pickB();
            setTimeout(() => {
              if (this.running) return;
              this.bPos = next;
              this.emit('target', next);
            }, 1800);
          }
        } else {
          this.log('warn', 'Tới đúng điểm B nhưng mẫu cây đã rơi dọc đường.');
          this.emit('emptyArrive', { x: this.x });
        }
      } else if (this.x > 1) {
        this.log('info', off < 0 ? `Dừng cách B ${Math.round(-off)} cm – chưa tới.` : `Dừng quá B ${Math.round(off)} cm.`);
        this.emit(off < 0 ? 'short' : 'over', { x: this.x, off });
      }
      this.emit('end');
      this.checkMissions();
    }
    missionExtra() {
      return { m5: this.bHits.size >= 3, upgrades: [...this.upgrades], lastRun: this.lastRun, bHits: [...this.bHits] };
    }
    updateUI() {
      super.updateUI();
      const pill = document.getElementById('sim-status-pill');
      if (pill && this.waitingHand) {
        pill.textContent = 'Chờ vật cản';
        pill.dataset.k = 'warn';
      }
      const v = Math.abs(this.speed());
      this.set('m-speed', `${v.toFixed(1)} <small>cm/giây</small>`);
      this.set('m-speed-note', `Mức ${this.power}/8 · ${this.dir > 0 ? 'tiến' : 'lùi'}`);
      this.set('m-dist', `${Math.round(this.x)} <small>cm</small>`);
      this.set('m-target', `${this.bPos} <small>cm</small>`);
      this.set('m-target-note', `Dừng trong ±${this.tol()} cm`);
      this.set('m-sample', this.sample ? 'Còn' : 'Rơi');
      const desc = document.getElementById('sim-status-desc');
      if (desc) desc.textContent = this.waitingHand
        ? 'Robot đang chờ: đưa tay trước cảm biến siêu âm.'
        : this.running ? `Robot chạy ${v.toFixed(1)} cm/giây, đã đi ${Math.round(this.x)} cm.`
          : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const calc = document.getElementById('calc-eq1');
      if (calc) calc.textContent = 'Mức p → tốc độ = 39,3 × p / 8 cm/giây. Quãng đường = tốc độ × số giây.';
      const calc2 = document.getElementById('calc-eq2');
      if (calc2) calc2.textContent = `Ví dụ mức 8, Wait 2 giây: 39,3 × 2 ≈ 79 cm. Điểm B đang ở ${this.bPos} cm.`;
    }
  }
  RoverEngine.SPEED = speedOf;
  RoverEngine.TRACK_END = TRACK_END;
  RoverEngine.B_KID = B_KID;
  window.RoverEngine = RoverEngine;
})();
