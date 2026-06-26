// ভল্ট — Service Worker (Phase 3: অফলাইন সাপোর্ট)
const CACHE_NAME = 'vault-cache-v1';
const PRECACHE_URLS = [
  './',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) => cache.add(url).catch(() => {}))
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // POST/PUT/DELETE (Supabase লগইন/আপলোড/ডিলিট কল) — সরাসরি নেটওয়ার্কে যাবে, ক্যাশ করা হবে না
  if (req.method !== 'GET') return;

  // পেজ নেভিগেশন: নেটওয়ার্ক আগে, না পেলে ক্যাশ থেকে
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((res) => res || caches.match('./')))
    );
    return;
  }

  // বাকি সব GET রিকোয়েস্ট (CSS, ফন্ট, JS লাইব্রেরি, আইকন): নেটওয়ার্ক আগে, ফেইল হলে ক্যাশ থেকে
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(req, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
