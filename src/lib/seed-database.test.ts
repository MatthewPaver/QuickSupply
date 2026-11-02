import { expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { coverSeedDate } from "./seed-dates";

it.each([
  ["2026-10-08T12:00:00Z", 2, "2026-10-12"],
  ["2026-10-09T12:00:00Z", 1, "2026-10-12"],
  ["2026-10-10T12:00:00Z", 0, "2026-10-12"],
  ["2026-10-11T12:00:00Z", 0, "2026-10-12"],
  ["2026-10-12T12:00:00Z", -1, "2026-10-09"],
  ["2026-10-14T12:00:00Z", -3, "2026-10-09"],
  ["2026-10-08T12:00:00Z", 1, "2026-10-09"],
  ["2026-10-12T12:00:00Z", 1, "2026-10-13"],
  ["2026-03-28T23:30:00Z", 1, "2026-03-30"],
] as const)("keeps cover offset %s + %s on a weekday", (iso, offset, expected) => {
  const base = new Date(iso);
  expect(coverSeedDate(offset, base)).toBe(expected);
  expect(base.toISOString()).toBe(iso.replace("Z", ".000Z"));
});

it("seeds only the explicitly selected demo database", () => {
  const root = process.cwd();
  const temporary = mkdtempSync(path.join(tmpdir(), "quicksupply-seed-"));
  const selected = path.join(temporary, "selected.db");
  const sqlite = new Database(selected);
  try {
    migrate(drizzle(sqlite), { migrationsFolder: path.join(root, "drizzle") });
    execFileSync(process.execPath, ["--import", path.join(root, "node_modules/tsx/dist/loader.mjs"),
      path.join(root, "scripts/seed.ts")], {
      cwd: temporary,
      env: { ...process.env, NODE_ENV: "test", DATABASE_URL: selected },
      stdio: "pipe",
    });
    expect(sqlite.prepare("SELECT count(*) AS n FROM schools").get()).toEqual({ n: 5 });
    const requests = sqlite.prepare("SELECT date FROM cover_requests").all() as { date: string }[];
    expect(requests).toHaveLength(8);
    expect(requests.every(({ date }) => ![0, 6].includes(new Date(`${date}T12:00:00Z`).getUTCDay()))).toBe(true);
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
    expect(() => execFileSync(process.execPath, ["--import", path.join(root, "node_modules/tsx/dist/loader.mjs"),
      path.join(root, "scripts/seed.ts")], {
      cwd: temporary,
      env: { ...process.env, NODE_ENV: "production", DATABASE_URL: selected, SEED_ALLOW_PRODUCTION: override },
      stdio: "pipe",
    })).toThrow(/Refusing to seed in production/);
    expect(readFileSync(selected, "utf8")).toBe("preserve-me");
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}, 30_000);
