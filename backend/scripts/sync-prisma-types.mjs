import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, 'node_modules', '.prisma', 'client');
const targetDir = path.join(rootDir, 'node_modules', '@prisma', 'client');

const filesToCopy = [
  'client.d.ts',
  'default.d.ts',
  'edge.d.ts',
  'index.d.ts',
  'wasm.d.ts',
];

await mkdir(targetDir, { recursive: true });

const availableFiles = new Set(await readdir(sourceDir));

for (const fileName of filesToCopy) {
  if (!availableFiles.has(fileName)) {
    continue;
  }

  await copyFile(path.join(sourceDir, fileName), path.join(targetDir, fileName));
}
