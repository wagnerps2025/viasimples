// 🔌 Firebase Firestore
const db = window.db || (firebase?.firestore ? firebase.firestore() : null);

// 🌍 Variáveis globais
let mapaGoogle, directionsService, directionsRenderer;
let autocompleteOrigem, autocompleteDestino;
let coordenadasOrigem = null;
let coordenadasDestino = null;
let valorCorrida = 0;
let motoristaEmServico = null;

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase-config.js"; // ajuste conforme seu projeto

const valoresRef = doc(db, "configuracoes", "valoresPadrao");

onSnapshot(valoresRef, (snapshot) => {
  if (snapshot.exists()) {
    const { taxaMinima, valorPorKm } = snapshot.data();

    // Atualiza apenas os campos desejados
    const campoTaxa = document.getElementById("campoTaxaMinima");
    const campoKm = document.getElementById("campoValorPorKm");

    if (campoTaxa) campoTaxa.value = taxaMinima;
    if (campoKm) campoKm.value = valorPorKm;
  }
});


// 🔄 Carrega configurações da corrida do Firebase
async function carregarConfiguracoesCorridaFirebase() {
  if (!db) return;

  try {
    const doc = await db.collection("configuracoes").doc("valoresPadrao").get();
    if (doc.exists) {
      const config = doc.data();
      localStorage.setItem("configuracoesCorrida", JSON.stringify(config));
      console.log("📦 Configurações carregadas:", config);
    } else {
      console.warn("⚠️ Documento 'valoresPadrao' não encontrado na coleção 'configuracoes'");
    }
  } catch (error) {
    console.error("❌ Erro ao carregar configurações:", error);
  }
}

// 🚀 Inicializa simulador ao carregar a página
document.addEventListener("DOMContentLoaded", async () => {
  await carregarConfiguracoesCorridaFirebase();

  const corrida = JSON.parse(localStorage.getItem("corridaAtiva"));
  if (corrida) {
    motoristaEmServico = corrida.motorista;
    const resultado = document.getElementById("resultadoCorrida");
    if (resultado) {
      resultado.innerHTML = `
        🚧 Corrida ativa com ${corrida.motorista}<br>
        📍 Origem: ${corrida.origem}<br>
        🎯 Destino: ${corrida.destino}<br>
        💰 Valor: R$ ${corrida.valor.toFixed(2)}
      `;
    }
    listarMotoristasAtivos();
  }
});

// 🗺️ Função global exigida pelo Google Maps
window.initMap = function () {
  mapaGoogle = new google.maps.Map(document.getElementById("mapaGoogle"), {
    center: { lat: -23.0067, lng: -46.8466 },
    zoom: 14,
    mapTypeControl: false,
    fullscreenControl: false,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: false });
  directionsRenderer.setMap(mapaGoogle);

  const origemInput = document.getElementById("origem");
  const destinoInput = document.getElementById("destino");

  if (origemInput) {
    autocompleteOrigem = new google.maps.places.Autocomplete(origemInput, {
      componentRestrictions: { country: "br" },
      fields: ["formatted_address", "geometry"],
    });
  }

  if (destinoInput) {
    autocompleteDestino = new google.maps.places.Autocomplete(destinoInput, {
      componentRestrictions: { country: "br" },
      fields: ["formatted_address", "geometry"],
    });
  }
};

// 📍 Usa localização atual do usuário
window.usarLocalizacao = function () {
  if (!navigator.geolocation) {
    alert("Seu navegador não suporta geolocalização.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          document.getElementById("origem").value = results[0].formatted_address;
        } else {
          alert("Não foi possível converter coordenadas em endereço.");
        }
      });
    },
    err => {
      console.error("Erro de geolocalização:", err);
      alert("Não foi possível obter sua localização.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

// 💰 Calcula valor da corrida com base nas configurações atuais
function calcularValor(distanciaKm) {
  const config = JSON.parse(localStorage.getItem("configuracoesCorrida")) || {};
  const taxaMinima = typeof config.taxaMinima === "number" ? config.taxaMinima : 30;
  const valorPorKm = typeof config.valorPorKm === "number" ? config.valorPorKm : 10;
  return Math.max(taxaMinima, distanciaKm * valorPorKm);
}

// 🚗 Calcula rota e exibe resultado
window.calcularCorrida = function () {
  if (localStorage.getItem("corridaAtiva")) {
    alert("Você já tem uma corrida ativa. Finalize ou cancele antes de solicitar outra.");
    return;
  }

  const origem = document.getElementById("origem")?.value.trim();
  const destino = document.getElementById("destino")?.value.trim();

  if (!origem || !destino) {
    alert("Preencha origem e destino.");
    return;
  }

  const request = {
    origin: origem,
    destination: destino,
    travelMode: google.maps.TravelMode.DRIVING,
  };

  directionsService.route(request, (result, status) => {
    if (status !== "OK") {
      alert("Erro ao calcular rota: " + status);
      return;
    }

    directionsRenderer.setDirections(result);

    const route = result.routes[0].legs[0];
    coordenadasOrigem = route.start_location;
    coordenadasDestino = route.end_location;

    const distanciaKm = route.distance.value / 1000;
    const duracao = route.duration.text;
    valorCorrida = calcularValor(distanciaKm);

    const resultado = document.getElementById("resultadoCorrida");
    if (resultado) {
      resultado.innerHTML = `
        🛣️ Distância: ${route.distance.text}<br>
        ⏱️ Tempo estimado: ${duracao}<br>
        💰 Valor estimado: R$ ${valorCorrida.toFixed(2)}
      `;
    }

    listarMotoristasAtivos();
    document.getElementById("botaoLimpar").style.display = "inline-block";
  });
};
// 🚘 Lista motoristas ativos
async function listarMotoristasAtivos() {
  const lista = document.getElementById("listaMotoristas");
  if (!lista) return;

  lista.innerHTML = "";
  let motoristas = [];

  if (db) {
    try {
      const snapshot = await db.collection("motoristas").where("ativo", "==", true).get();
      snapshot.forEach(doc => motoristas.push(doc.data()));
    } catch (error) {
      console.warn("⚠️ Erro ao buscar motoristas:", error);
    }
  }

  if (motoristas.length === 0) {
    const local = JSON.parse(localStorage.getItem("motoristas") || "[]");
    motoristas = local.filter(m => m.ativo);
  }

  if (motoristas.length === 0) {
    lista.innerHTML = "<p>Nenhum motorista ativo disponível.</p>";
    return;
  }

  motoristas.forEach(motorista => {
    const card = document.createElement("div");
    card.className = "motorista-card ativo";
    card.innerHTML = `
      <div><strong>👤 ${motorista.nome}</strong></div>
      <div>🏷️ Marca: ${motorista.marca}</div>
      <div>🚗 Modelo: ${motorista.modelo}</div>
      <div>🚘 Tipo de carro: ${motorista["Tipo de carro"]}</div>
      <div>📅 Ano: ${motorista.ano}</div>
      <div>🔠 Placa: ${motorista.placa}</div>
      <div>🎨 Cor: ${motorista.cor}</div>
      <div>📞 Telefone: ${motorista.telefone}</div>
      ${
        motoristaEmServico === motorista.nome
          ? `<div style="color: red; font-weight: bold;">🚧 Motorista em serviço</div>`
          : `<button onclick="enviarParaMotorista('${motorista.telefone}', '${motorista.nome}')">📲 Escolher este motorista</button>`
      }
    `;
    lista.appendChild(card);
  });

  if (motoristaEmServico) {
    const cancelarBtn = document.createElement("button");
    cancelarBtn.textContent = "❌ Cancelar corrida";
    cancelarBtn.style = "background-color: #FF5252; color: white; font-weight: bold; padding: 10px; border: none; border-radius: 8px; cursor: pointer;";

    const finalizarBtn = document.createElement("button");
    finalizarBtn.textContent = "✅ Finalizar corrida";
    finalizarBtn.style = "background-color: #4CAF50; color: white; font-weight: bold; padding: 10px; border: none; border-radius: 8px; cursor: pointer;";

    const grupoBotoes = document.createElement("div");
    grupoBotoes.style = "display: flex; gap: 10px; margin-top: 20px; justify-content: center;";
    grupoBotoes.appendChild(cancelarBtn);
    grupoBotoes.appendChild(finalizarBtn);
    lista.appendChild(grupoBotoes);

    cancelarBtn.onclick = cancelarMotorista;
    finalizarBtn.onclick = finalizarCorrida;
  }
}

// 📲 Envia solicitação via WhatsApp
window.enviarParaMotorista = async function (telefoneBruto, nomeMotorista) {
  if (localStorage.getItem("corridaAtiva")) {
    alert("Você já tem uma corrida ativa. Finalize ou cancele antes de solicitar outra.");
    return;
  }

  const nomePassageiro = document.getElementById("nomePassageiro")?.value.trim();
  const origem = document.getElementById("origem")?.value.trim();
  const destino = document.getElementById("destino")?.value.trim();

  if (!nomePassageiro) {
    alert("Informe seu nome para solicitar a corrida.");
    return;
  }

  const numeroLimpo = telefoneBruto.replace(/\D+/g, "");
  const numeroWhatsApp = numeroLimpo.startsWith("55") ? numeroLimpo : "55" + numeroLimpo;

  const latOrigem = coordenadasOrigem?.lat?.();
  const lngOrigem = coordenadasOrigem?.lng?.();
  const latDestino = coordenadasDestino?.lat?.();
  const lngDestino = coordenadasDestino?.lng?.();

  const linkOrigem = latOrigem && lngOrigem
    ? `https://www.google.com/maps/search/?api=1&query=${latOrigem},${lngOrigem}`
    : "";
  const linkDestino = latDestino && lngDestino
    ? `https://www.google.com/maps/search/?api=1&query=${latDestino},${lngDestino}`
    : "";

  const mensagem = [
    `Olá ${nomeMotorista}, sou ${nomePassageiro} e gostaria de solicitar uma corrida.`,
    `💰 Valor estimado: R$ ${valorCorrida.toFixed(2)}`,
    `📍 Origem: ${origem}`,
    linkOrigem ? `🔗 ${linkOrigem}` : "",
    `🎯 Destino: ${destino}`,
    linkDestino ? `🔗 ${linkDestino}` : ""
  ].filter(Boolean).join("\n\n");

  const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
  window.open(linkWhatsApp, "_blank");

  motoristaEmServico = nomeMotorista;
  localStorage.setItem("corridaAtiva", JSON.stringify({
    motorista: nomeMotorista,
    passageiro: nomePassageiro,
    origem,
    destino,
    valor: valorCorrida
  }));

  listarMotoristasAtivos();

  if (db) {
    try {
      await db.collection("corridas").add({
        passageiro: nomePassageiro,
        motorista: nomeMotorista,
        origem,
        destino,
        valor: valorCorrida,
        data: new Date().toISOString()
      });
      console.log("✅ Corrida registrada no Firebase");
    } catch (error) {
      console.error("❌ Erro ao registrar corrida:", error);
    }
  }
};

// ❌ Cancela a corrida ativa
function cancelarMotorista() {
  motoristaEmServico = null;
  localStorage.removeItem("corridaAtiva");
  listarMotoristasAtivos();
  const resultado = document.getElementById("resultadoCorrida");
  if (resultado) resultado.innerHTML = "❌ Corrida cancelada.";
}

// ✅ Finaliza a corrida ativa
function finalizarCorrida() {
  const corrida = JSON.parse(localStorage.getItem("corridaAtiva"));
  if (!corrida) return;

  if (db) {
    db.collection("motoristas")
      .where("nome", "==", corrida.motorista)
      .get()
      .then(snapshot => {
        snapshot.forEach(doc => {
          doc.ref.update({ status: "disponível" });
        });
      });
  }

  localStorage.removeItem("corridaAtiva");
  motoristaEmServico = null;
  listarMotoristasAtivos();
  const resultado = document.getElementById("resultadoCorrida");
  if (resultado) resultado.innerHTML = "✅ Corrida finalizada com sucesso.";
}

// 🧹 Limpa todos os campos e reseta o simulador
window.limparCampos = function () {
  document.getElementById("formSimulador")?.reset();
  document.getElementById("resultadoCorrida").innerHTML = "";
  document.getElementById("listaMotoristas").innerHTML = "";
  document.getElementById("botaoLimpar").style.display = "none";
  directionsRenderer?.setDirections({ routes: [] });
  motoristaEmServico = null;
  coordenadasOrigem = null;
  coordenadasDestino = null;
  valorCorrida = 0;
  localStorage.removeItem("corridaAtiva");
};

window.addEventListener("load", () => {
  document.getElementById("campoTaxaMinima").value = "";
  document.getElementById("campoValorPorKm").value = "";
});

