<script>
  const form = document.getElementById("formMotorista");
  const mensagem = document.getElementById("mensagemCadastro");
  const contador = document.getElementById("contadorMotoristas");

  const usuario = localStorage.getItem("usuario");

  if (usuario === "motorista") {
    Array.from(form.elements).forEach(el => el.disabled = true);
    const botaoCadastrar = form.querySelector('button[type="submit"]');
    if (botaoCadastrar) botaoCadastrar.style.display = "none";
    mensagem.innerText = "🔒 Visualização apenas. Motoristas não podem alterar os dados.";
  }

  function capitalizarTexto(texto) {
    return texto.toLowerCase().split(" ").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  }

  function formatarTelefone(valor) {
    valor = valor.replace(/\D/g, "");
    if (valor.length === 10) return valor.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    if (valor.length === 11) return valor.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    return valor;
  }

  function formatarPlaca(valor) {
    valor = valor.toUpperCase().replace(/[^A-Z0-9]/g, "");
    return valor.length > 3 ? valor.slice(0, 3) + '-' + valor.slice(3) : valor;
  }

  function limparFormulario() {
    form.reset();
  }

  function atualizarContador() {
    db.collection("motoristas").get().then(snapshot => {
      contador.innerText = `Total de motoristas cadastrados: ${snapshot.size}`;
    }).catch(() => {
      contador.innerText = "Erro ao contar motoristas.";
    });
  }

  function gerarIdSequencial() {
    return "M" + String(Date.now()).slice(-6); // ID com prefixo e timestamp
  }

  ["nome", "marca", "modelo", "cor"].forEach(id => {
    document.getElementById(id).addEventListener("blur", e => {
      e.target.value = capitalizarTexto(e.target.value);
    });
  });

  document.getElementById("telefone").addEventListener("blur", e => {
    e.target.value = formatarTelefone(e.target.value);
  });

  document.getElementById("placa").addEventListener("blur", e => {
    e.target.value = formatarPlaca(e.target.value);
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const placaFormatada = document.getElementById("placa").value.trim().toUpperCase();
    const idGerado = gerarIdSequencial();

    try {
      // Verifica se já existe motorista com a mesma placa
      const placaDuplicada = await db.collection("motoristas")
        .where("placa", "==", placaFormatada)
        .get();

      if (!placaDuplicada.empty) {
        mensagem.innerText = "❌ Já existe um motorista cadastrado com essa placa.";
        return;
      }

      // Verifica se já existe documento com o mesmo ID
      const idRef = db.collection("motoristas").doc(idGerado);
      const idSnap = await idRef.get();

      if (idSnap.exists) {
        mensagem.innerText = "❌ Já existe um motorista com esse ID. Tente novamente.";
        return;
      }

      const motorista = {
        id: idGerado,
        nome: document.getElementById("nome").value.trim(),
        telefone: document.getElementById("telefone").value.trim(),
        marca: document.getElementById("marca").value.trim(),
        modelo: document.getElementById("modelo").value.trim(),
        cor: document.getElementById("cor").value.trim(),
        "Tipo de carro": document.getElementById("tipoCarro").value,
        ano: document.getElementById("ano").value.trim(),
        tipoPlaca: document.getElementById("tipoPlaca").value,
        placa: placaFormatada,
        ativo: true,
        statusOperacional: "disponível"
      };

      // Salva com o ID como nome do documento
      await idRef.set(motorista);

      localStorage.removeItem("motoristas");

      mensagem.innerText = `✅ Motorista ${motorista.nome} cadastrado com sucesso!`;
      atualizarContador();
      limparFormulario();
    } catch (error) {
      console.error("❌ Erro ao salvar no Firebase:", error);
      mensagem.innerText = "❌ Erro ao salvar no banco de dados.";
    }
  });

  atualizarContador();
</script>
