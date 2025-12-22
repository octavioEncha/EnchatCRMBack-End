import * as scheduledMessagesModel from "../models/scheduledMessages.model.js";
import { findProfileById } from "./profile.service.js";
import { searchLeadId } from "./leads.service.js";
import { shootingToLead } from "./shooting.service.js";

export const verifyScheduledMessages = async () => {
  const getAllMessages = await scheduledMessagesModel.verifyScheduledMessages();

  if (!getAllMessages || getAllMessages.length === 0) {
    console.log("Nenhuma mensagem pendente.");
    return;
  }

  const now = new Date();

  for (const data of getAllMessages) {
    const scheduleDate = new Date(data.scheduled_time);

    // --- Verificar se a DATA é hoje ---
    const isSameDay =
      scheduleDate.getFullYear() === now.getFullYear() &&
      scheduleDate.getMonth() === now.getMonth() &&
      scheduleDate.getDate() === now.getDate();

    if (!isSameDay) {
      console.log("Data não é hoje, pulando:", data.id);
      continue;
    }

    // --- Verificar se o horário já chegou ---
    if (scheduleDate > now) {
      console.log("Ainda não é hora dessa:", data.id);
      continue;
    }

    console.log("Enviando mensagem agendada:", data.id);

    const getProfile = await findProfileById({ id: data.user_id });
    const getLead = await searchLeadId({ id: data.lead_id });

    const dataSend = {
      user: data.user_id,
      number: getLead.phone,
      text: data.message,
    };

    const sendMessage = await shootingToLead({ data: dataSend });

    await scheduledMessagesModel.updateStatusScheduleMessages({
      id: data.id,
    });

    console.log("Mensagem enviada e marcada como 'sent':", data.id);

    const randomWait = Math.floor(Math.random() * (50 - 40 + 1) + 40);
    console.log(`Aguardando ${randomWait} segundos para a próxima mensagem...`);
    await new Promise((resolve) => setTimeout(resolve, randomWait * 1000));
  }
};
