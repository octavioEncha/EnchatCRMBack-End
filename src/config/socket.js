import { v4 as uuidv4 } from "uuid";
import fetch from "node-fetch";
import { sessions, saveMessage } from "../services/session.service.js";
import {
  createNewMessageSendCRM,
  createNewMessage,
} from "../services/messages.service.js";
import { searchLeadId } from "../services/leads.service.js";
import { createNewInbox } from "../services/inbox.service.js";

const EVOLUTION_API = "https://edvedder.encha.com.br";
//const EVOLUTION_API = "http://localhost:8081";
const API_KEY = "04e17cf6a68786ac0ff59bf9fcd81029";
//const API_KEY = "meu_token_secreto";

const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Novo cliente conectado:", socket.id);

    // --- helper: limpa intervalos associados a um socketId
    const clearSocketIntervals = (socketId) => {
      for (const [sid, s] of Object.entries(sessions)) {
        if (s?.socketId === socketId && s.intervalId) {
          clearInterval(s.intervalId);
          s.intervalId = null;
          console.log(`🧹 Intervalo limpo para sessão ${sid}`);
        }
      }
    };

    // --- helper: limpa intervalo específico da sessão (se existir)
    const clearSessionInterval = (sessionId) => {
      const s = sessions[sessionId];
      if (s?.intervalId) {
        clearInterval(s.intervalId);
        s.intervalId = null;
        console.log(`🧹 Intervalo da sessão ${sessionId} limpo`);
      }
    };

    socket.on("register_session", async (sessionId) => {
      if (!sessionId) return;

      try {
        console.log(`🔎 Verificando instância para sessionId=${sessionId}`);

        // garante estrutura mínima para a sessão
        sessions[sessionId] = sessions[sessionId] || {
          socketId: socket.id,
          contacts: {},
          intervalId: null,
        };
        // atualiza socketId (caso reconecte)
        sessions[sessionId].socketId = socket.id;

        // consulta estado da instância
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

          const createInbox = await createNewInbox({
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
                  //url: "http://host.docker.internal:4000/webhook",
                  base64: true,
                  events: ["MESSAGES_UPSERT"],
                },
              }),
            }
          );

          const createData = await createResponse.json();

          // envia QR inicial se existir
          if (createData.qrcode?.base64) {
            socket.emit("qrcode_generated", {
              sessionId,
              qrcode: createData.qrcode.base64,
            });
            console.log("📤 QR Code inicial enviado ao front!");
          }

          socket.emit("session_registered", {
            sessionId,
            message: `Sessão criada para ${sessionId}`,
          });

          // garante que não exista intervalo duplicado
          clearSessionInterval(sessionId);

          // inicia polling robusto (verifica QR e estado)
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

              // reenviar qrcode quando disponível
              if (qrData.qrcode?.base64) {
                socket.emit("qrcode_generated", {
                  sessionId,
                  qrcode: qrData.qrcode.base64,
                });
                console.log("🔁 QR Code atualizado enviado ao front!");
              }

              // se conectou -> notifica e limpa polling
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
                console.log(
                  `✅ Instância ${sessionId} conectada, polling parado.`
                );
                return;
              }

              // se estiver disconnected sem qrcode -> recriar qrcode
              if (
                qrData.instance?.state === "disconnected" &&
                !qrData.qrcode?.base64
              ) {
                console.log(
                  "⚠️ Sessão desconectada sem QR; solicitando nova geração..."
                );
                try {
                  // usa endpoint de geração (connect) conforme sua observação
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
                  // aceita tanto recreateData.base64 quanto recreateData.qrcode?.base64
                  const newQr =
                    recreateData.base64 || recreateData.qrcode?.base64;
                  if (newQr) {
                    socket.emit("qrcode_generated", {
                      sessionId,
                      qrcode: newQr,
                    });
                    console.log("🔄 Novo QR Code gerado e enviado ao front!");
                  }
                } catch (err) {
                  console.warn("⚠️ Erro ao recriar QR:", err?.message || err);
                }
              }
            } catch (err) {
              console.error(
                "❌ Erro no polling da instância (create flow):",
                err?.message || err
              );
            }
          }, 5000);

          sessions[sessionId].intervalId = intervalId;
        }

        // ------------------------------------------
        // 2) Instância em "connecting" -> solicitar QR via /connect
        // ------------------------------------------
        else if (
          checkData.instance?.state === "connecting" ||
          checkData.instance?.state === "close"
        ) {
          console.log(
            `🔁 Instância ${sessionId} em 'connecting', solicitando geração de QR (connect)...`
          );

          // limpa qualquer intervalo existente antes de criar novo
          clearSessionInterval(sessionId);

          try {
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

            // muitos endpoints retornam base64 direto ou em qrcode.base64
            const base64Qr = connectData.base64 || connectData.qrcode?.base64;
            if (base64Qr) {
              socket.emit("qrcode_generated", {
                sessionId,
                qrcode: base64Qr,
              });
              console.log("📤 QR Code (connect) enviado ao front!");
            }

            // inicia polling igual ao fluxo de criação
            const intervalId = setInterval(async () => {
              try {
                console.log(`INSTANCE VERIFY (connect) ${sessionId}`);
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
                  console.log("🔁 QR Code atualizado enviado ao front!");
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
                  console.log(
                    `✅ Instância ${sessionId} conectada, polling parado.`
                  );
                  return;
                }

                if (
                  qrData.instance?.state === "disconnected" &&
                  !qrData.qrcode?.base64
                ) {
                  console.log(
                    "⚠️ Sessão desconectada sem QR; solicitando nova geração..."
                  );
                  try {
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
                      console.log(
                        "🔄 Novo QR Code (connect) gerado e enviado ao front!"
                      );
                    }
                  } catch (err) {
                    console.warn("⚠️ Erro ao recriar QR:", err?.message || err);
                  }
                }
              } catch (err) {
                console.error(
                  "❌ Erro no polling da instância (connect flow):",
                  err?.message || err
                );
              }
            }, 5000);

            sessions[sessionId].intervalId = intervalId;
          } catch (err) {
            console.warn(
              "⚠️ Erro ao solicitar /instance/connect:",
              err?.message || err
            );
          }
        }

        // ------------------------------------------
        // 3) Já conectado / aberto
        // ------------------------------------------
        else if (
          checkData.instance?.state === "connected" ||
          checkData.instance?.state === "open"
        ) {
          console.log(`✅ Instância ${sessionId} já conectada.`);
          socket.emit("session_connected", {
            sessionId,
            message: "Instância já conectada.",
          });
          // garante limpeza do QR no front
          socket.emit("qrcode_clear", { sessionId });

          // limpa intervalos antigos por segurança
          clearSessionInterval(sessionId);
        } else {
          // outros estados: apenas log
          console.log(checkData);
          console.log(
            `ℹ️ Estado da instância (${sessionId}):`,
            checkData.instance?.state
          );
        }
      } catch (err) {
        console.error("❌ Erro ao registrar sessão:", err?.message || err);
        socket.emit("session_error", {
          sessionId,
          error: err?.message || String(err),
        });
      }
    });

    // ---------------------------
    // Envio de mensagem
    // ---------------------------
    socket.on("client_message", async (data) => {
      const { sessionId, text, to } = data;
      if (!sessionId || !to || !text) return;

      const lead = await searchLeadId({ id: to });

      const msgId = uuidv4();
      const msg = {
        id: msgId,
        direction: "outgoing",
        text,
        timestamp: new Date(),
      };

      saveMessage(sessionId, to, msg);

      try {
        const sendResponse = await fetch(
          `${EVOLUTION_API}/message/sendText/${sessionId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: API_KEY,
            },
            body: JSON.stringify({ number: lead.phone, text }),
          }
        );

        if (!sendResponse.ok)
          console.error(`⚠️ Falha ao enviar (${sendResponse.status})`);
        else {
          const data = await sendResponse.json();
          const createMessageCRM = await createNewMessageSendCRM({ data });

          console.log(`✅ Enviado para Evolution (${to})`);
        }
      } catch (err) {
        console.error("❌ Erro ao enviar mensagem:", err?.message || err);
      }
    });

    // ---------------------------
    // Desconexão do socket
    // ---------------------------
    socket.on("disconnect", () => {
      console.log("🔴 Cliente desconectado:", socket.id);

      // limpa intervalos associados a esse socket e remove sessões
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
