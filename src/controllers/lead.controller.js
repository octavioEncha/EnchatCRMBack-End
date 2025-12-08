import * as leadService from "../services/leads.service.js";
import fs from "fs";

export const specificLeadId = async (req, res) => {
  try {
    const id = req.params.id;
    const getLead = await leadService.searchLeadId({ id });
    res.status(200).json({ getLead });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const createNewLead = async (req, res) => {
  try {
    const data = req.body;
    const createNewLead = await leadService.createNewLead({ data });
    res.status(201).json({ message: "sucess" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const importLeads = async (req, res) => {
  let filePath = null; // ← variável declarada fora do try

  try {
    const file = req.file;
    const { pipelineId } = req.body;
    filePath = file?.path; // agora está acessível no catch também

    const result = await leadService.importLead({
      file,
      pipelineId,
    });

    // Deleta o arquivo após processar (não trava caso dê erro)
    if (filePath) {
      fs.unlink(filePath, () => {});
    }

    res.status(200).json({
      message: "Importação concluída",
      imported: result.imported,
      errors: result.errors,
    });
  } catch (error) {
    // tenta deletar mesmo em caso de erro
    if (filePath) {
      fs.unlink(filePath, () => {});
    }

    res.status(400).json({ error: error.message });
  }
};
