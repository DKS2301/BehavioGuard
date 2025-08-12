import '@tensorflow/tfjs-react-native';
import * as tf from '@tensorflow/tfjs';
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';
import { ModelBootstrap } from '@/services/tf/ModelBootstrap';
import assetModuleMap from '@/services/tf/assetMap';

export class TensorflowService {
  private static initialized = false;
  private static layersModel: tf.LayersModel | null = null;
  private static graphModel: tf.GraphModel | null = null;

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
        // Try LayersModel first
        try {
          this.layersModel = await tf.loadLayersModel(ioHandler);
        } catch (e) {
          // If it's a GraphModel, load accordingly
          this.graphModel = await tf.loadGraphModel(ioHandler as any);
        }
      } else {
        // Fallback: try to load from FileSystem if present
        const modelPath = `${FileSystem.documentDirectory}models/model.json`;
        const info = await FileSystem.getInfoAsync(modelPath);
        if (info.exists) {
          try {
            this.layersModel = await tf.loadLayersModel(modelPath);
          } catch {
            this.graphModel = await tf.loadGraphModel(modelPath as any);
          }
        }
      }
    } catch (error) {
      // Silently continue to FS fallback below
      try {
        const modelPath = `${FileSystem.documentDirectory}models/model.json`;
        const info = await FileSystem.getInfoAsync(modelPath);
        if (info.exists) {
          try {
            this.layersModel = await tf.loadLayersModel(modelPath);
          } catch {
            this.graphModel = await tf.loadGraphModel(modelPath as any);
          }
        }
      } catch {}
    }
    this.initialized = true;
  }

  static getLayersModel(): tf.LayersModel | null { return this.layersModel; }
  static getGraphModel(): tf.GraphModel | null { return this.graphModel; }
  static hasModel(): boolean { return !!(this.layersModel || this.graphModel); }
}


