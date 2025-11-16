import * as messageService from "./messages.service.js";

export const shootingToLead = async ({ data }) => {
  const response = await fetch(
    `http://localhost:8081/message/sendText/${data.user}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "meu_token_secreto",
      },
      body: JSON.stringify({
        number: data.number,
        text: data.text,
      }),
    }
  );
  if (!response.ok) {
    throw new Error(response);
  }

  const createMessageInDB = await messageService.createMessageForShootingToLead(
    { phone: data.number, content: data.text }
  );

  return;
};
