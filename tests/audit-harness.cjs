const {parseHTML}=require('linkedom'),vm=require('node:vm'),fs=require('node:fs');
module.exports=function make(storage=new Map()){
 const html=fs.readFileSync('v21.html','utf8'),{document}=parseHTML(html),timers=[];
 const c={document,console,Date,Math,Intl,Set,Map,JSON,Number,String,Array,Blob,URL,navigator:{onLine:false},location:{protocol:'https:',origin:'https://test.invalid',pathname:'/v21.html'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k),key:i=>[...storage.keys()][i],get length(){return storage.size}},setTimeout:f=>(timers.push(f),timers.length),clearTimeout:()=>{},confirm:()=>true,prompt:()=> 'Test işi'};
 c.window=c;c.addEventListener=()=>{};c.scrollTo=()=>{};
 for(const id of new Set([...html.matchAll(/id="([A-Za-z0-9_]+)"/g)].map(x=>x[1])))if(!new RegExp('function '+id+'\\(').test(html))Object.defineProperty(c,id,{get:()=>document.getElementById(id),configurable:true});
 vm.createContext(c);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],c);
 const run=s=>vm.runInContext(s,c),fill=(id,value)=>{const el=document.getElementById(id);if(!el)throw Error('Missing #'+id);if(el.localName==='select')Object.defineProperty(el,'value',{value,writable:true,configurable:true});else el.value=value;};
 function defaults(){document.querySelectorAll('select').forEach(e=>{if(!e.value){const o=e.querySelector('option[selected]')||e.querySelector('option');Object.defineProperty(e,'value',{value:o?.getAttribute('value')||o?.textContent||'',writable:true,configurable:true})}})}
 function pro(){run("currentPlan='pro';subscriptionStatus='active';currentPeriodEnd=addDaysISO(today(),365)+'T23:59:59Z'")}
 return {c,document,storage,run:s=>(defaults(),run(s)),fill,pro,timers,flush:async()=>{const work=timers.splice(0);for(const f of work)await f();}};
};
