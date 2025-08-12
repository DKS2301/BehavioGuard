import '@tensorflow/tfjs-react-native';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';
import { ModelBootstrap } from '@/services/tf/ModelBootstrap';
import assetModuleMap from '@/services/tf/assetMap';

export class TensorflowService {
  private static initialized = false;
  private static model: tf.LayersModel | null = null;

  static async initialize(): Promise<void> {
    if (this.initialized) return;
    await tf.ready();
    // Ensure bundled assets are copied to the device FS (documentDirectory/models)
    await ModelBootstrap.ensureAssetsDeployed();

    // Preferred: load using bundleResourceIO from bundled assets via manifest/asset map
    try {
      const manifest = require('../../../assets/models/manifest.json') as { files: string[] };
      const modelJsonObject = assetModuleMap['model.json'];
      const weightModuleIds = manifest.files
        .filter((f) => f.endsWith('.bin'))
        .map((f) => assetModuleMap[f])
        .filter(Boolean);
      if (modelJsonObject && weightModuleIds.length > 0) {
        const ioHandler = bundleResourceIO(modelJsonObject, weightModuleIds);
        this.model = await tf.loadLayersModel(ioHandler);
      } else {
        // Fallback: try to load from FileSystem if present
        const modelPath = `${FileSystem.documentDirectory}models/model.json`;
        const info = await FileSystem.getInfoAsync(modelPath);
        if (info.exists) {
          this.model = await tf.loadLayersModel(modelPath);
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('bundleResourceIO load failed; falling back or using stub.', error);
      try {
        const modelPath = `${FileSystem.documentDirectory}models/model.json`;
        const info = await FileSystem.getInfoAsync(modelPath);
        if (info.exists) {
          this.model = await tf.loadLayersModel(modelPath);
        }
      } catch {}
    }
    this.initialized = true;
  }

  static getModel(): tf.LayersModel | null {
    return this.model;
  }
}


