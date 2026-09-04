const CACHE='sedori-ai-v14402';
const PREFIX='sedori-ai-v';
const ASSETS=['./','./index.html','./app.js?v=14402','./boot-status.js?v=14402','./runtime-fix-v14.1.js?v=14402','./sedori-ai.user.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-180.png'];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(ASSETS.map(async url=>{
      try{
        const response=await fetch(url,{cache:'reload'});
        if(response.ok) await cache.put(url,response.clone());
      }catch(_){ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(req,{cache:'no-store'});
      if(response.ok) return response;
      if(req.mode!=='navigate') return response;
    }catch(_){ }
    if(req.mode==='navigate'){
      return (await caches.match('./index.html',{ignoreSearch:true})) || Response.error();
    }
    return (await caches.match(req,{ignoreSearch:true})) || Response.error();
  })());
});
