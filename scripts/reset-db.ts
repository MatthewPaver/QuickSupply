import fs from "fs";
import path from "path";

const dbPath = path.join(process.cwd(), "quicksupply.db");

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log("Database deleted.");
} else {
  console.log("No database file found.");
}

// Also clean WAL files
[dbPath + "-wal", dbPath + "-shm"].forEach((f) => {
  if (fs.existsSync(f)) fs.unlinkSync(f);
});

console.log("Run `pnpm db:migrate && pnpm db:seed` to recreate.");
