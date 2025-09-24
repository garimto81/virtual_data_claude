/**
 * Service Worker - 오프라인 지원 및 캐싱
 * Version: 35.0.0
 */

const CACHE_NAME = 'poker-logger-v35';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/app.js',
  '/js/core/EventBus.js',
  '/js/core/StateManager.js',
  '/js/core/UIController.js',
  '/js/services/DataService.js',
  '/js/services/StorageService.js',
  '/js/components/HandInput.js',
  '/js/components/HandHistory.js',
  '/js/components/Statistics.js',
  '/js/components/Settings.js',
  '/js/utils/Toast.js',
  '/js/utils/Logger.js',
  '/manifest.json'
];

// 설치 이벤트
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('캐시 열기 성공');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('이전 캐시 삭제:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch 이벤트
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API 요청 처리
  if (url.origin.includes('script.google.com')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 성공적인 응답은 캐시에 저장
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // 네트워크 실패 시 캐시에서 반환
          return caches.match(request);
        })
    );
    return;
  }
  
  // 정적 리소스 처리
  event.respondWith(
    caches.match(request)
      .then(response => {
        // 캐시에 있으면 캐시에서 반환
        if (response) {
          return response;
        }
        
        // 캐시에 없으면 네트워크 요청
        return fetch(request).then(response => {
          // 404 응답은 캐시하지 않음
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // 응답 복사본을 캐시에 저장
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, responseToCache);
            });
          
          return response;
        });
      })
      .catch(() => {
        // 오프라인 폴백 페이지
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// 백그라운드 동기화
self.addEventListener('sync', event => {
  if (event.tag === 'sync-hands') {
    event.waitUntil(syncHands());
  }
});

// 푸시 알림
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '확인하기',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('포커 핸드 로거', options)
  );
});

// 알림 클릭 처리
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    // 앱 열기
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// 메시지 처리
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      })
    );
  }
});

// 동기화 함수
async function syncHands() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    const apiRequests = requests.filter(req => 
      req.url.includes('script.google.com')
    );
    
    for (const request of apiRequests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('동기화 실패:', error);
      }
    }
  } catch (error) {
    console.error('핸드 동기화 중 오류:', error);
  }
}

// 캐시 크기 관리
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    return trimCache(cacheName, maxItems);
  }
}

// 주기적 캐시 정리
setInterval(() => {
  trimCache(CACHE_NAME, 50);
}, 60000); // 1분마다 실행