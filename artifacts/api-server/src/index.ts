import app from "./app";
import { logger } from "./lib/logger";
import { getNetopiaStartupDiagnostics, loadConfigFromEnv } from "./lib/netopia";
import { ensureLabelsSeeded } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
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
