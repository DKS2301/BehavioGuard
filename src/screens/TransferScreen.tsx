import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFraudDetection } from '@/services/fraud/useFraudDetection';
import { RiskBadge } from '@/components/RiskBadge';
import { useTransactionStore } from '@/state/useTransactionStore';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'MainApp'>;

export default function TransferScreen({ navigation }: Props) {
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('');
  const [note, setNote] = useState('');

  const parsedAmount = useMemo(() => Number(amount) || 0, [amount]);
  const fraud = useFraudDetection('user123');
  const { addTransaction, updateTransaction } = useTransactionStore();

  const onSubmit = async () => {
    if (!account || parsedAmount <= 0) {
      Alert.alert('Invalid details', 'Enter valid account and amount');
      return;
    }

    const tx = {
      id: `tx_${Date.now()}`,
      amount: parsedAmount,
      account,
      accountName: account,
      note,
      type: 'transfer' as const,
      status: 'pending' as const,
      timestamp: new Date(),
      fraudRiskScore: 0,
      fraudRiskLabel: 'LOW' as const,
    };

    // Run risk evaluation
    const res = await fraud.evaluateTransaction(tx);

    // Update transaction with risk results
    const updated = {
      ...tx,
      fraudRiskScore: res.riskScore,
      fraudRiskLabel: res.riskLabel,
      status: res.shouldBlock ? 'blocked' : res.requiresAdditionalAuth ? 'pending' : 'completed',
    } as typeof tx;

    // Register transaction in global store (top)
    addTransaction(updated);

    if (res.shouldBlock) {
      Alert.alert('Transfer blocked', 'High-risk detected. Please verify identity.');
      return;
    }

    if (res.requiresAdditionalAuth) {
      // Navigate to biometric modal for verification
      navigation.navigate('BiometricAuth', { transactionId: updated.id, amount: updated.amount });
      return;
    }

    Alert.alert('Transfer scheduled', 'Your transfer has been initiated.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>New Transfer</Text>
        <RiskBadge score={fraud.riskScore} label={fraud.riskLabel} />
      </View>

      <TextInput
        placeholder="Recipient account"
        placeholderTextColor="#9aa4bf"
        value={account}
        onChangeText={setAccount}
        style={styles.input}
      />
      <TextInput
        placeholder="Amount"
        placeholderTextColor="#9aa4bf"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
      />
      <TextInput
        placeholder="Note (optional)"
        placeholderTextColor="#9aa4bf"
        value={note}
        onChangeText={setNote}
        style={[styles.input, { height: 80 }]} multiline
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={fraud.isRunning ? fraud.stopMonitoring : fraud.startMonitoring}>
          <Text style={styles.buttonText}>{fraud.isRunning ? 'Stop Monitor' : 'Start Monitor'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.primary]} onPress={onSubmit}>
          <Text style={[styles.buttonText, { color: '#04121c' }]}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1026', padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  input: {
    backgroundColor: '#12183a',
    borderRadius: 12,
    padding: 14,
    color: '#e6e9f2',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2a3567'
  },
  buttonRow: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  primary: { backgroundColor: '#22c55e' },
  secondary: { backgroundColor: '#243a6b' },
  buttonText: { color: '#e6e9f2', fontWeight: '700' }
});


