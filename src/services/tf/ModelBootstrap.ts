import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import assetModuleMap from './assetMap';

type Manifest = { files: string[] };

export class ModelBootstrap {
  static modelsDir = `${FileSystem.documentDirectory}models`;

  static async ensureAssetsDeployed(): Promise<void> {
    try {
      const manifest = require('../../../assets/models/manifest.json') as Manifest;
      await this.ensureDir(this.modelsDir);
      for (const filename of manifest.files) {
        const target = `${this.modelsDir}/${filename}`;
        const exists = await FileSystem.getInfoAsync(target);
        if (exists.exists) continue;
        const required = assetModuleMap[filename];
        if (!required) {
          // eslint-disable-next-line no-console
          console.warn(`No asset mapping for ${filename}. Update src/services/tf/assetMap.ts`);
          continue;
        }
        // For JSON files, Metro inlines the object and there is no asset to download/copy.
        // We handle JSON by writing the serialized content into the target file.
        if (filename.endsWith('.json')) {
          let content: any = required;
          // Patch Keras v3 -> TFJS compatibility: ensure InputLayer has batch_input_shape
          if (filename === 'model.json' && content?.modelTopology?.model_config?.config?.layers) {
            try {
              const layers = content.modelTopology.model_config.config.layers;
              for (const layer of layers) {
                if (layer?.class_name === 'InputLayer') {
                  const cfg = layer.config || {};
                  if (!cfg.batch_input_shape && cfg.batch_shape) {
                    cfg.batch_input_shape = cfg.batch_shape;
                    layer.config = cfg;
                  }
                }
              }
            } catch {}
          }
          const jsonString = JSON.stringify(content);
          await FileSystem.writeAsStringAsync(target, jsonString);
          // eslint-disable-next-line no-console
          console.log('[ModelBootstrap] Wrote JSON', { target });
          continue;
        }
        const asset = Asset.fromModule(required);
        await asset.downloadAsync();
        if (!asset.localUri) continue;
        await FileSystem.copyAsync({ from: asset.localUri, to: target });
        // eslint-disable-next-line no-console
        console.log('[ModelBootstrap] Copied BIN', { target });
      }
      // Post-deploy verification
      const verify = async (path: string) => (await FileSystem.getInfoAsync(path)).exists;
      const modelPath = `${this.modelsDir}/model.json`;
      const modelExists = await verify(modelPath);
      // eslint-disable-next-line no-console
      console.log('[ModelBootstrap] Verify model.json', { modelPath, exists: modelExists });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('ModelBootstrap: manifest not found or failed to deploy assets.', error);
    }
  }

  private static async ensureDir(dir: string) {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    }
  }
}


