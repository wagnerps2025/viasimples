function enviarSenha() {
  const nome = document.getElementById("nomeRecuperacao").value.trim();
  const mensagem = document.getElementById("mensagemRecuperacao");

  if (!nome) {
    mensagem.textContent = "Digite seu nome.";
    mensagem.style.color = "red";
    return;
  }

  if (nome !== "Wagner") {
    mensagem.textContent = "Nome não encontrado.";
    mensagem.style.color = "red";
    return;
  }

  // ✅ Correção: não exibe a senha diretamente
  mensagem.textContent = "✅ Sua senha foi enviada para o nome informado.";
  mensagem.style.color = "blue";

  // Aqui você pode integrar com um serviço real de envio futuramente
}

