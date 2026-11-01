// Thư viện tranh phẳng dùng chung cho mọi bài Lab-HappySteam (window.ZMArt).
// Tương thích Chrome cũ trên máy tính bảng: IIFE độc lập, chỉ dùng mã màu hex/rgba, không dùng Math.random().
(function () {
  'use strict';

  var W0 = 900, H0 = 560, GY0 = 430, LINE = 2.6;

  // Bảng màu chuẩn hệ thống ZM Alpha 330 & cảnh thiên nhiên (tương phản cao, phân biệt bằng độ sáng)
  var C = {
    ink: '#1e2a34',
    inkSoft: '#455a64',
    paper: '#ffffff',
    paperWarm: '#fff9ee',
    hole: '#dfe6ec',
    sky: '#def0fc',
    skyTop: '#4faaf0',
    skyStorm: '#283848',
    grass: '#6db843',
    grassLight: '#8cc152',
    grassDark: '#3c6328',
    sand: '#f2d398',
    sandDark: '#c89d54',
    snow: '#eef6fc',
    snowShade: '#b7d4ea',
    mars: '#d96b43',
    marsDark: '#9e3b18',
    road: '#576574',
    sea: '#2980b9',
    seaDeep: '#154360',
    water: '#29b6f6',
    waterDeep: '#0277bd',
    accent: '#3dc1dc',
    accentDark: '#0e6f8a',
    accentLight: '#8ee6f5',
    warn: '#e53935',
    warnDark: '#b71c1c',
    ok: '#43a047',
    gold: '#ffd23f',
    orange: '#ff8a3d',
    wood: '#8d6e63',
    rock: '#64748b'
  };

  function rr(c, x, y, w, h, r) {
    c.beginPath();
    if (typeof c.roundRect === 'function') {
      c.roundRect(x, y, w, h, r);
      return;
    }
    var rad = Array.isArray(r) ? (r[0] || 0) : (Number(r) || 0);
    rad = Math.min(rad, w / 2, h / 2);
    c.moveTo(x + rad, y);
    c.arcTo(x + w, y, x + w, y + h, rad);
    c.arcTo(x + w, y + h, x, y + h, rad);
    c.arcTo(x, y + h, x, y, rad);
    c.arcTo(x, y, x + w, y, rad);
    c.closePath();
  }

  function strokeFill(c, fill, stroke, lw) {
    if (fill) { c.fillStyle = fill; c.fill(); }
    c.strokeStyle = stroke || C.ink;
    c.lineWidth = lw || LINE;
    c.stroke();
  }

  // =========================================================================
  // 1. CẢNH NỀN & THỜI TIẾT
  // =========================================================================
  function sky(c, W, H, o) {
    if (typeof W === 'object') { o = W; W = W0; H = H0; }
    W = W || W0; H = H || H0; o = o || {};
    var w = o.weather || 'calm', t = o.t || 0;
    c.save();
    var g = c.createLinearGradient(0, 0, 0, H);
    var pal = {
      calm: ['#4faaf0', '#93d3fc', '#def0fc'],
      light: ['#63bbf8', '#a5dcff', '#e3f4ff'],
      strong: ['#748b9c', '#9fb3c2', '#c5d5e2'],
      rain: ['#546e7a', '#78909c', '#b0bec5'],
      storm: ['#1c2436', '#283848', '#465669'],
      snow: ['#78aed8', '#a4cceb', '#dcecf8']
    }[w] || ['#4faaf0', '#93d3fc', '#def0fc'];
    g.addColorStop(0, pal[0]); g.addColorStop(0.65, pal[1]); g.addColorStop(1, pal[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    var spd = w === 'storm' || w === 'strong' ? 55 : 16;
    cloud(c, ((t * spd + 110) % (W + 180)) - 90, H * 0.16, { scale: 0.75, storm: w === 'storm' || w === 'rain' });
    cloud(c, ((t * spd * 0.8 + 560) % (W + 180)) - 90, H * 0.23, { scale: 0.6, storm: w === 'storm' });
    if (w === 'storm' && ((t % 4.5) > 3.6 && (t % 4.5) < 4.0)) {
      c.fillStyle = 'rgba(235,245,255,0.45)'; c.fillRect(0, 0, W, H);
      c.strokeStyle = C.gold; c.lineWidth = 3.5; c.beginPath();
      c.moveTo(W * 0.48, 30); c.lineTo(W * 0.44, 110); c.lineTo(W * 0.49, 150); c.lineTo(W * 0.43, 250);
      c.stroke();
    }
    c.restore();
  }

  function ground(c, W, H, gy, o) {
    if (typeof gy === 'object') { o = gy; gy = GY0; }
    W = W || W0; H = H || H0; gy = gy || GY0; o = o || {};
    var k = o.kind || 'grass', t = o.t || 0;
    var map = {
      grass: [C.grassLight, C.grass, C.grassDark],
      sand: ['#fae3b4', C.sand, C.sandDark],
      snow: [C.paper, C.snow, C.snowShade],
      mars: ['#e88862', C.mars, C.marsDark],
      road: ['#90a4ae', C.road, '#37474f'],
      sea: ['#4fa9d8', C.sea, C.seaDeep]
    }[k] || [C.grassLight, C.grass, C.grassDark];
    c.save();
    c.beginPath(); c.moveTo(0, gy);
    c.bezierCurveTo(W * 0.25, gy - 38, W * 0.55, gy - 14, W, gy - 32);
    c.lineTo(W, gy); c.closePath();
    strokeFill(c, map[0], C.ink, LINE);
    var g = c.createLinearGradient(0, gy, 0, H);
    g.addColorStop(0, map[1]); g.addColorStop(1, map[2]);
    c.fillStyle = g; c.fillRect(0, gy, W, H - gy);
    c.beginPath(); c.moveTo(0, gy); c.lineTo(W, gy); strokeFill(c, null, C.ink, 3);
    if (k === 'road') {
      c.strokeStyle = C.gold; c.lineWidth = 4; c.setLineDash([28, 20]);
      c.beginPath(); c.moveTo(0, gy + (H - gy) * 0.5); c.lineTo(W, gy + (H - gy) * 0.5); c.stroke();
    } else if (k === 'sea') {
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 2.5;
      for (var i = 0; i < 6; i++) {
        var wx = ((i * 160 + t * 45) % (W + 100)) - 50, wy = gy + 22 + (i % 3) * 26;
        c.beginPath(); c.arc(wx, wy, 18, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
      }
    } else if (k === 'grass') {
      c.strokeStyle = C.grassDark; c.lineWidth = 2.2; c.lineCap = 'round';
      for (var gx = 35; gx < W; gx += 65) {
        var sw = Math.sin(t * 3 + gx) * 3;
        c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx - 4 + sw, gy - 10);
        c.moveTo(gx, gy); c.lineTo(gx + 3 + sw, gy - 12); c.stroke();
      }
    }
    c.restore();
  }

  function sun(c, x, y, o) {
    x = x !== undefined ? x : 130; y = y !== undefined ? y : 90; o = o || {};
    var r = o.r || 26, t = o.t || 0;
    c.save(); c.translate(x, y);
    var halo = c.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.5);
    halo.addColorStop(0, 'rgba(255,220,80,0.55)'); halo.addColorStop(1, 'rgba(255,220,80,0)');
    c.fillStyle = halo; c.beginPath(); c.arc(0, 0, r * 2.5, 0, Math.PI * 2); c.fill();
    c.save(); c.rotate(t * 0.25);
    c.strokeStyle = C.gold; c.lineWidth = 3.2; c.lineCap = 'round';
    for (var i = 0; i < 8; i++) {
      c.beginPath(); c.moveTo(0, r + 6); c.lineTo(0, r + 15); c.stroke();
      c.rotate(Math.PI / 4);
    }
    c.restore();
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); strokeFill(c, C.gold, C.ink, LINE);
    c.lineCap = 'round'; c.lineWidth = 2;
    c.beginPath(); c.arc(-r * 0.32, -2, 3, Math.PI, 0); c.moveTo(r * 0.2, -2); c.arc(r * 0.32, -2, 3, Math.PI, 0);
    c.moveTo(-r * 0.25, 5); c.arc(0, 4, r * 0.28, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke();
    c.restore();
  }

  function cloud(c, x, y, o) {
    x = x !== undefined ? x : 220; y = y !== undefined ? y : 85; o = o || {};
    var s = o.scale || 1, st = !!o.storm;
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath();
    c.arc(-28, 4, 18, Math.PI * 0.5, Math.PI * 1.55);
    c.arc(-6, -12, 24, Math.PI * 0.95, Math.PI * 1.9);
    c.arc(22, -6, 20, Math.PI * 1.15, Math.PI * 1.95);
    c.arc(40, 4, 15, Math.PI * 1.5, Math.PI * 0.5);
    c.closePath();
    strokeFill(c, st ? '#465669' : C.paper, C.ink, LINE / s);
    c.restore();
  }

  function rain(c, W, H, o) {
    if (typeof W === 'object') { o = W; W = W0; H = H0; }
    W = W || W0; H = H || H0; o = o || {};
    var t = o.t || 0, n = Math.round(48 * (o.strength || 1));
    c.save();
    c.strokeStyle = 'rgba(210,235,255,0.75)'; c.lineWidth = 2; c.lineCap = 'round';
    for (var i = 0; i < n; i++) {
      var rx = ((i * 73 + t * 320) % (W + 80)) - 40;
      var ry = (i * 53 + t * 720) % H;
      c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - 9, ry + 20); c.stroke();
    }
    c.restore();
  }

  function snowfall(c, W, H, o) {
    if (typeof W === 'object') { o = W; W = W0; H = H0; }
    W = W || W0; H = H || H0; o = o || {};
    var t = o.t || 0, n = o.count || 45;
    c.save();
    c.fillStyle = C.paper; c.strokeStyle = C.ink; c.lineWidth = 1.2;
    for (var i = 0; i < n; i++) {
      var sy = (i * 41 + t * (28 + (i % 5) * 8)) % H;
      var sx = ((i * 67 + Math.sin(t * 1.5 + i) * 14) % W + W) % W;
      var r = 2.2 + (i % 4) * 0.8;
      c.beginPath(); c.arc(sx, sy, r, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }

  function windLines(c, W, H, o) {
    if (typeof W === 'object') { o = W; W = W0; H = H0; }
    W = W || W0; H = H || H0; o = o || {};
    var st = o.strength !== undefined ? o.strength : 0.7, t = o.t || 0;
    if (st <= 0.01) return;
    c.save();
    c.strokeStyle = 'rgba(255,255,255,' + (0.35 + 0.45 * st).toFixed(2) + ')';
    c.lineWidth = 2.6; c.lineCap = 'round';
    for (var i = 0; i < 5; i++) {
      var spd = (160 + 280 * st) * (0.9 + (i % 3) * 0.12);
      var x = ((t * spd + i * 190) % (W + 220)) - 110, y = 75 + i * 62;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 55, y);
      c.arc(x + 65, y - 8, 8, Math.PI * 0.5, Math.PI * 2.3);
      c.lineTo(x + 125, y - 4); c.stroke();
    }
    c.restore();
  }

  // =========================================================================
  // 2. VẬT THỂ CẢNH QUAN
  // =========================================================================
  function house(c, x, gy, o) {
    x = x !== undefined ? x : 740; gy = gy !== undefined ? gy : GY0; o = o || {};
    var glow = Math.max(0, Math.min(1, o.glow || 0)), s = o.scale || 1;
    c.save(); c.translate(x, gy); c.scale(s, s);
    if (glow > 0.02) {
      var g = c.createRadialGradient(0, -50, 10, 0, -50, 130);
      g.addColorStop(0, 'rgba(255,220,70,' + (0.5 * glow).toFixed(2) + ')');
      g.addColorStop(1, 'rgba(255,220,70,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, -50, 130, 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = C.orange; c.strokeStyle = C.ink; c.lineWidth = LINE;
    c.fillRect(24, -118, 16, 30); c.strokeRect(24, -118, 16, 30);
    rr(c, -56, -86, 112, 86, 2); strokeFill(c, C.paperWarm, C.ink, LINE);
    c.beginPath(); c.moveTo(-68, -86); c.lineTo(0, -138); c.lineTo(68, -86); c.closePath();
    strokeFill(c, C.warn, C.ink, LINE);
    rr(c, -14, -46, 28, 46, [6, 6, 0, 0]); strokeFill(c, C.accent, C.ink, LINE);
    var wf = glow > 0.2 ? C.gold : C.skyStorm;
    for (var i = -1; i <= 1; i += 2) {
      rr(c, i * 33 - 11, -68, 22, 22, 3); strokeFill(c, wf, C.ink, 2.2);
    }
    c.restore();
  }

  function tree(c, x, gy, o) {
    x = x !== undefined ? x : 200; gy = gy !== undefined ? gy : GY0; o = o || {};
    var k = o.kind || 'round', s = o.scale || 1;
    c.save(); c.translate(x, gy); c.scale(s, s);
    rr(c, -7, -36, 14, 36, 2); strokeFill(c, C.wood, C.ink, LINE);
    if (k === 'pine') {
      for (var i = 0; i < 3; i++) {
        var ty = -26 - i * 24, tw = 34 - i * 6;
        c.beginPath(); c.moveTo(-tw, ty); c.lineTo(0, ty - 38); c.lineTo(tw, ty); c.closePath();
        strokeFill(c, C.grassDark, C.ink, LINE);
      }
    } else {
      c.beginPath();
      c.arc(-16, -48, 20, 0, Math.PI * 2); c.arc(16, -48, 20, 0, Math.PI * 2);
      c.arc(0, -68, 24, 0, Math.PI * 2);
      strokeFill(c, C.grass, C.ink, LINE);
    }
    c.restore();
  }

  function village(c, x, gy, o) {
    x = x !== undefined ? x : 700; gy = gy !== undefined ? gy : GY0; o = o || {};
    var glow = o.glow || 0;
    c.save();
    tree(c, x - 95, gy, { kind: 'round', scale: 0.75 });
    house(c, x - 40, gy, { glow: glow, scale: 0.68 });
    tree(c, x + 15, gy, { kind: 'pine', scale: 0.8 });
    house(c, x + 70, gy, { glow: glow, scale: 0.82 });
    c.restore();
  }

  function rock(c, x, gy, o) {
    x = x !== undefined ? x : 450; gy = gy !== undefined ? gy : GY0; o = o || {};
    var k = o.kind || 'gray', s = o.scale || 1;
    var col = k === 'mars' ? C.marsDark : k === 'green' ? C.ok : C.rock;
    c.save(); c.translate(x, gy); c.scale(s, s);
    c.beginPath();
    c.moveTo(-30, 0); c.lineTo(-24, -26); c.lineTo(-4, -38);
    c.lineTo(20, -28); c.lineTo(30, 0); c.closePath();
    strokeFill(c, col, C.ink, LINE);
    c.fillStyle = 'rgba(255,255,255,0.22)';
    c.beginPath(); c.moveTo(-20, -24); c.lineTo(-4, -34); c.lineTo(6, -18); c.closePath(); c.fill();
    if (o.scan) {
      c.strokeStyle = C.gold; c.lineWidth = 2.5;
      c.beginPath(); c.arc(0, -18, 38, 0, Math.PI * 2); c.stroke();
    }
    c.restore();
  }

  function pile(c, x, gy, o) {
    x = x !== undefined ? x : 450; gy = gy !== undefined ? gy : GY0; o = o || {};
    var k = o.kind || 'snow', s = o.scale || 1;
    var col = k === 'sand' ? C.sand : k === 'dirt' ? C.wood : C.paper;
    var shd = k === 'sand' ? C.sandDark : k === 'dirt' ? C.inkSoft : C.snowShade;
    c.save(); c.translate(x, gy); c.scale(s, s);
    c.beginPath();
    c.moveTo(-42, 0);
    c.bezierCurveTo(-44, -24, -22, -38, -6, -34);
    c.bezierCurveTo(6, -44, 28, -38, 34, -22);
    c.bezierCurveTo(42, -18, 44, -6, 42, 0); c.closePath();
    strokeFill(c, col, C.ink, LINE);
    c.fillStyle = shd;
    c.beginPath(); c.ellipse(0, -5, 34, 4, 0, 0, Math.PI * 2); c.fill();
    c.restore();
  }

  function wall(c, x, gy, o) {
    x = x !== undefined ? x : 800; gy = gy !== undefined ? gy : GY0; o = o || {};
    var h = o.h || 90;
    c.save(); c.translate(x, gy);
    c.fillStyle = C.road; c.strokeStyle = C.ink; c.lineWidth = LINE;
    c.fillRect(-18, -h, 10, h); c.strokeRect(-18, -h, 10, h);
    c.fillRect(8, -h, 10, h); c.strokeRect(8, -h, 10, h);
    for (var by = -h + 10; by <= -36; by += 32) {
      rr(c, -26, by, 52, 20, 3); strokeFill(c, C.paper, C.ink, LINE);
      c.fillStyle = C.warn;
      c.fillRect(-18, by + 2, 12, 16); c.fillRect(6, by + 2, 12, 16);
    }
    c.beginPath(); c.moveTo(0, -h - 26); c.lineTo(16, -h - 2); c.lineTo(-16, -h - 2); c.closePath();
    strokeFill(c, C.gold, C.ink, LINE);
    c.fillStyle = C.ink; c.fillRect(-2, -h - 19, 4, 9); c.fillRect(-2, -h - 8, 4, 3);
    c.restore();
  }

  function water(c, x, y, w, h, o) {
    x = x !== undefined ? x : 560; y = y !== undefined ? y : 260;
    w = w || 110; h = h || 140; o = o || {};
    var lv = Math.max(0, Math.min(1, o.level !== undefined ? o.level : 0.6)), t = o.t || 0;
    c.save();
    rr(c, x - 6, y + h, w + 12, 14, 3); strokeFill(c, C.inkSoft, C.ink, LINE);
    rr(c, x, y, w, h, 6); strokeFill(c, 'rgba(238,246,251,0.9)', C.ink, 3);
    var wh = (h - 6) * lv, wy = y + h - 3 - wh;
    if (wh > 2) {
      rr(c, x + 3, wy, w - 6, wh, 4);
      c.fillStyle = C.water; c.fill();
      c.strokeStyle = C.paper; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x + 6, wy + Math.sin(t * 4) * 2); c.lineTo(x + w - 6, wy - Math.sin(t * 4) * 2); c.stroke();
    }
    for (var i = 1; i <= 3; i++) {
      var my = y + (h * i) / 4;
      c.beginPath(); c.moveTo(x + 4, my); c.lineTo(x + 16, my); strokeFill(c, null, C.inkSoft, 2);
    }
    c.restore();
  }

  function stream(c, x, gy, w, h, o) {
    if (typeof w === 'object') { o = w; w = 300; h = 130; }
    x = x || 0; gy = gy || GY0; w = w || 300; h = h || 130; o = o || {};
    var t = o.t || 0, fl = o.flow !== undefined ? o.flow : 1;
    c.save();
    var g = c.createLinearGradient(x, gy, x, gy + h);
    g.addColorStop(0, C.water); g.addColorStop(1, C.waterDeep);
    rr(c, x, gy, w, h, 4); strokeFill(c, g, C.ink, LINE);
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 2.4; c.lineCap = 'round';
    for (var i = 0; i < 4; i++) {
      var rx = x + 20 + ((t * 70 * fl + i * 75) % Math.max(40, w - 70));
      var ry = gy + 24 + (i % 3) * (h * 0.25);
      c.beginPath(); c.moveTo(rx, ry); c.quadraticCurveTo(rx + 18, ry - 4, rx + 36, ry); c.stroke();
    }
    c.restore();
  }

  function flag(c, x, gy, o) {
    x = x !== undefined ? x : 780; gy = gy !== undefined ? gy : GY0; o = o || {};
    var col = o.color || C.warn, t = o.t || 0, wave = Math.sin(t * 6) * 4;
    c.save(); c.translate(x, gy);
    rr(c, -14, -8, 28, 8, 2); strokeFill(c, C.inkSoft, C.ink, LINE);
    c.beginPath(); c.moveTo(0, -8); c.lineTo(0, -110); strokeFill(c, null, C.ink, 3.2);
    c.beginPath();
    c.moveTo(0, -106); c.quadraticCurveTo(26, -102 + wave, 52, -90 + wave);
    c.lineTo(0, -74); c.closePath();
    strokeFill(c, col, C.ink, LINE);
    c.beginPath(); c.arc(0, -112, 5, 0, Math.PI * 2); strokeFill(c, C.gold, C.ink, 2);
    if (o.label) label(c, o.label, 24, -120, { size: 14, color: C.gold });
    c.restore();
  }

  function finishLine(c, x, gy, o) {
    x = x !== undefined ? x : 780; gy = gy !== undefined ? gy : GY0; o = o || {};
    var h = o.h || 115, w = o.w || 76;
    c.save(); c.translate(x, gy);
    c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w / 2, -h);
    c.moveTo(w / 2, 0); c.lineTo(w / 2, -h); strokeFill(c, null, C.ink, 3.5);
    rr(c, -w / 2 - 4, -h, w + 8, 24, 3); strokeFill(c, C.paper, C.ink, LINE);
    c.fillStyle = C.ink;
    for (var i = 0; i < 6; i++) {
      if (i % 2 === 0) c.fillRect(-w / 2 + i * (w / 6), -h + 2, w / 6, 10);
      else c.fillRect(-w / 2 + i * (w / 6), -h + 12, w / 6, 10);
    }
    label(c, o.label || 'ĐÍCH', 0, -h - 8, { size: 15, color: C.gold });
    c.restore();
  }

  function station(c, x, gy, o) {
    x = x !== undefined ? x : 110; gy = gy !== undefined ? gy : GY0; o = o || {};
    var txt = o.label || 'GA-RA';
    c.save(); c.translate(x, gy);
    rr(c, -52, -8, 104, 8, 2); strokeFill(c, C.hole, C.ink, LINE);
    rr(c, -46, -96, 92, 88, 4); strokeFill(c, C.paper, C.ink, LINE);
    rr(c, -32, -70, 64, 62, [4, 4, 0, 0]); strokeFill(c, C.skyStorm, C.ink, LINE);
    c.strokeStyle = C.inkSoft; c.lineWidth = 2;
    for (var y = -58; y <= -18; y += 12) {
      c.beginPath(); c.moveTo(-30, y); c.lineTo(30, y); c.stroke();
    }
    c.beginPath(); c.moveTo(-56, -96); c.lineTo(0, -132); c.lineTo(56, -96); c.closePath();
    strokeFill(c, C.warn, C.ink, LINE);
    rr(c, -38, -120, 76, 20, 4); strokeFill(c, C.paper, C.ink, 2.2);
    c.font = '700 13px "Be Vietnam Pro","Segoe UI",sans-serif';
    c.fillStyle = C.ink; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(txt, 0, -110);
    c.restore();
  }

  function battery(c, x, y, level, o) {
    if (typeof level === 'object') { o = level; level = o.level; }
    x = x !== undefined ? x : 540; y = y !== undefined ? y : 390;
    var lv = Math.max(0, Math.min(1, Number.isFinite(level) ? level : 0.65));
    c.save(); c.translate(x, y);
    rr(c, -10, -56, 20, 10, [4, 4, 0, 0]); strokeFill(c, C.paper, C.ink, LINE);
    rr(c, -26, -46, 52, 92, 8); strokeFill(c, C.paper, C.ink, 3);
    rr(c, -20, -40, 40, 80, 4); strokeFill(c, C.ink, C.ink, 2);
    var fh = 76 * lv;
    if (fh > 1) {
      var col = lv >= 0.99 ? '#00e676' : lv > 0.35 ? C.ok : C.orange;
      rr(c, -18, 38 - fh, 36, fh, 3); c.fillStyle = col; c.fill();
    }
    if (lv >= 0.99) {
      c.beginPath(); c.moveTo(2, -18); c.lineTo(-9, 2); c.lineTo(0, 2); c.lineTo(-4, 18);
      c.lineTo(9, -2); c.lineTo(0, -2); c.closePath();
      strokeFill(c, C.gold, C.ink, 2);
    }
    c.restore();
  }

  function cable(c, x1, y1, x2, y2, o) {
    o = o || {};
    var t = o.t || 0, fl = Math.max(0, Math.min(1, o.flow || 0));
    var mx = (x1 + x2) / 2, my = Math.max(y1, y2) + 28;
    c.save();
    c.strokeStyle = C.ink; c.lineWidth = 3.6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.stroke();
    c.beginPath(); c.arc(x1, y1, 4.5, 0, Math.PI * 2); c.arc(x2, y2, 4.5, 0, Math.PI * 2);
    strokeFill(c, C.accent, C.ink, 2);
    if (fl > 0.01) {
      for (var i = 0; i < 4; i++) {
        var k = ((t * (0.6 + fl * 1.8) + i * 0.25) % 1 + 1) % 1, u = 1 - k;
        var px = u * u * x1 + 2 * u * k * mx + k * k * x2;
        var py = u * u * y1 + 2 * u * k * my + k * k * y2;
        c.beginPath(); c.arc(px, py, 4.5, 0, Math.PI * 2); strokeFill(c, C.gold, C.ink, 1.5);
      }
    }
    c.restore();
  }

  // =========================================================================
  // 3. ROBOT & LINH KIỆN KIT ZM ALPHA
  // =========================================================================
  function wheel(c, x, y, r, o) {
    r = r || 26; o = o || {};
    var ang = o.angle || 0, blades = o.blades || 0;
    c.save(); c.translate(x, y); c.rotate(ang);
    if (blades > 0) {
      var len = o.long ? r * 1.35 : r;
      for (var b = 0; b < blades; b++) {
        c.save(); c.rotate((b * Math.PI * 2) / blades);
        rr(c, -8, 6, 16, len - 6, 8); strokeFill(c, C.paper, C.ink, LINE);
        c.beginPath(); c.arc(0, len * 0.55, 3.2, 0, Math.PI * 2); strokeFill(c, C.hole, C.ink, 1.6);
        c.restore();
      }
      c.beginPath(); c.arc(0, 0, 12, 0, Math.PI * 2); strokeFill(c, C.accent, C.ink, LINE);
    } else {
      c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); strokeFill(c, C.accent, C.ink, LINE);
      if (o.tread) {
        c.strokeStyle = C.ink; c.lineWidth = 3; c.setLineDash([5, 5]);
        c.beginPath(); c.arc(0, 0, r + 2, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      }
      c.beginPath(); c.arc(0, 0, r * 0.62, 0, Math.PI * 2); strokeFill(c, C.paper, C.ink, 2);
      for (var i = 0; i < 4; i++) {
        c.beginPath(); c.moveTo(-r * 0.55, 0); c.lineTo(r * 0.55, 0); strokeFill(c, null, C.accentDark, 2.2);
        c.rotate(Math.PI / 4);
      }
    }
    c.beginPath(); c.arc(0, 0, 4, 0, Math.PI * 2); strokeFill(c, C.ink, C.ink, 1);
    c.restore();
  }

  function gear(c, x, y, r, o) {
    r = r || 28; o = o || {};
    var teeth = o.teeth || 12, ang = o.angle || 0, col = o.color || C.hole;
    c.save(); c.translate(x, y); c.rotate(ang);
    c.beginPath();
    for (var i = 0; i < teeth; i++) {
      var a0 = (i * Math.PI * 2) / teeth, st = (Math.PI * 2) / teeth;
      var rIn = r * 0.82, rOut = r;
      if (i === 0) c.moveTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
      else c.lineTo(Math.cos(a0) * rIn, Math.sin(a0) * rIn);
      c.lineTo(Math.cos(a0 + st * 0.25) * rOut, Math.sin(a0 + st * 0.25) * rOut);
      c.lineTo(Math.cos(a0 + st * 0.6) * rOut, Math.sin(a0 + st * 0.6) * rOut);
      c.lineTo(Math.cos(a0 + st * 0.85) * rIn, Math.sin(a0 + st * 0.85) * rIn);
    }
    c.closePath(); strokeFill(c, col, C.ink, 2.2);
    c.beginPath(); c.arc(0, 0, r * 0.55, 0, Math.PI * 2); strokeFill(c, C.paper, C.ink, 2);
    c.fillStyle = C.ink; c.fillRect(-2.5, -7, 5, 14); c.fillRect(-7, -2.5, 14, 5);
    c.restore();
  }

  function motorBox(c, x, y, o) {
    x = x !== undefined ? x : 450; y = y !== undefined ? y : 280; o = o || {};
    var w = o.w || 48, h = o.h || 48;
    c.save(); c.translate(x, y);
    rr(c, -w / 2, -h / 2, w, h, 6); strokeFill(c, C.paper, C.ink, LINE);
    rr(c, -w / 2 + 5, -h / 2 + 6, w - 10, h - 12, 4); strokeFill(c, C.accent, C.accentDark, 2);
    c.beginPath(); c.arc(0, 0, 9, 0, Math.PI * 2); strokeFill(c, C.gold, C.ink, 2);
    c.fillStyle = C.ink; c.fillRect(-2, -6, 4, 12); c.fillRect(-6, -2, 12, 4);
    c.restore();
  }

  function brain(c, x, y, o) {
    x = x !== undefined ? x : 450; y = y !== undefined ? y : 320; o = o || {};
    var w = o.w || 84, h = o.h || 64;
    c.save(); c.translate(x, y);
    rr(c, -w / 2, -h / 2, w, h, 7); strokeFill(c, C.paper, C.ink, LINE);
    rr(c, -w / 2 + 4, h / 2 - 18, w - 8, 14, 3); strokeFill(c, C.accent, C.accentDark, 1.8);
    for (var i = 0; i < 4; i++) {
      c.fillStyle = C.ink; c.fillRect(-w / 2 + 12 + i * 16, h / 2 - 14, 8, 6);
    }
    face(c, 0, -6, 18, { kind: o.face || 'smile' });
    c.restore();
  }

  function touchSensor(c, x, y, o) {
    if (typeof x === 'object') { o = x; x = 450; y = 300; }
    x = x !== undefined ? x : 450; y = y !== undefined ? y : 300; o = o || {};
    var pr = !!o.pressed, bh = pr ? 6 : 12;
    c.save(); c.translate(x, y);
    if (pr) {
      c.fillStyle = 'rgba(229,57,53,0.32)';
      c.beginPath(); c.arc(0, -14, 24, 0, Math.PI * 2); c.fill();
    }
    rr(c, -12, -12 - bh, 24, bh, [4, 4, 0, 0]);
    strokeFill(c, pr ? C.warnDark : C.warn, C.ink, 2.2);
    rr(c, -24, -12, 48, 26, 5); strokeFill(c, C.paper, C.ink, LINE);
    rr(c, -18, -6, 36, 14, 3); strokeFill(c, C.accent, C.accentDark, 1.8);
    c.restore();
  }

  function ultrasonic(c, x, y, o) {
    if (typeof x === 'object') { o = x; x = 450; y = 300; }
    x = x !== undefined ? x : 450; y = y !== undefined ? y : 300; o = o || {};
    var act = !!o.active;
    c.save(); c.translate(x, y);
    rr(c, -24, -16, 48, 32, 5); strokeFill(c, C.paper, C.ink, LINE);
    rr(c, -20, -12, 40, 24, 3); strokeFill(c, C.accent, C.accentDark, 1.8);
    for (var i = -1; i <= 1; i += 2) {
      c.beginPath(); c.arc(i * 10, 0, 7.5, 0, Math.PI * 2);
      strokeFill(c, act ? C.gold : C.hole, C.ink, 2);
      c.beginPath(); c.arc(i * 10, 0, 2.8, 0, Math.PI * 2);
      strokeFill(c, act ? C.paper : C.ink, C.ink, 1);
    }
    if (act) {
      c.strokeStyle = C.gold; c.lineWidth = 2.4; c.lineCap = 'round';
      for (var r = 28; r <= 46; r += 9) {
        c.beginPath(); c.arc(16, 0, r, -0.35, 0.35); c.stroke();
      }
    }
    c.restore();
  }

  function hand(c, x, y, o) {
    if (typeof x === 'object') { o = x; x = 450; y = 300; }
    x = x !== undefined ? x : 450; y = y !== undefined ? y : 300; o = o || {};
    var near = o.near !== undefined ? o.near : true;
    c.save(); c.translate(x, y);
    if (near) {
      c.strokeStyle = C.accent; c.lineWidth = 2.4;
      for (var r = 22; r <= 42; r += 10) {
        c.beginPath(); c.arc(-22, 0, r, -0.45, 0.45); c.stroke();
      }
    }
    rr(c, -14, -20, 28, 40, 10); strokeFill(c, '#ffd0b0', C.ink, LINE);
    rr(c, -22, -8, 12, 18, 5); strokeFill(c, '#ffd0b0', C.ink, 2.2);
    c.strokeStyle = C.ink; c.lineWidth = 2;
    for (var i = -1; i <= 1; i++) {
      c.beginPath(); c.moveTo(-14, i * 7); c.lineTo(2, i * 7); c.stroke();
    }
    c.restore();
  }

  function face(c, x, y, r, o) {
    if (typeof r === 'object') { o = r; r = 22; }
    r = r || 22; o = o || {};
    var k = o.kind || 'smile';
    c.save(); c.translate(x, y);
    rr(c, -r * 1.15, -r * 0.95, r * 2.3, r * 1.9, 5); strokeFill(c, C.ink, C.ink, 2);
    if (k === 'heart') {
      c.fillStyle = C.warn; c.beginPath();
      c.moveTo(0, r * 0.55);
      c.bezierCurveTo(-r, -r * 0.1, -r * 0.5, -r * 0.8, 0, -r * 0.25);
      c.bezierCurveTo(r * 0.5, -r * 0.8, r, -r * 0.1, 0, r * 0.55);
      c.fill();
    } else {
      c.beginPath(); c.arc(0, 0, r * 0.65, 0, Math.PI * 2);
      c.fillStyle = k === 'sad' ? C.accentLight : C.gold; c.fill();
      c.strokeStyle = C.ink; c.lineWidth = 2; c.lineCap = 'round';
      c.beginPath(); c.arc(-r * 0.24, -r * 0.12, 2, 0, Math.PI * 2);
      c.arc(r * 0.24, -r * 0.12, 2, 0, Math.PI * 2); c.stroke();
      c.beginPath();
      if (k === 'sad') c.arc(0, r * 0.35, r * 0.25, Math.PI * 1.15, Math.PI * 1.85);
      else c.arc(0, r * 0.08, r * 0.28, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
    }
    c.restore();
  }

  // =========================================================================
  // 4. HIỆU ỨNG & CHỮ
  // =========================================================================
  function starBurst(c, x, y, o) {
    x = x !== undefined ? x : 450; y = y !== undefined ? y : 220; o = o || {};
    var t = o.t || 0, n = o.n || 8, rMax = o.r || 56;
    var p = ((t * 0.9) % 1 + 1) % 1, dist = 12 + p * rMax;
    c.save(); c.translate(x, y);
    for (var i = 0; i < n; i++) {
      var a = (i * Math.PI * 2) / n + p * 0.5;
      var sx = Math.cos(a) * dist, sy = Math.sin(a) * dist;
      c.beginPath(); c.arc(sx, sy, 6 * (1 - p * 0.4), 0, Math.PI * 2);
      strokeFill(c, i % 2 === 0 ? C.gold : C.accentLight, C.ink, 1.8);
    }
    c.restore();
  }

  function splash(c, x, y, o) {
    x = x !== undefined ? x : 450; y = y !== undefined ? y : 360; o = o || {};
    var t = o.t || 0, s = o.scale || 1, p = ((t * 1.6) % 1 + 1) % 1;
    c.save(); c.translate(x, y); c.scale(s, s);
    for (var i = -2; i <= 2; i++) {
      var dx = i * (10 + p * 14), dy = -Math.sin(p * Math.PI) * (24 - Math.abs(i) * 4);
      c.beginPath(); c.arc(dx, dy, 4.5, 0, Math.PI * 2);
      strokeFill(c, C.water, C.ink, 1.6);
    }
    c.restore();
  }

  function label(c, text, x, y, o) {
    o = o || {};
    var sz = o.size || 16, col = o.color || C.paper;
    c.save();
    c.font = '700 ' + sz + 'px "Be Vietnam Pro","Segoe UI",sans-serif';
    c.textAlign = o.align || 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = 4.5;
    c.strokeStyle = C.ink;
    c.strokeText(String(text), x, y);
    c.fillStyle = col;
    c.fillText(String(text), x, y);
    c.restore();
  }

  window.ZMArt = {
    W: W0, H: H0, GROUND_Y: GY0, LINE: LINE, C: C,
    sky: sky, ground: ground, sun: sun, cloud: cloud,
    rain: rain, snowfall: snowfall, windLines: windLines,
    house: house, village: village, tree: tree, rock: rock,
    pile: pile, wall: wall, water: water, stream: stream,
    flag: flag, finishLine: finishLine, station: station,
    battery: battery, cable: cable,
    wheel: wheel, gear: gear, motorBox: motorBox, brain: brain,
    touchSensor: touchSensor, ultrasonic: ultrasonic, hand: hand, face: face,
    starBurst: starBurst, splash: splash, label: label
  };
})();
