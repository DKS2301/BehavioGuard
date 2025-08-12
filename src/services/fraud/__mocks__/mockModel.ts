export function mockPredictProbability(vector: number[]): number {
  // Simple deterministic mock: higher last feature -> higher risk
  const base = vector.reduce((a, b) => a + Math.abs(b), 0) / (vector.length || 1);
  return Math.max(0, Math.min(1, base / 10));
}


