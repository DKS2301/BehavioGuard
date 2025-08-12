import AsyncStorage from '@react-native-async-storage/async-storage';
import { BehavioralProfile, LocationPattern, TimePattern, TouchPattern, MotionPattern } from '@/types/model';

export type UserBaseline = {
  userId: string;
  featureBaseline: number[]; // 100-length baseline features
  featureVariance: number[]; // 100-length variance for each feature
  locationPatterns: LocationPattern[];
  timePatterns: TimePattern[];
  touchPatterns: TouchPattern[];
  motionPatterns: MotionPattern[];
  transactionPatterns: {
    typicalAmounts: number[];
    typicalTimes: number[]; // hours of day
    typicalDays: number[]; // days of week
    frequency: number; // transactions per day
  };
  confidence: number; // 0-1, how well we know this user
  lastUpdated: Date;
  sampleCount: number;
};

export class BehavioralProfileService {
  private static readonly STORAGE_KEY = 'behavioral_profiles';
  private static readonly MIN_SAMPLES = 10; // minimum samples before establishing baseline
  private static readonly LEARNING_RATE = 0.1; // how quickly to adapt to new patterns
  private static readonly MAX_SAMPLES = 1000; // maximum samples to keep

  static async getUserBaseline(userId: string): Promise<UserBaseline | null> {
    try {
      const profiles = await this.getAllProfiles();
      return profiles[userId] || null;
    } catch (error) {
      console.warn('Failed to load user baseline:', error);
      return null;
    }
  }

  static async updateUserBaseline(
    userId: string,
    newFeatures: number[],
    sensorData: any,
    transaction?: any
  ): Promise<UserBaseline> {
    const existing = await this.getUserBaseline(userId);
    const now = new Date();

    if (!existing) {
      // Create new baseline
      const newBaseline: UserBaseline = {
        userId,
        featureBaseline: [...newFeatures],
        featureVariance: new Array(100).fill(0.1), // initial variance
        locationPatterns: [],
        timePatterns: [],
        touchPatterns: [],
        motionPatterns: [],
        transactionPatterns: {
          typicalAmounts: transaction?.amount ? [transaction.amount] : [],
          typicalTimes: [now.getHours()],
          typicalDays: [now.getDay()],
          frequency: 1,
        },
        confidence: 0.1,
        lastUpdated: now,
        sampleCount: 1,
      };

      await this.saveProfile(userId, newBaseline);
      return newBaseline;
    }

    // Update existing baseline with exponential moving average
    const alpha = this.LEARNING_RATE;
    const updatedBaseline: UserBaseline = {
      ...existing,
      featureBaseline: existing.featureBaseline.map((baseline, i) => 
        baseline * (1 - alpha) + newFeatures[i] * alpha
      ),
      featureVariance: this.updateVariance(existing.featureVariance, existing.featureBaseline, newFeatures, alpha),
      confidence: Math.min(1, existing.confidence + 0.01), // gradually increase confidence
      lastUpdated: now,
      sampleCount: Math.min(this.MAX_SAMPLES, existing.sampleCount + 1),
    };

    // Update location patterns
    if (sensorData.location) {
      updatedBaseline.locationPatterns = this.updateLocationPatterns(
        existing.locationPatterns,
        sensorData.location,
        now
      );
    }

    // Update time patterns
    updatedBaseline.timePatterns = this.updateTimePatterns(
      existing.timePatterns,
      now
    );

    // Update transaction patterns
    if (transaction) {
      updatedBaseline.transactionPatterns = this.updateTransactionPatterns(
        existing.transactionPatterns,
        transaction,
        now
      );
    }

    await this.saveProfile(userId, updatedBaseline);
    return updatedBaseline;
  }

  static calculateAnomalyScore(
    currentFeatures: number[],
    baseline: UserBaseline
  ): { score: number; factors: string[] } {
    if (baseline.confidence < 0.3) {
      return { score: 0, factors: ['Insufficient behavioral data'] };
    }

    const factors: string[] = [];
    let totalAnomaly = 0;
    let featureCount = 0;

    // Calculate Mahalanobis distance for each feature
    for (let i = 0; i < 100; i++) {
      const current = currentFeatures[i];
      const baselineMean = baseline.featureBaseline[i];
      const baselineVar = baseline.featureVariance[i];

      if (baselineVar > 0) {
        const zScore = Math.abs(current - baselineMean) / Math.sqrt(baselineVar);
        const anomaly = Math.min(1, zScore / 3); // Normalize to 0-1
        totalAnomaly += anomaly;
        featureCount++;

        // Flag significant anomalies
        if (zScore > 2) {
          const featureName = this.getFeatureName(i);
          factors.push(`Unusual ${featureName} (${zScore.toFixed(1)}σ)`);
        }
      }
    }

    const averageAnomaly = featureCount > 0 ? totalAnomaly / featureCount : 0;
    return { score: averageAnomaly, factors };
  }

  static async getAdaptiveThresholds(userId: string): Promise<{
    low: number;
    medium: number;
    high: number;
  }> {
    const baseline = await this.getUserBaseline(userId);
    
    if (!baseline || baseline.confidence < 0.5) {
      // Use default thresholds for new users
      return { low: 0.3, medium: 0.7, high: 0.9 };
    }

    // Adaptive thresholds based on user's typical behavior variance
    const avgVariance = baseline.featureVariance.reduce((a, b) => a + b, 0) / baseline.featureVariance.length;
    const varianceFactor = Math.min(2, Math.max(0.5, avgVariance));

    return {
      low: 0.3 * varianceFactor,
      medium: 0.7 * varianceFactor,
      high: 0.9 * varianceFactor,
    };
  }

  private static updateVariance(
    oldVariance: number[],
    oldMean: number[],
    newValues: number[],
    alpha: number
  ): number[] {
    return oldVariance.map((variance, i) => {
      const diff = newValues[i] - oldMean[i];
      return variance * (1 - alpha) + (diff * diff) * alpha;
    });
  }

  private static updateLocationPatterns(
    existing: LocationPattern[],
    newLocation: { latitude: number; longitude: number },
    timestamp: Date
  ): LocationPattern[] {
    const patterns = [...existing];
    const existingPattern = patterns.find(p => 
      this.calculateDistance(p.latitude, p.longitude, newLocation.latitude, newLocation.longitude) < 0.1
    );

    if (existingPattern) {
      existingPattern.frequency += 1;
      existingPattern.lastSeen = timestamp;
    } else {
      patterns.push({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        frequency: 1,
        lastSeen: timestamp,
        riskScore: 0,
      });
    }

    return patterns.slice(-20); // Keep last 20 locations
  }

  private static updateTimePatterns(
    existing: TimePattern[],
    timestamp: Date
  ): TimePattern[] {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    
    const patterns = [...existing];
    const existingPattern = patterns.find(p => p.hour === hour && p.dayOfWeek === dayOfWeek);

    if (existingPattern) {
      existingPattern.frequency += 1;
    } else {
      patterns.push({
        hour,
        dayOfWeek,
        frequency: 1,
        riskScore: 0,
      });
    }

    return patterns.slice(-50); // Keep last 50 time patterns
  }

  private static updateTransactionPatterns(
    existing: any,
    transaction: any,
    timestamp: Date
  ): any {
    const patterns = { ...existing };
    
    // Update amount patterns
    if (transaction.amount) {
      patterns.typicalAmounts = [...patterns.typicalAmounts, transaction.amount].slice(-100);
    }

    // Update time patterns
    patterns.typicalTimes = [...patterns.typicalTimes, timestamp.getHours()].slice(-100);
    patterns.typicalDays = [...patterns.typicalDays, timestamp.getDay()].slice(-100);

    // Update frequency (simplified)
    patterns.frequency = patterns.typicalAmounts.length / 30; // transactions per day estimate

    return patterns;
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

  private static getFeatureName(index: number): string {
    if (index < 30) return `motion_${index}`;
    if (index < 60) return `touch_${index - 30}`;
    if (index < 75) return `location_time_${index - 60}`;
    if (index < 90) return `transaction_${index - 75}`;
    if (index < 95) return `device_${index - 90}`;
    return `behavioral_${index - 95}`;
  }

  private static async getAllProfiles(): Promise<Record<string, UserBaseline>> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      const parsed = data ? JSON.parse(data) : {};
      // revive Date fields
      Object.keys(parsed).forEach((uid) => {
        const p = parsed[uid];
        if (p) {
          if (p.lastUpdated) p.lastUpdated = new Date(p.lastUpdated);
          if (Array.isArray(p.locationPatterns)) {
            p.locationPatterns = p.locationPatterns.map((lp: any) => ({
              ...lp,
              lastSeen: lp.lastSeen ? new Date(lp.lastSeen) : undefined,
            }));
          }
        }
      });
      return parsed;
    } catch {
      return {};
    }
  }

  private static async saveProfile(userId: string, profile: UserBaseline): Promise<void> {
    try {
      const profiles = await this.getAllProfiles();
      profiles[userId] = profile;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(profiles));
    } catch (error) {
      console.warn('Failed to save user profile:', error);
    }
  }
}
