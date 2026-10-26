const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),errors=[];
  await context.route('**/*',route=>route.request().url()==='https://flock.test/v21.html'?route.fulfill({contentType:'text/html',body:fs.readFileSync('v21.html','utf8')}):route.abort());
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('https://flock.test/v21.html');await page.waitForFunction(()=>deviceCanWrite());
  const second=await context.newPage();await second.goto('https://flock.test/v21.html');
  await second.waitForFunction(()=>!writerPending);
  assert.equal(await second.evaluate(()=>deviceCanWrite()),false,'only one real browser tab may write');
  assert.equal(await second.evaluate(()=>canEditData()),false);
  await page.evaluate(()=>{currentPlan='pro';subscriptionStatus='active';currentPeriodEnd='2099-01-01T00:00:00Z';db.animals=[{id:'l',type:'Kuzu',sex:'Erkek',status:'Aktif',tag:'BROWSER-1',birth:'2026-01-01',weight:30}];save()});
  await page.locator('.nav[data-go="herd"]').click();
  await page.evaluate(()=>openSub('finance'));
  await page.evaluate(()=>showModal('Modal','<p>Test</p>'));
  await page.goBack();await page.waitForFunction(()=>!document.getElementById('modal').classList.contains('show'));
  assert.equal(await page.locator('.screen.active').getAttribute('id'),'sub');
  await page.goBack();await page.waitForFunction(()=>document.querySelector('.screen.active').id==='herd');
  await page.goBack();await page.waitForFunction(()=>document.querySelector('.screen.active').id==='home');
  await page.evaluate(()=>openBulkWeight());
  await page.locator('#bulkWeightDate').fill('2026-10-01');
  await page.locator('.bulkWeightInput').fill('35.5');
  await page.reload();await page.waitForFunction(()=>deviceCanWrite());
  await page.evaluate(()=>openBulkWeight());
  assert.equal(await page.locator('.bulkWeightInput').inputValue(),'35.5');
  assert.equal(await page.locator('#bulkWeightDate').inputValue(),'2026-10-01');
  await page.evaluate(()=>submitBulkWeight());
  assert.equal(await page.evaluate(()=>db.records.find(r=>r.kind==='weight').weight),35.5);
  // A rejected device write must retain the form and the last committed herd.
  await page.evaluate(()=>{closeModal();openAddAnimal();document.getElementById('newAnimalTag').value='QUOTA';window.quotaBefore=JSON.stringify(db);const original=Storage.prototype.setItem;window.restoreStorage=()=>Storage.prototype.setItem=original;Storage.prototype.setItem=function(key,value){if(key===activeStorageKey)throw Error('QuotaExceededError');return original.call(this,key,value)}});
  await page.locator('[onclick="saveNewAnimal()"]').click();
  assert.equal(await page.evaluate(()=>JSON.stringify(db)===window.quotaBefore),true);
  assert.equal(await page.locator('#newAnimalTag').inputValue(),'QUOTA');
  await page.evaluate(()=>window.restoreStorage());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
  await page.evaluate(()=>{cloudFarmId='test-farm';cloudDirty=true;persistLocal()});
  await second.waitForFunction(()=>cloudDirty);
  await page.close();await second.waitForFunction(()=>deviceCanWrite(),{},{timeout:10000});
  assert.equal(await second.evaluate(()=>db.animals.length),1,'reader observes committed changes before becoming writer');
  assert.equal(await second.evaluate(()=>cloudDirty),true,'takeover preserves pending sync metadata');
  await context.close();
  console.log('PASS: real Chromium single-writer lock/takeover, history navigation, dated drafts/reload, atomic quota failures and mobile layout');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
