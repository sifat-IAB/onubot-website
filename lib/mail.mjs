import nodemailer from 'nodemailer';

export function isMailConfigured(env = process.env) {
  const port = Number(env.SMTP_PORT || 465);
  return ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'].every(key => typeof env[key] === 'string' && env[key].trim())
    && Number.isInteger(port) && port > 0 && port <= 65535
    && !/[\r\n]/.test(env.SMTP_HOST + env.SMTP_USER + env.SMTP_FROM);
}

export async function sendEmail(message, env = process.env) {
  const port = Number(env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
    dnsTimeout: 8000,
    logger: false,
    debug: false
  });
  try { return await transport.sendMail({ ...message, disableFileAccess: true, disableUrlAccess: true }); }
  finally { transport.close(); }
}

export const sendDeletionEmail = sendEmail;
