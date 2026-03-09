import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import { sessions, saveMessage } from "../services/session.service.js";
import {
  createNewMessageSendCRM,
  createNewMessage,
} from "../services/messages.service.js";
import { searchLeadId } from "../services/leads.service.js";
import { createNewInbox } from "../services/inbox.service.js";
import { findInboxByIdOrThrow } from "../services/inbox.service.js";

const EVOLUTION_API = "https://edvedder.encha.com.br";
//const EVOLUTION_API = "http://localhost:8081";
const API_KEY = "04e17cf6a68786ac0ff59bf9fcd81029";
//const API_KEY = "meu_token_secreto";

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Novo cliente conectado:", socket.id);

    // ----------------------------
    // Helpers
    // ----------------------------

    const clearSocketIntervals = (socketId) => {
      for (const [sid, s] of Object.entries(sessions)) {
        if (s?.socketId === socketId && s.intervalId) {
          clearInterval(s.intervalId);
          s.intervalId = null;
          console.log(`🧹 Intervalo limpo para sessão ${sid}`);
        }
      }
    };

    const clearSessionInterval = (sessionId) => {
      const s = sessions[sessionId];
      if (s?.intervalId) {
        clearInterval(s.intervalId);
        s.intervalId = null;
        console.log(`🧹 Intervalo da sessão ${sessionId} limpo`);
      }
    };

    // ----------------------------
    // Registro de sessão
    // ----------------------------

    socket.on("register_session", async (sessionId) => {
      if (!sessionId) return;

      try {
        console.log(`🔎 Registrando sessão: ${sessionId}`);

        // Estrutura básica da sessão
        sessions[sessionId] = sessions[sessionId] || {
          socketId: socket.id,
          contacts: {},
          intervalId: null,
        };

        sessions[sessionId].socketId = socket.id;

        // Busca inbox
        const inbox = await findInboxByIdOrThrow({ id: sessionId });

        // =====================================================
        // 🔒 CASO SEJA WHATSAPP OFICIAL -> NÃO CRIA INSTÂNCIA
        // =====================================================
        if (inbox.provider === "whatsapp_official") {
          console.log(
            `📱 Inbox ${sessionId} usa WhatsApp Oficial. Pulando Evolution API.`
          );

          clearSessionInterval(sessionId);

          socket.emit("session_connected", {
            sessionId,
            message: "✅ Sessão conectada via WhatsApp Oficial.",
            provider: "whatsapp_official",
          });

          socket.emit("qrcode_clear", { sessionId });

          return; // 🚨 IMPORTANTE: interrompe aqui
        }

        // =====================================================
        // A PARTIR DAQUI: APENAS BAILEYS / EVOLUTION
        // =====================================================

        const checkResponse = await fetch(
          `${EVOLUTION_API}/instance/connectionState/${sessionId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              apikey: API_KEY,
            },
          }
        );

        const checkData = await checkResponse.json();

        // ------------------------------------------
        // 1) Instância NÃO existe -> criar
        // ------------------------------------------
        if (checkData.error === "Not Found") {
          console.log("📦 Criando nova instância:", sessionId);

          await createNewInbox({
            user_id: sessionId,
          });

          const createResponse = await fetch(
            `${EVOLUTION_API}/instance/create`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: API_KEY,
              },
              body: JSON.stringify({
                instanceName: sessionId,
                qrcode: true,
                integration: "WHATSAPP-BAILEYS",
                groupsIgnore: true,
                webhook: {
                  url: "https://api.enchat.in/webhook",
                  base64: true,
                  events: ["MESSAGES_UPSERT"],
                },
              }),
            }
          );

          const createData = await createResponse.json();

          if (createData.qrcode?.base64) {
            socket.emit("qrcode_generated", {
              sessionId,
              qrcode: createData.qrcode.base64,
            });
          }

          socket.emit("session_registered", {
            sessionId,
            message: `Sessão criada para ${sessionId}`,
          });

          clearSessionInterval(sessionId);

          const intervalId = setInterval(async () => {
            try {
              console.log(`INSTANCE VERIFY (create) ${sessionId}`);

              const qrResponse = await fetch(
                `${EVOLUTION_API}/instance/connectionState/${sessionId}`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                    apikey: API_KEY,
                  },
                }
              );

              const qrData = await qrResponse.json();

              if (qrData.qrcode?.base64) {
                socket.emit("qrcode_generated", {
                  sessionId,
                  qrcode: qrData.qrcode.base64,
                });
              }

              if (
                qrData.instance?.state === "connected" ||
                qrData.instance?.state === "open"
              ) {
                clearInterval(intervalId);
                sessions[sessionId].intervalId = null;

                socket.emit("session_connected", {
                  sessionId,
                  message: "✅ Instância conectada com sucesso!",
                });

                socket.emit("qrcode_clear", { sessionId });

                console.log(`✅ Instância ${sessionId} conectada.`);
                return;
              }

              if (
                qrData.instance?.state === "disconnected" &&
                !qrData.qrcode?.base64
              ) {
                console.log("⚠️ Reconectando...");

                const recreateResponse = await fetch(
                  `${EVOLUTION_API}/instance/connect/${sessionId}`,
                  {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      apikey: API_KEY,
                    },
                  }
                );

                const recreateData = await recreateResponse.json();

                const newQr =
                  recreateData.base64 || recreateData.qrcode?.base64;

                if (newQr) {
                  socket.emit("qrcode_generated", {
                    sessionId,
                    qrcode: newQr,
                  });
                }
              }
            } catch (err) {
              console.error("❌ Polling error:", err?.message || err);
            }
          }, 5000);

          sessions[sessionId].intervalId = intervalId;
        }

        // ------------------------------------------
        // 2) Connecting
        // ------------------------------------------
        else if (
          checkData.instance?.state === "connecting" ||
          checkData.instance?.state === "close"
        ) {
          console.log(`🔁 Reconnect: ${sessionId}`);

          clearSessionInterval(sessionId);

          const connectResponse = await fetch(
            `${EVOLUTION_API}/instance/connect/${sessionId}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                apikey: API_KEY,
              },
            }
          );

          const connectData = await connectResponse.json();

          const base64Qr = connectData.base64 || connectData.qrcode?.base64;

          if (base64Qr) {
            socket.emit("qrcode_generated", {
              sessionId,
              qrcode: base64Qr,
            });
          }
        }

        // ------------------------------------------
        // 3) Já conectado
        // ------------------------------------------
        else if (
          checkData.instance?.state === "connected" ||
          checkData.instance?.state === "open"
        ) {
          console.log(`✅ Já conectado: ${sessionId}`);

          socket.emit("session_connected", {
            sessionId,
            message: "Instância já conectada.",
          });

          socket.emit("qrcode_clear", { sessionId });

          clearSessionInterval(sessionId);
        } else {
          console.log("ℹ️ Estado:", checkData);
        }
      } catch (err) {
        console.error("❌ Erro ao registrar sessão:", err?.message || err);

        socket.emit("session_error", {
          sessionId,
          error: err?.message || String(err),
        });
      }
    });

    // ----------------------------
    // Envio de mensagem
    // ----------------------------

    socket.on("client_message", async (data) => {
      const { sessionId, text, to } = data;

      if (!sessionId || !to || !text) return;

      try {
        await createNewMessageSendCRM({
          sessionId,
          leadId: to,
          content: text,
        });

        console.log("✅ Mensagem enviada ao CRM");
      } catch (err) {
        console.error("❌ Erro no envio:", err.message);
      }
    });

    // ----------------------------
    // Disconnect
    // ----------------------------

    socket.on("disconnect", () => {
      console.log("🔴 Cliente desconectado:", socket.id);

      clearSocketIntervals(socket.id);

      for (const id of Object.keys(sessions)) {
        if (sessions[id].socketId === socket.id) {
          delete sessions[id];
          console.log(`❌ Sessão removida: ${id}`);
        }
      }
    });
  });
};

export default initSocket;
