// Bộ mô phỏng Lớp 3 · Bài 10 – Robot thám hiểm sao Hỏa (xe thám hiểm 1 động cơ + cảm biến sóng âm).
// Động cơ chạy tới (cw) / lùi (ccw); Low/Medium/High = mức 4/6/8 → 10 / 15 / 20 cm/giây trên sa bàn (thu nhỏ, không phải tốc độ thật).
// Cảm biến sóng âm đo khoảng cách tới tảng đá phía trước: khối "Chờ vật cản" chờ cho tới khi đá nằm trong tầm 15 cm (ăng-ten: gấp đôi).
// Thu mẫu: xe đứng yên 2 giây khi đá cách 3–tầm cảm biến (đủ gần, chưa chạm). Đâm vào đá (≤ 3 cm) thì hỏng. Xe có đà: chạy nhanh phanh xa hơn.
// Nâng cao: bão bụi (biết trước giờ) – cảm biến "mù" (gắn đèn pha thì vẫn thấy) và xe chạy trong bão bị lún cát,
// chạy quá lâu thì kẹt (bánh gai gấp đôi thời gian).
// Kế thừa LessonEngine chung để js/app.js dùng cùng giao diện mô phỏng.
(function () {
  'use strict';

  const LEVEL = { low: 4, medium: 6, high: 8 }; // mức chuẩn chung (js/lesson-engine.js)
  const NAME = { 4: 'chậm', 6: 'vừa', 8: 'nhanh' };
  const CMS = 2.5; // cm/giây cho mỗi mức tốc độ
  const ACCEL = 25; // cm/giây² (tăng/giảm tốc)
  const REACH = 15; // cm: tầm cảm biến sóng âm
  const NEAR = 3; // cm: gần hơn thế là đâm vào đá
  const SCAN = 2; // giây đứng yên để thu mẫu
  const STUCK_LIMIT = 1.5; // giây chạy trong bão bụi thì lún kẹt
  const TRACK = 170; // cm chiều dài đường thám hiểm
  const SOUND = 343; // m/giây
  const ROCKS = [
    { x: 50, name: 'đá đỏ' },
    { x: 100, name: 'đá xám' },
    { x: 150, name: 'đá xanh' }
  ];
  // Nâng cao: [đến giây, thời tiết]
  const WEATHER = [
    [10, 'clear'],
    [18, 'storm'],
    [Infinity, 'clear']
  ];
  const SAMPLE = ['start', 'repeatStart', 'motor:low:cw', 'sensor_obstacle', 'stop', 'wait:3', 'repeatEnd'];
  const sig = b => (b.type === 'motor' ? ['motor', b.speed, b.dir || 'cw'].join(':') : b.type === 'wait' ? 'wait:' + b.duration : b.type);

  class RoverEngine extends window.LessonEngine {
    constructor() {
      super({
        sample: SAMPLE, sig,
        labels: { dish: 'Ăng-ten', lamp: 'Đèn pha', wheels: 'Bánh gai' },
        baseLabel: 'Robot cơ bản', loopEndBeforeJump: true
      });
      this.done = { m2: false, m3: false, m5: false };
      // Các cờ cảm biến chạm của lớp gốc không thuộc trạng thái công khai của xe.
      for (const key of ['motorOn', 'power', 'dir', 'pressed', 'pressT', 'waitingPress', 'blkDur'])
        Object.defineProperty(this, key, { enumerable: false, writable: true, configurable: true, value: this[key] });
    }
    resetState() {
      // Giữ thứ tự thuộc tính công khai như bản cũ để ảnh chụp trace trùng khớp.
      const firstReset = !Object.prototype.hasOwnProperty.call(this, 'x');
      if (firstReset) delete this.runT;
      this.motor = { on: false, power: 0, dir: 1 };
      this.x = 0; // cm từ căn cứ
      this.v = 0; // cm/giây (có dấu)
      this.wheel = 0; // góc bánh xe (rad)
      if (firstReset) this.runT = 0;
      this.rocks = ROCKS.map(r => ({ ...r, scanT: 0, got: false }));
      this.loops = 0;
      this.stuckT = 0;
      this.crashed = false;
      this.crashWhy = '';
      this.stormSeen = false;
      this.hintT = -10;
    }
    onStart() {
      this.emit('weather', this.weather());
    }
    stop(silent) {
      super.stop(silent);
      this.motor.on = false;
    }
    // Xe dùng cảm biến khoảng cách, không nhận sự kiện nút đỏ.
    press() {}
    // Thời tiết hiện tại: { kind, next } – chế độ Bé luôn trời quang
    weather(t = this.runT) {
      if (!this.advanced) return { kind: 'clear', next: Infinity };
      const w = WEATHER.find(x => t < x[0]);
      return { kind: w[1], next: w[0] - t };
    }
    reach() {
      return REACH * (this.has('dish') ? 2 : 1);
    }
    stuckLimit() {
      return STUCK_LIMIT * (this.has('wheels') ? 2 : 1);
    }
    // Cảm biến "mù" trong bão bụi, trừ khi có đèn pha
    blind() {
      return this.weather().kind === 'storm' && !this.has('lamp');
    }
    nextRock() {
      return this.rocks.find(r => !r.got && r.x >= this.x - 0.01) || null;
    }
    // Khoảng cách (cm) tới tảng đá phía trước, null nếu hết đá
    distance() {
      const r = this.nextRock();
      return r ? Math.max(0, r.x - this.x) : null;
    }
    // Khoảng cách cảm biến đọc được (null khi mù / ngoài tầm)
    reading() {
      const d = this.distance();
      return d === null || this.blind() || d > this.reach() ? null : d;
    }
    got() {
      return this.rocks.filter(r => r.got).length;
    }
    targetSpeed() {
      return this.motor.on && !this.crashed ? this.motor.power * CMS * this.motor.dir : 0;
    }
    // Tư thế cho sa bàn 3D: bánh xe quay theo quãng đường đi được
    pose3d() {
      return { output: this.wheel };
    }

    onLoopEnd() {
      this.loops++;
      if (this.loops === 1 && this.matchesSample() && !this.done.m2) {
        this.done.m2 = true;
        this.log('ok', 'Đúng chương trình mẫu: chạy tới, cảm biến thấy đá thì dừng và thu mẫu.');
        this.emit('sampleDone');
        this.checkMissions();
      }
    }
    onMotor(b) {
      const mo = this.motor;
      mo.power = b.type === 'motor_power' ? Math.max(1, Math.min(8, b.power || 8)) : LEVEL[b.speed] || 8;
      if (b.type === 'motor') mo.dir = b.dir === 'ccw' ? -1 : 1;
      mo.on = true;
      this.log('info', `Động cơ chạy ${NAME[mo.power] || 'mức ' + mo.power}${mo.dir < 0 ? ', lùi lại' : ', tiến tới'}.`);
      this.noteUpgradeRun();
    }
    onStopBlock(wasOn) {
      if (wasOn) this.log('info', 'Động cơ dừng – xe trượt thêm một đoạn rồi đứng yên.');
      this.motor.on = false;
    }
    onReverse() { this.motor.dir = -this.motor.dir; }
    shouldYieldLoop() { return false; }
    isConditionWait(b) { return b.type === 'sensor_obstacle'; }
    onWaitEnter() { this.log('info', `Cảm biến siêu âm đang dò: chờ đá trong tầm ${this.reach()} cm.`); }
    waitDone() { return this.reading() !== null; }
    waitCheckAfterStep() { return false; }
    onWaitExit() {
      const d = this.reading();
      this.log('warn', `Cảm biến thấy đá cách ${d.toFixed(0)} cm phía trước!`);
      this.emit('seen', this.nextRock());
    }

    integrate(dt) {
      if (!this.running || dt <= 0) return;
      // chia nhỏ để không "nhảy" qua tảng đá khi chạy nhanh
      const n = Math.max(1, Math.ceil(dt / 0.02));
      for (let i = 0; i < n && this.running; i++) this.tick(dt / n);
    }
    tick(dt) {
      const before = this.weather();
      this.runT += dt;
      const w = this.weather();
      if (w.kind !== before.kind) {
        this.log(w.kind === 'storm' ? 'warn' : 'info', w.kind === 'storm' ? 'Bão bụi! Cảm biến bị mù, hãy dừng xe chờ bão tan.' : 'Bão bụi đã tan – chạy tiếp được.');
        this.emit('weather', w);
        if (w.kind === 'storm') this.stormSeen = true;
      }
      if (this.crashed) return;
      // đà: tốc độ tiến dần tới tốc độ đích
      const tv = this.targetSpeed(),
        dv = ACCEL * dt;
      this.v = Math.abs(tv - this.v) <= dv ? tv : this.v + Math.sign(tv - this.v) * dv;
      this.x = Math.max(0, Math.min(TRACK, this.x + this.v * dt));
      this.wheel += (this.v * dt) / 3;
      const moving = Math.abs(this.v) > 0.5;
      // Bão bụi: chạy trong bão thì lún cát
      if (w.kind === 'storm' && moving) {
        this.stuckT += dt;
        if (this.stuckT >= this.stuckLimit()) return this.fail('stuck', 'Xe chạy trong bão bụi bị lún cát, kẹt cứng! Hãy dừng xe khi bão tới.');
      } else this.stuckT = Math.max(0, this.stuckT - dt);
      const r = this.nextRock();
      if (!r) return;
      const d = r.x - this.x;
      if (d <= NEAR && this.v > 0) return this.fail('hit', 'Xe đâm vào tảng đá! Dùng khối “Chờ vật cản” rồi dừng xe trước khi tới đá.');
      if (!moving && !this.motor.on && !this.blind() && d > NEAR && d <= this.reach()) {
        r.scanT += dt;
        if (r.scanT >= SCAN) {
          r.got = true;
          this.log('ok', `Đã thu mẫu ${r.name}! (${this.got()}/3)`);
          this.emit('sample', { rock: r, count: this.got() });
          if (this.got() === ROCKS.length) this.allCollected();
        }
      } else {
        r.scanT = 0;
        // Gợi ý: xe đang chạy mà chưa dừng (mỗi 4 giây tối đa 1 lần)
        if (moving && d > NEAR && d <= this.reach() && this.motor.on && this.runT - this.hintT > 4) {
          this.hintT = this.runT;
          this.emit('miss', 'moving');
        }
      }
    }
    fail(why, text) {
      this.crashed = true;
      this.crashWhy = why;
      this.v = 0;
      this.log('warn', text);
      this.emit('crash', why);
    }
    allCollected() {
      this.best = { secs: +this.runT.toFixed(1) };
      this.done.m3 = true;
      if (this.advanced && this.stormSeen) this.done.m5 = true;
      this.log('ok', `Đã thu đủ 3 mẫu đá sau ${this.runT.toFixed(1)} giây!`);
      this.emit('allSaved', { secs: this.runT, storm: this.advanced && this.stormSeen });
      this.checkMissions();
    }

    finish() {
      super.finish();
      this.motor.on = false;
    }

    updateUI() {
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.crashed ? (this.crashWhy === 'stuck' ? 'Xe bị kẹt' : 'Xe bị hỏng') : this.running ? 'Đang thám hiểm' : 'Đã dừng';
        pill.dataset.k = this.crashed ? 'bad' : this.running ? 'ok' : 'muted';
      }
      const set = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      const w = this.weather(),
        d = this.reading();
      set('m-speed', `${Math.abs(this.v).toFixed(1)} <small>cm/giây</small>`);
      set('m-speed-note', this.motor.on ? 'Động cơ ' + (NAME[this.motor.power] || 'mức ' + this.motor.power) + (this.motor.dir < 0 ? ' · lùi' : '') : 'Động cơ dừng');
      set('m-dist', d === null ? '-- <small>cm</small>' : `${d.toFixed(0)} <small>cm</small>`);
      set('m-dist-note', this.blind() ? 'Bão bụi – cảm biến mù' : d === null ? 'Chưa thấy đá trong tầm' : d <= NEAR + 3 ? 'Rất gần!' : 'Thấy đá phía trước');
      set('m-saved', `${this.got()} <small>/ 3</small>`);
      set('m-weather', { clear: 'Trời quang', storm: 'Bão bụi' }[w.kind]);
      set('m-weather-note', this.advanced && Number.isFinite(w.next) ? `Đổi sau ${w.next.toFixed(0)} giây` : 'Ổn định');
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.crashed
          ? 'Xe thám hiểm gặp sự cố. Sửa chương trình rồi chạy lại.'
          : this.running
            ? `Đã thu ${this.got()}/3 mẫu. Xe cách căn cứ ${this.x.toFixed(0)} cm.`
            : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const c1 = document.getElementById('calc-eq1');
      if (c1) {
        const dd = Math.min(this.distance() === null ? REACH : this.distance(), this.reach());
        c1.textContent = `Cảm biến phát sóng âm (${SOUND} m/giây) rồi chờ tiếng dội. Đá cách ${dd.toFixed(0)} cm → sóng đi và về ${(2 * dd).toFixed(0)} cm, mất ${(((2 * dd) / 100 / SOUND) * 1000).toFixed(2)} mili giây.`;
      }
      const c2 = document.getElementById('calc-eq2');
      if (c2) c2.textContent = this.advanced
        ? `Bão bụi lúc 10–18 giây: cảm biến ${this.has('lamp') ? 'vẫn thấy nhờ đèn pha' : 'bị mù'}; xe chạy quá ${this.stuckLimit()} giây trong bão sẽ lún kẹt.`
        : `Thu mẫu khi đá cách ${NEAR}–${this.reach()} cm và xe đứng yên ${SCAN} giây. Xe chạy nhanh phải phanh xa hơn.`;
    }

  }

  RoverEngine.WEATHER = WEATHER;
  RoverEngine.ROCKS = ROCKS;
  RoverEngine.LIMITS = { NEAR, REACH, TRACK };
  window.RoverEngine = RoverEngine;
})();
