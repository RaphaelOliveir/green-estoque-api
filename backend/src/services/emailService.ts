import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || 'user',
    pass: process.env.SMTP_PASS || 'pass',
  },
});

export const sendWelcomeEmail = async (to: string, name: string) => {
  const mailOptions = {
    from: '"Green Estoque" <no-reply@greenestoque.com>',
    to,
    subject: 'Bem-vindo ao Green Estoque!',
    html: `<h1>Olá ${name},</h1><p>Bem-vindo ao sistema de estoque Green Estoque!</p>`,
  };
  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const mailOptions = {
    from: '"Green Estoque" <no-reply@greenestoque.com>',
    to,
    subject: 'Recuperação de Senha',
    html: `<p>Para redefinir sua senha, utilize o token: <strong>${token}</strong></p>`,
  };
  await transporter.sendMail(mailOptions);
};

export const sendDeliveryNotificationEmail = async (to: string, pedidoId: number) => {
  const mailOptions = {
    from: '"Green Estoque" <no-reply@greenestoque.com>',
    to,
    subject: 'Status do Pedido Atualizado',
    html: `<p>Seu pedido #${pedidoId} foi atualizado para entrega.</p>`,
  };
  await transporter.sendMail(mailOptions);
};
