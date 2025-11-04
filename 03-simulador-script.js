let mapaGoogle;
let autocompleteOrigem, autocompleteDestino;
let coordenadasOrigem = null;
let coordenadasDestino = null;
let valorCorrida = 0;
let motoristaEmServico = null;
let configuracoesCorrida = { taxaMinima: 0, valorPorKm: 0 };
let distanciaTexto = "";
let duracaoTexto = "";

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
  }

  configuracoesCorrida = await obterConfiguracoesCorrida();
  listarMotoristasAtivos();
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
      fields: ["place_id", "geometry", "name", "formatted_address"]
    });

    autocompleteDestino = new google.maps.places.Autocomplete(destinoInput, {
      componentRestrictions: { country: "br" },
      fields: ["place_id", "geometry", "name", "formatted_address"]
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
    const doc = await db.collection("configuracoes").doc("valoresPadrao").get({ source: "server" });
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
    distanciaTexto = route.distance.text;
    duracaoTexto = route.duration.text;

    valorCorrida = Math.max(configuracoesCorrida.taxaMinima, distanciaKm * configuracoesCorrida.valorPorKm);

    document.getElementById("resultadoCorrida").innerHTML = `
      🛣️ Distância: ${distanciaTexto}<br>
      ⏱️ Tempo estimado: ${duracaoTexto}<br>
      💰 Valor estimado: R$ ${valorCorrida.toFixed(2)}
    `;

    listarMotoristasAtivos();
    document.getElementById("botaoLimpar").style.display = "inline-block";
  });
};
async function listarMotoristasAtivos() {
  const lista = document.getElementById("listaMotoristas");
  lista.innerHTML = "";

  if (!db) {
    lista.innerHTML = "<p>Firebase não está disponível.</p>";
    return;
  }

  db.collection("motoristas")
    .where("ativo", "==", true)
    .onSnapshot(snapshot => {
      lista.innerHTML = "";
      let motoristas = [];

      snapshot.forEach(doc => {
        const dados = doc.data();
        motoristas.push({ ...dados, id: doc.id });
      });

      if (motoristas.length === 0) {
        lista.innerHTML = "<p>Nenhum motorista ativo disponível.</p>";
        return;
      }

      motoristas
        .filter(m => m.statusAtual !== "desligado")
        .forEach(motorista => {
          const emServico = motorista.statusAtual === "em_servico";
          const statusTexto = emServico
            ? `<div style="color: red; font-weight: bold;">🚧 Motorista em serviço</div>`
            : `<div style="color: green; font-weight: bold;">🟢 Aguardando corrida</div>`;

          const card = document.createElement("div");
          card.className = "motorista-card ativo";
          card.innerHTML = `
            <div><strong>👤 ${motorista.nome}</strong></div>
            <div>🏷️ Marca: ${motorista.marca}</div>
            <div>🚗 Modelo: ${motorista.modelo}</div>
            <div>🚘 Tipo de carro: ${motorista["Tipo de carro"] || motorista.tipoCarro || "N/A"}</div>
            <div>📅 Ano: ${motorista.ano}</div>
            <div>🔠 Placa: ${motorista.placa}</div>
            <div>🎨 Cor: ${motorista.cor}</div>
            <div>📞 Telefone: ${motorista.telefone}</div>
            ${statusTexto}
            ${
              !emServico
                ? `<button onclick="enviarParaMotorista('${motorista.telefone}', '${motorista.nome}', '${motorista.id}')">📲 Escolher este motorista</button>`
                : ""
            }
          `;
          lista.appendChild(card);
        });

      const corrida = JSON.parse(localStorage.getItem("corridaAtiva"));
      if (corrida) {
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
    });
}

window.enviarParaMotorista = async function (telefoneBruto, nomeMotorista, motoristaId) {
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

  const mensagem = `Olá ${nomeMotorista}, sou ${nomePassageiro} e gostaria de solicitar uma corrida.\n\n` +
    `🛣️ Distância: ${distanciaTexto}\n` +
    `⏱️ Tempo estimado: ${duracaoTexto}\n` +
    `💰 Valor estimado: R$ ${valorCorrida.toFixed(2)}\n\n` +
    `📍 Origem: ${origem}\n🔗 ${linkOrigem} (buscar)\n\n` +
    `🎯 Destino: ${destino}\n🔗 ${linkDestino} (entregar)`;

  const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
  window.open(linkWhatsApp, "_blank");

  motoristaEmServico = nomeMotorista;
  localStorage.setItem("motoristaId", motoristaId);
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
        motoristaId,
        passageiro: nomePassageiro,
        motorista: nomeMotorista,
        origem,
        destino,
        valor: parseFloat(valorCorrida.toFixed(2)),
        distancia: distanciaTexto,
        duracao: duracaoTexto,
        inicio: new Date(),
        status: "em_andamento"
      });

      await db.collection("motoristas").doc(motoristaId).update({ statusAtual: "em_servico" });

      console.log("✅ Corrida registrada e status atualizado");
    } catch (error) {
      console.error("❌ Erro ao registrar corrida ou atualizar status:", error);
    }
  }
};

function cancelarMotorista() {
  const corrida = JSON.parse(localStorage.getItem("corridaAtiva"));
  const motoristaId = localStorage.getItem("motoristaId");

  if (corrida && db && motoristaId) {
    db.collection("motoristas").doc(motoristaId).update({ statusAtual: "aguardando" });
  }

  motoristaEmServico = null;
  localStorage.removeItem("corridaAtiva");
  localStorage.removeItem("motoristaId");
  listarMotoristasAtivos();
  document.getElementById("resultadoCorrida").innerHTML = "❌ Corrida cancelada.";
}

function finalizarCorrida() {
  const corrida = JSON.parse(localStorage.getItem("corridaAtiva"));
  const motoristaId = localStorage.getItem("motoristaId");

  if (!corrida || !motoristaId) return;

  if (db) {
    db.collection("motoristas").doc(motoristaId).update({ statusAtual: "aguardando" });
  }

  localStorage.removeItem("corridaAtiva");
  localStorage.removeItem("motoristaId");
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
  distanciaTexto = "";
  duracaoTexto = "";
  localStorage.removeItem("corridaAtiva");
  localStorage.removeItem("motoristaId");
};
