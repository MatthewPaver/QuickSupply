import { describe, it, expect } from "vitest";
import {
  calculateScore,
  DEFAULT_WEIGHTS,
  type ScoringInput,
  type ScoringWeights,
} from "./scoring";

/** Helper: returns a baseline input where every bonus is disabled. */
function baseInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    isPreferred: false,
    agencyRating: 0,
    schoolReviewAvg: null,
    distanceMiles: 10,
    canDrive: false,
    previouslyWorked: false,
    subjectMatch: false,
    ...overrides,
  };
}

describe("calculateScore", () => {
  // ------------------------------------------------------------------
  // Individual weight contributions
  // ------------------------------------------------------------------

  it("adds +preferred weight when teacher is preferred", () => {
    const without = calculateScore(baseInput({ isPreferred: false }));
    const with_ = calculateScore(baseInput({ isPreferred: true }));
    expect(with_ - without).toBe(DEFAULT_WEIGHTS.preferred); // 200
  });

  it("higher agency rating produces a higher score", () => {
    const low = calculateScore(baseInput({ agencyRating: 2 }));
    const high = calculateScore(baseInput({ agencyRating: 5 }));
    expect(high).toBeGreaterThan(low);
    // Exact delta = (5-2) * rating weight
    expect(high - low).toBeCloseTo(3 * DEFAULT_WEIGHTS.rating);
  });

  it("school review avg contributes when present", () => {
    const without = calculateScore(baseInput({ schoolReviewAvg: null }));
    const with_ = calculateScore(baseInput({ schoolReviewAvg: 4 }));
    expect(with_).toBeGreaterThan(without);
    expect(with_ - without).toBeCloseTo(4 * DEFAULT_WEIGHTS.review);
  });

  it("school review avg is ignored when null", () => {
    const a = calculateScore(baseInput({ schoolReviewAvg: null }));
    const b = calculateScore(baseInput({ schoolReviewAvg: null }));
    expect(a).toBe(b);
  });

  it("closer distance produces a higher score", () => {
    const far = calculateScore(baseInput({ distanceMiles: 20 }));
    const close = calculateScore(baseInput({ distanceMiles: 1 }));
    expect(close).toBeGreaterThan(far);
  });

  it("distance score is capped at the distance weight", () => {
    // At 0.5 miles (the clamp floor), score = weight/0.5 => 60, but capped at weight=30
    const veryClose = calculateScore(baseInput({ distanceMiles: 0.1 }));
    const atCap = calculateScore(baseInput({ distanceMiles: 0.5 }));
    // Both should yield the same distance component (capped at weights.distance)
    expect(veryClose).toBe(atCap);
  });

  it("can drive adds bonus", () => {
    const without = calculateScore(baseInput({ canDrive: false }));
    const with_ = calculateScore(baseInput({ canDrive: true }));
    expect(with_ - without).toBe(DEFAULT_WEIGHTS.drive); // 25
  });

  it("previously worked adds bonus", () => {
    const without = calculateScore(baseInput({ previouslyWorked: false }));
    const with_ = calculateScore(baseInput({ previouslyWorked: true }));
    expect(with_ - without).toBe(DEFAULT_WEIGHTS.familiarity); // 15
  });

  it("subject match adds bonus", () => {
    const without = calculateScore(baseInput({ subjectMatch: false }));
    const with_ = calculateScore(baseInput({ subjectMatch: true }));
    expect(with_ - without).toBe(DEFAULT_WEIGHTS.subjectMatch); // 30
  });

  // ------------------------------------------------------------------
  // Combined / ordering
  // ------------------------------------------------------------------

  it("preferred + close + good rating ranks highest", () => {
    const best = calculateScore(
      baseInput({
        isPreferred: true,
        agencyRating: 5,
        distanceMiles: 1,
        canDrive: true,
        previouslyWorked: true,
        subjectMatch: true,
        schoolReviewAvg: 5,
      }),
    );

    const mediocre = calculateScore(
      baseInput({
        agencyRating: 3,
        distanceMiles: 10,
      }),
    );

    expect(best).toBeGreaterThan(mediocre);
  });

  it("default weights produce expected relative ordering", () => {
    const teacher1 = calculateScore(
      baseInput({ agencyRating: 5, distanceMiles: 2, canDrive: true }),
    );
    const teacher2 = calculateScore(
      baseInput({ agencyRating: 3, distanceMiles: 15 }),
    );
    const teacher3 = calculateScore(
      baseInput({ isPreferred: true, agencyRating: 2, distanceMiles: 20 }),
    );

    // Preferred boost (+200) should dominate even with low rating/far distance
    expect(teacher3).toBeGreaterThan(teacher1);
    expect(teacher1).toBeGreaterThan(teacher2);
  });

  // ------------------------------------------------------------------
  // Edge cases
  // ------------------------------------------------------------------

  it("zero distance does not cause division by zero", () => {
    expect(() =>
      calculateScore(baseInput({ distanceMiles: 0 })),
    ).not.toThrow();

    const score = calculateScore(baseInput({ distanceMiles: 0 }));
    expect(Number.isFinite(score)).toBe(true);
  });

  it("negative distance is clamped to 0.5 floor", () => {
    const negDist = calculateScore(baseInput({ distanceMiles: -5 }));
    const zeroDist = calculateScore(baseInput({ distanceMiles: 0 }));
    expect(negDist).toBe(zeroDist);
  });

  // ------------------------------------------------------------------
  // Custom weights
  // ------------------------------------------------------------------

  it("custom weights override defaults", () => {
    const custom: ScoringWeights = {
      preferred: 500,
      rating: 0,
      review: 0,
      distance: 0,
      drive: 0,
      familiarity: 0,
      subjectMatch: 0,
    };

    const score = calculateScore(
      baseInput({ isPreferred: true, agencyRating: 5, canDrive: true }),
      custom,
    );

    // Only preferred contributes
    expect(score).toBe(500);
  });

  it("all-zero weights produce a score of zero", () => {
    const zero: ScoringWeights = {
      preferred: 0,
      rating: 0,
      review: 0,
      distance: 0,
      drive: 0,
      familiarity: 0,
      subjectMatch: 0,
    };

    const score = calculateScore(
      baseInput({
        isPreferred: true,
        agencyRating: 5,
        schoolReviewAvg: 5,
        canDrive: true,
        previouslyWorked: true,
        subjectMatch: true,
      }),
      zero,
    );

    expect(score).toBe(0);
  });

  it("uses DEFAULT_WEIGHTS when no weights are passed", () => {
    const withDefault = calculateScore(baseInput({ agencyRating: 3 }));
    const withExplicit = calculateScore(
      baseInput({ agencyRating: 3 }),
      DEFAULT_WEIGHTS,
    );
    expect(withDefault).toBe(withExplicit);
  });
});
