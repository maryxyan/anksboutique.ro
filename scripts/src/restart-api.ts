import { spawn, execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");
const apiServerDir = path.join(projectRoot, "artifacts", "api-server");
const pidFilePath = path.join(apiServerDir, "api-server.pid");

function log(...args: unknown[]) {
  console.log("[restart-api]", ...args);
}

function killOldProcess(pid: number) {
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /F`);
    } else {
      process.kill(pid, "SIGTERM");
    }
    log(`Stopped old API process ${pid}`);
  } catch (error) {
    log(`Failed to stop old API process ${pid}:`, error instanceof Error ? error.message : error);
  }
}

function isProcessRunning(pid: number) {
  try {
    if (process.platform === "win32") {
      execSync(`tasklist /FI "PID eq ${pid}" /NH`);
      return true;
    }
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPidFile(): number | null {
  try {
    if (!fs.existsSync(pidFilePath)) return null;
    const content = fs.readFileSync(pidFilePath, "utf-8").trim();
    const pid = Number(content);
    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch (error) {
    log("Unable to read pid file:", error instanceof Error ? error.message : error);
    return null;
  }
}

function startApiServer() {
  log("Building API server...");
  execSync("pnpm run build", { cwd: apiServerDir, stdio: "inherit" });

  log("Starting API server...");
  const command = process.platform === "win32" ? "pnpm" : "pnpm";
  const args = ["run", "start"];
  const child = spawn(command, args, {
    cwd: apiServerDir,
    shell: true,
    detached: true,
    stdio: "ignore",
  });

  child.unref();
  log("API server started.");
}

function cleanupPidFile() {
  try {
    if (fs.existsSync(pidFilePath)) {
      fs.unlinkSync(pidFilePath);
      log("Removed stale pid file");
    }
  } catch (error) {
    log("Failed to remove stale pid file:", error instanceof Error ? error.message : error);
  }
}

function main() {
  log(`Project root: ${projectRoot}`);
  log(`API server dir: ${apiServerDir}`);
  log(`PID file: ${pidFilePath}`);

  const oldPid = readPidFile();
  if (oldPid !== null) {
    log(`Found existing PID ${oldPid}`);
    if (isProcessRunning(oldPid)) {
      killOldProcess(oldPid);
    } else {
      log(`PID ${oldPid} is not running`);
    }
    cleanupPidFile();
  } else {
    log("No existing pid file found.");
  }

  startApiServer();
  log("Done. The API server should now be restarting in the background.");
}

main();
