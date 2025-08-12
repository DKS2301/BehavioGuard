import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { FraudModelService } from '@/services/fraud/FraudModelService';
import { useBehaviorStore } from '@/state/useBehaviorStore';
import { RiskLabel, Transaction, FraudAlert, BehavioralProfile, User } from '@/types/model';
import { useSensors } from '@/services/sensors/useSensors';
import { FeatureExtractor } from '@/services/FeatureExtractor';
import { BehavioralProfileService, UserBaseline } from '@/services/BehavioralProfileService';

export function useFraudDetection(userId?: string, options?: { autoStart?: boolean }) {
  const [isRunning, setIsRunning] = useState(false);
  const [riskScore, setRiskScore] = useState(0);
  const [riskLabel, setRiskLabel] = useState<RiskLabel>('LOW');
  const [confidence, setConfidence] = useState(0);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [requiresAdditionalAuth, setRequiresAdditionalAuth] = useState(false);
  const [shouldBlock, setShouldBlock] = useState(false);
  const [userBaseline, setUserBaseline] = useState<UserBaseline | null>(null);
  const [adaptiveThresholds, setAdaptiveThresholds] = useState({ low: 0.3, medium: 0.7, high: 0.9 });
  
  const { features, setFeatures } = useBehaviorStore();
  const sensors = useSensors();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTransactionRef = useRef<Transaction | null>(null);
  const sensorsRef = useRef(sensors);
  useEffect(() => { sensorsRef.current = sensors; }, [sensors]);

  const thresholds = useMemo(
    () => ({
      low: Number(Constants.expoConfig?.extra?.LOW_RISK_THRESHOLD ?? 0.3),
      medium: Number(Constants.expoConfig?.extra?.MEDIUM_RISK_THRESHOLD ?? 0.7),
      high: Number(Constants.expoConfig?.extra?.HIGH_RISK_THRESHOLD ?? 0.9)
    }),
    []
  );

  useEffect(() => {
    FraudModelService.loadScaler().catch(() => {});
  }, []);

  // Load user baseline and adaptive thresholds
  useEffect(() => {
    if (userId) {
      BehavioralProfileService.getUserBaseline(userId).then(setUserBaseline);
      BehavioralProfileService.getAdaptiveThresholds(userId).then(setAdaptiveThresholds);
    }
  }, [userId]);

  const startMonitoring = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    sensorsRef.current.stop();
  }, []);

  useEffect(() => {
    if (!isRunning) return;
    sensorsRef.current.start();
    intervalRef.current = setInterval(async () => {
      try {
        const raw: Record<string, number> = sensorsRef.current.getFeatureSnapshot();
        const sensorData = sensorsRef.current.getCurrentSensorData();
        const vectorRaw = FeatureExtractor.extractBehavioralFeatures(raw, sensorData, lastTransactionRef.current || undefined);
        const scaler = FraudModelService.getScaler();
        const vector = scaler.transformVector(vectorRaw);
        setFeatures(vector);

        // Update user baseline with new behavioral data
        if (userId) {
          const updatedBaseline = await BehavioralProfileService.updateUserBaseline(
            userId,
            vectorRaw, // Use raw features for baseline learning
            sensorData,
            lastTransactionRef.current || undefined
          );
          setUserBaseline(updatedBaseline);
        }

        // Calculate anomaly score based on user's behavioral baseline
        let anomalyScore = 0;
        let anomalyFactors: string[] = [];
        if (userBaseline && userId) {
          const anomaly = BehavioralProfileService.calculateAnomalyScore(vectorRaw, userBaseline);
          anomalyScore = anomaly.score;
          anomalyFactors = anomaly.factors;
        }

        // Combine AI model prediction with behavioral anomaly
        const aiRiskAssessment = await FraudModelService.assessTransactionRisk(
          vector,
          lastTransactionRef.current || {
            id: 'monitoring',
            amount: 0,
            account: '',
            accountName: '',
            type: 'transfer',
            status: 'pending',
            timestamp: new Date(),
            fraudRiskScore: 0,
            fraudRiskLabel: 'LOW'
          },
          userId || 'anonymous'
        );

        // Blend AI score with behavioral anomaly (weighted average)
        const aiWeight = 0.7; // AI model gets 70% weight
        const behavioralWeight = 0.3; // Behavioral anomaly gets 30% weight
        const blendedScore = (aiRiskAssessment.riskScore * aiWeight) + (anomalyScore * behavioralWeight);
        
        // Use adaptive thresholds for risk labeling
        const currentThresholds = adaptiveThresholds;
        let blendedRiskLabel: RiskLabel = 'LOW';
        if (blendedScore >= currentThresholds.high) {
          blendedRiskLabel = 'HIGH';
        } else if (blendedScore >= currentThresholds.medium) {
          blendedRiskLabel = 'MEDIUM';
        }

        // Combine risk factors from both sources
        const combinedFactors = [...aiRiskAssessment.factors, ...anomalyFactors];
        
        setRiskScore(blendedScore);
        setRiskLabel(blendedRiskLabel);
        setConfidence(aiRiskAssessment.confidence);
        setRiskFactors(combinedFactors);
        setRecommendations(aiRiskAssessment.recommendations);
        setRequiresAdditionalAuth(blendedRiskLabel === 'MEDIUM');
        setShouldBlock(blendedRiskLabel === 'HIGH');

        // Create fraud alert if risk is high
        if (blendedRiskLabel === 'HIGH') {
          const alert = await FraudModelService.createFraudAlert(
            userId || 'anonymous',
            lastTransactionRef.current || {
              id: 'monitoring',
              amount: 0,
              account: '',
              accountName: '',
              type: 'transfer',
              status: 'pending',
              timestamp: new Date(),
              fraudRiskScore: blendedScore,
              fraudRiskLabel: blendedRiskLabel
            },
            {
              ...aiRiskAssessment,
              riskScore: blendedScore,
              riskLabel: blendedRiskLabel,
              factors: combinedFactors
            }
          );
          setFraudAlerts(prev => [alert, ...prev]);
        }
      } catch (error) {
        console.warn('Fraud detection monitoring error:', error);
      }
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      sensorsRef.current.stop();
    };
  }, [isRunning, setFeatures, userId, userBaseline, adaptiveThresholds]);

  // Auto-start/stop tied to userId and option
  useEffect(() => {
    const shouldStart = options?.autoStart !== false;
    if (userId && shouldStart) setIsRunning(true);
    return () => setIsRunning(false);
  }, [userId, options?.autoStart]);

  const evaluateTransaction = useCallback(
    async (transaction: Transaction): Promise<{
      riskLabel: RiskLabel;
      riskScore: number;
      confidence: number;
      factors: string[];
      recommendations: string[];
      requiresAdditionalAuth: boolean;
      shouldBlock: boolean;
    }> => {
      // Store transaction for context
      lastTransactionRef.current = transaction;
      
      try {
        // Get current behavioral features
        const raw = sensors.getFeatureSnapshot();
        const sensorData = sensors.getCurrentSensorData();
        const vectorRaw = FeatureExtractor.extractBehavioralFeatures(raw, sensorData, transaction);
        const scaler = FraudModelService.getScaler();
        const vector = scaler.transformVector(vectorRaw);
        
        // Update user baseline with transaction context
        if (userId) {
          const updatedBaseline = await BehavioralProfileService.updateUserBaseline(
            userId,
            vectorRaw,
            sensorData,
            transaction
          );
          setUserBaseline(updatedBaseline);
        }

        // Calculate behavioral anomaly
        let anomalyScore = 0;
        let anomalyFactors: string[] = [];
        if (userBaseline && userId) {
          const anomaly = BehavioralProfileService.calculateAnomalyScore(vectorRaw, userBaseline);
          anomalyScore = anomaly.score;
          anomalyFactors = anomaly.factors;
        }

        // Assess transaction risk with AI model
        const aiRiskAssessment = await FraudModelService.assessTransactionRisk(
          vector,
          transaction,
          userId || 'anonymous'
        );

        // Blend AI and behavioral scores
        const aiWeight = 0.7;
        const behavioralWeight = 0.3;
        const blendedScore = (aiRiskAssessment.riskScore * aiWeight) + (anomalyScore * behavioralWeight);
        
        // Use adaptive thresholds
        const currentThresholds = adaptiveThresholds;
        let blendedRiskLabel: RiskLabel = 'LOW';
        if (blendedScore >= currentThresholds.high) {
          blendedRiskLabel = 'HIGH';
        } else if (blendedScore >= currentThresholds.medium) {
          blendedRiskLabel = 'MEDIUM';
        }

        // Combine factors
        const combinedFactors = [...aiRiskAssessment.factors, ...anomalyFactors];
        
        // Update state
        setRiskScore(blendedScore);
        setRiskLabel(blendedRiskLabel);
        setConfidence(aiRiskAssessment.confidence);
        setRiskFactors(combinedFactors);
        setRecommendations(aiRiskAssessment.recommendations);
        setRequiresAdditionalAuth(blendedRiskLabel === 'MEDIUM');
        setShouldBlock(blendedRiskLabel === 'HIGH');
        
        // Create fraud alert if needed
        if (blendedRiskLabel === 'MEDIUM' || blendedRiskLabel === 'HIGH') {
          const alert = await FraudModelService.createFraudAlert(
            userId || 'anonymous',
            transaction,
            {
              ...aiRiskAssessment,
              riskScore: blendedScore,
              riskLabel: blendedRiskLabel,
              factors: combinedFactors
            }
          );
          setFraudAlerts(prev => [alert, ...prev]);
        }
        
        return {
          riskLabel: blendedRiskLabel,
          riskScore: blendedScore,
          confidence: aiRiskAssessment.confidence,
          factors: combinedFactors,
          recommendations: aiRiskAssessment.recommendations,
          requiresAdditionalAuth: blendedRiskLabel === 'MEDIUM',
          shouldBlock: blendedRiskLabel === 'HIGH'
        };
        
      } catch (error) {
        console.error('Transaction risk evaluation failed:', error);
        // Return default low-risk assessment
        return {
          riskLabel: 'LOW',
          riskScore: 0,
          confidence: 0,
          factors: [],
          recommendations: ['Unable to assess risk - proceeding with caution'],
          requiresAdditionalAuth: false,
          shouldBlock: false
        };
      }
    },
    [sensors, userId, userBaseline, adaptiveThresholds]
  );

  const updateBehavioralProfile = useCallback((profile: BehavioralProfile) => {
    if (userId) {
      FraudModelService.updateUserProfile(userId, profile);
    }
  }, [userId]);

  const getBehavioralProfile = useCallback((): BehavioralProfile | undefined => {
    if (userId) {
      return FraudModelService.getUserProfile(userId);
    }
    return undefined;
  }, [userId]);

  const getRiskHistory = useCallback((): number[] => {
    if (userId) {
      return FraudModelService.getRiskHistory(userId);
    }
    return [];
  }, [userId]);

  const clearFraudAlerts = useCallback(() => {
    setFraudAlerts([]);
  }, []);

  const resolveFraudAlert = useCallback((alertId: string) => {
    setFraudAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  }, []);

  return {
    // State
    isRunning,
    riskScore,
    riskLabel,
    confidence,
    riskFactors,
    recommendations,
    fraudAlerts,
    requiresAdditionalAuth,
    shouldBlock,
    userBaseline,
    adaptiveThresholds,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    evaluateTransaction,
    updateBehavioralProfile,
    getBehavioralProfile,
    getRiskHistory,
    clearFraudAlerts,
    resolveFraudAlert,
    
    // Sensor data
    sensorData: sensors.getCurrentSensorData(),
    isActive: sensors.isActive,
    currentLocation: sensors.currentLocation
  };
}


