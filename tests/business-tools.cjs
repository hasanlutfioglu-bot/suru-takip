const assert=require('node:assert/strict'),vm=require('node:vm'),make=require('./audit-harness.cjs');
(async()=>{
 const h=make(),{run,fill,document:d}=h;h.pro();
 run(`db=seed();db.animals=[
 {id:'e',tag:'245',type:'Koyun',sex:'Dişi',status:'Aktif',birth:'2024-01-01',group:'A'},
 {id:'l',tag:'001',type:'Kuzu',sex:'Erkek',status:'Satıldı',birth:'2026-03-01',group:'A'},
 {id:'m',tag:'002',type:'Kuzu',sex:'Dişi',status:'Öldü',birth:'2026-03-01',deathDate:'2026-04-01',group:'B'}];
 db.records=[{id:'b',kind:'birth',motherId:'e',count:2,childIds:['l','m'],date:'2026-03-01'},
 {id:'ex',kind:'breeding',animalId:'e',date:'2026-01-01'},
 {id:'w',kind:'weaning',animalId:'l',date:'2026-05-01'},
 {id:'feed',kind:'feeding',stockItem:'Arpa',stockQty:10,feedCost:100,animalIds:['l','m'],date:'2026-03-10'},
 {id:'purchase',kind:'stock',amount:200,stockItem:'Arpa',stockQty:20,date:'2026-03-01'},
 {id:'sale',kind:'sale',amount:1000,animalIds:['l','m'],date:'2026-06-01',label:'Sale'}];save()`);
 const originalFinance=run("JSON.stringify([calcFinance('all').income,calcFinance('all').expense])");
 run("openSettlementForm('sale')");fill('settlementParty','Buyer');fill('settlementDue','2026-12-01');fill('settlementPaid','250');run('submitSettlement()');
 assert.equal(run('paymentRows()[0].remaining'),750);
 assert.equal(run("JSON.stringify([calcFinance('all').income,calcFinance('all').expense])"),originalFinance,'tracking never creates duplicate accounting amounts');
 const tracked=run('JSON.stringify(db)');
 run("openSettlementForm('sale')");fill('settlementPaid','1001');run('submitSettlement()');assert.equal(run('JSON.stringify(db)'),tracked,'overpayment is rejected atomically');
 fill('settlementPaid','100');run('submitSettlement()');assert.equal(run('JSON.stringify(db)'),tracked,'reductions require an explanation');
 fill('settlementNote','Correction');run('submitSettlement()');assert.equal(run('paymentRows()[0].remaining'),900);
 const groups=JSON.parse(run('JSON.stringify(groupCostData())'));
 assert.equal(groups.reduce((n,x)=>n+x.feed,0),100,'feed purchase is not counted again');
 assert.equal(groups.reduce((n,x)=>n+x.sales,0),1000,'shared sale allocation conserves the original total');
 const metrics=JSON.parse(run("JSON.stringify(seasonData('2026-01-01','2026-12-31'))"));
 assert.equal(metrics.born,2);assert.equal(metrics.weaned,1);assert.equal(metrics.mortality,50);assert.equal(metrics.exposed,1);
 run("db.records.find(r=>r.id==='b').childIds=['l']");assert.equal(run("seasonData('2026-01-01','2026-12-31').mortality"),null,'incomplete cohorts never imply a mortality rate');
 run("db.records.find(r=>r.id==='b').childIds=['l','m'];save()");
 const logCount=run('db.auditLog.length');assert(logCount>1);
 const event=run('JSON.stringify(db.auditLog[0])');run("opCommit(()=>db.records.find(r=>r.id==='sale').note='Changed')");
 assert.equal(run('JSON.stringify(db.auditLog[0])'),event,'older history entries do not alias mutable records');
 assert.equal(make(h.storage).run('db.auditLog.length'),logCount+1,'history survives a restart');

 // Independent fields on one record merge; a reviewed field choice preserves them.
 run(`testBase=cloneState(db);testLocal=cloneState(db);testRemote=cloneState(db);
 testLocal.animals[0].tag='LOCAL';testLocal.animals[0].group='New group';testRemote.animals[0].tag='REMOTE';
 db=testLocal;cloudBase=testBase;showSyncConflict(testRemote,'v1')`);
 assert.equal(run('syncConflict.keys.length'),1);
 run("chooseSyncRecord(0,'remote')");await run('resolveChosenConflicts()');
 assert.equal(run("db.animals.find(a=>a.id==='e').tag"),'REMOTE');assert.equal(run("db.animals.find(a=>a.id==='e').group"),'New group');
 run("testLocal=cloneState(db);testRemote=cloneState(db);testLocal.animals[0].tag='TAG';testRemote.animals[0].group='GROUP'");
 assert.equal(run('mergeStates(db,testLocal,testRemote).conflicts.length'),0);

 run('openTaskForm()');fill('taskText','Feed group A');fill('taskDate','2026-12-01');fill('taskAssignee','Worker');run('submitTaskForm()');
 const taskId=run('db.tasks[0].id');run('doneTask(0)');assert.equal(run('db.tasks.length'),0);
 const completed=run("db.records.find(r=>r.kind==='task_done').id");h.c.completed=completed;
 run('restoreCompletedTask(completed)');assert.equal(run('db.tasks[0].id'),taskId);
 run('postponeTask(db.tasks[0].id)');assert.equal(run('db.tasks[0].date'),run('addDaysISO(today(),1)'));
 assert(run("db.records.some(r=>r.kind==='task_done')"),'reopening keeps completion history');

 // Every generated management action must be syntactically valid in both languages.
 for(const language of ['tr','en']){
  run(`setAppLanguage('${language}')`);
  for(const call of ['openAuditHistory()','openPaymentTracker()','openSeasonReport()','openGroupCostReport()','openTaskHistory()','openTagLookup()','openRecentAnimals()','openHomeShortcuts()']){
   run(call);for(const button of d.querySelectorAll('#modalBody [onclick]'))new vm.Script(button.getAttribute('onclick'));
  }
 }
 run("lookupTag('suru:tag:001')");assert(d.getElementById('modalBody').textContent.includes('001'));
 const beforeView=run('JSON.stringify(db)');run('openSeasonReport();openGroupCostReport();openPaymentTracker();openAuditHistory()');assert.equal(run('JSON.stringify(db)'),beforeView);

 const large=make();large.pro();large.run("db=seed();for(let i=0;i<250;i++)db.animals.push({id:'a'+i,tag:String(i),type:'Koyun',sex:'Dişi',status:'Aktif'});go('herd')");
 assert.equal(large.document.querySelectorAll('#herdList .herdAnimal').length,100);large.run('showMoreHerd()');assert.equal(large.document.querySelectorAll('#herdList .herdAnimal').length,200);
 large.fill('herdSearch','249');large.run('renderHerd()');assert.equal(large.document.querySelectorAll('#herdList .herdAnimal').length,1);
 large.run("renderReports=()=>{throw Error('Hidden reports rendered')};renderGrowth=()=>{throw Error('Hidden growth rendered')};go('home')");
 console.log('PASS: payment conservation/validation, cohort completeness, group allocations, immutable history copies, field conflict resolution, task completion/reopen, generated actions, scoped lookup and lazy/paged rendering');
})().catch(e=>{console.error(e);process.exitCode=1});

