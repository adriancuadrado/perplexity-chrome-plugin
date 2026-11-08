import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const outputDirectory = path.join(projectRoot, 'dist');

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await cp(path.join(projectRoot, 'manifest.json'), path.join(outputDirectory, 'manifest.json'));

await build({
  entryPoints: [path.join(projectRoot, 'src/content.tsx')],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome120'],
  outfile: path.join(outputDirectory, 'content.js'),
  jsx: 'automatic',
  minify: true
});

console.log(`Built Chrome extension in ${path.relative(projectRoot, outputDirectory)}`);