const {parseHTML}=require('linkedom'),vm=require('vm'),fs=require('fs'),assert=require('node:assert/strict');
const html=fs.readFileSync(process.argv[2]||'suru-v21.html','utf8');
function make(storage=new Map()){
 const {document}=parseHTML(html);const ctx={document,console,Date,Math,Intl,Set,Map,JSON,Number,String,Array,Blob,URL,setTimeout:()=>0,clearTimeout:()=>{},navigator:{onLine:true},location:{protocol:'https:',origin:'https://example.test',pathname:'/v21.html'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),key:i=>[...storage.keys()][i],get length(){return storage.size}},confirm:()=>true};ctx.window=ctx;ctx.addEventListener=()=>{};ctx.scrollTo=()=>{};document.querySelectorAll('[id]').forEach(e=>ctx[e.id]=e);vm.createContext(ctx);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],ctx);return {ctx,storage,run:s=>vm.runInContext(s,ctx)};
}
function client(server,user='u1',store){
 const c=make(store);c.run(`cloudSession={user:{id:'${user}'}};cloudRole='owner';cloudFarmId='f1';activeStorageKey=KEY+'_user_${user}_farm_f1';cloudBase=normalizeState(seed());cloudVersion='v0';`);
 c.ctx.mockSb={from(table){let op='read',payload,filters={};const chain={select(){return chain},eq(k,v){filters[k]=v;return chain},update(p){op='write';payload=p;return chain},async single(){if(server.readError)return {error:{message:'read failure'}};return {data:{data:JSON.parse(JSON.stringify(server.data)),updated_at:server.version}}},async maybeSingle(){if(server.writeError)return {error:{message:'write failure'}};if(server.beforeWrite){const fn=server.beforeWrite;server.beforeWrite=null;fn()}if(filters.updated_at!==server.version)return {data:null};server.data=JSON.parse(JSON.stringify(payload.data));server.version='v'+(++server.n);return {data:{updated_at:server.version}}}};return chain}};
 c.run('sb=mockSb');return c;
}
(async()=>{
 let c=make(),seed=c.run('seed()');
 let b=structuredClone(seed),l=structuredClone(seed),r=structuredClone(seed);l.records.push({id:'l',kind:'income',amount:1});r.records.push({id:'r',kind:'income',amount:2});c.ctx.args={b,l,r};assert.equal(c.run('mergeStates(args.b,args.l,args.r).data.records.length'),2);
 b.animals=[{id:'a',tag:'1'}];l=structuredClone(b);r=structuredClone(b);l.animals[0].tag='2';r.animals[0].tag='3';c.ctx.args={b,l,r};assert.equal(c.run('mergeStates(args.b,args.l,args.r).conflicts.length'),1);
 l=structuredClone(b);r=structuredClone(b);l.animals=[];c.ctx.args={b,l,r};assert.equal(c.run('mergeStates(args.b,args.l,args.r).data.animals.length'),0);
 const server={data:seed,version:'v0',n:0},a=client(server),d=client(server);
 a.run("db.records.push({id:'a',kind:'income',amount:10,date:today()});save()");await a.run('uploadCloudState()');
 d.run("db.records.push({id:'b',kind:'income',amount:20,date:today()});save()");await d.run('uploadCloudState()');await a.run('uploadCloudState()');assert.equal(a.run('db.records.length'),2);assert.equal(server.data.records.length,2);
 a.ctx.navigator.onLine=false;a.run("db.records.push({id:'offline',kind:'note',date:today(),note:'offline'});save()");assert.equal(await a.run('uploadCloudState()'),false);assert.equal(server.data.records.length,2);
 a.ctx.navigator.onLine=true;await a.run('uploadCloudState()');assert.equal(server.data.records.length,3);assert.equal(a.run('cloudDirty'),false);
 a.run("db.records.push({id:'pending',kind:'note',date:today()});save()");server.writeError=true;assert.equal(await a.run('uploadCloudState()'),false);assert(a.run('cloudDirty'));assert([...a.storage.values()].some(v=>v.includes('pending')));server.writeError=false;await a.run('uploadCloudState()');
 a.run("db.records.push({id:'race',kind:'note',date:today()});save()");server.beforeWrite=()=>{server.data.records.push({id:'concurrent',kind:'note',date:'2026-10-01'});server.version='v'+(++server.n)};await a.run('uploadCloudState()');assert(server.data.records.some(x=>x.id==='race'));assert(server.data.records.some(x=>x.id==='concurrent'));
 server.readError=true;assert.equal(await a.run('uploadCloudState()'),false);server.readError=false;
 const restored=client(server,'u1',a.storage);restored.run("db=readStored(activeStorageKey,seed());let cache=JSON.parse(localStorage.getItem(activeStorageKey)).sync;cloudBase=cache.base;cloudDirty=cache.dirty");assert.equal(restored.run('db.records.length'),server.data.records.length);
 const other=client(server,'u2',a.storage);other.run('db=readStored(activeStorageKey,seed())');assert.equal(other.run('db.records.length'),0);
 a.run("resetCloudContext();cloudSession=null;activeStorageKey=KEY+'_guest';db=readStored(activeStorageKey,seed())");assert.equal(a.run('db.records.length'),0);assert(a.storage.has('suru_takip_v5_user_u1_farm_f1'));
 c.ctx.raw={format:'suru-takip-backup',version:1,data:server.data};assert.equal(c.run('validateBackup(raw).records.length'),server.data.records.length);
 c.run("cloudFarmId='f1'");c.ctx.raw.farmId='f2';assert.throws(()=>c.run('validateBackup(raw)'));
 c.ctx.raw={format:'suru-takip-backup',version:1,farmId:'f1',data:{animals:[{id:'dup'},{id:'dup'}],records:[]}};assert.throws(()=>c.run('validateBackup(raw)'));
 c.run("go('all');openBackup()");assert(c.ctx.document.getElementById('modalTitle').textContent.includes('Yedekleme'));
 console.log('PASS: independent two-device edits, deletion, concurrent conflict, conditional-write race retry, offline persistence/reconnect, failed read/write retention, reload, account isolation/logout, backup roundtrip and invalid/foreign backup rejection');
})().catch(e=>{console.error(e);process.exit(1)});
