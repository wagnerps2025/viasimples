let mapaGoogle, directionsService, directionsRenderer;
let autocompleteOrigem, autocompleteDestino;
let coordenadasOrigem = null;
let coordenadasDestino = null;
let valorCorrida = 0;
let motoristaEmServico = null;

const db = window.db || (firebase?.firestore ? firebase.firestore() : null);

// 🚀 Ao carregar a página
document.addEventListener("DOMContentLoaded", async () => {
  await carregarConfiguracoesCorrida();

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
});

// 🔧 Carrega configurações atualizadas do Firebase
async function carregarConfiguracoesCorrida() {
  if (db) {
    try {
      const doc = await db.collection("configuracoes").doc("valoresPadrao").get();
      if (doc.exists) {
        const config = doc.data();
        localStorage.setItem("configuracoesCorrida", JSON.stringify(config));
        console.log("✅ Configurações carregadas do Firebase:", config);
      } else {
        console.warn("⚠️ Configurações não encontradas no Firebase.");
      }
    } catch (error) {
      console.error("❌ Erro ao buscar configurações:", error);
    }
  }
}

// 🗺️ Inicializa o mapa
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

  autocompleteOrigem = new google.maps.places.Autocomplete(origemInput, {
    componentRestrictions: { country: "br" },
    fields: ["formatted_address", "geometry"],
  });

  autocompleteDestino = new google.maps.places.Autocomplete(destinoInput, {
    componentRestrictions: { country: "br" },
    fields: ["formatted_address", "geometry"],
  });
};

// 📍 Usa localização atual
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
      switch (err.code) {
        case 1: alert("Permissão de localização negada."); break;
        case 2: alert("Localização indisponível."); break;
        case 3: alert("Tempo de resposta excedido."); break;
        default: alert("Erro ao obter localização.");
      }
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

// 🔄 Atualiza configurações no banco e localStorage
async function atualizarConfiguracoesCorrida(taxaMinima, valorPorKm) {
  const novasConfig = {
    taxaMinima: parseFloat(taxaMinima),
    valorPorKm: parseFloat(valorPorKm),
  };

  localStorage.setItem("configuracoesCorrida", JSON.stringify(novasConfig));

  if (db) {
    try {
      await db.collection("configuracoes").doc("valoresPadrao").set(novasConfig);
      console.log("✅ Configurações atualizadas no Firebase");
    } catch (error) {
      console.error("❌ Erro ao atualizar configurações no Firebase:", error);
    }
  }
}
let mapaGoogle, directionsService, directionsRenderer;
let autocompleteOrigem, autocompleteDestino;
let coordenadasOrigem = null;
let coordenadasDestino = null;
let valorCorrida = 0;
let motoristaEmServico = null;

const db = window.db || (firebase?.firestore ? firebase.firestore() : null);

// 🚀 Ao carregar a página
document.addEventListener("DOMContentLoaded", async () => {
  await carregarConfiguracoesCorrida();

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
});

// 🔧 Carrega configurações atualizadas do Firebase
async function carregarConfiguracoesCorrida() {
  if (db) {
    try {
      const doc = await db.collection("configuracoes").doc("valoresPadrao").get();
      if (doc.exists) {
        const config = doc.data();
        localStorage.setItem("configuracoesCorrida", JSON.stringify(config));
        console.log("✅ Configurações carregadas do Firebase:", config);
      } else {
        console.warn("⚠️ Configurações não encontradas no Firebase.");
      }
    } catch (error) {
      console.error("❌ Erro ao buscar configurações:", error);
    }
  }
}

// 🔄 Atualiza configurações no banco e localStorage
async function atualizarConfiguracoesCorrida(taxaMinima, valorPorKm) {
  const novasConfig = {
    taxaMinima: parseFloat(taxaMinima),
    valorPorKm: parseFloat(valorPorKm),
  };

  localStorage.setItem("configuracoesCorrida", JSON.stringify(novasConfig));

  if (db) {
    try {
      await db.collection("configuracoes").doc("valoresPadrao").set(novasConfig);
      console.log("✅ Configurações atualizadas no Firebase");
    } catch (error) {
      console.error("❌ Erro ao atualizar configurações no Firebase:", error);
    }
  }
}

// 🗺️ Inicializa o mapa
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

  autocompleteOrigem = new google.maps.places.Autocomplete(origemInput, {
    componentRestrictions: { country: "br" },
    fields: ["formatted_address", "geometry"],
  });

  autocompleteDestino = new google.maps.places.Autocomplete(destinoInput, {
    componentRestrictions: { country: "br" },
    fields: ["formatted_address", "geometry"],
  });
};

// 📍 Usa localização atual
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
      alert("Erro ao obter localização.");
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

// 💰 Calcula valor da corrida com dados atualizados
function calcularValor(distanciaKm) {
  const config = JSON.parse(localStorage.getItem("configuracoesCorrida")) || {};
  const taxaMinima = config.taxaMinima ?? 20.00;
  const valorPorKm = config.valorPorKm ?? 7.00;
  return Math.max(taxaMinima, distanciaKm * valorPorKm);
}

// 🚗 Calcula rota e valor
window.calcularCorrida = function () {
  if (localStorage.getItem("corridaAtiva")) {
    alert("Você já tem uma corrida ativa.");
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

    document.getElementById("resultadoCorrida").innerHTML = `
      🛣️ Distância: ${route.distance.text}<br>
      ⏱️ Tempo estimado: ${duracao}<br>
      💰 Valor estimado: R$ ${valorCorrida.toFixed(2)}
    `;

    listarMotoristasAtivos();
    document.getElementById("botaoLimpar").style.display = "inline-block";
  });
};

// 📝 Atualiza valores dinamicamente
document.getElementById("taxaMinima").addEventListener("change", (e) => {
  const taxa = e.target.value;
  const valorKm = document.getElementById("valorPorKm").value;
  atualizarConfiguracoesCorrida(taxa, valorKm);
});

document.getElementById("valorPorKm").addEventListener("change", (e) => {
  const valorKm = e.target.value;
  const taxa = document.getElementById("taxaMinima").value;
  atualizarConfiguracoesCorrida(taxa, valorKm);
});

// 📋 Lista motoristas ativos
async function listarMotoristasAtivos() {
  const lista = document.getElementById("listaMotoristas");
  lista.innerHTML = "";

  let motoristas = [];

  if (db) {
    try {
      const snapshot = await db.collection("motoristas").where("ativo", "==", true).get();
      snapshot.forEach(doc => motoristas.push(doc.data()));
    } catch (error) {
      console.warn("Erro ao buscar motoristas:", error);
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
    cancelarBtn.onclick = cancelarMotorista;

    const finalizarBtn = document.createElement("button");
    finalizarBtn.textContent = "✅ Finalizar corrida";
    finalizarBtn.onclick = finalizarCorrida;

    const grupoBotoes = document.createElement("div");
    grupoBotoes.style = "display: flex; gap: 10px; margin-top: 20px; justify-content: center; flex-wrap: wrap;";
    grupoBotoes.appendChild(cancelarBtn);
    grupoBotoes.appendChild(finalizarBtn);
    lista.appendChild(grupoBotoes);
  }
}

// ❌ Cancela corrida ativa
function cancelarMotorista() {
  motoristaEmServico = null;
  localStorage.removeItem("corridaAtiva");
  listarMotoristasAtivos();
  document.getElementById("resultadoCorrida").innerHTML = "❌ Corrida cancelada.";
}

// ✅ Finaliza corrida ativa
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

// 🧹 Limpa campos e reseta simulador
window.limparCampos = function () {
  document.getElementById("formSimulador")?.reset();
  document.getElementById("resultadoCorrida").innerHTML = "";
  document.getElementById("listaMotoristas").innerHTML = "";
  document.getElementById("botaoLimpar").style.display = "none";
  directionsRenderer.setDirections({ routes: [] });
  motoristaEmServico = null;
  localStorage.removeItem("corridaAtiva");
};
