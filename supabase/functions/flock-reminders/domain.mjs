export function dateAt(now,zone){return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
const add=(d,n)=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
export function validPushEndpoint(endpoint){try{const u=new URL(endpoint);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com','wns.windows.com'].some(h=>u.hostname===h||h==='wns.windows.com'&&u.hostname.endsWith('.'+h))}catch{return false}}
export function dueCount(state,date){
 const animals=Array.isArray(state?.animals)?state.animals:[],records=Array.isArray(state?.records)?state.records:[],active=new Set(animals.filter(a=>!['Satıldı','Öldü','Kesildi'].includes(a.status)).map(a=>a.id));let count=0;
 for(const r of records){if(r.kind==='health'&&active.has(r.animalId)&&r.reminderDate&&r.reminderDate<=date&&!r.reminderDone)count++;}
 for(const a of animals.filter(a=>active.has(a.id))){
  if(a.type==='Kuzu'){const dates=records.filter(r=>r.kind==='weight'&&r.animalId===a.id).map(r=>r.date).sort();if(!dates.length||add(dates.at(-1),21)<=date)count++;}
  const events=records.filter(r=>r.animalId===a.id&&['breeding','pregnancy'].includes(r.kind)||r.motherId===a.id&&r.kind==='birth').sort((a,b)=>b.date.localeCompare(a.date)||({birth:2,pregnancy:1,breeding:0}[b.kind]||0)-({birth:2,pregnancy:1,breeding:0}[a.kind]||0));const last=events[0];if(last?.expectedDate&&last.result!=='open'&&!last.dueAcknowledged&&add(last.expectedDate,-7)<=date)count++;
 }
 for(const r of state?.ramCalendar||[]){if(!r.matingDate)continue;if(!r.flushDone&&add(r.matingDate,-30)<=date)count++;if(!r.matingDone&&r.matingDate<=date)count++;if(!r.removalDone&&r.removalDate&&r.removalDate<=date)count++;if(r.matingDone&&r.actualMatingDate){const start=add(r.actualMatingDate,147);if(!r.birthPrepAcknowledged&&add(start,-7)<=date&&start>date)count++;if(!r.birthStartAcknowledged&&start<=date)count++;}if(r.removalDone&&r.actualRemovalDate&&!r.birthEndNotified&&add(r.actualRemovalDate,147)<=date)count++;}
 count+=(state?.tasks||[]).filter(t=>!t.done&&(!t.date||t.date<=date)).length;return count;
}
