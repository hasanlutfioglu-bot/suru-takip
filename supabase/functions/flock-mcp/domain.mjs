// Pure domain operations shared by the edge function and security tests.
const active=a=>!['Satıldı','Öldü','Kesildi'].includes(a.status);
const fail=m=>{throw new Error(m)};
export function checkClaims(c,resource,issuer,clientIds,now=Date.now()/1000){
 if(!c||c.iss!==issuer||!c.sub||!Number.isFinite(c.exp)||c.exp<=now||(c.nbf&&c.nbf>now)||!clientIds.includes(c.client_id))fail('unauthorized');
 if(![c.aud].flat().includes(resource)&&c.resource!==resource)fail('wrong_resource');
 if(!String(c.scope||'').split(' ').includes('openid'))fail('insufficient_scope');
}
export function assertRole(role,write=false){if(!(write?['owner','editor']:['owner','editor','viewer']).includes(role))fail('forbidden')}
function text(v,max=2000){if(typeof v!=='string'||!v.trim()||v.length>max)fail('invalid_text');return v.trim()}
function day(d,today){if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d||d>today)fail('invalid_date');return d}
function number(v,max=1e9){if(typeof v!=='number'||!Number.isFinite(v)||v<=0||v>max)fail('invalid_number');return v}
function animal(db,id,date){const a=db.animals.find(x=>x.id===id);if(!a||!active(a)||(a.birth&&date<a.birth))fail('invalid_animal');return a}
const name=a=>a.tag||a.id;
export function readState(db,args){
 if(!db||!Array.isArray(db.animals)||!Array.isArray(db.records))fail('invalid_state');
 const section=args.section||'summary',offset=args.offset??0,limit=args.limit??100;
 if(!Number.isInteger(offset)||offset<0||!Number.isInteger(limit)||limit<1||limit>200)fail('invalid_pagination');
 if(section==='summary'){const animals=db.animals.filter(active);return {farmName:db.farmName||'',activeAnimals:animals.length,byType:Object.fromEntries(['Koyun','Koç','Kuzu'].map(t=>[t,animals.filter(a=>a.type===t).length])),stock:db.stock||{},tasks:db.tasks||[]}}
 let rows;
 if(section==='animals')rows=db.animals;
 else if(section==='records')rows=db.records;
 else if(section==='animal'){const a=db.animals.find(x=>x.id===args.animal_id);if(!a)fail('animal_not_found');return {animal:a,history:db.records.filter(r=>r.animalId===a.id||r.motherId===a.id||r.animalIds?.includes(a.id)).slice(offset,offset+limit)}}
 else if(section==='finance'){if(typeof args.month!=='string'||!/^\d{4}-(0[1-9]|1[0-2])$/.test(args.month))fail('invalid_month');rows=db.records.filter(r=>r.date?.startsWith(args.month)&&['income','sale','expense','stock'].includes(r.kind));const income=rows.filter(r=>['income','sale'].includes(r.kind)).reduce((s,r)=>s+(+r.amount||0),0),expense=rows.filter(r=>['expense','stock'].includes(r.kind)).reduce((s,r)=>s+(+r.amount||0),0);return {income,expense,balance:income-expense,currency:'TRY',total:rows.length,rows:rows.slice(offset,offset+limit)}}
 else fail('invalid_section');
 return {total:rows.length,rows:rows.slice(offset,offset+limit),nextOffset:offset+limit<rows.length?offset+limit:null};
}
export function applyOperation(original,op,requestId,userId,today){
 if(!original||!Array.isArray(original.animals)||!Array.isArray(original.records))fail('invalid_state');
 if(typeof requestId!=='string'||!/^[-A-Za-z0-9_]{8,100}$/.test(requestId))fail('invalid_request_id');
 const id='ai_'+userId.replaceAll('-','')+'_'+requestId;
 const old=original.records.find(r=>r.id===id);
 if(old){if(old.assistantOperation!==JSON.stringify(op))fail('request_id_reused');return {state:original,record:old,replayed:true}}
 const db=structuredClone(original),date=day(op.date,today),kind=op.kind;
 const rec={id,kind,date,source:'chatgpt',assistantUserId:userId,assistantOperation:JSON.stringify(op)};
 if(kind==='note'){rec.note=text(op.note);rec.label='Not'}
 else if(kind==='health'){const a=animal(db,op.animal_id,date);rec.animalId=a.id;rec.note=text(op.note);rec.label='Sağlık · '+name(a);rec.reminderDate='';rec.reminderDone=false}
 else if(kind==='birth'){
  const a=animal(db,op.animal_id,date),sexes=op.sexes;
  if(a.sex!=='Dişi'||!(a.type==='Koyun'||a.breedingStatus==='Anaç Adayı'))fail('invalid_mother');
  if(!Array.isArray(sexes)||sexes.length<1||sexes.length>3||sexes.some(s=>!['Erkek','Dişi','Bilinmiyor'].includes(s)))fail('invalid_sexes');
  if(db.records.some(r=>r.kind==='birth'&&r.motherId===a.id&&r.date===date))fail('duplicate_birth');
  a.type='Koyun';a.breedingStatus='Anaç';rec.motherId=a.id;rec.count=sexes.length;rec.note=sexes.join(', ');rec.label='Doğum · '+sexes.length+' kuzu';rec.childIds=[];
  sexes.forEach((sex,i)=>{const cid=id+'_l'+i;rec.childIds.push(cid);db.animals.push({id:cid,type:'Kuzu',sex,tag:'',status:'Aktif',birth:date,weight:'',motherId:a.id,breedingStatus:''})});
 }
 else if(kind==='weight'){
  const a=animal(db,op.animal_id,date);if(a.type!=='Kuzu')fail('lamb_required');
  if(db.records.some(r=>r.kind==='weight'&&r.animalId===a.id&&r.date===date))fail('duplicate_weight');
  rec.animalId=a.id;rec.weight=number(op.weight,500);rec.note=rec.weight+' kg';rec.label='Tartım · '+name(a);
 }
 else if(kind==='expense'||kind==='income'){
  const categories=kind==='expense'?['Yem','İlaç','Veteriner','Diğer gider','Tarla · Tohum','Tarla · Libazma/Sürüm','Tarla · Mazot','Tarla · Gübre','Tarla · İlaçlama','Tarla · Biçim/Balya','Tarla · İşçilik','Tarla · Diğer']:['Devlet desteği','Kuzu satışı dışı gelir','Diğer gelir'];
  if(!categories.includes(op.category))fail('invalid_category');rec.amount=number(op.amount);rec.category=op.category;rec.note=op.note?text(op.note):'';rec.label=(kind==='income'?'Gelir · ':'Gider · ')+op.category;
  if(op.category.startsWith('Tarla'))rec.productionPeriod=text(op.production_period,30);
 }
 else if(kind==='sale'){
  if(!Array.isArray(op.animal_ids)||!op.animal_ids.length||op.animal_ids.length>200||new Set(op.animal_ids).size!==op.animal_ids.length)fail('invalid_animals');
  const animals=op.animal_ids.map(id=>animal(db,id,date));rec.amount=number(op.amount);rec.animalIds=animals.map(a=>a.id);rec.animalNames=animals.map(name);rec.previousStatuses=Object.fromEntries(animals.map(a=>[a.id,a.status]));animals.forEach(a=>a.status='Satıldı');rec.category='Kuzu/Hayvan satışı';rec.label='Satış · '+animals.length+' hayvan';rec.note=op.note?text(op.note):'';
 }
 else fail('unsupported_operation');
 db.records.push(rec);
 if(kind==='weight'){
  const a=db.animals.find(a=>a.id===rec.animalId),rows=db.records.filter(r=>r.kind==='weight'&&r.animalId===a.id).sort((a,b)=>a.date.localeCompare(b.date));let prev;
  for(const r of rows){const w=+r.weight||+(String(r.note||'').replace(',','.').match(/([\d.]+)\s*kg/i)?.[1]||0),pw=prev?.weight||0,days=prev?(Date.parse(r.date)-Date.parse(prev.date))/864e5:0,ageDays=a.birth?Math.max(0,(Date.parse(r.date)-Date.parse(a.birth))/864e5):0,m=ageDays/30.44,band=m<2?[180,300]:m<4?[200,320]:m<6?[220,300]:m<8?[180,280]:[140,240];Object.assign(r,{weight:w,previousWeight:pw||'',gainDays:days||'',gainKg:pw?+(w-pw).toFixed(2):'',adg:pw&&days?Math.round((w-pw)*1000/days):'',ageDays,ageMonth:Math.floor(m),expectedMin:band[0],expectedMax:band[1]});prev=r}a.weight=rows.at(-1).weight;
 }
 return {state:db,record:rec,replayed:false};
}
