const assert=require('node:assert/strict'),make=require('./audit-harness.cjs'),h=make();h.pro();
h.run(`db=seed();customReportStart='2024-03-01';customReportEnd='2024-03-31';db.report='all';db.animals=[{id:'a',tag:'101',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:'2024-01-01'},{id:'b',tag:'102',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:'2024-01-01'}];db.records=[
 {id:'prev',kind:'income',date:'2024-01-30',amount:20},
 {id:'prev2',kind:'expense',date:'2024-02-29',amount:5},
 {id:'inc',kind:'income',date:'2024-03-20',category:'Hayvan satışı',amount:500},
 {id:'field',kind:'expense',date:'2024-03-20',category:'Tarla · İlaçlama',amount:100},
 {id:'feed',kind:'stock',date:'2024-03-21',category:'Yem',note:'Veteriner kontrolü sonrası alım',amount:60},
 {id:'med',kind:'expense',date:'2024-03-22',category:'İlaç',amount:20},
 {id:'w1',kind:'weight',animalId:'a',date:'2024-03-01',weight:20},
 {id:'w2',kind:'weight',animalId:'a',date:'2024-03-11',weight:22},
 {id:'w3',kind:'weight',animalId:'a',date:'2024-03-11',weight:23}];invalidateRecordIndex();renderReports()`);
const before=h.run('JSON.stringify(db)');
assert.equal(h.run('previousReportBounds().start'),'2024-01-30','31-day custom range compares preceding 31 days, including leap day');
assert.equal(h.run('previousReportBounds().end'),'2024-02-29');
assert.equal(h.run('previousPeriodRecords().length'),2,'comparison does not depend on sparse March records');
assert.equal(h.run("financeDetailRows('field').reduce((s,r)=>s+r.amount,0)"),100);
assert.equal(h.run("financeDetailRows('medicine').reduce((s,r)=>s+r.amount,0)"),20,'field spraying must not duplicate into medicine');
assert.equal(h.run("financeDetailRows('feed').reduce((s,r)=>s+r.amount,0)"),60,'record category takes precedence over notes');
assert.equal(h.run('financeExpenseGroups().Tarla'),100);
assert.equal(h.run("financeExpenseGroups()['İlaç / Vet.']"),20);
assert.equal(h.run('financeExpenseGroups().Yem'),60);
assert.equal(h.run("reportPeriodLambGrowth(db.animals[0],reportRecords('all')).adg"),300,'numeric weights work without notes; same date is consolidated');
assert.equal(h.run("reportPeriodLambGrowth(db.animals[1],reportRecords('all')).adg"),null,'no weight data is not zero gain');
assert.match(h.document.getElementById('lambPerformanceList').textContent,/300 g\/gün/);
assert.match(h.document.getElementById('financeBreakdown').textContent,/Gelir/);
assert.match(h.document.getElementById('financeBreakdown').textContent,/Gider/);
assert.equal(h.run('currentGrowthPulse().missing'),1,'missing trend must not count as normal');
assert.equal(h.run('currentGrowthPulse().normal+currentGrowthPulse().watch+currentGrowthPulse().control'),1);
assert.equal(h.run('JSON.stringify(db)'),before,'rendering and reading reports never changes records');
h.run("customReportStart='2024-03-01';customReportEnd='';renderReports()");assert.equal(h.run('previousReportBounds()'),null,'open interval has no comparable finite interval');
h.run("customReportStart='';customReportEnd='';db.report='all'");assert.equal(h.run('previousPeriodRecords().length'),0,'all time has no fabricated predecessor');
h.run("db.report='monthly'");
const bound=h.run('previousReportBounds()');assert.match(bound.start,/-01$/,'calendar month starts at first, regardless of entries');
assert.equal(h.run('financeSixMonthData().length'),6);
h.run("customReportStart='2024-01-01';customReportEnd='2024-03-31';renderReports()");
assert.match(h.document.getElementById('financeVizBars').textContent,/Mar 24|Mar\. 24/,'historical chart anchors to selected period');
h.run(`customReportStart='';customReportEnd='';db.animals=[{id:'small',tag:'SMALL',type:'Kuzu',sex:'Erkek',status:'Satılacak',birth:addDaysISO(today(),-120)},{id:'reserve',tag:'RESERVE',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:addDaysISO(today(),-155),breedingReserve:true}];db.records=[{id:'s',kind:'weight',animalId:'small',date:today(),weight:20},{id:'r',kind:'weight',animalId:'reserve',date:today(),weight:49}];invalidateRecordIndex();renderReports()`);
assert.equal(h.document.getElementById('herdReadyStage').textContent,'1');
assert.equal(h.document.getElementById('herdNearStage').textContent,'0','breeding reserve excluded from approaching-sale count');
h.run("openReportDetail('saleReady')");assert.match(h.document.getElementById('modalBody').textContent,/SMALL/,'count opens the complete candidate list even below the value-estimate weight threshold');
assert.doesNotMatch(h.document.getElementById('modalBody').textContent,/RESERVE/);
console.log('PASS: fixed comparison scope/leap boundaries, shared category reconciliation, actual dated weight fields, missing-data state, historical chart, read-only reporting');
