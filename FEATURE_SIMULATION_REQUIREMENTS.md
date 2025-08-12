# Feature Vector Simulation Requirements for BehaviorGuard AI

## Overview
Since you used synthetic data generation for training, we need to create realistic feature simulation that matches your training data distribution. This document outlines the exact requirements for feature vector generation and the files needed for integration.

## Required Files from Your Training

### 1. **Synthetic Data Generation Script** (`synthetic_data_generator.py`)
**Purpose**: Understand the exact feature distributions and patterns used in training
**Required Content**:
```python
# Need to see:
- Feature value ranges for each of the 100 features
- Statistical distributions (normal, uniform, etc.)
- Correlation patterns between features
- Fraud vs legitimate pattern differences
- Feature scaling/normalization applied
- Temporal patterns and sequences
```

### 2. **Training Dataset Statistics** (`dataset_statistics.json`)
**Purpose**: Extract exact statistical properties of your training data
**Required Content**:
```json
{
  "feature_statistics": {
    "feature_0": {
      "mean": 0.0,
      "std": 1.0,
      "min": -3.0,
      "max": 3.0,
      "distribution": "normal",
      "fraud_mean": 0.5,
      "fraud_std": 1.2,
      "legitimate_mean": -0.1,
      "legitimate_std": 0.8
    }
    // ... for all 100 features
  },
  "correlation_matrix": "100x100 correlation matrix",
  "feature_groups": {
    "motion_features": [0, 29],
    "touch_features": [30, 59],
    "location_time_features": [60, 74],
    "transaction_features": [75, 89],
    "device_features": [90, 94],
    "behavioral_features": [95, 99]
  }
}
```

### 3. **Feature Engineering Pipeline** (`feature_engineering.py`)
**Purpose**: Understand the exact feature extraction process
**Required Content**:
```python
# Need to see:
- Raw sensor data preprocessing
- Feature calculation formulas
- Statistical transformations
- Feature selection criteria
- Data augmentation techniques
- Sequence processing for LSTM
```

### 4. **Model Training Configuration** (`training_config.json`)
**Purpose**: Understand the exact training setup
**Required Content**:
```json
{
  "model_architecture": "Dense(256)->LSTM(128)->Dense(128)->Dense(64)->Dense(1)",
  "input_shape": [null, 1, 100],
  "feature_order": ["exact_100_feature_names"],
  "training_data_size": 100000,
  "fraud_ratio": 0.1,
  "synthetic_data_ratio": 0.8,
  "data_augmentation": {
    "noise_factor": 0.1,
    "rotation_factor": 0.05,
    "scaling_factor": 0.02
  }
}
```

## Feature Vector Simulation Requirements

### 1. **Motion Features (0-29) - Accelerometer & Gyroscope**

#### **Accelerometer Features (0-14)**
```typescript
interface MotionFeatures {
  // Basic statistics (0-5)
  accelMeanX: number;    // Range: [-2.0, 2.0] g
  accelMeanY: number;    // Range: [-2.0, 2.0] g  
  accelMeanZ: number;    // Range: [8.0, 12.0] g (gravity)
  accelStdX: number;     // Range: [0.1, 1.5]
  accelStdY: number;     // Range: [0.1, 1.5]
  accelStdZ: number;     // Range: [0.1, 1.5]
  
  // Extreme values (6-11)
  accelMaxX: number;     // Range: [-1.5, 3.0] g
  accelMaxY: number;     // Range: [-1.5, 3.0] g
  accelMaxZ: number;     // Range: [7.0, 13.0] g
  accelMinX: number;     // Range: [-3.0, 1.5] g
  accelMinY: number;     // Range: [-3.0, 1.5] g
  accelMinZ: number;     // Range: [7.0, 13.0] g
  
  // Central tendency (12-14)
  accelMedianX: number;  // Range: [-1.8, 1.8] g
  accelMedianY: number;  // Range: [-1.8, 1.8] g
  accelMedianZ: number;  // Range: [8.5, 11.5] g
}
```

#### **Gyroscope Features (15-29)**
```typescript
interface GyroscopeFeatures {
  // Basic statistics (15-20)
  gyroMeanX: number;     // Range: [-0.5, 0.5] rad/s
  gyroMeanY: number;     // Range: [-0.5, 0.5] rad/s
  gyroMeanZ: number;     // Range: [-0.5, 0.5] rad/s
  gyroStdX: number;      // Range: [0.01, 0.3]
  gyroStdY: number;      // Range: [0.01, 0.3]
  gyroStdZ: number;      // Range: [0.01, 0.3]
  
  // Extreme values (21-26)
  gyroMaxX: number;      // Range: [-0.3, 0.8] rad/s
  gyroMaxY: number;      // Range: [-0.3, 0.8] rad/s
  gyroMaxZ: number;      // Range: [-0.3, 0.8] rad/s
  gyroMinX: number;      // Range: [-0.8, 0.3] rad/s
  gyroMinY: number;      // Range: [-0.8, 0.3] rad/s
  gyroMinZ: number;      // Range: [-0.8, 0.3] rad/s
  
  // Central tendency (27-29)
  gyroMedianX: number;   // Range: [-0.4, 0.4] rad/s
  gyroMedianY: number;   // Range: [-0.4, 0.4] rad/s
  gyroMedianZ: number;   // Range: [-0.4, 0.4] rad/s
}
```

### 2. **Touch Features (30-59) - Pressure, Duration, Area**

#### **Touch Pressure Features (30-39)**
```typescript
interface TouchPressureFeatures {
  touchPressureMean: number;    // Range: [0.1, 1.0] (normalized)
  touchPressureStd: number;     // Range: [0.05, 0.3]
  touchPressureMax: number;     // Range: [0.3, 1.0]
  touchPressureMin: number;     // Range: [0.0, 0.7]
  touchPressureMedian: number;  // Range: [0.2, 0.9]
  touchPressureVar: number;     // Range: [0.002, 0.09]
  touchPressureSkew: number;    // Range: [-2.0, 2.0]
  touchPressureKurt: number;    // Range: [-1.0, 5.0]
  touchPressureRange: number;   // Range: [0.1, 0.8]
  touchPressureIQR: number;     // Range: [0.05, 0.4]
}
```

#### **Touch Duration Features (40-49)**
```typescript
interface TouchDurationFeatures {
  touchDurationMean: number;    // Range: [50, 500] ms
  touchDurationStd: number;     // Range: [20, 200] ms
  touchDurationMax: number;     // Range: [100, 1000] ms
  touchDurationMin: number;     // Range: [20, 200] ms
  touchDurationMedian: number;  // Range: [60, 400] ms
  touchDurationVar: number;     // Range: [400, 40000] ms²
  touchDurationSkew: number;    // Range: [0.5, 3.0]
  touchDurationKurt: number;    // Range: [1.0, 8.0]
  touchDurationRange: number;   // Range: [50, 800] ms
  touchDurationIQR: number;     // Range: [30, 300] ms
}
```

#### **Touch Area Features (50-59)**
```typescript
interface TouchAreaFeatures {
  touchAreaMean: number;        // Range: [0.1, 0.8] (normalized)
  touchAreaStd: number;         // Range: [0.05, 0.3]
  touchAreaMax: number;         // Range: [0.3, 1.0]
  touchAreaMin: number;         // Range: [0.0, 0.6]
  touchAreaMedian: number;      // Range: [0.2, 0.7]
  touchAreaVar: number;         // Range: [0.002, 0.09]
  touchAreaSkew: number;        // Range: [-1.5, 2.5]
  touchAreaKurt: number;        // Range: [-0.5, 6.0]
  touchAreaRange: number;       // Range: [0.1, 0.7]
  touchAreaIQR: number;         // Range: [0.05, 0.3]
}
```

### 3. **Location & Time Features (60-74)**

#### **Location Features (60-69)**
```typescript
interface LocationFeatures {
  locationLat: number;          // Range: [12.9716, 13.0827] (example: Bangalore)
  locationLng: number;          // Range: [77.5946, 77.6413]
  locationAccuracy: number;     // Range: [5, 50] meters
  locationSpeed: number;        // Range: [0, 30] m/s
  locationAltitude: number;     // Range: [800, 1000] meters
  locationDistance: number;     // Range: [0, 1000] meters
  locationBearing: number;      // Range: [0, 360] degrees
  locationLatVar: number;       // Range: [0, 0.001]
  locationLngVar: number;       // Range: [0, 0.001]
  locationConsistency: number;  // Range: [0.5, 1.0]
}
```

#### **Time Features (70-74)**
```typescript
interface TimeFeatures {
  timeOfDay: number;            // Range: [0, 23] hours
  dayOfWeek: number;            // Range: [0, 6] (Sunday=0)
  dayOfMonth: number;           // Range: [1, 31]
  monthOfYear: number;          // Range: [1, 12]
  timeSinceLastLogin: number;   // Range: [0, 86400000] ms (0-24h)
}
```

### 4. **Transaction Features (75-89)**
```typescript
interface TransactionFeatures {
  transactionAmount: number;        // Range: [100, 100000] INR
  transactionAmountLog: number;     // Range: [2.0, 5.0] log10
  transactionType: number;          // Range: [0, 4] (0=unknown, 1=transfer, etc.)
  transactionStatus: number;        // Range: [0, 4] (0=unknown, 1=completed, etc.)
  transactionFrequency: number;     // Range: [0, 10] per day
  transactionAmountMean: number;    // Range: [1000, 50000] INR
  transactionAmountStd: number;     // Range: [500, 20000] INR
  transactionAmountMax: number;     // Range: [5000, 100000] INR
  transactionAmountMin: number;     // Range: [100, 10000] INR
  transactionTimeMean: number;      // Range: [0, 23] hours
  transactionTimeStd: number;       // Range: [1, 8] hours
  transactionDayMean: number;       // Range: [0, 6] days
  transactionDayStd: number;        // Range: [0.5, 3] days
  transactionTypeFreq: number;      // Range: [0, 1] (frequency of most common type)
  transactionRiskHistory: number;   // Range: [0, 1] (historical risk average)
}
```

### 5. **Device Usage Features (90-94)**
```typescript
interface DeviceFeatures {
  batteryLevel: number;         // Range: [0.1, 1.0]
  networkType: number;          // Range: [0, 3] (0=unknown, 1=wifi, 2=4g, 3=5g)
  deviceOrientation: number;    // Range: [0, 3] (0=portrait, 1=landscape, etc.)
  deviceBrightness: number;     // Range: [0.1, 1.0]
  deviceVolume: number;         // Range: [0.0, 1.0]
}
```

### 6. **Behavioral Features (95-99)**
```typescript
interface BehavioralFeatures {
  loginAttempts: number;        // Range: [1, 5] per session
  navigationActions: number;     // Range: [5, 50] per session
  keyboardStrokes: number;       // Range: [10, 200] per session
  biometricAttempts: number;     // Range: [0, 3] per session
  biometricFailures: number;     // Range: [0, 2] per session
}
```

## Synthetic Data Generation Requirements

### 1. **Fraud vs Legitimate Pattern Differences**
```typescript
interface FraudPatterns {
  // Motion patterns for fraud
  fraudMotion: {
    accelStdMultiplier: 1.5,    // Higher variance
    gyroStdMultiplier: 2.0,     // Much higher rotation variance
    motionCorrelation: 0.3,     // Lower correlation between axes
  };
  
  // Touch patterns for fraud
  fraudTouch: {
    pressureVariance: 1.8,      // Higher pressure variance
    durationSkew: 2.5,          // More skewed duration distribution
    areaInconsistency: 1.6,     // More inconsistent touch areas
  };
  
  // Location patterns for fraud
  fraudLocation: {
    locationVariance: 2.0,      // Higher location variance
    speedAnomaly: 1.5,          // Unusual movement speed
    timeAnomaly: 2.0,           // Unusual transaction times
  };
  
  // Transaction patterns for fraud
  fraudTransaction: {
    amountAnomaly: 2.5,         // Unusual transaction amounts
    frequencyAnomaly: 3.0,      // Unusual transaction frequency
    typeAnomaly: 2.0,           // Unusual transaction types
  };
}
```

### 2. **Temporal Patterns**
```typescript
interface TemporalPatterns {
  // Time-of-day patterns
  timePatterns: {
    morningPeak: [8, 11],       // Hours with high legitimate activity
    afternoonPeak: [12, 15],    // Hours with high legitimate activity
    eveningPeak: [17, 20],      // Hours with high legitimate activity
    nightLow: [23, 6],          // Hours with low legitimate activity
  };
  
  // Day-of-week patterns
  dayPatterns: {
    weekdayHigh: [1, 5],        // Monday-Friday high activity
    weekendLow: [0, 6],         // Weekend lower activity
  };
  
  // Seasonal patterns
  seasonalPatterns: {
    monthHigh: [10, 12],        // High activity months
    monthLow: [6, 8],           // Low activity months
  };
}
```

## Implementation Requirements

### 1. **Feature Simulator Class**
```typescript
class FeatureSimulator {
  // Generate realistic feature vectors
  generateLegitimateFeatures(): number[];
  generateFraudFeatures(): number[];
  
  // Generate with specific patterns
  generateWithPattern(pattern: FraudPattern): number[];
  generateWithTemporalContext(time: Date): number[];
  
  // Validate feature vectors
  validateFeatureVector(features: number[]): boolean;
  getFeatureContributions(features: number[]): FeatureContribution[];
}
```

### 2. **Real-time Feature Generation**
```typescript
class RealTimeFeatureGenerator {
  // Generate features from real sensor data
  generateFromSensors(sensorData: SensorData): number[];
  
  // Blend real and synthetic data
  blendWithSynthetic(realFeatures: number[], syntheticRatio: number): number[];
  
  // Adapt to user behavior
  adaptToUserPattern(userId: string, features: number[]): number[];
}
```

### 3. **Feature Validation**
```typescript
class FeatureValidator {
  // Validate feature ranges
  validateRanges(features: number[]): boolean;
  
  // Check for anomalies
  detectAnomalies(features: number[]): AnomalyReport;
  
  // Verify feature correlations
  validateCorrelations(features: number[]): CorrelationReport;
}
```

## Files Needed from Your Training

### **Critical Files (Required)**
1. `synthetic_data_generator.py` - Your data generation script
2. `dataset_statistics.json` - Statistical properties of training data
3. `feature_engineering.py` - Feature extraction pipeline
4. `training_config.json` - Training configuration
5. `correlation_matrix.json` - Feature correlation matrix
6. `feature_distributions.json` - Distribution parameters for each feature

### **Optional Files (Helpful)**
1. `data_augmentation.py` - Data augmentation techniques
2. `feature_selection.py` - Feature selection criteria
3. `validation_metrics.json` - Validation metrics and thresholds
4. `model_performance.json` - Model performance on different data types

## Next Steps

1. **Provide the required files** from your training
2. **Extract statistical properties** from your synthetic data
3. **Implement feature simulator** based on your distributions
4. **Create validation framework** for feature vectors
5. **Test with known patterns** to ensure accuracy

This will ensure the feature simulation matches your training data exactly and provides realistic behavioral patterns for fraud detection.
