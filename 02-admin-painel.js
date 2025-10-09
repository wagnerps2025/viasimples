// Simulação de banco de dados local
const motoristas = [
  { nome: "Carlos Silva", telefone: "(11) 98765-4321", ativo: true },
  { nome: "Fernanda Costa", telefone: "(11) 91234-5678", ativo: false },
  { nome: "João Oliveira", telefone: "(19) 99876-5432", ativo: true }
];

window.carregarMotoristas = function () {
  const lista = document.getElementById("listaMotoristas");
  lista.innerHTML = "";

  motoristas.forEach((motorista, index) => {
    const card = document.createElement("div");
    card.className = "cardMotorista";
    card.style.backgroundColor = motorista.ativo ? "#E8F5E9" : "#FBE9E7";

    card.innerHTML = `
      <strong>👤 ${motorista.nome}</strong><br>
      📞 ${motorista.telefone}<br>
      🔧 Status: <span style="font-weight:600; color:${motorista.ativo ? 'green' : 'red'}">
        ${motorista.ativo ? "Ativo" : "Inativo"}
      </span><br><br>
      <button type="button" onclick="alternarStatus(${index})">
        ${motorista.ativo ? "❌ Desativar" : "✅ Ativar"}
      </button>
    `;

    lista.appendChild(card);
  });
};

window.alternarStatus = function (index) {
  motoristas[index].ativo = !motoristas[index].ativo;
  carregarMotoristas();
};

// Carrega ao abrir
window.addEventListener("DOMContentLoaded", carregarMotoristas);
