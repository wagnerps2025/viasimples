// ✅ Firebase Firestore (assume que firebase já foi inicializado no HTML)
const db = window.db || (firebase?.firestore ? firebase.firestore() : null);

// ✅ Elementos da interface
const listaContainer = document.getElementById("listaMotoristas");
const semDados = document.getElementById("semDados");
const campoBusca = document.getElementById("campoBusca");
const tipoBusca = document.getElementById("tipoBusca");

campoBusca?.addEventListener("keyup", filtrarMotoristas);

// 🔄 Carrega motoristas do Firebase e sincroniza com localStorage
async function carregarMotoristas() {
  let locais = JSON.parse(localStorage.getItem("motoristas") || "[]");
  let atualizados = [...locais];

  try {
    const snapshot = await db.collection("motoristas").get();
    snapshot.forEach(doc => {
      const dados = doc.data();
      dados.firebaseId = doc.id;

      const indexLocal = atualizados.findIndex(m => m.placa === dados.placa);
      if (indexLocal >= 0) {
        atualizados[indexLocal] = { ...dados };
      } else {
        atualizados.push(dados);
      }
    });

    localStorage.setItem("motoristas", JSON.stringify(atualizados));
    exibirMotoristas(atualizados);
  } catch (error) {
    console.error("⚠️ Erro ao carregar motoristas do Firebase:", error);
    exibirMotoristas(locais); // fallback local
  }
}

// 🧾 Exibe motoristas na interface de administração
function exibirMotoristas(motoristas) {
  listaContainer.innerHTML = "";

  if (!motoristas.length) {
    semDados.style.display = "block";
    return;
  }

  semDados.style.display = "none";

  motoristas.forEach((motorista, index) => {
    const card = document.createElement("div");
    card.className = `motorista-card ${motorista.ativo ? 'ativo' : 'inativo'}`;

    card.innerHTML = `
      <label>ID:</label>
      <input type="text" value="${motorista.id || ''}" id="id-${index}" disabled />

      <label>Nome:</label>
      <input type="text" value="${motorista.nome || ''}" id="nome-${index}" />

      <label>Telefone:</label>
      <input type="text" value="${motorista.telefone || ''}" id="telefone-${index}" />

      <label>Marca:</label>
      <input type="text" value="${motorista.marca || ''}" id="marca-${index}" />

      <label>Modelo:</label>
      <input type="text" value="${motorista.modelo || ''}" id="modelo-${index}" />

      <label>Ano:</label>
      <input type="number" value="${motorista.ano || ''}" id="ano-${index}" />

      <label>Tipo de Placa:</label>
      <input type="text" value="${motorista.tipoPlaca || ''}" id="tipoPlaca-${index}" />

      <label>Placa:</label>
      <input type="text" value="${motorista.placa || ''}" id="placa-${index}" />

      <label>Status:</label>
      <select id="ativo-${index}">
        <option value="true" ${motorista.ativo ? "selected" : ""}>Ativo</option>
        <option value="false" ${!motorista.ativo ? "selected" : ""}>Desativado</option>
      </select>

      <div class="botoes">
        <button class="editar" onclick="editarMotorista(${index})">💾 Salvar</button>
        <button class="excluir" onclick="excluirMotorista(${index})">🗑️ Excluir</button>
      </div>
    `;

    listaContainer.appendChild(card);
  });
}

// 💾 Edita e salva motorista no localStorage e Firebase
async function editarMotorista(index) {
  const motoristas = JSON.parse(localStorage.getItem("motoristas") || "[]");

  const motorista = {
    id: document.getElementById(`id-${index}`).value,
    nome: document.getElementById(`nome-${index}`).value.trim(),
    telefone: document.getElementById(`telefone-${index}`).value.trim(),
    marca: document.getElementById(`marca-${index}`).value.trim(),
    modelo: document.getElementById(`modelo-${index}`).value.trim(),
    ano: document.getElementById(`ano-${index}`).value.trim(),
    tipoPlaca: document.getElementById(`tipoPlaca-${index}`).value.trim(),
    placa: document.getElementById(`placa-${index}`).value.trim().toUpperCase(),
    ativo: document.getElementById(`ativo-${index}`).value === "true",
    firebaseId: motoristas[index].firebaseId || null
  };

  motoristas[index] = motorista;
  localStorage.setItem("motoristas", JSON.stringify(motoristas));

  try {
    if (motorista.firebaseId) {
      await db.collection("motoristas").doc(motorista.firebaseId).set(motorista);
    } else {
      const ref = await db.collection("motoristas").add(motorista);
      motorista.firebaseId = ref.id;
      motoristas[index].firebaseId = ref.id;
      localStorage.setItem("motoristas", JSON.stringify(motoristas));
    }
    alert("✅ Motorista salvo com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao salvar no Firebase:", error);
    alert("❌ Falha ao salvar no banco de dados.");
  }

  carregarMotoristas();
}

// 🗑️ Exclui motorista localmente e no Firebase
async function excluirMotorista(index) {
  const motoristas = JSON.parse(localStorage.getItem("motoristas") || "[]");
  const motorista = motoristas[index];

  if (confirm(`Deseja realmente excluir o motorista ${motorista.nome}?`)) {
    motoristas.splice(index, 1);
    localStorage.setItem("motoristas", JSON.stringify(motoristas));

    try {
      if (motorista.firebaseId) {
        await db.collection("motoristas").doc(motorista.firebaseId).delete();
      }
    } catch (error) {
      console.error("❌ Erro ao excluir do Firebase:", error);
      alert("❌ Falha ao excluir no banco de dados.");
    }

    carregarMotoristas();
  }
}

// 🔍 Filtra motoristas por campo
function filtrarMotoristas() {
  const tipo = tipoBusca.value;
  const termo = campoBusca.value.trim().toLowerCase();
  const motoristas = JSON.parse(localStorage.getItem("motoristas") || "[]");

  const filtrados = motoristas.filter(m => {
    const campo = m[tipo]?.toLowerCase();
    return campo && campo.includes(termo);
  });

  exibirMotoristas(filtrados);
}

// 🚀 Inicializa ao carregar a página
window.onload = carregarMotoristas;
