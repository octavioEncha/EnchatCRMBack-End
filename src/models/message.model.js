export const processedMessageIds = new Set();

// Limpa cache a cada hora
setInterval(() => {
  if (processedMessageIds.size > 1000) {
    processedMessageIds.clear();
    console.log("🧹 Cache de mensagens limpo");
  }
}, 3600000);
