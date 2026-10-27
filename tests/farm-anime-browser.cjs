const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1100},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',r=>r.request().url()==='https://anime.test/v21.html'?r.fulfill({contentType:'text/html',body:fs.readFileSync('v21.html')}):r.request().url()==='https://anime.test/assets/farm/anime-countryside-v1.webp'?r.fulfill({contentType:'image/webp',body:fs.readFileSync('assets/farm/anime-countryside-v1.webp')}):r.abort());
  await page.goto('https://anime.test/v21.html');
  await page.evaluate(()=>{currentPlan='pro';subscriptionStatus='active';db=seed();db.animals=[{id:'dam',tag:'D1',type:'Koyun',sex:'Dişi',status:'Aktif',breedingStatus:'Anaç'},{id:'kid',tag:'K1',type:'Kuzu',sex:'Erkek',status:'Aktif',motherId:'dam'},{id:'ewe',tag:'M1',type:'Koyun',sex:'Dişi',status:'Aktif',breedingStatus:'Anaç'},...Array.from({length:7},(_,i)=>({id:'feed'+i,tag:'F'+i,type:'Kuzu',sex:'Erkek',status:'Aktif',group:'Besi'}))];db.records=[];farmScene.preview='day';go('home')});
  await page.mouse.move(0,0);
  assert(await page.evaluate(async()=>{const image=new Image();image.src=document.querySelector('.farmPaintedBackground').getAttribute('href');await image.decode();return image.naturalWidth>1000}),'real painted asset loads');
  const data=await page.evaluate(()=>JSON.stringify(db));
  const pose=async fraction=>page.evaluate(fraction=>{const result={};for(const el of document.querySelectorAll('#pastureAnimals .farmRoam')){const a=el.getAnimations().find(a=>['farm-roam','farm-feed-roam'].includes(a.animationName));if(!a)throw Error('Missing walk animation');const t=a.effect.getTiming();a.pause();a.currentTime=t.duration*(1+fraction)+t.delay;const m=new DOMMatrix(getComputedStyle(el).transform),id=el.closest('[data-farm-animal]').dataset.farmAnimal,figure=farmProjection().figures.find(f=>f.a.id===id);result[id]=[m.e*figure.scale,m.f*figure.scale]}return result},fraction);
  const start=await pose(.08),end=await pose(.28);
  assert(Math.abs(end.ewe[0]-start.ewe[0])>30,'ewe traverses the pasture, not just bobs in place');
  assert(Math.abs(end.dam[0]-end.kid[0])<.05&&Math.abs(end.dam[1]-end.kid[1])<.05,'different-size mother and lamb travel together');
  const bounds=await page.evaluate(()=>farmProjection().figures.every(f=>{const [left,right,top,bottom]=f.roam.bounds;return [0,1].every(k=>f.x+f.roam.dx*k>=left-.01&&f.x+f.roam.dx*k<=right+.01&&f.y+f.roam.dy*k>=top-.01&&f.y+f.roam.dy*k<=bottom+.01)}));assert(bounds,'walk endpoints remain inside the assigned pen');
  await page.evaluate(()=>togglePastureMotion());assert.equal(await page.locator('#pastureAnimals .farmRoam').first().evaluate(e=>getComputedStyle(e).animationPlayState),'paused');await page.evaluate(()=>togglePastureMotion());
  await page.evaluate(()=>{farmScene.preview='night';renderLivePasture()});assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#pastureAnimals .farmRoam')).animationName),'none');assert.equal(await page.locator('#pastureAnimals .farmStanding').first().evaluate(e=>getComputedStyle(e).display),'none');
  await page.evaluate(()=>{farmScene.preview='day';renderLivePasture()});await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>getComputedStyle(document.querySelector('#pastureAnimals .farmRoam')).animationName==='none');assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#pastureAnimals .farmRoam')).animationName),'none');await page.emulateMedia({reducedMotion:'no-preference'});
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:1100});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)}
  assert.equal(await page.evaluate(()=>JSON.stringify(db)),data,'scenery, walking, night and reduced motion never mutate records');assert.deepEqual(errors,[]);
  console.log('PASS: painted asset, real bounded walks, family synchronization, pause/night/reduced motion, responsive layout and unchanged records');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
