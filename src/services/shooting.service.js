import * as messageService from "./messages.service.js";

export const shootingToLead = async ({ data }) => {
  const response = await fetch(
    `https://edvedder.encha.com.br/message/sendText/${data.user}`,
    //`http://localhost:8081/message/sendText/${data.user}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "04e17cf6a68786ac0ff59bf9fcd81029",
        //apikey: "meu_token_secreto",
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
    { phone: data.number, content: data.text, instance: data.user }
  );

  return;
};
