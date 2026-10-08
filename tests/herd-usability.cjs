const assert=require('node:assert/strict'),make=require('./audit-harness.cjs');
const a=make();a.pro();
a.run(`db=seed();db.animals=[
 {id:'e',tag:'245',type:'Koyun',sex:'Dişi',status:'Aktif',birth:'2023-01-01'},
 {id:'young',tag:'20',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:addDaysISO(today(),-90),weight:31},
 {id:'boundary',tag:'3',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:addDaysISO(today(),-180),weight:30},
 {id:'small',tag:'4',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:addDaysISO(today(),-180),weight:29},
 {id:'reserve',tag:'5',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:addDaysISO(today(),-120),weight:45,breedingReserve:true},
 {id:'female',tag:'6',type:'Kuzu',sex:'Dişi',status:'Aktif',birth:addDaysISO(today(),-120),weight:40},
 {id:'sold',tag:'7',type:'Kuzu',sex:'Erkek',status:'Satıldı',birth:addDaysISO(today(),-120),weight:50},
 {id:'recent',tag:'10',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:addDaysISO(today(),-120),weight:35},
 {id:'missing',tag:'',type:'Kuzu',sex:'Bilinmiyor',status:'Aktif',birth:'',weight:''}
];db.records=[
 {id:'w1',kind:'weight',animalId:'young',date:addDaysISO(today(),-21),note:'32 kg'},
 {id:'w2',kind:'weight',animalId:'recent',date:today(),note:'36 kg'},
 {id:'b1',kind:'birth',motherId:'e',date:addDaysISO(today(),-90),count:2},
 {id:'i1',kind:'income',date:today(),amount:1000},
 {id:'x1',kind:'expense',date:today(),amount:200}
];db.lambPricePerKg=450;renderAll()`);
assert.equal(a.run('financeOpportunityData().current'),(32+36)*450);
assert.equal(a.run("isLambValueCandidate(db.animals.find(x=>x.id==='young'))"),true,'not-yet-ready lamb above 30 kg is included');
for(const id of ['boundary','small','reserve','female','sold'])assert.equal(a.run(`isLambValueCandidate(db.animals.find(x=>x.id==='${id}'))`),false,id+' excluded');
const snapshot=a.run('JSON.stringify(db)'),net=a.run("calcFinance('all').income-calcFinance('all').expense");
a.run("openGrowthBreakdown('currentValue')");
assert.equal(a.document.querySelectorAll('.growthBreakRow').length,2);
assert.match(a.document.getElementById('modalBody').textContent,/gerçekleşmiş gelir/);
assert.equal(a.document.getElementById('estimatePrice').value,'450');
a.run("closeModal();go('herd');setHerdFilter('Kuzular')");
assert.equal(a.document.querySelectorAll('#herdList .herdAnimal').length,7);
assert.match(a.document.getElementById('herdList').textContent,/Son tartım/);
a.fill('herdSort','weight');a.run('renderHerd()');
assert.match(a.document.querySelector('#herdList .herdAnimalName').textContent,/5/);
a.fill('herdSearch','20');a.run('renderHerd()');
assert.equal(a.document.querySelectorAll('#herdList .herdAnimal').length,1);
assert.equal(a.document.getElementById('quickAnimalResults').textContent,'','one search result list');
a.fill('herdSearch','');a.run("setHerdFilter('Koçluk')");
assert.equal(a.document.querySelectorAll('#herdList .herdAnimal').length,1);
a.run("setHerdFilter('Tartım Gerekli')");
assert.equal(a.run("isWeighDue(db.animals.find(x=>x.id==='recent'))"),false);
assert.equal(a.run("isWeighDue(db.animals.find(x=>x.id==='young'))"),true);
assert.equal(a.run("isWeighDue(db.animals.find(x=>x.id==='sold'))"),false);
a.run('openMissingAnimalData()');
assert.match(a.document.getElementById('modalBody').textContent,/tartım gecikti/);
a.run("closeModal();openAddForAnimal('weight','young')");
assert.equal(a.document.getElementById('animal').value,'young');
assert.equal(a.run('JSON.stringify(db)'),snapshot,'search, filters and details do not modify flock data');
assert.equal(a.run("calcFinance('all').income-calcFinance('all').expense"),net,'estimates remain separate from actual income');
a.fill('weight','33');a.fill('date',a.run('today()'));a.run("submitAnimal('weight')");
assert.equal(a.run("latestWeightInfo(db.animals.find(x=>x.id==='young')).weight"),33);
assert.equal(a.run("isWeighDue(db.animals.find(x=>x.id==='young'))"),false);
assert.equal(a.run('financeOpportunityData().current'),(33+36)*450);
console.log('PASS: 30 kg boundary, breeding exclusions, actual finance unchanged, herd filters, sorting, search and weighing');
