/**
 * Pure scoring logic extracted from the assignment engine.
 *
 * Keeping this free of database dependencies makes the math
 * easy to unit-test.
 */

export interface ScoringInput {
  isPreferred: boolean;
  agencyRating: number;
  schoolReviewAvg: number | null;
  distanceMiles: number;
  canDrive: boolean;
  previouslyWorked: boolean;
  subjectMatch: boolean;
}

export interface ScoringWeights {
  preferred: number;
  rating: number;
  review: number;
  distance: number;
  drive: number;
  familiarity: number;
  subjectMatch: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  preferred: 200,
  rating: 20,
  review: 10,
  distance: 30,
  drive: 25,
  familiarity: 15,
  subjectMatch: 30,
};

/**
 * Calculate a numeric score for a teacher-request pairing.
 *
 * Higher is better.  The caller supplies pre-computed facts
 * (distances, averages, etc.) so this function stays pure.
 */
export function calculateScore(
  input: ScoringInput,
  weights: ScoringWeights = DEFAULT_WEIGHTS,
): number {
  let score = 0;

  if (input.isPreferred) score += weights.preferred;

  score += input.agencyRating * weights.rating;

  if (input.schoolReviewAvg) score += input.schoolReviewAvg * weights.review;

  score += Math.min(
    weights.distance,
    weights.distance / Math.max(input.distanceMiles, 0.5),
  );

  if (input.canDrive) score += weights.drive;

  if (input.previouslyWorked) score += weights.familiarity;

  if (input.subjectMatch) score += weights.subjectMatch;

  return score;
}
