// Bundles the API into one Vercel Function using the Build Output API (.vercel/output).
import { build } from 'esbuild';
import { rm, writeFile } from 'node:fs/promises';

const out = '.vercel/output';
const fn = `${out}/functions/api.func`;

await rm(out, { recursive: true, force: true });

await build({
  entryPoints: ['src/vercel.ts'],
  outfile: `${fn}/index.mjs`,
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  // Express, Mongoose and their dependencies are CommonJS and expect these globals.
  banner: {
    js: [
      "import { createRequire } from 'node:module';",
      "import { fileURLToPath as __fileURLToPath } from 'node:url';",
      "import { dirname as __pathDirname } from 'node:path';",
      'const require = createRequire(import.meta.url);',
      'const __filename = __fileURLToPath(import.meta.url);',
      'const __dirname = __pathDirname(__filename);',
    ].join('\n'),
  },
  logLevel: 'warning',
});

await writeFile(
  `${fn}/.vc-config.json`,
  JSON.stringify({ runtime: 'nodejs22.x', handler: 'index.mjs', launcherType: 'Nodejs' }),
);
await writeFile(
  `${out}/config.json`,
  JSON.stringify({ version: 3, routes: [{ src: '/(.*)', dest: '/api' }] }),
);

console.log(`Built ${fn}`);
