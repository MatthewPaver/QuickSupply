# Audit fixes — 5 September 2026

This remains a fictional-data product case study, not a production staffing service. Existing local work was preserved; no commit, push or deployment was made.

## Fixed and verified

- Demo identity issuance now requires both the server `DEMO_MODE=true` and UI flag. Five real-route/session tests cover rejection without cookies, explicit enablement and unknown identities.
- The seed respects `DATABASE_URL`. A real migration/seed regression verifies that only the selected temporary database receives data. Production seed overrides must equal `1`; unset, `false` and `0` refuse before opening the database and preserve its contents.
- Pinned Node 22 and pnpm 10.34.5, tracked `.env.example`, explicit fictional first login and Chromium installation, and removed the `standalone` setting that conflicted with documented `pnpm start`.
- Aligned seeded school identities in login, demo auth, route checks and full-flow checks. README excludes brand/logo rights from the code license and prohibits production seeding advice.
- The full browser test uses visible controls for assignment; it no longer substitutes a direct API call if the Assign button is absent.
- A new browser regression reproduced the offline banner intercepting sign-out clicks. The banner now occupies normal document flow. Connectivity uses a hydration-safe external-store snapshot, avoiding duplicate warning markup. The full flow again uses normal pointer clicks rather than a JavaScript click bypass.
- CI exercises the full booking and offline-navigation workflows on an isolated demo database.
- Updated Next.js and paired ESLint configuration to 16.2.11, Sentry to 10.73.0, Resend to 6.26.0, and selected affected transitive packages. Scoped overrides select Sharp 0.35.0 and PostCSS 8.5.28 under Next; three compatibility tests check resolved versions, real resize/WebP encoding and CSS parsing. The version regression failed before the update; all three pass after it.

## Verification

- Initial clean pnpm installation completed; approved native SQLite/esbuild builds were rebuilt. No Sentry CLI or arbitrary dependency install scripts were enabled.
- Lint, TypeScript, **45 tests across nine files**, production build and final frozen-lockfile installation passed.
- Isolated database migration and seed completed: five fictional schools, 12 teachers, three agents, eight initial requests and two initial bookings.
- **Two browser tests passed**, including school request → agency assignment → teacher acceptance → filled state in both agency and school views, and offline-warning sign-out. These use a local production build, seeded identities and no external email/service credentials.
- The original hanging flow was a real pointer-interception bug, not a successful run. The new focused test showed the warning intercepting the button before the layout fix.

## Remaining limitations

- The production dependency audit fell from 61 reported advisories initially to **zero** after the updates and compatibility checks. A clean dependency audit is not a complete production-security review; no real email delivery or cloud integration was exercised.
- Build warnings remain for broad file tracing in the compliance-file route. The dependency installer also reports a Vite/esbuild peer-version warning; the current tests/build pass, but this should be resolved before treating the package as a supported template.
- Hosted deployment, external email, uploads, payments, safeguarding suitability and a complete production security review were not verified. The public recording and repository still describe the earlier release until these local changes are published.
