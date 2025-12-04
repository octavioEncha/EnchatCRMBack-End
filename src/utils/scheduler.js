import cron from "node-cron";
import { verifyScheduledMessages } from "../services/scheduledMessages.service.js";

// roda todo começo de hora: 00:00, 01:00, 02:00...
cron.schedule("0 * * * *", async () => {
  console.log("Executando a cada 1 hora");
  const verify = await verifyScheduledMessages();
});
