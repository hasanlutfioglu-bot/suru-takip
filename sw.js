const CACHE='suru-v2182-growth-report-20261027';
const APP=new URL('./v21.html',self.location.href).href;
const ASSETS=['./manifest.webmanifest','./icons/app.svg','./icons/app-192.png','./icons/app-512.png'].map(path=>new URL(path,self.location.href).href);
const SDK='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.2';
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.add(APP);for(const asset of ASSETS)await cache.add(asset);try{const response=await fetch(SDK,{mode:'cors'});if(response.ok)await cache.put(SDK,response)}catch(e){}await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('suru-v21')&&key!==CACHE)await caches.delete(key);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET')return;
 if(request.mode==='navigate'&&url.origin===self.location.origin&&(url.pathname.endsWith('/v21.html')||url.pathname.endsWith('/index.html')||url.pathname===new URL('./',APP).pathname)){
  event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(request,{cache:'no-store'});if(response.ok&&!response.redirected&&url.pathname===new URL(APP).pathname)await cache.put(APP,response.clone());return response}catch(e){const cached=await cache.match(APP);return cached||Response.error()}})());
 }else if(ASSETS.includes(request.url)){event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(request.url);if(cached)return cached;const response=await fetch(request);if(response.ok)await cache.put(request.url,response.clone());return response})())
 }else if(request.url===SDK){event.respondWith((async()=>{const cache=await caches.open(CACHE);const cached=await cache.match(SDK);if(cached)return cached;const response=await fetch(request);if(response.ok)await cache.put(SDK,response.clone());return response})())}
 // Auth, database requests and user data are never cached here.
});


// A push wakes the installed app's service worker even when its window is closed.
self.addEventListener('push',event=>{event.waitUntil((async()=>{let data={};try{data=event.data?.json()||{}}catch(e){}await self.registration.showNotification(data.title||'Sürü Takip',{body:data.body||'Kontrol edilecek işler var.',icon:new URL('./icons/app-192.png',APP).href,badge:new URL('./icons/app-192.png',APP).href,tag:data.tag||'flock-daily',data:{url:APP+'?action=today'}})})())});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{const url=APP+'?action=today';for(const client of await self.clients.matchAll({type:'window',includeUncontrolled:true})){if(client.url.startsWith(APP)){await client.navigate(url);return client.focus()}}return self.clients.openWindow(url)})())});
