import { FeatureScaler } from '@/services/fraud/FeatureScaler';

describe('FeatureScaler', () => {
  it('maps raw features to vector of length 100', () => {
    const params = {
      mean: Array(100).fill(0),
      scale: Array(100).fill(1),
      featureOrder: Array.from({ length: 100 }, (_, i) => `f${i}`)
    };
    const scaler = new FeatureScaler(params);
    const raw: Record<string, number> = { f0: 1, f50: 2, f99: 3 };
    const vec = scaler.transform(raw);
    expect(vec.length).toBe(100);
    expect(vec[0]).toBe(1);
    expect(vec[50]).toBe(2);
    expect(vec[99]).toBe(3);
  });
});


