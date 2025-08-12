import * as tf from '@tensorflow/tfjs';
import { TensorflowService } from '@/services/tf/TensorflowService';
import { FeatureScaler } from '@/services/fraud/FeatureScaler';
import { RiskLabel, Transaction } from '@/types/model';

export type InferenceResult = {
  score: number; // 0-1
  label: RiskLabel;
  confidence: number;
  factors: string[];
  latencyMs: number;
};

export class BehaviorGuardAI {
  private static warmedUp = false;
  private static scaler: FeatureScaler | null = null;

  static async ensureReady(): Promise<void> {
    if (!TensorflowService.hasModel()) {
      await TensorflowService.initialize();
    }
    if (!this.scaler) {
      // Share scaler with FraudModelService’s loader (JSON is the same)
      const scalerJson = require('../../assets/models/feature_scaler.json');
      this.scaler = new FeatureScaler(scalerJson);
    }
    if (!this.warmedUp && TensorflowService.hasModel()) {
      try {
        const layers = TensorflowService.getLayersModel();
        if (layers) {
          const expects3D = Array.isArray(layers.inputs?.[0]?.shape) && (layers.inputs![0].shape!.length === 3);
          await tf.tidy(() => {
            const dummy = expects3D ? tf.zeros([1, 1, 100]) : tf.zeros([1, 100]);
            const out = layers.predict(dummy) as tf.Tensor;
            out.dispose();
          });
        }
      } catch {}
      this.warmedUp = true;
    }
  }

  static getScaler(): FeatureScaler {
    if (!this.scaler) throw new Error('Scaler not initialized');
    return this.scaler;
  }

  static mapRisk(score: number): RiskLabel {
    if (score <= 0.3) return 'LOW';
    if (score <= 0.7) return 'MEDIUM';
    return 'HIGH';
  }

  static async infer(scaledFeatures: number[], tx?: Partial<Transaction>): Promise<InferenceResult> {
    await this.ensureReady();
    const layers = TensorflowService.getLayersModel();
    const graph = TensorflowService.getGraphModel();
    const start = global.performance ? performance.now() : Date.now();
    let score = 0;
    try {
      if (layers) {
        const expects3D = Array.isArray(layers.inputs?.[0]?.shape) && (layers.inputs![0].shape!.length === 3);
        score = await tf.tidy(async () => {
          const inputTensor = expects3D
            ? tf.tensor3d([scaledFeatures], [1, 1, 100])
            : tf.tensor2d([scaledFeatures], [1, 100]);
          const output = layers.predict(inputTensor) as tf.Tensor;
          const data = await output.data();
          return (data[0] as number) ?? 0;
        });
      } else if (graph) {
        score = await tf.tidy(async () => {
          const inputTensor = tf.tensor2d([scaledFeatures], [1, 100]);
          const output = await graph.executeAsync(inputTensor) as tf.Tensor|tf.Tensor[];
          const tensor = Array.isArray(output) ? output[0] : output;
          const data = await tensor.data();
          return (data[0] as number) ?? 0;
        });
      }
    } catch {
      score = 0;
    }
    const end = global.performance ? performance.now() : Date.now();
    const latencyMs = end - start;
    const label = this.mapRisk(score);
    const confidence = Math.max(0, Math.min(1, 1 - Math.abs(0.5 - score) * 2));
    const factors: string[] = [];
    if (tx?.amount && tx.amount > 10000) factors.push('High-value transaction');
    return { score, label, confidence, factors, latencyMs };
  }
}


