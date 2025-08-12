// Map logical filenames listed in assets/models/manifest.json to require() results
// Update this when you add or change model asset shards.
const assetModuleMap: Record<string, any> = {
  'model.json': require('../../../assets/models/model.json'),
  'group1-shard1of1.bin': require('../../../assets/models/group1-shard1of1.bin'),
  'feature_scaler.json': require('../../../assets/models/feature_scaler.json'),
  'model_metadata.json': require('../../../assets/models/model_metadata.json')
};

export default assetModuleMap;


