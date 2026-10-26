const fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.route('**/*',r=>r.request().url()==='https://benchmark.invalid/v21.html'?r.fulfill({contentType:'text/html',body:fs.readFileSync('v21.html','utf8')}):r.abort());
  await page.goto('https://benchmark.invalid/v21.html');await page.waitForFunction(()=>deviceCanWrite());
  const results=[];for(const count of [20,100,300,1000])results.push(await page.evaluate(count=>{
   db=seed();currentPlan='pro';subscriptionStatus='active';currentPeriodEnd='2099-01-01T00:00:00Z';db.setupDone=true;
   for(let i=0;i<count;i++){const id='bench_'+i;db.animals.push({id,tag:String(1000+i),type:'Kuzu',sex:i%2?'Erkek':'Dişi',status:'Aktif',birth:addDaysISO(today(),-120),weight:35});for(let j=0;j<10;j++)db.records.push({id:'w_'+i+'_'+j,kind:'weight',animalId:id,date:addDaysISO(today(),j-20),weight:25+j,label:'Tartım',note:(25+j)+' kg'})}
   const now=performance.now();renderAll();const render=performance.now()-now;const start=performance.now();renderHerd();const herd=performance.now()-start;const write=performance.now();persistLocal();const storage=performance.now()-write;
   return {animals:count,records:db.records.length,homeMs:Math.round(render),herdMs:Math.round(herd),writeMs:Math.round(storage),visibleCards:document.querySelectorAll('#herdList .herdAnimal').length};
  },count));console.table(results);console.log('Synthetic data only; desktop Chromium, no CPU throttling, one sample per size.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
