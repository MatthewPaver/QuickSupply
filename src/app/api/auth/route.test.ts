import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const cookieStore = vi.hoisted(() => ({ set: vi.fn(), delete: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

import { POST } from "./route";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

function login(userId = "school-1") {
  return POST(new NextRequest("http://localhost/api/auth", {
    method: "POST", body: JSON.stringify({ userId }),
    headers: { "content-type": "application/json" },
  }));
}

describe("demo authentication boundary", () => {
  it.each([
    [undefined, undefined], ["false", "true"], ["true", "false"],
  ])("rejects disabled server/client flags (%s, %s) without a cookie", async (server, client) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "unit-test-secret-not-for-deployment");
    vi.stubEnv("DEMO_MODE", server);
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", client);
    const response = await login();
    expect(response.status).toBe(403);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  it("issues a signed httpOnly session only when explicitly enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "unit-test-secret-not-for-deployment");
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    expect((await login()).status).toBe(200);
    expect(cookieStore.set).toHaveBeenCalledWith("qs_session", expect.any(String),
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: "lax" }));
  });

  it("never signs an unknown identity even in demo mode", async () => {
    vi.stubEnv("DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    expect((await login("not-a-demo-user")).status).toBe(403);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});
