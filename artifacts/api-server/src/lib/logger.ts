import pino, { type TransportTargetOptions } from "pino";

const isProduction = process.env.NODE_ENV === "production";
const defaultLogFilePath = isProduction ? "./logs/api-server.log" : "";
const logFilePath = process.env.LOG_FILE_PATH?.trim() || defaultLogFilePath;

const transportTargets: TransportTargetOptions[] = [];

if (isProduction) {
  transportTargets.push({
    target: "pino/file",
    options: { destination: 1 },
  } as TransportTargetOptions);
} else {
  transportTargets.push({
    target: "pino-pretty",
    options: { colorize: true, destination: 1 },
  } as TransportTargetOptions);
}

if (logFilePath) {
  transportTargets.push({
    target: "pino/file",
    options: {
      destination: logFilePath,
      mkdir: true,
      append: true,
    },
  } as TransportTargetOptions);
}

export const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? "info",
    redact: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
    ],
  },
  transportTargets.length ? pino.transport({ targets: transportTargets }) : undefined,
);
