import { spawn } from 'node:child_process';

const commands = [
  ['API', ['start', '--prefix', 'services/dealers']],
  ['React', ['run', 'dev', '--prefix', 'server/frontend']],
];

const children = commands.map(([name, args]) => {
  const child = spawn('npm', args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });
  child.on('error', (error) => console.error(`${name} failed to start:`, error));
  return child;
});

let stopping = false;
function stop(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill(signal);
  }
}

for (const child of children) {
  child.on('exit', (code) => {
    if (!stopping) {
      stop();
      process.exitCode = code || 1;
    }
  });
}

process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
