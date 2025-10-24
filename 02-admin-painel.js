<script>
  const db = window.db || (firebase?.firestore ? firebase.firestore() : null);

  const listaContainer = document.getElementById("listaMotoristas");
  const semDados = document.getElementById("semDados");
  const campoBusca = document.getElementById("campoBusca");
  const tipoBusca = document.getElementById("tipoBusca");

  campoBusca?.addEventListener("keyup", filtrarMotoristas);

  // 🔄 Atualização em tempo real com o simulador
  function iniciarMonitoramentoMotoristas() {
    db.collection("motoristas").onSnapshot((snapshot) => {
      const motoristas = [];
      snapshot.forEach(doc => {
        const dados = doc.data();
        dados.firebaseId = doc.id;
        motoristas.push(dados);
      });

      motoristas.sort((a, b) => Number(a.id) - Number(b.id));
      localStorage.setItem("motoristas", JSON.stringify(motoristas));
      exibirMotoristas(motoristas);
    });
  }

  function exibirMotoristas(motoristas) {
    listaContainer.innerHTML = "";

    if (!motoristas.length) {
      semDados.style.display = "block";
      return;
    }

    semDados.style.display = "none";

    motoristas.forEach((motorista, index) => {
      const card = document.createElement("div");
      card.className = `motorista-card ${motorista.ativo ? "ativo" : "inativo"}`;

      let statusTexto = "";
      if (motorista.ativo) {
        switch (motorista.statusOperacional) {
          case "em_servico":
            statusTexto = `<div class="motorista-status-texto" style="color: red; font-weight: bold;">🚧 Em serviço</div>`;
            break;
          case "disponivel":
            statusTexto = `<div class="motorista-status-texto" style="color: green; font-weight: bold;">🟢 Disponível</div>`;
            break;
          default:
            statusTexto = `<div class="motorista-status-texto" style="color: gray;">⏳ Status indefinido</div>`;
        }
      }

      card.innerHTML = `
        <div class="motorista-id">🆔 ${motorista.id || "N/A"}</div>
        <div class="motorista-nome">👤 ${motorista.nome}</div>
        <div class="motorista-telefone">📞 ${motorista.telefone}</div>
        <div class="motorista-status">🔧 Cadastro: ${motorista.ativo ? "Ativo" : "Inativo"}</div>
        ${motorista.ativo ? statusTexto : ""}
        <button class="botao-status" onclick="alterarStatus(${index})">
          ${motorista.ativo ? "❌ Desativar" : "✅ Ativar"}
        </button>
      `;

      listaContainer.appendChild(card);
    });
  }

  async function alterarStatus(index) {
    const motoristas = JSON.parse(localStorage.getItem("motoristas") || "[]");
    const motorista = motoristas[index];

    motorista.ativo = !motorista.ativo;

    try {
      if (motorista.firebaseId) {
        const atualizacao = {
          ativo: motorista.ativo
        };

        if (motorista.ativo && !motorista.statusOperacional) {
          atualizacao.statusOperacional = "disponivel";
          motorista.statusOperacional = "disponivel";
        }

        if (!motorista.ativo) {
          atualizacao.statusOperacional = firebase.firestore.FieldValue.delete();
          delete motorista.statusOperacional;
        }

        await db.collection("motoristas").doc(motorista.firebaseId).update(atualizacao);
      }

      motoristas[index] = motorista;
      localStorage.setItem("motoristas", JSON.stringify(motoristas));
    } catch (error) {
      console.error("❌ Erro ao atualizar status no Firebase:", error);
      alert("❌ Falha ao salvar status no banco de dados.");
    }
  }
  
  async function alternarStatusMotorista() {
  const user = firebase.auth().currentUser;
  if (!user) return alert("Você precisa estar logado.");

  try {
    const snapshot = await db.collection("motoristas").where("uid", "==", user.uid).get();
    if (snapshot.empty) return alert("Motorista não encontrado.");

    const doc = snapshot.docs[0];
    const dados = doc.data();
    const novoStatus = !dados.ativo;

    const atualizacao = {
      ativo: novoStatus
    };

    if (novoStatus && !dados.statusOperacional) {
      atualizacao.statusOperacional = "disponivel";
    }

    if (!novoStatus) {
      atualizacao.statusOperacional = firebase.firestore.FieldValue.delete();
    }

    await doc.ref.update(atualizacao);

    document.getElementById("statusMotoristaPainel").innerHTML =
      `🟢 Seu status agora é: <strong>${novoStatus ? "Ativo" : "Inativo"}</strong>`;
  } catch (error) {
    console.error("❌ Erro ao alternar status:", error);
    alert("Erro ao atualizar status.");
  }
}

async function exibirStatusMotorista() {
  const user = firebase.auth().currentUser;
  if (!user) return;

  try {
    const snapshot = await db.collection("motoristas").where("uid", "==", user.uid).get();
    if (snapshot.empty) return;

    const dados = snapshot.docs[0].data();
    const status = dados.ativo ? "Ativo" : "Inativo";

    document.getElementById("statusMotoristaPainel").innerHTML =
      `🟢 Seu status atual: <strong>${status}</strong>`;
  } catch (error) {
    console.error("Erro ao buscar status do motorista:", error);
  }
}

firebase.auth().onAuthStateChanged(() => {
  exibirStatusMotorista();
});


  // 🔁 Inicializa o monitoramento ao carregar a página
  window.addEventListener("DOMContentLoaded", iniciarMonitoramentoMotoristas);
</script>



