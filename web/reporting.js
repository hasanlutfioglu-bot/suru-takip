// Read-only report scope and category definitions, shared by cards and drilldowns.
function reportPeriodBounds(mode=db.report||'monthly'){
 if(customReportStart||customReportEnd)return {start:customReportStart||null,end:customReportEnd||null,kind:'custom'};
 const date=today(),year=+date.slice(0,4),month=+date.slice(5,7);
 const iso=d=>localDateISO(d);
 if(mode==='monthly')return {start:date.slice(0,7)+'-01',end:iso(new Date(year,month,0)),kind:mode};
 if(mode==='yearly')return {start:year+'-01-01',end:year+'-12-31',kind:mode};
 if(mode==='birthperiod'){const r=latestBirthPeriodRange();return r?{start:iso(r.start),end:iso(r.end),kind:mode}:null}
 return null;
}
function previousReportBounds(){
 const r=reportPeriodBounds();if(!r?.start||!r?.end)return null;
 const y=+r.start.slice(0,4),m=+r.start.slice(5,7);
 if(r.kind==='monthly')return {start:localDateISO(new Date(y,m-2,1)),end:localDateISO(new Date(y,m-1,0))};
 if(r.kind==='yearly')return {start:(y-1)+'-01-01',end:(y-1)+'-12-31'};
 const days=dateDiffDays(r.start,r.end)+1,end=addDaysISO(r.start,-1);
 return {start:addDaysISO(end,1-days),end};
}
function reportFinanceCategory(r){
 if(r.kind==='sale')return 'sale';
 const classify=text=>{const t=String(text||'').toLocaleLowerCase('tr-TR');
  if(r.kind==='income'){if(/hayvan satış|hayvan satis|kuzu satış|kuzu satis/.test(t))return 'sale';if(/destek/.test(t))return 'support';return null}
  if(/tarla|tohum|libazma|sürüm|surum|mazot|gübre|gubre|ilaçlama|ilaclama|biçim|bicim|işçilik|iscilik/.test(t))return 'field';
  if(/veteriner|ilaç|ilac|sağlık|saglik/.test(t))return 'medicine';
  if(/yem|arpa|saman|balya|silaj|yonca|küspe|kuspe|kepek/.test(t))return 'feed';return null;
 };
 return classify(r.category)||classify([r.label,r.stockItem].filter(Boolean).join(' '))||classify(r.note)||(r.kind==='income'?'otherIncome':'other');
}
function reportCategoryName(key){return ({sale:tx('Hayvan satışı','Animal sales'),support:tx('Devlet desteği','Government support'),otherIncome:tx('Diğer gelir','Other income'),field:tx('Tarla','Field'),medicine:tx('İlaç / Veteriner','Medicine / Vet'),feed:tx('Yem','Feed'),other:tx('Diğer','Other')})[key]||key}
function reportPeriodLambGrowth(a,rows){
 const selected=new Set(rows.filter(r=>r.kind==='weight'&&r.animalId===a.id).map(r=>r.date));
 const weights=growthMeasurements(a).filter(r=>selected.has(r.date)),first=weights[0],last=weights.at(-1),days=weights.length>1?dateDiffDays(first.date,last.date):0;
 return {a,first,last,days,count:weights.length,adg:days>0?(last.weight-first.weight)*1000/days:null};
}
function reportFinanceChart(data){
 const max=Math.max(1,...data.flatMap(x=>[x.income,x.expense])),x=i=>80+i*59,y=v=>130-v/max*105;
 const path=key=>data.map((r,i)=>x(i)+','+y(r[key])).join(' ');
 return `<svg viewBox="0 0 400 171" role="img" aria-label="${tx('Aylık kayıtlı gelir ve gider, para birimiyle','Monthly recorded income and expenses with currency scale')}">${[0,.5,1].map(t=>`<path d="M80 ${y(max*t)}H380" stroke="#e4eadc"/><text x="72" y="${y(max*t)+4}" text-anchor="end">${escHtml(money(max*t))}</text>`).join('')}<polyline points="${path('income')}" fill="none" stroke="#54794f" stroke-width="2.5"/><polyline points="${path('expense')}" fill="none" stroke="#c09a65" stroke-width="2.5"/>${data.map((r,i)=>`<circle cx="${x(i)}" cy="${y(r.income)}" r="3.5" fill="#54794f"><title>${escHtml(r.label+' · '+tx('Gelir','Income')+': '+money(r.income))}</title></circle><circle cx="${x(i)}" cy="${y(r.expense)}" r="3.5" fill="#c09a65"><title>${escHtml(r.label+' · '+tx('Gider','Expense')+': '+money(r.expense))}</title></circle><text x="${x(i)}" y="157" text-anchor="middle">${escHtml(r.label)}</text>`).join('')}</svg><details class="reportChartTable"><summary>${tx('Aylık tutarları göster','Show monthly amounts')}</summary><table><thead><tr><th>${tx('Ay','Month')}</th><th>${tx('Gelir','Income')}</th><th>${tx('Gider','Expense')}</th></tr></thead><tbody>${data.map(r=>`<tr><td>${escHtml(r.label)}</td><td>${money(r.income)}</td><td>${money(r.expense)}</td></tr>`).join('')}</tbody></table></details>`;
}
function renderReportReadingGuide(f,metrics){
 const el=document.getElementById('reportReadingGuide');if(!el)return;
 const mode=db.report||'monthly',range=reportPeriodBounds(mode),prev=previousReportBounds(),fin=f.arr.filter(r=>['income','sale','expense','stock'].includes(r.kind));
 const active=db.animals.filter(isActiveAnimal),missingBirth=metrics.births.filter(r=>!r.motherId||!indexedRecords().animals.has(r.motherId)).length;
 const recent=active.filter(a=>{const rows=growthMeasurements(a),last=rows.at(-1);return last&&dateDiffDays(last.date,today())<21}).length;
 const dates=f.arr.map(r=>r.date).filter(validDate).sort();
 const scope=range?(range.start||tx('Açık başlangıç','Open start'))+' → '+(range.end||tx('Açık bitiş','Open end')):(dates.length?dates[0]+' → '+dates.at(-1):tx('Tüm kayıtlar','All records'));
 el.innerHTML=`<div class="reportScopeTop"><span>${tx('SEÇİLİ DÖNEM','SELECTED PERIOD')}</span><b>${escHtml(scope)}</b><small>${f.arr.length} ${tx('kayıt','records')} · ${fin.length} ${tx('finans kaydı','financial entries')}</small></div><details class="reportScopeDetails"><summary>${tx('Kapsam ve veri güncelliği','Scope and data recency')}</summary><div class="reportReadingGrid"><div>${uiIcon('finance')}<p><b>${tx('Kayıtlı dönem sonucu','Recorded period result')}</b><span>${fin.length?money(f.income-f.expense):tx('Finans kaydı yok','No financial entries')}</span><small>${tx('Gelir − gider. Tahmini satışlar eklenmez; tahsilat ve net kâr ölçüsü değildir.','Income − expense. Projected sales are excluded; this is not cash collected or net profit.')}</small></p></div><div>${uiIcon('birth')}<p><b>${tx('Doğum kayıtları','Lambing records')}</b><span>${metrics.lambs} ${tx('kuzu','lambs')} · ${metrics.lambedIds.length} ${tx('farklı anaç','distinct mothers')}</span><small>${metrics.births.length} ${tx('doğum kaydı · seçili dönem','lambing entries · selected period')}${missingBirth?' · '+missingBirth+' '+tx('anaç bağlantısı eksik','missing mother link'):''}</small></p></div><div>${uiIcon('sheep')}<p><b>${tx('Bugünkü sürü','Flock today')}</b><span>${active.length} ${tx('aktif hayvan','active animals')}</span><small>${recent} ${tx('hayvanda son 21 günden yeni tartım. Dönem sonu envanteri değildir.','animals weighed within 21 days. This is not period-end inventory.')}</small></p></div></div></details><div class="reportCompareScope">${prev?tx('Karşılaştırma: ','Comparison: ')+prev.start+' → '+prev.end:tx('Bu seçim için önceki dönem karşılaştırması yok. İki tarihi de belirleyerek karşılaştırabilirsin.','No previous-period comparison for this selection. Set both dates to compare.')}${range?.end>today()?' · '+tx('Seçili dönem devam ediyor; önceki tam dönemle farkı buna göre yorumla.','The selected period is ongoing; interpret the difference from a complete previous period accordingly.'):''}</div>`;
 const methodology=document.getElementById('reportMethodology');if(methodology)methodology.innerHTML=`<summary>${tx('Bu raporu nasıl okumalıyım?','How to read this report')}</summary><p>${tx('Dönem sonucu, kayıt tarihine göre gelir ve satış toplamından gider ve stok alışlarını çıkarır. Stok alışı gider sayılır; stok tüketimi, amortisman ve tahsilat zamanı bu sonuçtan anlaşılamaz. Satış senaryoları bugünkü kilo × girilen fiyatla hesaplanır; gerçekleşmiş gelir değildir. Kategori önce kayıtlı kategoriden, sonra açıklama ve nottan belirlenir; ayrıntı ve özet aynı kurala dayanır.','Period result subtracts expenses and stock purchases from income and sales by record date. Stock purchases are expenses; stock consumption, depreciation and collection timing are not established by this result. Sales scenarios use current weight × entered price, not realised income. Categories use the recorded category first, then description and notes; summaries and details share the same rule.')}</p><p>${tx('Kuzu verimi = kayıtlı kuzu / doğuran farklı anaç × 100. Uzun dönemlerde bir anacın birden fazla doğumu olabilir; bu gösterge doğum başına yavru sayısı değildir. Anaç oranının paydası aktif anaçlarla dönemde doğurmuş eski veya kartı eksik annelerin birleşimidir. Bu, kayıt kapsamını anlatır; koça verilen anaçlar bilinmediğinden bilimsel gebelik veya kuzulama başarısı oranı değildir. Doğum kaydı olmaması doğurmadığını kanıtlamaz.','Lamb yield = recorded lambs / distinct mothers that lambed × 100. A mother may lamb several times in a long period; this is not litter size per lambing. The ewe denominator combines active breeding ewes with historical or missing-card mothers that lambed in the period. This describes recorded coverage; without ewes exposed to rams it is not a reproductive success rate. A missing lambing record does not prove no lambing occurred.')}</p><p>${tx('Mevcut sürü, stok, satış hazırlığı ve gelişim göstergeleri bugünkü durumu gösterir. Son 6 ay grafiği seçili dönemin bitiş ayına kadar olan takvim aylarını kapsar (gelecek aylar hariç); yalnız seçili tarih aralığının toplamı değildir. Nabız renkleri uygulamanın takip kurallarıdır; teşhis veya bilimsel risk puanı değildir. Eksik kayıtlar sonuçları sınırlar.','Flock, stock, sale readiness and growth indicators describe today. The six-month chart covers calendar months ending at the selected period’s end month (excluding future months), not just the selected date range. Pulse colours are application monitoring rules, not diagnoses or scientific risk scores. Missing records limit interpretation.')}</p>`;
}
