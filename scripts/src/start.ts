import { spawn, execSync, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeWorktreeRoot(rootPath: string): string {
  const parts = rootPath.split(path.sep);
  const worktreeIndex = parts.findIndex((part) => part.endsWith('.worktrees'));
  if (worktreeIndex === -1) {
    return rootPath;
  }

  const rootName = parts[worktreeIndex].replace(/\.worktrees$/, '');
  const parentParts = parts.slice(0, worktreeIndex);
  const candidate = path.join(...parentParts, rootName);
  return fs.existsSync(candidate) ? candidate : rootPath;
}

const candidateRoot = process.env.INIT_CWD ? path.resolve(process.env.INIT_CWD) : path.resolve(__dirname, '../../..');
const projectRoot = normalizeWorktreeRoot(candidateRoot);
const pgDataDir = process.env.PGDATA || 'C:\\Program Files\\PostgreSQL\\18\\data';

function spawnProcess(name: string, command: string, args: string[], env: Record<string, string>): ChildProcess {
  console.log(`⏳ Starting ${name}...`);
  
  // Use shell: true on Windows for running commands like pnpm/npm
  const isWindows = process.platform === 'win32';
  const child = spawn(command, args, {
    shell: isWindows,
    env: { ...process.env, ...env },
    cwd: projectRoot
  });

  child.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`[${name}] ${line.trim()}`);
      }
    }
  });

  child.stderr?.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.error(`[${name}] ${line.trim()}`);
      }
    }
  });

  child.on('error', (err) => {
    console.error(`[${name}] Failed to start:`, err);
  });

  return child;
}

async function main() {
  // ── 1. Start PostgreSQL ─────────────────────────────────────
  console.log('⏳ Starting PostgreSQL...');
  try {
    const pgLogPath = path.join(projectRoot, 'pg.log');
    // On Windows pg_ctl might require double quotes or escaping
    execSync(`pg_ctl start -D "${pgDataDir}" -l "${pgLogPath}"`, { stdio: 'ignore' });
    console.log('✅ PostgreSQL start command executed.');
  } catch (e) {
    console.log('⚠️ PostgreSQL start attempted. If it is already running, this is fine.');
  }

  // Small delay to let postgres boot up
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // ── 2. Start API Server ─────────────────────────────────────
  const apiProcess = spawnProcess(
    'API-Server',
    'pnpm',
    ['--dir', projectRoot, '--filter', '@workspace/api-server', 'run', 'dev'],
    {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://anksboutique@localhost:5432/anksboutique',
      PORT: '8080',
      NODE_ENV: 'development'
    }
  );

  // Wait 5 seconds just like start.ps1 did
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // ── 3. Start Frontend ───────────────────────────────────────
  const frontProcess = spawnProcess(
    'Frontend',
    'pnpm',
    ['--dir', projectRoot, '--filter', '@workspace/ank-boutique', 'run', 'dev'],
    {
      PORT: '5173',
      BASE_PATH: '/'
    }
  );

  // Wait 3 seconds
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log('\n==================================================');
  console.log('🚀  Anks Boutique is running!');
  console.log('    Frontend   →  http://localhost:5173');
  console.log('    API Server →  http://localhost:8080/api');
  console.log('==================================================\n');

  console.log('Press any key or Ctrl+C to stop all services...\n');

  // Setup raw mode for keypress detection if supported
  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
  }

  let isStopping = false;
  const cleanUp = () => {
    if (isStopping) return;
    isStopping = true;
    
    console.log('\n🛑 Stopping services...');
    
    // Kill processes
    try {
      if (process.platform === 'win32') {
        // On Windows, killing the process group / tree might be needed because of shell: true
        if (apiProcess.pid) execSync(`taskkill /pid ${apiProcess.pid} /t /f`, { stdio: 'ignore' });
        if (frontProcess.pid) execSync(`taskkill /pid ${frontProcess.pid} /t /f`, { stdio: 'ignore' });
      } else {
        apiProcess.kill();
        frontProcess.kill();
      }
    } catch (e) {
      // Ignore errors when killing
    }
    
    console.log('✅ Done. Goodbye!');
    process.exit(0);
  };

  if (process.stdin.isTTY) {
    process.stdin.on('keypress', (str, key) => {
      // Respect standard Ctrl+C in raw mode
      if (key.ctrl && key.name === 'c') {
        cleanUp();
      } else {
        cleanUp();
      }
    });
  }

  process.on('SIGINT', () => {
    cleanUp();
  });
  
  process.on('SIGTERM', () => {
    cleanUp();
  });
}

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
