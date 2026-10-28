import mongoose from 'mongoose';
import { loadConfig } from './config';
import { createLogger } from './utils/logger';
import { createApp } from './app';

const config = loadConfig();
const logger = createLogger(config.LOG_LEVEL, config.NODE_ENV === 'development');

await mongoose.connect(config.MONGODB_URI);
logger.info('Connected to MongoDB');

const server = createApp(config, logger).listen(config.PORT, () => {
  logger.info(`API listening on http://localhost:${config.PORT}`);
});

async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`);
  server.close();
  await mongoose.disconnect();
  process.exit(0);
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
