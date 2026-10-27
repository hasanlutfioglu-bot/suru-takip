const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(15000);
  await context.route('**/*',r=>r.request().url()==='https://pasture.test/v21.html'?r.fulfill({contentType:'text/html',body:fs.readFileSync('v21.html','utf8')}):r.abort());
  page.on('pageerror',e=>errors.push(e.message));await page.goto('https://pasture.test/v21.html');await page.waitForFunction(()=>deviceCanWrite());
  await page.evaluate(()=>{currentPlan='pro';subscriptionStatus='active';currentPeriodEnd='2099-01-01T00:00:00Z';db=seed();db.animals=Array.from({length:40},(_,i)=>({id:'p'+i,tag:String(i+1),type:i===38?'Koç':i===39?'Kuzu':'Koyun',sex:i>=38?'Erkek':'Dişi',breedingStatus:i<38?'Anaç':'',status:'Aktif',birth:addDaysISO(today(),i>=39?-80:-800)}));save();go('home')});
  assert.equal(await page.locator('.pastureAnimal').count(),40);const original=await page.evaluate(()=>JSON.stringify(db));
  await page.waitForFunction(()=>!document.getElementById('livePasture').classList.contains('pastureOffscreen'));
  assert.equal(await page.locator('.pastureWander').first().evaluate(el=>getComputedStyle(el).animationPlayState),'running');
  await page.locator('#pastureMotionButton').click();
  assert.equal(await page.locator('.pastureWander').first().evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
  assert.equal(await page.locator('#pastureMotionButton').getAttribute('aria-pressed'),'true');
  await page.reload();await page.waitForFunction(()=>deviceCanWrite());assert.equal(await page.locator('#pastureMotionButton').getAttribute('aria-pressed'),'true','pause survives reload');
  await page.locator('#pastureMotionButton').click();await page.locator('.nav[data-go="reports"]').click();
  assert.equal(await page.locator('.pastureWander').first().evaluate(el=>getComputedStyle(el).animationPlayState),'paused','inactive screen suspends animation');
  await page.locator('.nav[data-go="home"]').click();
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'pasture has no page overflow at '+width)}
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.getElementById('pastureMotionButton').disabled);
  assert.equal(await page.locator('.pastureWander').first().evaluate(el=>getComputedStyle(el).animationName),'none','OS reduced-motion preference disables movement');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>!document.getElementById('pastureMotionButton').disabled);
  await page.setViewportSize({width:390,height:900});await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForFunction(()=>document.getElementById('livePasture').classList.contains('pastureOffscreen'));
  assert.equal(await page.locator('.pastureWander').first().evaluate(el=>getComputedStyle(el).animationPlayState),'paused','offscreen scene suspends animation');
  assert.equal(await page.evaluate(()=>JSON.stringify(db)),original);assert.deepEqual(errors,[]);
  await page.evaluate(()=>{db=seed();db.animals=[...Array.from({length:100},(_,i)=>({id:'m'+i,type:'Koyun',sex:'Dişi',status:'Aktif',breedingStatus:'Anaç'})),...Array.from({length:14},(_,i)=>({id:'c'+i,type:'Kuzu',sex:'Dişi',status:'Aktif',motherId:'m'+i})),...Array.from({length:7},(_,i)=>({id:'f'+i,type:'Kuzu',sex:'Erkek',status:'Aktif'}))];db.records=Array.from({length:7},(_,i)=>({id:'n'+i,kind:'note',action:'finishing_start',animalId:'f'+i,date:today()}));invalidateRecordIndex();farmScene.preview='day';renderAll()});
  assert.equal(await page.locator('#pastureAnimals .pastureAnimal').count(),121);assert.equal(await page.locator('#pastureAnimals .pastureAnimal-lamb[data-zone="nursery"]').count(),14);assert.equal(await page.locator('#pastureAnimals [data-zone="feed"]').count(),7);assert.match(await page.locator('#pastureCaption').textContent(),/121 \/ 121/);await context.close();
  console.log('PASS: real browser motion/pause/reload, inactive/offscreen suspension, reduced-motion preference, responsive SVG, no data changes or browser errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
