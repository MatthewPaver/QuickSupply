import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => store) }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
import { createSession, getSession } from "./auth";

const NOW = new Date("2026-10-23T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const SECRET = "synthetic-session-test-secret-only";
const USER = { userId: "synthetic-user", role: "teacher", name: "Fictional Teacher" };
function cookieFor(session: object) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64");
  return `${payload}.${createHmac("sha256", SECRET).update(payload).digest("hex")}`;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.stubEnv("SESSION_SECRET", SECRET);
  vi.clearAllMocks();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("signed session lifetime", () => {
  it("accepts a fresh session and rejects the same cookie at the 24-hour boundary", async () => {
    await createSession(USER.userId, "teacher", USER.name);
    const [name, value, options] = store.set.mock.calls[0];
    expect(name).toBe("qs_session");
    expect(options).toMatchObject({ maxAge: DAY / 1000, httpOnly: true, sameSite: "lax" });
    store.get.mockReturnValue({ value });
    expect(await getSession()).toMatchObject(USER);
    vi.setSystemTime(NOW.getTime() + DAY - 1);
    expect(await getSession()).toMatchObject(USER);
    vi.setSystemTime(NOW.getTime() + DAY);
    expect(await getSession()).toBeNull();
  });

  it.each([undefined, null, "1792843200000", -1, Infinity])("rejects missing or invalid signed expiry %s", async (expiresAt) => {
    store.get.mockReturnValue({ value: cookieFor({ ...USER, expiresAt }) });
    expect(await getSession()).toBeNull();
  });

  it("rejects an expired cookie even when the client continues sending it", async () => {
    store.get.mockReturnValue({ value: cookieFor({ ...USER, expiresAt: NOW.getTime() - 1 }) });
    expect(await getSession()).toBeNull();
  });

  it("rejects tampered expiry without a matching signature", async () => {
    const original = cookieFor({ ...USER, expiresAt: NOW.getTime() - 1 });
    const changed = cookieFor({ ...USER, expiresAt: NOW.getTime() + DAY }).split(".")[0];
    store.get.mockReturnValue({ value: `${changed}.${original.split(".")[1]}` });
    expect(await getSession()).toBeNull();
  });
});
