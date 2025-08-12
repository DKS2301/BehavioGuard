# Assets/models

Place your TF.js model files and scaler here.

Required files:
- model.json
- group1-shard1ofN.bin ... group1-shardNofN.bin
- feature_scaler.json (converted from feature_scaler.pkl)
- model_metadata_lstm.json

Notes:
- The model architecture must be: Dense(256) → LSTM(128) → Dense(128) → Dense(64) → Dense(1, sigmoid)
- Input: exactly 100 features in the specified order
- Output: probability [0,1]


