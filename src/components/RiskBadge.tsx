import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function RiskBadge({ score, label }: { score: number; label: 'LOW' | 'MEDIUM' | 'HIGH' }) {
  const backgroundColor = label === 'LOW' ? '#16a34a' : label === 'MEDIUM' ? '#f59e0b' : '#ef4444';
  return (
    <View style={[styles.container, { backgroundColor }]}> 
      <Text style={styles.text}>{label} • {(score * 100).toFixed(0)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 9999 },
  text: { color: '#04121c', fontWeight: '800' }
});


