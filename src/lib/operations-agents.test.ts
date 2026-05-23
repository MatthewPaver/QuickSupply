import { describe, expect, it } from "vitest";
import {
  agencyHandoffSummaryAgent,
  cancellationRiskAgent,
  complianceExpiryAgent,
  coverMatchingAgent,
  timesheetDisputeAgent,
} from "./operations-agents";

describe("operations agents", () => {
  it("flags thin cover shortlists", () => {
    const signal = coverMatchingAgent({
      rankedTeachers: [{ teacherId: "t1", score: 90, complianceStatus: "compliant", distanceMiles: 3 }],
    });

    expect(signal.status).toBe("review");
    expect(signal.actions.length).toBeGreaterThan(0);
  });

  it("flags urgent compliance expiry", () => {
    const signal = complianceExpiryAgent([{ teacherId: "t1", documentType: "dbs", daysUntilExpiry: 4 }]);

    expect(signal.status).toBe("review");
  });

  it("keeps disputed timesheets out of normal flow", () => {
    const signal = timesheetDisputeAgent({ status: "disputed", disputeReason: "Wrong hours", totalHours: 7 });

    expect(signal.status).toBe("review");
    expect(signal.actions[0]).toContain("invoice");
  });

  it("summarises agency handoff state", () => {
    const risk = cancellationRiskAgent({ isEmergency: true, hoursUntilStart: 6, offeredCount: 4, declinedCount: 3 });
    const summary = agencyHandoffSummaryAgent([risk]);

    expect(risk.status).toBe("review");
    expect(summary.status).toBe("review");
  });
});
