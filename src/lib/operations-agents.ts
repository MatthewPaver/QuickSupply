export interface OperationSignal {
  agent: string;
  status: "pass" | "review" | "block";
  headline: string;
  evidence: string[];
  actions: string[];
}

export interface CoverMatchInput {
  rankedTeachers: Array<{ teacherId: string; score: number; complianceStatus: string; distanceMiles: number }>;
  minimumShortlist?: number;
}

export function coverMatchingAgent(input: CoverMatchInput): OperationSignal {
  const eligible = input.rankedTeachers.filter((teacher) => teacher.complianceStatus === "compliant");
  const minimum = input.minimumShortlist ?? 3;
  return {
    agent: "cover_matching_agent",
    status: eligible.length >= minimum ? "pass" : "review",
    headline: `${eligible.length} compliant teachers in shortlist`,
    evidence: [`minimum=${minimum}`, `top_score=${eligible[0]?.score ?? 0}`],
    actions: eligible.length >= minimum ? [] : ["Escalate to agency team or widen search radius"],
  };
}

export function complianceExpiryAgent(documents: Array<{ teacherId: string; documentType: string; daysUntilExpiry: number }>): OperationSignal {
  const urgent = documents.filter((doc) => doc.daysUntilExpiry <= 7);
  const soon = documents.filter((doc) => doc.daysUntilExpiry > 7 && doc.daysUntilExpiry <= 30);
  return {
    agent: "compliance_expiry_agent",
    status: urgent.length > 0 ? "review" : "pass",
    headline: `${urgent.length} urgent and ${soon.length} upcoming compliance renewals`,
    evidence: urgent.map((doc) => `${doc.teacherId}:${doc.documentType}:${doc.daysUntilExpiry}d`),
    actions: urgent.length ? ["Notify teacher and agency team before sending more offers"] : [],
  };
}

export function timesheetDisputeAgent(timesheet: { status: string; disputeReason?: string | null; totalHours: number }): OperationSignal {
  const disputed = timesheet.status === "disputed";
  return {
    agent: "timesheet_dispute_agent",
    status: disputed ? "review" : "pass",
    headline: disputed ? "Timesheet requires agency review" : "Timesheet can continue through normal flow",
    evidence: [`status=${timesheet.status}`, `hours=${timesheet.totalHours}`, `reason=${timesheet.disputeReason ?? "none"}`],
    actions: disputed ? ["Send correction request to teacher and keep invoice line out of draft invoice"] : [],
  };
}

export function cancellationRiskAgent(request: { isEmergency: boolean; hoursUntilStart: number; offeredCount: number; declinedCount: number }): OperationSignal {
  const declineRate = request.offeredCount ? request.declinedCount / request.offeredCount : 0;
  const risky = request.isEmergency || request.hoursUntilStart < 18 || declineRate > 0.5;
  return {
    agent: "cancellation_risk_agent",
    status: risky ? "review" : "pass",
    headline: risky ? "Cover request has cancellation/fill risk" : "Cover request risk is normal",
    evidence: [`emergency=${request.isEmergency}`, `hours_until_start=${request.hoursUntilStart}`, `decline_rate=${declineRate.toFixed(2)}`],
    actions: risky ? ["Prepare manual callout and fallback teacher shortlist"] : [],
  };
}

export function agencyHandoffSummaryAgent(signals: OperationSignal[]): OperationSignal {
  const blockers = signals.filter((signal) => signal.status === "block");
  const reviews = signals.filter((signal) => signal.status === "review");
  return {
    agent: "agency_handoff_summary_agent",
    status: blockers.length ? "block" : reviews.length ? "review" : "pass",
    headline: blockers.length ? "Agency handoff blocked" : reviews.length ? "Agency handoff needs review" : "Agency handoff is clean",
    evidence: signals.map((signal) => `${signal.agent}:${signal.status}`),
    actions: signals.flatMap((signal) => signal.actions),
  };
}
