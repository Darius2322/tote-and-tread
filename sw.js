/* ================================================================
   TOTE & TREAD — sw.js
   Deploy this to the ROOT of your GitHub repo (same folder as index.html)
   It serves at https://your-site.vercel.app/sw.js
   ================================================================ */
const CACHE = 'tt-v6';
const PRECACHE = [
  '/', '/index.html', '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/dexie@4/dist/dexie.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;
  if (url.includes('supabase.co')||url.includes('/rest/v1/')||url.includes('/auth/')||url.includes('/realtime/')) return;
  if (url.includes('fonts.google')||url.includes('fonts.gstatic')||url.includes('cdnjs.cloudflare')||url.includes('cdn.jsdelivr')) {
    e.respondWith(cacheFirst(e.request)); return;
  }
  if (url.includes('unsplash.com')||url.match(/\.(jpg|jpeg|png|webp|gif|svg|ico)(\?.*)?$/)) {
    e.respondWith(staleWhileRevalidate(e.request)); return;
  }
  e.respondWith(networkFirst(e.request));
});

async function cacheFirst(req){
  const c=await caches.match(req);if(c)return c;
  try{const r=await fetch(req);if(r.ok)(await caches.open(CACHE)).put(req,r.clone());return r;}
  catch{return new Response('Unavailable offline',{status:503});}
}
async function staleWhileRevalidate(req){
  const cache=await caches.open(CACHE),c=await cache.match(req);
  const fp=fetch(req).then(r=>{if(r.ok)cache.put(req,r.clone());return r;}).catch(()=>null);
  return c||await fp||new Response('',{status:503});
}
async function networkFirst(req){
  try{const r=await fetch(req);if(r.ok)(await caches.open(CACHE)).put(req,r.clone());return r;}
  catch{
    const c=await caches.match(req);if(c)return c;
    if(req.mode==='navigate'){
      const shell=await caches.match('/index.html');if(shell)return shell;
      return new Response(`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tote & Tread — Offline</title><style>body{font-family:sans-serif;background:#0A0A0A;color:#EDE5D8;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;padding:24px}h1{color:#C9A84C;font-weight:400}p{color:#8C7C62;max-width:300px;line-height:1.7}button{margin-top:20px;padding:12px 24px;background:#C9A84C;color:#000;border:none;border-radius:6px;cursor:pointer;font-weight:600}</style></head><body><div style="font-size:3rem;margin-bottom:16px">📶</div><h1>You Are Offline</h1><p>Please check your internet connection. Your cart and wishlist are saved locally.</p><button onclick="location.reload()">Try Again</button></body></html>`,
        {headers:{'Content-Type':'text/html; charset=utf-8'}});
    }
    return new Response('Offline',{status:503});
  }
}
