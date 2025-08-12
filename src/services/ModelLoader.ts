import { FraudModelMetadata } from '@/types/model';

export class ModelLoader {
  static loadMetadata(): FraudModelMetadata {
    // This JSON is bundled via Metro; ensure it's present in assets/models/model_metadata.json
    const meta = require('../../assets/models/model_metadata.json');
    const architecture = String(meta.architecture ?? '');
    const featureOrder: string[] = Array.isArray(meta.featureOrder) ? meta.featureOrder : [];
    const inputShape = Array.isArray(meta.inputShape) ? meta.inputShape : [];
    const performance = { f1: Number(meta.trainMetrics?.f1 ?? 0), accuracy: Number(meta.trainMetrics?.accuracy ?? 0) };

    return {
      architecture,
      inputFeatures: Number((inputShape?.[2] ?? 100) || 100),
      featureOrder,
      performance,
    };
  }
}


