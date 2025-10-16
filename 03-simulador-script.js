let mapaGoogle, directionsService, directionsRenderer;
let autocompleteOrigem, autocompleteDestino;
let coordenadasOrigem = null;
let coordenadasDestino = null;
let valorCorrida = 0;
let motoristaEmServico = null;

const db = window.db || (firebase?.firestore ? firebase.firestore() : null);

document.addEventListener("DOMContentLoaded", () => {
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
    const limparBtn = document.getElementById("botaoLimpar");
    if (limparBtn) limparBtn.style.display = "inline-block";
  });
};

function calcularValor(distanciaKm) {
  const taxaMinima = 20.00;
  const valorPorKm = 4.50;
  return Math.max(taxaMinima, distanciaKm * valorPorKm);
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
  const resultado = document.getElementById("resultadoCorrida");
  if (resultado) resultado.innerHTML = "❌ Corrida cancelada.";
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
  const resultado = document.getElementById("resultadoCorrida");
  if (resultado) resultado.innerHTML = "✅ Corrida finalizada com sucesso.";
}

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
