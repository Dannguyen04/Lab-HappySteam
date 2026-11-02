// Bộ mô phỏng Lớp 3 · Bài 8 – Giải cứu máy bay (giàn bay hai động cơ).
// M1 (đỉnh tháp) quay cần ngang → máy bay bay vòng quanh đài điều khiển. Low/Medium/High = mức 4/6/8 → 16/24/32 vòng/phút trên cảnh
// (chậm lại cho dễ nhìn, không phải tốc độ thật). M2 (chân tháp) quay trục vít 1 mối ăn bánh răng 24 răng (giảm 24 lần)
// → tay quay 1×2 → cụm trên bập bênh: độ cao = ½ − ½·cos(góc tay quay), 0 = thấp nhất, 1 = cao nhất. Trục vít tự hãm:
// M2 dừng thì máy bay giữ nguyên độ cao. Cứu người: máy bay đi ngang người gặp nạn khi bay THẤP (≤ 0,3) và CHẬM (M1 Low).
// Nâng cao: bão kéo tới theo lượt (biết trước giờ) – khi bão phải ở trên mây (độ cao ≥ 0,6), ở dưới mây quá lâu thì rơi.
// Kế thừa LessonEngine chung để js/app.js dùng cùng giao diện mô phỏng.
(function () {
  'use strict';

  const NAME = { 4: 'chậm', 6: 'vừa', 8: 'nhanh' };
  const ARM_RPM = 32; // vòng/phút của máy bay trên cảnh ở mức 8
  const MOTOR_RPM = 150; // động cơ mức 8
  const WORM = 24; // trục vít 1 mối + bánh răng 24 răng
  const LOW = 0.3, // độ cao tối đa để thả thang
    CLOUD = 0.6; // trong bão phải bay cao hơn mức này
  const SLOW = 4; // mức tốc độ M1 tối đa để thả thang (Low)
  const CATCH = 0.2; // rad: máy bay cách người gặp nạn ≤ 11° là ở ngay trên
  // Người gặp nạn: góc trên vòng bay (rad, 0 = bên phải, chiều kim đồng hồ trên cảnh), trong sương mù hay không
  const VICTIMS = [
    { a: 0.9, fog: false, where: 'trên thuyền' },
    { a: 2.9, fog: true, where: 'trong sương mù trên núi' },
    { a: 4.6, fog: false, where: 'trên bè cứu sinh' }
  ];
  const RADAR = 0.55, // rad quét phía trước máy bay; gói radar gấp đôi
    STORM_LIMIT = 1.5; // giây dưới mây trong bão thì rơi; gói cánh dài gấp đôi
  // Nâng cao: [đến giây, thời tiết]
  const WEATHER = [
    [9, 'clear'],
    [17, 'storm'],
    [29, 'clear'],
    [37, 'storm'],
    [Infinity, 'clear']
  ];
  const SAMPLE = ['start', 'repeatStart', 'M1:low:cw', 'M2:low:cw', 'wait:3', 'M1:high:cw', 'M2:high:cw', 'wait:3',
    'M1:low:ccw', 'M2:low:ccw', 'wait:3', 'M1:high:ccw', 'M2:high:ccw', 'wait:3', 'repeatEnd'];
  const sig = b => (b.type === 'motor' ? [b.port || 'M1', b.speed, b.dir || 'cw'].join(':') : b.type === 'wait' ? 'wait:' + b.duration : b.type);
  const TAU = Math.PI * 2;
  const wrap = a => ((a % TAU) + TAU) % TAU;

  class RescueEngine extends window.LessonEngine {
    constructor() {
      super({
        sample: SAMPLE, sig, touch: [],
        labels: { radar: 'Radar', light: 'Đèn pha', wings: 'Cánh dài' },
        baseLabel: 'Máy bay cơ bản'
      });
      this.done = { m2: false, m3: false, m5: false };
      // Các cờ dành cho động cơ một cổng và nút nhấn không thuộc trạng thái công khai của bài.
      for (const key of ['motorOn', 'power', 'dir', 'pressed', 'pressT', 'waitingPress', 'blkDur'])
        Object.defineProperty(this, key, { enumerable: false, writable: true, configurable: true, value: this[key] });
    }
    resetState() {
      const firstReset = !Object.prototype.hasOwnProperty.call(this, 'angle');
      if (firstReset) delete this.runT;
      this.m = { M1: { on: false, power: 0, dir: 1 }, M2: { on: false, power: 0, dir: 1 } };
      this.angle = 0; // góc máy bay trên vòng bay (rad)
      this.crank = Math.PI; // tay quay: bắt đầu ở độ cao cao nhất
      if (firstReset) this.runT = 0;
      this.victims = VICTIMS.map(v => ({ ...v, seen: false, saved: false, ladder: 0 }));
      this.loops = 0; // số lần chạy hết vòng lặp (NV2)
      this.belowT = 0;
      this.crashed = false;
      this.stormSeen = false;
      this.hint = { high: -10, fast: -10 };
    }
    onStart() {
      this.emit('weather', this.weather());
    }
    stop(silent) {
      this.m.M1.on = this.m.M2.on = false;
      super.stop(silent);
    }
    press() {}
    // Thời tiết hiện tại: { kind, next } – chế độ Bé luôn trời quang
    weather(t = this.runT) {
      if (!this.advanced) return { kind: 'clear', next: Infinity };
      const w = WEATHER.find(x => t < x[0]);
      return { kind: w[1], next: w[0] - t };
    }
    // Độ cao 0 (thấp nhất) … 1 (cao nhất)
    altitude() {
      return 0.5 - 0.5 * Math.cos(this.crank);
    }
    // vòng/phút của máy bay quanh tháp (có dấu theo chiều quay)
    armRpm() {
      const a = this.m.M1;
      return a.on && !this.crashed ? (ARM_RPM * a.power * a.dir) / 8 : 0;
    }
    // vòng/phút của tay quay (sau trục vít)
    crankRpm() {
      const b = this.m.M2;
      return b.on && !this.crashed ? (MOTOR_RPM * b.power * b.dir) / 8 / WORM : 0;
    }
    radarReach() {
      return RADAR * (this.has('radar') ? 2 : 1);
    }
    stormLimit() {
      return STORM_LIMIT * (this.has('wings') ? 2 : 1);
    }
    saved() {
      return this.victims.filter(v => v.saved).length;
    }
    // Tư thế cho sa bàn 3D: 'output' = cần quay (M1), 'tilt' = cụm trên nghiêng (M2, phóng đại ±8° cho dễ thấy)
    pose3d() {
      return { output: this.angle, tilt: (this.altitude() - 0.5) * 0.28 };
    }

    onLoopEnd() {
      this.loops++;
      if (this.loops === 1 && this.matchesSample() && !this.done.m2) {
        this.done.m2 = true;
        this.log('ok', 'Đúng chương trình mẫu: máy bay bay chậm, nhanh, rồi đổi chiều – và lên xuống theo M2.');
        this.emit('sampleDone');
        this.checkMissions();
      }
    }
    shouldYieldLoop() { return false; }
    onMotor(b) {
      const port = b.port || 'M1', mo = this.m[port];
      mo.power = this.power;
      mo.dir = b.dir === 'ccw' ? -1 : 1;
      mo.on = true;
      this.log('info', port === 'M1'
        ? `M1: máy bay bay ${NAME[mo.power] || 'mức ' + mo.power}${mo.dir < 0 ? ', ngược chiều' : ''}.`
        : `M2: trục vít quay ${NAME[mo.power] || 'mức ' + mo.power}${mo.dir < 0 ? ' ngược' : ''} – máy bay đổi độ cao.`);
      this.noteUpgradeRun();
    }
    onReverse() { this.m.M1.dir = -this.m.M1.dir; }
    onStopBlock() {
      if (this.m.M1.on || this.m.M2.on) this.log('info', 'Hai động cơ dừng – trục vít giữ máy bay ở độ cao này.');
      this.m.M1.on = this.m.M2.on = false;
    }

    integrate(dt) {
      if (!this.running || dt <= 0) return;
      // chia nhỏ để không "nhảy" qua người gặp nạn khi bay nhanh
      const n = Math.max(1, Math.ceil(dt / 0.02));
      for (let i = 0; i < n && this.running; i++) this.tick(dt / n);
    }
    tick(dt) {
      const before = this.weather();
      this.runT += dt;
      const w = this.weather();
      if (w.kind !== before.kind) {
        this.log(w.kind === 'storm' ? 'warn' : 'info', w.kind === 'storm' ? 'Bão tới! Bay lên trên mây.' : 'Trời quang – có thể hạ thấp để cứu người.');
        this.emit('weather', w);
        if (w.kind === 'storm') this.stormSeen = true;
      }
      if (this.crashed) return;
      this.angle = wrap(this.angle + (this.armRpm() / 60) * TAU * dt);
      this.crank += (this.crankRpm() / 60) * TAU * dt;
      const alt = this.altitude(),
        slow = this.m.M1.on && this.m.M1.power <= SLOW;
      // Bão: dưới mây quá lâu thì máy bay rung lắc rơi
      if (w.kind === 'storm' && alt < CLOUD) {
        this.belowT += dt;
        if (this.belowT >= this.stormLimit()) {
          this.crashed = true;
          this.log('warn', 'Máy bay bay thấp trong bão, rung lắc mạnh và phải hạ cánh khẩn cấp!');
          this.emit('crash');
          return;
        }
      } else this.belowT = Math.max(0, this.belowT - dt);
      for (const v of this.victims) {
        if (v.saved) continue;
        const diff = Math.abs(((v.a - this.angle + Math.PI * 3) % TAU) - Math.PI);
        const ahead = wrap((v.a - this.angle) * Math.sign(this.armRpm() || 1));
        // Radar quét phía trước máy bay; người trong sương mù chỉ hiện khi có đèn pha hoặc máy bay ở ngay trên
        if (!v.seen && ((ahead < this.radarReach() && (!v.fog || this.has('light'))) || diff < CATCH)) {
          v.seen = true;
          this.log('info', `Radar thấy người gặp nạn ${v.where}!`);
          this.emit('found', v);
        }
        if (diff >= CATCH || !this.m.M1.on) continue;
        const lowEnough = alt <= LOW * (v.fog && !this.has('light') ? 0.5 : 1);
        if (lowEnough && slow && w.kind !== 'storm') {
          v.ladder += dt;
          if (v.ladder >= 0.15) {
            v.saved = true;
            this.log('ok', `Đã thả thang cứu người ${v.where}! (${this.saved()}/3)`);
            this.emit('saved', { victim: v, count: this.saved() });
            if (this.saved() === 3) this.allSaved();
          }
        } else if (this.runT - (alt > LOW ? this.hint.high : this.hint.fast) > 4) {
          // Gợi ý vì sao chưa cứu được (mỗi loại tối đa 1 lần / 4 giây)
          if (alt > LOW) {
            this.hint.high = this.runT;
            this.log('warn', v.fog && !this.has('light') ? 'Sương mù dày: phải bay rất thấp (hoặc gắn đèn pha) mới thả thang được.' : 'Bay cao quá, chưa thả thang được – dùng M2 hạ thấp.');
            this.emit('miss', 'high');
          } else {
            this.hint.fast = this.runT;
            this.log('warn', w.kind === 'storm' ? 'Đang bão, chưa thả thang được.' : 'Bay nhanh quá, người gặp nạn không bám được thang – dùng M1 Low.');
            this.emit('miss', w.kind === 'storm' ? 'storm' : 'fast');
          }
        }
      }
    }
    allSaved() {
      this.best = { secs: +this.runT.toFixed(1) };
      this.done.m3 = true;
      if (this.advanced && this.stormSeen) this.done.m5 = true;
      this.log('ok', `Đã cứu đủ 3 người sau ${this.runT.toFixed(1)} giây!`);
      this.emit('allSaved', { secs: this.runT, storm: this.advanced && this.stormSeen });
      this.checkMissions();
    }

    finish() {
      this.m.M1.on = this.m.M2.on = false;
      super.finish();
    }

    updateUI() {
      const pill = document.getElementById('sim-status-pill');
      if (pill) {
        pill.textContent = this.crashed ? 'Hạ cánh khẩn cấp' : this.running ? 'Đang bay' : 'Đã dừng';
        pill.dataset.k = this.crashed ? 'bad' : this.running ? 'ok' : 'muted';
      }
      const set = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
      };
      const w = this.weather(),
        alt = this.altitude();
      set('m-speed', `${Math.abs(this.armRpm()).toFixed(0)} <small>vòng/phút</small>`);
      set('m-speed-note', this.m.M1.on ? 'M1 ' + (NAME[this.m.M1.power] || 'mức ' + this.m.M1.power) + (this.m.M1.dir < 0 ? ' · ngược' : '') : 'M1 dừng');
      set('m-alt', `${Math.round(alt * 100)} <small>%</small>`);
      set('m-alt-note', alt <= LOW ? 'Thấp – thả thang được' : alt >= CLOUD ? 'Cao – trên mây' : 'Lưng chừng');
      set('m-saved', `${this.saved()} <small>/ 3</small>`);
      set('m-weather', { clear: 'Trời quang', storm: 'Bão' }[w.kind]);
      set('m-weather-note', this.advanced && Number.isFinite(w.next) ? `Đổi sau ${w.next.toFixed(0)} giây` : 'Ổn định');
      const desc = document.getElementById('sim-status-desc');
      if (desc)
        desc.textContent = this.crashed
          ? 'Máy bay đã hạ cánh khẩn cấp. Sửa chương trình rồi chạy lại.'
          : this.running
            ? `Đã cứu ${this.saved()}/3 người. Độ cao ${Math.round(alt * 100)}%.`
            : 'Ghép khối lệnh rồi chạm Start để chạy.';
      const c1 = document.getElementById('calc-eq1');
      if (c1) c1.textContent = `Trục vít 1 mối quay ${WORM} vòng thì bánh răng 24 răng mới quay 1 vòng: M2 nhanh (150 vòng/phút) → tay quay ${(MOTOR_RPM / WORM).toFixed(2)} vòng/phút, mất ${(60 * WORM / MOTOR_RPM / 2).toFixed(1)} giây để từ cao nhất xuống thấp nhất.`;
      const c2 = document.getElementById('calc-eq2');
      if (c2) c2.textContent = this.advanced
        ? `Bão theo giờ: quang 0–9 giây, bão 9–17, quang 17–29, bão 29–37. Trong bão phải ở độ cao ≥ ${CLOUD * 100}% (dưới mây quá ${this.stormLimit()} giây sẽ rơi).`
        : `Thả thang được khi độ cao ≤ ${LOW * 100}% và M1 quay chậm (Low).`;
    }
  }

  RescueEngine.WEATHER = WEATHER;
  RescueEngine.VICTIMS = VICTIMS;
  RescueEngine.LIMITS = { LOW, CLOUD };
  window.RescueEngine = RescueEngine;
})();
