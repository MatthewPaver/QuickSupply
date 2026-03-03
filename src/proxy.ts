import { NextResponse } from "next/server";

/**
 * Security headers and pass-through. Runs on every request.
 */
export function proxy() {
  const response = NextResponse.next();

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // HSTS: enforce HTTPS for 1 year
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  // CSP: restrictive defaults; unsafe-inline for scripts (Next.js hydration) and styles (Tailwind)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://*.sentry.io",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self' https://*.sentry.io https://*.ingest.sentry.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  // Disable unused browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|desian-logo.svg).*)"],
};
