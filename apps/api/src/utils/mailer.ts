import type { Logger } from './logger';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

/**
 * Writes emails to the log instead of sending them.
 * Swap for a real provider (Resend, SES, SMTP) before launch.
 */
export function createLogMailer(logger: Logger): Mailer {
  return {
    async send(message) {
      logger.info({ mail: message }, 'Email (not sent: no mail provider configured)');
    },
  };
}
