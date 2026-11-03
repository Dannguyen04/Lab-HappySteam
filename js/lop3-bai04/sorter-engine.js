// Trạm phân loại Alpha330: cảm biến màu, M1 quay cần gạt và bốn túi qua hai vòng lặp.
// Kết quả là tất định để học sinh có thể so sánh 1 giây với 0,5 giây.
(function () {
  'use strict';
  const SAMPLE = [
    'start', 'repeatStart', 'sensor_color_red', 'melody:Do', 'motor:M1:low:ccw',
    'wait:1', 'stop', 'sensor_color_blue', 'melody:Mi', 'motor:M1:low:cw',
    'wait:1', 'stop', 'repeatEnd'
  ];
  const sig = b => b.type === 'motor'
    ? `motor:${b.port || 'M1'}:${b.speed || 'high'}:${b.dir || 'cw'}`
    : b.type === 'motor_power' ? `motor_power:${b.power}`
      : b.type === 'melody' ? `melody:${b.tune}`
        : b.type === 'wait' ? `wait:${Number(b.duration || 3)}` : b.type;

  class SorterEngine extends window.LessonEngine {
    constructor() {
      super({ sample: SAMPLE, sig, labels: {
        funnel: 'Phễu dẫn hướng', paddedArm: 'Tay gạt có đệm',
        lids: 'Nắp ngăn tự đóng', tray: 'Khay hứng tràn'
      }, baseLabel: 'Trạm phân loại cơ bản', touch: [], loopEndBeforeJump: true,
      stopTimedOnFinish: true, advanceGuard: 60 });
      this.done = { m2: false, m3: false, m5: false };
    }
    resetState() {
      this.bags = ['red', 'blue', 'red', 'blue'].map((color, i) => ({ id: i + 1, color, state: 'incoming' }));
      this.nextIndex = 0;
      this.loops = 0;
      this.scanned = null;
      this.motorPort = null;
      this.motorSeconds = 0;
      this.armAngle = 0;
      this.failed = false;
      this.reason = '';
      this.lastBag = null;
      this.melodies = [];
      this.arrival = 0;
    }
    got() { return this.bags.filter(b => b.state === 'sorted').length; }
    missed() { return this.bags.filter(b => b.state === 'fallen' || b.state === 'caught').length; }
    current() { return this.bags[this.nextIndex] || null; }
    pose3d() { return { output: this.armAngle * Math.PI / 180, tilt: 0, offset: [0, 0, 0] }; }
    press() {} // Dùng cảm biến màu, không cần nút chạm.
    onStart() { this.noteUpgradeRun(); }
    isConditionWait(b) { return b.type === 'sensor_color_red' || b.type === 'sensor_color_blue'; }
    waitDone(b) {
      const bag = this.current();
      const color = b.type === 'sensor_color_red' ? 'red' : 'blue';
      return !!bag && bag.color === color && this.arrival <= 0;
    }
    onWaitEnter() { this.blkT = 0; }
    waitStep(b, budget) { return Math.min(.02, budget); }
    onWaitExit(b) {
      const bag = this.current();
      if (!bag) return;
      this.scanned = bag;
      bag.state = 'scanned';
      this.emit('scan', { color: bag.color, id: bag.id });
      this.log('info', `Mắt màu nhận túi ${bag.id}: ${bag.color === 'red' ? 'đỏ' : 'xanh'}.`);
    }
    onMotor(b) {
      this.motorPort = b.port || 'M1';
      this.dir = b.dir === 'ccw' ? -1 : 1;
      this.motorSeconds = 0;
      this.noteUpgradeRun();
    }
    onStopBlock(wasOn) {
      if (!wasOn) return;
      const bag = this.scanned;
      this.motorOn = false;
      const expected = bag?.color === 'red' ? -1 : 1;
      const needed = this.advanced ? .5 : bag?.color === 'red' ? 1 : .5;
      const duration = this.motorSeconds;
      const valid = !!bag && this.motorPort === 'M1' && this.power === 4 && this.dir === expected
        && Math.abs(duration - needed) <= .065;
      this.armAngle = valid ? expected * 65 : Math.max(-125, Math.min(125, this.dir * duration * 110));
      if (bag) {
        bag.state = valid ? 'sorted' : this.has('tray') ? 'caught' : 'fallen';
        bag.angle = this.armAngle;
        this.lastBag = bag;
        this.emit(valid ? 'sorted' : 'miss', { color: bag.color, id: bag.id, caught: bag.state === 'caught' });
        if (valid) this.log('ok', `Túi ${bag.id} vào đúng ngăn ${bag.color === 'red' ? 'trái' : 'phải'}.`);
      }
      if (!valid) {
        this.failed = true;
        this.reason = !bag ? 'sensor' : this.motorPort !== 'M1' || this.dir !== expected ? 'direction'
          : this.power !== 4 ? 'speed' : 'timing';
        this.log('warn', !bag ? 'Chưa có túi tại mắt màu để gạt.'
          : `Túi ${bag.id} trượt khỏi ngăn! ${bag.color === 'red' ? 'Đỏ' : 'Xanh'} cần M1 quay ${expected < 0 ? 'ngược' : 'thuận'} ở mức chậm trong ${needed} giây.`);
      }
      if (bag) this.nextIndex++;
      this.scanned = null;
      this.motorPort = null;
      this.motorSeconds = 0;
      this.arrival = this.advanced ? .10 : .25;
    }
    onLoopEnd() {
      this.loops++;
      if (this.loops === 1 && this.matchesSample()) {
        this.done.m2 = true;
        this.emit('sampleDone');
      }
      if (this.loops >= 2 || this.nextIndex >= 4) {
        if (this.got() === 4 && !this.failed) {
          this.done.m3 = true;
          if (this.advanced) this.done.m5 = true;
          this.best = { secs: +this.runT.toFixed(1), sorted: 4 };
          this.emit('allSorted', this.best);
        }
        this.finish();
      } else this.checkMissions();
    }
    onTimedEnter(b) { if (b.type === 'melody') this.melodies.push(b.tune); }
    integrate(dt) {
      if (!this.running || dt <= 0) return;
      this.runT += dt;
      if (this.arrival > 0) this.arrival = Math.max(0, this.arrival - dt);
      if (this.motorOn && this.motorPort === 'M1') {
        this.motorSeconds += dt;
        this.armAngle = Math.max(-125, Math.min(125, this.dir * this.motorSeconds * 100 * this.power / 4));
      }
      if (this.entered && this.isConditionWait(this.prog[this.pc]) && this.blkT >= 3) {
        this.failed = true;
        this.reason = 'sensor';
        const bag = this.current();
        if (bag) { bag.state = this.has('tray') ? 'caught' : 'fallen'; this.lastBag = bag; }
        this.log('warn', 'Mắt màu không khớp túi đang đến. Kiểm tra thứ tự khối cảm biến đỏ và xanh.');
        this.emit('miss', { reason: 'sensor' });
        this.finish();
      }
    }
    updateUI() {
      super.updateUI();
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.failed ? 'Túi bị trượt' : this.motorOn ? 'M1 đang gạt' : this.running ? 'Mắt màu hoạt động' : 'Đã dừng';
        pill.dataset.k = this.failed ? 'warn' : this.running ? 'ok' : 'muted';
      }
      this.set('m-sorted', `${this.got()} <small>/ 4 túi</small>`);
      this.set('m-missed', `${this.missed()} <small>túi</small>`);
      this.set('m-angle', `${Math.round(this.armAngle)}<small>°</small>`);
      this.set('m-time', `${this.runT.toFixed(1)} <small>giây</small>`);
      const desc = document.getElementById('sim-status-desc');
      if (desc) desc.textContent = this.failed ? 'Có túi trượt khỏi ngăn, kiểm tra chiều và thời gian gạt.'
        : this.done.m3 ? 'Cả bốn túi đã vào đúng ngăn!' : `Đã phân loại đúng ${this.got()}/4 túi.`;
      this.set('calc-eq1', 'Đỏ → M1 chậm ngược, xanh → M1 chậm thuận. Gạt đúng = chiều quay + thời gian phù hợp.');
      this.set('calc-eq2', this.advanced ? 'Dòng rác nhanh: mỗi lượt gạt 0,5 giây.' : 'Dòng rác thường: đỏ 1 giây, xanh 0,5 giây.');
    }
  }
  SorterEngine.SAMPLE = SAMPLE;
  SorterEngine.sig = sig;
  window.SorterEngine = SorterEngine;
})();
