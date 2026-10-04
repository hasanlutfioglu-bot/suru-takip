const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',route=>route.request().url()==='https://flock.test/v21.html'?route.fulfill({contentType:'text/html',body:fs.readFileSync('v21.html','utf8')}):route.abort());
  await page.goto('https://flock.test/v21.html');
  assert(await page.evaluate(()=>nativeBackEnabled),'CloseWatcher must be exercised in Chromium');
  await page.evaluate(()=>{currentPlan='pro';subscriptionStatus='active';currentPeriodEnd=addDaysISO(today(),365)+'T23:59:59Z';
   for(const [id,action] of [['testFinance',()=>openSub('finance')],['testModal',()=>showModal('Test','<p>Details</p>')]]){
    const b=document.createElement('button');b.id=id;b.textContent=id;b.onclick=action;b.style.cssText='position:fixed;right:0;z-index:100;top:'+(id==='testFinance'?0:55)+'px';document.body.append(b);
   }
  });
  const screen=()=>page.locator('.screen.active').getAttribute('id');
  const back=async()=>{await page.keyboard.press('Escape');await page.waitForTimeout(80)};
  await page.locator('.nav[data-go="herd"]').click();await back();assert.equal(await screen(),'home');
  await page.locator('.nav[data-go="herd"]').click();
  await page.locator('#testFinance').click();
  await page.locator('#testModal').click();await back();
  assert.equal(await page.locator('#modal').evaluate(e=>e.classList.contains('show')),false);
  assert.equal(await screen(),'sub');
  await back();assert.equal(await screen(),'herd');
  await back();assert.equal(await screen(),'home');
  await back();assert.equal(await page.evaluate(()=>rootBackWatcher===null),true);
  assert.match(await page.locator('#toast').textContent(),/tekrar/);
  // No synthetic history means the next Android Back is owned by the OS.
  assert.equal(await page.evaluate(()=>history.state),null);
  await page.locator('.nav[data-go="herd"]').click();await back();assert.equal(await screen(),'home');
  assert.equal(await page.evaluate(()=>screenBackWatchers.length),0);
  await page.reload();assert(await page.evaluate(()=>nativeBackEnabled));
  await page.locator('.nav[data-go="herd"]').click();await back();assert.equal(await screen(),'home');
  assert.deepEqual(errors,[]);
  console.log('PASS: real Chromium close requests: screen, nested screen, modal, exit handoff, new interaction and reload');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
