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

    // Preferred: load directly from FileSystem where we deployed assets
    try {
      const modelPath = `${FileSystem.documentDirectory}models/model.json`;
      const info = await FileSystem.getInfoAsync(modelPath);
      if (info.exists) {
        try {
          this.layersModel = await tf.loadLayersModel(modelPath);
          // eslint-disable-next-line no-console
          console.log('[TensorflowService] Loaded LayersModel from FS (preferred)', {
            path: modelPath,
            inputs: this.layersModel.inputs?.map((i) => i.shape),
            outputs: this.layersModel.outputs?.map((o) => o.shape),
          });
          this.initialized = true;
          return;
        } catch (e) {
          try {
            this.graphModel = await tf.loadGraphModel(modelPath as any);
            // eslint-disable-next-line no-console
            console.log('[TensorflowService] Loaded GraphModel from FS (preferred)', { path: modelPath });
            this.initialized = true;
            return;
          } catch (e2) {
            // continue to bundled attempt below
          }
        }
      }
    } catch {}

    // Fallback: try using bundleResourceIO from bundled assets via manifest/asset map
    try {
      const manifest = require('../../../assets/models/manifest.json') as { files: string[] };
      const modelJsonObject = assetModuleMap['model.json'];
      const weightModuleIds = manifest.files
        .filter((f) => f.endsWith('.bin'))
        .map((f) => assetModuleMap[f])
        .filter(Boolean);
      // eslint-disable-next-line no-console
      console.log('[TensorflowService] Manifest files', manifest.files);
      // eslint-disable-next-line no-console
      console.log('[TensorflowService] Model JSON present', { hasModelJson: !!modelJsonObject, modelJsonType: typeof modelJsonObject });
      // eslint-disable-next-line no-console
      console.log('[TensorflowService] Weight modules', { count: weightModuleIds.length, types: weightModuleIds.map((w: any) => typeof w) });
      if (modelJsonObject && weightModuleIds.length > 0) {
        const ioHandler = bundleResourceIO(modelJsonObject, weightModuleIds);
        // Try LayersModel first
        try {
          this.layersModel = await tf.loadLayersModel(ioHandler);
          // eslint-disable-next-line no-console
          console.log('[TensorflowService] Loaded LayersModel from bundled assets', {
            inputs: this.layersModel.inputs?.map((i) => i.shape),
            outputs: this.layersModel.outputs?.map((o) => o.shape),
          });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('[TensorflowService] loadLayersModel failed; trying GraphModel', e);
          // If it's a GraphModel, load accordingly
          this.graphModel = await tf.loadGraphModel(ioHandler as any);
          // eslint-disable-next-line no-console
          console.log('[TensorflowService] Loaded GraphModel from bundled assets');
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('[TensorflowService] Bundle load attempt failed', error);
    }
    if (!this.layersModel && !this.graphModel) {
      // eslint-disable-next-line no-console
      console.warn('[TensorflowService] No model loaded; predictions will use fallback scoring. Check assets/models manifest and assetMap.');
    }
    this.initialized = true;
  }

  static getLayersModel(): tf.LayersModel | null { return this.layersModel; }
  static getGraphModel(): tf.GraphModel | null { return this.graphModel; }
  static hasModel(): boolean { return !!(this.layersModel || this.graphModel); }
}


