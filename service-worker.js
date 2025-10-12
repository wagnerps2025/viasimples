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

// Instala o Service Worker e pré-carrega os arquivos essenciais
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

// Ativa o Service Worker e limpa caches antigos
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

// Intercepta requisições e responde com cache ou rede
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // Fallback para página inicial offline
        if (event.request.mode === "navigate") {
          return caches.match("/viasimples/index.html");
        }
      });
    })
  );
});
