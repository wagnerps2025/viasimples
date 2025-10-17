// app.js
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
