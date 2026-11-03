// Bộ mô phỏng Lớp 3 · Bài 5 – Xe đổ rác (một động cơ M1 truyền qua bánh răng tới bánh sau, không cảm biến).
// Low / Medium / High = mức 4 / 6 / 8 → 1 / 1,5 / 2 m/giây (thu nhỏ cho dễ nhìn, không phải tốc độ thật).
// Phố dài 0–7,5 m: ô gom rác ở 5,5–6,5 m, dải chắn cuối phố ở 7,5 m. Dừng motor lúc tải nhẹ thì xe đứng ngay.
// Nâng cao: sau khi đỗ đúng ô lúc tải nhẹ (NV3), lượt chạy kế tiếp xe chở đầy rác nặng – dừng motor xe còn trôi
// (giảm tốc 1 m/giây²: ở High trôi thêm 2 m) nên phải rút ngắn thời gian chạy. Cùng giao diện LessonEngine để js/app.js dùng chung.
(function () {
  'use strict';

  const NAME = { 4: 'chậm', 6: 'vừa', 8: 'nhanh' };
  const UNIT = 0.25; // m/giây cho mỗi mức: mức 8 → 2 m/giây
  const WHEEL_R = 0.03; // bán kính bánh xe (m) – để quay bánh trên cảnh
  const CELL = [5.5, 6.5]; // ô gom rác
  const WALL = 7.5; // dải chắn cuối phố
  const HEAVY_DECEL = 1; // m/giây² khi dừng motor lúc chở nặng
  const SAMPLE = ['start', 'repeatStart', 'motor:high', 'repeatEnd'];

  class GarbageTruckEngine extends window.LessonEngine {
    constructor() {
      super({
        sample: SAMPLE,
        touch: [],
        labels: { ben: 'Thùng ben', plow: 'Tấm gạt', lid: 'Nắp khoang', divider: 'Vách ngăn' },
        baseLabel: 'Xe thu gom cơ bản'
      });
      this.done = { m2: false, m3: false, m5: false };
    }
    resetState() {
      this.x = 0; // vị trí xe (m)
      this.v = 0; // vận tốc (m/giây, có dấu)
      this.decel = 1e9; // độ giảm tốc khi tắt motor
      this.wheel = 0; // góc bánh xe (rad)
      this.loops = 0;
      this.crashed = false;
      this.parked = false;
      this.over = false;
      this.stopped = false;
      this.warned = false;
      this.heavy = this.advanced && !!this.done.m3; // lượt nặng: sau khi NV3 đạt
    }
    onStart() {
      if (this.heavy) this.log('warn', 'Lượt này xe chở đầy rác nặng: dừng motor xe còn trôi thêm.');
    }
    press() {}
    inCell() {
      return this.x >= CELL[0] - 1e-6 && this.x <= CELL[1] + 1e-6;
    }
    target() {
      return this.motorOn ? this.power * UNIT * this.dir : 0;
    }
    pose3d() {
      return { output: this.wheel };
    }

    onLoopEnd() {
      this.loops++;
      if (this.loops === 1 && this.matchesSample() && !this.done.m2) {
        this.done.m2 = true;
        this.log('ok', 'Đúng chương trình mẫu: xe chạy nhanh liên tục.');
        this.emit('sampleDone');
        this.checkMissions();
      }
    }
    onMotor() {
      this.v = this.target();
      this.stopped = false;
      this.log('info', `M1: xe chạy ${NAME[this.power] || 'mức ' + this.power}${this.dir < 0 ? ', lùi' : ''}.`);
      this.noteUpgradeRun();
    }
    onReverse() {
      if (this.motorOn) this.v = this.target();
    }
    onStopBlock(wasOn) {
      if (!wasOn) return;
      this.stopped = true;
      this.decel = this.heavy ? HEAVY_DECEL : 1e9;
      if (!this.heavy) this.v = 0;
      this.log('info', this.heavy ? 'Motor dừng – xe nặng còn trôi thêm.' : 'Motor dừng – xe đứng yên.');
    }
    onProgramEnd() {
      // Hết khối mà motor còn chạy thì xe cứ chạy tiếp tới khi đâm dải chắn; xe đứng yên rồi mới chấm điểm
      if (!this.motorOn && this.v === 0) this.settle();
    }

    integrate(dt) {
      if (!this.running || dt <= 0) return;
      this.runT += dt;
      const n = Math.max(1, Math.ceil(dt / 0.02));
      for (let i = 0; i < n && this.running; i++) this.tick(dt / n);
    }
    tick(dt) {
      if (this.over) return;
      let move = 0;
      if (this.motorOn) {
        this.v = this.target();
        move = this.v * dt;
      } else if (this.v !== 0) {
        // tắt motor: tải nhẹ đứng ngay, tải nặng giảm tốc dần
        const s = Math.sign(this.v),
          a = Math.abs(this.v),
          t = Math.min(dt, a / this.decel);
        move = s * (a * t - 0.5 * this.decel * t * t);
        this.v = a - this.decel * t <= 1e-9 ? 0 : s * (a - this.decel * t);
      }
      this.x = Math.max(0, this.x + move);
      this.wheel += move / WHEEL_R;
      if (!this.warned && this.v > 0 && this.x >= WALL - 1.5 && this.x < WALL) {
        this.warned = true;
        this.log('warn', 'Sắp tới dải chắn cuối phố! Hãy dừng motor đúng ô xanh.');
        this.emit('warn', 'wall');
      }
      if (this.x >= WALL) {
        this.x = WALL;
        this.v = 0;
        this.crashed = true;
        this.over = true;
        this.log('warn', 'Xe vượt ô gom rác và đâm vào dải chắn!');
        this.emit('crash', this.x);
        this.finish();
        return;
      }
      if (this.stopped && !this.motorOn && this.v === 0) this.settle();
    }
    // Xe đã đứng yên: chấm đỗ xe
    settle() {
      if (this.over) return;
      this.over = true;
      const secs = +this.runT.toFixed(1);
      if (this.inCell()) {
        this.parked = true;
        this.best = { secs, heavy: this.heavy };
        if (this.heavy) this.done.m5 = true;
        else this.done.m3 = true;
        this.log('ok', `Xe đỗ đúng ô gom rác${this.heavy ? ' dù chở nặng' : ''} sau ${secs} giây!`);
        this.emit('park', { secs, heavy: this.heavy });
      } else {
        this.log('warn', `Xe dừng ở ${this.x.toFixed(1)} m, ${this.x < CELL[0] ? 'chưa tới' : 'đã quá'} ô gom rác (5,5–6,5 m).`);
        this.emit('short', this.x);
      }
      this.finish();
    }

    updateUI() {
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.crashed ? 'Xe đâm dải chắn' : this.parked ? 'Đã đỗ đúng ô' : this.running ? 'Đang chạy' : 'Đã dừng';
        pill.dataset.k = this.crashed ? 'bad' : this.running || this.parked ? 'ok' : 'muted';
      }
      this.set('m-distance', `${this.x.toFixed(1)} <small>m</small>`);
      this.set('m-distance-note', this.inCell() ? 'Đang ở ô gom rác' : this.x >= WALL ? 'Chạm dải chắn' : 'Ô gom rác ở 5,5–6,5 m');
      this.set('m-speed', `${Math.abs(this.v).toFixed(1)} <small>m/s</small>`);
      this.set('m-speed-note', this.motorOn ? 'M1 ' + (NAME[this.power] || 'mức ' + this.power) + (this.dir < 0 ? ' · lùi' : '') : 'M1 dừng');
      this.set('m-time', `${this.runT.toFixed(1)} <small>giây</small>`);
      this.set('m-time-note', this.running ? 'Đang di chuyển' : 'Thời gian di chuyển');
      this.set('m-load', this.heavy ? 'Đầy' : 'Nhẹ');
      this.set('m-load-note', this.heavy ? 'Dừng motor xe còn trôi thêm' : this.advanced ? 'Đỗ đúng ô để chuyển sang lượt chở nặng' : 'Chở đầy trôi phanh xa hơn');
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.crashed
          ? 'Xe vượt quá ô gom rác. Rút ngắn thời gian chạy hoặc thêm khối Dừng.'
          : this.parked
            ? 'Xe đã đỗ đúng ô gom rác!'
            : this.running
              ? `Xe ở ${this.x.toFixed(1)} m.`
              : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const c1 = document.getElementById('calc-eq1');
      if (c1) c1.textContent = `Quãng đường = tốc độ × thời gian. Low ${4 * UNIT} · Medium ${6 * UNIT} · High ${8 * UNIT} m/giây: ở High chạy 3 giây đi ${8 * UNIT * 3} m, đúng giữa ô gom rác (5,5–6,5 m).`;
      const c2 = document.getElementById('calc-eq2');
      if (c2)
        c2.textContent = this.advanced
          ? `Chở nặng: dừng motor xe còn trôi thêm v² ÷ 2 ÷ ${HEAVY_DECEL} = ${(8 * UNIT * 8 * UNIT) / (2 * HEAVY_DECEL)} m ở High. Chạy 2 giây (4 m) + trôi 2 m = 6 m, vừa ô gom rác.`
          : `Dải chắn cuối phố ở ${WALL} m: chạy High quá 3,75 giây là đâm vào dải chắn.`;
    }
  }

  GarbageTruckEngine.LIMITS = { CELL, WALL, UNIT, HEAVY_DECEL };
  window.GarbageTruckEngine = GarbageTruckEngine;
})();
