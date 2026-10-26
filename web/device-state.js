let writerOwned=false,writerPending=false,writerRelease=null,writerStopped=false;
function deviceCanWrite(){return !navigator.locks?.request||writerOwned}
function installRecordGuards(){
 const handlers=['saveNewAnimal','saveBulkSex','saveTag','saveBulkTags','releaseBreedingReserve','markBreeder','promoteBreeder','saveAnimalEdit','submitBulkWeight','submitSimple','submitBirth','submitAnimal','submitStock','submitHarvest','submitNote','saveRecordEdit','deleteRecord','saveRamMating','saveRamCalendarEdit','addTask','doneTask','markReminderDone','saveLambPrice','saveAccountFarmName','saveInitialSetup'];
 const handle=error=>{if(error.deviceSaveFailure)return false;throw error};
 for(const name of handlers){const action=window[name];window[name]=function(...args){try{const result=action.apply(this,args);return result?.then?result.catch(handle):result}catch(error){return handle(error)}}}
}
function adoptDeviceSnapshot(){
 const snapshot=deviceSnapshots.get(activeStorageKey),raw=localStorage.getItem(activeStorageKey);
 if(snapshot&&snapshot.raw===raw)return;
 db=readStored(activeStorageKey,seed());const cached=deviceSnapshots.get(activeStorageKey)?.sync||{};
 cloudBase=cached.base?normalizeState(cached.base):null;cloudVersion=cached.version||null;cloudDirty=!!cached.dirty;
 invalidateRecordIndex();renderAll();
}
async function acquireDeviceWriter(){
 if(!navigator.locks?.request||writerOwned||writerPending||writerStopped)return;
 writerPending=true;
 try{await navigator.locks.request(KEY+'_writer',{ifAvailable:true},async lock=>{
  writerPending=false;writerOwned=!!lock;if(lock)adoptDeviceSnapshot();renderSyncHealth();
  if(!lock)return;
  if(cloudSession)queueCloudSync();
  await new Promise(resolve=>writerRelease=resolve);
  writerOwned=false;writerRelease=null;
 })}catch(e){writerPending=false;writerOwned=false;renderSyncHealth()}
}
window.addEventListener('pagehide',()=>{writerStopped=true;writerRelease?.()});
window.addEventListener('pageshow',()=>{writerStopped=false;acquireDeviceWriter()});
window.addEventListener('focus',acquireDeviceWriter);
if(typeof setInterval==='function')setInterval(acquireDeviceWriter,2000);
window.addEventListener('storage',event=>{if(event.key===activeStorageKey&&!deviceCanWrite())adoptDeviceSnapshot()});
function pendingChanges(){const base=cloudBase||seed(),rows=[];for(const entity of ['animals','records','tasks','ramCalendar']){const a=new Map((base[entity]||[]).map(x=>[x.id,x])),b=new Map((db[entity]||[]).map(x=>[x.id,x]));for(const id of new Set([...a.keys(),...b.keys()]))if(JSON.stringify(a.get(id))!==JSON.stringify(b.get(id)))rows.push({entity,id,label:b.get(id)?.label||b.get(id)?.tag||b.get(id)?.text||id})}for(const key of ['farmName','lambPricePerKg','stock','stockUnits'])if(JSON.stringify(base[key])!==JSON.stringify(db[key]))rows.push({entity:'settings',id:key,label:key});return rows}
function openSyncStatus(){const rows=cloudDirty?pendingChanges():[];showModal(tx('Eşitleme durumu','Sync status'),'<p>'+escHtml(document.getElementById('syncHealth')?.textContent||'')+'</p><p data-no-i18n>'+escHtml(document.getElementById('cloudText')?.textContent||'')+'</p>'+rows.map(x=>'<div class="listitem" data-no-i18n>'+escHtml(x.entity+' · '+x.label)+'</div>').join('')+opButton('syncNow()','Şimdi eşitle','Sync now',true)+opButton('exportBackup()','Cihaz yedeğini indir','Download device backup'))}
document.addEventListener('keydown',event=>{if(event.target?.id==='syncHealth'&&['Enter',' '].includes(event.key)){event.preventDefault();openSyncStatus()}});
function renderSyncHealth(){
 const el=document.getElementById('syncHealth');if(!el)return;
 const pending=cloudDirty?pendingChanges().length:0;
 const last=localStorage.getItem(activeStorageKey+'_lastSync');
 el.onclick=openSyncStatus;el.setAttribute('tabindex','0');el.setAttribute('aria-label',tx('Eşitleme durumunu aç','Open sync status'));
 el.textContent=!deviceCanWrite()?tx('Salt okunur: diğer sekmeyi kapatınca düzenleyebilirsin.','Read only: close the other tab to edit.'):tx('Cihaz kaydı açık','Device storage ready')+(cloudFarmId?' · '+pending+tx(' değişiklik bekliyor',' changes pending'):' · '+tx('Yerel mod; bulut yedeği yok','Local mode; no cloud copy'))+(last?' · '+tx('Son eşitleme: ','Last sync: ')+new Date(last).toLocaleString(appLocale()):'');
}
let recordIndex=null;
function invalidateRecordIndex(){recordIndex=null}
function indexedRecords(){
 if(recordIndex?.state===db&&recordIndex.records===db.records&&recordIndex.length===db.records.length&&recordIndex.animalRows===db.animals&&recordIndex.animalCount===db.animals.length)return recordIndex;
 const weights=new Map(),births=new Map(),health=new Map(),byAnimal=new Map(),breeding=new Map(),animals=new Map(db.animals.map(a=>[a.id,a]));
 for(const r of db.records){const map=r.kind==='weight'?weights:r.kind==='birth'?births:r.kind==='health'?health:null,id=r.kind==='birth'?r.motherId:r.animalId;if(map&&id){if(!map.has(id))map.set(id,[]);map.get(id).push(r)}
  for(const id of new Set([r.animalId,r.motherId,...(r.animalIds||[])].filter(Boolean))){if(!byAnimal.has(id))byAnimal.set(id,[]);byAnimal.get(id).push(r)}
  if(['breeding','pregnancy','birth'].includes(r.kind)&&id){if(!breeding.has(id))breeding.set(id,[]);breeding.get(id).push(r)}
 }
 for(const rows of weights.values())rows.sort((a,b)=>String(a.date||'').localeCompare(String(b.date||'')));
 return recordIndex={state:db,records:db.records,length:db.records.length,animalRows:db.animals,animalCount:db.animals.length,weights,births,health,byAnimal,breeding,animals};
}
