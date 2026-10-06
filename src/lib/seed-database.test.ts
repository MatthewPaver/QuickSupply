import { expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

it("seeds only the explicitly selected demo database", () => {
  const root = process.cwd();
  const temporary = mkdtempSync(path.join(tmpdir(), "quicksupply-seed-"));
  const selected = path.join(temporary, "selected.db");
  const sqlite = new Database(selected);
  try {
    migrate(drizzle(sqlite), { migrationsFolder: path.join(root, "drizzle") });
    execFileSync(process.execPath, [path.join(root, "node_modules/tsx/dist/cli.mjs"),
      path.join(root, "scripts/seed.ts")], {
      cwd: temporary,
      env: { ...process.env, NODE_ENV: "test", DATABASE_URL: selected },
      stdio: "pipe",
    });
    expect(sqlite.prepare("SELECT count(*) AS n FROM schools").get()).toEqual({ n: 5 });
    expect(existsSync(path.join(temporary, "quicksupply.db"))).toBe(false);
  } finally {
    sqlite.close();
    rmSync(temporary, { recursive: true, force: true });
  }
}, 30_000);

it.each([undefined, "false", "0"])("refuses production seed override %s before opening the database", (override) => {
  const root = process.cwd();
  const temporary = mkdtempSync(path.join(tmpdir(), "quicksupply-seed-guard-"));
  const selected = path.join(temporary, "valued.db");
  writeFileSync(selected, "preserve-me");
  try {
    expect(() => execFileSync(process.execPath, [path.join(root, "node_modules/tsx/dist/cli.mjs"),
      path.join(root, "scripts/seed.ts")], {
      cwd: temporary,
      env: { ...process.env, NODE_ENV: "production", DATABASE_URL: selected, SEED_ALLOW_PRODUCTION: override },
      stdio: "pipe",
    })).toThrow();
    expect(readFileSync(selected, "utf8")).toBe("preserve-me");
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});
