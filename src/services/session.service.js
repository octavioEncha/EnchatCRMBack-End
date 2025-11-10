import { sessions } from "../models/session.model.js";

export const ensureContact = (sessionId, number, name = "Desconhecido") => {
  if (!sessions[sessionId]) return;
  if (!sessions[sessionId].contacts[number]) {
    sessions[sessionId].contacts[number] = { name, number, messages: [] };
  }
};

export const saveMessage = (sessionId, number, message) => {
  ensureContact(sessionId, number);
  sessions[sessionId].contacts[number].messages.push(message);
};

export { sessions };
