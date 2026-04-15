import dotenv from 'dotenv';
import { spawn } from 'node:child_process';
import path from 'node:path';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
  override: true,
  quiet: true,
});

const args = process.argv.slice(2);
const command = process.platform === 'win32'
  ? path.resolve(process.cwd(), 'node_modules', '.bin', 'prisma.cmd')
  : path.resolve(process.cwd(), 'node_modules', '.bin', 'prisma');

const child = spawn(command, args, {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});

child.on('error', (error) => {
  console.error(error);
  process.exit(1);
});
