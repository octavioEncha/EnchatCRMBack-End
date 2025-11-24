import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import initSocket from "./config/socket.js";
import dotenv from "dotenv";

dotenv.config();

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  allowEIO3: true,
});

initSocket(io);

global.io = io;

//INICIALIZAÇÃO
app.get("/", async (req, res) => {
  res.status(200).json({ message: "Server is running" });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
