import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFraudDetection } from '@/services/fraud/useFraudDetection';
import { RiskBadge } from '@/components/RiskBadge';

export default function TransferScreen() {
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState('');
  const [note, setNote] = useState('');

  const parsedAmount = useMemo(() => Number(amount) || 0, [amount]);
  const {
    riskScore,
    riskLabel,
    isRunning,
    startMonitoring,
    stopMonitoring,
    evaluateTransaction
  } = useFraudDetection();

  const onSubmit = async () => {
    if (!account || parsedAmount <= 0) {
      Alert.alert('Invalid details', 'Enter valid account and amount');
      return;
    }
    const allowed = await evaluateTransaction({ amount: parsedAmount, account, note });
    if (allowed) {
      Alert.alert('Transfer scheduled', 'Your transfer has been initiated.');
    } else {
      Alert.alert('Transfer blocked', 'High-risk detected. Please verify identity.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>New Transfer</Text>
        <RiskBadge score={riskScore} label={riskLabel} />
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
        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={isRunning ? stopMonitoring : startMonitoring}>
          <Text style={styles.buttonText}>{isRunning ? 'Stop Monitor' : 'Start Monitor'}</Text>
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


