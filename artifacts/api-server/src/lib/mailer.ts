import { execFile } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface HtmlEmail {
  to: string;
  subject: string;
  html: string;
}

function findMailScript(): string {
  const configured = process.env["MAIL_SCRIPT_PATH"]?.trim();
  const candidates = [
    configured,
    path.resolve(process.cwd(), "scripts/send-mail.php"),
    path.resolve(process.cwd(), "../../scripts/send-mail.php"),
  ].filter((candidate): candidate is string => Boolean(candidate));

  const script = candidates.find((candidate) => fs.existsSync(candidate));
  if (!script) {
    throw new Error("scripts/send-mail.php could not be found; set MAIL_SCRIPT_PATH");
  }
  return script;
}

export async function sendHtmlEmail(message: HtmlEmail): Promise<void> {
  const from = process.env["MAIL_FROM"]?.trim() || "contact@anksboutique.ro";
  const fromName = process.env["MAIL_FROM_NAME"]?.trim() || "Ank's Boutique";
  const php = process.env["PHP_BINARY"]?.trim() || "php";

  await execFileAsync(
    php,
    [
      findMailScript(),
      `--to=${message.to}`,
      `--subject=${message.subject}`,
      `--html=${message.html}`,
      `--from=${from}`,
      `--fromName=${fromName}`,
    ],
    { timeout: 30_000, maxBuffer: 1024 * 1024, windowsHide: true },
  );
}
