const assert=require('node:assert/strict'),make=require('./audit-harness.cjs');
const a=make();a.pro();
const englishFirst=make(new Map([['suru-language','en']]));
englishFirst.run("setAppLanguage('tr')");
assert(englishFirst.document.querySelector('.brand').textContent.includes('İŞLETME YÖNETİMİ'),'an English-first launch must restore Turkish presentation labels');
const original=a.run('JSON.stringify(db)');
a.run("setAppLanguage('en')");
assert.equal(a.document.documentElement.lang,'en');
assert.match(a.document.querySelector('[data-go="home"]').textContent,/Home/);
assert.equal(a.run('JSON.stringify(db)'),original,'Language must not modify flock data');
assert.equal(a.storage.get('suru-language'),'en');
a.run('openAddAnimal()');
assert.equal(a.document.querySelector('#newAnimalType option').textContent,'Ewe');
assert.equal(a.document.querySelector('#newAnimalType option').getAttribute('value'),'Koyun');
a.fill('newAnimalType','Koyun');a.fill('newAnimalTag','EN-TEST');a.fill('newAnimalStatus','Aktif');a.fill('newAnimalBirth','2024-01-01');a.fill('newAnimalWeight','55');a.run('saveNewAnimal()');
assert.equal(a.run("db.animals.find(x=>x.tag==='EN-TEST').type"),'Koyun');
a.run("setAppLanguage('tr')");assert.match(a.document.querySelector('[data-go="home"]').textContent,/Ana Sayfa/);
a.run("setAppLanguage('en');openAdd('expense')");assert.equal(a.document.querySelector('#cat option').getAttribute('value'),'Yem');
assert.match(a.run("uiTranslate(handleLocalCommand('How much did I spend on feed this month?'))"),/Recorded feed/);
assert.equal(a.run("englishLocalCommand('Ewe 245 had twins; one male and one female')"),'245 2 kuzu doğurdu biri erkek biri dişi');
assert.equal(a.run("englishLocalCommand('Ewe 245 gave birth to four lambs')"),'245 4 kuzu doğurdu ');
assert.match(a.run("uiTranslate(handleLocalCommand('Ewe 245 gave birth to four lambs'))"),/between 1 and 3/);
assert.equal(a.run("englishLocalCommand('Ewe 245 gave birth')"),'Ewe 245 gave birth');
a.run("addChat('Koyun','user');refreshLanguage()");assert.equal(a.document.querySelector('.userMsg').textContent,'Koyun');
const b=make(a.storage);assert.equal(b.document.documentElement.lang,'en');assert.match(b.document.querySelector('[data-go="reports"]').textContent,/Reports/);
console.log('PASS: language persistence, reversible navigation/forms, unchanged flock data, canonical select values, English commands and user-text protection');

// Populated menus exercise dynamic labels, not just the empty home screen.
const c=make();c.pro();
c.run(`db=seed();db.animals=[
 {id:'e1',tag:'245',type:'Koyun',sex:'Dişi',status:'Aktif',breedingStatus:'Anaç',birth:'2023-01-01'},
 {id:'l1',tag:'401',type:'Kuzu',sex:'Erkek',status:'Satılacak',birth:addDaysISO(today(),-140),weight:40}
];db.records=[
 {id:'w1',kind:'weight',label:'Tartım · #401',animalId:'l1',date:addDaysISO(today(),-30),weight:33,note:'33 kg'},
 {id:'w2',kind:'weight',label:'Tartım · #401',animalId:'l1',date:addDaysISO(today(),-5),weight:40,note:'40 kg'},
 {id:'n1',kind:'note',label:'Not',date:today(),note:'Doğum · Sağlık: takip et'}
];db.ramCalendar=[{id:'c1',matingDate:today(),removalDate:addDaysISO(today(),30)}];renderAll()`);
const snapshot=c.run('JSON.stringify(db)');
const canonicalMarkup=()=>[...c.document.querySelectorAll('#modalBody input,#modalBody select,#modalBody button,#modalBody option')].map(el=>[el.tagName,el.id,el.getAttribute('value'),el.getAttribute('onclick'),el.getAttribute('onchange')]);
c.run('openRamMating();refreshLanguage()');const controls=canonicalMarkup();
c.run("setAppLanguage('en');openRamMating();refreshLanguage()");
assert.deepEqual(canonicalMarkup(),controls,'Translation keeps input IDs, values and handlers');
assert.match(c.document.getElementById('modalBody').textContent,/Planned ram introduction date/);
assert.doesNotMatch(c.document.getElementById('modalBody').textContent,/[ğüşıöçĞÜŞİÖÇ]/);
for(const call of [
 ...['health','births','performance','calendar','weights','stock','finance','moves','today'].map(k=>`openSub('${k}')`),
 ...['adg','readyValue','targetValue','currentValue'].map(k=>`openGrowthBreakdown('${k}')`),
 ...['net','income','expense','births','lambingRate','nonLambing','potentialGap','healthRecords','weightRecords'].map(k=>`openReportDetail('${k}')`),
 ...['Finance','Birth','Growth','Sale','Health'].map(k=>`openPulseReason('${k}')`),
 "showGrowthDetail('l1')",'openBulkWeight()','openBackup()','openInitialSetup()','openBulkTags()','openBulkSex()'
]){
 c.run(call+';refreshLanguage()');
 const root=call.startsWith('openSub(')?c.document.getElementById('sub'):c.document.getElementById('modal');
 const texts=[];
 function visit(node){if(node.nodeType===3)texts.push(node.nodeValue);else if(node.nodeType===1&&!node.hasAttribute('data-no-i18n')&&!['INPUT','TEXTAREA'].includes(node.tagName))for(const child of node.childNodes)visit(child)}
 visit(root);assert.doesNotMatch(texts.join(' '),/[ğüşıöçĞÜŞİÖÇ]/,call+' has untranslated Turkish UI');
}
c.run("openSub('moves');refreshLanguage()");
assert.match(c.document.getElementById('subBody').textContent,/Weighing · #401/);
assert.match(c.document.getElementById('subBody').textContent,/Doğum · Sağlık: takip et/,'User notes remain as entered');
c.run("setAppLanguage('tr');showGrowthDetail('l1');refreshLanguage()");
assert.match(c.document.getElementById('modalBody').textContent,/Tartım Geçmişi/);
assert.equal(c.run('JSON.stringify(db)'),snapshot,'All translated menu flows preserve the full database');
console.log('PASS: populated English submenus, report details, growth targets, calendar, weighing, backup, Turkish restoration, canonical controls and untouched notes/data');
