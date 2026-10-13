const assert=require('node:assert/strict'),make=require('./audit-harness.cjs');
const a=make();a.pro();
a.run(`db=seed();db.animals=[
 {id:'e',tag:'245',type:'Koyun',sex:'Dişi',status:'Aktif',birth:'2023-01-01'},
 {id:'r',tag:'9',type:'Koç',sex:'Erkek',status:'Aktif',birth:'2022-01-01'},
 {id:'f',tag:'30',type:'Koyun',sex:'Dişi',breedingStatus:'Anaç Adayı',status:'Aktif',birth:'2025-01-01'},
 {id:'l',tag:'3',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:addDaysISO(today(),-120),weight:40},
 {id:'reserve',tag:'20',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:addDaysISO(today(),-200),weight:60,breedingReserve:true},
 {id:'ready',tag:'4',type:'Kuzu',sex:'Erkek',status:'Satılacak',birth:addDaysISO(today(),-200),weight:52},
 {id:'missing',tag:'',type:'Kuzu',sex:'Bilinmiyor',status:'Aktif',birth:''},
 {id:'sold',tag:'7',type:'Kuzu',sex:'Erkek',status:'Satıldı',birth:'2025-01-01'},
 {id:'dead',tag:'8',type:'Kuzu',sex:'Dişi',status:'Öldü',birth:'2025-01-01'},
 {id:'cut',tag:'10',type:'Kuzu',sex:'Erkek',status:'Kesildi',birth:'2025-01-01'}
];db.records=[
 {id:'w1',kind:'weight',animalId:'l',date:addDaysISO(today(),-10),weight:38,note:'38 kg'},
 {id:'w2',kind:'weight',animalId:'l',date:today(),weight:40,note:'40 kg'},
 {id:'wr',kind:'weight',animalId:'reserve',date:addDaysISO(today(),-15),weight:60,note:'60 kg'},
 {id:'we',kind:'weight',animalId:'e',date:addDaysISO(today(),-20),weight:65,note:'65 kg'},
 {id:'b1',kind:'birth',motherId:'e',date:addDaysISO(today(),-120),count:1,childIds:['l']},
 {id:'h',kind:'health',animalId:'l',date:today(),note:'Aşı'},
 {id:'sale',kind:'sale',animalIds:['sold'],date:today(),amount:1000}
];renderAll();go('herd')`);
const snapshot=a.run('JSON.stringify(db)');
assert.deepEqual([...a.document.querySelectorAll('#herdPrimaryFilters b')].map(x=>+x.textContent),[7,1,1,4,1]);
for(const [f,n] of Object.entries({'Aktif':7,'Tümü':10,'Anaçlar':1,'Koç':1,'Kuzular':4,'Anaç Adayları':1,'Koçluk':1,'Satılacaklar':1,'Pasif':3,'Eksik Bilgi':2,'Tartım Gerekli':2,'Erkek Kuzular':3,'Dişi Kuzular':0,'Takipte':0})){
 a.run(`setHerdFilter('${f}')`);assert.equal(a.document.querySelectorAll('#herdList .herdAnimal').length,n,f);
}
a.run("setHerdFilter('Aktif')");a.fill('herdSearch','245');a.run('renderHerd()');assert.equal(a.document.querySelectorAll('#herdList .herdAnimal').length,1);
a.fill('herdSearch','');
const first=()=>a.document.querySelector('#herdList .herdAnimalName').textContent;
for(const [sort,tag] of [['tag','#3'],['young','#3'],['age','#9'],['weight','#245'],['light','#3'],['weigh','#245'],['weigh-new','#3'],['birth','#245'],['sale','#4']]){
 a.fill('herdSort',sort);a.run(`setHerdSort('${sort}')`);assert.equal(first(),tag,sort);
 assert.equal(a.storage.get('suru-herd-sort'),sort);
}
const b=make(a.storage);b.run("renderHerd()");assert.equal(b.document.getElementById('herdSort').value,'sale','sort remembered on reload');
a.run("animalCard('e')");assert.match(a.document.getElementById('modalBody').textContent,/Doğurduğu kuzular/);assert.match(a.document.getElementById('modalBody').textContent,/#3/);assert.match(a.document.getElementById('modalBody').textContent,/65 kg/);
a.run("animalCard('l')");assert.match(a.document.getElementById('modalBody').textContent,/Sağlık ve aşı/);assert.match(a.document.getElementById('modalBody').textContent,/Aşı/);
a.run("openAnimalSale('l')");assert.equal(a.document.querySelector('.saleAnimal:checked').value,'l');assert.equal(a.document.querySelectorAll('.saleAnimal:checked').length,1);
a.run("closeModal();setAppLanguage('en');go('herd');refreshLanguage()");assert.match(a.document.getElementById('herdPrimaryFilters').textContent,/Total active/);
assert.doesNotMatch(a.document.getElementById('herd').textContent,/[ğüşıöçĞÜŞİÖÇ]/,'English herd UI');
a.run("animalCard('l');refreshLanguage()");assert.match(a.document.getElementById('modalBody').textContent,/Weight and growth/);
assert.equal(a.run('JSON.stringify(db)'),snapshot,'read-only navigation preserves every byte of flock data');
a.run("setAppLanguage('tr');openAddForAnimal('weight','e')");a.fill('weight','66');a.fill('date',a.run('today()'));a.run("submitAnimal('weight')");assert.equal(a.run("latestWeightInfo(db.animals.find(x=>x.id==='e')).weight"),66,'adult weight uses existing record path');

// Calendar anniversary, terminal states, breeding reservation, unknown/invalid dates,
// repeat calls, viewer protection, stable identity and historical relationships.
const p=make();p.pro();
p.run(`db=seed();const anniversary=new Date();anniversary.setFullYear(anniversary.getFullYear()-1);const d=localDateISO(anniversary);db.animals=[
 {id:'female',tag:'00123',type:'Kuzu',sex:'Dişi',birth:d,status:'Aktif',weight:45,motherId:'mom'},
 {id:'male',tag:'00124',type:'Kuzu',sex:'Erkek',birth:d,status:'Aktif',weight:60,breedingReserve:true},
 {id:'sale',type:'Kuzu',sex:'Erkek',birth:d,status:'Satılacak'},
 ...['Satıldı','Öldü','Kesildi'].map((status,i)=>({id:'terminal'+i,type:'Kuzu',sex:'Dişi',birth:d,status})),
 {id:'young',type:'Kuzu',sex:'Dişi',birth:addDaysISO(d,1),status:'Aktif'},
 {id:'unknown',type:'Kuzu',sex:'Bilinmiyor',birth:d,status:'Aktif'},
 {id:'bad',type:'Kuzu',sex:'Dişi',birth:'2025-02-31',status:'Aktif'},
 {id:'blank',type:'Kuzu',sex:'Dişi',birth:'',status:'Aktif'}
];db.records=[{id:'history',kind:'weight',animalId:'female',weight:45,date:d,note:'45 kg'},{id:'health',kind:'health',animalId:'male',date:d,note:'vaccine'},{id:'birth',kind:'birth',motherId:'mom',childIds:['female'],date:d,count:1}];`);
const before=JSON.parse(p.run('JSON.stringify(db)'));
assert.equal(p.run('promoteAgedBreederLambs()'),true);
const after=JSON.parse(p.run('JSON.stringify(db)'));
assert.equal(after.animals[0].type,'Koyun');assert.equal(after.animals[0].breedingStatus,'Anaç Adayı');assert.equal(after.animals[1].type,'Koç');
assert.deepEqual(after.animals.slice(2),before.animals.slice(2));assert.deepEqual(after.records.slice(0,3),before.records);
for(let i=0;i<2;i++)for(const key of ['id','tag','birth','sex','weight','status','motherId'])assert.equal(after.animals[i][key],before.animals[i][key]);
assert.equal(after.records.filter(r=>r.source==='age_12_months').length,2);
assert.equal(p.run('promoteAgedBreederLambs()'),false);assert.equal(p.run('db.animals.length'),10);assert.equal(p.run('db.records.length'),5);
p.run("db.animals[0].type='Kuzu';cloudFarmId='test';cloudRole='viewer'");assert.equal(p.run('promoteAgedBreederLambs()'),false);assert.equal(p.run('db.animals[0].type'),'Kuzu');
console.log('PASS: herd summary, 14 filters, 9 sorts, persistence, search, linked details, individual sale, adult weights, English UI, unchanged data and idempotent 12-month transitions');
