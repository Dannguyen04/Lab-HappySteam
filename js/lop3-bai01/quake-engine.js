// Bộ mô phỏng Bài 1 lớp 3 – Cấu trúc bền vững – Phòng thí nghiệm động đất. Phần chung (chạy khối, vòng lặp, nhật ký, nhiệm vụ) ở js/lesson-engine.js;
// ở đây chỉ viết vật lý của mô hình và cách chấm m2, m3, m5.
(function () {
  'use strict';

  // Giáo án: 9 vị trí khối (Start, Lặp, 3 motor ngược, 3 Wait, Hết lặp).
  const MAX_RPM = 150;
  const SAMPLE = ['start', 'repeatStart', 'motor:low:ccw', 'wait:3',
    'motor:medium:ccw', 'wait:3', 'motor:high:ccw', 'wait:3', 'repeatEnd'];
  const AFTERSHOCKS = [1, 2, 1]; // ba đợt kiểm định, không ngẫu nhiên để học sinh đối chiếu được
  const sig = b => b.type === 'motor' ? `motor:${b.speed}:${b.dir || 'cw'}`
    : b.type === 'wait' ? `wait:${Number(b.duration)}` : b.type;

  class QuakeEngine extends window.LessonEngine {
    constructor() {
      super({ sample: SAMPLE, sig, loopEndBeforeJump: true, stopTimedOnFinish: true,
        labels: { brace: 'Giằng tam giác', damper: 'Con lắc giảm chấn', columns: 'Cột gia cường', pads: 'Đệm chân móng' },
        baseLabel: 'Bàn rung địa chấn cơ bản', core: ['m1', 'm2', 'm3', 'm4'] });
      this.done = { m2: false, m3: false, m5: false };
      this.proRound = 0;
      this.reset();
    }
    resetState() {
      this.rev = 0;
      this.shake = 0;
      this.highSecs = 0;
      this.stability = 100;
      this.failed = false;
      this.reason = '';
      this.loops = 0;
    }
    rpm() {
      return this.motorOn ? (MAX_RPM * this.power) / 8 : 0;
    }
    pose3d() {
      // Kết nối drive khi metadata của build có khai báo; dữ liệu gốc bài 01 hiện chưa có drive.
      return { output: this.rev * Math.PI * 2, motor: this.rev * Math.PI * 2 };
    }
    onMotor(b) {
      this.dir = b.dir === 'ccw' ? -1 : 1;
      this.emit('speed', { level: this.power, dir: this.dir });
      this.noteUpgradeRun();
    }
    onStopBlock() {
      this.emit('speed', 0);
    }
    // Khung chương trình phải giữ nguyên; M3 chỉ chỉnh Wait ngay sau motor nhanh.
    matchesGoal(seconds) {
      const goal = [...SAMPLE];
      goal[7] = 'wait:' + seconds;
      return this.matchesSample(goal);
    }
    onLoopEnd() {
      this.loops++;
      if (this.loops === 1 && this.matchesSample() && !this.done.m2) {
        this.done.m2 = true;
        this.log('ok', 'Hoàn tất vòng mẫu đúng ba tốc độ, ngược chiều kim đồng hồ.');
        this.emit('sampleDone');
      }
      const required = this.advanced ? AFTERSHOCKS[Math.min(this.proRound, 2)] : 1;
      const ok = this.matchesGoal(required) && this.stability >= 35;
      if (ok) {
        if (required === 1) this.done.m3 = true;
        if (this.advanced) {
          this.proRound++;
          this.emit('roundPass', { round: this.proRound, total: 3, next: AFTERSHOCKS[this.proRound] });
          if (this.proRound >= AFTERSHOCKS.length) {
            this.done.m5 = true;
            this.emit('advancedDone');
          }
        } else this.emit('safe');
        this.best = { seconds: required, stability: Math.round(this.stability), rounds: this.proRound };
        this.log('ok', `Nhà trụ vững sau cấp nhanh ${required}s. Độ ổn định ${this.stability.toFixed(0)}%.`);
      } else {
        this.failed = true;
        const actual = this.prog[7]?.type === 'wait' ? Number(this.prog[7].duration) : null;
        this.reason = !this.matchesGoal(actual) ? 'sequence'
          : actual > required ? 'overload' : actual < required ? 'insufficient' : 'instability';
        const message = this.reason === 'sequence' ? 'Khối lệnh hoặc chiều quay khác mẫu, hãy kiểm tra lại.'
          : this.reason === 'overload' ? 'Rung nhanh quá lâu: ngôi nhà mất ổn định và nghiêng đổ.'
            : this.reason === 'insufficient' ? 'Đợt dư chấn chưa được kiểm định đủ nhịp, hãy tăng Wait cuối.'
              : 'Kết cấu chưa đủ vững để vượt qua kiểm định.';
        this.log('warn', message);
        this.emit('miss', { reason: this.reason, message });
      }
      this.checkMissions();
      this.finish(); // chỉ một vòng; lượt nâng cao tiếp theo chạy lại sau khi đổi Wait
    }
    integrate(dt) {
      if (!this.running) return;
      this.runT += dt;
      this.rev += ((this.rpm() / 60) * dt * this.dir);
      this.shake = this.motorOn ? Math.sin(this.rev * Math.PI * 2) * (this.power / 8) : 0;
      if (this.motorOn && this.power === 8) this.highSecs += dt;
      // Minh họa độ bền: rung nấc nhanh tích lũy mỏi, bốn phụ kiện đều giúp giảm hao hụt.
      const protection = ['brace', 'damper', 'columns', 'pads'].filter(k => this.has(k)).length;
      this.stability = Math.max(0, Math.min(100, 100 - this.highSecs * Math.max(16, 25 - protection * 2)));
    }
    updateUI() {
      super.updateUI();
      const state = document.getElementById('sim-status-pill');
      if (state) {
        state.textContent = this.failed ? 'Nhà không đạt' : this.running ? 'Đang kiểm định' : this.loops ? 'Đã kiểm định' : 'Sẵn sàng';
        state.dataset.k = this.failed ? 'warn' : this.running ? 'ok' : 'muted';
      }
      this.set('m-speed', `${this.motorOn ? this.power : 0} <small>/8</small>`);
      this.set('m-speed-note', this.motorOn ? `${this.power === 4 ? 'Nhẹ' : this.power === 6 ? 'Vừa' : 'Mạnh'} · M1 ngược chiều` : 'Động cơ đã dừng');
      this.set('m-quake', `${Math.round(Math.abs(this.shake) * 100)} <small>%</small>`);
      this.set('m-quake-note', `Nhịp nhanh đã chạy ${this.highSecs.toFixed(1)} giây`);
      this.set('m-stability', `${this.stability.toFixed(0)} <small>%</small>`);
      this.set('m-stability-note', this.failed ? 'Không qua kiểm định' : 'Đang theo dõi độ bền');
      this.set('m-time', `${this.runT.toFixed(1)} <small>giây</small>`);
      this.set('m-time-note', this.advanced ? `Dư chấn ${Math.min(this.proRound + 1, 3)}/3 · cần Wait cuối ${AFTERSHOCKS[Math.min(this.proRound, 2)]}s` : 'M3: Wait cuối 1 giây');
      this.set('calc-eq1', `Động cơ ba cấp: 4/8 → 6/8 → 8/8. Đã rung nấc mạnh ${this.highSecs.toFixed(1)} giây.`);
      this.set('calc-eq2', this.advanced ? `Lượt dư chấn ${Math.min(this.proRound + 1, 3)}/3: đặt Wait cuối ${AFTERSHOCKS[Math.min(this.proRound, 2)]} giây rồi thử lại.` : 'Mẫu Wait cuối 3 giây khiến nhà đổ; đổi thành 1 giây để vượt kiểm định.');
      const desc = document.getElementById('sim-status-desc');
      if (desc) desc.textContent = this.failed ? 'Nhà chưa qua kiểm định. Đọc nhật ký và chỉnh Wait cuối.'
        : this.done.m5 ? 'Đã vượt cả ba lượt dư chấn!' : `Độ ổn định ${this.stability.toFixed(0)}%. ${this.advanced ? 'Đợt ' + (Math.min(this.proRound + 1, 3)) + '/3 yêu cầu ' + AFTERSHOCKS[Math.min(this.proRound, 2)] + ' giây.' : ''}`;
    }
  }

  QuakeEngine.SAMPLE = SAMPLE;
  QuakeEngine.AFTERSHOCKS = AFTERSHOCKS;
  window.QuakeEngine = QuakeEngine;
})();
