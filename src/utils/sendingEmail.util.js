import { transporter } from "../config/mail.js";

export const sendEmailRecoveryPassword = async ({ to, token }) => {
  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;

  const conteudoHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperação de Senha - Enchat</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            
            <!-- Container Principal -->
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <!-- Header com gradiente -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <img src="https://crm.enchat.in/assets/iconeEncha-DXGMgnr8.png" alt="Enchat CRM" style="height: 80px; width: auto; margin-bottom: 20px;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                    Recuperação de Senha 🔐
                  </h1>
                </td>
              </tr>
              
              <!-- Conteúdo -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                    Olá! 👋
                  </p>
                  
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                    Recebemos uma solicitação para redefinir a senha da sua conta no <strong>Enchat CRM</strong>.
                  </p>
                  
                  <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                    Clique no botão abaixo para criar uma nova senha:
                  </p>
                  
                  <!-- Botão CTA -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 8px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                          Redefinir Minha Senha
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Link alternativo -->
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px; line-height: 1.5;">
                      Se o botão não funcionar, copie e cole este link no seu navegador:
                    </p>
                    <p style="margin: 0; word-break: break-all;">
                      <a href="${resetUrl}" style="color: #667eea; text-decoration: none; font-size: 13px;">
                        ${resetUrl}
                      </a>
                    </p>
                  </div>
                  
                  <!-- Aviso de segurança -->
                  <div style="border-left: 4px solid #fbbf24; background-color: #fef3c7; padding: 16px 20px; border-radius: 4px; margin-bottom: 20px;">
                    <p style="margin: 0 0 8px; color: #92400e; font-size: 14px; font-weight: 700;">
                      ⚠️ Importante:
                    </p>
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      Este link é válido por <strong>1 hora</strong>. Se você não solicitou esta recuperação, ignore este email e sua senha permanecerá inalterada.
                    </p>
                  </div>
                  
                  <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                    Se você tiver alguma dúvida, entre em contato com nossa equipe de suporte.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                    <strong>Enchat CRM</strong>
                  </p>
                  <p style="margin: 0 0 15px; color: #999999; font-size: 12px;">
                    Transformando conversas em resultados
                  </p>
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    © ${new Date().getFullYear()} Enchat. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
              
            </table>
            
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Enchat CRM" <${process.env.SMTP_USER}>`,
      to: to,
      subject: "Recuperação de senha - Enchat CRM",
      html: conteudoHTML,
    });

    return info;
  } catch (erro) {
    console.error("Erro ao enviar email:", erro);
    throw erro;
  }
};

export const sendEmailConfirmRegistration = async ({ to, name, id }) => {
  const baseURL = `${process.env.APP_URL}/auth?user_id=${id}`;

  const conteudoHTML = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bem-vindo ao Enchat</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            
            <!-- Container Principal -->
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
              
              <!-- Header com gradiente -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <img src="https://crm.enchat.in/assets/iconeEncha-DXGMgnr8.png" alt="Enchat CRM" style="height: 80px; width: auto; margin-bottom: 20px;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                    Bem-vindo ao Enchat! 🎉
                  </h1>
                </td>
              </tr>
              
              <!-- Conteúdo -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                    Olá, <strong>${name}</strong>! 👋
                  </p>
                  
                  <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                    Ficamos muito felizes em ter você conosco! Seu cadastro no <strong>Enchat CRM</strong> foi realizado com sucesso.
                  </p>
                  
                  <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                    Agora você pode acessar nossa plataforma e começar a transformar suas conversas em resultados:
                  </p>
                  
                  <!-- Botão CTA -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr>
                      <td align="center">
                        <a href="${baseURL}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 8px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                          Acessar Minha Conta
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Recursos -->
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                    <p style="margin: 0 0 15px; color: #333333; font-size: 15px; font-weight: 700;">
                      🚀 Próximos passos:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
                      <li>Complete seu perfil</li>
                      <li>Configure suas preferências</li>
                      <li>Explore os recursos da plataforma</li>
                      <li>Integre seus canais de comunicação</li>
                    </ul>
                  </div>
                  
                  <!-- Link alternativo -->
                  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px; line-height: 1.5;">
                      Se o botão não funcionar, copie e cole este link no seu navegador:
                    </p>
                    <p style="margin: 0; word-break: break-all;">
                      <a href="${baseURL}" style="color: #667eea; text-decoration: none; font-size: 13px;">
                        ${baseURL}
                      </a>
                    </p>
                  </div>
                  
                  <!-- Mensagem de suporte -->
                  <div style="border-left: 4px solid #667eea; background-color: #eef2ff; padding: 16px 20px; border-radius: 4px; margin-bottom: 20px;">
                    <p style="margin: 0 0 8px; color: #4338ca; font-size: 14px; font-weight: 700;">
                      💡 Precisa de ajuda?
                    </p>
                    <p style="margin: 0; color: #4338ca; font-size: 14px; line-height: 1.5;">
                      Nossa equipe de suporte está sempre disponível para ajudá-lo. Não hesite em entrar em contato!
                    </p>
                  </div>
                  
                  <p style="margin: 0; color: #666666; font-size: 14px; line-height: 1.6;">
                    Obrigado por escolher o Enchat CRM. Estamos ansiosos para fazer parte do seu sucesso! 🎯
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                    <strong>Enchat CRM</strong>
                  </p>
                  <p style="margin: 0 0 15px; color: #999999; font-size: 12px;">
                    Transformando conversas em resultados
                  </p>
                  <p style="margin: 0; color: #999999; font-size: 12px;">
                    © ${new Date().getFullYear()} Enchat. Todos os direitos reservados.
                  </p>
                </td>
              </tr>
              
            </table>
            
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Enchat CRM" <${process.env.SMTP_USER}>`,
      to: to,
      subject: "Bem-vindo ao Enchat CRM! 🎉",
      html: conteudoHTML,
    });

    return info;
  } catch (erro) {
    console.error("Erro ao enviar email:", erro);
    throw erro;
  }
};
