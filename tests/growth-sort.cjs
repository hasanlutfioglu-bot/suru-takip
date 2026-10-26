const assert=require('node:assert/strict'),make=require('./audit-harness.cjs');
const a=make();a.pro();
a.run(`db=seed();db.animals=[
 {id:'ten',tag:'10',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:addDaysISO(today(),-120),weight:48},
 {id:'two',tag:'2',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:addDaysISO(today(),-150),weight:40},
 {id:'one',tag:'1',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:addDaysISO(today(),-90),weight:45},
 {id:'missing',tag:'',type:'Kuzu',sex:'Dişi',status:'Aktif',birth:'',weight:''}
];db.records=db.animals.filter(x=>x.weight).map(x=>({id:'w'+x.id,kind:'weight',animalId:x.id,date:today(),weight:x.weight}));go('growth')`);
const order=()=>[...a.document.querySelectorAll('#growthTableBody tr')].map(x=>x.getAttribute('onclick')?.match(/showGrowthDetail\('([^']+)'\)/)?.[1]);
const unchanged=a.run('JSON.stringify(db)');
assert.deepEqual(order(),['one','two','ten','missing'],'numeric ear tags, missing last');
for(const [field,direction,expected] of [
 ['tag','desc',['ten','two','one','missing']],
 ['age','asc',['one','ten','two','missing']],
 ['age','desc',['two','ten','one','missing']],
 ['weight','asc',['two','one','ten','missing']],
 ['weight','desc',['ten','one','two','missing']],
 ['eta','asc',['ten','one','two','missing']],
 ['eta','desc',['two','one','ten','missing']]
]){a.run(`setGrowthSort('${field}','${direction}')`);assert.deepEqual(order(),expected,field+' '+direction);}
assert.equal(a.run('JSON.stringify(db)'),unchanged,'sort never alters flock records');
a.run("growthFilter='Satışa hazır';renderGrowth()");
assert.equal(a.run('growthSort.field'),'eta');
a.run("growthFilter='Tümü';renderGrowth()");
assert.deepEqual(order(),['two','one','ten','missing']);
const reload=make(a.storage);
assert.equal(reload.run('growthSort.field'),'eta');assert.equal(reload.run('growthSort.direction'),'desc');
a.run("setGrowthSort('unknown','asc')");assert.equal(a.run('growthSort.field'),'eta');
a.storage.set('suru_growth_sort','bad json');assert.equal(make(a.storage).run('growthSort.field'),'tag');
a.storage.set('suru_growth_sort',JSON.stringify({field:'unknown',direction:'desc'}));assert.equal(make(a.storage).run('growthSort.field'),'tag');
assert.ok(a.document.querySelector('#growthSortMenu summary'),'compact native dropdown trigger');
assert.equal(a.document.querySelectorAll('#growthSortField option').length,4);
console.log('PASS: numeric tags, age, weight, ETA, both directions, missing values, filters, persistence and data unchanged');
