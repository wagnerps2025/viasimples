let mapaGoogle;
let autocompleteOrigem, autocompleteDestino;
let coordenadasOrigem = null;
let coordenadasDestino = null;
let valorCorrida = 0;
let motoristaEmServico = null;

window.db = window.db || (firebase?.firestore ? firebase.firestore() : null);

document.addEventListener("DOMContentLoaded", async () => {
  const corrida = JSON.parse(localStorage.getItem("corridaAtiva"));
  if (corrida) {
    motoristaEmServico = corrida.motorista;
    document.getElementById("resultadoCorrida").innerHTML = `
      🚧 Corrida ativa com ${corrida.motorista}<br>
      📍 Origem: ${corrida.origem}<br>
      🎯 Destino: ${corrida.destino}<br>
      💰 Valor: R$ ${corrida.valor.toFixed(2)}
    `;
    listarMotoristasAtivos();
  }

  // ✅ Revalida configurações ao iniciar
  const { taxaMinima, valorPorKm } = await obterConfiguracoesCorrida();
  console.log("Configuração atual:", { taxaMinima, valorPorKm });
});

window.initMap = function () {
  mapaGoogle = new google.maps.Map(document.getElementById("mapaGoogle"), {
    center: { lat: -23.0067, lng: -46.8466 },
    zoom: 14,
    mapTypeControl: false,
    fullscreenControl: false,
  });

  window.directionsService = new google.maps.DirectionsService();
  window.directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: false });
  window.directionsRenderer.setMap(mapaGoogle);

  const origemInput = document.getElementById("origem");
  const destinoInput = document.getElementById("destino");

  if (origemInput && destinoInput) {
    autocompleteOrigem = new google.maps.places.Autocomplete(origemInput, {
      componentRestrictions: { country: "br" },
      fields: ["formatted_address", "geometry"],
    });

    autocompleteDestino = new google.maps.places.Autocomplete(destinoInput, {
      componentRestrictions: { country: "br" },
      fields: ["formatted_address", "geometry"],
    });
  }
};

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

async function obterConfiguracoesCorrida() {
  try {
    const doc = await window.db
      .collection("configuracoes")
      .doc("valoresPadrao")
      .get({ source: "server" }); // ✅ ignora cache

    if (!doc.exists) throw new Error("Documento de configurações não encontrado.");
    const dados = doc.data();
    return {
      taxaMinima: parseFloat(dados.taxaMinima) || 0,
      valorPorKm: parseFloat(dados.valorPorKm) || 0
    };
  } catch (erro) {
    console.error("Erro ao buscar configurações:", erro);
    return { taxaMinima: 0, valorPorKm: 0 };
  }
}

window.calcularCorrida = async function () {
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

  window.directionsService.route(request, async (result, status) => {
    if (status !== "OK") {
      alert("Erro ao calcular rota: " + status);
      return;
    }

    window.directionsRenderer.setDirections(result);

    const route = result.routes[0].legs[0];
    coordenadasOrigem = route.start_location;
    coordenadasDestino = route.end_location;

    const distanciaKm = route.distance.value / 1000;
    const duracao = route.duration.text;

    const { taxaMinima, valorPorKm } = await obterConfiguracoesCorrida();
    valorCorrida = Math.max(taxaMinima, distanciaKm * valorPorKm);

    document.getElementById("resultadoCorrida").innerHTML = `
      🛣️ Distância: ${route.distance.text}<br>
      ⏱️ Tempo estimado: ${duracao}<br>
      💰 Valor estimado: R$ ${valorCorrida.toFixed(2)}
    `;

    listarMotoristasAtivos();
    document.getElementById("botaoLimpar").style.display = "inline-block";
  });
};
async function listarMotoristasAtivos() {
  const lista = document.getElementById("listaMotoristas");
  lista.innerHTML = "";

  let motoristas = [];

  if (db) {
    try {
      const snapshot = await db.collection("motoristas").where("ativo", "==", true).get();
      snapshot.forEach(doc => motoristas.push(doc.data()));
    } catch (error) {
      console.warn("⚠️ Erro ao buscar motoristas do Firebase:", error);
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
    cancelarBtn.style = "background-color: #FF5252; color: white; font-weight: bold; padding: 10px; border: none; border-radius: 8px; cursor: pointer; flex: 1; min-width: 140px;";

    const finalizarBtn = document.createElement("button");
    finalizarBtn.textContent = "✅ Finalizar corrida";
    finalizarBtn.style = "background-color: #4CAF50; color: white; font-weight: bold; padding: 10px; border: none; border-radius: 8px; cursor: pointer; flex: 1; min-width: 140px;";

    cancelarBtn.onclick = cancelarMotorista;
    finalizarBtn.onclick = finalizarCorrida;

    const grupoBotoes = document.createElement("div");
    grupoBotoes.style = "display: flex; gap: 10px; margin-top: 20px; justify-content: center; flex-wrap: wrap;";
    grupoBotoes.appendChild(cancelarBtn);
    grupoBotoes.appendChild(finalizarBtn);
    lista.appendChild(grupoBotoes);
  }
}

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

  const mensagem = `Olá ${nomeMotorista}, sou ${nomePassageiro} e gostaria de solicitar uma corrida.\n\n💰 Valor estimado: R$ ${valorCorrida.toFixed(2)}\n📍 Origem: ${origem}\n🔗 ${linkOrigem}\n🎯 Destino: ${destino}\n🔗 ${linkDestino}`;
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

function cancelarMotorista() {
  motoristaEmServico = null;
  localStorage.removeItem("corridaAtiva");
  listarMotoristasAtivos();
  document.getElementById("resultadoCorrida").innerHTML = "❌ Corrida cancelada.";
}

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
  document.getElementById("resultadoCorrida").innerHTML = "✅ Corrida finalizada com sucesso.";
}

window.limparCampos = function () {
  document.getElementById("formSimulador")?.reset();
  document.getElementById("resultadoCorrida").innerHTML = "";
  document.getElementById("listaMotoristas").innerHTML = "";
  document.getElementById("botaoLimpar").style.display = "none";
  window.directionsRenderer.setDirections({ routes: [] });
  motoristaEmServico = null;
  coordenadasOrigem = null;
  coordenadasDestino = null;
  valorCorrida = 0;
  localStorage.removeItem("corridaAtiva");
};
