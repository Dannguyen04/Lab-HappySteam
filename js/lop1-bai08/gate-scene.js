// Cảnh kể chuyện nhìn ngang: bạn nhỏ mang ba lô về nhà, mắt siêu âm và cánh cổng M1.
// Cảnh Canvas độc lập, dùng chi tiết ZMArt khi có sẵn và tự vẽ nếu thiếu art.js.
(function () {
  'use strict';
  const W = 900, H = 560, G = 436;
  const box = (c,x,y,w,h,r,color) => {
    c.fillStyle = color; c.beginPath(); c.roundRect(x,y,w,h,r); c.fill();
  };
  const circ = (c,x,y,r,color) => {
    c.fillStyle=color; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill();
  };
  const line = (c,pts,color,width=4) => {
    c.strokeStyle=color; c.lineWidth=width; c.lineCap='round'; c.lineJoin='round';
    c.beginPath(); pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.stroke();
  };
  const txt = (c,s,x,y,size,color) => {
    c.fillStyle=color; c.textAlign='center';
    c.font=`700 ${size}px "Be Vietnam Pro","Segoe UI",sans-serif`; c.fillText(s,x,y);
  };
  function backdrop(c,now,sim) {
    const sky=c.createLinearGradient(0,0,0,G);
    sky.addColorStop(0,'#8cd3fb'); sky.addColorStop(1,'#fff3d9');
    c.fillStyle=sky; c.fillRect(0,0,W,H);
    if (window.ZMArt && typeof window.ZMArt.sun === 'function')
      window.ZMArt.sun(c,777,83,{r:35,t:now});
    else circ(c,777,83,44,'#ffdc74');
    for (const [x,y] of [[95,100],[380,76],[635,145]]) {
      const d=Math.sin(now*.2+x)*5;
      circ(c,x+d,y,32,'#fff'); circ(c,x+34+d,y+5,26,'#fff');
      circ(c,x-31+d,y+7,23,'#fff');
    }
    box(c,576,221,278,217,8,'#ffe8d4');
    c.fillStyle='#b86b76'; c.beginPath(); c.moveTo(554,232); c.lineTo(714,113);
    c.lineTo(877,232); c.closePath(); c.fill();
    c.fillStyle='#f2b7af'; c.beginPath(); c.moveTo(573,233); c.lineTo(714,132);
    c.lineTo(860,233); c.closePath(); c.fill();
    box(c,635,273,81,83,10,'#8acbdc'); box(c,646,285,60,60,6,'#caedf2');
    line(c,[[676,285],[676,347]],'#fff',5);
    box(c,761,294,50,144,9,'#d78460'); circ(c,802,364,4,'#ffeab3');
    c.fillStyle='#9ccd70'; c.fillRect(0,G,W,H-G);
    c.fillStyle='#e7d4b5'; c.beginPath(); c.moveTo(365,G); c.lineTo(702,G);
    c.lineTo(812,H); c.lineTo(244,H); c.closePath(); c.fill();
    for(const [x,y] of [[60,359],[173,376],[835,360]]) {
      box(c,x,y+24,13,55,5,'#7a9a56');
      circ(c,x+6,y,38,'#72b96e'); circ(c,x-11,y+18,26,'#9bd782');
    }
    if(sim.has('flowers')) {
      for(let i=0;i<7;i++) {
        const x=47+i*47;
        line(c,[[x,G],[x,G-31]],'#4e9a67',4);
        for(let k=0;k<5;k++) circ(c,x+Math.cos(k*1.257)*11,G-31+Math.sin(k*1.257)*11,7,
          ['#f68eab','#ffd37a','#ed8c72'][i%3]);
        circ(c,x,G-31,5,'#ffee87');
      }
      box(c,30,482,327,11,4,'#d78e6d');
    }
  }
  function gateway(c,sim,now) {
    box(c,376,242,33,201,8,'#446c8b');
    box(c,565,238,40,205,8,'#446c8b');
    box(c,368,230,49,18,5,'#76a1b2');
    box(c,559,227,54,20,6,'#76a1b2');
    if(sim.has('canopy')) {
      c.fillStyle='#e89b77'; c.beginPath(); c.moveTo(351,232);
      c.lineTo(487,168); c.lineTo(628,232); c.closePath(); c.fill();
      box(c,354,230,272,14,5,'#f5c799');
    }
    // Hai mắt siêu âm và thân Smart Hub.
    box(c,361,266,62,70,12,'#f3f6fb'); box(c,369,275,45,39,8,'#2e586b');
    circ(c,381,288,8,'#9addf0'); circ(c,402,288,8,'#9addf0');
    circ(c,381,288,3,'#214b62'); circ(c,402,288,3,'#214b62');
    box(c,368,322,48,11,5,'#57bdd8');
    const go=sim.led==='go', down=sim.led==='down';
    box(c,551,266,73,60,12,sim.has('led')&&go?'#aff2c2':'#e8f2fc');
    box(c,559,275,57,43,7,'#1b4a5c');
    txt(c,go?'GO':down?'↓':'··',588,307,down?38:29,go?'#8af9b1':'#ffe89f');
    if(sim.has('led')&&go) {
      c.strokeStyle='rgba(65,255,134,.45)'; c.lineWidth=7; c.beginPath();
      c.arc(587,296,43+Math.sin(now*6)*3,0,Math.PI*2); c.stroke();
      circ(c,605,254,8,'#49f0a4');
    }
    if(sim.has('number')) {
      box(c,552,343,62,49,6,'#fff0b0'); box(c,559,349,48,37,4,'#fffdf6');
      txt(c,'08',584,377,27,'#315d88');
    }
    // Cánh cổng quay trực quan theo góc mở của cơ cấu M1.
    c.save(); c.translate(405,388); c.rotate(-sim.gateOpen*1.1);
    box(c,-2,-17,172,28,8,'#f0ad58'); box(c,8,-12,148,18,6,'#ffe0a2');
    for(let i=0;i<5;i++) circ(c,18+i*29,-4,3,'#b77a55');
    c.restore();
    circ(c,405,388,17,'#3d5972'); circ(c,405,388,9,'#efbe74');
    box(c,369,404,48,24,7,'#8dc1d2'); txt(c,'M1',393,422,14,'#244a63');
    if(sim.running&&sim.phase==='searching') {
      c.strokeStyle='rgba(23,171,195,.4)'; c.lineWidth=3; c.setLineDash([8,9]);
      for(let i=0;i<3;i++) {
        c.beginPath(); c.ellipse(387,288,85+i*25+Math.sin(now*5)*5,48+i*12,0,.5*Math.PI,1.5*Math.PI); c.stroke();
      }
      c.setLineDash([]);
    }
  }
  function child(c,sim,now) {
    let x=173;
    if(sim.running||sim.detected) {
      if(!sim.detected) x=173+Math.min(1,(sim.sensorElapsed||0)/1)*160;
      else if(sim.detected===1) x=sim.gateOpen>=.8?632:345;
      else x=sim.childCrossed?689:345;
    }
    const sway=sim.phase==='searching'?Math.sin(now*11)*7:0;
    c.save(); c.translate(x,G-93);
    line(c,[[-8,48],[-12+sway,86]],'#345676',11);
    line(c,[[9,48],[13-sway,86]],'#345676',11);
    box(c,-38,-8,23,61,9,'#f0ac56');
    box(c,-25,-8,50,60,12,'#f46e75');
    box(c,-23,0,9,34,4,'#fcd080');
    line(c,[[-22,10],[-34,32]],'#f5b88e',9);
    line(c,[[23,11],[36,29-sway]],'#f5b88e',9);
    circ(c,0,-39,24,'#ffcca1');
    c.fillStyle='#45405e'; c.beginPath(); c.arc(0,-45,24,Math.PI,Math.PI*2); c.fill();
    circ(c,9,-36,3,'#35435b'); line(c,[[8,-27],[15,-25]],'#b46d6f',2);
    c.restore();
  }
  function status(c,sim,kit) {
    box(c,22,21,344,78,17,'rgba(255,255,255,.94)');
    txt(c,'🏠 CỔNG NHÀ THÔNG MINH',194,52,19,'#305a78');
    const caption=sim.failed?'Mắt cổng cần chỉnh lại!':sim.childCrossed?'Bạn nhỏ đã vào nhà!':
      sim.phase==='searching'?'Mắt siêu âm đang tìm bạn…':sim.phase==='opening'?'GO! Cổng đang mở':
        sim.phase==='closing'?'Cổng đang đóng':'Ấn ▶ để đón bạn nhé!';
    txt(c,caption,194,80,15,sim.failed?'#ce5b65':'#397b6e');
    if(sim.advanced) {
      box(c,670,20,204,72,14,'rgba(25,67,88,.88)');
      txt(c,`📡 ${Math.round(sim.distance)} cm`,772,50,20,'#fff');
      txt(c,`Cổng mở ${Math.round(sim.gateOpen*100)}%`,772,77,14,'#fff0bb');
    } else {
      box(c,726,21,148,50,14,'rgba(25,67,88,.85)');
      txt(c,sim.led==='go'?'🟢 MỞ':sim.led==='down'?'🟠 ĐÓNG':'👀 MẮT CỔNG',800,53,15,'#fff');
    }
    if(sim.detected===2&&!sim.childCrossed&&!sim.failed)
      kit.label('Cổng còn hẹp — thử chờ 1 giây!',464,526,'#fff1ae',20);
    else if(sim.childCrossed) kit.label('🎉 Vào nhà an toàn!',465,526,'#fff3aa',22);
    else kit.label('✋ Chạm bàn tay để gọi bạn tới cổng',466,526,'#fff',18);
  }
  window.ZMSceneKit.create({
    W,H,
    init() {
      const hand=document.getElementById('scene-hand');
      if(hand) {
        hand.title='Gọi bạn nhỏ đến mắt siêu âm';
        hand.setAttribute('aria-label','Gọi bạn nhỏ đến mắt siêu âm');
        hand.addEventListener('click',()=>window.simEngine?.press());
      }
    },
    draw(c,now,sim,kit) {
      backdrop(c,now,sim); gateway(c,sim,now); child(c,sim,now); status(c,sim,kit);
    },
    onEvent(type,data,kit) {
      if(type==='sampleDone') {
        kit.burst(488,290,20,['#fff0a5','#69e1b6','#ffb6ae']);
        kit.toast('ok','13 khối đúng mẫu!','Thử đổi khối Chờ đầu tiên thành 1 giây.');
      }
      if(type==='safeCross') {
        kit.burst(670,280,25);
        kit.toast('ok','Bạn đã vào nhà an toàn!','Cổng mở đủ rộng trước khi đóng.');
      }
      if(type==='miss') kit.toast('warn','Cảm biến cần chỉnh',data.message);
      if(type==='sensorMaster') kit.toast('ok','Cảm biến tinh ý!','15–20 cm nhận đúng bạn nhỏ.');
    }
  });
})();
