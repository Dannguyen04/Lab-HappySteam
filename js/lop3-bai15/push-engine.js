// Lớp 3 · Bài 15: robot hai chân đẩy xe hàng (một động cơ M1). Phần chung (chạy khối, vòng lặp, nhiệm vụ) ở js/lesson-engine.js.
// Đơn vị: cm và giây. Tốc độ xe = mức động cơ × 2,5 cm/giây (chậm 10, vừa 15, nhanh 20). Xem docs/giao-viec/thiet-ke-lop3-bai15.md.
(function () {
  'use strict';

  const STEP = 2.5; // cm/giây cho mỗi mức động cơ
  const TOL = 5; // sai số dừng quanh vạch (cm); đầu đẩy rộng +1
  const CYCLE = 6; // xe tiến 6 cm thì hai chân bước đủ một chu kì
  const WHEEL = 0.12; // rad bánh xe quay cho mỗi cm (khớp với dời mô hình 3D 0,0015 m/cm)
  const LIMIT = 125; // hết đường đua
  const M2_DISTANCE = 30; // chạy mẫu đủ 30 cm (5 chu kì chân) thì tính là chạy đúng mẫu
  const BASIC = { line: 80, load: 'light', k: 1 };
  const ROUNDS = [
    { line: 80, load: 'light', k: 1 },
    { line: 45, load: 'heavy', k: 0.75 },
    { line: 100, load: 'light', k: 1 }
  ];
  const SAMPLE = ['start', 'repeatStart', 'motor:high', 'repeatEnd'];
  const MESSAGES = {
    short: 'Xe dừng chưa tới vạch. Hãy cho động cơ chạy lâu hơn: quãng đường = tốc độ × thời gian.',
    over: 'Xe đã vượt vạch đích. Thêm khối Chờ rồi khối Dừng để dừng đúng lúc.',
    nostop: 'Chương trình kết thúc nhưng chưa có khối Dừng, động cơ vẫn quay và xe lao quá vạch.'
  };

  class PushEngine extends window.LessonEngine {
    constructor() {
      super({
        sample: SAMPLE,
        labels: { wideHead: 'Đầu đẩy rộng', brace: 'Thanh chống', backStop: 'Khung chặn hàng', tray: 'Khay chở thùng' },
        baseLabel: 'Robot đẩy xe cơ bản'
      });
      this.done = { m2: false, m3: false, m5: false };
    }

    resetState() {
      this.round = this.round || 0; // lượt Nâng cao được giữ qua các lần bấm Start
      this.x = 0; // quãng đường xe đã đi (cm)
      this.rev = 0; // số chu kì bước chân
      this.result = null; // 'ok' | 'short' | 'over' | 'nostop'
      this.reason = '';
      this.stopX = null;
    }
    // Lượt hiện tại: Nâng cao có ba lượt tải khác nhau, bình thường chỉ có vạch 80 cm
    course() {
      const c = this.advanced ? ROUNDS[this.round] : BASIC;
      const heavyK = this.has('brace') ? 0.85 : c.k;
      return { line: c.line, load: c.load, k: c.load === 'heavy' ? heavyK : c.k };
    }
    tolerance() {
      return TOL + (this.has('wideHead') ? 1 : 0);
    }
    speed() {
      return this.motorOn ? this.power * STEP * this.course().k * this.dir : 0;
    }
    setAdvanced(on) {
      this.round = 0;
      super.setAdvanced(on);
    }
    pose3d() {
      return { output: -this.rev * Math.PI * 2, wheel: -this.x * WHEEL, offset: [this.x * 0.0015, 0, 0] };
    }

    onMotor() {
      this.noteUpgradeRun();
      this.emit('speed', this.speed());
    }
    // Khối Dừng: lần dừng đầu tiên quyết định kết quả của lượt chạy
    onStopBlock(wasOn) {
      if (!wasOn || this.result) return;
      const c = this.course();
      this.stopX = this.x;
      if (Math.abs(this.x - c.line) <= this.tolerance()) this.succeed(c);
      else this.fail(this.x < c.line ? 'short' : 'over');
      this.finish();
    }
    fail(reason) {
      if (this.result) return;
      this.result = reason;
      this.reason = MESSAGES[reason];
      this.log('warn', this.reason);
      this.emit('miss', { reason, message: this.reason, x: this.x, line: this.course().line });
    }
    succeed(c) {
      this.result = 'ok';
      const round = this.advanced ? this.round + 1 : 0;
      this.log('ok', `Xe dừng cách vạch ${Math.abs(this.x - c.line).toFixed(1)} cm: đúng vạch ${c.line} cm!`);
      this.emit('arrived', { x: this.x, line: c.line, round, secs: +this.runT.toFixed(1) });
      if (!this.advanced || this.round === 0) this.done.m3 = true;
      if (this.advanced) {
        if (this.round === ROUNDS.length - 1) {
          this.done.m5 = true;
          this.best = { secs: +this.runT.toFixed(1), rounds: ROUNDS.length };
          this.round = 0;
        } else {
          this.round++;
          this.emit('nextRound', { round: this.round + 1, line: ROUNDS[this.round].line, load: ROUNDS[this.round].load });
        }
      }
      this.checkMissions();
    }
    finish() {
      // Chạy hết chương trình mà động cơ còn quay: chưa có khối Dừng
      if (this.running && this.motorOn && this.x > 0 && !this.result) this.fail('nostop');
      super.finish();
    }

    integrate(dt) {
      if (!this.running || dt <= 0) return;
      const n = Math.max(1, Math.ceil(dt / 0.02));
      for (let i = 0; i < n && this.running; i++) {
        const d = dt / n;
        this.runT += d;
        if (!this.motorOn || this.result) continue;
        const before = this.x;
        this.x = Math.max(0, this.x + this.speed() * d);
        this.rev += Math.abs(this.x - before) / CYCLE;
        if (!this.done.m2 && this.matchesSample() && this.x >= M2_DISTANCE) {
          this.done.m2 = true;
          this.log('ok', 'Chương trình chạy đúng như trong sách.');
          this.emit('sampleDone');
          this.checkMissions();
        }
        const c = this.course();
        if (this.x > c.line + this.tolerance() || this.x > LIMIT) {
          this.stopX = this.x;
          this.fail('over');
          this.finish();
        }
      }
    }

    updateUI() {
      super.updateUI();
      const c = this.course();
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.result && this.result !== 'ok' ? 'Chưa đúng vạch' : this.result === 'ok' ? 'Đúng vạch' : this.motorOn ? 'Đang đẩy xe' : this.running ? 'Đang đợi' : 'Đã dừng';
        pill.dataset.k = this.result && this.result !== 'ok' ? 'warn' : this.running || this.result === 'ok' ? 'ok' : 'muted';
      }
      this.set('m-speed', `${Math.abs(this.speed()).toFixed(1)} <small>cm/giây</small>`);
      this.set('m-speed-note', this.motorOn ? `Mức ${this.power}${c.load === 'heavy' ? ' · xe chở nặng' : ''}` : 'Động cơ đã dừng');
      this.set('m-dist', `${this.x.toFixed(1)} <small>cm</small>`);
      this.set('m-dist-note', this.result === 'ok' ? 'Dừng đúng vạch' : `Còn ${Math.max(0, c.line - this.x).toFixed(1)} cm tới vạch`);
      this.set('m-line', `${c.line} <small>cm</small>`);
      this.set('m-line-note', this.advanced ? `Lượt ${this.round + 1}/3 · tải ${c.load === 'heavy' ? 'nặng' : 'nhẹ'}` : `Sai số ±${this.tolerance()} cm`);
      this.set('m-time', `${this.runT.toFixed(1)} <small>giây</small>`);
      const desc = document.getElementById('sim-status-desc');
      if (desc) desc.textContent = this.result && this.result !== 'ok' ? this.reason : this.result === 'ok' ? 'Xe đã dừng đúng vạch đích!' : `Xe ở ${this.x.toFixed(0)} cm, vạch đích ${c.line} cm.`;
      this.set('calc-eq1', `Mức 4: ${4 * STEP} cm/giây; mức 6: ${6 * STEP}; mức 8: ${8 * STEP}. Quãng đường = tốc độ × thời gian.`);
      this.set('calc-eq2', `Vạch ở ${c.line} cm, sai số ±${this.tolerance()} cm${c.load === 'heavy' ? '; xe nặng chỉ đi ' + Math.round(c.k * 100) + '% tốc độ' : ''}.`);
    }
  }
  PushEngine.SAMPLE = SAMPLE;
  PushEngine.STEP = STEP;
  PushEngine.TOL = TOL;
  PushEngine.ROUNDS = ROUNDS;
  window.PushEngine = PushEngine;
})();
