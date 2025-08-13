import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFraudDetection } from '@/services/fraud/useFraudDetection';
import { useBehaviorStore } from '@/state/useBehaviorStore';
import { RiskLabel, Transaction, Account } from '@/types/model';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<MainTabParamList, 'Dashboard'>;

// Mock data for demonstration
const mockAccounts: Account[] = [
  {
    id: '1',
    accountNumber: '****1234',
    accountName: 'Main Savings',
    type: 'savings',
    balance: 231450.29,
    currency: 'INR',
    status: 'active',
    lastTransaction: new Date(Date.now() - 86400000), // 1 day ago
  },
  {
    id: '2',
    accountNumber: '****5678',
    accountName: 'Checking Account',
    type: 'checking',
    balance: 45678.50,
    currency: 'INR',
    status: 'active',
    lastTransaction: new Date(Date.now() - 3600000), // 1 hour ago
  },
];

const mockRecentTransactions: Transaction[] = [
  {
    id: '1',
    amount: 5000,
    account: 'john.doe@email.com',
    accountName: 'John Doe',
    type: 'transfer',
    status: 'completed',
    timestamp: new Date(Date.now() - 3600000),
    fraudRiskScore: 0.15,
    fraudRiskLabel: 'LOW',
  },
  {
    id: '2',
    amount: 15000,
    account: 'jane.smith@email.com',
    accountName: 'Jane Smith',
    type: 'transfer',
    status: 'completed',
    timestamp: new Date(Date.now() - 7200000),
    fraudRiskScore: 0.08,
    fraudRiskLabel: 'LOW',
  },
  {
    id: '3',
    amount: 2500,
    account: 'bill.payment',
    accountName: 'Electricity Bill',
    type: 'payment',
    status: 'completed',
    timestamp: new Date(Date.now() - 86400000),
    fraudRiskScore: 0.12,
    fraudRiskLabel: 'LOW',
  },
];

export default function DashboardScreen({ navigation }: Props) {
  const fraudDetection = useFraudDetection('user123');
  const { features } = useBehaviorStore();
  const [selectedAccount, setSelectedAccount] = useState<Account>(mockAccounts[0]);

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

  const handleQuickTransfer = () => {
    navigation.navigate('Transfer');
  };

  const handleViewTransactions = () => {
    navigation.navigate('Transactions');
  };

  const handleSecurityDashboard = () => {
    navigation.navigate('Security');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with fraud detection status */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>Welcome back</Text>
          <View style={styles.fraudStatus}>
            <Ionicons
              name={getRiskIcon(fraudDetection.riskLabel)}
              size={20}
              color={getRiskColor(fraudDetection.riskLabel)}
            />
            <Text style={[styles.riskText, { color: getRiskColor(fraudDetection.riskLabel) }]}>
              {fraudDetection.riskLabel} RISK
            </Text>
          </View>
        </View>
        <Text style={styles.subtitle}>Your accounts are protected by BehaviorGuard AI</Text>
      </View>

      {/* Fraud Detection Overview */}
      <View style={styles.fraudOverview}>
        <Text style={styles.sectionTitle}>Security Status</Text>
        <View style={styles.fraudMetrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{(fraudDetection.riskScore * 100).toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Risk Score</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{(fraudDetection.confidence * 100).toFixed(1)}%</Text>
            <Text style={styles.metricLabel}>Confidence</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{fraudDetection.fraudAlerts.length}</Text>
            <Text style={styles.metricLabel}>Alerts</Text>
          </View>
        </View>
        
        {fraudDetection.riskFactors.length > 0 && (
          <View style={styles.riskFactors}>
            <Text style={styles.riskFactorsTitle}>Risk Factors Detected:</Text>
            {fraudDetection.riskFactors.slice(0, 2).map((factor, index) => (
              <Text key={index} style={styles.riskFactor}>• {factor}</Text>
            ))}
          </View>
        )}
      </View>

      {/* Account Balance */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balance}>{formatCurrency(selectedAccount.balance)}</Text>
        <Text style={styles.accountInfo}>
          {selectedAccount.accountName} • {selectedAccount.accountNumber}
        </Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleQuickTransfer}>
            <View style={styles.actionIcon}>
              <Ionicons name="swap-horizontal" size={24} color="#22c55e" />
            </View>
            <Text style={styles.actionText}>Transfer</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleViewTransactions}>
            <View style={styles.actionIcon}>
              <Ionicons name="list" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.actionText}>Transactions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleSecurityDashboard}>
            <View style={styles.actionIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.actionText}>Security</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.recentTransactions}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={handleViewTransactions}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {mockRecentTransactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <View style={styles.transactionIcon}>
                <Ionicons
                  name={transaction.type === 'transfer' ? 'swap-horizontal' : 'receipt'}
                  size={20}
                  color="#9aa4bf"
                />
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionName}>{transaction.accountName}</Text>
                <Text style={styles.transactionTime}>{formatDate(transaction.timestamp)}</Text>
              </View>
            </View>
            
            <View style={styles.transactionRight}>
              <Text style={styles.transactionAmount}>
                {transaction.type === 'payment' ? '-' : '+'}{formatCurrency(transaction.amount)}
              </Text>
              <View style={styles.riskIndicator}>
                <Ionicons
                  name={getRiskIcon(transaction.fraudRiskLabel)}
                  size={12}
                  color={getRiskColor(transaction.fraudRiskLabel)}
                />
                <Text style={[styles.riskIndicatorText, { color: getRiskColor(transaction.fraudRiskLabel) }]}>
                  {(transaction.fraudRiskScore * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Security Tips */}
      <View style={styles.securityTips}>
        <Text style={styles.sectionTitle}>Security Tips</Text>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
          <Text style={styles.tipText}>BehaviorGuard AI is actively monitoring your account</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
          <Text style={styles.tipText}>Enable biometric authentication for enhanced security</Text>
        </View>
        <View style={styles.tipItem}>
          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
          <Text style={styles.tipText}>Review your security dashboard regularly</Text>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e6e9f2',
  },
  fraudStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12183a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#9aa4bf',
  },
  fraudOverview: {
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
  fraudMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#22c55e',
  },
  metricLabel: {
    fontSize: 12,
    color: '#9aa4bf',
    marginTop: 4,
  },
  riskFactors: {
    borderTopWidth: 1,
    borderTopColor: '#2a3567',
    paddingTop: 16,
  },
  riskFactorsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
    marginBottom: 8,
  },
  riskFactor: {
    fontSize: 12,
    color: '#9aa4bf',
    marginBottom: 4,
  },
  balanceCard: {
    backgroundColor: '#12183a',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a3567',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 8,
  },
  balance: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  accountInfo: {
    fontSize: 12,
    color: '#6b7280',
  },
  quickActions: {
    margin: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#12183a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3567',
    minWidth: 80,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#e6e9f2',
  },
  recentTransactions: {
    margin: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#12183a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3567',
    marginBottom: 12,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e6e9f2',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e6e9f2',
    marginBottom: 4,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
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
  },
});


