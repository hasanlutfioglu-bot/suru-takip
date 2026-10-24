const assert=require('node:assert/strict'),make=require('./audit-harness.cjs');
const h=make();h.pro();const {run,document:d}=h;
run(`db=seed();db.animals=[
{id:'a',tag:'245',type:'Koyun',sex:'Dişi',status:'Aktif'},
{id:'b',tag:'246',type:'Koyun',sex:'Dişi',status:'Aktif'},
{id:'c',tag:'247',type:'Koyun',sex:'Dişi',status:'Aktif'},
{id:'sold',tag:'248',type:'Koyun',sex:'Dişi',status:'Satıldı'},
{id:'candidate',tag:'249',type:'Koyun',sex:'Dişi',status:'Aktif',breedingStatus:'Anaç Adayı'},
{id:'ram',tag:'9',type:'Koç',sex:'Erkek',status:'Aktif'},
{id:'kid',tag:'250',type:'Kuzu',sex:'Erkek',status:'Öldü',birth:'2026-03-01'}];
db.records=[
{id:'a1',kind:'birth',motherId:'a',date:'2026-03-01',count:2,childIds:['kid']},
{id:'a2',kind:'birth',motherId:'a',date:'2026-03-31',count:1},
{id:'s1',kind:'birth',motherId:'sold',date:'2026-03-10',count:2},
{id:'x1',kind:'birth',motherId:'missing',date:'2026-03-20',count:1},
{id:'b1',kind:'birth',motherId:'b',date:'2026-02-28',count:3},
{id:'b2',kind:'birth',motherId:'b',date:'2026-04-01',count:2}];
customReportStart='2026-03-01';customReportEnd='2026-03-31';db.report='all';renderReports()`);
assert.equal(d.getElementById('rBirths').textContent,'6');
assert.equal(d.getElementById('rBirthSummaryLambed').textContent,'3');
assert.equal(d.getElementById('rBirthSummaryNonLambing').textContent,'2');
assert.equal(run("birthMetrics('all').lambingRate"),60);
assert.equal(d.querySelectorAll('#rBirths').length,1,'newborn metric has one DOM identity');
assert.equal(d.querySelectorAll('#reportBirthSummary button').length,3);
assert(d.getElementById('reportBirthPeriod').textContent.includes('2026-03-01'));
run("openReportDetail('births')");assert(d.getElementById('modalBody').textContent.includes('6 kuzu'));
run("openReportDetail('lambedEwes')");assert(d.getElementById('modalBody').textContent.includes('3 anaç'));
run("openReportDetail('nonLambing')");const body=d.getElementById('modalBody').textContent;assert(body.includes('#246'));assert(body.includes('#247'));assert(!body.includes('#245'));assert(!body.includes('#248'));assert(!body.includes('#249'));
const before=run('JSON.stringify(db)');run("switchReportView('herd');switchReportView('finance');switchReportView('overview')");assert.equal(run('JSON.stringify(db)'),before,'report navigation never changes flock data');
run("setReport('birthperiod')");assert.equal(d.querySelector('[data-report="birthperiod"]').classList.contains('active'),true);assert(d.getElementById('reportBirthPeriod').textContent.includes('2026'));
run("customReportStart='2027-01-01';customReportEnd='2027-01-31';renderReports()");assert.equal(d.getElementById('rBirths').textContent,'0');assert.equal(d.getElementById('rBirthSummaryLambed').textContent,'0');assert.equal(d.getElementById('rBirthSummaryNonLambing').textContent,'3');
run("customReportStart='';customReportEnd='';db.records=[{id:'current',kind:'birth',motherId:'a',date:today(),count:2},{id:'old',kind:'birth',motherId:'b',date:(new Date().getFullYear()-1)+'-01-01',count:3}];setReport('monthly')");assert.equal(d.getElementById('rBirths').textContent,'2');assert.equal(d.getElementById('rBirthSummaryNonLambing').textContent,'2');
run("setReport('yearly')");assert.equal(d.getElementById('rBirths').textContent,'2');
console.log('PASS: birth period summary, twins/distinct mothers, sold/missing mothers, deaths retain birth totals, date boundaries, empty/month/year reports, clickable details, consistent counts and read-only navigation');
