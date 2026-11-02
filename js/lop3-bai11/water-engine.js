// Bộ mô phỏng Lớp 3 · Bài 11 – Sống trên sao Hỏa: Tìm kiếm nguồn nước.
// Robot một động cơ quay trục hai bánh (không qua bánh răng): mức công suất p (1–8) → 150·p/8 vòng/phút, bánh bán kính
// 2,5 cm nên mức 8 ≈ 39 cm/giây. Robot chạy thẳng trên đường từ căn cứ (0 cm); trên đường có 3 mỏm băng chứa nước.
// Cảm biến trên cột cao nhìn phía trước: khối "Chờ vật cản" đi tiếp khi một mỏm băng chưa lấy nước cách mũi robot ≤ 15 cm.
// Máy bơm hút nước khi robot ĐỨNG YÊN trong tầm 15 cm của mỏm băng: bơm liên tục 3 giây (máy bơm mạnh: 1,5 giây) là
// lấy xong một mẫu (2 lít, có bồn chứa: 3 lít). Chạy tiếp trước khi bơm xong thì phải bơm lại từ đầu.
// Nâng cao: đường dài hơn, mỏm băng ở chỗ mới, phải lấy đủ 3 mẫu trong 17 giây (chạy chậm ≈ 18,4 giây – phải nhanh hơn).
// Cùng giao diện với SimulationEngine của Bài 9 để js/app.js dùng chung.
(function () {
  'use strict';

  const MAX_RPM = 150;
  const WHEEL_R = 2.5; // cm
  const SENSE = 15; // cm: cảm biến thấy mỏm băng ở gần hơn mức này; máy bơm cũng chỉ với tới xa chừng đó
  const PUMP = 3; // giây bơm liên tục để đầy một mẫu; máy bơm mạnh: một nửa
  const LITERS = 2; // lít mỗi mẫu; có bồn chứa: 3 lít
  const KID = { sites: [50, 110, 170], end: 220 }; // cm từ căn cứ
  const PRO = { sites: [60, 130, 200], end: 240, limit: 17 }; // giây
  const SAMPLE = ['start', 'repeatStart', 'motor:low', 'sensor_obstacle', 'stop', 'wait:3', 'repeatEnd'];
  const sig = b => b.type === 'wait' ? 'wait:' + (b.duration || 3)
    : b.type === 'motor' ? 'motor:' + (b.speed || 'high')
      : b.type === 'motor_power' ? 'motor:power:' + (b.power || 8) : b.type;
  const speedOf = p => (2 * Math.PI * WHEEL_R * MAX_RPM * p) / 8 / 60; // cm/giây
  const NAME = { 4: 'chậm', 6: 'vừa', 8: 'nhanh' }; // mức chuẩn 4/6/8

  class WaterEngine extends window.LessonEngine {
    constructor() {
      super({
        sample: SAMPLE,
        sig,
        labels: { tank: 'Bồn chứa nước', pump: 'Máy bơm mạnh', solar: 'Pin mặt trời' },
        baseLabel: 'Robot cơ bản',
        touch: [], loopEndBeforeJump: true, advanceGuard: 60
      });
      this.done = { m2: false, m3: false, m5: false };
      // Thuộc tính nội bộ của lớp gốc, không có trong trạng thái công khai trước đây.
      Object.defineProperty(this, 'blkDur', { enumerable: false, writable: true, configurable: true, value: this.blkDur });
    }
    course() {
      return this.advanced ? PRO : KID;
    }
    resetState() {
      // Lớp gốc đặt power = 0; bài này dùng 8 khi robot chưa chạy.
      this.power = 8;
      // Bài dò vật cản bằng khoảng cách, không sử dụng trạng thái nút nhấn.
      delete this.pressed;
      delete this.pressT;
      delete this.waitingPress;
      // Snapshot cũ ghi x/rev trước runT; giữ thứ tự trường ngay lần reset đầu.
      const firstReset = !Object.prototype.hasOwnProperty.call(this, 'x');
      if (firstReset) delete this.runT;
      this.x = 0; // cm từ căn cứ
      this.rev = 0; // số vòng bánh (cho hình bánh quay)
      if (firstReset) this.runT = 0;
      this.loops = 0;
      this.walled = false;
      this.late = false;
      this.idleT = 0;
      this.sites = this.course().sites.map(a => ({ a, seen: false, pump: 0, done: false, passed: false, short: false }));
    }
    // Giữ API nút nhấn là no-op như bài gốc; cảm biến chỉ dò vật cản.
    press() {}
    setUpgrades(list) {
      super.setUpgrades(list);
      if (!this.upgrades.size) {
        // Giữ nguyên lời ghi nhật ký cũ, trong khi nhãn badge vẫn là "Robot cơ bản".
        this.logs.shift();
        this.log('ok', 'Robot cơ bản (chưa gắn thêm)');
      }
    }
    pumpTime() {
      return PUMP / (this.has('pump') ? 2 : 1);
    }
    literPer() {
      return LITERS + (this.has('tank') ? 1 : 0);
    }
    speed() {
      return this.motorOn ? speedOf(this.power) * this.dir : 0;
    }
    got() {
      return this.sites.filter(s => s.done).length;
    }
    liters() {
      return this.got() * this.literPer();
    }
    limit() {
      return this.advanced ? PRO.limit : Infinity;
    }
    // Mỏm băng chưa lấy nước gần nhất ở phía trước trong tầm cảm biến (hoặc null)
    seen() {
      return this.sites.find(s => !s.done && s.a - this.x >= 0 && s.a - this.x <= SENSE) || null;
    }
    // Tư thế cho sa bàn 3D: bánh quay theo quãng đường, cả robot dời theo trục +X (thu nhỏ để không ra khỏi khung)
    pose3d() {
      return { output: -this.rev * Math.PI * 2, motor: 0, offset: [this.x * 0.0015, 0, 0] };
    }

    shouldYieldLoop(r, end, budget) { return budget <= 0; }
    onMotorBefore(b) {
      this.dir = b.dir === 'ccw' ? -1 : 1;
      this.setMotor(true);
    }
    isConditionWait(b) { return b.type === 'sensor_obstacle'; }
    onWaitEnter() { this.idleT = 0; }
    waitDone() { return this.seen() !== null; }
    waitStep(b, budget) { return Math.min(0.02, budget); }
    onWaitExit() {
      const found = this.seen();
      found.seen = true;
      this.log('ok', `Cảm biến thấy mỏm băng cách ${(found.a - this.x).toFixed(0)} cm!`);
      this.emit('found', found);
    }

    onLoopEnd() {
      this.loops++;
      if (this.loops === 1 && this.matchesSample() && !this.done.m2) {
        this.done.m2 = true;
        this.log('ok', 'Đúng chương trình mẫu: chạy, cảm biến thấy mỏm băng thì dừng và bơm 3 giây.');
        this.emit('sampleDone');
        this.checkMissions();
      }
    }
    onMotor() {
      this.log('info', `Động cơ chạy ${NAME[this.power] || 'mức ' + this.power}: ${speedOf(this.power).toFixed(1)} cm/giây.`);
      this.noteUpgradeRun();
    }
    onStopBlock() {
      this.setMotor(false);
    }

    // Bật/tắt động cơ; bật khi đang bơm dở thì bơm phải làm lại từ đầu
    setMotor(on) {
      if (on && !this.motorOn) {
        for (const s of this.sites)
          if (!s.done && s.pump > 0) {
            s.pump = 0;
            if (!s.short) {
              s.short = true;
              this.log('warn', 'Robot chạy đi khi chưa bơm đủ thời gian – nước chưa lấy được, phải bơm lại từ đầu.');
              this.emit('miss', 'short');
            }
          }
      }
      this.motorOn = on;
    }

    integrate(dt) {
      if (!this.running || dt <= 0) return;
      const n = Math.max(1, Math.ceil(dt / 0.02));
      for (let i = 0; i < n && this.running; i++) this.tick(dt / n);
    }
    tick(dt) {
      this.runT += dt;
      if (this.motorOn) {
        const v = speedOf(this.power) * this.dir;
        this.x += v * dt;
        this.rev += (v * dt) / (2 * Math.PI * WHEEL_R);
        if (this.x < 0) {
          this.x = 0;
          this.motorOn = false;
        }
        const end = this.course().end;
        if (this.x >= end) {
          this.x = end;
          this.motorOn = false;
          if (!this.walled) {
            this.walled = true;
            this.log('warn', 'Hết đường – tới vách núi, robot dừng lại.');
            this.emit('wall');
          }
        }
      }
      for (const s of this.sites) {
        const d = s.a - this.x;
        if (!s.passed && !s.done && d < -SENSE) {
          s.passed = true;
          this.log('warn', 'Robot đã đi qua mỏm băng mà chưa bơm nước. Hãy dừng ngay khi cảm biến thấy.');
          this.emit('miss', 'pass');
        }
        if (s.done || this.motorOn) continue;
        if (d >= 0 && d <= SENSE) {
          if (s.pump === 0) this.emit('pumpStart', s);
          s.pump += dt;
          if (s.pump >= this.pumpTime() - 1e-6) {
            s.done = true;
            this.log('ok', `Bơm xong mẫu nước ${this.got()}/3 (+${this.literPer()} lít)!`);
            this.emit('pumped', { site: s, count: this.got() });
            if (this.got() === this.sites.length) {
              this.allSampled();
              return;
            }
          }
        }
      }
      if (this.advanced && !this.late && this.runT > PRO.limit) {
        this.late = true;
        this.log('warn', 'Quá 17 giây mà chưa lấy đủ nước – chạy nhanh hơn hoặc bơm mạnh hơn!');
        this.emit('late');
      }
    }
    allSampled() {
      const secs = +this.runT.toFixed(1);
      this.best = { secs, liters: this.liters() };
      this.done.m3 = true;
      const inTime = this.advanced && this.runT <= PRO.limit + 1e-6;
      if (inTime) this.done.m5 = true;
      this.log('ok', `Đã lấy đủ nước sau ${secs} giây: ${this.liters()} lít!${inTime ? ' Kịp thời gian thi đấu.' : ''}`);
      this.emit('allSampled', { secs, liters: this.liters(), inTime });
      this.finish();
    }

    updateUI() {
      super.updateUI();
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.running ? (this.motorOn ? 'Đang chạy' : 'Đang bơm / chờ') : 'Đã dừng';
        pill.dataset.k = this.running ? 'ok' : 'muted';
      }
      const lim = this.limit();
      this.set('m-speed', `${Math.abs(this.speed()).toFixed(0)} <small>cm/giây</small>`);
      this.set('m-speed-note', this.motorOn ? 'Mức ' + this.power + (this.dir < 0 ? ' · lùi' : '') : 'Động cơ dừng');
      this.set('m-dist', `${this.x.toFixed(0)} <small>cm</small>`);
      const nxt = this.sites.find(s => !s.done);
      this.set('m-dist-note', nxt ? `Mỏm băng kế tiếp ở ${nxt.a} cm` : 'Đã lấy đủ nước');
      this.set('m-water', `${this.got()} <small>/ 3 mẫu</small>`);
      this.set('m-water-note', `${this.liters()} lít nước`);
      this.set('m-time', `${this.runT.toFixed(0)} <small>giây</small>`);
      this.set('m-time-note', Number.isFinite(lim) ? `Thi đấu: tối đa ${lim} giây` : 'Không giới hạn');
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.running
          ? `Đã lấy ${this.got()}/3 mẫu nước. Robot ở ${this.x.toFixed(0)} cm.`
          : this.done.m3 && this.best
            ? `Đã lấy đủ nước sau ${this.best.secs} giây.`
            : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const c1 = document.getElementById('calc-eq1');
      if (c1) c1.textContent = `Quãng đường = tốc độ × thời gian. Mức 3 chạy ${speedOf(3).toFixed(1)} cm/giây, mức 8 chạy ${speedOf(8).toFixed(1)} cm/giây (bánh bán kính ${WHEEL_R} cm, động cơ 150 vòng/phút ở mức 8).`;
      const c2 = document.getElementById('calc-eq2');
      if (c2) {
        const t = this.pumpTime();
        c2.textContent = this.advanced
          ? `Thi đấu: mỏm băng ở ${PRO.sites.join(', ')} cm, cần xong trong ${PRO.limit} giây. Thời gian = đi (≈ ${PRO.sites[2] - SENSE} cm ÷ tốc độ) + 3 lần bơm × ${t} giây.`
          : `Dừng cách mỏm băng không quá ${SENSE} cm và bơm liên tục ${t} giây thì lấy được ${this.literPer()} lít.`;
      }
    }

  }

  WaterEngine.KID = KID;
  WaterEngine.PRO = PRO;
  WaterEngine.SENSE = SENSE;
  window.WaterEngine = WaterEngine;
})();
