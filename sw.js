const VER='1.16',VDATE='26.10.2026';
const V='fullbody-v'+VER,TW='https://cdn.tailwindcss.com/3.4.17';
const SHELL=['./','./index.html','./app.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
const put=(r,n)=>{if(n.ok||n.type==='opaque'){const cp=n.clone();caches.open(V).then(c=>c.put(r,cp))}return n};
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>Promise.all([...SHELL.map(u=>c.add(new Request(u,{cache:'reload'}))),c.add(new Request(TW,{mode:'no-cors'}))])).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
async function vid(r){const c=await caches.open(V);let m=await c.match(r.url);
if(!m){try{const n=await fetch(r.url);if(n.status===200){c.put(r.url,n.clone());m=n}else return n}catch(_){return new Response('',{status:504})}}
const rg=/bytes=(\d*)-(\d*)/.exec(r.headers.get('range')||'');if(!rg)return m;
const b=await m.arrayBuffer(),n=b.byteLength,s=rg[1]?+rg[1]:0,t=Math.min(rg[2]?+rg[2]:n-1,n-1);
return new Response(b.slice(s,t+1),{status:206,headers:{'Content-Type':m.headers.get('Content-Type')||'video/mp4','Content-Range':`bytes ${s}-${t}/${n}`,'Content-Length':t-s+1}})}
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;
const u=new URL(r.url);if(u.origin===location.origin&&/\/media\/.+\.(mp4|webm)$/.test(u.pathname))return e.respondWith(vid(r));
if(new URL(r.url).origin===location.origin)
 e.respondWith(fetch(r.url,{cache:'no-cache'}).then(n=>put(r,n)).catch(()=>caches.match(r,{ignoreSearch:true}).then(x=>x||caches.match('./index.html'))));
else e.respondWith(caches.match(r).then(x=>x||fetch(r).then(n=>put(r,n))))});
self.addEventListener('message',e=>{if(e.data?.type==='GET_VERSION')e.source.postMessage({type:'VERSION',version:VER,date:VDATE})});
