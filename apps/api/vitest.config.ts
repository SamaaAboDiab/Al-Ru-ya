import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    // The first run downloads a MongoDB binary for mongodb-memory-server.
    hookTimeout: 180_000,
    testTimeout: 20_000,
  },
});
