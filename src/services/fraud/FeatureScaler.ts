// StandardScaler runtime compatible with values exported to JSON

export type StandardScalerParams = {
  mean: number[];
  scale: number[]; // 1/std
  featureOrder: string[];
};

export class FeatureScaler {
  private readonly mean: number[];
  private readonly scale: number[];
  readonly featureOrder: string[];

  constructor(params: StandardScalerParams) {
    this.mean = params.mean;
    this.scale = params.scale;
    this.featureOrder = params.featureOrder;
    if (this.mean.length !== 100 || this.scale.length !== 100) {
      throw new Error('Scaler must contain 100 features');
    }
  }

  transform(rawFeatures: Record<string, number>): number[] {
    const vector = this.featureOrder.map((name, idx) => {
      const value = rawFeatures[name] ?? 0;
      const centered = value - this.mean[idx];
      return centered * this.scale[idx];
    });
    return vector;
  }

  // Directly transform a 100-length feature vector already ordered to match scaler indices
  transformVector(vector: number[]): number[] {
    if (vector.length !== 100) {
      throw new Error(`Expected 100-length vector, received ${vector.length}`);
    }
    const out = new Array<number>(100);
    for (let i = 0; i < 100; i += 1) {
      out[i] = (vector[i] - this.mean[i]) * this.scale[i];
    }
    return out;
  }
}


