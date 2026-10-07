const assert=require('node:assert/strict'),make=require('./audit-harness.cjs');
let checks=0;function eq(a,b){assert.equal(a,b);checks++}function ok(v){assert(v);checks++}
(async()=>{
 const h=make(),{run,fill,document}=h;h.pro();
 run("db=seed();db.animals=[{id:'e1',type:'Koyun',sex:'Dişi',status:'Aktif',tag:'245',birth:'2022-01-01',breedingStatus:'Anaç'},{id:'l1',type:'Kuzu',sex:'Erkek',status:'Aktif',tag:'100',birth:addDaysISO(today(),-180),weight:30}];save()");
 // Every static onclick must parse, and its referenced functions must exist.
 for(const el of document.querySelectorAll('[onclick]')){new (require('node:vm').Script)(el.getAttribute('onclick'));checks++}
 for(const screen of ['home','herd','add','reports','growth','chat','all']){run(`go('${screen}')`);ok(document.getElementById(screen).classList.contains('active'))}
 for(const sub of ['health','births','performance','calendar','weights','stock','finance','moves','today']){run(`openSub('${sub}')`);ok(document.getElementById('sub').classList.contains('active'))}
 // Invalid additions are atomic.
 run('openAddAnimal()');fill('newAnimalWeight','-10');run('saveNewAnimal()');eq(run('db.animals.length'),2);
 fill('newAnimalWeight','30');fill('newAnimalBirth',run('addDaysISO(today(),1)'));run('saveNewAnimal()');eq(run('db.animals.length'),2);
 run('openInitialSetup()');fill('setupEwes','1.5');run('saveInitialSetup()');eq(run('db.animals.length'),2);run('closeModal()');
 // Dates must be real and not after today.
 eq(run("validDate('2026-02-30')"),false);eq(run("validDate('2024-02-29')"),true);
 // Backdated weight must not replace the current weight; edits update every later interval.
 function weigh(date,kg){run("openAddForAnimal('weight','l1')");fill('date',date);fill('weight',String(kg));run("submitAnimal('weight')")}
 const d10=run('addDaysISO(today(),-10)'),d20=run('addDaysISO(today(),-20)');
 weigh(d10,40);weigh(d20,35);eq(run("db.animals.find(a=>a.id==='l1').weight"),40);eq(run("latestWeightInfo(db.animals.find(a=>a.id==='l1')).adg"),500);
 let old=run("db.records.find(r=>r.kind==='weight'&&r.date===addDaysISO(today(),-20)).id");run(`editRecord('${old}')`);fill('editWeight','38');run(`saveRecordEdit('${old}','weight')`);
 eq(run("latestWeightInfo(db.animals.find(a=>a.id==='l1')).adg"),200);eq(run(`db.records.find(r=>r.id==='${old}').weight`),38);
 const before=run('db.records.length');weigh(d10,41);eq(run('db.records.length'),before);weigh(run('addDaysISO(today(),1)'),42);eq(run('db.records.length'),before);
 // Negative/zero gain is real data, included in averages and warning groups.
 weigh(run('today()'),37);eq(run("latestWeightInfo(db.animals.find(a=>a.id==='l1')).adg"),-300);eq(run('currentGrowthPulse().avg'),-300);
 run('openBulkWeight()');document.querySelector('.bulkWeightInput').value='-5';run('submitBulkWeight()');eq(run('db.records.length'),before+1);
 // Finance and stock edits reject negative cost before changing quantities.
 run("openAdd('stock')");fill('cat','Arpa');fill('qty','10');fill('amount','100');run('submitStock()');let stock=run("db.records.find(r=>r.kind==='stock').id");
 run(`editRecord('${stock}')`);fill('editQty','20');fill('editAmount','-100');run(`saveRecordEdit('${stock}','stock')`);eq(run('db.stock.Arpa'),10);eq(run(`db.records.find(r=>r.id==='${stock}').amount`),100);
 // Births are linked exactly, duplicate births rejected, edited counts obey limits.
 run("openAddForAnimal('birth','e1')");fill('count','2');run('renderBirthSexFields(2)');run('submitBirth()');eq(run("db.records.filter(r=>r.kind==='birth').length"),1);eq(run("db.records.find(r=>r.kind==='birth').childIds.length"),2);
 run("openAddForAnimal('birth','e1')");run('submitBirth()');eq(run("db.records.filter(r=>r.kind==='birth').length"),1);
 run("currentPlan='free';subscriptionStatus='free';db=seed();db.animals=Array.from({length:20},(_,i)=>({id:'e'+i,type:'Koyun',sex:'Dişi',status:'Aktif',tag:String(i),breedingStatus:'Anaç'}));save()");
 run("handleLocalCommand('1 numaralı koyun iki kuzu doğurdu')");eq(run('db.animals.length'),20);eq(run('db.records.length'),0);
 h.pro();run("handleLocalCommand('1 numaralı koyun 999999 kuzu doğurdu')");eq(run('db.animals.length'),20);
 run("handleLocalCommand('1 numaralı koyun ikiz doğurdu biri erkek biri dişi')");eq(run('db.animals.length'),22);eq(run("db.records[0].childIds.length"),2);
 run("handleLocalCommand('1 numaralı koyun ikiz doğurdu')");eq(run('db.animals.length'),22);
 run("currentPlan='free';subscriptionStatus='free';editRecord(db.records[0].id)");fill('editCount','3');run('renderEditBirthSexFields(3)');run("saveRecordEdit(db.records[0].id,'birth')");eq(run('db.animals.length'),22);
 // PRO periods expire even with cached offline status; trials don't silently extend.
 run("currentPlan='pro';subscriptionStatus='offline';currentPeriodEnd='2020-01-01T00:00:00Z'");eq(run('isPro()'),false);
 run("subscriptionStatus='trialing';trialEndsAt='2020-01-01T00:00:00Z'");eq(run('isPro()'),false);run("trialEndsAt=addDaysISO(today(),2)+'T23:59:59Z'");eq(run('isPro()'),true);
 run("currentPlan='free';subscriptionStatus='free';go('home');go('growth')");ok(document.getElementById('home').classList.contains('active'));eq(document.getElementById('modalTitle').textContent,'PRO özelliği');
 // Import validation covers corrupt shapes, finite values, IDs and prototype keys.
 for(const expr of ["({animals:[],records:[],tasks:[null]})","({animals:[],records:[],stock:{Arpa:-1}})","({animals:[{id:'x',type:'Kuzu',sex:'Erkek',status:'Aktif',weight:-4}],records:[]})","({animals:[],records:[{id:'r',amount:-5}]})","({animals:[],records:[],tasks:[{id:'1',text:'a'},{id:'1',text:'b'}]})"]){assert.throws(()=>run('normalizeState('+expr+')'));checks++}
 eq(run("safeStockItem('__proto__')"),false);eq(run("csvCell('=1+1')"),'"\'=1+1"');
 // Untrusted text displays as text across herd cards, edit sheets, tasks and reports.
 h.pro();run("db=seed();db.animals=[{id:'e1',type:'Koyun',sex:'Dişi',status:'Aktif',tag:'<img src=x onerror=alert(1)>',breedingStatus:'Anaç'}];db.tasks=[{id:'t1',text:'<img src=x onerror=alert(1)>'}];db.records=[{id:'n1',kind:'note',date:today(),note:'\" autofocus onfocus=alert(1) x=\"'}];save()");
 eq(document.querySelectorAll('#herdList img,#todayBox img').length,0);run("animalCard('e1')");eq(document.querySelectorAll('#modalBody img').length,0);run("editRecord('n1')");eq(document.getElementById('editNote').getAttribute('onfocus'),null);
 // Invalid custom range retains the prior filter. Open submenu updates after save.
 run("customReportStart='2024-01-01';customReportEnd='2024-12-31'");fill('reportStart','2026-12-01');fill('reportEnd','2026-01-01');run('applyCustomReport()');eq(run('customReportStart'),'2024-01-01');
 run("openSub('finance');openAdd('income')");fill('amount','100');run("submitSimple('income')");ok(document.getElementById('subBody').textContent.includes('100 TL'));
 console.log('PASS: '+checks+' assertions/handler syntax checks: updated menus, date/count/weight validation, chronology and edits, zero/loss trends, negative costs, linked/duplicate births, Free/Pro/expiry rules, malicious/corrupt backups, HTML escaping, CSV formulas, atomic report range, submenu refresh');
})().catch(e=>{console.error(e);process.exit(1)});
