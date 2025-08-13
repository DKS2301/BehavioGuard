import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Constants from 'expo-constants';
import { FraudModelService } from '@/services/fraud/FraudModelService';
import { useBehaviorStore } from '@/state/useBehaviorStore';
import { RiskLabel, Transaction, FraudAlert, BehavioralProfile, User } from '@/types/model';
import { useSensors } from '@/services/sensors/useSensors';

export function useFraudDetection(userId?: string) {
  const [isRunning, setIsRunning] = useState(false);
  const [riskScore, setRiskScore] = useState(0);
  const [riskLabel, setRiskLabel] = useState<RiskLabel>('LOW');
  const [confidence, setConfidence] = useState(0);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([]);
  const [requiresAdditionalAuth, setRequiresAdditionalAuth] = useState(false);
  const [shouldBlock, setShouldBlock] = useState(false);
  
  const { features, setFeatures } = useBehaviorStore();
  const sensors = useSensors();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTransactionRef = useRef<Transaction | null>(null);

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

  const startMonitoring = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    sensors.start();
    
    // Use a slower cadence and do not create alerts here; only surface live risk
    intervalRef.current = setInterval(async () => {
      try {
        // Collect behavioral features from sensors
        const raw: Record<string, number> = sensors.getFeatureSnapshot();
        
        // Get current sensor data for context
        const sensorData = sensors.getCurrentSensorData();
        
        // Transform features using scaler
        const scaler = FraudModelService.getScaler();
        const vector = scaler.transform(raw);
        setFeatures(vector);
        
        // Perform real-time risk assessment without generating alerts
        const riskAssessment = await FraudModelService.assessTransactionRisk(
          vector,
          {
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
        
        // Update state with risk assessment
        setRiskScore(riskAssessment.riskScore);
        setRiskLabel(riskAssessment.riskLabel);
        setConfidence(riskAssessment.confidence);
        setRiskFactors(riskAssessment.factors);
        setRecommendations(riskAssessment.recommendations);
        setRequiresAdditionalAuth(riskAssessment.requiresAdditionalAuth);
        setShouldBlock(riskAssessment.shouldBlock);

        // Monitoring log for observability
        // eslint-disable-next-line no-console
        console.log('[Monitoring]', {
          t: new Date().toISOString(),
          userId: userId || 'anonymous',
          risk: riskAssessment.riskScore,
          label: riskAssessment.riskLabel,
          featuresNonZero: vector.filter((v) => v !== 0 && !Number.isNaN(v)).length,
        });
        
        // Do not generate alerts on background monitoring
        
      } catch (error) {
        console.warn('Fraud detection monitoring error:', error);
      }
    }, 3000); // Slower background cadence
  }, [isRunning, sensors, setFeatures, userId]);

  const stopMonitoring = useCallback(() => {
    setIsRunning(false);
    sensors.stop();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [sensors]);

  const evaluateTransaction = useCallback(
    async (
      transaction: Transaction,
      options?: { simulatedVector?: number[]; rawSimulatedMap?: Record<string, number> }
    ): Promise<{
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
        // Get features: prefer explicit simulation overrides if provided
        const scaler = FraudModelService.getScaler();
        let vector: number[];
        if (options?.simulatedVector && options.simulatedVector.length === 100) {
          vector = scaler.transformVector(options.simulatedVector);
        } else if (options?.rawSimulatedMap) {
          vector = scaler.transform(options.rawSimulatedMap);
        } else {
          const raw = sensors.getFeatureSnapshot();
          vector = scaler.transform(raw);
        }
        
        // Assess transaction risk and create alerts only for explicit transactions
        const riskAssessment = await FraudModelService.assessTransactionRisk(vector, transaction, userId || 'anonymous');
        
        // Update state
        setRiskScore(riskAssessment.riskScore);
        setRiskLabel(riskAssessment.riskLabel);
        setConfidence(riskAssessment.confidence);
        setRiskFactors(riskAssessment.factors);
        setRecommendations(riskAssessment.recommendations);
        setRequiresAdditionalAuth(riskAssessment.requiresAdditionalAuth);
        setShouldBlock(riskAssessment.shouldBlock);
        
        // Logging for explicit transaction evaluation
        // eslint-disable-next-line no-console
        console.log('[EvaluateTransaction]', {
          t: new Date().toISOString(),
          userId: userId || 'anonymous',
          txId: transaction.id,
          amount: transaction.amount,
          risk: riskAssessment.riskScore,
          label: riskAssessment.riskLabel,
        });

        // Create fraud alert only when evaluateTransaction is called
        if (riskAssessment.riskLabel === 'MEDIUM' || riskAssessment.riskLabel === 'HIGH') {
          const alert = await FraudModelService.createFraudAlert(
            userId || 'anonymous',
            transaction,
            riskAssessment
          );
          setFraudAlerts(prev => [alert, ...prev]);

          // eslint-disable-next-line no-console
          console.log('[AlertCreated]', { id: alert.id, label: alert.severity, score: alert.riskScore });
        }
        
        return riskAssessment;
        
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
    [sensors, userId]
  );

  const clearBaseline = useCallback(() => {
    try {
      if (userId) {
        stopMonitoring();
        FraudModelService.clearUserData(userId);
      }
      // Reset alerts and local state directly to avoid ordering issues
      setFraudAlerts([]);
      setRiskScore(0);
      setRiskLabel('LOW');
      setConfidence(0);
      setRiskFactors([]);
      setRecommendations([]);
      setRequiresAdditionalAuth(false);
      setShouldBlock(false);
      // eslint-disable-next-line no-console
      console.log('[BaselineCleared]', { userId: userId || 'anonymous', t: new Date().toISOString() });
      if (userId) startMonitoring();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Baseline clear failed', e);
    }
  }, [userId, stopMonitoring, startMonitoring]);

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

  // Auto-start monitoring when component mounts for a given user
  useEffect(() => {
    if (!userId) return;
    startMonitoring();
    return () => {
      stopMonitoring();
    };
    // Deliberately exclude function refs to avoid re-running on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
    
    // Actions
    startMonitoring,
    stopMonitoring,
    evaluateTransaction,
    updateBehavioralProfile,
    getBehavioralProfile,
    getRiskHistory,
    clearFraudAlerts,
    resolveFraudAlert,
    clearBaseline,
    
    // Sensor data
    sensorData: sensors.getCurrentSensorData(),
    isActive: sensors.isActive,
    currentLocation: sensors.currentLocation
  };
}


