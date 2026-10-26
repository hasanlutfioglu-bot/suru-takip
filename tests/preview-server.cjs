const assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {chromium}=require('playwright');
(async()=>{
 const server=spawn(process.execPath,['scripts/dev-server.cjs','--port=0'],{stdio:['ignore','pipe','pipe'],windowsHide:true});
 let browser;try{
  const url=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Preview startup timed out')),10000);server.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match){clearTimeout(timer);resolve(match[0])}});server.once('error',reject);server.once('exit',code=>{clearTimeout(timer);reject(Error('Preview exited '+code))})});
  for(const endpoint of ['/.git/config','/db/release-readiness.sql','/supabase/functions/delete-account/index.ts','/backups/test.json','/package.json','/web/device-state.js'])assert.equal((await fetch(url+endpoint)).status,404,endpoint+' must not be served');
  assert.equal((await fetch(url+'/v21.html',{method:'POST'})).status,405);
  const old=await fetch(url+'/v17.html?test=1',{redirect:'manual'});assert.equal(old.status,302);assert.equal(old.headers.get('location'),'/v21.html?test=1');
  browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],external=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{if(route.request().url().startsWith(url))return route.continue();external.push(route.request().url());return route.abort()});
  await page.goto(url+'/v21.html');await page.waitForFunction(()=>deviceCanWrite());
  assert.equal(await page.evaluate(()=>sb),null,'default preview cannot connect to the live database');
  assert.equal(await page.evaluate(()=>KEY),'suru_takip_preview_v5','preview storage is isolated');
  await page.locator('.nav[data-go="herd"]').click();await page.locator('#herd [onclick="openAddAnimal()"]').click();
  await page.locator('#newAnimalTag').fill('PREVIEW-1');await page.locator('[onclick="saveNewAnimal()"]').click();
  assert.equal(await page.evaluate(()=>db.animals.length),1);await page.reload();await page.waitForFunction(()=>deviceCanWrite());assert.equal(await page.evaluate(()=>db.animals.length),1);
  assert.equal(external.some(url=>url.includes('supabase.co')),false);assert.deepEqual(errors,[]);
  console.log('PASS: HTTP preview → real browser form → isolated local storage → reload; live database disabled and private source paths denied');
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
