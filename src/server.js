import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import initSocket from "./config/socket.js";

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

initSocket(io);

global.io = io;

//INICIALIZAÇÃO
app.get("/", async (req, res) => {
  try {
    const response = await fetch(
      "http://localhost:8081/instance/connectionState/teste",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: "meu_token_secreto",
        },
        //body: JSON.stringify({ number: to, text }),
      }
    );
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(400).send("TO AQUI CARAI");
  }
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
