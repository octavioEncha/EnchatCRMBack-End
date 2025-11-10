const errorHandler = (err, req, res, next) => {
  console.error("❌ Erro no servidor:", err);
  res.status(500).json({ error: "Erro interno no servidor" });
};

export default errorHandler;
