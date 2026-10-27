// Optional local renderer. All state here is visual; database writes stay in the forms.
const farmPixiViews=new Map();let farmPixiTextures=null,farmPixiBackdrop=null;
function farmViewport(view){
 const host=view.querySelector('.farmCanvasHost');let stage=host.querySelector('.farmStage');
 if(!stage){stage=document.createElement('div');stage.className='farmStage';while(host.firstChild)stage.append(host.firstChild);host.append(stage)}
 let tools=view.querySelector('.farmViewportTools');if(!tools){tools=document.createElement('div');tools.className='farmViewportTools';host.before(tools);for(const [key,tr,en] of [['all','Tümü','All'],['pasture','Mera','Pasture'],['nursery','Anne–kuzu','Ewes & lambs'],['feed','Besi','Finishing']]){const b=document.createElement('button');b.type='button';b.dataset.area=key;b.onclick=()=>{view.dataset.camera=key;renderLivePasture();const width=host.querySelector('.farmStage').scrollWidth;host.scrollTo({left:key==='pasture'?0:key==='all'?0:width*.43,top:key==='feed'?width*.21:0,behavior:farmReduced()?'instant':'smooth'})};tools.append(b)}}
 const mobile=window.innerWidth<700,mode=view.dataset.camera||(mobile?'pasture':'all');stage.style.width=mode==='all'?'100%':Math.max(host.clientWidth,700)+'px';
 host.classList.toggle('farmCloseView',mode!=='all');for(const b of tools.querySelectorAll('button')){const labels={all:tx('Tümü','All'),pasture:tx('Mera','Pasture'),nursery:tx('Anne–kuzu','Ewes & lambs'),feed:tx('Besi','Finishing')};b.textContent=labels[b.dataset.area];b.setAttribute('aria-pressed',String(b.dataset.area===mode))}
 let hint=tools.querySelector('small');if(!hint){hint=document.createElement('small');tools.append(hint)}hint.textContent=tx('Diğer alanları görmek için sağa–sola kaydırabilirsin.','Swipe sideways to see the other areas.');hint.hidden=mode==='all';
 host.setAttribute('aria-label',tx('Çiftlik görünümü; diğer alanlar için yatay kaydırın veya alan düğmelerini kullanın','Farm view; swipe horizontally or use the area buttons'));
 return stage;
}
async function farmPixiArtwork(){
 if(farmPixiTextures)return farmPixiTextures;
 farmPixiTextures=(async()=>{
  const result={};
  for(const type of ['ewe','ram','lamb','unknown']){
   const doc=new DOMParser().parseFromString('<svg xmlns="http://www.w3.org/2000/svg">'+farmAnimalArt(type,0)+'</svg>','image/svg+xml'),bob=doc.querySelector('.pastureBob'),head=bob.querySelector('.pastureHead'),rest=doc.querySelector('.farmResting');
   const headMarkup=head.outerHTML;head.remove();bob.children[0].remove();bob.children[0].remove();
   result[type]={};
   for(const [part,markup] of Object.entries({body:bob.innerHTML,head:headMarkup,rest:rest.innerHTML})){
    const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="192" height="160" viewBox="-12 -28 96 80">'+markup+'</svg>');await image.decode();result[type][part]=PIXI.Texture.from(image);
   }
  }
  return result;
 })();return farmPixiTextures;
}
function farmPixiRig(f,textures){
 const root=new PIXI.Container(),face=new PIXI.Container(),body=new PIXI.Container(),legs=[];
 const shadow=new PIXI.Graphics().ellipse(27,34,29,7).fill({color:0x263c30,alpha:.18});root.addChild(shadow,face);face.pivot.x=27;face.x=27;face.addChild(body);
 for(let i=0;i<4;i++){const leg=new PIXI.Graphics().moveTo(0,0).lineTo(0,14).stroke({color:i<2?0x7c806c:0x48584b,width:4.5,cap:'round'});leg.position.set([12,34,7,37][i],18);body.addChild(leg);legs.push(leg)}
 const sprite=part=>{const s=new PIXI.Sprite(textures[f.type][part]);s.position.set(-12,-28);s.width=96;s.height=80;return s};
 const wool=sprite('body'),headPivot=new PIXI.Container(),head=sprite('head'),rest=sprite('rest');headPivot.pivot.set(43,3);headPivot.position.set(43,3);headPivot.addChild(head);body.addChild(wool,headPivot);face.addChild(rest);rest.visible=false;
 root.eventMode='static';root.cursor='pointer';root.hitArea=new PIXI.Rectangle(-12,-28,96,80);root.on('pointertap',()=>{if(db.animals.some(a=>a.id===f.a.id))animalCard(f.a.id);renderLivePasture()});
 root.scale.set(f.scale);return {root,face,body,headPivot,rest,legs,f,seed:farmHash(f.family||f.a.id)%1000,direction:1,x:f.x,y:f.y};
}
function farmPixiStep(state,dt){
 state.time+=dt;const night=state.phase==='night',event=farmScene.current;
 for(const unit of state.units){
  const f=unit.f,r=f.roam||{dx:0,dy:0,duration:36,delay:0},phase=(state.time+unit.seed%31)/(r.duration||36)%1,walk=phase<.32||phase>.65&&phase<.88;
  const ease=t=>t*t*(3-2*t),progress=phase<.32?ease(phase/.32):phase<.65?1:phase<.88?1-ease((phase-.65)/.23):0;
  const working=event?.ids.includes(f.a.id)||event?.ids.includes(f.mother),transfer=working&&['weight','weaning','finishing'].includes(event?.kind);
  let x=f.x+(night||working?0:r.dx*progress),y=f.y+(night||working?0:r.dy*progress);
  if(event?.kind==='feeding'&&working){const slot=state.units.filter(u=>event.ids.includes(u.f.a.id)||event.ids.includes(u.f.mother)).indexOf(unit),targetX=470+slot%7*35,targetY=327+Math.floor(slot/7)*10,p=event.stage===1?1:event.stage===0?Math.min(1,(Date.now()-farmScene.started)/3000):Math.max(0,1-(Date.now()-farmScene.started)/3000);x=f.x+(targetX-f.x)*p;y=f.y+(targetY-f.y)*p}
  unit.root.visible=!transfer;unit.root.position.set(x,y);unit.x=x;unit.y=y;unit.root.zIndex=y;
  const moving=walk&&!night&&!working&&dt>0,desired=phase<.5?1:-1;unit.direction+=(desired-unit.direction)*Math.min(1,dt*7);unit.face.scale.x=Math.abs(unit.direction)<.08?.08:unit.direction;
  unit.body.visible=!night;unit.rest.visible=night;const stride=state.time*7+unit.seed;
  unit.body.y=moving?Math.sin(stride*2)*1.1:Math.sin(state.time*1.8+unit.seed)*.35;
  unit.legs.forEach((leg,i)=>leg.rotation=moving?Math.sin(stride+(i===0||i===3?0:Math.PI))*.36:0);
  unit.headPivot.rotation=!moving&&!night?(.14+Math.sin(state.time*2+unit.seed)*.12):Math.sin(stride)*.025;
  if(farmScene.highlight===f.a.id){unit.root.tint=0xffe4a4}else unit.root.tint=0xffffff;
 }
 // A spatial grid keeps nearby families apart without separating nursing lambs.
 if(!night&&!event){
  const groups=new Map(),grid=new Map();
  for(const u of state.units){const key=u.f.zone+':'+u.f.family;let g=groups.get(key);if(!g){g={units:[],x:u.x,y:u.y,r:Math.max(3,22*u.f.scale)};groups.set(key,g)}g.units.push(u)}
  for(const g of groups.values()){const cellX=Math.floor(g.x/50),cellY=Math.floor(g.y/50);let dx=0,dy=0;
   for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)for(const other of grid.get((cellX+i)+','+(cellY+j))||[]){if(other.units[0].f.zone!==g.units[0].f.zone)continue;const x=g.x-other.x,y=g.y-other.y,d=Math.hypot(x,y),min=g.r+other.r;if(d<min){dx+=(d?x/d:1)*(min-d)*.45;dy+=(d?y/d:.3)*(min-d)*.45}}
   let left=-Infinity,right=Infinity,top=-Infinity,bottom=Infinity;for(const u of g.units){const b=u.f.roam?.bounds;if(b){left=Math.max(left,b[0]-u.x);right=Math.min(right,b[1]-u.x);top=Math.max(top,b[2]-u.y);bottom=Math.min(bottom,b[3]-u.y)}}dx=Math.max(left,Math.min(right,dx));dy=Math.max(top,Math.min(bottom,dy));
   for(const u of g.units){u.root.position.set(u.x+dx,u.y+dy);u.root.zIndex=u.y+dy}g.x+=dx;g.y+=dy;const key=Math.floor(g.x/50)+','+Math.floor(g.y/50);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(g);
  }
 }
 state.world.sortChildren();
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
   const app=state.app=new PIXI.Application();await app.init({width:1000,height:620,backgroundAlpha:0,antialias:true,autoStart:false,preference:'webgl',resolution:Math.min(devicePixelRatio||1,2),autoDensity:true});
   if(state.disposed||!view.isConnected){app.destroy(true);farmPixiViews.delete(view);return}
   state.textures=await farmPixiArtwork();farmPixiBackdrop||=PIXI.Assets.load('assets/farm/anime-countryside-v1.webp');const backdrop=await farmPixiBackdrop;if(state.disposed)return;
   state.world=new PIXI.Container();state.world.sortableChildren=true;state.background=new PIXI.Sprite(backdrop);state.background.width=1000;state.background.height=620;state.background.zIndex=-1000;state.world.addChild(state.background);app.stage.addChild(state.world);app.ticker.maxFPS=30;app.ticker.add(t=>farmPixiStep(state,Math.min(t.deltaMS/1000,.05)));
   app.canvas.className='farmPixiCanvas';app.canvas.setAttribute('aria-hidden','true');app.canvas.addEventListener('webglcontextlost',()=>farmPixiFallback(state));
   state.resize=()=>{if(state.failed||state.disposed)return;const width=state.view.querySelector('.farmStage')?.clientWidth||1000;app.renderer.resize(width,width*.62);state.world.scale.set(width/1000);app.render()};state.observer=new ResizeObserver(state.resize);state.loading=false;
   farmPixiSync(view,state.model,state.phase);
  }catch(error){farmPixiFallback(state);console.warn('Çiftlik görünümü yedek çizimle devam ediyor.',error.message)}return;
 }
 state.model=model;state.phase=phase;if(state.loading)return;
 const key=JSON.stringify(model.figures.map(f=>[f.a.id,f.x,f.y,f.scale,f.type,f.mother,f.zone,f.a.status]));
 if(state.key!==key){state.key=key;for(const u of state.units)u.root.destroy({children:true,texture:false});state.units=model.figures.map(f=>farmPixiRig(f,state.textures));if(state.units.length)state.world.addChild(...state.units.map(u=>u.root))}
 const host=view.querySelector('.farmCanvasHost'),stage=farmViewport(view);if(!stage.contains(state.app.canvas))stage.prepend(state.app.canvas);view.classList.add('farmPixiReady');state.observer.disconnect();state.observer.observe(stage);state.background.tint=phase==='night'?0x94a4c6:phase==='dusk'?0xf5decb:phase==='dawn'?0xffeedb:0xffffff;state.resize();
 // Native record buttons remain available to keyboard and assistive technology.
 for(const el of host.querySelectorAll('[data-farm-animal]')){el.setAttribute('aria-hidden','true');el.setAttribute('tabindex','-1')}
 let list=view.querySelector('.farmAccessibleAnimals');if(!list){list=document.createElement('details');list.className='farmAccessibleAnimals';host.after(list)}
 const listKey=model.figures.map(f=>f.a.id+':'+f.a.tag).join('|')+appLanguage;if(list.dataset.key!==listKey){list.dataset.key=listKey;list.innerHTML='<summary>'+tx('Hayvan kayıtlarını aç','Open animal records')+'</summary>';for(const f of model.figures){const b=document.createElement('button');b.type='button';b.textContent=f.a.tag||f.a.id;b.onclick=()=>{animalCard(f.a.id);renderLivePasture()};list.append(b)}}
 const sleeping=phase==='night',running=farmCanPlay()&&!view.classList.contains('pasturePaused')&&!sleeping;state.app.ticker[running?'start':'stop']();farmPixiStep(state,0);state.app.render();
}
if(typeof window!=='undefined')window.addEventListener('DOMContentLoaded',()=>{if(typeof renderLivePasture==='function')renderLivePasture()});
