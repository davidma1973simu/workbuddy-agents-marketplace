/* 谈伴 Negotia · Service Worker
   目标：装到桌面后离线也能打开；能练的场景、人设、进度都在本机，断网也能继续练。
   策略：页面走「先网络、失败再用缓存」，静态资源走「先用缓存、后台更新」。 */

const V = 'negotia-v9';
/* 必须与 index.html 里的 ?v= 完全一致，否则预缓存的文件名对不上，
   离线时 cache.match 落空 —— 首次安装后断网就会白屏。 */
const VER = '20261106a3';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './assets/styles.css?v=' + VER,
  './assets/app.js?v=' + VER,
  './assets/lite.js?v=' + VER,
  './assets/invite.js?v=' + VER,
  './assets/wb-cloud.js',
  './icons/favicon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon-180.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    // 逐个加，单个失败不影响整体安装
    await Promise.all(CORE.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== V).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // AI 接口等跨域请求一律直连
  if (url.pathname.endsWith('/sw.js')) return;

  // 页面：先网络（保证更新能拿到），断网或被挡下时才用缓存
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (!fresh || !fresh.ok) throw new Error('bad status ' + (fresh && fresh.status));
        const c = await caches.open(V);
        c.put(new URL('./index.html', self.location).href, fresh.clone());
        return fresh;
      } catch (err) {
        const c = await caches.open(V);
        return (await c.match(req)) || (await c.match(new URL('./index.html', self.location).href)) || Response.error();
      }
    })());
    return;
  }

  // 资源：先用缓存立刻出图，同时后台悄悄更新
  e.respondWith((async () => {
    const c = await caches.open(V);
    const hit = await c.match(req);
    const net = fetch(req).then((res) => {
      if (res && res.ok) c.put(req, res.clone());
      return res;
    }).catch(() => null);
    return hit || (await net) || Response.error();
  })());
});
