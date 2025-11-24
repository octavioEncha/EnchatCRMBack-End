import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Verifica se o header existe e tem o formato correto
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Token not found or is invalid",
    });
  }

  const token = authHeader.split(" ")[1]; // pega só o token

  try {
    // valida o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // salva os dados do token para usar na rota (ex: req.user.id)
    req.user = decoded;

    return next();
  } catch (err) {
    return res.status(401).json({
      error: "Token is invalid or expired",
    });
  }
};
