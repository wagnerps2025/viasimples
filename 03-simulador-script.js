let mapaGoogle, directionsService, directionsRenderer;
let autocompleteOrigem, autocompleteDestino;
let coordenadasOrigem = null;
let coordenadasDestino = null;
let valorCorrida = 0;
let motoristaEmServico = null;

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

window.calcularCorrida = function () {
  const origem = document.getElementById("origem").value.trim();
  const destino = document.getElementById("destino").value.trim();

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

function calcularValor(distanciaKm) {
  const taxaMinima = 5.00;
  const valorPorKm = 2.50;
  return Math.max(taxaMinima, distanciaKm * valorPorKm);
}

function listarMotoristasAtivos() {
  const lista = document.getElementById("listaMotoristas");
  lista.innerHTML = "";

  const motoristas = JSON.parse(localStorage.getItem("motoristas") || "[]");
  const ativos = motoristas.filter(m => m.ativo);

  if (ativos.length === 0) {
    lista.innerHTML = "<p>Nenhum motorista ativo disponível.</p>";
    return;
  }

  ativos.forEach(motorista => {
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
        motoristaEmServico
          ? `<div style="color: red; font-weight: bold;">🚧 Motorista em serviço</div>`
          : `<button onclick="enviarParaMotorista('${motorista.telefone}', '${motorista.nome}')">📲 Escolher este motorista</button>`
      }
    `;
    lista.appendChild(card);
  });

  if (motoristaEmServico) {
    const cancelarBtn = document.createElement("button");
    cancelarBtn.textContent = "❌ Cancelar motorista";
    cancelarBtn.style = "margin-top: 20px; background-color: #FF5252; color: white; font-weight: bold; padding: 10px; border: none; border-radius: 8px; cursor: pointer;";
    cancelarBtn.onclick = cancelarMotorista;
    lista.appendChild(cancelarBtn);
  }
}

window.enviarParaMotorista = function (telefoneBruto, nomeMotorista) {
  if (motoristaEmServico) {
    alert("Já existe um motorista em serviço. Cancele antes de chamar outro.");
    return;
  }

  const nomePassageiro = document.getElementById("nomePassageiro").value.trim();
  const origem = document.getElementById("origem").value.trim();
  const destino = document.getElementById("destino").value.trim();

  if (!nomePassageiro) {
    alert("Informe seu nome para solicitar a corrida.");
    return;
  }

  const numeroLimpo = telefoneBruto.replace(/\D+/g, "");
  const numeroWhatsApp = numeroLimpo.startsWith("55") ? numeroLimpo : "55" + numeroLimpo;

  const linkOrigem = `https://www.google.com/maps/search/?api=1&query=${coordenadasOrigem.lat()},${coordenadasOrigem.lng()}`;
  const linkDestino = `https://www.google.com/maps/search/?api=1&query=${coordenadasDestino.lat()},${coordenadasDestino.lng()}`;

  const mensagem = `Olá ${nomeMotorista}, sou ${nomePassageiro} e gostaria de solicitar uma corrida.\n\n💰 Valor estimado: R$ ${valorCorrida.toFixed(2)}\n📍 Origem: ${origem}\n🔗 ${linkOrigem}\n🎯 Destino: ${destino}\n🔗 ${linkDestino}`;

  const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
  window.open(linkWhatsApp, "_blank");

  motoristaEmServico = nomeMotorista;
  listarMotoristasAtivos();
};

function cancelarMotorista() {
  motoristaEmServico = null;
  listarMotoristasAtivos();
  alert("Motorista cancelado com sucesso.");
}

window.limparCampos = function () {
  document.getElementById("formSimulador").reset();
  document.getElementById("resultadoCorrida").innerHTML = "";
  document.getElementById("listaMotoristas").innerHTML = "";
  document.getElementById("botaoLimpar").style.display = "none";
  directionsRenderer.setDirections({ routes: [] });
  motoristaEmServico = null;
};
