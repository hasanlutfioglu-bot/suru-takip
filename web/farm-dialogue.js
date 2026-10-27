// Read-only character dialogue: due dates come from existing records and plans.
let farmTalk={scope:null,current:null,until:0,nextAt:0,seen:{},muted:false};
function farmTalkScope(){if(farmTalk.scope===activeStorageKey)return;farmTalk={scope:activeStorageKey,current:null,until:0,nextAt:Date.now()+4000,seen:{},muted:false};try{const saved=JSON.parse(localStorage.getItem('suru_farm_talk:'+activeStorageKey)||'{}');farmTalk.muted=saved.muted===true;if(saved.seen&&typeof saved.seen==='object')farmTalk.seen=saved.seen}catch{}}
function farmTalkSave(){try{const now=Date.now();farmTalk.seen=Object.fromEntries(Object.entries(farmTalk.seen).filter(([,t])=>Number.isFinite(t)&&t>now).slice(-100));localStorage.setItem('suru_farm_talk:'+activeStorageKey,JSON.stringify({muted:farmTalk.muted,seen:farmTalk.seen}))}catch{}}
function farmDialogueItems(){
 const active=db.animals.filter(isActiveAnimal),byId=new Map(active.map(a=>[a.id,a])),records=new Map(db.records.map(r=>[r.id,r])),out=[];
 for(const r of reminderItems()){
  if(!validDate(r.date)||r.date>today()||!['health','mating','ram_removal','target_weight'].includes(r.type))continue;
  const source=records.get(r.recordId),animalId=r.animalId||source?.animalId,animal=byId.get(animalId);
  if(['health','target_weight'].includes(r.type)&&!animal)continue;
  const vaccine=r.type==='health'&&/aşı|asi|vacci/i.test(String(source?.note||'').toLocaleLowerCase('tr-TR')),kind=vaccine?'vaccine':r.type,late=r.date<today();
  const messages={vaccine:tx('Aşı hatırlatmasının günü geldi. Kuzular seni bekliyor!','The vaccination reminder is due. Your flock is waiting!'),health:tx('Sağlık kontrolü için kaydettiğin tarih geldi. Bir göz atalım mı?','Your recorded health follow-up is due. Shall we check?'),mating:tx('Koç katım günü geldi. Koç hazır, sıra sende çiftçi!','Ram introduction is due. The ram is ready — your turn!'),ram_removal:tx('Koçun mesaisi doldu! Planlanan çıkarma zamanı geldi.','The ram’s shift is over! Its planned removal is due.'),target_weight:late?tx('Aklın nerede çiftçi? Tahmini hedef günü geçti; tartıyla kontrol edelim!','Where’s your mind, farmer? The estimated target date passed — let’s weigh!'):tx('Tahmini hedef günü geldi. Tartı hazır, kuzular seni bekliyor!','The estimated target date is here. The scales are ready!')};
  out.push({key:r.type+':'+(r.recordId||r.calendarId||r.animalId)+':'+r.date,kind,animalId,date:r.date,late,text:messages[kind],detail:r.type==='health'?animalName(animal)+' · '+(source.note||''):r.type==='target_weight'?animalName(animal):r.text,action:r.type==='health'?'health':r.type==='target_weight'?'weight':'calendar',priority:r.type==='health'?0:r.type==='ram_removal'?2:r.type==='mating'?3:4});
 }
 for(const a of active){
  if(a.status==='Takipte')out.push({key:'care:'+a.id+':'+today(),kind:'care',animalId:a.id,date:today(),text:tx('Bana bir bakar mısın? Takipteyim, ilgini bekliyorum.','Could you check on me? I’m under observation.'),detail:animalName(a),action:'animal',priority:1});
  if(isWeighDue(a)&&!out.some(x=>x.action==='weight'&&x.animalId===a.id)){
   const last=latestWeightInfo(a).latest,date=last?.date&&validDate(last.date)?addDaysISO(last.date,21):today(),late=date<today();
   out.push({key:'weigh:'+a.id+':'+date,kind:'weight',animalId:a.id,date,late,text:!last?tx('İlk tartımı kaydedelim; büyümesini birlikte izleyelim!','Let’s record the first weight and follow its growth!'):late?tx('Aklın nerede çiftçi? Tartım günü geçti, kantar seni bekliyor!','Where’s your mind, farmer? Weighing day passed — the scales await!'):tx('Tartım zamanı! Kantar hazır, kuzular sıraya!','Weighing time! Scales ready, lambs in line!'),detail:animalName(a),action:'weight',priority:4});
  }
 }
 return out.sort((a,b)=>a.priority-b.priority||a.date.localeCompare(b.date)||a.key.localeCompare(b.key));
}
function farmDialogueUpdate(phase){
 farmTalkScope();const now=Date.now(),allowed=farmCanPlay()&&phase!=='night'&&!farmScene.current&&!farmTalk.muted;
 if(!allowed){farmTalk.current=null;return}
 const items=farmDialogueItems();
 if(farmTalk.current){const fresh=items.find(x=>x.key===farmTalk.current.key);if(!fresh||now>=farmTalk.until){farmTalk.current=null;farmTalk.nextAt=Math.max(farmTalk.nextAt,now+45000)}else farmTalk.current=fresh;}
 if(!farmTalk.current&&now>=farmTalk.nextAt){const item=items.find(x=>!(Number(farmTalk.seen[x.key])>now));if(item){farmTalk.current=item;farmTalk.until=now+16000;farmTalk.nextAt=now+61000;farmTalk.seen[item.key]=now+30*60000;farmTalkSave()}}
}
function farmTalkDismiss(){farmTalk.current=null;farmTalk.nextAt=Date.now()+60000;renderLivePasture()}
function toggleFarmTalk(){farmTalkScope();farmTalk.muted=!farmTalk.muted;farmTalk.current=null;farmTalk.nextAt=Date.now()+1000;farmTalkSave();renderLivePasture()}
function openFarmDialogue(event){const key=event?.target?.closest('[data-farm-talk]')?.dataset.farmTalk||farmTalk.current?.key,item=farmDialogueItems().find(x=>x.key===key);if(!item)return;farmTalkDismiss();if(item.action==='weight')openAddForAnimal('weight',item.animalId);else if(item.action==='animal'||item.action==='health')animalCard(item.animalId);else openSub('calendar')}
function farmDialogueCard(){const item=farmTalk.current;if(!item)return '';return `<div class="farmSpeechCard" role="status" aria-live="polite"><button type="button" class="farmSpeechAction" data-farm-talk="${escHtml(item.key)}" onclick="openFarmDialogue(event)"><b>${item.kind==='care'?tx('Sürüden bir ses','A voice from the flock'):tx('Çiftçi diyor ki…','The farmer says…')}</b><span>${escHtml(item.text)}</span><small data-no-i18n>${escHtml(item.detail)} · ${escHtml(item.date)}</small><em>${tx('İlgili kaydı aç','Open related record')} ↗</em></button><button type="button" class="farmSpeechClose" onclick="farmTalkDismiss()" aria-label="${tx('Konuşmayı kapat','Dismiss dialogue')}">×</button></div>`}
function farmDialogueArt(model){
 const item=farmTalk.current;if(!item)return '';const target=item.kind==='care'?model.figures.find(f=>f.a.id===item.animalId):null;
 const x=target?Math.min(735,Math.max(110,target.x+22)):820,y=target?Math.max(170,target.y-34):429;
 const short=item.kind==='care'?tx('Bana bir bak!','Check on me!'):item.kind==='vaccine'?tx('Aşı zamanı!','Vaccination due!'):item.action==='weight'?tx('Tartım zamanı!','Weighing time!'):item.kind==='mating'?tx('Koç katım günü!','Ram introduction!'):item.kind==='ram_removal'?tx('Koçu çıkarma günü!','Ram removal!'):tx('Kontrol zamanı!','Check-up time!');
 return `<g class="farmDialogueActor" data-farm-talk="${escHtml(item.key)}" role="button" tabindex="0" aria-label="${escHtml(item.text)}" onclick="openFarmDialogue(event)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openFarmDialogue(event)}">${!target?'<g class="farmTalkFarmer">'+farmFarmerArt()+'</g>':''}<g class="farmSpeechBubble" transform="translate(${x} ${y})"><path d="M-91-30h182q10 0 10 10v24q0 10-10 10H5L-7 28l-2-14h-82q-10 0-10-10v-24q0-10 10-10Z" fill="#fff7df" stroke="#c6ac78" stroke-width="1.5"/><text x="0" y="-3" text-anchor="middle" font-size="13" font-weight="650" fill="#40523d">${short}</text></g></g>`;
}
