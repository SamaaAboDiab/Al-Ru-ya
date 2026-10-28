import type { Config } from '../config';
import type { Logger } from './logger';

export interface SmsSender {
  /** True when messages really leave the server; false when they are only logged. */
  readonly live: boolean;
  send(to: string, body: string): Promise<void>;
}

/** Writes texts to the log instead of sending them. Used until an SMS provider is set, and in tests. */
export function createLogSms(logger: Logger): SmsSender {
  return {
    live: false,
    async send(to, body) {
      logger.info({ sms: { to, body } }, 'SMS (not sent: no SMS provider configured)');
    },
  };
}

type TwilioConfig = { sid: string; token: string; from: string };

/** Sends through Twilio's Messages API. A sender starting with "MG" is a Messaging Service. */
export function createTwilioSms(twilio: TwilioConfig): SmsSender {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(twilio.sid)}/Messages.json`;
  const auth = Buffer.from(`${twilio.sid}:${twilio.token}`).toString('base64');
  return {
    live: true,
    async send(to, body) {
      const form = new URLSearchParams({ To: to, Body: body });
      form.set(twilio.from.startsWith('MG') ? 'MessagingServiceSid' : 'From', twilio.from);
      const res = await fetch(url, {
        method: 'POST',
        headers: { authorization: `Basic ${auth}`, 'content-type': 'application/x-www-form-urlencoded' },
        body: form,
      });
      if (!res.ok) throw new Error(`Twilio responded ${res.status}`);
    },
  };
}

export function createSms(config: Config, logger: Logger): SmsSender {
  if (config.TWILIO_ACCOUNT_SID && config.TWILIO_AUTH_TOKEN && config.TWILIO_FROM) {
    return createTwilioSms({ sid: config.TWILIO_ACCOUNT_SID, token: config.TWILIO_AUTH_TOKEN, from: config.TWILIO_FROM });
  }
  return createLogSms(logger);
}
