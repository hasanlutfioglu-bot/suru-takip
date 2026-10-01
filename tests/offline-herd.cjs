const {parseHTML}=require('linkedom'),vm=require('vm'),fs=require('fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('v21.html','utf8'),KEY='suru_takip_v5',key=KEY+'_user_u1_farm_f1';
const seed={animals:[{id:'e1',type:'Koyun',sex:'Dişi',status:'Aktif',tag:'245'}],records:[],tasks:[],ramCalendar:[],stock:{},farmName:'Hasan',_meta:{initialized:true}};
function make(storage,onLine=false){
 const {document}=parseHTML(html),timers=[];
 const c={document,console,Date,Math,Intl,Set,Map,JSON,Number,String,Array,Blob,URL,navigator:{onLine},location:{protocol:'https:',origin:'https://example.test',pathname:'/v21.html'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),key:i=>[...storage.keys()][i],get length(){return storage.size}},setTimeout:(f)=>{timers.push(f);return timers.length},clearTimeout:()=>{},confirm:()=>true};
 c.window=c;c.events={};c.addEventListener=(n,f)=>c.events[n]=f;c.scrollTo=()=>{};document.querySelectorAll('[id]').forEach(e=>c[e.id]=e);vm.createContext(c);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],c);
 return {c,run:s=>vm.runInContext(s,c),flush:async()=>{const work=timers.splice(0);for(const f of work)await f();await Promise.resolve()}};
}
function storage(){return new Map([[key,JSON.stringify({_localEnvelope:1,data:seed,sync:{base:seed,version:'v1',dirty:false}})],[KEY+'_device_context',JSON.stringify({key,userId:'u1',farmId:'f1',role:'owner',plan:'plus'})]])}
(async()=>{
 const st=storage(),a=make(st);
 assert.equal(a.run('db.animals.length'),1);assert.equal(a.c.heroTotal.textContent,'1 hayvan');assert.equal(a.run('currentPlan'),'plus');
 a.run("handleCloudSession('INITIAL_SESSION',null)");await a.flush();assert.equal(a.run('db.animals.length'),1);
 a.run("handleCloudSession('SIGNED_OUT',null)");await a.flush();assert.equal(a.run('db.animals.length'),1);
 a.c.events.offline();assert.equal(a.run('db.animals.length'),1);
 a.run("db.records.push({id:'offline_note',kind:'note',date:today(),note:'Offline kayıt'});save()");
 assert.equal(a.run('cloudDirty'),true);
 const b=make(st);assert.equal(b.run('db.records.length'),1);assert.equal(b.run('cloudDirty'),true);assert.equal(b.run('cloudVersion'),'v1');
 b.c.mock={from(){throw Error('network unavailable')}};
 b.run("sb=mock;handleCloudSession('SIGNED_IN',{user:{id:'u1'}})");await b.flush();
 assert.equal(b.run('db.animals.length'),1);assert.equal(b.run('cloudDirty'),true);
 b.c.navigator.onLine=true;await b.run('connectCloud()');assert.equal(b.run('db.records.length'),1);assert.equal(b.run('cloudDirty'),true);
 b.run("handleCloudSession('SIGNED_IN',{user:{id:'u2'}})");await b.flush();assert.equal(b.run('db.animals.length'),0);assert.equal(b.run('cloudFarmId'),null);
 const c=make(storage());c.run('signOutCloud()');await c.flush();assert.equal(c.run('db.animals.length'),0);assert.equal(c.run('readDeviceContext()'),null);
 const d=make(storage(),true);d.run("handleCloudSession('SIGNED_OUT',null)");await d.flush();assert.equal(d.run('db.animals.length'),0);
 const legacy=storage();legacy.delete(KEY+'_device_context');legacy.set('sb-nqbfyahiijdkrroojlct-auth-token',JSON.stringify({user:{id:'u1'},expires_at:1}));
 const e=make(legacy);assert.equal(e.run('db.animals.length'),1);
 const f=make(new Map());assert.equal(f.run('db.animals.length'),0);
 // An earlier deferred auth callback must not revert a newer account.
 const g=make(storage());g.c.mock={from(){throw Error('offline')}};g.run("sb=mock;handleCloudSession('INITIAL_SESSION',null);handleCloudSession('SIGNED_IN',{user:{id:'u2'}})");await g.flush();assert.equal(g.run('cloudSession.user.id'),'u2');assert.equal(g.run('db.animals.length'),0);
 console.log('PASS: offline herd display/relaunch, null/expired session, missing SDK, offline edits survive restart, reconnect failure retention, account isolation, explicit/remote logout, old-install migration, auth callback race');
})().catch(e=>{console.error(e);process.exit(1)});
