const assert=require('node:assert/strict'),h=require('./audit-harness.cjs')();h.pro();
h.run(`db=seed();db.animals=[{id:'e',type:'Koyun',sex:'Dişi',status:'Aktif'},{id:'r',type:'Koç',sex:'Erkek',status:'Aktif'},{id:'l',type:'Kuzu',sex:'Erkek',status:'Aktif',birth:addDaysISO(today(),-80)},{id:'sold',type:'Koyun',status:'Satıldı'},{id:'dead',type:'Kuzu',status:'Öldü'},{id:'slaughter',type:'Koç',status:'Kesildi'}];invalidateRecordIndex();renderAll()`);
assert.equal(h.document.querySelectorAll('.pastureAnimal').length,3);
for(const type of ['ewe','ram','lamb'])assert.equal(h.document.querySelectorAll('[data-species="'+type+'"]').length,1);
assert.equal(h.run('pastureModel(db.animals).total'),3,'terminal statuses excluded');
const before=h.run('JSON.stringify(db)'),node=h.document.querySelector('.pastureAnimal');
h.run('renderAll()');assert.equal(h.document.querySelector('.pastureAnimal'),node,'unchanged counts do not rebuild animation DOM');
h.run('togglePastureMotion()');assert(h.document.getElementById('livePasture').classList.contains('pasturePaused'));assert.equal(h.document.getElementById('pastureMotionButton').getAttribute('aria-pressed'),'true');
assert.equal(h.storage.get('suru_pasture_paused'),'1');assert.equal(h.run('JSON.stringify(db)'),before,'motion preference never changes farm records');
h.run("db.animals.find(a=>a.id==='l').status='Satıldı';renderAll()");assert.equal(h.document.querySelectorAll('.pastureAnimal').length,2,'sale refreshes the current scene');
h.run("db.animals=[];renderAll()");assert.equal(h.document.querySelectorAll('.pastureAnimal').length,0);assert.match(h.document.getElementById('pastureEmpty').textContent,/İlk hayvan/);
h.run("db.animals=Array.from({length:10000},(_,i)=>({id:'large'+i,type:i===9998?'Koç':i===9999?'Kuzu':'Koyun',status:'Aktif'}));renderAll()");
assert.equal(h.document.querySelectorAll('.pastureAnimal').length,24,'bounded SVG for large flocks');
assert.equal(h.document.querySelectorAll('[data-species="ram"]').length,1,'rare types remain represented');
assert.equal(h.document.querySelectorAll('[data-species="lamb"]').length,1);
assert.match(h.document.getElementById('pastureCaption').textContent,/Temsili/);assert.match(h.document.getElementById('pastureCaption').textContent,/10.000/);
assert.equal(h.run("pastureModel([{type:'__proto__',status:'Aktif'}]).counts.unknown"),1,'unexpected imported type stays unknown');
assert.equal(h.run("pastureModel(Array.from({length:40},(_,i)=>({type:i===38?'Koç':i===39?'Kuzu':'Koyun',status:'Aktif'}))).visible.ram"),1,'representation never invents a second rare animal');
for(let n=0;n<90;n++){
 const model=h.run(`pastureModel(Array.from({length:${n}},(_,i)=>({type:['Koyun','Koç','Kuzu','Other'][i%4],status:'Aktif'})))`);
 assert.equal(Object.values(model.visible).reduce((s,n)=>s+n,0),Math.min(n,24));
 for(const key of Object.keys(model.counts))assert(model.visible[key]<=model.counts[key]);
}
h.run("appLanguage='en';renderVisualContext()");assert.match(h.document.getElementById('pastureCaption').textContent,/Representative view/);assert.equal(h.document.getElementById('pastureTitle').textContent,'Your living farm');
console.log('PASS: current status counts/types, sales/empty refresh, proportional bounded representation, stable DOM, motion preference, unchanged records and English labels');
