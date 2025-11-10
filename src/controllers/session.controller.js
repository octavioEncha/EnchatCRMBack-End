import { sessions } from "../services/session.service.js";
import { processedMessageIds } from "../models/message.model.js";

export const listSessions = (req, res) => res.json(Object.keys(sessions));

export const getContacts = (req, res) => {
  const { id } = req.params;
  if (!sessions[id]) return res.status(404).send("Sessão não encontrada");
  res.json(Object.values(sessions[id].contacts));
};

export const getMessages = (req, res) => {
  const { id, number } = req.params;
  if (!sessions[id] || !sessions[id].contacts[number])
    return res.status(404).send("Sessão ou contato não encontrados");
  res.json(sessions[id].contacts[number].messages);
};

export const clearCache = (req, res) => {
  processedMessageIds.clear();
  res.json({ message: "Cache limpo" });
};

export const cacheSize = (req, res) => {
  res.json({ size: processedMessageIds.size });
};
