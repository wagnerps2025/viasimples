const CACHE_NAME = "viasimples-cache-v1";
const FILES_TO_CACHE = [
  "/viasimples/",
  "/viasimples/index.html",
  "/viasimples/style-viasimples.css",
  "/viasimples/03-simulador-script.js",
  "/viasimples/manifest.json",
  "/viasimples/icon-192.png",
  "/viasimples/icon-512.png"
];

// ✅ Instalação do Service Worker
self.addEventListener("install", event => {
  console.log("✅ Service Worker instalado");
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    }).catch(error => {
      console.error("❌ Falha ao adicionar arquivos ao cache:", error);
    })
  );
});

// ✅ Ativação do Service Worker
self.addEventListener("activate", event => {
  console.log("🚀 Service Worker ativado");

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// ✅ Interceptação de requisições
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // Fallback para index.html em caso de falha offline
        return caches.match("/viasimples/index.html");
      });
    })
  );
});
