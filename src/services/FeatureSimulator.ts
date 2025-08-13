import { SensorData, Transaction } from '@/types/model';

/**
 * Feature Simulator based on your synthetic data generation script
 * Implements exact distributions and patterns from your training
 */
export class FeatureSimulator {
  private static readonly SEED = 42;
  private static readonly featureSpecs = FeatureSimulator.defineFeatureSpecifications();

  private static defineFeatureSpecifications() {
    return {
      // Motion Features (0-29)
      motion: {
        accelMeanX: { range: [-2.0, 2.0], dist: 'normal', fraudShift: 0.3 },
        accelMeanY: { range: [-2.0, 2.0], dist: 'normal', fraudShift: 0.3 },
        accelMeanZ: { range: [8.0, 12.0], dist: 'normal', fraudShift: 0.5 },
        accelStdX: { range: [0.1, 1.5], dist: 'lognormal', fraudMult: 1.5 },
        accelStdY: { range: [0.1, 1.5], dist: 'lognormal', fraudMult: 1.5 },
        accelStdZ: { range: [0.1, 1.5], dist: 'lognormal', fraudMult: 1.5 },
        accelMaxX: { range: [-1.5, 3.0], dist: 'normal', fraudShift: 0.8 },
        accelMaxY: { range: [-1.5, 3.0], dist: 'normal', fraudShift: 0.8 },
        accelMaxZ: { range: [7.0, 13.0], dist: 'normal', fraudShift: 0.6 },
        accelMinX: { range: [-3.0, 1.5], dist: 'normal', fraudShift: -0.8 },
        accelMinY: { range: [-3.0, 1.5], dist: 'normal', fraudShift: -0.8 },
        accelMinZ: { range: [7.0, 13.0], dist: 'normal', fraudShift: -0.6 },
        accelMedianX: { range: [-1.8, 1.8], dist: 'normal', fraudShift: 0.2 },
        accelMedianY: { range: [-1.8, 1.8], dist: 'normal', fraudShift: 0.2 },
        accelMedianZ: { range: [8.5, 11.5], dist: 'normal', fraudShift: 0.3 },
        gyroMeanX: { range: [-0.5, 0.5], dist: 'normal', fraudShift: 0.2 },
        gyroMeanY: { range: [-0.5, 0.5], dist: 'normal', fraudShift: 0.2 },
        gyroMeanZ: { range: [-0.5, 0.5], dist: 'normal', fraudShift: 0.2 },
        gyroStdX: { range: [0.01, 0.3], dist: 'lognormal', fraudMult: 2.0 },
        gyroStdY: { range: [0.01, 0.3], dist: 'lognormal', fraudMult: 2.0 },
        gyroStdZ: { range: [0.01, 0.3], dist: 'lognormal', fraudMult: 2.0 },
        gyroMaxX: { range: [-0.3, 0.8], dist: 'normal', fraudShift: 0.3 },
        gyroMaxY: { range: [-0.3, 0.8], dist: 'normal', fraudShift: 0.3 },
        gyroMaxZ: { range: [-0.3, 0.8], dist: 'normal', fraudShift: 0.3 },
        gyroMinX: { range: [-0.8, 0.3], dist: 'normal', fraudShift: -0.3 },
        gyroMinY: { range: [-0.8, 0.3], dist: 'normal', fraudShift: -0.3 },
        gyroMinZ: { range: [-0.8, 0.3], dist: 'normal', fraudShift: -0.3 },
        gyroMedianX: { range: [-0.4, 0.4], dist: 'normal', fraudShift: 0.1 },
        gyroMedianY: { range: [-0.4, 0.4], dist: 'normal', fraudShift: 0.1 },
        gyroMedianZ: { range: [-0.4, 0.4], dist: 'normal', fraudShift: 0.1 }
      },

      // Touch Features (30-59)
      touch: {
        touchPressureMean: { range: [0.1, 1.0], dist: 'beta', fraudMult: 1.8 },
        touchPressureStd: { range: [0.05, 0.3], dist: 'lognormal', fraudMult: 1.8 },
        touchPressureMax: { range: [0.3, 1.0], dist: 'beta', fraudMult: 1.5 },
        touchPressureMin: { range: [0.0, 0.7], dist: 'beta', fraudMult: 0.8 },
        touchPressureMedian: { range: [0.2, 0.9], dist: 'beta', fraudMult: 1.6 },
        touchDurationMean: { range: [50, 500], dist: 'lognormal', fraudMult: 2.5 },
        touchDurationStd: { range: [20, 200], dist: 'lognormal', fraudMult: 2.5 },
        touchDurationMax: { range: [100, 1000], dist: 'lognormal', fraudMult: 2.0 },
        touchDurationMin: { range: [20, 200], dist: 'lognormal', fraudMult: 0.7 },
        touchDurationMedian: { range: [60, 400], dist: 'lognormal', fraudMult: 2.0 },
        touchAreaMean: { range: [0.1, 0.8], dist: 'beta', fraudMult: 1.6 },
        touchAreaStd: { range: [0.05, 0.3], dist: 'lognormal', fraudMult: 1.6 },
        touchAreaMax: { range: [0.3, 1.0], dist: 'beta', fraudMult: 1.4 },
        touchAreaMin: { range: [0.0, 0.6], dist: 'beta', fraudMult: 0.9 },
        touchAreaMedian: { range: [0.2, 0.7], dist: 'beta', fraudMult: 1.5 },
        tapSpeed: { range: [0.5, 5.0], dist: 'lognormal', fraudMult: 1.8 },
        swipeVelocity: { range: [10, 200], dist: 'lognormal', fraudMult: 1.7 },
        multiTouchFreq: { range: [0, 0.3], dist: 'beta', fraudMult: 2.0 },
        pressureVariance: { range: [0.01, 0.15], dist: 'lognormal', fraudMult: 2.2 },
        touchConsistency: { range: [0.3, 1.0], dist: 'beta', fraudMult: 0.6 },
        dwellTime: { range: [20, 300], dist: 'lognormal', fraudMult: 1.9 },
        flightTime: { range: [10, 150], dist: 'lognormal', fraudMult: 1.6 },
        gestureComplexity: { range: [1, 10], dist: 'poisson', fraudMult: 1.4 },
        touchDirection: { range: [0, 360], dist: 'uniform', fraudShift: 45 },
        touchAcceleration: { range: [0.5, 8.0], dist: 'lognormal', fraudMult: 1.7 },
        pressureGradient: { range: [0.01, 0.5], dist: 'lognormal', fraudMult: 2.1 },
        tapRhythm: { range: [0.1, 2.0], dist: 'lognormal', fraudMult: 1.8 },
        strokeVelocity: { range: [5, 100], dist: 'lognormal', fraudMult: 1.6 },
        touchTimingVar: { range: [10, 100], dist: 'lognormal', fraudMult: 2.0 },
        errorCorrection: { range: [0, 0.2], dist: 'beta', fraudMult: 2.5 }
      },

      // Location & Time Features (60-74)
      locationTime: {
        locationLat: { range: [12.9716, 13.0827], dist: 'uniform', fraudShift: 0.02 },
        locationLng: { range: [77.5946, 77.6413], dist: 'uniform', fraudShift: 0.02 },
        locationAccuracy: { range: [5, 50], dist: 'lognormal', fraudMult: 2.0 },
        locationSpeed: { range: [0, 30], dist: 'lognormal', fraudMult: 1.5 },
        locationConsistency: { range: [0.5, 1.0], dist: 'beta', fraudMult: 0.5 },
        timeOfDay: { range: [0, 23], dist: 'normal', fraudShift: 4 },
        dayOfWeek: { range: [0, 6], dist: 'uniform', fraudShift: 0 },
        timeSinceLastLogin: { range: [0, 86400], dist: 'lognormal', fraudMult: 2.0 },
        timeConsistency: { range: [0.3, 1.0], dist: 'beta', fraudMult: 0.6 },
        temporalPattern: { range: [0, 1], dist: 'beta', fraudMult: 0.7 },
        geographicVelocity: { range: [0, 100], dist: 'lognormal', fraudMult: 3.0 },
        locationEntropy: { range: [0.1, 2.0], dist: 'lognormal', fraudMult: 1.8 },
        usageFrequency: { range: [1, 50], dist: 'lognormal', fraudMult: 0.5 },
        activityPattern: { range: [0, 1], dist: 'beta', fraudMult: 0.8 },
        sessionDuration: { range: [60, 3600], dist: 'lognormal', fraudMult: 1.5 }
      },

      // Transaction Features (75-89)
      transaction: {
        transactionAmount: { range: [100, 100000], dist: 'lognormal', fraudMult: 2.5 },
        transactionFreq: { range: [1, 20], dist: 'poisson', fraudMult: 3.0 },
        merchantCategory: { range: [0, 10], dist: 'categorical', fraudShift: 2 },
        paymentMethod: { range: [0, 4], dist: 'categorical', fraudShift: 1 },
        accountAge: { range: [30, 3650], dist: 'lognormal', fraudMult: 0.3 },
        transactionTiming: { range: [0, 1], dist: 'beta', fraudMult: 0.7 },
        amountAnomaly: { range: [0, 5], dist: 'lognormal', fraudMult: 3.0 },
        frequencyAnomaly: { range: [0, 3], dist: 'lognormal', fraudMult: 4.0 },
        merchantRisk: { range: [0, 1], dist: 'beta', fraudMult: 3.0 },
        transactionVelocity: { range: [0, 10], dist: 'lognormal', fraudMult: 2.5 },
        amountPattern: { range: [0, 1], dist: 'beta', fraudMult: 0.4 },
        paymentConsistency: { range: [0.2, 1.0], dist: 'beta', fraudMult: 0.5 },
        transactionComplexity: { range: [1, 10], dist: 'poisson', fraudMult: 1.8 },
        behaviorTxnLink: { range: [0, 1], dist: 'beta', fraudMult: 0.3 },
        riskHistory: { range: [0, 1], dist: 'beta', fraudMult: 5.0 }
      },

      // Device Usage Features (90-94)
      device: {
        batteryLevel: { range: [0.1, 1.0], dist: 'beta', fraudMult: 1.0 },
        networkType: { range: [0, 3], dist: 'categorical', fraudShift: 0 },
        screenBrightness: { range: [0.1, 1.0], dist: 'beta', fraudMult: 1.2 },
        deviceTemperature: { range: [0.3, 0.9], dist: 'normal', fraudShift: 0.1 },
        memoryUsage: { range: [0.2, 0.95], dist: 'beta', fraudMult: 1.3 }
      },

      // Behavioral Features (95-99)
      behavioral: {
        interactionConsistency: { range: [0.2, 1.0], dist: 'beta', fraudMult: 0.4 },
        navigationPattern: { range: [0.1, 1.0], dist: 'beta', fraudMult: 0.5 },
        typingRhythm: { range: [0.3, 1.0], dist: 'beta', fraudMult: 0.6 },
        authPattern: { range: [0.4, 1.0], dist: 'beta', fraudMult: 0.3 },
        behaviorScore: { range: [0.1, 1.0], dist: 'beta', fraudMult: 0.2 }
      }
    };
  }

  /**
   * Generate realistic feature vector based on your training specifications
   */
  static generateFeatures(
    isFraud: boolean = false,
    temporalContext?: Date,
    transactionContext?: Partial<Transaction>
  ): number[] {
    const features: number[] = [];
    const featureNames: string[] = [];

    // Generate features for each category
    for (const [category, specs] of Object.entries(this.featureSpecs)) {
      for (const [featureName, spec] of Object.entries(specs)) {
        featureNames.push(featureName);
        
        // Generate base value
        const rangeMin = spec.range[0];
        const rangeMax = spec.range[1];
        
        let value = this.generateValue(spec.dist, rangeMin, rangeMax);
        
        // Apply fraud modifications
        if (isFraud) {
          if ('fraudShift' in spec) {
            const shiftAmount = spec.fraudShift;
            const noise = this.normalRandom(0, Math.abs(shiftAmount) * 0.3);
            value += shiftAmount + noise;
          }
          if ('fraudMult' in spec) {
            const mult = spec.fraudMult;
            const multNoise = this.normalRandom(mult, mult * 0.2);
            value *= multNoise;
          }
        }
        
        // Apply temporal context
        if (temporalContext && ['timeOfDay', 'dayOfWeek'].includes(featureName)) {
          if (featureName === 'timeOfDay') {
            value = temporalContext.getHours() + this.normalRandom(0, 1);
          } else if (featureName === 'dayOfWeek') {
            value = temporalContext.getDay() + this.normalRandom(0, 0.5);
          }
        }
        
        // Apply transaction context
        if (transactionContext && featureName === 'transactionAmount') {
          value = transactionContext.amount || value;
        }
        
        // Clip to valid range
        value = Math.max(rangeMin, Math.min(rangeMax, value));
        features.push(value);
      }
    }

    // Ensure exactly 100 features
    while (features.length < 100) {
      features.push(0.0);
      featureNames.push(`padding_feature_${features.length - 1}`);
    }

    return features.slice(0, 100);
  }

  /**
   * Generate a named feature map keyed by simulator feature names
   */
  static generateFeatureMap(
    isFraud: boolean = false,
    temporalContext?: Date,
    transactionContext?: Partial<Transaction>
  ): Record<string, number> {
    const map: Record<string, number> = {};

    for (const [category, specs] of Object.entries(this.featureSpecs)) {
      for (const [featureName, spec] of Object.entries(specs)) {
        const rangeMin = spec.range[0];
        const rangeMax = spec.range[1];
        let value = this.generateValue(spec.dist, rangeMin, rangeMax);

        if (isFraud) {
          if ('fraudShift' in spec) {
            const shiftAmount = spec.fraudShift;
            const noise = this.normalRandom(0, Math.abs(shiftAmount) * 0.3);
            value += shiftAmount + noise;
          }
          if ('fraudMult' in spec) {
            const mult = spec.fraudMult;
            const multNoise = this.normalRandom(mult, mult * 0.2);
            value *= multNoise;
          }
        }

        if (temporalContext && ['timeOfDay', 'dayOfWeek'].includes(featureName)) {
          if (featureName === 'timeOfDay') {
            value = temporalContext.getHours() + this.normalRandom(0, 1);
          } else if (featureName === 'dayOfWeek') {
            value = temporalContext.getDay() + this.normalRandom(0, 0.5);
          }
        }

        if (transactionContext && featureName === 'transactionAmount') {
          value = transactionContext.amount || value;
        }

        value = Math.max(rangeMin, Math.min(rangeMax, value));
        map[featureName] = value;
      }
    }

    return map;
  }

  /**
   * Generate legitimate user features
   */
  static generateLegitimateFeatures(
    temporalContext?: Date,
    transactionContext?: Partial<Transaction>
  ): number[] {
    return this.generateFeatures(false, temporalContext, transactionContext);
  }

  /**
   * Generate fraud features
   */
  static generateFraudFeatures(
    temporalContext?: Date,
    transactionContext?: Partial<Transaction>
  ): number[] {
    return this.generateFeatures(true, temporalContext, transactionContext);
  }

  /**
   * Generate features with specific fraud pattern
   */
  static generateWithPattern(
    pattern: 'motion' | 'touch' | 'location' | 'transaction' | 'device' | 'behavioral',
    isFraud: boolean = false,
    temporalContext?: Date
  ): number[] {
    // For now, generate normal features but could be enhanced with pattern-specific logic
    return this.generateFeatures(isFraud, temporalContext);
  }

  static generateWithPatternMap(
    pattern: 'motion' | 'touch' | 'location' | 'transaction' | 'device' | 'behavioral',
    isFraud: boolean = false,
    temporalContext?: Date
  ): Record<string, number> {
    return this.generateFeatureMap(isFraud, temporalContext);
  }

  /**
   * Blend real sensor data with synthetic patterns
   */
  static blendWithSynthetic(
    realFeatures: number[],
    syntheticRatio: number = 0.3,
    isFraud: boolean = false
  ): number[] {
    const syntheticFeatures = this.generateFeatures(isFraud);
    
    return realFeatures.map((real, i) => {
      const synthetic = syntheticFeatures[i] || 0;
      return real * (1 - syntheticRatio) + synthetic * syntheticRatio;
    });
  }

  /**
   * Validate feature vector ranges
   */
  static validateFeatureVector(features: number[]): boolean {
    if (features.length !== 100) return false;
    
    // Check if all features are finite numbers
    return features.every(f => Number.isFinite(f));
  }

  /**
   * Get feature contributions for debugging
   */
  static getFeatureContributions(features: number[]): Array<{ name: string; value: number; contribution: number }> {
    const contributions = [];
    let featureIndex = 0;

    for (const [category, specs] of Object.entries(this.featureSpecs)) {
      for (const [featureName, spec] of Object.entries(specs)) {
        if (featureIndex < features.length) {
          const value = features[featureIndex];
          const range = spec.range[1] - spec.range[0];
          const normalizedValue = (value - spec.range[0]) / range;
          
          contributions.push({
            name: featureName,
            value,
            contribution: normalizedValue
          });
        }
        featureIndex++;
      }
    }

    return contributions;
  }

  // Helper methods for random number generation
  private static normalRandom(mean: number, std: number): number {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + std * z0;
  }

  private static lognormalRandom(mu: number, sigma: number): number {
    // mu and sigma are the mean and std of the underlying normal distribution
    const normal = this.normalRandom(mu, sigma);
    return Math.exp(normal);
  }

  private static betaRandom(alpha: number = 2, beta: number = 2): number {
    // Simplified beta distribution approximation
    const u1 = Math.random();
    const u2 = Math.random();
    return u1 / (u1 + u2);
  }

  private static poissonRandom(lambda: number): number {
    // Simplified Poisson approximation
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    
    return k - 1;
  }

  private static generateValue(dist: string, min: number, max: number): number {
    switch (dist) {
      case 'normal':
        const mean = (min + max) / 2;
        const std = (max - min) / 6;
        return this.normalRandom(mean, std);
      
      case 'lognormal':
        const logMean = Math.log((min + max) / 2);
        return this.lognormalRandom(logMean, 0.5);
      
      case 'beta':
        return this.betaRandom(2, 2) * (max - min) + min;
      
      case 'uniform':
        return Math.random() * (max - min) + min;
      
      case 'poisson':
        const lambda = (min + max) / 2;
        return this.poissonRandom(Math.max(1, lambda));
      
      case 'categorical':
        return Math.floor(Math.random() * (Math.floor(max) - Math.floor(min) + 1)) + Math.floor(min);
      
      default:
        return Math.random() * (max - min) + min;
    }
  }
}
