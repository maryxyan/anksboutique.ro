
import * as fs from "node:fs";
import * as path from "node:path";

type EnvMap = Record<string, string>;

const loadedFromFile = new Set<string>();

function parseEnvFile(content: string): EnvMap {
  const env: EnvMap = {};
  const lines = content.split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    const line = lines[index++];
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    if (!key) {
      continue;
    }

    let value = line.slice(equalsIndex + 1).trimStart();

    if (value.startsWith('"') || value.startsWith("'")) {
      const quote = value[0];
      value = value.slice(1);

      while (index < lines.length) {
        if (value.endsWith(quote)) {
          value = value.slice(0, -1);
          break;
        }

        value += "\n" + lines[index++];
      }

      if (quote === '"') {
        value = value
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, "\\");
      }
    }

    env[key] = value.trim();
  }

  return env;
}

function loadEnvFile(filePath: string): void {
  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = parseEnvFile(content);

  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] !== undefined && !loadedFromFile.has(key)) {
      continue;
    }

    process.env[key] = value;
    loadedFromFile.add(key);
  }
}

function loadNearestEnvFiles(startDir: string): string[] {
  const loadedFiles: string[] = [];
  const directories: string[] = [];
  const envFiles = [".env", ".env.local"];
  let currentDir = path.resolve(startDir);

  while (!directories.includes(currentDir)) {
    directories.push(currentDir);

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }

    currentDir = parentDir;
  }

  for (const directory of directories.reverse()) {
    for (const envFile of envFiles) {
      const candidate = path.join(directory, envFile);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        loadEnvFile(candidate);
        loadedFiles.push(candidate);
      }
    }
  }

  return loadedFiles;
}

const loadedEnvFiles = loadNearestEnvFiles(process.cwd());

if (loadedEnvFiles.length > 0) {
  console.log(`[bootstrap] Loaded env file(s): ${loadedEnvFiles.join(", ")}`);
}

const [{ default: app }, { logger }, { getNetopiaStartupDiagnostics, loadConfigFromEnv }, { ensureLabelsSeeded }] =
  await Promise.all([
    import("./app"),
    import("./lib/logger"),
    import("./lib/netopia"),
    import("@workspace/db"),
  ]);

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const netopiaConfig = loadConfigFromEnv();
const netopiaDiagnostics = getNetopiaStartupDiagnostics(netopiaConfig);

logger.info(
  {
    netopia: netopiaDiagnostics,
  },
  "Netopia startup self-test",
);

if (!netopiaDiagnostics.publicKeyValid || !netopiaDiagnostics.privateKeyValid) {
  logger.warn(
    {
      netopia: netopiaDiagnostics,
    },
    "Netopia keys are not fully loadable",
  );
} else if (netopiaDiagnostics.keyPairMatches === false) {
  logger.warn(
    {
      netopia: netopiaDiagnostics,
    },
    "Netopia public/private key fingerprints do not match",
  );
}

await ensureLabelsSeeded();

app.listen(port, "0.0.0.0", (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port, interface: "0.0.0.0" }, "Server listening");
});
