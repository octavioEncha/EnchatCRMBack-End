import express from "express";
import { supabase } from "../config/supabaseClient.js";

const router = express.Router();

// Buscar todos os usuários
router.get("/users", async (req, res) => {
  const { data, error } = await supabase.from("profiles").select("*");

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

// Inserir um novo usuário
router.post("/", async (req, res) => {
  const { name, email } = req.body;

  const { data, error } = await supabase
    .from("users")
    .insert([{ name, email }])
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
});

export default router;
