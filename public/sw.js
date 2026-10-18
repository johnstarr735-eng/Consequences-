const CACHE='consequences-shell-v6';
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/offline.html','/icon-192.png','/icon-512.png','/apple-touch-icon.png'])));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  // Match state, authentication and API writes are never cached or replayed.
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/')||event.request.method!=='GET')return;
  if(event.request.mode==='navigate')event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.html')));
});
