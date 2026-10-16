import { execFileSync } from 'node:child_process';
const python = process.env.PYTHON || 'python';
execFileSync(python, ['-B', '-m', 'unittest', 'discover', '-s', 'public/examples/idempotent-import', '-p', 'test_*.py'], {
  stdio: 'inherit', windowsHide: true, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
});
