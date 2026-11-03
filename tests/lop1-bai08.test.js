// Logic Bài 8 lớp 1: chương trình mẫu, thời gian an toàn, cảm biến và 3D.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const load3D = require('./helpers/lesson-3d');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const context = { window:{}, document:{getElementById:()=>null}, performance:{now:()=>0}, Math };
for(const file of ['js/blocks-engine.js','js/lop1-bai08/lesson.js',
  'js/lesson-engine.js','js/lop1-bai08/gate-engine.js'])
  vm.runInNewContext(read(file),context,{filename:file});
const {LESSON:L,BLOCK_TEMPLATES:T,GateEngine} = context.window;
const blocks = () => L.blocks.sample.map(item => {
  const [name,props]=Array.isArray(item)?item:[item,{}];
  return {...T[name],...props};
});
const sig = b => b.type==='display'?'display:'+b.icon:
  b.type==='motor'?'motor:'+b.speed+':'+b.dir+':'+b.port:
    b.type==='wait'?'wait:'+b.duration:b.type;
function run({pro=false,wait=.2,ranges=[30,30],mutate,upgrades=[]}={}) {
  const s = new GateEngine();
  if(pro) s.setAdvanced(true);
  if(upgrades.length) s.setUpgrades(upgrades);
  const p=blocks();
  p[5].duration=wait;
  p[2].range=ranges[0]; p[7].range=ranges[1];
  if(mutate) mutate(p);
  const events=[];
  s.onEvent=(type,data)=>events.push({type,data});
  s.setProgram(p); s.start();
  for(let t=0;t<30&&s.running;t+=.05) s.advance(.05);
  assert.equal(s.running,false,'Mô phỏng phải kết thúc sau một chu kỳ hoặc timeout');
  return {s,p,events};
}
async function main() {
  assert.equal(L.id,'lop1-bai08');
  assert.equal(L.defaultMode,'kid');
  assert.deepEqual([...L.missions.core],['m1','m2','m3','m4']);
  assert.deepEqual([...L.missions.pro],['m5']);
  assert.equal(L.blocks.sensorRange,true);
  assert.deepEqual([...L.blocks.sensorRanges],[5,15,20,50]);
  assert.deepEqual([...blocks().map(sig)],[
    'start','repeatStart','sensor_obstacle','display:go','motor:high:ccw:M1',
    'wait:0.2','stop','sensor_obstacle','display:down','motor:high:cw:M1',
    'wait:0.2','stop','repeatEnd'
  ],'Đúng 13 khối trong KHGD, hai lượt siêu âm và M1 quay hai chiều');
  for(const key of ['displayGO','displayArrowDown','highSpeedM1','highSpeedCCWM1'])
    assert.ok(T[key], 'Toolbox có khối '+key);
  const sample=run();
  assert.equal(sample.s.done.m2,true,'Mẫu đạt M2');
  assert.equal(sample.s.done.m3,false,'Mẫu 0,2s chưa đủ mở');
  assert.equal(sample.s.done.m5,false,'Chế độ Bé chưa đạt Nâng cao');
  assert.equal(sample.s.detected,2);
  assert.equal(sample.s.loops,1);
  assert.equal(sample.s.gateOpen,0);
  assert.equal(sample.s.childCrossed,false);
  assert.ok(sample.s.rev!==0);
  assert.equal(sample.events.filter(e=>e.type==='display').length,2);
  assert.ok(sample.events.some(e=>e.type==='sampleDone'));
  assert.ok(sample.s.logs.some(l=>/1 giây/.test(l.text)),'Có gợi ý sửa M3');

  const safe=run({wait:1});
  assert.equal(safe.s.done.m2,true);
  assert.equal(safe.s.done.m3,true,'Thay đúng khối đầu thành 1 giây đạt M3');
  assert.equal(safe.s.childCrossed,true);
  assert.ok(safe.events.some(e=>e.type==='safeCross'));
  assert.equal(run({wait:.5}).s.done.m3,false,'Thời gian 0,5s chưa đủ');
  assert.equal(run({wait:1.5}).s.done.m3,false,'Chỉ đúng 1s mới đạt nhiệm vụ');
  assert.equal(run({wait:1,mutate:p=>{p[10].duration=1;}}).s.done.m2,false,
    'Đổi nhầm khối Chờ đóng không đạt mẫu');
  for(const [title,mutate] of [
    ['GO sai',p=>{p[3].icon='down';}],
    ['mũi tên sai',p=>{p[8].icon='go';}],
    ['đảo chiều mở',p=>{p[4].dir='cw';}],
    ['đảo chiều đóng',p=>{p[9].dir='ccw';}],
    ['sai động cơ',p=>{p[4].port='M2';}],
    ['thiếu khối',p=>p.splice(6,1)]
  ]) assert.equal(run({mutate}).s.done.m2,false,title+' phải trượt M2');

  for(const range of [15,20]) {
    const pro=run({pro:true,wait:1,ranges:[range,range]});
    assert.equal(pro.s.done.m2,true);
    assert.equal(pro.s.done.m3,true);
    assert.equal(pro.s.done.m5,true,'Ngưỡng '+range+' cm đạt M5');
    assert.ok(pro.events.some(e=>e.type==='sensorMaster'));
    assert.equal(pro.s.reason,'');
  }
  const missed=run({pro:true,wait:1,ranges:[5,15]});
  assert.equal(missed.s.reason,'missed-child');
  assert.equal(missed.s.done.m5,false);
  assert.ok(missed.events.some(e=>e.type==='miss'));
  const falsePositive=run({pro:true,wait:1,ranges:[50,15]});
  assert.equal(falsePositive.s.reason,'false-positive');
  assert.equal(falsePositive.s.done.m5,false);
  assert.equal(run({pro:true,wait:1,ranges:[15,50]}).s.done.m5,false,
    'Cự ly sai ở lượt thứ hai cũng phải trượt');
  assert.equal(run({wait:1}).s.done.m5,false,'Chỉ Nâng cao mới ghi M5');

  const build=JSON.parse(read('content/lop1/bai08/build.json'));
  assert.equal(build.steps,19);
  assert.equal(build.instances.length,57);
  assert.equal(build.meshes.length,32);
  for(const mesh of build.meshes)
    assert.ok(fs.existsSync(path.join(root,mesh)),'Thiếu mesh '+mesh);
  for(let step=1;step<=19;step++) {
    const file=path.join(root,'assets/lop1-bai08','step-'+String(step).padStart(2,'0')+'.jpg');
    assert.ok(fs.existsSync(file),'Thiếu bước '+step);
    const b=fs.readFileSync(file);
    assert.ok(b.length>3000&&b[0]===255&&b[1]===216&&b.at(-2)===255&&b.at(-1)===217,
      'JPEG không đầy đủ ở bước '+step);
    assert.equal(L.book({page:step}).src,
      'assets/lop1-bai08/step-'+String(step).padStart(2,'0')+'.jpg');
  }
  assert.ok(fs.statSync(path.join(root,'assets/covers/lop1-bai08.jpg')).size>5000);
  const ctx3D={window:{},Math};
  await load3D(ctx3D,'lop1/bai08');
  assert.equal(ctx3D.window.LESSON_3D_DATA.instances.length,57);
  assert.equal(L.creative.presets.length,4);
  assert.equal(L.creative.slots.length,4);
  const H={
    by:name=>build.instances.filter(p=>p.name===name),
    make:(source,pos,rotation)=>({...source,pos,rotation})
  };
  const added=L.creative.placements(build,H);
  for(const slot of L.creative.slots) for(const option of slot.options) {
    assert.ok(added[slot.id+':'+option.id]?.length,'Gói 3D '+option.id+' phải có mesh');
    const upgraded=run({wait:1,upgrades:[option.id]});
    assert.equal(upgraded.s.upgradeRun,true,'M4 yêu cầu chạy nâng cấp '+option.id);
  }
  assert.ok(read('content/lop1/bai08/page.html').includes('scene-hand'));
  assert.ok(read('content/lop1/bai08/page.html').includes('pro-only'));
  console.log('PASS: lop1-bai08 – 13 khối, M2/M3/M5 và ca sai, 19 ảnh, 57 chi tiết, 32 mesh, 4 gói 3D.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
