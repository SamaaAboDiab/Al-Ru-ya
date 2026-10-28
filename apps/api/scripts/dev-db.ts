/**
 * Local MongoDB for development when MongoDB isn't installed.
 * Data is kept in apps/api/.dev-db so it survives restarts.
 */
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MongoMemoryServer } from 'mongodb-memory-server';

const dbPath = fileURLToPath(new URL('../.dev-db', import.meta.url));
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port: 27017, dbPath, storageEngine: 'wiredTiger' },
});
console.log(`MongoDB running at ${server.getUri()}ruya (data in ${dbPath})`);

process.on('SIGINT', async () => {
  await server.stop({ doCleanup: false });
  process.exit(0);
});
