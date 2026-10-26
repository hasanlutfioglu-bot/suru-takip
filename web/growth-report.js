// Descriptive growth reporting: recorded weights only; never writes farm data.
let growthReportPeriod=90,growthReportSex='all';
function growthMeasurements(a){
 const days=new Map();
 for(const r of indexedRecords().weights.get(a.id)||[]){
  const weight=weightValueFromRecord(r);
  if(validDate(r.date)&&r.date<=today()&&(!validDate(a.birth)||r.date>=a.birth)&&Number.isFinite(weight)&&weight>0)days.set(r.date,{date:r.date,weight});
 }
 return [...days.values()].sort((a,b)=>a.date.localeCompare(b.date));
}
function measuredGrowthInfo(a){
 const wi=latestWeightInfo(a),rows=growthMeasurements(a),last=rows.at(-1),prev=rows.at(-2);
 const days=prev?dateDiffDays(prev.date,last.date):0;
 return {...wi,latest:last||null,prev:prev||null,weight:last?.weight||wi.weight,prevWeight:prev?.weight||0,days,gain:days>0?last.weight-prev.weight:0,adg:days>0?(last.weight-prev.weight)*1000/days:null};
}
function growthPeerKey(a,wi){return JSON.stringify([Math.floor(lambAgeDaysAt(a,wi.latest.date)/30),a.sex||'',a.group||''])}
function growthPeerIndex(infos){
 const groups=new Map();
 for(const x of infos){if(!validDate(x.a.birth)||!x.wi.latest||dateDiffDays(x.wi.latest.date,today())>=21||!(x.wi.weight>0))continue;const key=growthPeerKey(x.a,x.wi),g=groups.get(key)||{sum:0,count:0};g.sum+=x.wi.weight;g.count++;groups.set(key,g)}
 return groups;
}
function growthPeerSummary(a,wi,groups){
 if(!validDate(a.birth)||!wi.latest||dateDiffDays(wi.latest.date,today())>=21)return {count:0,mean:0};
 const g=groups.get(growthPeerKey(a,wi));return g?{count:g.count-1,mean:g.count>1?(g.sum-wi.weight)/(g.count-1):0}:{count:0,mean:0};
}
function growthReportData(){
 const cutoff=growthReportPeriod?addDaysISO(today(),-growthReportPeriod):'';
 return db.animals.filter(a=>a.type==='Kuzu'&&isActiveAnimal(a)&&(growthReportSex==='all'||a.sex===growthReportSex)).map(a=>{
  const rows=growthMeasurements(a),last=rows.at(-1),prev=rows.at(-2),days=prev?dateDiffDays(prev.date,last.date):0;
  const included=!!(days>0&&(!cutoff||prev.date>=cutoff));
  return {a,last,prev,days,included,adg:included?(last.weight-prev.weight)*1000/days:null,stale:!last||dateDiffDays(last.date,today())>=21};
 });
}
function growthMethodology(){
 return `<details class="growthMethods"><summary>${tx('Hesaplama yöntemi ve kaynaklar','Methods and sources')}</summary><p>${tx('Günlük canlı ağırlık artışı (ADG) = (son kg − önceki kg) × 1000 / iki tartım arasındaki gün. Her kuzu son iki farklı tarihli, pozitif tartımıyla bir kez temsil edilir. Aynı günün son kaydı kullanılır; gelecek tarihli ve doğum öncesi kayıtlar dışlanır. Negatif artışlar korunur.','Average daily gain (ADG) = (latest kg − previous kg) × 1000 / days between weighings. Each lamb contributes its last two positive weights on different dates once. The last entry per day is used; future and pre-birth records are excluded. Negative gains are retained.')}</p><p>${tx('Seçilen dönemde iki tartımın da bulunması gerekir. Ortalama kuzuların ADG değerlerinin aritmetik ortalamasıdır; ortanca sıralı dağılımın orta değeridir. Güncel tartım: son 21 günden daha yeni kayıt; bu uygulamanın iş takip aralığıdır. Gruplar son tartımdaki 30 günlük yaş aralığı, cinsiyet ve kayıtlı sürü grubuna göre ayrılır. Küçük örneklemler genellenemez.','Both weighings must fall within the selected period. The mean weights each lamb equally; the median is the middle of the sorted values. A recent weight is less than 21 days old, an application scheduling interval. Groups use 30-day age bands at last weighing, sex and recorded flock group. Small samples cannot be generalized.')}</p><p>${tx('Irk, doğum tipi, anne yaşı ve besleme koşulları için düzeltme yapılmaz. Grup farkları genetik üstünlük veya hastalık tanısı değildir. Yaşa göre sabit bantlar uygulamanın takip eşikleridir; evrensel bilimsel normal aralık değildir. 50 kg işletme hedefidir. Hedef tarihi artışın aynı hızda sürdüğü varsayımına dayanır; tek tartımda 230 g/gün senaryosu kullanılır ve kesin sonuç değildir.','No adjustment is made for breed, birth type, dam age or feeding conditions. Group differences do not establish genetic merit or a diagnosis. Fixed age bands are application monitoring thresholds, not universal scientific norms. 50 kg is a business target. Target dates assume a constant gain; with one weighing a 230 g/day scenario is used, not a certain outcome.')}</p><p><a href="https://www.sheep.ie/weighing-report/" target="_blank" rel="noopener noreferrer">Sheep Ireland · Weighing Report</a> · <a href="https://teagasc.ie/news--events/daily/maximising-lamb-thrive/" target="_blank" rel="noopener noreferrer">Teagasc · Maximising lamb thrive</a></p></details>`;
}
function renderGrowthReport(){
 const el=document.getElementById('growthScientificReport');if(!el)return;
 const rows=growthReportData(),valid=rows.filter(x=>x.included),vals=valid.map(x=>x.adg).sort((a,b)=>a-b),n=vals.length;
 const mean=n?vals.reduce((s,v)=>s+v,0)/n:null,median=n?(vals[Math.floor(n/2)]+vals[Math.ceil(n/2)-1])/2:null;
 const fmt=v=>v===null?'—':Math.round(v).toLocaleString(appLocale());
 const groups=new Map();
 for(const x of valid){const age=validDate(x.a.birth)?Math.floor(lambAgeDaysAt(x.a,x.last.date)/30):null;const label=(age===null?tx('Yaş bilinmiyor','Unknown age'):age*30+'–'+(age*30+29)+tx(' gün',' days'))+' · '+(x.a.sex||tx('Cinsiyet yok','Unknown sex'))+' · '+(x.a.group||tx('Grupsuz','No group'));if(!groups.has(label))groups.set(label,[]);groups.get(label).push(x.adg)}
 el.innerHTML=`<div class="growthReportHead"><div><small>${tx('ÖLÇÜME DAYALI RAPOR','MEASUREMENT REPORT')}</small><h3>${tx('Büyümeyi verilerle izle','Understand their growth')}</h3><p>${tx('Aktif kuzular · her hayvanın son iki tartımı','Active lambs · last two weighings per animal')} · ${escHtml(today())}</p></div>${uiIcon('growth')}</div>
 <div class="growthReportControls"><label>${tx('Tartım dönemi','Weighing period')}<select aria-label="${tx('Rapor dönemi','Report period')}" onchange="growthReportPeriod=+this.value;renderGrowthReport()">${[[30,tx('Son 30 gün','Last 30 days')],[90,tx('Son 90 gün','Last 90 days')],[0,tx('Tüm tarihler','All dates')]].map(([v,t])=>`<option value="${v}" ${v===growthReportPeriod?'selected':''}>${t}</option>`).join('')}</select></label><label>${tx('Cinsiyet','Sex')}<select aria-label="${tx('Rapor cinsiyeti','Report sex')}" onchange="growthReportSex=this.value;renderGrowthReport()">${[['all',tx('Tümü','All')],['Erkek',tx('Erkek','Male')],['Dişi',tx('Dişi','Female')]].map(([v,t])=>`<option value="${v}" ${v===growthReportSex?'selected':''}>${t}</option>`).join('')}</select></label></div>
 <div class="growthEvidence"><div><span>${tx('Ortalama artış','Mean gain')}</span><b>${fmt(mean)} <small>g/${tx('gün','day')}</small></b><em>n = ${n} / ${rows.length} ${tx('kuzu','lambs')}</em></div><div><span>${tx('Ortanca artış','Median gain')}</span><b>${fmt(median)} <small>g/${tx('gün','day')}</small></b><em>${n?tx('En düşük / en yüksek: ','Min / max: ')+fmt(vals[0])+' / '+fmt(vals.at(-1)):tx('İki tarihli tartım gerekli','Two dated weights required')}</em></div></div>
 <div class="growthCoverage"><span>${tx('Güncel tartımı olan','Recently weighed')}</span><b>${rows.filter(x=>!x.stale).length} / ${rows.length}</b><progress max="${Math.max(1,rows.length)}" value="${rows.filter(x=>!x.stale).length}"></progress></div>
 <p class="growthReportNote">${rows.length-n} ${tx('kuzu dönem hesabı dışında: dönemde iki farklı tarihli tartım yok. Eski tartımlar artış hesabında kalabilir; güncellik göstergesini birlikte değerlendir.','lambs excluded: fewer than two dated weights in the period. Older weights may contribute to gain; consider recency alongside it.')}</p>
 <h4>${tx('Benzer grupların görünümü','Comparable groups')}</h4><div class="growthCohorts">${[...groups].sort((a,b)=>a[0].localeCompare(b[0],appLocale(),{numeric:true})).map(([name,vs])=>`<div><span data-no-i18n>${escHtml(name)}<small>n = ${vs.length}${vs.length<3?' · '+tx('az veri','small sample'):''}</small></span><b>${fmt(vs.reduce((s,v)=>s+v,0)/vs.length)} <small>g/${tx('gün','day')}</small></b></div>`).join('')||`<p>${tx('Bu seçimde karşılaştırma için yeterli tartım yok.','No paired weighings for this selection.')}</p>`}</div>${growthMethodology()}`;
}
function growthWeightChart(a){
 const rows=growthMeasurements(a);if(!rows.length)return `<div class="growthChart"><h3>${tx('Kilo yolculuğu','Weight journey')}</h3><p>${tx('İlk tartımla grafik başlayacak.','Record a weighing to start the chart.')}</p></div>`;
 const min=Math.max(0,Math.floor(Math.min(...rows.map(x=>x.weight))/5)*5-5),max=Math.max(min+10,Math.ceil(Math.max(...rows.map(x=>x.weight))/5)*5+5);
 const span=Math.max(1,dateDiffDays(rows[0].date,rows.at(-1).date)),x=r=>44+dateDiffDays(rows[0].date,r.date)/span*292,y=r=>146-(r.weight-min)/(max-min)*115;
 const points=rows.map(r=>x(r).toFixed(1)+','+y(r).toFixed(1)).join(' ');
 return `<div class="growthChart"><small>${tx('GERÇEK TARTIMLAR','RECORDED WEIGHTS')}</small><h3>${tx('Kilo yolculuğu','Weight journey')}</h3><svg viewBox="0 0 360 184" role="img" aria-label="${tx('Tarihe göre ölçülen canlı ağırlık grafiği','Recorded live weight over time')}">${[0,.5,1].map(t=>`<path d="M44 ${146-t*115}H336" stroke="#e3e9dc"/><text x="4" y="${150-t*115}">${(min+(max-min)*t).toFixed(0)} kg</text>`).join('')}<polyline points="${points}" fill="none" stroke="#477253" stroke-width="3"/>${rows.map(r=>`<circle cx="${x(r)}" cy="${y(r)}" r="4" fill="#477253"><title>${r.date}: ${r.weight.toFixed(1)} kg</title></circle>`).join('')}<text x="44" y="174">${rows[0].date}</text><text x="336" y="174" text-anchor="end">${rows.at(-1).date}</text></svg><p>${rows.length} ${tx('tartım · noktalar ölçümdür; aradaki çizgi yalnız görsel bağlantıdır.','weighings · dots are measurements; connecting lines are visual guides.')}</p></div>`;
}
