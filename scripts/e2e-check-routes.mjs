/**
 * E2E route checker: hits every screen with appropriate auth.
 * Run with: node scripts/e2e-check-routes.mjs
 * Requires dev server: pnpm dev
 */

const BASE = "http://localhost:3000";

async function fetchWithCookie(cookie, path, options = {}) {
  const res = await fetch(BASE + path, {
    redirect: "manual",
    headers: cookie ? { Cookie: cookie } : {},
    ...options,
  });
  return res;
}

async function login(userId, role, name) {
  const res = await fetch(BASE + "/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, role, name }),
    redirect: "manual",
  });
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("No session cookie from login");
  return setCookie.split(";")[0];
}

function status(res) {
  return res.status;
}

async function main() {
  const results = [];

  // --- Public ---
  const landing = await fetchWithCookie(null, "/");
  results.push({ path: "/", status: status(landing), role: "public" });
  const loginPage = await fetchWithCookie(null, "/login");
  results.push({ path: "/login", status: status(loginPage), role: "public" });

  // --- School portal ---
  let cookie = await login("school-1", "school", "St. Mary's Catholic Primary");
  const schoolRoutes = [
    "/school/dashboard",
    "/school/requests",
    "/school/requests/new",
    "/school/history",
  ];
  for (const path of schoolRoutes) {
    const res = await fetchWithCookie(cookie, path);
    results.push({ path, status: status(res), role: "school" });
  }

  // --- Teacher portal ---
  cookie = await login("teacher-1", "teacher", "Sarah Johnson");
  const teacherRoutes = [
    "/teacher/dashboard",
    "/teacher/jobs",
    "/teacher/availability",
    "/teacher/profile",
  ];
  for (const path of teacherRoutes) {
    const res = await fetchWithCookie(cookie, path);
    results.push({ path, status: status(res), role: "teacher" });
  }

  // --- Agency portal ---
  cookie = await login("agent-1", "agent", "Sarah Mitchell");
  const agencyRoutes = [
    "/agency/dashboard",
    "/agency/requests",
    "/agency/teachers",
    "/agency/schools",
    "/agency/bookings",
    "/agency/agents",
    "/agency/settings",
  ];
  for (const path of agencyRoutes) {
    const res = await fetchWithCookie(cookie, path);
    results.push({ path, status: status(res), role: "agency" });
  }

  // Agency request detail: get first request id from list page
  const listRes = await fetchWithCookie(cookie, "/agency/requests");
  const listHtml = await listRes.text();
  const match = listHtml.match(/href="\/agency\/requests\/([^"]+)"/);
  if (match) {
    const reqId = match[1];
    const detailRes = await fetchWithCookie(cookie, "/agency/requests/" + reqId);
    results.push({
      path: "/agency/requests/" + reqId,
      status: status(detailRes),
      role: "agency",
    });
  }

  // Agency teacher detail: get first teacher id
  const teachersRes = await fetchWithCookie(cookie, "/agency/teachers");
  const teachersHtml = await teachersRes.text();
  const teacherMatch = teachersHtml.match(/href="\/agency\/teachers\/([^"]+)"/);
  if (teacherMatch) {
    const teacherId = teacherMatch[1];
    const teacherDetailRes = await fetchWithCookie(
      cookie,
      "/agency/teachers/" + teacherId
    );
    results.push({
      path: "/agency/teachers/" + teacherId,
      status: status(teacherDetailRes),
      role: "agency",
    });
  }

  // --- Summary ---
  const failed = results.filter((r) => r.status !== 200 && r.status !== 304);
  console.log("E2E route check results:\n");
  for (const r of results) {
    const ok = r.status === 200 || r.status === 304 ? "✓" : "✗";
    console.log(`  ${ok} ${r.status} ${r.path} [${r.role}]`);
  }
  if (failed.length) {
    console.log("\nFailed:");
    failed.forEach((r) => console.log(`  ${r.path} -> ${r.status}`));
    process.exit(1);
  }
  console.log("\nAll routes returned 200/304.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
