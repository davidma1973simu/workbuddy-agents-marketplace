/**
 * Eureka Dashboard Service Worker
 * 提供离线缓存和后台同步功能
 * @version 1.0.0
 */

const CACHE_NAME = 'eureka-dashboard-v1';
const STATIC_ASSETS = [
  '/workbuddy-agents-marketplace/eureka-dashboard/',
  '/workbuddy-agents-marketplace/eureka-dashboard/index.html',
  '/workbuddy-agents-marketplace/eureka-dashboard/manifest.json'
];

// 安装时缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Install completed');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Install failed:', err);
      })
  );
});

// 激活时清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activate completed');
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return;
  }
  
  // 跳过 chrome-extension 和其他非 HTTP/HTTPS 请求
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // 策略：网络优先，失败时回退缓存
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // 网络请求成功，更新缓存
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseClone);
            })
            .catch((err) => {
              console.error('[SW] Cache update failed:', err);
            });
        }
        return networkResponse;
      })
      .catch(() => {
        // 网络失败，尝试从缓存获取
        console.log('[SW] Network failed, trying cache:', request.url);
        return caches.match(request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // 缓存也没有，返回离线页面
            if (request.mode === 'navigate') {
              return caches.match('/workbuddy-agents-marketplace/eureka-dashboard/');
            }
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// 后台同步（用于数据同步）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-eureka-data') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncData());
  }
});

// 推送通知（可选功能）
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Eureka 提醒',
    icon: '/workbuddy-agents-marketplace/eureka-dashboard/icons/icon-192x192.png',
    badge: '/workbuddy-agents-marketplace/eureka-dashboard/icons/icon-72x72.png',
    tag: data.tag || 'eureka-notification',
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Eureka', options)
  );
});

// 同步数据的辅助函数
async function syncData() {
  // 这里可以实现与后端的数据同步逻辑
  // 目前先记录日志
  console.log('[SW] Data sync would happen here');
  return Promise.resolve();
}

// 消息处理（与主页面通信）
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
