// Presentation only: quality, camera and opt-in local synthesized ambience.
const farmQualityModes={battery:{fps:20,resolution:1,detail:0,zoom:1.8},balanced:{fps:30,resolution:1.5,detail:1,zoom:2.15},high:{fps:45,resolution:2,detail:2,zoom:2.6}};
let farmQuality='balanced',farmVolume=20;
try{const q=localStorage.getItem('suru_farm_quality');if(farmQualityModes[q])farmQuality=q;const v=localStorage.getItem('suru_farm_volume');if(v!==null&&Number.isFinite(Number(v)))farmVolume=Math.max(0,Math.min(100,Number(v)))}catch{}
const farmAudio={enabled:false,context:null,master:null,timer:null,voices:new Set(),serial:0};
function farmReplaceArt(host,markup){
 const stage=host.querySelector('.farmStage');if(!stage){host.innerHTML=markup;return}
 // Keep the camera surface and canvas alive while labels/events are refreshed.
 const holder=document.createElement('div');holder.innerHTML=markup;const next=holder.querySelector('.pastureScene'),old=stage.querySelector('.pastureScene');if(next){if(old)old.replaceWith(next);else stage.append(next)}
}
function setFarmQuality(value){if(!farmQualityModes[value])return;farmQuality=value;try{localStorage.setItem('suru_farm_quality',value)}catch{}renderLivePasture()}
function setFarmVolume(value){const n=Number(value);if(!Number.isFinite(n))return;farmVolume=Math.max(0,Math.min(100,n));try{localStorage.setItem('suru_farm_volume',String(farmVolume))}catch{}if(farmAudio.master)farmAudio.master.gain.setTargetAtTime(farmVolume/100*.35,farmAudio.context.currentTime,.08);farmAudioSync()}
function farmAudioStop(){if(farmAudio.timer!==null){clearTimeout(farmAudio.timer);farmAudio.timer=null}for(const voice of farmAudio.voices){try{voice.stop()}catch{}}farmAudio.voices.clear();if(farmAudio.context?.state==='running')farmAudio.context.suspend().catch(()=>{})}
async function toggleFarmAudio(){
 if(farmAudio.enabled){farmAudio.enabled=false;farmAudio.serial++;farmAudioStop();renderLivePasture();return}
 const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return toast(tx('Bu tarayıcı çiftlik seslerini desteklemiyor.','This browser does not support farm sounds.'));
 const serial=++farmAudio.serial;
 try{if(!farmAudio.context){farmAudio.context=new Audio();farmAudio.master=farmAudio.context.createGain();farmAudio.master.gain.value=farmVolume/100*.35;farmAudio.master.connect(farmAudio.context.destination)}await farmAudio.context.resume();if(serial!==farmAudio.serial)return;farmAudio.enabled=true;renderLivePasture();if(farmAudioAllowed())farmAudioPulse()}catch{farmAudio.enabled=false;farmAudioStop();toast(tx('Ses açılamadı. Yeniden Sesleri aç düğmesine dokunabilirsin.','Sound could not start. You can try Enable sounds again.'));renderLivePasture()}
}
function farmAudioTone(frequency,end,duration,type='sine',strength=.3,delay=0){
 const ctx=farmAudio.context;if(!ctx||ctx.state!=='running')return;const oscillator=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+delay;oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,at);oscillator.frequency.exponentialRampToValueAtTime(Math.max(20,end),at+duration);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(strength,at+Math.min(.07,duration/4));gain.gain.exponentialRampToValueAtTime(.0001,at+duration);oscillator.connect(gain);gain.connect(farmAudio.master);farmAudio.voices.add(oscillator);oscillator.onended=()=>{farmAudio.voices.delete(oscillator);oscillator.disconnect();gain.disconnect()};oscillator.start(at);oscillator.stop(at+duration+.02);
}
function farmAudioPulse(){
 if(!farmAudio.enabled||!farmCanPlay()||farmVolume===0)return;const view=document.querySelector('.farmExpanded.farmPixiReady')&&document.getElementById('modal')?.classList.contains('show')?document.querySelector('.farmExpanded'):document.getElementById('livePasture'),night=view?.dataset.phase==='night',tractor=view?.querySelector('.farmTractorPass');
 const road=tractor&&!night&&!farmScene.current&&!farmTalk.current&&typeof DOMMatrix!=='undefined'?new DOMMatrix(getComputedStyle(tractor).transform).m41:-300;
 if(road>-80&&road<1000){for(const frequency of [42,84,126])farmAudioTone(frequency,frequency*.95,2.4,'triangle',.12);return}
 if(night)return;
 if(Math.random()<.72){farmAudioTone(1700,2900,.17,'sine',.3);farmAudioTone(2400,1800,.2,'sine',.2,.24);farmAudioTone(1900,2600,.15,'sine',.16,.5)}
 else if(db.animals.some(isActiveAnimal)){farmAudioTone(360,270,.65,'triangle',.28);farmAudioTone(720,540,.6,'sine',.1,.06)}
}
function farmAudioAllowed(){const phase=farmScene.preview==='auto'?farmPhaseAt(new Date().getHours()):farmScene.preview;return farmAudio.enabled&&farmCanPlay()&&farmVolume>0&&phase!=='night'}
function farmAudioSync(){
 const active=farmAudioAllowed();
 if(!active){farmAudioStop();return}
 const ctx=farmAudio.context;if(!ctx)return;
 if(ctx.state==='suspended')ctx.resume().then(()=>{if(!farmAudioAllowed())farmAudioStop()}).catch(()=>{farmAudio.enabled=false;farmAudioStop()});
 if(farmAudio.timer===null)farmAudio.timer=setTimeout(()=>{farmAudio.timer=null;farmAudioPulse();farmAudioSync()},6000+Math.random()*5000);
}
function farmExperienceControls(view){
 view.dataset.quality=farmQuality;let controls=view.querySelector('.farmExperienceControls');
 if(!controls){controls=document.createElement('div');controls.className='farmExperienceControls';const label=document.createElement('label'),name=document.createElement('span'),select=document.createElement('select');name.className='farmQualityLabel';select.className='farmQualitySelect';select.onchange=()=>setFarmQuality(select.value);label.append(name,select);controls.append(label);for(const value of Object.keys(farmQualityModes)){const option=document.createElement('option');option.value=value;select.append(option)}const audio=document.createElement('button');audio.type='button';audio.className='farmAudioToggle';audio.onclick=toggleFarmAudio;controls.append(audio);const volumeLabel=document.createElement('label');volumeLabel.className='farmVolumeLabel';const volumeName=document.createElement('span'),volume=document.createElement('input');volumeName.className='farmVolumeName';volume.type='range';volume.min='0';volume.max='100';volume.step='5';volume.className='farmVolume';volume.oninput=()=>setFarmVolume(volume.value);volumeLabel.append(volumeName,volume);controls.append(volumeLabel);view.querySelector('.farmViewportTools').after(controls)}
 controls.querySelector('.farmQualityLabel').textContent=tx('Görüntü kalitesi','Visual quality');const select=controls.querySelector('select'),labels={battery:tx('Pil tasarrufu','Battery saver'),balanced:tx('Dengeli','Balanced'),high:tx('Yüksek kalite','High quality')};for(const option of select.options)if(option.textContent!==labels[option.value])option.textContent=labels[option.value];if(select.value!==farmQuality)select.value=farmQuality;select.setAttribute('aria-label',tx('Çiftlik görüntü kalitesi','Farm visual quality'));const audio=controls.querySelector('.farmAudioToggle');audio.textContent=farmAudio.enabled?tx('Sesleri kapat','Disable sounds'):tx('Sesleri aç','Enable sounds');audio.setAttribute('aria-pressed',String(farmAudio.enabled));audio.title=tx('Gece ve duraklatıldığında sesler susar.','Sounds are silent at night and while paused.');controls.querySelector('.farmVolumeName').textContent=tx('Ses düzeyi','Volume');const volume=controls.querySelector('.farmVolume');volume.value=String(farmVolume);volume.disabled=!farmAudio.enabled;volume.setAttribute('aria-label',tx('Çiftlik ses düzeyi','Farm sound volume'));farmAudioSync();
}
function farmApplyQuality(state){const config=farmQualityModes[farmQuality],base=Math.min(window.devicePixelRatio||1,config.resolution),zoom=state.view.dataset.camera==='focus'?Math.max(1,state.cameraZoom||1):1,resolution=Math.min(farmQuality==='battery'?1:farmQuality==='high'?3:2,base*zoom);state.app.ticker.maxFPS=config.fps;if(state.app.renderer.resolution!==resolution){state.app.renderer.resolution=resolution;state.resize?.()}state.quality=farmQuality;if(state.environment)state.environment.root.visible=config.detail>0;}
function farmInspectAnimal(id,view){
 if(!db.animals.some(a=>a.id===id&&isActiveAnimal(a)))return;
 view||=document.getElementById('modal')?.classList.contains('show')?document.querySelector('.farmExpanded'):document.getElementById('livePasture');if(!view)return;farmScene.highlight=id;view.dataset.followId=id;view.dataset.camera='focus';renderLivePasture();
}
function farmFocusPanel(view){
 const id=view.dataset.followId,animal=db.animals.find(a=>a.id===id&&isActiveAnimal(a));let panel=view.querySelector('.farmFocusPanel');
 if(!animal||view.dataset.camera!=='focus'){panel?.remove();if(!animal){delete view.dataset.followId;if(view.dataset.camera==='focus')view.dataset.camera='all'}return}
 if(!panel){panel=document.createElement('div');panel.className='farmFocusPanel';panel.setAttribute('aria-live','polite');const text=document.createElement('span');text.className='farmFocusName';const record=document.createElement('button');record.type='button';record.className='farmFocusRecord';record.onclick=()=>{const a=db.animals.find(a=>a.id===view.dataset.followId&&isActiveAnimal(a));if(a){animalCard(a.id);renderLivePasture()}};const back=document.createElement('button');back.type='button';back.className='farmFocusBack';back.onclick=()=>{delete view.dataset.followId;view.dataset.camera='all';renderLivePasture()};panel.append(text,record,back);view.querySelector('.farmCanvasHost').after(panel)}
 const name=tx('Yakından izleniyor: ','Following: ')+(animal.tag||animal.id);if(panel.querySelector('.farmFocusName').textContent!==name)panel.querySelector('.farmFocusName').textContent=name;panel.querySelector('.farmFocusRecord').textContent=tx('Kartı aç','Open card');panel.querySelector('.farmFocusBack').textContent=tx('Uzaklaş','Zoom out');
}
function farmCameraFrame(state){
 const {view}=state;if(view.dataset.camera!=='focus')return;const target=state.units.find(u=>u.f.a.id===view.dataset.followId);if(!target)return;const family=state.units.filter(u=>u.f.family===target.f.family&&u.f.zone===target.f.zone),host=view.querySelector('.farmCanvasHost'),stage=host?.querySelector('.farmStage');if(!stage||!host.clientWidth)return;
 let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;for(const u of family){left=Math.min(left,u.root.x-12*u.f.scale);right=Math.max(right,u.root.x+84*u.f.scale);top=Math.min(top,u.root.y-28*u.f.scale);bottom=Math.max(bottom,u.root.y+52*u.f.scale)}
 const base=stage.clientWidth/1000,zoom=Math.min(farmQualityModes[farmQuality].zoom,host.clientWidth/((right-left+38)*base),host.clientHeight/((bottom-top+35)*base)),x=host.clientWidth/2-(left+right)/2*base*zoom,y=host.clientHeight/2-(top+bottom)/2*base*zoom;
 stage.style.transform='translate3d('+x.toFixed(2)+'px,'+y.toFixed(2)+'px,0) scale('+zoom.toFixed(4)+')';host.scrollLeft=0;host.scrollTop=0;state.cameraTargets=family.map(u=>u.f.a.id);state.cameraZoom=zoom;if(state.app)farmApplyQuality(state);
}
function farmEnvironmentCreate(){
 const root=new PIXI.Container(),leaves=[],water=[],birds=[],grass=[];root.zIndex=-900;
 for(let i=0;i<7;i++){const leaf=new PIXI.Graphics();for(let j=0;j<4;j++)leaf.ellipse(j*8-12,Math.sin(j)*7,11,5).fill({color:j%2?0x94aa5c:0x698e4c,alpha:.55});leaf.position.set(i<4?28+i*28:880+(i-4)*38,58+(i%3)*18);leaf.pivot.set(0,12);root.addChild(leaf);leaves.push(leaf)}
 for(let i=0;i<3;i++){const ripple=new PIXI.Graphics().ellipse(0,0,10+i*3,1.5+i*.25).stroke({color:0xe5f7e5,width:1,alpha:.6});ripple.position.set(728,342);root.addChild(ripple);water.push(ripple)}
 for(let i=0;i<4;i++){const bird=new PIXI.Graphics().moveTo(-8,0).quadraticCurveTo(-4,-5,0,0).quadraticCurveTo(4,-5,8,0).stroke({color:0x526b62,width:1.4,alpha:.7});root.addChild(bird);birds.push(bird)}
 for(let i=0;i<12;i++){const tuft=new PIXI.Graphics().moveTo(-5,0).quadraticCurveTo(-5,-6,-8,-9).moveTo(0,0).quadraticCurveTo(1,-8,0,-13).moveTo(4,0).quadraticCurveTo(5,-5,9,-8).stroke({color:i%2?0x91a34c:0x6b8a44,width:1.4,alpha:.65});tuft.position.set(48+(i*79)%710,465+(i%3)*8);root.addChild(tuft);grass.push(tuft)}
 return {root,leaves,water,birds,grass};
}
function farmEnvironmentStep(state){
 const env=state.environment;if(!env)return;const quality=farmQualityModes[farmQuality].detail,t=state.time,night=state.phase==='night';env.root.visible=quality>0;if(!quality)return;
 env.leaves.forEach((leaf,i)=>{leaf.visible=quality>0;leaf.rotation=Math.sin(t*.6+i)*.05});env.grass.forEach((g,i)=>{g.visible=quality>0;g.rotation=Math.sin(t*.9+i)*.08});
 env.water.forEach((r,i)=>{r.visible=quality>0;const p=(t*.35+i/3)%1;r.scale.set(.6+p*.6);r.alpha=(1-p)*.6});env.birds.forEach((b,i)=>{b.visible=quality>0&&!night&&(quality===2||i<2);b.position.set(((t*(16+i*2)+i*240)%1200)-100,48+i*9+Math.sin(t*.4+i)*6);b.scale.y=.4+Math.abs(Math.sin(t*4+i))*.6});
}
if(typeof window!=='undefined')window.addEventListener('pagehide',()=>{farmAudioStop()});
