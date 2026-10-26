const assert=require('node:assert/strict');
const fs=require('node:fs');
const make=require('./audit-harness.cjs');

// Environments without Web Locks still merge independent stale-tab changes.
const storage=new Map(),first=make(storage),second=make(storage);
for(const h of [first,second])h.pro();
first.run("opCommit(()=>db.records.push({id:'first',kind:'note',date:today(),note:'First'}))");
second.run("opCommit(()=>db.records.push({id:'second',kind:'note',date:today(),note:'Second'}))");
const persisted=JSON.parse(storage.get(first.run('activeStorageKey'))).data;
assert.deepEqual(persisted.records.map(r=>r.id).sort(),['first','second']);
// Same-record conflicts cannot overwrite a successful write.
const a=make(storage),b=make(storage);a.pro();b.pro();
assert.equal(a.run("opCommit(()=>db.records[0].note='A')"),true);
assert.equal(b.run("opCommit(()=>db.records[0].note='B')"),false);
assert.equal(JSON.parse(storage.get(a.run('activeStorageKey'))).data.records[0].note,'A');

// Older mutation handlers roll back when the primary write fails.
const quota=make();quota.pro();quota.run('openAddAnimal()');
quota.fill('newAnimalTag','QUOTA-1');quota.fill('newAnimalBirth','2026-01-01');
const before=quota.run('JSON.stringify(db)');
const original=quota.c.localStorage.setItem;
quota.c.localStorage.setItem=()=>{throw Error('QuotaExceededError')};
assert.equal(quota.run('saveNewAnimal()'),false,'a failed device write stops the UI action without an uncaught event error');
assert.equal(quota.run('JSON.stringify(db)'),before);
assert.equal(quota.document.getElementById('newAnimalTag').value,'QUOTA-1','form is retained for retry');
quota.c.localStorage.setItem=original;quota.run('saveNewAnimal()');
assert.equal(quota.run('db.animals.length'),1);

// A restart restores dated weighing drafts without changing committed data.
const h=make();h.pro();h.run("db.animals=[{id:'l',type:'Kuzu',sex:'Erkek',status:'Aktif',tag:'1',birth:'2026-01-01',weight:30}];save();openBulkWeight()");
h.fill('bulkWeightDate','2026-10-01');h.document.querySelector('.bulkWeightInput').value='35';
h.run('saveWeightDraft();closeModal()');const saved=h.run('JSON.stringify(db)');
const reload=make(h.storage);reload.pro();reload.run('openBulkWeight()');
assert.equal(reload.document.querySelector('.bulkWeightInput').value,'35');
assert.equal(reload.document.getElementById('bulkWeightDate').value,'2026-10-01');
assert.equal(reload.run('JSON.stringify(db)'),saved);
reload.run('submitBulkWeight()');
assert.equal(reload.run("db.records.find(r=>r.kind==='weight').date"),'2026-10-01');
assert.equal(reload.storage.has(reload.run('weightDraftKey()')),false);

// The checked-in browser copy must remain identical to the shared MCP source.
const policy=fs.readFileSync('supabase/functions/_shared/sales-policy.mjs','utf8').replace(/\r\n/g,'\n').replace(/export /g,'');
const html=fs.readFileSync('v21.html','utf8').replace(/\r\n/g,'\n');
assert.equal(html.split('// BEGIN SHARED SALES POLICY\n')[1].split('// END SHARED SALES POLICY')[0],policy);
console.log('PASS: stale-tab merge/conflict protection, quota rollback/retry, dated weighing draft recovery and shared policy consistency');
