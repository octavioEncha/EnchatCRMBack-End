export const sendingWebhookMessage = async ({ webhookURL, content }) => {
  try {
    const response = await fetch(webhookURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(content),
    });
  } catch (err) {
    console.error("❌ Erro ao enviar mensagem para o webhook:", err.message);
    return null;
  }
};
