import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeatureSimulator } from '@/services/FeatureSimulator';
import { useFraudDetection } from '@/services/fraud/useFraudDetection';

type FraudPattern = 'motion' | 'touch' | 'location' | 'transaction' | 'device' | 'behavioral';

export function FraudSimulationPanel() {
  const [isSimulationActive, setIsSimulationActive] = useState(false);
  const [activePattern, setActivePattern] = useState<FraudPattern | null>(null);
  const [simulationMode, setSimulationMode] = useState<'legitimate' | 'fraud'>('legitimate');
  
  const fraudDetection = useFraudDetection('simulation_user');

  const fraudPatterns: Array<{ key: FraudPattern; name: string; icon: string; description: string }> = [
    {
      key: 'motion',
      name: 'Motion Anomaly',
      icon: 'phone-portrait',
      description: 'Simulate unusual device movement patterns'
    },
    {
      key: 'touch',
      name: 'Touch Anomaly',
      icon: 'hand-left',
      description: 'Simulate irregular touch patterns'
    },
    {
      key: 'location',
      name: 'Location Anomaly',
      icon: 'location',
      description: 'Simulate suspicious location patterns'
    },
    {
      key: 'transaction',
      name: 'Transaction Anomaly',
      icon: 'card',
      description: 'Simulate unusual transaction patterns'
    },
    {
      key: 'device',
      name: 'Device Anomaly',
      icon: 'settings',
      description: 'Simulate device state anomalies'
    },
    {
      key: 'behavioral',
      name: 'Behavioral Anomaly',
      icon: 'person',
      description: 'Simulate behavioral pattern changes'
    }
  ];

  const startSimulation = (pattern: FraudPattern) => {
    setIsSimulationActive(true);
    setActivePattern(pattern);
    
    // Generate fraud features for the selected pattern
    const fraudFeatures = FeatureSimulator.generateWithPattern(
      pattern,
      simulationMode === 'fraud',
      new Date()
    );

    // Log the simulation details
    console.log(`🚨 Fraud Simulation Started:`);
    console.log(`   Pattern: ${pattern}`);
    console.log(`   Mode: ${simulationMode}`);
    console.log(`   Features:`, fraudFeatures.slice(0, 10)); // Show first 10 features

    // Show alert with simulation details
    Alert.alert(
      'Fraud Simulation Active',
      `Pattern: ${pattern}\nMode: ${simulationMode}\nRisk Score: ${fraudDetection.riskScore.toFixed(3)}`,
      [{ text: 'OK' }]
    );
  };

  const stopSimulation = () => {
    setIsSimulationActive(false);
    setActivePattern(null);
    console.log('🛑 Fraud Simulation Stopped');
  };

  const generateTestTransaction = () => {
    const testTransaction = {
      id: `test_${Date.now()}`,
      amount: simulationMode === 'fraud' ? 50000 : 5000,
      account: 'test@example.com',
      accountName: 'Test Account',
      type: 'transfer' as const,
      status: 'pending' as const,
      timestamp: new Date(),
      fraudRiskScore: 0,
      fraudRiskLabel: 'LOW' as const,
    };

    // Evaluate the test transaction
    fraudDetection.evaluateTransaction(testTransaction).then(result => {
      Alert.alert(
        'Test Transaction Result',
        `Amount: ₹${testTransaction.amount}\nRisk Score: ${(result.riskScore * 100).toFixed(1)}%\nRisk Label: ${result.riskLabel}\nBlocked: ${result.shouldBlock ? 'Yes' : 'No'}`,
        [{ text: 'OK' }]
      );
    });
  };

  const getFeatureContributions = () => {
    const features = FeatureSimulator.generateFeatures(
      simulationMode === 'fraud',
      new Date()
    );
    
    const contributions = FeatureSimulator.getFeatureContributions(features);
    const topContributors = contributions
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
      .slice(0, 5);

    console.log('📊 Top Feature Contributors:', topContributors);
    
    Alert.alert(
      'Feature Contributions',
      topContributors.map(c => `${c.name}: ${(c.contribution * 100).toFixed(1)}%`).join('\n'),
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bug" size={24} color="#ef4444" />
        <Text style={styles.title}>Fraud Simulation Panel</Text>
        <Switch
          value={isSimulationActive}
          onValueChange={(value) => value ? null : stopSimulation()}
          trackColor={{ false: '#374151', true: '#ef4444' }}
          thumbColor={isSimulationActive ? '#ffffff' : '#9ca3af'}
        />
      </View>

      <View style={styles.modeSelector}>
        <Text style={styles.sectionTitle}>Simulation Mode</Text>
        <View style={styles.modeButtons}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              simulationMode === 'legitimate' && styles.modeButtonActive
            ]}
            onPress={() => setSimulationMode('legitimate')}
          >
            <Ionicons 
              name="shield-checkmark" 
              size={16} 
              color={simulationMode === 'legitimate' ? '#ffffff' : '#22c55e'} 
            />
            <Text style={[
              styles.modeButtonText,
              simulationMode === 'legitimate' && styles.modeButtonTextActive
            ]}>
              Legitimate
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              simulationMode === 'fraud' && styles.modeButtonActive
            ]}
            onPress={() => setSimulationMode('fraud')}
          >
            <Ionicons 
              name="warning" 
              size={16} 
              color={simulationMode === 'fraud' ? '#ffffff' : '#ef4444'} 
            />
            <Text style={[
              styles.modeButtonText,
              simulationMode === 'fraud' && styles.modeButtonTextActive
            ]}>
              Fraud
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Fraud Patterns</Text>
      <View style={styles.patternsGrid}>
        {fraudPatterns.map((pattern) => (
          <TouchableOpacity
            key={pattern.key}
            style={[
              styles.patternCard,
              activePattern === pattern.key && styles.patternCardActive
            ]}
            onPress={() => startSimulation(pattern.key)}
          >
            <Ionicons 
              name={pattern.icon as any} 
              size={24} 
              color={activePattern === pattern.key ? '#ffffff' : '#6b7280'} 
            />
            <Text style={[
              styles.patternName,
              activePattern === pattern.key && styles.patternNameActive
            ]}>
              {pattern.name}
            </Text>
            <Text style={[
              styles.patternDescription,
              activePattern === pattern.key && styles.patternDescriptionActive
            ]}>
              {pattern.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={generateTestTransaction}
        >
          <Ionicons name="card" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Test Transaction</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={getFeatureContributions}
        >
          <Ionicons name="analytics" size={20} color="#ffffff" />
          <Text style={styles.actionButtonText}>Feature Analysis</Text>
        </TouchableOpacity>
      </View>

      {isSimulationActive && (
        <View style={styles.statusBar}>
          <Ionicons name="radio" size={16} color="#ef4444" />
          <Text style={styles.statusText}>
            Simulation Active: {activePattern} ({simulationMode})
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#12183a',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e6e9f2',
    flex: 1,
    marginLeft: 12,
  },
  modeSelector: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e6e9f2',
    marginBottom: 12,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a3567',
    backgroundColor: '#1f2937',
  },
  modeButtonActive: {
    backgroundColor: simulationMode === 'fraud' ? '#ef4444' : '#22c55e',
    borderColor: simulationMode === 'fraud' ? '#ef4444' : '#22c55e',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginLeft: 6,
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  patternsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  patternCard: {
    width: '48%',
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2a3567',
    alignItems: 'center',
  },
  patternCardActive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  patternName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6e9f2',
    marginTop: 8,
    textAlign: 'center',
  },
  patternNameActive: {
    color: '#ffffff',
  },
  patternDescription: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 16,
  },
  patternDescriptionActive: {
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
});
