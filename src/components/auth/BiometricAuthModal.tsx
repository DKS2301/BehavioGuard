import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFraudDetection } from '@/services/fraud/useFraudDetection';
import { RiskLabel } from '@/types/model';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'BiometricAuth'>;

const { width, height } = Dimensions.get('window');

export default function BiometricAuthModal({ navigation, route }: Props) {
  const { transactionId, amount } = route.params;
  const fraudDetection = useFraudDetection('user123');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [authFailed, setAuthFailed] = useState(false);
  
  // Animation values
  const scaleAnimation = useState(new Animated.Value(0))[0];
  const pulseAnimation = useState(new Animated.Value(1))[0];
  const successScale = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Start entrance animation
    Animated.spring(scaleAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnimation, pulseAnimation]);

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);
    
    try {
      // Simulate biometric authentication
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate success (in real app, this would call actual biometric API)
      const success = Math.random() > 0.2; // 80% success rate
      
      if (success) {
        setAuthSuccess(true);
        Animated.spring(successScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
        
        // Navigate to success screen or continue transaction
        setTimeout(() => {
          navigation.goBack();
          Alert.alert('Authentication Successful', 'Transaction can now proceed.');
        }, 2000);
      } else {
        setAuthFailed(true);
        setTimeout(() => {
          setAuthFailed(false);
          setIsAuthenticating(false);
        }, 2000);
      }
    } catch (error) {
      setAuthFailed(true);
      setTimeout(() => {
        setAuthFailed(false);
        setIsAuthenticating(false);
      }, 2000);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Authentication',
      'Are you sure you want to cancel? The transaction will be blocked.',
      [
        { text: 'Continue', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

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

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{ scale: scaleAnimation }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.riskIndicator}>
              <Ionicons
                name={fraudDetection.riskLabel === 'HIGH' ? 'alert-circle' : 'warning'}
                size={24}
                color={getRiskColor(fraudDetection.riskLabel)}
              />
              <Text style={[styles.riskText, { color: getRiskColor(fraudDetection.riskLabel) }]}>
                {fraudDetection.riskLabel} RISK DETECTED
              </Text>
            </View>
            <Text style={styles.title}>Additional Verification Required</Text>
            <Text style={styles.subtitle}>
              BehaviorGuard AI has detected unusual activity. Please verify your identity.
            </Text>
          </View>

          {/* Transaction Details */}
          <View style={styles.transactionDetails}>
            <Text style={styles.detailTitle}>Transaction Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>{formatCurrency(amount)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Risk Score:</Text>
              <Text style={[styles.detailValue, { color: getRiskColor(fraudDetection.riskLabel) }]}>
                {(fraudDetection.riskScore * 100).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Confidence:</Text>
              <Text style={styles.detailValue}>{(fraudDetection.confidence * 100).toFixed(1)}%</Text>
            </View>
          </View>

          {/* Risk Factors */}
          {fraudDetection.riskFactors.length > 0 && (
            <View style={styles.riskFactors}>
              <Text style={styles.riskFactorsTitle}>Risk Factors:</Text>
              {fraudDetection.riskFactors.map((factor, index) => (
                <View key={index} style={styles.riskFactor}>
                  <Ionicons name="warning" size={16} color="#f59e0b" />
                  <Text style={styles.riskFactorText}>{factor}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Biometric Authentication */}
          <View style={styles.biometricSection}>
            <Text style={styles.biometricTitle}>Biometric Verification</Text>
            <Text style={styles.biometricDescription}>
              Please authenticate using your fingerprint or face ID
            </Text>
            
            <Animated.View
              style={[
                styles.biometricButton,
                {
                  transform: [{ scale: pulseAnimation }],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.biometricTouchable,
                  isAuthenticating && styles.biometricTouchableDisabled,
                ]}
                onPress={handleBiometricAuth}
                disabled={isAuthenticating}
              >
                <Ionicons
                  name={authSuccess ? 'checkmark-circle' : 'finger-print'}
                  size={48}
                  color={authSuccess ? '#22c55e' : '#ffffff'}
                />
                <Text style={styles.biometricButtonText}>
                  {authSuccess ? 'Authenticated' : 'Touch to Verify'}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Success Animation */}
            {authSuccess && (
              <Animated.View
                style={[
                  styles.successIcon,
                  {
                    transform: [{ scale: successScale }],
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
              </Animated.View>
            )}

            {/* Failed Animation */}
            {authFailed && (
              <View style={styles.failedIcon}>
                <Ionicons name="close-circle" size={64} color="#ef4444" />
                <Text style={styles.failedText}>Authentication Failed</Text>
                <Text style={styles.failedSubtext}>Please try again</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={isAuthenticating}
            >
              <Text style={styles.cancelButtonText}>Cancel Transaction</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => Alert.alert('Help', 'Contact customer support for assistance.')}
            >
              <Text style={styles.helpButtonText}>Need Help?</Text>
            </TouchableOpacity>
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
            <Text style={styles.securityNoticeText}>
              This verification helps protect your account from fraud
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 16, 38, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#0b1026',
    borderRadius: 20,
    padding: 24,
    width: width - 40,
    maxHeight: height - 80,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e6e9f2',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#9aa4bf',
    textAlign: 'center',
    lineHeight: 20,
  },
  transactionDetails: {
    backgroundColor: '#12183a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e6e9f2',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#9aa4bf',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6e9f2',
  },
  riskFactors: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  riskFactorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 12,
  },
  riskFactor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  riskFactorText: {
    fontSize: 12,
    color: '#9aa4bf',
    marginLeft: 8,
    flex: 1,
  },
  biometricSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  biometricTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e6e9f2',
    marginBottom: 8,
  },
  biometricDescription: {
    fontSize: 14,
    color: '#9aa4bf',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  biometricButton: {
    marginBottom: 16,
  },
  biometricTouchable: {
    backgroundColor: '#22c55e',
    padding: 24,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 120,
  },
  biometricTouchableDisabled: {
    backgroundColor: '#374151',
  },
  biometricButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  successIcon: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -32,
    marginTop: -32,
  },
  failedIcon: {
    alignItems: 'center',
    marginTop: 16,
  },
  failedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginTop: 8,
  },
  failedSubtext: {
    fontSize: 14,
    color: '#9aa4bf',
    marginTop: 4,
  },
  actions: {
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  helpButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  helpButtonText: {
    color: '#9aa4bf',
    fontSize: 16,
    fontWeight: '600',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#12183a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  securityNoticeText: {
    fontSize: 12,
    color: '#9aa4bf',
    marginLeft: 8,
    textAlign: 'center',
  },
});
