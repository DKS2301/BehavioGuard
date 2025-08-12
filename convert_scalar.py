# convert_scaler.py
import pickle, json, sys

pkl_path = sys.argv[1]  # feature_scaler.pkl
json_path = sys.argv[2] # assets/models/feature_scaler.json

with open(pkl_path, 'rb') as f:
    scaler = pickle.load(f)

# Ensure arrays are exactly length 100
mean = scaler.mean_.tolist()
scale = (1.0 / scaler.scale_).tolist()  # store as 1/std for fast multiply
assert len(mean) == 100 and len(scale) == 100

# Fill featureOrder with your exact 100 feature names, in order used during training
# If you already have the order, paste it below:
featureOrder = [
  # e.g. "accelMeanX","accelMeanY","accelMeanZ","gyroMeanX","gyroMeanY","gyroMeanZ",
  # ... 94 more in the same exact order as training ...
]

assert len(featureOrder) == 100

with open(json_path, 'w') as f:
    json.dump({"mean": mean, "scale": scale, "featureOrder": featureOrder}, f)
print("Wrote", json_path)