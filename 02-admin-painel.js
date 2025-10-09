// Simulação de banco de dados local
const motoristas = [
  { id: 1, nome: "Carlos Silva", telefone: "(11) 98765-4321", ativo: true },
  { id: 2, nome: "Fernanda Costa", telefone: "(11) 91234-5678", ativo: false },
  { id: 3, nome: "João Oliveira", telefone: "(19) 99876-5432", ativo: true }
];

// Verifica tipo de usuário
const usuario = localStorage.getItem("usuario");
const podeEditar = usuario === "admin";

// Bloqueio de acesso
if (usuario !== "motorista" && usuario !== "admin") {
  document.body.innerHTML = `
    <main style="text-align:center; padding:60px; font-family:sans-serif;">
      <h2>🔒 Acesso restrito</h2>
      <p>Você precisa estar autenticado como <strong>administrador</strong> ou <strong>motorista</strong> para visualizar esta página.</p>
      <p>Redirecionando para login...</p>
    </main>
  `;
  setTimeout(() => {
    window.location.href = "00-login-admin.html";
  }, 2000);
}

// Função para carregar motoristas
window.carregarMotoristas = function () {
  const lista = document.getElementById("listaMotoristas");
  lista.innerHTML = "";

  motoristas.forEach((motorista, index) => {
    const card = document.createElement("div");
    card.className = `motorista-card ${motorista.ativo ? 'ativo' : 'inativo'}`;

    let botaoHTML = "";
    if (podeEditar) {
      botaoHTML = `
        <button class="botao-status" onclick="alterarStatus(${index})">
          ${motorista.ativo ? "❌ Desativar" : "✅ Ativar"}
        </button>
      `;
    }

    card.innerHTML = `
      <div class="motorista-id">🆔 ${motorista.id}</div>
      <div class="motorista-nome">👤 ${motorista.nome}</div>
      <div class="motorista-telefone">📞 ${motorista.telefone}</div>
      <div class="motorista-status ${motorista.ativo ? 'ativo' : 'inativo'}">
        🔧 Status: ${motorista.ativo ? "Ativo" : "Inativo"}
      </div>
      ${botaoHTML}
    `;

    lista.appendChild(card);
  });
};

// Função para alterar status (somente admin)
window.alterarStatus = function (index) {
  if (!podeEditar) return;
  motoristas[index].ativo = !motoristas[index].ativo;
  carregarMotoristas();
};

// Carrega ao abrir
window.addEventListener("DOMContentLoaded", carregarMotoristas);
