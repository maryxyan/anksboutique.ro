import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageDirectory = path.dirname(
  path.dirname(fileURLToPath(import.meta.url)),
);
const migrationsDirectory = path.join(packageDirectory, "drizzle");
const journalPath = path.join(migrationsDirectory, "meta", "_journal.json");

const journal = JSON.parse(await readFile(journalPath, "utf8"));
const entries = journal.entries ?? [];
const sqlFiles = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith(".sql"))
  .sort();
const journalFiles = entries.map((entry) => `${entry.tag}.sql`).sort();

if (JSON.stringify(sqlFiles) !== JSON.stringify(journalFiles)) {
  throw new Error(
    `Migration files and Drizzle journal differ.\nFiles: ${sqlFiles.join(", ")}\nJournal: ${journalFiles.join(", ")}`,
  );
}

entries.forEach((entry, index) => {
  if (entry.idx !== index) {
    throw new Error(
      `Migration journal index ${entry.idx} is out of sequence; expected ${index}.`,
    );
  }
});

const destructivePatterns = [
  /\bDROP\s+(?:TABLE|SCHEMA|DATABASE|COLUMN|CONSTRAINT|INDEX)\b/i,
  /\bTRUNCATE\b/i,
  /\bDELETE\s+FROM\b/i,
  /\bALTER\s+TABLE\b[\s\S]*?\bALTER\s+COLUMN\b[\s\S]*?\bTYPE\b/i,
  /\bALTER\s+TABLE\b[\s\S]*?\bRENAME\b/i,
];

for (const file of sqlFiles) {
  const sql = (await readFile(path.join(migrationsDirectory, file), "utf8"))
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");

  for (const pattern of destructivePatterns) {
    if (pattern.test(sql)) {
      throw new Error(
        `${file} contains destructive SQL (${pattern}). Use an additive expand/contract migration and document any exceptional recovery procedure.`,
      );
    }
  }
}

console.log(
  `Validated ${sqlFiles.length} ordered, non-destructive migrations.`,
);
