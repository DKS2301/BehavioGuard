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
        
        // Perform real-time risk assessment
        const riskAssessment = await FraudModelService.assessTransactionRisk(
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
        
        // Update state with risk assessment
        setRiskScore(riskAssessment.riskScore);
        setRiskLabel(riskAssessment.riskLabel);
        setConfidence(riskAssessment.confidence);
        setRiskFactors(riskAssessment.factors);
        setRecommendations(riskAssessment.recommendations);
        setRequiresAdditionalAuth(riskAssessment.requiresAdditionalAuth);
        setShouldBlock(riskAssessment.shouldBlock);
        
        // Create fraud alert if risk is high
        if (riskAssessment.riskLabel === 'HIGH') {
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
              fraudRiskScore: riskAssessment.riskScore,
              fraudRiskLabel: riskAssessment.riskLabel
            },
            riskAssessment
          );
          setFraudAlerts(prev => [alert, ...prev]);
        }
        
      } catch (error) {
        console.warn('Fraud detection monitoring error:', error);
      }
    }, 1000); // Update every second for real-time monitoring
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
        const scaler = FraudModelService.getScaler();
        const vector = scaler.transform(raw);
        
        // Assess transaction risk
        const riskAssessment = await FraudModelService.assessTransactionRisk(
          vector,
          transaction,
          userId || 'anonymous'
        );
        
        // Update state
        setRiskScore(riskAssessment.riskScore);
        setRiskLabel(riskAssessment.riskLabel);
        setConfidence(riskAssessment.confidence);
        setRiskFactors(riskAssessment.factors);
        setRecommendations(riskAssessment.recommendations);
        setRequiresAdditionalAuth(riskAssessment.requiresAdditionalAuth);
        setShouldBlock(riskAssessment.shouldBlock);
        
        // Create fraud alert if needed
        if (riskAssessment.riskLabel === 'MEDIUM' || riskAssessment.riskLabel === 'HIGH') {
          const alert = await FraudModelService.createFraudAlert(
            userId || 'anonymous',
            transaction,
            riskAssessment
          );
          setFraudAlerts(prev => [alert, ...prev]);
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

  // Auto-start monitoring when component mounts
  useEffect(() => {
    if (userId) {
      startMonitoring();
    }
    
    return () => {
      stopMonitoring();
    };
  }, [userId, startMonitoring, stopMonitoring]);

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
    
    // Sensor data
    sensorData: sensors.getCurrentSensorData(),
    isActive: sensors.isActive,
    currentLocation: sensors.currentLocation
  };
}


