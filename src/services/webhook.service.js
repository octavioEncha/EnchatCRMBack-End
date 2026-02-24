import { getAllOffersAndProductsByInboxId } from "./offers.service.js";

export const sendingWebhookMessage = async ({ webhookURL, content }) => {
  try {
    const data = await getAllOffersAndProductsByInboxId({
      inbox_id: content.inbox,
    });

    if (!data || data.length === 0) {
      throw new Error("Nenhuma configuração encontrada para esse inbox.");
    }

    const item = data[0];

    const prompt = item.integration_channels?.prompt || null;
    const offer = item.offer || null;

    const product = offer?.product || null;
    const orderBumps = offer?.order_bumps || [];
    const upsellProduct = offer?.upsell_product || null;
    const downsellProduct = offer?.downsell_product || null;

    const payload = {
      ...content,
      prompt,
      offer: {
        id: offer?.id,
        name: offer?.name,
        product,
        order_bumps: orderBumps,
        upsell_product: upsellProduct,
        downsell_product: downsellProduct,
      },
    };

    const response = await fetch(webhookURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    return responseData;
  } catch (err) {
    console.error("❌ Erro ao enviar mensagem para o webhook:", err.message);
    return null;
  }
};
