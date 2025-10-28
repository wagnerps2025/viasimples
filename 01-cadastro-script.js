const form = document.getElementById("formMotorista");
const mensagem = document.getElementById("mensagemCadastro");
const contador = document.getElementById("contadorMotoristas");
const usuario = localStorage.getItem("usuario");

// Bloqueia alterações se o usuário for um motorista
if (usuario === "motorista") {
  Array.from(form.elements).forEach(el => el.disabled = true);
  const botaoCadastrar = form.querySelector('button[type="submit"]');
  if (botaoCadastrar) botaoCadastrar.style.display = "none";
  mensagem.innerText = "🔒 Visualização apenas. Motoristas não podem alterar os dados.";
}

function capitalizarTexto(texto) {
  return texto
    .toLowerCase()
    .split(" ")
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function formatarTelefone(valor) {
  valor = valor.replace(/\D/g, "");
  if (valor.length === 10) {
    return valor.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  } else if (valor.length === 11) {
    return valor.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return valor;
}

function formatarPlaca(valor) {
  valor = valor.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (valor.length > 3) {
    return valor.slice(0, 3) + '-' + valor.slice(3);
  }
  return valor;
}

function limparFormulario() {
  form.reset();
}

function atualizarContador() {
  const lista = JSON.parse(localStorage.getItem("motoristas") || "[]");
  contador.innerText = `Total de motoristas cadastrados: ${lista.length}`;
}

function gerarIdSequencial() {
  const lista = JSON.parse(localStorage.getItem("motoristas") || "[]");
  const proximoNumero = lista.length + 1;
  return String(proximoNumero).padStart(3, '0');
}

// Capitalização e formatação de campos
document.getElementById("nome").addEventListener("blur", e => {
  e.target.value = capitalizarTexto(e.target.value);
});
document.getElementById("marca").addEventListener("blur", e => {
  e.target.value = capitalizarTexto(e.target.value);
});
document.getElementById("modelo").addEventListener("blur", e => {
  e.target.value = capitalizarTexto(e.target.value);
});
document.getElementById("cor").addEventListener("blur", e => {
  e.target.value = capitalizarTexto(e.target.value);
});
document.getElementById("telefone").addEventListener("blur", e => {
  e.target.value = formatarTelefone(e.target.value);
});
document.getElementById("placa").addEventListener("blur", e => {
  e.target.value = formatarPlaca(e.target.value);
});

// Cadastro de motorista no localStorage
form.addEventListener("submit", function (e) {
  e.preventDefault();

  const motorista = {
    id: gerarIdSequencial(),
    nome: document.getElementById("nome").value.trim(),
    telefone: document.getElementById("telefone").value.trim(),
    marca: document.getElementById("marca").value.trim(),
    modelo: document.getElementById("modelo").value.trim(),
    cor: document.getElementById("cor").value.trim(),
    "Tipo de carro": document.getElementById("tipoCarro").value,
    ano: document.getElementById("ano").value.trim(),
    tipoPlaca: document.getElementById("tipoPlaca").value,
    placa: document.getElementById("placa").value.trim().toUpperCase(),
    ativo: true
  };

  const lista = JSON.parse(localStorage.getItem("motoristas") || "[]");
  lista.push(motorista);
  localStorage.setItem("motoristas", JSON.stringify(lista));

  mensagem.innerText = `✅ Motorista ${motorista.nome} cadastrado com sucesso! (ID: ${motorista.id})`;
  atualizarContador();
  limparFormulario();
});

// Novo: Preenche seletor de motoristas para envio ao Firebase
const seletor = document.getElementById("seletorMotorista");
const motoristasSalvos = JSON.parse(localStorage.getItem("motoristas") || []);
motoristasSalvos.forEach(m => {
  const option = document.createElement("option");
  option.value = m.id;
  option.textContent = `${m.nome} (ID: ${m.id})`;
  seletor.appendChild(option);
});

// Botão para enviar motorista selecionado ao Firebase
document.getElementById("btnSalvarFirebase").addEventListener("click", function () {
  const idSelecionado = seletor.value;
  const motoristaSelecionado = motoristasSalvos.find(m => m.id === idSelecionado);

  if (!motoristaSelecionado) {
    alert("Motorista não encontrado.");
    return;
  }

  salvarNoFirebase(motoristaSelecionado);
});

// Função de envio ao Firebase
function salvarNoFirebase(motorista) {
  firebase.firestore().collection("motoristas").doc(motorista.id).set(motorista)
    .then(() => alert(`🚀 Motorista ${motorista.nome} enviado ao Firebase com sucesso!`))
    .catch(err => console.error("Erro ao salvar no Firebase:", err));
}

atualizarContador();

