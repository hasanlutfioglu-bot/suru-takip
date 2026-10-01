const assert=require('node:assert/strict');
(async()=>{
 const {parseHTML}=require('linkedom'),vm=require('vm'),fs=require('fs');
 const html=fs.readFileSync('v21.html','utf8'),storage=new Map(),errors=[];
 let document,c;
 function init(){document=parseHTML(html).document;c={document,console,Date,Math,Intl,Set,Map,JSON,Number,String,Array,Blob,URL,setTimeout:()=>0,clearTimeout:()=>{},navigator:{onLine:false},location:{protocol:'https:',origin:'https://example.test',pathname:'/v21.html'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),key:i=>[...storage.keys()][i],get length(){return storage.size}},confirm:()=>true,prompt:()=> 'Test görevi'};c.window=c;c.addEventListener=()=>{};c.scrollTo=()=>{};
 for(const id of new Set([...html.matchAll(/id="([A-Za-z0-9_]+)"/g)].map(x=>x[1])))if(!new RegExp('function '+id+'\\(').test(html))Object.defineProperty(c,id,{get:()=>document.getElementById(id),configurable:true});vm.createContext(c);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],c)}
 init();

 vm.runInContext(`db.animals=[{id:'ewe',tag:'245',type:'Koyun',sex:'Dişi',status:'Aktif'},{id:'empty',tag:'246',type:'Koyun',sex:'Dişi',status:'Aktif'},{id:'ram',tag:'9',type:'Koç',sex:'Erkek',status:'Aktif'},{id:'kid',tag:'247',type:'Kuzu',sex:'Erkek',status:'Satıldı',motherId:'ewe',birth:'2026-09-20'}]; db.records=[{id:'old',kind:'birth',motherId:'ewe',date:'2024-01-05',count:1,note:'<script>bad</script>'},{id:'new',kind:'birth',motherId:'ewe',date:'2026-09-20',count:2,childIds:['kid']},{id:'mid',kind:'birth',motherId:'ewe',date:'2025-03-10',count:2}]; db.report='monthly';renderHerd()`,c);
 assert.equal(vm.runInContext("eweBirthHistory('ewe').rate",c),'1,7');
 assert.equal(vm.runInContext("eweBirthHistory('ewe').last",c),'2026-09-20');
 assert(document.getElementById('herdList').textContent.includes('20.09.2026'));
 assert.equal(vm.runInContext("eweBirthSummary(db.animals[2])",c),'');
 assert(vm.runInContext("eweBirthSummary(db.animals[1])",c).includes('Kayıt yok'));
 vm.runInContext("animalCard('ewe')",c);
 const history=document.getElementById('modalBody');
 assert.equal(history.querySelectorAll('.birthEntry').length,3);
 assert(history.textContent.indexOf('20.09.2026')<history.textContent.indexOf('10.03.2025'));
 assert(history.textContent.includes('05.01.2024'));
 assert(history.textContent.includes('5 kuzu'));
 assert(history.textContent.includes('#247 · Erkek · Satıldı'));
 assert.equal(history.querySelectorAll('script').length,0);
 vm.runInContext("db.records.splice(1,1);renderHerd()",c);
 assert.equal(vm.runInContext("eweBirthHistory('ewe').last",c),'2025-03-10');
 assert.equal(vm.runInContext("eweBirthHistory('ewe').rate",c),'1,5');
 console.log('PASS: ewe summary, latest birth, all-year sorted history, missing history, lamb status, escaped notes and updated records');
})().catch(e=>{console.error(e);process.exit(1)});
