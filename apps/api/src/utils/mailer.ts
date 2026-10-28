import nodemailer from 'nodemailer';
import type { Config } from '../config';
import type { Logger } from './logger';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/** Writes emails to the log instead of sending them. Used until SMTP is configured, and in tests. */
export function createLogMailer(logger: Logger): Mailer {
  return {
    async send(message) {
      logger.info({ mail: message }, 'Email (not sent: no mail provider configured)');
    },
  };
}

/** Sends through any SMTP service. Port 465 uses TLS from the start; other ports upgrade with STARTTLS. */
export function createSmtpMailer(config: Config & { SMTP_HOST: string }): Mailer {
  const transport = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_PORT === 465,
    requireTLS: config.SMTP_PORT !== 465,
    auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASS } : undefined,
  });
  return {
    async send(message) {
      await transport.sendMail({ from: config.MAIL_FROM, ...message });
    },
  };
}

export function createMailer(config: Config, logger: Logger): Mailer {
  if (config.SMTP_HOST) return createSmtpMailer({ ...config, SMTP_HOST: config.SMTP_HOST });
  logger.warn('SMTP_HOST is not set: emails will be written to the log, not sent');
  return createLogMailer(logger);
}
