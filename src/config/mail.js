import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT, // 465 (SSL) normalmente funciona melhor
  secure: true,
  auth: {
    user: process.env.SMTP_USER, // seu email completo
    pass: process.env.SMTP_PASS, // senha do email (não a senha da Hostinger)
  },
});
