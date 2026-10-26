// Presentation only: these helpers never write flock or finance data.
function uiIcon(name,extra=''){
 const paths={
  sheep:'<path d="M7 8a3 3 0 0 1 5-2 3 3 0 0 1 5 2 3 3 0 0 1 2 5c0 3-2 5-6 5H8c-3 0-5-2-5-5a4 4 0 0 1 4-5Z"/><path d="m16 12 3-1 2 2v3l-3 1-2-2m-9 3v3m7-3v3"/>',
  ram:'<path d="M7 9a5 5 0 0 1 10 0v6a5 5 0 0 1-10 0Z"/><path d="M7 9C0 4 1 16 7 12m10-3c7-5 6 7 0 3m-7 0h.01M14 12h.01m-4 5h4"/>',
  home:'<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7"/>',
  weight:'<path d="M5 8h14l2 12H3Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2m-4 4 2-2"/>',
  birth:'<path d="M7 9c-5-4-5 3 0 3m10-3c5-4 5 3 0 3M7 8a5 5 0 0 1 10 0v8a5 5 0 0 1-10 0Zm3 5h.01M14 13h.01m-4 5h4"/>',
  health:'<path d="m14 3 7 7m-6-6-9 9v5h5l9-9M4 20l-2 2M8 11l5 5m-1-9 5 5"/>',
  feeding:'<path d="M12 21V7m0 8c-5 0-8-3-8-7 5 0 8 3 8 7Zm0-4c0-5 3-8 8-8 0 5-3 8-8 8Z"/>',
  finance:'<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18m-6 4h6M5 6V4h13"/><circle cx="16" cy="15" r=".5"/>',
  sale:'<path d="M4 4h7l10 10-7 7L4 11Z"/><circle cx="8.5" cy="8.5" r="1"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2"/>',
  reports:'<path d="M5 3h10l4 4v14H5Z"/><path d="M14 3v5h5M9 17v-4m3 4v-7m3 7v-5"/>',
  growth:'<path d="M3 4v16h18M6 15l5-5 4 2 6-7m-5 0h5v5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  arrow:'<path d="M4 12h15m-5-5 5 5-5 5"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  warning:'<path d="m10 4-8 14a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3L14 4a2 2 0 0 0-4 0Z"/><path d="M12 9v5m0 3h.01"/>',
  settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="9" cy="6" r="2" fill="currentColor"/><circle cx="15" cy="12" r="2" fill="currentColor"/><circle cx="9" cy="18" r="2" fill="currentColor"/>',
  history:'<path d="M3 10a9 9 0 1 1 1 8M3 4v6h6m3-3v6l4 2"/>',
  scan:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 7v10m4-10v10m3-10v10m3-10v10"/>'
 };
 return '<svg class="uiIcon '+extra+'" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+(paths[name]||paths.grid)+'</svg>';
}
function landscapeGraphic(){return '<div class="heroGraphic" aria-hidden="true"><svg viewBox="0 0 270 230" fill="none" preserveAspectRatio="xMaxYMax meet"><circle cx="218" cy="56" r="24" fill="#ddbd76"/><circle cx="218" cy="56" r="37" stroke="#87a281" stroke-opacity=".17"/><path d="M-5 199C62 92 128 121 281 113V250H-5Z" fill="#3c654a"/><path d="M-5 223C71 141 131 163 281 141V250H-5Z" fill="#4f7450"/><path d="M22 232c72-49 153-40 270-47" stroke="#789565" stroke-width="1.2" stroke-opacity=".55"/><path d="M-4 207c53-20 100-24 142-20" stroke="#789565" stroke-opacity=".4"/><path d="M188 140v-32" stroke="#8ba075" stroke-width="3"/><path d="M188 96c-23-20-29 16-10 21 21 16 38-13 10-21Z" fill="#739064"/><path d="M241 155v-32" stroke="#8ba075" stroke-width="3"/><path d="M241 109c-19-18-29 15-11 20 20 15 39-12 11-20Z" fill="#65845b"/><g transform="translate(84 158)"><path d="M9 11c-10-5-10-18 0-20 5-9 17-8 21-1 12-3 19 10 11 17-4 12-20 15-32 4Z" fill="#e6e9cb"/><path d="M35 4c7-10 20-4 18 6l-2 9-12-1-5-8" fill="#243f32"/><path d="M11 13v13m20-12v12" stroke="#233f31" stroke-width="4" stroke-linecap="round"/></g><g transform="translate(165 191) scale(.66)"><path d="M9 11c-10-5-10-18 0-20 5-9 17-8 21-1 12-3 19 10 11 17-4 12-20 15-32 4Z" fill="#e8e7c5"/><path d="M35 4c7-10 20-4 18 6l-2 9-12-1-5-8" fill="#243f32"/><path d="M11 13v13m20-12v12" stroke="#233f31" stroke-width="4" stroke-linecap="round"/></g><path d="m42 171 2-7 3 7m141 44 3-8 3 8m40-45 2-7 3 7" stroke="#8ba174" stroke-width="1.5" stroke-linecap="round"/></svg></div>'}
function actionIcon(call){return /Weight|weight|weigh/i.test(call)?'weight':/Birth|birth|Weaning|Family/i.test(call)?'birth':/Health|health|Notification/i.test(call)?'health':/Feeding|Stock|stock|Harvest/i.test(call)?'feeding':/Sale|sale|Payment/i.test(call)?'sale':/Finance|finance|income|expense|Currency/i.test(call)?'finance':/Season|Growth|growth|Cost|reports|performance/i.test(call)?'growth':/calendar|Ram|today|Task/i.test(call)?'calendar':/Backup|Audit|History/i.test(call)?'history':/Animal|herd|Groups/i.test(call)?'sheep':'grid'}
function decorateMenuButtons(){
 for(const button of document.querySelectorAll('.menuGrid .menuBtn')){
  let icon=button.querySelector(':scope > .menuVisual');if(icon)continue;
  icon=button.querySelector(':scope > span[aria-hidden="true"]')||document.createElement('span');icon.className='menuVisual';icon.setAttribute('aria-hidden','true');icon.innerHTML=uiIcon(actionIcon(button.getAttribute('onclick')||''));
  if(!icon.parentNode)button.prepend(icon);
  for(const node of button.childNodes)if(node.nodeType===3)node.nodeValue=node.nodeValue.replace(/^[\s🐑🐏💰💉📊📅⚖️🌾🧾☰]+/u,'');
 }
}
function setupVisualDesign(){
 Object.assign(UI_EN,{'İŞLETME YÖNETİMİ':'FARM MANAGEMENT','SÜRÜ ÖZETİ':'FLOCK OVERVIEW','Hızlı işlemler':'Quick actions','Günün işini kolaylaştır':'Make the day easier','Yaklaşan işler':'Upcoming tasks','Kayıtlarını tamamla':'Complete your records','Tüm menüler':'All menus'});
 const header=document.querySelector('.app>header'),sync=document.getElementById('syncHealth');if(header&&sync)header.querySelector('.headerMeta').prepend(sync);
 const brand=document.querySelector('.brand h1');brand.innerHTML='<span class="brandMark">'+uiIcon('sheep')+'</span><span>Sürü Takip<small>'+"İŞLETME YÖNETİMİ"+'</small></span>';
 const home=document.getElementById('home'),hero=home.querySelector('.hero');home.classList.add('homeDashboard');
 const intro=document.createElement('div');intro.className='homeIntro';intro.innerHTML='<span class="eyebrow" id="dashboardDate"></span><h2 id="dashboardTitle"></h2><p id="dashboardCaption"></p>';home.prepend(intro);intro.after(hero);
 hero.querySelector('small').textContent="SÜRÜ ÖZETİ";hero.insertAdjacentHTML('beforeend',landscapeGraphic());
 const shortcuts=document.getElementById('homeQuickActions'),label=document.createElement('div');label.className='homeSectionLabel';label.id='quickActionLabel';label.innerHTML='<span>'+"Hızlı işlemler"+'</span><small>'+"Günün işini kolaylaştır"+'</small>';hero.after(label);label.after(shortcuts);
 const upcoming=home.querySelector('.homeUpcoming');shortcuts.after(upcoming);upcoming.querySelector('.homeUpcomingHead b').textContent="Yaklaşan işler";upcoming.querySelector('.upcomingMore').insertAdjacentHTML('beforeend',uiIcon('arrow'));
 const summary=home.querySelector('.homeSummary');upcoming.after(summary);const fold=home.querySelector('.homeSecondary');summary.after(fold);
 for(const [id,icon] of [['homeNet','finance'],['homeSaleReady','sale'],['homeBirthRate','birth'],['homeLambValue','growth']]){const el=document.getElementById(id)?.closest('button');if(el){const visual=document.createElement('span');visual.className='summaryIcon';visual.innerHTML=uiIcon(icon);el.prepend(visual)}}
 const dataQuality=home.querySelector('.homeDataQuality');fold.after(dataQuality);dataQuality.querySelector('b').innerHTML=uiIcon('warning')+'<span>'+"Kayıtlarını tamamla"+'</span>';
 const account=document.getElementById('welcomeAccountCard');dataQuality.after(account);account.after(document.getElementById('homeRamStatus'));document.getElementById('homeRamStatus').after(document.getElementById('homeOperations'));
 const menus=home.querySelector('.homeMenu');menus.innerHTML=uiIcon('grid')+'<span>'+"Tüm menüler"+'</span>';
 for(const nav of document.querySelectorAll('.nav[data-go]'))nav.querySelector('b').innerHTML=uiIcon({home:'home',herd:'sheep',add:'plus',reports:'reports',growth:'growth'}[nav.dataset.go]);
 for(const button of document.querySelectorAll('.reportNav button')){const icon=button.querySelector('b');if(icon)icon.innerHTML=uiIcon({overview:'grid',finance:'finance',herd:'sheep',archive:'history'}[button.dataset.reportView])}
 document.querySelector('.reportHead')?.insertAdjacentHTML('beforeend',uiIcon('reports'));
 decorateMenuButtons();renderVisualContext();
}
function renderVisualContext(){
 const date=document.getElementById('dashboardDate');if(date)date.textContent=new Date(today()+'T12:00:00').toLocaleDateString(appLocale(),{weekday:'long',day:'numeric',month:'long'});
 const title=document.getElementById('dashboardTitle');if(title)title.textContent=tx('Çiftliğin, bir bakışta.','Your farm, at a glance.');
 const caption=document.getElementById('dashboardCaption');if(caption)caption.textContent=tx('Bugünkü işler ve sürünün genel durumu.','Today’s tasks and the state of your flock.');
}
