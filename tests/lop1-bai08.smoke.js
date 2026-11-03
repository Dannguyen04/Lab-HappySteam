// Browser smoke: trang thật, 3D, sách lắp, bốn gói, giao diện Bé/Nâng cao và M2/M3/M5.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const {pageUrl}=require('./helpers/page-url');
(async()=>{
  const executablePath=[
    process.env.ZM_CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ].find(p=>p&&fs.existsSync(p));
  const browser=await chromium.launch({
    headless:true,...(executablePath?{executablePath}:{})
  });
  try {
    const page=await browser.newPage({viewport:{width:1366,height:860}});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{
      if(r.status()>=400&&!(r.status()===404&&new URL(r.url()).pathname==='/js/lop1-bai08/art.js'))
        errors.push(r.status()+' '+r.url());
    });
    await page.goto(pageUrl('bai.html?id=lop1-bai08'));
    await page.evaluate(()=>localStorage.clear());
    await page.reload();
    await page.waitForFunction(()=>window.robotViewer&&window.simEngine,null,{timeout:20000});
    await page.locator('#lesson-loading').waitFor({state:'detached',timeout:20000});
    assert.match(await page.title(),/Cổng nhà thông minh/);
    assert.equal(await page.locator('html').getAttribute('data-mode'),'kid');
    assert.equal(await page.evaluate(()=>window.robotViewer.stats().instances),57);
    assert.ok(await page.locator('#chip-m5').isHidden());
    assert.ok(await page.locator('#m-gate-distance').isHidden());
    await page.locator('#book-img').evaluate(el=>el.decode());
    assert.ok(await page.locator('#book-img').evaluate(el=>el.naturalWidth>0));
    await page.click('#tab-btn-creative');
    assert.equal(await page.locator('[data-preset]').count(),4);
    for (const id of ['canopy','led','number','flowers']) {
      await page.click('[data-preset="'+id+'"]');
      assert.ok(await page.evaluate(()=>window.robotViewer.stats().creative>0),
        'Gói '+id+' gắn lên mô hình 3D');
    }
    await page.click('#creative-deploy');
    assert.equal(await page.locator('#tab-btn-sim').getAttribute('aria-selected'),'true');
    await page.waitForFunction(()=>document.getElementById('space-scene').width>100);
    await page.waitForTimeout(200);
    const pixel=await page.locator('#space-scene').evaluate(cv=>{
      const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
      let opaque=0, varied=0;
      for(let i=0;i<d.length-4;i+=144) {
        if(d[i+3]) opaque++;
        if(d[i]!==d[0]||d[i+1]!==d[1]||d[i+2]!==d[2]) varied++;
      }
      return {opaque,varied};
    });
    assert.ok(pixel.opaque>100&&pixel.varied>100,'Canvas có cảnh vẽ: '+JSON.stringify(pixel));
    assert.ok(await page.locator('#scene-hand').isVisible());
    page.once('dialog',d=>d.accept());
    await page.click('#btn-load-sample');
    assert.match(await page.locator('#ghost-score').innerText(),/13\/13/);
    await page.click('#btn-run-program');
    const sample=await page.evaluate(()=>{
      const s=window.simEngine; s.pauseLoop();
      for(let i=0;i<600&&s.running;i++) s.advance(.05);
      return {m2:s.done.m2,m3:s.done.m3,stopped:!s.running,creative:s.upgradeRun};
    });
    assert.deepEqual(sample,{m2:true,m3:false,stopped:true,creative:true});
    assert.ok(await page.locator('#chip-m2').evaluate(el=>el.classList.contains('is-done')));
    await page.click('#btn-mode');
    assert.equal(await page.locator('html').getAttribute('data-mode'),'pro');
    assert.ok(await page.locator('#chip-m5').isVisible());
    assert.ok(await page.locator('#m-gate-distance').isVisible());
    const advanced=await page.evaluate(()=>{
      const s=window.simEngine;
      const p=window.LESSON.blocks.sample.map(item=>{
        const [key,props]=Array.isArray(item)?item:[item,{}];
        return {...window.BLOCK_TEMPLATES[key],...props};
      });
      p[5].duration=1; p[2].range=15; p[7].range=20;
      s.setProgram(p); s.start(); s.pauseLoop();
      for(let i=0;i<600&&s.running;i++) s.advance(.05);
      return {m2:s.done.m2,m3:s.done.m3,m5:s.done.m5,reason:s.reason};
    });
    assert.deepEqual(advanced,{m2:true,m3:true,m5:true,reason:''});
    assert.deepEqual(errors,[],'Không được lỗi JS/HTTP trong trình duyệt');
    const mobile=await browser.newPage({viewport:{width:375,height:760},isMobile:true});
    const mobileErrors=[];
    mobile.on('pageerror',e=>mobileErrors.push(e.message));
    await mobile.goto(pageUrl('bai.html?id=lop1-bai08'));
    await mobile.waitForFunction(()=>window.robotViewer&&window.simEngine,null,{timeout:20000});
    await mobile.locator('#lesson-loading').waitFor({state:'detached',timeout:20000});
    for(const tab of ['#tab-btn-asm','#tab-btn-creative','#tab-btn-sim']) {
      await mobile.click(tab);
      const widths=await mobile.evaluate(()=>[
        document.documentElement.scrollWidth,document.documentElement.clientWidth
      ]);
      assert.ok(widths[0]<=widths[1],'Tràn ngang mobile '+tab+': '+widths);
    }
    assert.deepEqual(mobileErrors,[]);
    console.log('PASS: lop1-bai08 smoke – Chrome, 3D, 4 gói, Canvas, M2/M3/M5, mobile 375px.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
