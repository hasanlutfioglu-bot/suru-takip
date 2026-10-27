// Decorative flock scene. Counts come from current records; no farm data is written.
let pasturePaused=false,pastureRenderKey='';
try{pasturePaused=localStorage.getItem('suru_pasture_paused')==='1'}catch{}
function pastureModel(animals){
 const counts={ewe:0,ram:0,lamb:0,unknown:0};
 for(const a of animals)if(isActiveAnimal(a))counts[a.type==='Koyun'?'ewe':a.type==='Koç'?'ram':a.type==='Kuzu'?'lamb':'unknown']++;
 const total=Object.values(counts).reduce((s,n)=>s+n,0);
 return {counts,total,shown:total,visible:{...counts},representative:false};
}
function pastureSheep(type,index){return farmAnimalArt(type,index)}
function setupLivePasture(hero){setupFarmScene(hero)}
function togglePastureMotion(){pasturePaused=!pasturePaused;try{localStorage.setItem('suru_pasture_paused',pasturePaused?'1':'0')}catch{}renderLivePasture()}
function renderLivePasture(){renderFarmScene()}
