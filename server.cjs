// server.js
import express from "express";

const app = express();
const port = 8080;

app.get("/", (req, res) => {
  res.send("🚀 ViaSimples rodando na porta 8080!");
});

app.listen(port, () => {
  console.log(`✅ Servidor rodando em http://localhost:${port}`);
});
