import * as tf from '@tensorflow/tfjs';
import { TensorflowService } from '@/services/tf/TensorflowService';
import { FeatureScaler, StandardScalerParams } from '@/services/fraud/FeatureScaler';
import { SENSOR_FEATURE_ORDER } from '@/services/fraud/FeatureMapping';
import { RiskLabel, Transaction, FraudAlert, BehavioralProfile } from '@/types/model';

type PredictOptions = {
  scaledFeatures: number[]; // length 100
  transactionContext?: Partial<Transaction>;
  userProfile?: BehavioralProfile;
};

type RiskAssessment = {
  riskScore: number;
  riskLabel: RiskLabel;
  confidence: number;
  factors: string[];
  recommendations: string[];
  requiresAdditionalAuth: boolean;
  shouldBlock: boolean;
};

export class FraudModelService {
  private static scaler: FeatureScaler | null = null;
  private static userProfiles: Map<string, BehavioralProfile> = new Map();
  private static riskHistory: Map<string, number[]> = new Map();

  static async loadScaler(): Promise<void> {
    if (this.scaler) return;
    // Load scaler JSON from bundled asset
    const scalerJson = require('../../../assets/models/feature_scaler.json');
    const params = scalerJson as StandardScalerParams;
    // Force the feature order to match our sensor snapshot ordering
    this.scaler = new FeatureScaler({ ...params, featureOrder: SENSOR_FEATURE_ORDER });
  }

  static getScaler(): FeatureScaler {
    if (!this.scaler) throw new Error('Scaler not loaded');
    return this.scaler;
  }

  static async predict({ scaledFeatures, transactionContext, userProfile }: PredictOptions): Promise<number> {
    const model = TensorflowService.getLayersModel() || TensorflowService.getGraphModel();
    if (scaledFeatures.length !== 100) throw new Error('Expected 100 features');
    
    try {
      if (model) {
        const input = tf.tensor2d([scaledFeatures], [1, 100]);
        const output = model.predict(input) as tf.Tensor;
        const data = (output as any).dataSync ? (output as any).dataSync() : await output.data();
        tf.dispose([input, output]);
        const prob = (data[0] as number) ?? 0;
        // eslint-disable-next-line no-console
        console.log('[ModelPredict]', { prob });
        return prob; // probability 0-1
      }
    } catch (error) {
      console.warn('Model prediction failed, using fallback:', error);
    }

    // Fallback heuristic if model unavailable
    const fallback = this.calculateFallbackRisk(scaledFeatures, transactionContext, userProfile);
    // eslint-disable-next-line no-console
    console.log('[ModelFallback]', { score: fallback });
    return fallback;
  }

  private static calculateFallbackRisk(
    _features: number[], 
    _transactionContext?: Partial<Transaction>,
    _userProfile?: BehavioralProfile
  ): number {
    // Conservative baseline risk when model isn't available
    return 0.2;
  }

  private static calculateLocationRisk(
    transactionLocation: { latitude: number; longitude: number; city?: string },
    userProfile: BehavioralProfile
  ): number {
    // Calculate distance from known locations
    let minDistance = Infinity;
    for (const pattern of userProfile.locationPatterns) {
      const distance = this.calculateDistance(
        transactionLocation.latitude,
        transactionLocation.longitude,
        pattern.latitude,
        pattern.longitude
      );
      minDistance = Math.min(minDistance, distance);
    }
    
    // Higher risk for locations far from known patterns
    if (minDistance > 100) return 0.8; // 100km threshold
    if (minDistance > 50) return 0.6;  // 50km threshold
    if (minDistance > 10) return 0.4;  // 10km threshold
    return 0.1; // Known location
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static riskLabelFromScore(score: number, thresholds: { low: number; medium: number; high: number }): RiskLabel {
    if (score < thresholds.low) return 'LOW';
    if (score < thresholds.medium) return 'MEDIUM';
    return 'HIGH';
  }

  static async assessTransactionRisk(
    features: number[],
    transaction: Transaction,
    userId: string
  ): Promise<RiskAssessment> {
    // Cold-start guard: suppress high until we accumulate a small history
    const history = this.riskHistory.get(userId) || [];
    const userProfile = this.userProfiles.get(userId);
    const riskScore = await this.predict({ 
      scaledFeatures: features, 
      transactionContext: transaction,
      userProfile 
    });
    
    let riskLabel = this.riskLabelFromScore(riskScore, {
      low: 0.3,
      medium: 0.7,
      high: 0.9
    });

    if (history.length < 5 && riskLabel === 'HIGH') {
      riskLabel = 'MEDIUM';
    }

    // eslint-disable-next-line no-console
    console.log('[AssessRisk]', {
      userId,
      riskScore,
      riskLabel,
      historyCount: history.length,
    });

    // Store risk history
    if (!this.riskHistory.has(userId)) {
      this.riskHistory.set(userId, []);
    }
    this.riskHistory.get(userId)!.push(riskScore);

    // Calculate confidence based on feature quality and history
    const confidence = this.calculateConfidence(features, userId);
    
    // Determine risk factors
    const factors = this.identifyRiskFactors(features, transaction, userProfile);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(riskLabel, factors);
    
    // Determine authentication requirements
    const requiresAdditionalAuth = riskLabel === 'MEDIUM';
    const shouldBlock = riskLabel === 'HIGH';

    return {
      riskScore,
      riskLabel,
      confidence,
      factors,
      recommendations,
      requiresAdditionalAuth,
      shouldBlock
    };
  }

  private static calculateConfidence(features: number[], userId: string): number {
    // Calculate confidence based on feature quality and consistency
    const history = this.riskHistory.get(userId) || [];
    const featureQuality = features.filter(f => f !== 0 && !isNaN(f)).length / features.length;
    const historyConsistency = history.length > 1 ? 
      1 - (() => {
        const recent = history.slice(-10);
        const n = recent.length;
        const mean = recent.reduce((a, b) => a + b, 0) / n;
        const variance = recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
        return Math.sqrt(variance);
      })() : 0.5;
    
    return Math.min(1, (featureQuality + historyConsistency) / 2);
  }

  private static identifyRiskFactors(
    features: number[], 
    transaction: Transaction, 
    userProfile?: BehavioralProfile
  ): string[] {
    const factors: string[] = [];
    
    // Motion anomalies
    if (Math.abs(features[0]) > 2 || Math.abs(features[1]) > 2 || Math.abs(features[2]) > 2) {
      factors.push('Unusual device movement detected');
    }
    
    // Touch pattern anomalies
    if ((features[45] ?? 0) > 0.8 || (features[46] ?? 0) > 0.8) {
      factors.push('Atypical touch patterns detected');
    }
    
    // Timing anomalies
    if ((features[70] ?? 0) > 5000 || (features[71] ?? 0) > 5000) {
      factors.push('Unusual timing patterns detected');
    }
    
    // Location anomalies
    if (userProfile && transaction.location) {
      const locationRisk = this.calculateLocationRisk(transaction.location, userProfile);
      if (locationRisk > 0.6) {
        factors.push('Transaction from unusual location');
      }
    }
    
    // Amount anomalies
    if (transaction.amount > 10000) {
      factors.push('High-value transaction');
    }
    
    // Time anomalies
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) {
      factors.push('Transaction outside normal hours');
    }
    
    return factors;
  }

  private static generateRecommendations(riskLabel: RiskLabel, factors: string[]): string[] {
    const recommendations: string[] = [];
    
    if (riskLabel === 'LOW') {
      recommendations.push('Transaction appears normal');
      recommendations.push('Continue with standard security measures');
    } else if (riskLabel === 'MEDIUM') {
      recommendations.push('Additional authentication required');
      recommendations.push('Verify transaction details carefully');
      if (factors.includes('Transaction from unusual location')) {
        recommendations.push('Confirm your current location');
      }
    } else {
      recommendations.push('Transaction blocked due to high risk');
      recommendations.push('Contact customer support immediately');
      recommendations.push('Review recent account activity');
    }
    
    return recommendations;
  }

  static async createFraudAlert(
    userId: string,
    transaction: Transaction,
    riskAssessment: RiskAssessment
  ): Promise<FraudAlert> {
    const alert: FraudAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'transaction',
      severity: riskAssessment.riskLabel,
      description: `Fraud risk detected during ${transaction.type} transaction`,
      timestamp: new Date(),
      resolved: false,
      riskScore: riskAssessment.riskScore,
      recommendations: riskAssessment.recommendations
    };
    
    return alert;
  }

  static updateUserProfile(userId: string, profile: BehavioralProfile): void {
    this.userProfiles.set(userId, profile);
  }

  static getUserProfile(userId: string): BehavioralProfile | undefined {
    return this.userProfiles.get(userId);
  }

  static getRiskHistory(userId: string): number[] {
    return this.riskHistory.get(userId) || [];
  }

  static clearUserData(userId: string): void {
    this.userProfiles.delete(userId);
    this.riskHistory.delete(userId);
  }
}

// Utility function for standard deviation
declare global {
  interface Array<T> {
    std(): number;
  }
}

Array.prototype.std = function(): number {
  const n = this.length;
  if (n === 0) return 0;
  const mean = this.reduce((a, b) => a + b, 0) / n;
  const variance = this.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  return Math.sqrt(variance);
};


