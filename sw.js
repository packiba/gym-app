const VER='1.14',VDATE='26.10.2026';
const V='fullbody-v'+VER,TW='https://cdn.tailwindcss.com/3.4.17';
const SHELL=['./','./index.html','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const put=(r,n)=>{if(n.ok||n.type==='opaque'){const cp=n.clone();caches.open(V).then(c=>c.put(r,cp))}return n};
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>Promise.all([...SHELL.map(u=>c.add(new Request(u,{cache:'reload'}))),c.add(new Request(TW,{mode:'no-cors'}))])).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
if(new URL(r.url).origin===location.origin)
 e.respondWith(fetch(r.url,{cache:'no-cache'}).then(n=>put(r,n)).catch(()=>caches.match(r,{ignoreSearch:true}).then(x=>x||caches.match('./index.html'))));
else e.respondWith(caches.match(r).then(x=>x||fetch(r).then(n=>put(r,n))))});
self.addEventListener('message',e=>{if(e.data?.type==='GET_VERSION')e.source.postMessage({type:'VERSION',version:VER,date:VDATE})});
