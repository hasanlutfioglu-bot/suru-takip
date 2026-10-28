// Optional local renderer. All state here is visual; database writes stay in the forms.
const farmPixiViews=new Map();let farmPixiTextures=null,farmPixiBackdrop=null;
let farmBright=true;try{farmBright=localStorage.getItem('suru_farm_bright')!=='0'}catch{}
function farmViewport(view){
 if(view.dataset.experienceScope!==activeStorageKey){view.dataset.experienceScope=activeStorageKey;delete view.dataset.followId;if(view.dataset.camera==='focus')view.dataset.camera='all'}
 const host=view.querySelector('.farmCanvasHost');let stage=host.querySelector('.farmStage');
 farmFocusPanel(view);const fresh=!stage;if(!stage){stage=document.createElement('div');stage.className='farmStage';while(host.firstChild)stage.append(host.firstChild);host.append(stage)}
 let tools=view.querySelector('.farmViewportTools');if(!tools){tools=document.createElement('div');tools.className='farmViewportTools';host.before(tools);for(const [key,tr,en] of [['all','Tümü','All'],['pasture','Mera','Pasture'],['nursery','Anne–kuzu','Ewes & lambs'],['feed','Besi','Finishing']]){const b=document.createElement('button');b.type='button';b.dataset.area=key;b.onclick=()=>{delete view.dataset.followId;view.dataset.camera=key;renderLivePasture();const width=host.querySelector('.farmStage').scrollWidth;host.scrollTo({left:key==='pasture'?0:key==='all'?0:width*.43,top:0,behavior:farmReduced()?'instant':'smooth'})};tools.append(b)}}
 const mobile=window.innerWidth<700,mode=view.dataset.camera||(mobile?'pasture':'all');stage.style.width=mode==='all'?'100%':Math.max(host.clientWidth*1.8,900)+'px';if(mode!=='focus'||fresh)stage.style.transform=mode==='all'?'none':'translateY(-'+Math.min((mode==='feed'?290:140)*stage.clientWidth/1000,Math.max(0,stage.clientWidth*.62-(mobile?380:390)))+'px)';
 host.classList.toggle('farmCloseView',mode!=='all');host.classList.toggle('farmFollowView',mode==='focus');if(fresh||view.dataset.lastCamera!==mode){host.scrollLeft=mode==='feed'||mode==='nursery'?stage.clientWidth*.43:0;host.scrollTop=0;view.dataset.lastCamera=mode}for(const b of tools.querySelectorAll('[data-area]')){const labels={all:tx('Tümü','All'),pasture:tx('Mera','Pasture'),nursery:tx('Anne–kuzu','Ewes & lambs'),feed:tx('Besi','Finishing')};b.textContent=labels[b.dataset.area];b.setAttribute('aria-pressed',String(b.dataset.area===mode))}
 let light=tools.querySelector('.farmLightToggle');if(!light){light=document.createElement('button');light.type='button';light.className='farmLightToggle';light.onclick=()=>{farmBright=!farmBright;try{localStorage.setItem('suru_farm_bright',farmBright?'1':'0')}catch{}renderLivePasture()};tools.append(light)}view.dataset.bright=String(farmBright);light.textContent=farmBright?tx('☀ Aydınlık açık','☀ Bright view on'):tx('☀ Aydınlat','☀ Brighten');light.setAttribute('aria-pressed',String(farmBright));
 let hint=tools.querySelector('small');if(!hint){hint=document.createElement('small');tools.append(hint)}hint.textContent=tx('Diğer alanları görmek için sağa–sola kaydırabilirsin.','Swipe sideways to see the other areas.');hint.hidden=mode==='all'||mode==='focus';
 host.setAttribute('aria-label',tx('Çiftlik görünümü; diğer alanlar için yatay kaydırın veya alan düğmelerini kullanın','Farm view; swipe horizontally or use the area buttons'));
 farmExperienceControls(view);if(mode==='focus'&&(typeof PIXI==='undefined'||farmPixiViews.get(view)?.failed))farmCameraFrame({view,units:farmProjection().figures.map(f=>({f,root:{x:f.x,y:f.y}}))});return stage;
}
async function farmPixiArtwork(){
 if(farmPixiTextures)return farmPixiTextures;
 farmPixiTextures=(async()=>{
  const result={};
  for(const type of ['ewe','ram','lamb','unknown']){
   const doc=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+farmAnimalArt(type,0)+'</svg>','image/svg+xml'),bob=doc.querySelector('.pastureBob'),head=bob.querySelector('.pastureHead'),rest=doc.querySelector('.farmResting');
   const definitions=doc.querySelector('defs')?.outerHTML||'',ears=head.querySelector('.farmEars'),tail=bob.querySelector('.farmTail'),earsMarkup=ears?.outerHTML||'',tailMarkup=tail?.outerHTML||'';ears?.remove();tail?.remove();const headMarkup=head.outerHTML;head.remove();bob.children[0].remove();bob.children[0].remove();
   result[type]={};
   for(const [part,markup] of Object.entries({body:bob.innerHTML,head:headMarkup,rest:rest.innerHTML,ears:earsMarkup,tail:tailMarkup})){
    const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" style="color-scheme:only light" width="384" height="320" viewBox="-12 -28 96 80">'+definitions+markup+'</svg>');await image.decode();result[type][part]=PIXI.Texture.from(image);
   }
  }
  return result;
 })();return farmPixiTextures;
}
function farmPixiRig(f,textures,view){
 const root=new PIXI.Container(),face=new PIXI.Container(),body=new PIXI.Container(),legs=[];
 const shadow=new PIXI.Graphics().ellipse(27,34,32,9).fill({color:0x263c30,alpha:.04}).ellipse(27,34,27,6).fill({color:0x263c30,alpha:.07}).ellipse(27,34,22,4).fill({color:0x263c30,alpha:.08});const selection=new PIXI.Graphics().ellipse(27,35,34,10).stroke({color:0xf4d477,width:2.5,alpha:.95});selection.visible=false;root.addChild(shadow,selection,face);face.pivot.x=27;face.x=27;face.addChild(body);
 for(let i=0;i<4;i++){const leg=new PIXI.Graphics().moveTo(0,0).lineTo(1.5,7).lineTo(-1,14).stroke({color:i<2?0xb49e80:0x967f65,width:4,cap:'round'}).roundRect(-3,12,5,4,1.5).fill(0x6e5b49);leg.position.set([12,34,7,37][i],18);body.addChild(leg);legs.push(leg)}
 const sprite=part=>{const s=new PIXI.Sprite(textures[f.type][part]);s.position.set(-12,-28);s.width=96;s.height=80;return s};
 const wool=sprite('body'),headPivot=new PIXI.Container(),head=sprite('head'),rest=sprite('rest');headPivot.pivot.set(43,3);headPivot.position.set(43,3);headPivot.addChild(head);const ears=new PIXI.Container(),tail=new PIXI.Container(),blink=new PIXI.Graphics().ellipse(54,7,4,5).fill(0xdbc2a0).moveTo(50,8).lineTo(58,8).stroke({color:0x92745b,width:.7});ears.pivot.set(43,1);ears.position.set(43,1);ears.addChild(sprite('ears'));tail.pivot.set(0,6);tail.position.set(0,6);tail.addChild(sprite('tail'));headPivot.addChildAt(ears,0);headPivot.addChild(blink);blink.visible=false;body.addChildAt(tail,0);body.addChild(wool,headPivot);face.addChild(rest);rest.visible=false;
 root.eventMode='static';root.cursor='pointer';root.hitArea=new PIXI.Rectangle(-12,-28,96,80);root.on('pointertap',()=>farmInspectAnimal(f.a.id,view));
 root.scale.set(f.scale);const months=farmVisualAgeMonths(f.a);return {root,face,body,headPivot,rest,legs,ears,tail,blink,shadow,selection,young:f.type==='lamb'&&months!==null&&months<6,f,seed:farmHash(f.family||f.a.id)%1000,direction:1,x:f.x,y:f.y};
}
function farmPixiStep(state,dt){
 state.time+=dt;const night=state.phase==='night',event=farmScene.current;
 for(const unit of state.units){
  const f=unit.f,r=f.roam||{dx:0,dy:0,duration:36,delay:0},phase=(state.time+unit.seed%31)/(r.duration||36)%1,walk=phase<.32||phase>.65&&phase<.88;
  const ease=t=>t*t*(3-2*t),progress=phase<.32?ease(phase/.32):phase<.65?1:phase<.88?1-ease((phase-.65)/.23):0;
  const working=event?.ids.includes(f.a.id)||event?.ids.includes(f.mother)||farmTalk.current?.animalId===f.a.id||!!f.mother&&farmTalk.current?.animalId===f.mother,transfer=working&&['weight','weaning','finishing'].includes(event?.kind);
  let x=f.x+(night||working?0:r.dx*progress),y=f.y+(night||working?0:r.dy*progress);
  if(event?.kind==='feeding'&&working){const slot=state.units.filter(u=>event.ids.includes(u.f.a.id)||event.ids.includes(u.f.mother)).indexOf(unit),targetX=470+slot%7*35,targetY=327+Math.floor(slot/7)*10,p=event.stage===1?1:event.stage===0?Math.min(1,(Date.now()-farmScene.started)/3000):Math.max(0,1-(Date.now()-farmScene.started)/3000);x=f.x+(targetX-f.x)*p;y=f.y+(targetY-f.y)*p}
  unit.root.visible=!transfer;unit.root.position.set(x,y);unit.x=x;unit.y=y;unit.root.zIndex=y;
  const moving=walk&&!night&&!working&&dt>0,desired=(phase<.5?1:-1)*(r.dx<0?-1:1);unit.direction=desired;unit.face.scale.x=desired;unit.face.rotation=moving?Math.sin(state.time*7+unit.seed)*.012:0;
  unit.body.visible=!night;unit.rest.visible=night;const stride=state.time*7+unit.seed;
  unit.body.y=moving?Math.sin(stride*2)*1.1:Math.sin(state.time*1.8+unit.seed)*.35;
  unit.legs.forEach((leg,i)=>leg.rotation=moving?Math.sin(stride+(i===0||i===3?0:Math.PI))*.36:0);
  unit.headPivot.rotation=!moving&&!night?(.28+Math.sin(state.time*1.6+unit.seed)*.22):Math.sin(stride)*.025;
  const quiet=f.a.status==='Takipte',play=unit.young&&moving&&!quiet&&phase>.04&&phase<.2,hop=play?Math.max(0,Math.sin(state.time*9+unit.seed))*5:0;unit.face.y=-hop;unit.shadow.alpha=hop?Math.max(.45,1-hop*.08):1;unit.tail.rotation=!night&&!quiet?Math.sin(state.time*5+unit.seed)*((state.time+unit.seed)%8<1.5?.25:.04):0;unit.ears.rotation=!night&&((state.time+unit.seed)%7<1)?Math.sin(state.time*14)*.12:0;unit.blink.visible=!night&&(state.time+unit.seed)%6<.14;const watch=!moving&&(Math.floor(state.time/5+unit.seed)%3===1);if(watch)unit.headPivot.rotation=-.06+Math.sin(state.time*.8)*.04;if(quiet){unit.body.y*=.3;unit.headPivot.rotation*=.4}unit.behaviour=night?'sleep':play?'play':moving?'walk':watch?'watch':'graze';
  unit.root.tint=0xffffff;unit.selection.visible=farmScene.highlight===f.a.id;
 }
 // Resolve visible footprints as families, then ease corrections to avoid sudden jumps.
 if(!night&&!event){
  const families=new Map();for(const u of state.units){const key=u.f.zone+':'+u.f.family;if(!families.has(key))families.set(key,[]);families.get(key).push(u)}
  const groups=[...families.values()].map((units,index)=>{const g={units,index,zone:units[0].f.zone,ox:units[0].avoidX||0,oy:units[0].avoidY||0,l:-Infinity,r:Infinity,t:-Infinity,b:Infinity};let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const u of units){minX=Math.min(minX,u.x-6*u.f.scale);maxX=Math.max(maxX,u.x+65*u.f.scale);minY=Math.min(minY,u.y-19*u.f.scale);maxY=Math.max(maxY,u.y+32*u.f.scale);const b=u.f.roam.bounds;g.l=Math.max(g.l,b[0]-u.x);g.r=Math.min(g.r,b[1]-u.x);g.t=Math.max(g.t,b[2]-u.y);g.b=Math.min(g.b,b[3]-u.y)}g.cx=(minX+maxX)/2;g.cy=(minY+maxY)/2;g.rx=(maxX-minX)/2+1;g.ry=(maxY-minY)/2+1;return g});
  const cell=Math.max(8,...groups.map(g=>Math.max(g.rx,g.ry)*2)),move=(g,x,y)=>{g.ox=Math.max(g.l,Math.min(g.r,g.ox+x));g.oy=Math.max(g.t,Math.min(g.b,g.oy+y))};
  for(let pass=0;pass<4;pass++){const grid=new Map();for(const g of groups){const key=Math.floor((g.cx+g.ox)/cell)+','+Math.floor((g.cy+g.oy)/cell);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(g)}
   for(const g of groups){const cx=Math.floor((g.cx+g.ox)/cell),cy=Math.floor((g.cy+g.oy)/cell);for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(const other of grid.get((cx+i)+','+(cy+j))||[]){if(other.index<=g.index||other.zone!==g.zone)continue;const dx=g.cx+g.ox-other.cx-other.ox,dy=g.cy+g.oy-other.cy-other.oy,px=g.rx+other.rx-Math.abs(dx),py=g.ry+other.ry-Math.abs(dy);if(px<=0||py<=0)continue;if(px<py){const push=(dx<0?-1:1)*px*.55;move(g,push,0);move(other,-push,0)}else{const push=(dy<0?-1:1)*py*.55;move(g,0,push);move(other,0,-push)}}}
  }
  for(const g of groups){const first=g.units[0],blend=first.hasAvoid?(dt?Math.min(1,dt*9):0):1,x=Math.max(g.l,Math.min(g.r,(first.avoidX||0)+(g.ox-(first.avoidX||0))*blend)),y=Math.max(g.t,Math.min(g.b,(first.avoidY||0)+(g.oy-(first.avoidY||0))*blend));for(const u of g.units){u.avoidX=x;u.avoidY=y;u.hasAvoid=true;u.root.position.set(u.x+x,u.y+y);u.root.zIndex=u.y+y}}
 }
 farmEnvironmentStep(state);state.cameraElapsed=(state.cameraElapsed||0)+dt;if(dt===0||state.cameraElapsed>.08){state.cameraElapsed=0;farmCameraFrame(state)}state.world.sortChildren();
}
function farmPixiFallback(state){
 if(state.disposed)return;state.failed=true;state.app?.ticker?.stop();state.view.classList.remove('farmPixiReady');state.view.querySelectorAll('[data-farm-animal]').forEach(el=>{el.removeAttribute('aria-hidden');el.setAttribute('tabindex','0')});state.app?.canvas?.remove();
}
async function farmPixiSync(view,model,phase){
 if(typeof PIXI==='undefined'||typeof ResizeObserver==='undefined')return;
 if(view.dataset.farmView==='expanded'&&!document.getElementById('modal')?.classList.contains('show')){const old=farmPixiViews.get(view);if(old){old.disposed=true;old.observer?.disconnect();old.app?.renderer&&old.app.destroy(true,{children:true,texture:false});farmPixiViews.delete(view);view.classList.remove('farmPixiReady')}return}
 for(const [el,old] of farmPixiViews)if(!el.isConnected){old.disposed=true;old.observer?.disconnect();old.app?.renderer&&old.app.destroy(true,{children:true,texture:false});farmPixiViews.delete(el)}
 let state=farmPixiViews.get(view);if(state?.failed)return;
 if(!state){
  state={view,model,phase,time:0,units:[],loading:true};farmPixiViews.set(view,state);
  try{
   const app=state.app=new PIXI.Application();await app.init({width:1000,height:620,backgroundAlpha:0,antialias:true,autoStart:false,preference:'webgl',resolution:Math.min(devicePixelRatio||1,farmQualityModes[farmQuality].resolution),autoDensity:true});
   if(state.disposed||!view.isConnected){app.destroy(true);farmPixiViews.delete(view);return}
   state.textures=await farmPixiArtwork();farmPixiBackdrop||=PIXI.Assets.load('assets/farm/anime-countryside-v1.webp');const backdrop=await farmPixiBackdrop;if(state.disposed)return;
   state.world=new PIXI.Container();state.world.sortableChildren=true;state.background=new PIXI.Sprite(backdrop);state.background.width=1000;state.background.height=620;state.background.zIndex=-1000;state.world.addChild(state.background);state.environment=farmEnvironmentCreate();state.world.addChild(state.environment.root);app.stage.addChild(state.world);app.ticker.maxFPS=30;app.ticker.add(t=>farmPixiStep(state,Math.min(t.deltaMS/1000,.05)));
   app.renderer.events.autoPreventDefault=false;app.canvas.style.touchAction='auto';app.canvas.className='farmPixiCanvas';app.canvas.setAttribute('aria-hidden','true');app.canvas.addEventListener('webglcontextlost',()=>farmPixiFallback(state));
   state.resize=()=>{if(state.failed||state.disposed)return;const width=state.view.querySelector('.farmStage')?.clientWidth||1000;app.renderer.resize(width,width*.62);state.world.scale.set(width/1000);app.render()};state.observer=new ResizeObserver(state.resize);state.loading=false;
   farmPixiSync(view,state.model,state.phase);
  }catch(error){farmPixiFallback(state);console.warn('Çiftlik görünümü yedek çizimle devam ediyor.',error.message)}return;
 }
 state.model=model;state.phase=phase;if(state.loading)return;
 const key=JSON.stringify(model.figures.map(f=>[f.a.id,f.x,f.y,f.scale,f.type,f.mother,f.zone,f.a.status]));
 if(state.key!==key){state.key=key;for(const u of state.units)u.root.destroy({children:true,texture:false});state.units=model.figures.map(f=>farmPixiRig(f,state.textures,view));if(state.units.length)state.world.addChild(...state.units.map(u=>u.root))}
 const host=view.querySelector('.farmCanvasHost'),stage=farmViewport(view);if(!stage.contains(state.app.canvas))stage.prepend(state.app.canvas);view.classList.add('farmPixiReady');state.observer.disconnect();state.observer.observe(stage);farmApplyQuality(state);state.background.tint=farmBright?0xffffff:phase==='night'?0xcbd7eb:phase==='dusk'?0xffeddf:phase==='dawn'?0xfff6e9:0xffffff;state.resize();
 // Native record buttons remain available to keyboard and assistive technology.
 for(const el of host.querySelectorAll('[data-farm-animal]')){el.setAttribute('aria-hidden','true');el.setAttribute('tabindex','-1')}
 let list=view.querySelector('.farmAccessibleAnimals');if(!list){list=document.createElement('details');list.className='farmAccessibleAnimals';host.after(list)}
 const listKey=model.figures.map(f=>f.a.id+':'+f.a.tag).join('|')+appLanguage;if(list.dataset.key!==listKey){list.dataset.key=listKey;list.innerHTML='<summary>'+tx('Hayvan kayıtlarını aç','Open animal records')+'</summary>';for(const f of model.figures){const b=document.createElement('button');b.type='button';b.textContent=f.a.tag||f.a.id;b.onclick=()=>farmInspectAnimal(f.a.id,view);list.append(b)}}
 const sleeping=phase==='night',running=farmCanPlay()&&!view.classList.contains('pasturePaused')&&!sleeping;state.app.ticker[running?'start':'stop']();farmPixiStep(state,0);state.app.render();
}
if(typeof window!=='undefined')window.addEventListener('DOMContentLoaded',()=>{if(typeof renderLivePasture==='function')renderLivePasture()});
