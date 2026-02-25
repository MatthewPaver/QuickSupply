import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation: registers Sentry server/edge configs and
 * captures request errors from Server Components and middleware.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
