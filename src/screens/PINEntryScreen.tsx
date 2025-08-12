import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFraudDetection } from '@/services/fraud/useFraudDetection';
import { useBehaviorStore } from '@/state/useBehaviorStore';
import { RiskLabel } from '@/types/model';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PINEntry'>;

const { width } = Dimensions.get('window');
const PIN_LENGTH = 6;

export default function PINEntryScreen({ navigation, route }: Props) {
  const { email } = route.params;
  const [pin, setPin] = useState<string[]>([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showRiskIndicator, setShowRiskIndicator] = useState(false);
  const [currentRiskLabel, setCurrentRiskLabel] = useState<RiskLabel>('LOW');
  
  const fraudDetection = useFraudDetection('user123');
  const { features } = useBehaviorStore();
  
  // Animation values
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const riskIndicatorOpacity = useRef(new Animated.Value(0)).current;
  const pinDotScale = useRef(new Animated.Value(1)).current;

  // PIN entry timing for behavioral analysis
  const pinTiming = useRef<number[]>([]);
  const lastPinEntry = useRef<number>(Date.now());

  // Memoized risk assessment to prevent infinite re-renders
  const handleRiskChange = useCallback((riskLabel: RiskLabel) => {
    if (riskLabel !== currentRiskLabel) {
      setCurrentRiskLabel(riskLabel);
      
      if (riskLabel !== 'LOW') {
        setShowRiskIndicator(true);
        Animated.timing(riskIndicatorOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        // Shake animation for high risk
        if (riskLabel === 'HIGH') {
          Animated.sequence([
            Animated.timing(shakeAnimation, {
              toValue: 10,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
              toValue: -10,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
              toValue: 0,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();
        }
      } else {
        setShowRiskIndicator(false);
        Animated.timing(riskIndicatorOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [currentRiskLabel, riskIndicatorOpacity, shakeAnimation]);

  useEffect(() => {
    // Start fraud detection monitoring
    fraudDetection.startMonitoring();
    
    return () => {
      fraudDetection.stopMonitoring();
    };
  }, []); // Remove fraudDetection from dependencies

  useEffect(() => {
    // Monitor risk changes during PIN entry
    handleRiskChange(fraudDetection.riskLabel);
  }, [fraudDetection.riskLabel, handleRiskChange]);

  const handlePinPress = (digit: string) => {
    if (pin.length >= PIN_LENGTH) return;
    
    const currentTime = Date.now();
    const timeSinceLastEntry = currentTime - lastPinEntry.current;
    pinTiming.current.push(timeSinceLastEntry);
    lastPinEntry.current = currentTime;
    
    // Animate PIN dot
    Animated.sequence([
      Animated.timing(pinDotScale, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pinDotScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    const newPin = [...pin, digit];
    setPin(newPin);
    
    // Check if PIN is complete
    if (newPin.length === PIN_LENGTH) {
      handlePinComplete(newPin);
    }
  };

  const handlePinComplete = async (completedPin: string[]) => {
    setIsAuthenticating(true);
    
    try {
      // Simulate PIN verification with behavioral fraud detection
      const pinString = completedPin.join('');
      
      // Create a mock transaction for fraud detection context
      const mockTransaction = {
        id: 'pin_verification',
        amount: 0,
        account: email,
        accountName: 'PIN Verification',
        type: 'transfer' as const,
        status: 'pending' as const,
        timestamp: new Date(),
        fraudRiskScore: 0,
        fraudRiskLabel: 'LOW' as RiskLabel,
      };
      
      // Evaluate fraud risk during PIN entry
      const riskAssessment = await fraudDetection.evaluateTransaction(mockTransaction);
      
      // Check if PIN is correct (mock validation)
      if (pinString === '123456') {
        if (riskAssessment.shouldBlock) {
          Alert.alert(
            'Access Denied',
            'High fraud risk detected. Please contact support.',
            [{ text: 'OK', onPress: () => setPin([]) }]
          );
          setIsAuthenticating(false);
          return;
        }
        
        if (riskAssessment.requiresAdditionalAuth) {
          // Navigate to biometric authentication
          navigation.replace('MainApp');
        } else {
          // Direct access granted
          navigation.replace('MainApp');
        }
      } else {
        Alert.alert('Invalid PIN', 'Please try again.');
        setPin([]);
        pinTiming.current = [];
      }
    } catch (error) {
      console.warn('PIN verification error:', error);
      Alert.alert('Error', 'Authentication failed. Please try again.');
      setPin([]);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      pinTiming.current.pop();
    }
  };

  const getRiskIndicatorColor = (): string => {
    switch (currentRiskLabel) {
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

  const getRiskIndicatorText = (): string => {
    switch (currentRiskLabel) {
      case 'LOW':
        return 'Low Risk';
      case 'MEDIUM':
        return 'Medium Risk';
      case 'HIGH':
        return 'High Risk';
      default:
        return 'Low Risk';
    }
  };

  const getRiskIcon = (): string => {
    switch (currentRiskLabel) {
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Enter Your PIN</Text>
        <Text style={styles.subtitle}>SecureBank - Protected by BehaviorGuard AI</Text>
      </View>

      {/* Risk Indicator */}
      {showRiskIndicator && (
        <Animated.View
          style={[
            styles.riskIndicator,
            {
              opacity: riskIndicatorOpacity,
              transform: [{ translateX: shakeAnimation }],
            },
          ]}
        >
          <Ionicons name={getRiskIcon()} size={20} color={getRiskIndicatorColor()} />
          <Text style={[styles.riskText, { color: getRiskIndicatorColor() }]}>
            {getRiskIndicatorText()}
          </Text>
        </Animated.View>
      )}

      {/* PIN Display */}
      <View style={styles.pinContainer}>
        <Text style={styles.pinLabel}>Enter 6-digit PIN</Text>
        <View style={styles.pinDots}>
          {Array.from({ length: PIN_LENGTH }, (_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.pinDot,
                {
                  backgroundColor: pin[index] ? '#22c55e' : '#2a3567',
                  transform: [{ scale: pinDotScale }],
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* Fraud Detection Status */}
      <View style={styles.fraudStatus}>
        <View style={styles.statusItem}>
          <Ionicons name="shield-checkmark" size={16} color="#22c55e" />
          <Text style={styles.statusText}>BehaviorGuard AI Active</Text>
        </View>
        <View style={styles.statusItem}>
          <Ionicons name="analytics" size={16} color="#3b82f6" />
          <Text style={styles.statusText}>
            Risk Score: {(fraudDetection.riskScore * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Number Pad */}
      <View style={styles.numberPad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['', '0', 'backspace'],
        ].map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberRow}>
            {row.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.numberButton,
                  item === '' && styles.emptyButton,
                ]}
                onPress={() => {
                  if (item === 'backspace') {
                    handleBackspace();
                  } else if (item !== '') {
                    handlePinPress(item);
                  }
                }}
                disabled={isAuthenticating || item === ''}
              >
                {item === 'backspace' ? (
                  <Ionicons name="backspace" size={24} color="#e6e9f2" />
                ) : (
                  <Text style={styles.numberText}>{item}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Loading Overlay */}
      {isAuthenticating && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Ionicons name="shield-checkmark" size={48} color="#22c55e" />
            <Text style={styles.loadingText}>Verifying...</Text>
            <Text style={styles.loadingSubtext}>Analyzing behavioral patterns</Text>
          </View>
        </View>
      )}

      {/* Security Info */}
      <View style={styles.securityInfo}>
        <Text style={styles.securityTitle}>🔒 Advanced Security</Text>
        <Text style={styles.securityText}>• Real-time behavioral monitoring</Text>
        <Text style={styles.securityText}>• AI-powered fraud detection</Text>
        <Text style={styles.securityText}>• Device and location verification</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1026',
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9aa4bf',
    textAlign: 'center',
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12183a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
    alignSelf: 'center',
  },
  riskText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  pinContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  pinLabel: {
    fontSize: 16,
    color: '#9aa4bf',
    marginBottom: 20,
  },
  pinDots: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginHorizontal: 8,
    borderWidth: 2,
    borderColor: '#2a3567',
  },
  fraudStatus: {
    backgroundColor: '#12183a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#9aa4bf',
    marginLeft: 8,
  },
  numberPad: {
    marginBottom: 40,
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  numberButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#12183a',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  emptyButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  numberText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#e6e9f2',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 16, 38, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    backgroundColor: '#12183a',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e6e9f2',
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#9aa4bf',
    marginTop: 8,
  },
  securityInfo: {
    backgroundColor: '#12183a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6e9f2',
    marginBottom: 8,
    textAlign: 'center',
  },
  securityText: {
    fontSize: 12,
    color: '#9aa4bf',
    marginBottom: 4,
  },
});
