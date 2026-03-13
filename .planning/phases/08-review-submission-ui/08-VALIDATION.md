---
phase: 8
slug: review-submission-ui
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + TypeScript compile |
| **Config file** | playwright.config.ts |
| **Quick run command** | `pnpm tsc --noEmit` |
| **Full suite command** | `pnpm playwright test` |
| **Estimated runtime** | ~30 seconds (tsc), ~120 seconds (playwright) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm tsc --noEmit`
- **After every plan wave:** Run `pnpm tsc --noEmit`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | RVW-01, RVW-02, RVW-03, RVW-04 | compile | `pnpm tsc --noEmit` | ✅ | ⬜ pending |
| 08-01-02 | 01 | 1 | RVW-05 | compile | `pnpm tsc --noEmit` | ✅ | ⬜ pending |
| 08-02-01 | 02 | 2 | RVW-06 | compile | `pnpm tsc --noEmit` | ✅ | ⬜ pending |
| 08-02-02 | 02 | 2 | RVW-05, RVW-06 | compile | `pnpm tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No new test infrastructure needed.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| "Leave Review" prompt visible on completed booking | RVW-01 | Requires browser session as school user | Log in as school, navigate to completed bookings, confirm CTA is visible |
| Star rating renders and submits | RVW-02 | Interactive UI interaction | Click star rating, submit, confirm toast |
| Comment field max 500 chars enforced | RVW-03 | Input constraint | Type 501 chars, confirm truncation/error |
| Rebook toggle captured | RVW-04 | Interactive UI | Toggle yes/no, submit, check DB |
| Review appears on teacher agency profile | RVW-05 | Cross-portal check | Submit review as school, open teacher profile as agency, confirm card appears |
| agencyRating updates immediately | RVW-06 | Real-time data propagation | Submit review, reload teacher list/engine, check updated average |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
