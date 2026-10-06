import { describe, expect, it } from "vitest";

import { dfeTeacherVacancyContext } from "./market-context";

describe("DfE market context", () => {
  it("is aggregate, traced and outside the matching feature set", () => {
    expect(dfeTeacherVacancyContext.source.publisher).toBe("Department for Education");
    expect(dfeTeacherVacancyContext.source.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(dfeTeacherVacancyContext.scopes.liverpool.schools_reporting).toBeGreaterThan(0);
    expect(JSON.stringify(dfeTeacherVacancyContext)).not.toContain("school_name");
    expect(dfeTeacherVacancyContext.use_boundary).toContain("not features");
  });
});
