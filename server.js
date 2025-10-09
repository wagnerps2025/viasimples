const express = require('express');
const path = require('path');
const app = express();

// Porta desejada
const PORT = 8080;

// Servir arquivos estáticos da pasta atual
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
