const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  await context.route('**/*',r=>r.request().url()==='https://reports.test/v21.html'?r.fulfill({contentType:'text/html',body:fs.readFileSync('v21.html','utf8')}):r.abort());
  page.on('pageerror',e=>errors.push(e.message));await page.goto('https://reports.test/v21.html');await page.waitForFunction(()=>deviceCanWrite());
  await page.evaluate(()=>{currentPlan='pro';subscriptionStatus='active';currentPeriodEnd='2099-01-01T00:00:00Z';db=seed();db.animals=[{id:'l',tag:'REPORT-1',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:addDaysISO(today(),-120)}];db.records=[{id:'i',kind:'income',category:'Hayvan satışı',date:today(),amount:500},{id:'f',kind:'expense',category:'Tarla · İlaçlama',date:today(),amount:100},{id:'m',kind:'expense',category:'İlaç',date:today(),amount:20}];invalidateRecordIndex();go('reports')});
  const data=await page.evaluate(()=>JSON.stringify(db));
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   for(const view of ['overview','finance','herd','archive']){
    await page.locator('[data-report-view="'+view+'"]').click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,view+' at '+width+'px');
    assert.equal(await page.locator('[data-report-panel="'+view+'"]').isVisible(),true);
   }
  }
  await page.locator('[data-report-view="finance"]').click();await page.locator('.reportScopeDetails>summary').click();
  assert.equal(await page.locator('.reportScopeDetails .reportReadingGrid').isVisible(),true);
  await page.locator('#financeVizBars summary').click();assert.equal(await page.locator('#financeVizBars tbody tr').count(),6);
  await page.locator('[data-report-panel="finance"] .reportExtra>summary').click();
  await page.locator('[onclick="openFinanceDetail(\'field\')"]').click();assert.match(await page.locator('#modalBody').innerText(),/100/);assert.doesNotMatch(await page.locator('#modalBody').innerText(),/120 TL/);
  await page.evaluate(()=>closeModal());assert.equal(await page.evaluate(()=>JSON.stringify(db)),data,'drilldowns, charts and panels preserve all data');
  assert.deepEqual(errors,[]);await context.close();
  console.log('PASS: four report panels at 320/390/768/1440px, scope expansion, chart table, reconciled category drilldown, no data changes or browser errors');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
