const assert=require('node:assert/strict');
(async()=>{
 const {parseHTML}=require('linkedom'),vm=require('vm'),fs=require('fs');
 const html=fs.readFileSync('v21.html','utf8'),storage=new Map(),errors=[];
 let document,c;
 function init(){document=parseHTML(html).document;c={document,console,Date,Math,Intl,Set,Map,JSON,Number,String,Array,Blob,URL,setTimeout:()=>0,clearTimeout:()=>{},navigator:{onLine:false},location:{protocol:'https:',origin:'https://example.test',pathname:'/v21.html'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),key:i=>[...storage.keys()][i],get length(){return storage.size}},confirm:()=>true,prompt:()=> 'Test görevi'};c.window=c;c.addEventListener=()=>{};c.scrollTo=()=>{};
 for(const id of new Set([...html.matchAll(/id="([A-Za-z0-9_]+)"/g)].map(x=>x[1])))if(!new RegExp('function '+id+'\\(').test(html))Object.defineProperty(c,id,{get:()=>document.getElementById(id),configurable:true});vm.createContext(c);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],c)}
 init();
 function defaults(){document.querySelectorAll('select').forEach(e=>{if(!e.value)Object.defineProperty(e,'value',{value:(e.querySelector('option[selected]')||e.querySelector('option'))?.getAttribute('value')||(e.querySelector('option[selected]')||e.querySelector('option'))?.textContent||'',writable:true,configurable:true})})}
 function loc(selector,index=0){const el=()=>document.querySelectorAll(selector)[index];return {nth:i=>loc(selector,i),fill:async v=>{el().value=v},selectOption:async v=>{Object.defineProperty(el(),'value',{value:v,writable:true,configurable:true})},inputValue:async()=>{defaults();return el().value},textContent:async()=>el().textContent,isVisible:async()=>selector==='#modal'?el().classList.contains('show'):el().classList.contains('active'),check:async()=>el().setAttribute('checked','')}}
 const page={evaluate:async s=>vm.runInContext(typeof s==='function'?'('+s.toString()+')()':(defaults(),s),c),locator:loc,reload:async()=>init()};
 const browser={close:async()=>{}},context={setOffline:async()=>{}};
 await page.evaluate(()=>{currentPlan='pro';subscriptionStatus='active';db=seed();db.animals=[{id:'e1',type:'Koyun',sex:'Dişi',status:'Aktif',tag:'245',breedingStatus:'Anaç'},{id:'e2',type:'Koyun',sex:'Dişi',status:'Aktif',tag:'246',breedingStatus:'Anaç'}];save()});
 const run=s=>page.evaluate(s),fill=(id,v)=>page.locator('#'+id).fill(v),select=(id,v)=>page.locator('#'+id).selectOption(v);
 assert.equal(await page.locator('#heroTotal').textContent(),'2 hayvan');assert.equal(await page.locator('#homeBirthRate').textContent(),'—');
 for(const screen of ['home','herd','add','reports','all']){await run(`go('${screen}')`);assert(await page.locator('#'+screen).isVisible())}
 assert.equal(document.getElementById('chat'),null,'paid AI screen is removed');assert.equal(document.querySelector('.aiNav'),null,'paid AI button is removed');assert.equal(document.querySelector('#all button[onclick*=\"chat\"]'),null,'paid AI menu entry is removed');assert.equal(html.includes("functions.invoke('suru-ai'"),false,'paid AI API is not called');
 for(const sub of ['health','births','performance','calendar','weights','stock','finance','moves','today']){await run(`openSub('${sub}')`);assert(await page.locator('#sub').isVisible())}
 for(const kind of ['birth','health','weight','sale','stock','income','expense','harvest','note']){await run(`openAdd('${kind}')`);assert(await page.locator('#modal').isVisible());await run('closeModal()')}
 for(const form of ['openBackup()','openAccount()','openInitialSetup()','openBulkTags()','openBulkSex()']){await run(form);assert(await page.locator('#modal').isVisible());await run('closeModal()')}
 await run('openAddAnimal()');await select('newAnimalType','Koç');await run('syncNewAnimalSex()');await fill('newAnimalTag','300');await run('saveNewAnimal()');assert.equal(await run('db.animals.length'),3);
 await run('openAddAnimal()');await fill('newAnimalTag','300');await run('saveNewAnimal()');assert.equal(await run('db.animals.length'),3);await run('closeModal()');
 await run("openAdd('birth')");await select('mother','e1');await select('count','2');await run('renderBirthSexFields(2)');await page.locator('.birthSex').nth(0).selectOption('Erkek');await page.locator('.birthSex').nth(1).selectOption('Dişi');await run('submitBirth()');
 assert.equal(await run('db.animals.length'),5);assert.equal(await page.locator('#homeBirthRate').textContent(),'2,0');assert.equal(await run("db.records.find(r=>r.kind==='birth').childIds.length"),2);
 await run("openAdd('birth')");await select('mother','e2');await run('submitBirth()');assert.equal(await page.locator('#homeBirthRate').textContent(),'1,5');
 const lamb=await run("db.animals.find(a=>a.type==='Kuzu'&&a.sex==='Erkek').id");
 await run(`db.animals.find(a=>a.id==='${lamb}').status='Satılacak';save()`);assert.equal(await page.locator('#homeSaleReady').textContent(),'1');
 await run("openAdd('income')");await fill('amount','1000');await run("submitSimple('income')");
 await run("openAdd('expense')");await fill('amount','200');await run("submitSimple('expense')");assert.equal(await run("calcFinance('all').income-calcFinance('all').expense"),800);
 await run('openSaleCandidates()');await page.locator('.saleAnimal').check();await fill('amount','5000');await run("submitSelectedSale('sale_candidates')");assert.equal(await run(`db.animals.find(a=>a.id==='${lamb}').status`),'Satıldı');assert.equal(await page.locator('#homeSaleReady').textContent(),'0');
 await run("deleteRecord(db.records.find(r=>r.kind==='sale').id)");assert.equal(await run(`db.animals.find(a=>a.id==='${lamb}').status`),'Satılacak');
 await run(`openAddForAnimal('weight','${lamb}')`);await select('animal',lamb);await fill('weight','45');await run("submitAnimal('weight')");assert.equal(await run(`db.animals.find(a=>a.id==='${lamb}').weight`),45);
 await run("editRecord(db.records.find(r=>r.kind==='weight').id)");await fill('editWeight','47');await run("saveRecordEdit(db.records.find(r=>r.kind==='weight').id,'weight')");assert.equal(await run(`db.animals.find(a=>a.id==='${lamb}').weight`),47);
 await run("deleteRecord(db.records.find(r=>r.kind==='birth'&&r.motherId==='e1').id)");assert.equal(await run("db.records.filter(r=>r.kind==='birth').length"),2); // linked weight blocks unsafe deletion
 await run("openAdd('health')");await select('animal','e1');await fill('note','Aşı');await run("submitAnimal('health')");assert.equal(await run("db.records.filter(r=>r.kind==='health').length"),1);
 await run("openAdd('stock')");const item=await page.locator('#cat').inputValue();await fill('qty','10');await fill('amount','100');await run('submitStock()');assert.equal(await run(`db.stock[${JSON.stringify(item)}]`),10);
 await run("deleteRecord(db.records.find(r=>r.kind==='stock').id)");assert.equal(await run(`db.stock[${JSON.stringify(item)}]`),0);
 await run("openAdd('harvest')");await fill('harvestProduct','Arpa');await fill('qty','50');await run('submitHarvest()');assert.equal(await run('db.stock.Arpa'),50);
 await run("deleteRecord(db.records.find(r=>r.kind==='harvest').id)");assert.equal(await run('db.stock.Arpa'),0);
 await run("openAdd('note')");await fill('note','Kontrol');await run('submitNote()');assert(await run("db.records.some(r=>r.kind==='note'&&r.note==='Kontrol')"));
 await run('openRamMating()');await fill('ramRemovalDate',await run('addDaysISO(today(),30)'));await run('saveRamMating()');assert.equal(await run('db.ramCalendar.length'),1);await run("addTask()");assert.equal(await run('db.tasks.length'),1);await run('doneTask(0)');assert.equal(await run('db.tasks.length'),0);
 const backup=await run('JSON.stringify({format:"suru-takip-backup",version:1,data:db})');assert.equal(await run(`validateBackup(JSON.parse(${JSON.stringify(backup)})).animals.length`),6);
 await run("quickAnimalSearch.value='245';quickAnimalLookup()");assert((await page.locator('#quickAnimalResults').textContent()).includes('245'));
 for(const m of ['monthly','yearly','all','birthperiod'])await run(`setReport('${m}')`);
 await run('go("home")');
 const before=await run('db.animals.length');await context.setOffline(true);await page.reload();assert.equal(await run('db.animals.length'),before);assert.equal(await page.locator('#homeBirthRate').textContent(),'1,5');
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: all screens/submenus/forms, animal add and duplicate rejection, birth child links and decimal rate, finance, sale and reversal, weight edit, guarded birth deletion, health, stock/harvest reversals, notes, calendar/tasks, backup validation, search, report periods, offline reload (DOM simulation)');
})().catch(e=>{console.error(e);process.exit(1)});
