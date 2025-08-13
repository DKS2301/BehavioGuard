import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFraudDetection } from '@/services/fraud/useFraudDetection';
import { useBehaviorStore } from '@/state/useBehaviorStore';
import { RiskLabel, FraudAlert, BehavioralProfile } from '@/types/model';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '@/navigation/AppNavigator';
import { BehavioralAdaptationStatus } from '@/components/BehavioralAdaptationStatus';
import { FraudSimulationPanel } from '@/components/FraudSimulationPanel';

type Props = NativeStackScreenProps<MainTabParamList, 'Security'>;

export default function SecurityDashboardScreen({ navigation }: Props) {
  const fraudDetection = useFraudDetection('user123');
  const { features } = useBehaviorStore();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  // Monitoring auto-starts inside useFraudDetection when userId is provided

  const getRiskColor = (riskLabel: RiskLabel): string => {
    switch (riskLabel) {
      case 'LOW':
        return '#22c55e';
      case 'MEDIUM':
        return '#f59e0b';
      case 'HIGH':
        return '#ef4444';
      default:
        return '#22c55e';
    }
  };

  const getRiskIcon = (riskLabel: RiskLabel): string => {
    switch (riskLabel) {
      case 'LOW':
        return 'shield-checkmark';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'alert-circle';
      default:
        return 'shield-checkmark';
    }
  };

  const getRiskDescription = (riskLabel: RiskLabel): string => {
    switch (riskLabel) {
      case 'LOW':
        return 'Your account shows normal behavioral patterns';
      case 'MEDIUM':
        return 'Some unusual activity detected - monitor closely';
      case 'HIGH':
        return 'High risk activity detected - immediate action required';
      default:
        return 'Your account shows normal behavioral patterns';
    }
  };

  const handleResolveAlert = (alertId: string) => {
    fraudDetection.resolveFraudAlert(alertId);
  };

  const handleClearAlerts = () => {
    Alert.alert(
      'Clear All Alerts',
      'Are you sure you want to clear all fraud alerts?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', onPress: () => fraudDetection.clearFraudAlerts() },
      ]
    );
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTimeframeData = () => {
    const now = Date.now();
    const timeframeMap = {
      '24h': now - 24 * 60 * 60 * 1000,
      '7d': now - 7 * 24 * 60 * 60 * 1000,
      '30d': now - 30 * 24 * 60 * 60 * 1000,
    };
    
    return fraudDetection.fraudAlerts.filter(
      alert => alert.timestamp.getTime() > timeframeMap[selectedTimeframe]
    );
  };

  const timeframeAlerts = getTimeframeData();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Security Dashboard</Text>
        <Text style={styles.subtitle}>BehaviorGuard AI Protection Status</Text>
      </View>

      {/* Current Security Status */}
      <View style={styles.securityStatus}>
        <View style={styles.statusHeader}>
          <Ionicons
            name={getRiskIcon(fraudDetection.riskLabel)}
            size={32}
            color={getRiskColor(fraudDetection.riskLabel)}
          />
          <View style={styles.statusText}>
            <Text style={styles.statusTitle}>
              {fraudDetection.riskLabel} RISK
            </Text>
            <Text style={styles.statusDescription}>
              {getRiskDescription(fraudDetection.riskLabel)}
            </Text>
          </View>
        </View>
        
        <View style={styles.statusMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{(fraudDetection.riskScore * 100).toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Current Risk</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{(fraudDetection.confidence * 100).toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Confidence</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{fraudDetection.fraudAlerts.length}</Text>
            <Text style={styles.metricLabel}>Total Alerts</Text>
          </View>
        </View>
      </View>

      {/* Risk Factors */}
      {fraudDetection.riskFactors.length > 0 && (
        <View style={styles.riskFactors}>
          <Text style={styles.sectionTitle}>Risk Factors Detected</Text>
          {fraudDetection.riskFactors.map((factor, index) => (
            <View key={index} style={styles.riskFactor}>
              <Ionicons name="warning" size={16} color="#f59e0b" />
              <Text style={styles.riskFactorText}>{factor}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Security Recommendations */}
      {fraudDetection.recommendations.length > 0 && (
        <View style={styles.recommendations}>
          <Text style={styles.sectionTitle}>Security Recommendations</Text>
          {fraudDetection.recommendations.map((recommendation, index) => (
            <View key={index} style={styles.recommendation}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text style={styles.recommendationText}>{recommendation}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Fraud Alerts */}
      <View style={styles.fraudAlerts}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fraud Alerts</Text>
          <View style={styles.timeframeSelector}>
            {(['24h', '7d', '30d'] as const).map((timeframe) => (
              <TouchableOpacity
                key={timeframe}
                style={[
                  styles.timeframeButton,
                  selectedTimeframe === timeframe && styles.timeframeButtonActive,
                ]}
                onPress={() => setSelectedTimeframe(timeframe)}
              >
                <Text
                  style={[
                    styles.timeframeButtonText,
                    selectedTimeframe === timeframe && styles.timeframeButtonTextActive,
                  ]}
                >
                  {timeframe}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {timeframeAlerts.length > 0 ? (
          <>
            {timeframeAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertType}>
                    <Ionicons
                      name={alert.type === 'transaction' ? 'swap-horizontal' : 'shield-alert'}
                      size={16}
                      color={getRiskColor(alert.severity)}
                    />
                    <Text style={[styles.alertSeverity, { color: getRiskColor(alert.severity) }]}>
                      {alert.severity}
                    </Text>
                  </View>
                  <Text style={styles.alertTime}>{formatDate(alert.timestamp)}</Text>
                </View>
                
                <Text style={styles.alertDescription}>{alert.description}</Text>
                
                <View style={styles.alertRisk}>
                  <Text style={styles.alertRiskLabel}>Risk Score:</Text>
                  <Text style={[styles.alertRiskValue, { color: getRiskColor(alert.severity) }]}>
                    {(alert.riskScore * 100).toFixed(1)}%
                  </Text>
                </View>

                {alert.recommendations.length > 0 && (
                  <View style={styles.alertRecommendations}>
                    <Text style={styles.alertRecommendationsTitle}>Recommendations:</Text>
                    {alert.recommendations.map((rec, index) => (
                      <Text key={index} style={styles.alertRecommendationText}>
                        • {rec}
                      </Text>
                    ))}
                  </View>
                )}

                {!alert.resolved && (
                  <TouchableOpacity
                    style={styles.resolveButton}
                    onPress={() => handleResolveAlert(alert.id)}
                  >
                    <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            
            <TouchableOpacity style={styles.clearAllButton} onPress={handleClearAlerts}>
              <Text style={styles.clearAllButtonText}>Clear All Alerts</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.noAlerts}>
            <Ionicons name="shield-checkmark" size={48} color="#22c55e" />
            <Text style={styles.noAlertsTitle}>No Alerts</Text>
            <Text style={styles.noAlertsText}>
              No fraud alerts detected in the selected timeframe
            </Text>
          </View>
        )}
      </View>

      {/* Behavioral Analytics */}
      <View style={styles.behavioralAnalytics}>
        <Text style={styles.sectionTitle}>Behavioral Analytics</Text>
        
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <Ionicons name="phone-portrait" size={24} color="#3b82f6" />
            <Text style={styles.analyticsValue}>Active</Text>
            <Text style={styles.analyticsLabel}>Device Status</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Ionicons name="location" size={24} color="#22c55e" />
            <Text style={styles.analyticsValue}>Normal</Text>
            <Text style={styles.analyticsLabel}>Location Pattern</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Ionicons name="time" size={24} color="#f59e0b" />
            <Text style={styles.analyticsValue}>Consistent</Text>
            <Text style={styles.analyticsLabel}>Usage Pattern</Text>
          </View>
          
          <View style={styles.analyticsCard}>
            <Ionicons name="finger-print" size={24} color="#8b5cf6" />
            <Text style={styles.analyticsValue}>Enabled</Text>
            <Text style={styles.analyticsLabel}>Biometric Auth</Text>
          </View>
        </View>
      </View>

      {/* Fraud Simulation Panel */}
      <FraudSimulationPanel />

      {/* Security Tips */}
      <View style={styles.securityTips}>
        <Text style={styles.sectionTitle}>Security Best Practices</Text>
        
        <View style={styles.tipItem}>
          <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
          <Text style={styles.tipText}>Enable biometric authentication for all transactions</Text>
        </View>
        
        <View style={styles.tipItem}>
          <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
          <Text style={styles.tipText}>Review your transaction history regularly</Text>
        </View>
        
        <View style={styles.tipItem}>
          <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
          <Text style={styles.tipText}>Report suspicious activity immediately</Text>
        </View>
        
        <View style={styles.tipItem}>
          <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
          <Text style={styles.tipText}>Keep your device software updated</Text>
        </View>
        
        <View style={styles.tipItem}>
          <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
          <Text style={styles.tipText}>Use strong, unique passwords for all accounts</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1026',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e6e9f2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9aa4bf',
  },
  securityStatus: {
    backgroundColor: '#12183a',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    marginLeft: 16,
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e6e9f2',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#9aa4bf',
    lineHeight: 20,
  },
  statusMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#22c55e',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9aa4bf',
    marginTop: 4,
  },
  riskFactors: {
    backgroundColor: '#12183a',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e6e9f2',
    marginBottom: 16,
  },
  riskFactor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  riskFactorText: {
    fontSize: 14,
    color: '#f59e0b',
    marginLeft: 8,
    flex: 1,
  },
  recommendations: {
    backgroundColor: '#12183a',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  recommendation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    color: '#9aa4bf',
    marginLeft: 8,
    flex: 1,
  },
  fraudAlerts: {
    margin: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeframeSelector: {
    flexDirection: 'row',
    backgroundColor: '#12183a',
    borderRadius: 8,
    padding: 4,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  timeframeButtonActive: {
    backgroundColor: '#22c55e',
  },
  timeframeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9aa4bf',
  },
  timeframeButtonTextActive: {
    color: '#04121c',
  },
  alertItem: {
    backgroundColor: '#12183a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3567',
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertSeverity: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  alertTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  alertDescription: {
    fontSize: 14,
    color: '#e6e9f2',
    marginBottom: 12,
    lineHeight: 20,
  },
  alertRisk: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertRiskLabel: {
    fontSize: 12,
    color: '#9aa4bf',
  },
  alertRiskValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  alertRecommendations: {
    borderTopWidth: 1,
    borderTopColor: '#2a3567',
    paddingTop: 12,
    marginBottom: 16,
  },
  alertRecommendationsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 8,
  },
  alertRecommendationText: {
    fontSize: 12,
    color: '#9aa4bf',
    marginBottom: 4,
    lineHeight: 16,
  },
  resolveButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  resolveButtonText: {
    color: '#04121c',
    fontSize: 12,
    fontWeight: '600',
  },
  clearAllButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  clearAllButtonText: {
    color: '#e6e9f2',
    fontSize: 14,
    fontWeight: '600',
  },
  noAlerts: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#12183a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  noAlertsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22c55e',
    marginTop: 16,
    marginBottom: 8,
  },
  noAlertsText: {
    fontSize: 14,
    color: '#9aa4bf',
    textAlign: 'center',
    lineHeight: 20,
  },
  behavioralAnalytics: {
    margin: 20,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    backgroundColor: '#12183a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3567',
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e6e9f2',
    marginTop: 8,
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#9aa4bf',
    textAlign: 'center',
  },
  securityTips: {
    backgroundColor: '#12183a',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a3567',
    marginBottom: 40,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#9aa4bf',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
});
