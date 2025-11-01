// app.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

// Corrige __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDZKV7Gpy1VCSMxVW__w3PDCyepwJ7Vv6c",
  authDomain: "viasimples-9d340.firebaseapp.com",
  projectId: "viasimples-9d340",
  storageBucket: "viasimples-9d340.appspot.com",
  messagingSenderId: "372389283187",
  appId: "1:372389283187:web:139f81f5224bb0958e7106"
};

// Inicializa Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Função para simular corrida
async function simularCorrida(distanciaKm) {
  try {
    const docRef = doc(db, "configuracoes", "valoresPadrao");
    const snapshot = await getDoc(docRef);

    if (snapshot.exists()) {
      const { taxaMinima, valorPorKm } = snapshot.data();
      const valor = Math.max(taxaMinima, distanciaKm * valorPorKm);
      console.log(`🧮 Distância: ${distanciaKm} km`);
      console.log(`💰 Valor da corrida: R$ ${valor.toFixed(2)}`);
    } else {
      console.warn("⚠️ Documento 'valoresPadrao' não encontrado.");
    }
  } catch (error) {
    console.error("❌ Erro ao simular corrida:", error);
  }
}

// Executa a simulação com 12 km
simularCorrida(12);

// Servidor Express
const app = express();
const PORT = 8080;

// 🔒 Desativa cache para garantir que arquivos atualizados sejam servidos
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Servir arquivos estáticos da pasta atual
app.use(express.static(__dirname));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`🚀 Aplicativo ViaSimples rodando em http://localhost:${PORT}`);
});
