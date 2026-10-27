// The scene is a read-only projection. Only device presentation preferences persist.
let farmSettings={dawn:6,day:8,dusk:18,night:21},farmHidden=false;
try{const s=JSON.parse(localStorage.getItem('suru_farm_hours')||'null');if(farmHoursValid(s))farmSettings=s;farmHidden=localStorage.getItem('suru_farm_hidden')==='1'}catch{}
let farmScene={scope:null,highlight:'',preview:'auto',key:'',queue:[],current:null,timer:null,started:0,left:0,nonce:0,offscreen:false};
function farmHoursValid(s){return !!s&&['dawn','day','dusk','night'].every(k=>Number.isInteger(s[k])&&s[k]>=0&&s[k]<=23)&&s.dawn<s.day&&s.day<s.dusk&&s.dusk<s.night}
function farmPhaseAt(hour){return hour<farmSettings.dawn||hour>=farmSettings.night?'night':hour<farmSettings.day?'dawn':hour<farmSettings.dusk?'day':'dusk'}
function farmHash(s){let n=0;for(const c of String(s))n=(n*31+c.charCodeAt(0))>>>0;return n}
function farmType(a){return a.type==='Koyun'?'ewe':a.type==='Koç'?'ram':a.type==='Kuzu'?'lamb':'unknown'}
function openFarmFeedSelection(){openFarmFinishing()}
function farmPlaceAllFigures(rows){
 const byId=new Map(rows.map(r=>[r.a.id,r])),areas={pasture:[65,350,205,410],nursery:[450,720,195,290],feed:[455,720,355,420]},groups={pasture:new Map(),nursery:new Map(),feed:new Map()};
 for(const row of rows){const key=row.zone==='nursery'?(row.mother||row.a.id):row.a.id;if(!groups[row.zone].has(key))groups[row.zone].set(key,[]);groups[row.zone].get(key).push(row)}
 const figures=[];
 for(const [zone,map] of Object.entries(groups)){
  const cells=[...map.values()],n=cells.length;if(!n)continue;const [left,right,top,bottom]=areas[zone],width=right-left,height=bottom-top;
  const maxKids=cells.reduce((max,m)=>Math.max(max,m.filter(f=>f.mother).length),0),logicalWidth=Math.max(82,30+(Math.min(3,maxKids)-1)*34+44),logicalHeight=65+Math.floor(Math.max(0,maxKids-1)/3)*30;
  let cols=1,packing=0;for(let c=1;c<=n;c++){const candidate=Math.min(1,width/c/logicalWidth,height/Math.ceil(n/c)/logicalHeight);if(candidate>packing){cols=c;packing=candidate}}
  const cellWidth=width/cols,cellHeight=height/Math.ceil(n/cols);
  cells.forEach((members,index)=>{
   members.sort((a,b)=>Number(!!a.mother)-Number(!!b.mother));const x0=left+index%cols*cellWidth+(cellWidth-logicalWidth*packing)/2,y0=top+Math.floor(index/cols)*cellHeight+(cellHeight-logicalHeight*packing)/2+18*packing;
   let child=0;for(const f of members){const isChild=!!f.mother&&byId.get(f.mother)?.zone===zone,slot=isChild?child++:0,scale=(f.type==='lamb'?.57:f.type==='ram'?.85:.78)*packing;figures.push({...f,x:x0+(isChild?30+slot%3*34:0)*packing,y:y0+(isChild?26+Math.floor(slot/3)*30:0)*packing,scale,family:farmHash(f.mother||f.a.id),gatherX:0,gatherY:0})}
  });
 }
 return figures.sort((a,b)=>a.y-b.y);
}
function farmProjection(animals=db.animals,records=db.records,forcedId=farmScene.current?.ids[0]||farmTalk.current?.animalId||farmScene.highlight){
 const base=pastureModel(animals),active=animals.filter(isActiveAnimal),byId=new Map(active.map(a=>[a.id,a])),links=new Map(),confirmedFinishing=farmFinishingIds(animals,records);
 for(const r of records){if(!validDate(r.date)||r.date>today())continue;if(r.kind==='birth'&&r.motherId)for(const id of r.childIds||[]){if(!links.has(id))links.set(id,new Set());links.get(id).add(r.motherId)}}
 const motherFor=a=>{const linked=links.get(a.id),id=a.motherId||(linked?.size===1?[...linked][0]:'');if(a.motherId&&linked?.size&&(!linked.has(a.motherId)||linked.size>1))return '';const mother=byId.get(id);return mother?.type==='Koyun'&&mother.sex==='Dişi'?id:''};
 const rows=active.map(a=>{const type=farmType(a),grown=confirmedFinishing.has(a.id),mother=type==='lamb'&&!grown?motherFor(a):'';return {a,type,mother,zone:grown?'feed':mother?'nursery':'pasture',tracked:a.status==='Takipte'}});
 const mothers=new Set(rows.map(x=>x.mother).filter(Boolean));for(const r of rows)if(mothers.has(r.a.id)&&r.zone!=='feed')r.zone='nursery';
 const figures=farmPlaceAllFigures(rows);
 // Family members share screen-space offsets, even though lambs have a smaller scale.
 const families=new Map();for(const f of figures){const key=f.zone+':'+(f.mother||f.a.id);if(!families.has(key))families.set(key,[]);families.get(key).push(f)}
 const bounds={pasture:[65,350,205,410],nursery:[450,720,195,290],feed:[455,720,355,420]};
 for(const members of families.values()){const first=members[0],b=bounds[first.zone],lx=Math.max(...members.map(f=>b[0]-f.x)),hx=Math.min(...members.map(f=>b[1]-f.x)),ly=Math.max(...members.map(f=>b[2]-f.y)),hy=Math.min(...members.map(f=>b[3]-f.y)),clamp=(v,l,h)=>l>h?0:Math.max(l,Math.min(h,v)),distance=first.zone==='pasture'?58:28,dx=clamp(hx>=-lx?distance:-distance,lx,hx),dy=clamp(hy>=-ly?19:-19,ly,hy);
  for(const f of members){f.roam={dx,dy,duration:32+first.family%11,delay:-(first.family%29),bounds:b};f.gatherX=0;f.gatherY=0}
 }
 const zones={pasture:0,nursery:0,feed:0};rows.forEach(r=>zones[r.zone]++);
 const description=base.counts.ewe+' '+tx('koyun','ewes')+' · '+base.counts.ram+' '+tx('koç','rams')+' · '+base.counts.lamb+' '+tx('kuzu','lambs')+'. '+tx('Besi alanı yalnız onaylı besiye geçiş kayıtlarına dayanır.','Finishing placement uses approved transition records only.')+(base.representative?' '+tx('Görünüm temsilidir.','Representative view.'):'');
 return {...base,figures,zones,description,unlinked:rows.filter(r=>r.type==='lamb'&&!r.mother&&r.zone==='pasture').length};
}
function farmPauseTimer(){if(farmScene.timer!==null){clearTimeout(farmScene.timer);farmScene.timer=null;farmScene.left=Math.max(0,farmScene.left-(Date.now()-farmScene.started));farmScene.nonce++}}
function farmClearEvent(){farmPauseTimer();farmScene.current=null;farmScene.left=0;farmScene.nonce++}
function resetFarmSceneEvents(){farmClearEvent();farmScene.queue=[];farmScene.highlight=''}
function farmScopeCheck(){if(farmScene.scope!==activeStorageKey){farmClearEvent();farmScene.scope=activeStorageKey;farmScene.queue=[];farmScene.highlight='';farmScene.key='';farmScene.preview='auto'}}
function farmEventSignature(r){return JSON.stringify([r.id,r.kind,r.date,r.animalId,r.animalIds,r.childIds,r.motherId,r.count,r.note,r.weight,r.action])}
function farmEventsFor(records,subjects=db.animals){
 const map=new Map(subjects.map(a=>[a.id,a])),groups=new Map();
 for(const r of records){if(!r.id||!(['birth','weaning','feeding','health','weight','sale'].includes(r.kind)||r.kind==='note'&&r.action==='finishing_start')||!validDate(r.date)||r.date>today()||r.weaningRecordId)continue;
  const key=r.batchId?r.kind+':'+r.batchId:['weight','weaning'].includes(r.kind)?r.kind+':'+r.date:r.id;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);
 }
 return [...groups.values()].map(rows=>{const first=rows[0],ids=[...new Set(rows.flatMap(r=>r.kind==='birth'?[r.motherId,...r.childIds||[]]:r.animalIds||[r.animalId]).filter(Boolean))];return {id:first.id,recordIds:rows.map(r=>r.id),signatures:rows.map(farmEventSignature),kind:first.kind==='note'&&first.action==='finishing_start'?'finishing':first.kind,date:first.date,ids,count:first.kind==='birth'?rows.reduce((s,r)=>s+(+r.count||0),0):ids.length,weight:first.kind==='weight'?weightValueFromRecord(first):null,subjects:ids.map(id=>map.get(id)).filter(Boolean).map(a=>({id:a.id,type:a.type,tag:a.tag})),stage:0,replay:false}}).filter(e=>e.ids.length);
}
function farmEventValid(e){const rows=new Map(db.records.map(r=>[r.id,r]));return e.recordIds.every((id,i)=>rows.has(id)&&farmEventSignature(rows.get(id))===e.signatures[i])&&(e.kind!=='finishing'||e.ids.every(id=>farmFinishingIds().has(id)&&db.animals.some(a=>a.id===id&&isActiveAnimal(a))))&&(e.kind!=='sale'||e.ids.every(id=>!db.animals.some(a=>a.id===id&&isActiveAnimal(a))))}
function notifyFarmSceneCommit(before,after){
 farmScopeCheck();if(!before||before===after)return;
 const old=new Set((before.records||[]).map(r=>r.id)),fresh=after.records.filter(r=>!old.has(r.id));
 if(fresh.some(r=>r.kind==='import'))return;
 const origins=new Map(farmProjection(before.animals||[],before.records||[]).figures.map(f=>[f.a.id,{x:f.x,y:f.y}]));
 const events=farmEventsFor(fresh,[...before.animals||[],...after.animals]).map(e=>({...e,origins:Object.fromEntries(e.ids.slice(0,4).map(id=>[id,origins.get(id)||{x:550,y:270}]))}));
 const known=new Set([farmScene.current?.id,...farmScene.queue.map(e=>e.id)]);farmScene.queue.push(...events.filter(e=>!known.has(e.id)));farmScene.queue=farmScene.queue.slice(-12);
}
function farmReduced(){return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true}
function farmCanPlay(){const modalOpen=document.getElementById('modal')?.classList.contains('show'),expanded=modalOpen&&!!document.querySelector('#modalBody .farmExpanded');return !pasturePaused&&!farmReduced()&&!document.hidden&&!farmHidden&&(expanded||!modalOpen&&document.getElementById('home')?.classList.contains('active')&&!farmScene.offscreen)}
function farmDriveEvent(){
 if(farmScene.current&&!farmEventValid(farmScene.current))farmClearEvent();
 farmScene.queue=farmScene.queue.filter(farmEventValid);
 if(!farmScene.current&&farmScene.queue.length&&farmCanPlay()){farmScene.current=farmScene.queue.shift();farmScene.left=3000}
 if(!farmScene.current)return;
 if(!farmCanPlay()){farmPauseTimer();return}
 if(farmScene.timer===null){const current=farmScene.current,stage=current.stage,nonce=++farmScene.nonce;farmScene.started=Date.now();farmScene.timer=setTimeout(()=>{if(farmScene.current!==current||current.stage!==stage||nonce!==farmScene.nonce)return;farmScene.timer=null;current.stage++;if(current.stage>2){farmScene.current=null;farmScene.left=0}else farmScene.left=current.stage===1?4500:3000;renderLivePasture()},farmScene.left)}
}
function farmEventText(e){const names={birth:tx('Doğum','Lambing'),weaning:tx('Sütten kesim','Weaning'),finishing:tx('Besiye geçiş','Move to finishing'),feeding:tx('Yemleme','Feeding'),health:tx('Sağlık / aşı kaydı','Health / vaccination record'),weight:tx('Tartım','Weighing'),sale:tx('Satış','Sale')};return names[e.kind]+' · '+e.count+' '+(e.kind==='birth'?tx('kuzu','lambs'):tx('hayvan','animals'))+' · '+e.date}
function farmControls(){return `<div class="farmTools"><label class="farmSearch"><span>${tx('Küpeyi sahnede bul','Find a tag in the scene')}</span><div><input type="text" maxlength="32" class="farmTagInput" aria-label="${tx('Sahnede küpe ara','Search scene by tag')}" placeholder="245" onkeydown="if(event.key==='Enter')highlightFarmAnimal(this.value)"><button type="button" onclick="highlightFarmAnimal(this.previousElementSibling.value)">${tx('Bul','Find')}</button></div></label><div class="farmToolButtons"><button type="button" class="farmTalkToggle" onclick="toggleFarmTalk()">${tx('Konuşmalar','Dialogue')}</button><button type="button" onclick="openFarmFeedSelection()">${tx('Besiye geçiş','Move to finishing')}</button><button type="button" onclick="openFarmSceneHistory()">${uiIcon('history')}${tx('Olaylar','Events')}</button><button type="button" onclick="openFarmSceneSettings()">${uiIcon('settings')}${tx('Saatler','Hours')}</button><button type="button" onclick="openFarmSceneExpanded()">${uiIcon('grid')}${tx('Büyüt','Expand')}</button></div></div>`}
function setupFarmScene(hero){
 hero.classList.add('hasPasture','hasLivingFarm');hero.insertAdjacentHTML('beforeend',`<div class="livePasture farmView" id="livePasture" data-farm-view="main"><div class="pastureHeading"><div><span id="pastureTitle"></span><small class="farmClock"></small></div><div><button type="button" id="pastureMotionButton" onclick="togglePastureMotion()"></button><button type="button" class="farmHideButton" onclick="toggleFarmHidden()"></button></div></div><div class="farmCanvasHost"></div><div class="farmStatus" role="status" aria-live="polite"></div><div class="farmZoneStats"></div><p id="pastureCaption" class="pastureCaption"></p><div class="farmSearchResult"></div>${farmControls()}</div>`);
 if(typeof setInterval==='function')setInterval(()=>{if(farmCanPlay()||farmTalk.current)renderLivePasture()},5000);
 const refresh=()=>renderLivePasture();document.addEventListener?.('visibilitychange',refresh);
 if(typeof IntersectionObserver!=='undefined'){const observer=new IntersectionObserver(entries=>{for(const e of entries)farmScene.offscreen=!e.isIntersecting;refresh()},{threshold:0});observer.observe(document.getElementById('livePasture'))}
 window.matchMedia?.('(prefers-reduced-motion: reduce)')?.addEventListener?.('change',refresh);
 if(typeof setInterval==='function')setInterval(()=>{if(!document.hidden&&(!farmScene.offscreen||document.getElementById('modal')?.classList.contains('show')&&document.querySelector('#modalBody .farmExpanded')))renderLivePasture()},60000);
 renderLivePasture();
}
function renderFarmScene(){
 const scene=document.getElementById('livePasture');if(!scene)return;
 farmScopeCheck();farmDriveEvent();const now=new Date(),phase=farmScene.preview==='auto'?farmPhaseAt(now.getHours()):farmScene.preview;farmDialogueUpdate(phase);const model=farmProjection(),reduce=farmReduced(),event=farmScene.current;
 const phaseName={day:tx('Gündüz','Day'),dawn:tx('Sabah','Dawn'),dusk:tx('Akşam','Evening'),night:tx('Gece','Night')}[phase];
 scene.classList.toggle('pastureOffscreen',farmScene.offscreen);scene.classList.toggle('pastureHidden',document.hidden===true);
 const key=JSON.stringify([activeStorageKey,model.figures.map(f=>[f.a.id,f.a.tag,f.a.status,f.mother,f.zone,f.type,f.x,f.y]),model.counts,appLanguage,phase,reduce,farmScene.highlight,event?.id,event?.stage,farmTalk.current?.key]);
 for(const view of document.querySelectorAll('[data-farm-view]')){
  const modalOpen=document.getElementById('modal')?.classList.contains('show'),expanded=view.dataset.farmView==='expanded',visible=expanded?modalOpen:document.getElementById('home')?.classList.contains('active')&&!modalOpen&&!farmScene.offscreen;
  view.dataset.talking=String(!!farmTalk.current);view.dataset.phase=phase;view.dataset.event=event?.kind||'';view.dataset.stage=event?String(event.stage):'';view.classList.toggle('pasturePaused',pasturePaused||reduce||!visible||document.hidden===true||farmHidden);view.classList.toggle('farmIsHidden',farmHidden);
  const viewKey=key;if(view.dataset.sceneKey!==viewKey){view.dataset.sceneKey=viewKey;const host=view.querySelector('.farmCanvasHost');if(host){const duration=event?.stage===1?4500:3000,elapsed=event?Math.max(0,duration-farmScene.left+(farmScene.timer!==null?Date.now()-farmScene.started:0)):0;host.style.setProperty('--stage-time',duration+'ms');host.style.setProperty('--stage-delay',-elapsed+'ms');host.innerHTML=farmSceneArt(model,phase,expanded?'farmExpanded':'farm')}}
  let speech=view.querySelector('.farmSpeechHost');if(!speech){speech=document.createElement('div');speech.className='farmSpeechHost';view.querySelector('.farmCanvasHost').after(speech)}speech.hidden=!visible;const speechKey=JSON.stringify([farmTalk.current,appLanguage]);if(speech.dataset.key!==speechKey){speech.dataset.key=speechKey;speech.innerHTML=farmDialogueCard()}for(const talkButton of view.querySelectorAll('.farmTalkToggle')){talkButton.textContent=farmTalk.muted?tx('Konuşmaları aç','Enable dialogue'):tx('Konuşmaları sustur','Mute dialogue');talkButton.setAttribute('aria-pressed',String(farmTalk.muted))}
  let finishing=view.querySelector('.farmFinishingHost');if(!finishing){finishing=document.createElement('div');finishing.className='farmFinishingHost';view.querySelector('.farmCanvasHost').after(finishing)}const warning=farmFinishingWarning();if(finishing.dataset.markup!==warning){finishing.dataset.markup=warning;finishing.innerHTML=warning}
  const clock=view.querySelector('.farmClock');if(clock)clock.textContent=(farmScene.preview==='auto'?tx('Cihaz saati','Device time'):tx('Önizleme','Preview'))+' · '+now.toLocaleTimeString(appLocale(),{hour:'2-digit',minute:'2-digit'})+' · '+phaseName;
  const status=view.querySelector('.farmStatus');if(status){const text=event?(event.replay?tx('Yeniden izleme · ','Replay · '):tx('Kayıt canlandırması · ','Recorded event · '))+farmEventText(event):farmScene.queue.length?farmScene.queue.length+' '+tx('canlandırma bekliyor · ana sayfada hareketi aç','events waiting · resume on Home'):tx('Kayıtlar çiftliğe yansıtılıyor · sahne temsilidir','Records reflected in the farm · illustrative scene');if(status.textContent!==text)status.textContent=text}
  const stats=view.querySelector('.farmZoneStats');if(stats)stats.textContent=tx('Mera','Pasture')+' '+model.zones.pasture+' · '+tx('Anne–kuzu alanı','Ewe–lamb area')+' '+model.zones.nursery+' · '+tx('Besi / büyütme','Finishing / growers')+' '+model.zones.feed;
  const result=view.querySelector('.farmSearchResult'),found=db.animals.find(a=>a.id===farmScene.highlight&&isActiveAnimal(a));const resultKey=JSON.stringify([found?.id,found?.tag,appLanguage]);if(result&&result.dataset.resultKey!==resultKey){result.dataset.resultKey=resultKey;result.innerHTML=found?`<button type="button" data-farm-animal="${escHtml(found.id)}" onclick="farmAnimalClick(event)">${escHtml(animalName(found))} · ${tx('Kartı aç','Open card')} ↗</button>`:'';}
  const hide=view.querySelector('.farmHideButton');if(hide){hide.textContent=farmHidden?tx('Göster','Show'):tx('Gizle','Hide');hide.setAttribute('aria-expanded',String(!farmHidden))}
 }
 const button=document.getElementById('pastureMotionButton');button.disabled=reduce;button.setAttribute('aria-pressed',String(pasturePaused||reduce));button.textContent=reduce?tx('Hareket azaltıldı','Reduced motion'):pasturePaused?tx('▶ Hareketi aç','▶ Play'):tx('Ⅱ Durdur','Ⅱ Pause');button.setAttribute('aria-label',reduce?tx('Sistem hareket azaltma tercihi etkin','System reduced-motion preference is on'):pasturePaused?tx('Mera animasyonunu başlat','Play pasture animation'):tx('Mera animasyonunu durdur','Pause pasture animation'));
 document.getElementById('pastureTitle').textContent=tx('Yaşayan çiftliğin','Your living farm');
 document.getElementById('pastureCaption').textContent=(model.representative?tx('Temsili görünüm','Representative view')+' · '+model.shown+' / '+model.total.toLocaleString(appLocale())+' '+tx('aktif hayvan','active animals'):tx('Her figür bir aktif hayvan · güncel kayıtlara göre','One figure per active animal · based on current records')+' · '+model.total.toLocaleString(appLocale())+' / '+model.total.toLocaleString(appLocale()))+(model.unlinked?' · '+model.unlinked+' '+tx('kuzunun aktif anne / büyütme bağlantısı yok','lambs without an active dam / grower link'):'');
}
function toggleFarmHidden(){farmHidden=!farmHidden;try{localStorage.setItem('suru_farm_hidden',farmHidden?'1':'0')}catch{}renderLivePasture()}
function farmAnimalClick(event){event.stopPropagation?.();const id=event.target?.closest('[data-farm-animal]')?.dataset.farmAnimal;if(id&&db.animals.some(a=>a.id===id)){farmPauseTimer();animalCard(id);renderLivePasture()}}
function farmAnimalKey(event){if(['Enter',' '].includes(event.key)){event.preventDefault();farmAnimalClick(event)}}
function highlightFarmAnimal(tag){const key=String(tag||'').trim().toLocaleLowerCase('tr-TR'),matches=db.animals.filter(a=>isActiveAnimal(a)&&String(a.tag||'').trim().toLocaleLowerCase('tr-TR')===key);if(!key||matches.length!==1)return toast(tx('Tek bir aktif hayvana ait küpe gir','Enter a tag matching one active animal'));farmScene.highlight=matches[0].id;renderLivePasture()}
function openFarmSceneExpanded(){showModal(tx('Yaşayan çiftlik','Living farm'),'<div class="farmExpanded farmView" data-farm-view="expanded"><div class="farmExpandedActions"><small class="farmClock"></small><button type="button" onclick="togglePastureMotion()">'+tx('Hareketi durdur / başlat','Pause / resume')+'</button></div><div class="farmCanvasHost"></div><div class="farmStatus" role="status" aria-live="polite"></div><div class="farmZoneStats"></div><div class="farmSearchResult"></div>'+farmControls()+'</div>');renderLivePasture()}
function openFarmSceneHistory(){
 farmPauseTimer();const events=farmEventsFor(db.records).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);
 showModal(tx('Çiftlik olayları','Farm events'),'<p class="muted">'+tx('Eski kayıtlar kendiliğinden oynatılmaz. Yeniden izleme yalnız görünümü canlandırır; kayıtları veya sayıları değiştirmez.','Existing records never autoplay. Replay animates the view only; it does not change records or counts.')+'</p>'+events.map(e=>`<button type="button" class="farmHistoryRow" data-farm-replay="${escHtml(e.id)}" onclick="farmReplayClick(event)"><span>${escHtml(farmEventText(e))}</span><b>${tx('Yeniden izle','Replay')} ▷</b></button>`).join('')+(events.length?'':'<p>'+tx('Canlandırılabilir kayıt yok.','No recorded events to replay.')+'</p>'));renderLivePasture();
}
function farmReplayClick(event){const id=event.target.closest('[data-farm-replay]')?.dataset.farmReplay;replayFarmEvent(id)}
function replayFarmEvent(id){const e=farmEventsFor(db.records).find(e=>e.id===id);if(!e||!farmEventValid(e))return toast(tx('Bu kayıt artık canlandırılamıyor','This record is no longer replayable'));farmClearEvent();farmScene.queue=[{...e,replay:true}];closeModal();go('home');renderLivePasture()}
function openFarmSceneSettings(){farmPauseTimer();showModal(tx('Çiftliğin saatleri','Farm hours'),'<p class="muted">'+tx('Cihazın yerel saati kullanılır. Bu saatler görsel davranışı belirler; konuma göre gün doğumu veya gerçek hayvan konumu değildir.','Uses device local time. These hours control visual behaviour, not location-based sunrise or actual animal position.')+'</p>'+[['dawn',tx('Sabah başlangıcı','Dawn starts')],['day',tx('Gündüz başlangıcı','Day starts')],['dusk',tx('Akşam başlangıcı','Evening starts')],['night',tx('Gece başlangıcı','Night starts')]].map(([key,label])=>`<label for="farmHour_${key}">${label} (0–23)</label><input id="farmHour_${key}" type="number" min="0" max="23" step="1" value="${farmSettings[key]}">`).join('')+'<button type="button" class="primary" onclick="saveFarmSceneHours()">'+tx('Saatleri kaydet','Save hours')+'</button><label>'+tx('Görsel önizleme','Visual preview')+'</label><select id="farmPreviewSelect" onchange="setFarmScenePreview(this.value)">'+[['auto',tx('Otomatik · cihaz saati','Auto · device time')],['dawn',tx('Sabah','Dawn')],['day',tx('Gündüz','Day')],['dusk',tx('Akşam','Evening')],['night',tx('Gece','Night')]].map(([v,t])=>`<option value="${v}" ${v===farmScene.preview?'selected':''}>${t}</option>`).join('')+'</select>');renderLivePasture()}
function saveFarmSceneHours(){const s={};for(const k of ['dawn','day','dusk','night']){const raw=document.getElementById('farmHour_'+k)?.value;s[k]=raw===''?NaN:Number(raw)}if(!farmHoursValid(s))return toast(tx('Saatleri sabah < gündüz < akşam < gece sırasıyla 0–23 arasında gir','Enter hours 0–23 in order: dawn < day < evening < night'));try{localStorage.setItem('suru_farm_hours',JSON.stringify(s))}catch{return toast(tx('Saatler cihazda saklanamadı','Hours could not be stored'))}farmSettings=s;closeModal();renderLivePasture()}
function setFarmScenePreview(value){if(!['auto','dawn','day','dusk','night'].includes(value))return;farmScene.preview=value;closeModal();renderLivePasture()}
