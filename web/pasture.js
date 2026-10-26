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
  parts.sort((a,b)=>b.fraction-a.fraction);while(extra>0)for(const part of parts){if(extra<=0)break;if(visible[part.k]<counts[part.k]){visible[part.k]++;extra--}}
 }
 return {counts,total,shown,visible,representative:total>PASTURE_LIMIT};
}
function pastureSheep(type,index){return farmAnimalArt(type,index)}
function setupLivePasture(hero){setupFarmScene(hero)}
function togglePastureMotion(){pasturePaused=!pasturePaused;try{localStorage.setItem('suru_pasture_paused',pasturePaused?'1':'0')}catch{}renderLivePasture()}
function renderLivePasture(){renderFarmScene()}
