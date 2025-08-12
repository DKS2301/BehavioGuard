import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserBaseline } from '@/services/BehavioralProfileService';

type Props = {
  userBaseline: UserBaseline | null;
  adaptiveThresholds: { low: number; medium: number; high: number };
  sampleCount: number;
};

export function BehavioralAdaptationStatus({ userBaseline, adaptiveThresholds, sampleCount }: Props) {
  const getConfidenceColor = (confidence: number): string => {
    if (confidence < 0.3) return '#ef4444'; // Red - insufficient data
    if (confidence < 0.7) return '#f59e0b'; // Orange - learning
    return '#22c55e'; // Green - well established
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence < 0.3) return 'Learning';
    if (confidence < 0.7) return 'Adapting';
    return 'Established';
  };

  const getConfidenceIcon = (confidence: number): string => {
    if (confidence < 0.3) return 'alert-circle';
    if (confidence < 0.7) return 'sync';
    return 'checkmark-circle';
  };

  if (!userBaseline) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="person" size={20} color="#9aa4bf" />
          <Text style={styles.title}>Behavioral Profile</Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons name="add-circle" size={24} color="#3b82f6" />
          <Text style={styles.statusText}>Creating behavioral baseline...</Text>
        </View>
      </View>
    );
  }

  const lastUpdatedDate = userBaseline.lastUpdated ? new Date(userBaseline.lastUpdated) : null;
  const lastUpdatedText = lastUpdatedDate && !isNaN(lastUpdatedDate.getTime())
    ? lastUpdatedDate.toLocaleDateString()
    : 'N/A';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person" size={20} color="#9aa4bf" />
        <Text style={styles.title}>Behavioral Profile</Text>
      </View>

      {/* Confidence Status */}
      <View style={styles.confidenceSection}>
        <View style={styles.confidenceHeader}>
          <Ionicons 
            name={getConfidenceIcon(userBaseline.confidence) as any} 
            size={20} 
            color={getConfidenceColor(userBaseline.confidence)} 
          />
          <Text style={[styles.confidenceLabel, { color: getConfidenceColor(userBaseline.confidence) }]}>
            {getConfidenceLabel(userBaseline.confidence)}
          </Text>
        </View>
        <Text style={styles.confidenceValue}>
          {(userBaseline.confidence * 100).toFixed(0)}% Confidence
        </Text>
        <Text style={styles.sampleCount}>
          {sampleCount} behavioral samples collected
        </Text>
      </View>

      {/* Adaptive Thresholds */}
      <View style={styles.thresholdsSection}>
        <Text style={styles.sectionTitle}>Adaptive Risk Thresholds</Text>
        <View style={styles.thresholdRow}>
          <View style={[styles.thresholdIndicator, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.thresholdLabel}>Low Risk:</Text>
          <Text style={styles.thresholdValue}>{(adaptiveThresholds.low * 100).toFixed(0)}%</Text>
        </View>
        <View style={styles.thresholdRow}>
          <View style={[styles.thresholdIndicator, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.thresholdLabel}>Medium Risk:</Text>
          <Text style={styles.thresholdValue}>{(adaptiveThresholds.medium * 100).toFixed(0)}%</Text>
        </View>
        <View style={styles.thresholdRow}>
          <View style={[styles.thresholdIndicator, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.thresholdLabel}>High Risk:</Text>
          <Text style={styles.thresholdValue}>{(adaptiveThresholds.high * 100).toFixed(0)}%</Text>
        </View>
      </View>

      {/* Learning Progress */}
      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>Learning Progress</Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(100, (sampleCount / 50) * 100)}%`,
                backgroundColor: getConfidenceColor(userBaseline.confidence)
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {sampleCount < 50 
            ? `${50 - sampleCount} more samples needed for full adaptation`
            : 'Behavioral baseline fully established'
          }
        </Text>
      </View>

      {/* Last Updated */}
      <View style={styles.lastUpdated}>
        <Ionicons name="time" size={14} color="#6b7280" />
        <Text style={styles.lastUpdatedText}>
          Last updated: {lastUpdatedText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#12183a',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e6e9f2',
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  statusText: {
    fontSize: 16,
    color: '#9aa4bf',
    marginLeft: 8,
  },
  confidenceSection: {
    marginBottom: 20,
  },
  confidenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  confidenceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e6e9f2',
    marginBottom: 4,
  },
  sampleCount: {
    fontSize: 14,
    color: '#9aa4bf',
  },
  thresholdsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e6e9f2',
    marginBottom: 12,
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  thresholdIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  thresholdLabel: {
    fontSize: 14,
    color: '#9aa4bf',
    flex: 1,
  },
  thresholdValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6e9f2',
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1f2937',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#9aa4bf',
  },
  lastUpdated: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastUpdatedText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
});
