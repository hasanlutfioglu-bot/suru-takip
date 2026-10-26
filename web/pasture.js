// Decorative flock scene. Counts come from current records; no farm data is written.
const PASTURE_LIMIT=24;
let pasturePaused=false,pastureRenderKey='';
try{pasturePaused=localStorage.getItem('suru_pasture_paused')==='1'}catch{}
function pastureModel(animals){
 const counts={ewe:0,ram:0,lamb:0,unknown:0};
 for(const a of animals)if(isActiveAnimal(a))counts[a.type==='Koyun'?'ewe':a.type==='Koç'?'ram':a.type==='Kuzu'?'lamb':'unknown']++;
 const total=Object.values(counts).reduce((s,n)=>s+n,0),shown=Math.min(PASTURE_LIMIT,total),visible={...counts};
 if(total>PASTURE_LIMIT){
  const types=Object.keys(counts).filter(k=>counts[k]>0),remaining=shown-types.length;
  const parts=types.map(k=>{const quota=remaining*counts[k]/total;visible[k]=1+Math.floor(quota);return {k,fraction:quota%1}});
  let extra=shown-Object.values(visible).reduce((s,n)=>s+n,0);
  parts.sort((a,b)=>b.fraction-a.fraction);for(const part of parts){if(extra<=0)break;visible[part.k]++;extra--}
 }
 return {counts,total,shown,visible,representative:total>PASTURE_LIMIT};
}
function pastureSheep(type,index){
 const ram=type==='ram',lamb=type==='lamb',unknown=type==='unknown';
 const wool=ram?'#d5c7a7':lamb?'#f8edcf':'#f2f0dd',face=ram?'#3f3e32':'#354638';
 return `<g class="pastureWander pastureMotion" style="--pace:${12+index%5}s;--delay:-${index*1.7}s"><ellipse cx="24" cy="29" rx="25" ry="5" fill="#263f32" opacity=".17"/><g transform="${index%3===0?'translate(52 0) scale(-1 1)':''}"><g class="pastureBob pastureMotion"><g fill="none" stroke="${face}" stroke-width="3.5" stroke-linecap="round"><path class="pastureLeg pastureMotion" d="M12 16v12"/><path class="pastureLeg pastureLegBack pastureMotion" d="M33 16v12"/></g><path d="M5 14C-3 9 0 0 8-1 10-8 20-9 25-5 33-10 43-5 42 2 50 7 45 17 38 17 31 24 13 23 5 14Z" fill="${wool}"/><path d="M4 4-3 0-4 5 2 10" fill="${wool}"/><g class="pastureHead pastureMotion"><path d="M36 0c6-6 17-2 17 6l-1 11-11 2-6-10Z" fill="${face}"/><path d="m48 2 10-2-3 6-6 2" fill="${face}"/>${ram?'<path d="M39 4C25-9 22 11 33 12c7 1 9-7 3-7" fill="none" stroke="#a98d60" stroke-width="4" stroke-linecap="round"/>':''}<circle cx="48" cy="6" r="1.1" fill="#fff7df"/></g>${unknown?'<text x="18" y="12" fill="#718067" font-size="14" font-weight="700">?</text>':''}</g></g></g>`;
}
function setupLivePasture(hero){
 hero.classList.add('hasPasture');hero.insertAdjacentHTML('beforeend',`<div class="livePasture" id="livePasture"><div class="pastureHeading"><span id="pastureTitle"></span><button type="button" id="pastureMotionButton" onclick="togglePastureMotion()"></button></div><svg class="pastureScene" viewBox="0 0 660 238" role="img" aria-labelledby="pastureSvgTitle pastureSvgDesc"><title id="pastureSvgTitle"></title><desc id="pastureSvgDesc"></desc><defs><linearGradient id="pastureSky" x2="0" y2="1"><stop stop-color="#c7d4b1"/><stop offset="1" stop-color="#e3dfbb"/></linearGradient></defs><path d="M0 0H660V238H0Z" fill="url(#pastureSky)"/><circle cx="555" cy="33" r="20" fill="#e8ce8d"/><path d="M0 71Q120 12 261 69T660 43V238H0Z" fill="#8fa678"/><path d="M0 107Q185 55 364 104T660 74V238H0Z" fill="#779360"/><path d="M0 160Q230 94 440 151T660 123V238H0Z" fill="#668751"/><path d="M0 219Q240 153 660 210V238H0Z" fill="#5c7b4a"/><g stroke="#6b7953" stroke-width="3" stroke-linecap="round"><path d="M22 89V56m38 24V48m38 26V45M16 66l88-12m-87 23 87-13"/></g><g fill="#526c44"><path d="M612 17c-15-12-29 14-15 23 12 15 32-2 27-12-1-8-6-10-12-11Z"/><path d="M636 39c-12-11-22 9-15 17 11 12 28-1 24-11Z"/></g><g stroke="#637345" stroke-width="3"><path d="M609 41v27m25-13v19"/></g><g fill="none" stroke="#b6c28a" stroke-width="1.5" opacity=".6"><path d="m26 143 3-7 4 8m107 70 3-8 4 6m177-57 3-7 4 6m181 59 3-6 3 8m96-101 2-6 4 5"/></g><g id="pastureAnimals" aria-hidden="true"></g><text id="pastureEmpty" x="330" y="148" text-anchor="middle" fill="#f4f0dc" font-size="17"></text></svg><p id="pastureCaption" class="pastureCaption"></p></div>`);
 const scene=document.getElementById('livePasture');
 const syncVisibility=()=>scene.classList.toggle('pastureHidden',document.hidden===true);
 document.addEventListener?.('visibilitychange',syncVisibility);syncVisibility();
 if(typeof IntersectionObserver!=='undefined'){const observer=new IntersectionObserver(entries=>{for(const e of entries)scene.classList.toggle('pastureOffscreen',!e.isIntersecting)},{threshold:0});observer.observe(scene)}
 window.matchMedia?.('(prefers-reduced-motion: reduce)')?.addEventListener?.('change',()=>renderLivePasture());
 renderLivePasture();
}
function togglePastureMotion(){
 pasturePaused=!pasturePaused;try{localStorage.setItem('suru_pasture_paused',pasturePaused?'1':'0')}catch{}
 renderLivePasture();
}
function renderLivePasture(){
 const scene=document.getElementById('livePasture');if(!scene)return;
 const model=pastureModel(db.animals),reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
 scene.classList.toggle('pasturePaused',pasturePaused||reduce);
 const button=document.getElementById('pastureMotionButton');button.disabled=reduce;button.setAttribute('aria-pressed',String(pasturePaused||reduce));button.textContent=reduce?tx('Hareket azaltıldı','Reduced motion'):pasturePaused?tx('▶ Hareketi aç','▶ Play'):tx('Ⅱ Durdur','Ⅱ Pause');button.setAttribute('aria-label',reduce?tx('Sistem hareket azaltma tercihi etkin','System reduced-motion preference is on'):pasturePaused?tx('Mera animasyonunu başlat','Play pasture animation'):tx('Mera animasyonunu durdur','Pause pasture animation'));
 document.getElementById('pastureTitle').textContent=tx('Sürün merada','Your flock at pasture');
 const key=JSON.stringify([model.counts,appLanguage]);if(key===pastureRenderKey)return;pastureRenderKey=key;
 const remaining={...model.visible},types=[];while(types.length<model.shown)for(const k of Object.keys(remaining))if(remaining[k]>0){types.push(k);remaining[k]--}
 const figures=types.map((type,i)=>{const slot=i*7%24,row=Math.floor(slot/6),col=slot%6;return {type,index:i,x:37+col*103+(row%2?12:0),y:66+row*41,scale:(type==='lamb'?.66:type==='ram'?1.02:.88)*(1+row*.045)}}).sort((a,b)=>a.y-b.y);
 document.getElementById('pastureAnimals').innerHTML=figures.map(x=>`<g class="pastureAnimal pastureAnimal-${x.type}" data-species="${x.type}" transform="translate(${x.x} ${x.y}) scale(${x.scale})">${pastureSheep(x.type,x.index)}</g>`).join('');
 const description=model.counts.ewe+' '+tx('koyun','ewes')+' · '+model.counts.ram+' '+tx('koç','rams')+' · '+model.counts.lamb+' '+tx('kuzu','lambs')+(model.counts.unknown?' · '+model.counts.unknown+' '+tx('türü belirsiz','unknown type'):'');
 document.getElementById('pastureSvgTitle').textContent=tx('Güncel sürünün mera görünümü','Pasture view of the current flock');document.getElementById('pastureSvgDesc').textContent=description+'. '+(model.representative?tx('Figürler sürü dağılımını temsilen gösterilir.','Figures represent the flock composition.'):tx('Her figür bir aktif hayvanı temsil eder.','Each figure represents one active animal.'));
 document.getElementById('pastureEmpty').textContent=model.total?'':tx('İlk hayvanını ekle, meran canlansın.','Add your first animal to bring the pasture to life.');
 document.getElementById('pastureCaption').textContent=model.representative?tx('Temsili görünüm','Representative view')+' · '+model.shown+' '+tx('figür','figures')+' / '+model.total.toLocaleString(appLocale())+' '+tx('aktif hayvan','active animals'):model.total?tx('Her figür bir aktif hayvan · güncel kayıtlara göre','One figure per active animal · based on current records'):tx('Henüz aktif hayvan kaydı yok.','No active animal records yet.');
}
