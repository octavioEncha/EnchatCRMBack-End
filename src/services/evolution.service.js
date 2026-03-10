export const sendMessageByPhoneNumberLead = async ({
  sessionId,
  phone,
  text,
}) => {
  const response = await fetch(
    `https://edvedder.encha.com.br/message/sendText/${sessionId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: "04e17cf6a68786ac0ff59bf9fcd81029",
      },
      body: JSON.stringify({
        number: phone,
        text: text,
      }),
    }
  );

  if (!response.ok) {
    console.error(`⚠️ Falha ao enviar (${response.status})`);
  }
};
