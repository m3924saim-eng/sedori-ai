const CACHE='sedori-ai-v14400';
const ASSETS=['./','./index.html','./app.js?v=14000','./boot-status.js?v=14400','./runtime-fix-v14.1.js?v=14400','./sedori-ai.user.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-180.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;e.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match(req)))});
