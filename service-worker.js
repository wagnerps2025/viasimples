const CACHE_NAME = "viasimples-cache-v1";
const BASE_URL = self.location.origin + "/viasimples";

const FILES_TO_CACHE = [
  `${BASE_URL}/`,
  `${BASE_URL}/index.html`,
  `${BASE_URL}/style-viasimples.css`,
  `${BASE_URL}/03-simulador-script.js`,
  `${BASE_URL}/manifest.json`,
  `${BASE_URL}/icon-192.png`,
  `${BASE_URL}/icon-512.png`
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      const validFiles = [];

      for (const file of FILES_TO_CACHE) {
        try {
          const response = await fetch(file, { cache: "no-store" });
          if (response.ok) {
            validFiles.push(file);
          } else {
            console.warn(`⚠️ Ignorado (status ${response.status}): ${file}`);
          }
        } catch (err) {
          console.warn(`⚠️ Erro ao buscar: ${file}`, err);
        }
      }

      return cache.addAll(validFiles);
    }).catch(error => {
      console.error("❌ Falha ao adicionar arquivos ao cache:", error);
    })
  );
});

self.addEventListener("activate", event => {
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

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match(`${BASE_URL}/index.html`);
        }
      });
    })
  );
});
