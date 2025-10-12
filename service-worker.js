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

// Instalação do Service Worker
self.addEventListener("install", event => {
  console.log("✅ Service Worker instalado");
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

// Ativação do Service Worker
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

// Interceptação de requisições
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Retorna do cache ou faz fetch da rede
      return response || fetch(event.request).catch(() => {
        // Fallback para index.html em caso de falha
        return caches.match("/viasimples/index.html");
      });
    })
  );
});
