const listaContainer = document.getElementById("listaMotoristas");
const semDados = document.getElementById("semDados");
const campoBusca = document.getElementById("campoBusca");
const tipoBusca = document.getElementById("tipoBusca");

campoBusca.addEventListener("keyup", filtrarMotoristas);

function carregarMotoristas() {
  const motoristas = JSON.parse(localStorage.getItem("motoristas") || "[]");
  listaContainer.innerHTML = "";

  if (motoristas.length === 0) {
    semDados.style.display = "block";
    return;
  }

  semDados.style.display = "none";

  motoristas.forEach((motorista, index) => {
    const card = document.createElement("div");
    card.className = "motorista-card";

    card.innerHTML = `
      <label>ID:</label>
      <input type="text" value="${motorista.id}" id="id-${index}" disabled />

      <label>Nome:</label>
      <input type="text" value="${motorista.nome}" id="nome-${index}" />

      <label>Telefone:</label>
      <input type="text" value="${motorista.telefone}" id="telefone-${index}" />

      <label>Marca:</label>
      <input type="text" value="${motorista.marca}" id="marca-${index}" />

      <label>Modelo:</label>
      <input type="text" value="${motorista.modelo}" id="modelo-${index}" />

      <label>Ano:</label>
      <input type="number" value="${motorista.ano}" id="ano-${index}" />

      <label>Tipo de Placa:</label>
      <input type="text" value="${motorista.tipoPlaca}" id="tipoPlaca-${index}" />

      <label>Placa:</label>
      <input type="text" value="${motorista.placa}" id="placa-${index}" />

      <div class="botoes">
        <button class="editar" onclick="editarMotorista(${index})">Salvar</button>
        <button class="excluir" onclick="excluirMotorista(${index})">Excluir</button>
      </div>
    `;

    listaContainer.appendChild(card);
  });
}

function editarMotorista(index) {
  const motoristas = JSON.parse(localStorage.getItem("motoristas") || "[]");

  motoristas[index] = {
    id: document.getElementById(`id-${index}`).value,
    nome: document.getElementById(`nome-${index}`).value.trim(),
    telefone: document.getElementById(`telefone-${index}`).value.trim(),
    marca: document.getElementById(`marca-${index}`).value.trim(),
    modelo: document.getElementById(`modelo-${index}`).value.trim(),
    ano: document.getElementById(`ano-${index}`).value.trim(),
    tipoPlaca: document.getElementById(`tipoPlaca-${index}`).value.trim(),
    placa: document.getElementById(`placa-${index}`).value.trim().toUpperCase(),
    ativo: true
  };

  localStorage.setItem("motoristas", JSON.stringify(motoristas));
  alert("✅ Dados atualizados com sucesso!");
  carregarMotoristas();
}

function excluirMotorista(index) {
  const motoristas = JSON.parse(localStorage.getItem("motoristas") || "[]");
  if (confirm("Deseja realmente excluir este motorista?")) {
    motoristas.splice(index, 1);
    localStorage.setItem("motoristas", JSON.stringify(motoristas));
    carregarMotoristas();
  }
}

function filtrarMotoristas() {
  const tipo = tipoBusca.value;
  const termo = campoBusca.value.trim().toLowerCase();
  const motoristas = JSON.parse(localStorage.getItem("motoristas") || "[]");

  const filtrados = motoristas.filter(m => {
    const campo = m[tipo]?.toLowerCase();
    return campo && campo.includes(termo);
  });

  listaContainer.innerHTML = "";

  if (filtrados.length === 0) {
    listaContainer.innerHTML = "<p style='text-align:center; font-weight:bold;'>Nenhum resultado encontrado.</p>";
    return;
  }

  filtrados.forEach((motorista, index) => {
    const card = document.createElement("div");
    card.className = "motorista-card";

    card.innerHTML = `
      <label>ID:</label>
      <input type="text" value="${motorista.id}" id="id-${index}" disabled />

      <label>Nome:</label>
      <input type="text" value="${motorista.nome}" id="nome-${index}" />

      <label>Telefone:</label>
      <input type="text" value="${motorista.telefone}" id="telefone-${index}" />

      <label>Marca:</label>
      <input type="text" value="${motorista.marca}" id="marca-${index}" />

      <label>Modelo:</label>
      <input type="text" value="${motorista.modelo}" id="modelo-${index}" />

      <label>Ano:</label>
      <input type="number" value="${motorista.ano}" id="ano-${index}" />

      <label>Tipo de Placa:</label>
      <input type="text" value="${motorista.tipoPlaca}" id="tipoPlaca-${index}" />

      <label>Placa:</label>
      <input type="text" value="${motorista.placa}" id="placa-${index}" />

      <div class="botoes">
        <button class="editar" onclick="editarMotorista(${index})">Salvar</button>
        <button class="excluir" onclick="excluirMotorista(${index})">Excluir</button>
      </div>
    `;

    listaContainer.appendChild(card);
  });
}

carregarMotoristas();
