# QuickSupply case study

## Starting point

QuickSupply began with an observed Liverpool supply-teacher booking experience that felt dated and coordination-heavy. The useful question was not “can I build another staffing marketplace?” It was:

> Can a same-day cover request move from a school, through an agency coordinator, to an eligible teacher without the current status disappearing into calls, messages, and separate screens?

That is a workflow and service-design problem. The prototype was built to make the handoffs concrete enough to test.

## The journey modelled

1. A school requests cover and states the role, date, subject, phase, and constraints.
2. The coordinator sees the request, gaps, and eligible pool in one operational view.
3. The matching engine ranks eligible teachers using explicit factors rather than a hidden AI score.
4. One timed offer is sent at a time. A decline or expiry advances the queue.
5. Manual override remains available because staffing exceptions cannot be automated away.
6. School, coordinator, and teacher see the same booking state through their own portal.
7. Compliance, cancellation, timesheet, review, and audit paths preserve the operational aftermath.

## Product decisions

| Decision | Reason |
|---|---|
| Separate three user surfaces | Each participant has a different job and different permissions. |
| Sequential rather than broadcast offers | It avoids creating several apparent winners for one assignment. |
| Deterministic eligibility and scoring | A coordinator can inspect why a teacher was included or excluded. |
| Human override | Availability and safeguarding exceptions need accountable judgement. |
| Seeded Liverpool demo | A stranger can replay the full workflow without real school or teacher data. |
| SSE for status changes | The value depends on reducing manual “what is happening?” messages. |

## What the build proves

- A full request-to-booking workflow can be represented as explicit, tested state transitions.
- School, agency, and teacher experiences can share one source of truth without becoming one generic admin dashboard.
- Matching logic can be inspectable and still support operational override.
- A product walkthrough can include the difficult paths, not just a happy-path CRUD demo.

## What it does not prove

- that a school or agency would switch from its current supplier;
- that the proposed matching factors are acceptable in real staffing decisions;
- that safeguarding, payroll, right-to-work, procurement, and data-protection requirements are complete;
- that the Liverpool observation generalises to a large enough commercial market;
- that a new marketplace can overcome existing network effects.

## Why the work remains useful

The commercial claim is intentionally modest. QuickSupply is evidence of product discovery, workflow architecture, operational state modelling, full-stack delivery, and test design. The recorded demo in the portfolio shows the product journey. The public repository lets an interviewer inspect the implementation and run it with synthetic data.

The official DfE teacher-vacancy data is included only as annual, aggregate market context. It does not validate the observed booking problem and it never enters individual eligibility or ranking. Preference is a scoring signal after eligibility; it cannot bypass unavailability, distance, emergency or contact-timing constraints.

## If the idea is revisited

Do not start by adding features. Run a short validation cycle:

1. Observe five real bookings across at least two agencies or school groups.
2. Measure time-to-confirm, number of handoffs, repeated data entry, failed offers, and status-chasing contacts.
3. Identify one buyer and one workflow owner.
4. Prototype only the bottleneck that occurs repeatedly.
5. Agree safeguarding and data responsibilities before using real people or schools.
6. Continue only if a design partner will replay live cases and pay for a pilot.

Until those gates are met, QuickSupply should stay a strong, honest case study rather than a startup claim.
