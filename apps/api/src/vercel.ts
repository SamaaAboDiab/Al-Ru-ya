import mongoose from 'mongoose';
import { createApp } from './app';
import { loadConfig } from './config';
import { createLogger } from './utils/logger';
import { createMailer } from './utils/mailer';
import { createSms } from './utils/sms';

const config = loadConfig({ ...process.env, NODE_ENV: 'production' });
const logger = createLogger(config.LOG_LEVEL, false);

// Small pool: every warm function instance holds its own connections, and Atlas caps the total.
await mongoose.connect(config.MONGODB_URI, { maxPoolSize: 5 });

export default createApp(config, logger, createMailer(config, logger), createSms(config, logger));
