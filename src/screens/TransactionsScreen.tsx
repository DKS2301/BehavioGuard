import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFraudDetection } from '@/services/fraud/useFraudDetection';
import { Transaction, RiskLabel } from '@/types/model';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<MainTabParamList, 'Transactions'>;

// Mock transaction data
const mockTransactions: Transaction[] = [
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
  {
    id: '4',
    amount: 50000,
    account: 'unknown@email.com',
    accountName: 'Unknown Recipient',
    type: 'transfer',
    status: 'pending',
    timestamp: new Date(Date.now() - 1800000),
    fraudRiskScore: 0.75,
    fraudRiskLabel: 'HIGH',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      city: 'New York, NY'
    }
  },
  {
    id: '5',
    amount: 12000,
    account: 'grocery.store',
    accountName: 'Grocery Store',
    type: 'payment',
    status: 'completed',
    timestamp: new Date(Date.now() - 43200000),
    fraudRiskScore: 0.25,
    fraudRiskLabel: 'LOW',
  },
  {
    id: '6',
    amount: 8000,
    account: 'friend@email.com',
    accountName: 'Friend Transfer',
    type: 'transfer',
    status: 'completed',
    timestamp: new Date(Date.now() - 129600000),
    fraudRiskScore: 0.18,
    fraudRiskLabel: 'LOW',
  },
];

export default function TransactionsScreen({ navigation }: Props) {
  const fraudDetection = useFraudDetection('user123');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'transfers' | 'payments'>('all');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<'all' | RiskLabel>('all');
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      case 'blocked':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'failed':
        return 'close-circle';
      case 'blocked':
        return 'ban';
      default:
        return 'help-circle';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) { // 7 days
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return new Intl.DateTimeFormat('en-IN', {
        month: 'short',
        day: 'numeric',
      }).format(date);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.account.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTypeFilter = selectedFilter === 'all' || transaction.type === selectedFilter;
    
    const matchesRiskFilter = selectedRiskFilter === 'all' || transaction.fraudRiskLabel === selectedRiskFilter;
    
    return matchesSearch && matchesTypeFilter && matchesRiskFilter;
  });

  const getTransactionIcon = (type: string): string => {
    switch (type) {
      case 'transfer':
        return 'swap-horizontal';
      case 'payment':
        return 'receipt';
      case 'deposit':
        return 'arrow-down';
      case 'withdrawal':
        return 'arrow-up';
      default:
        return 'swap-horizontal';
    }
  };

  const handleTransactionPress = (transaction: Transaction) => {
    // Navigate to transaction details or show fraud analysis
    if (transaction.fraudRiskLabel === 'HIGH') {
      // Show high-risk transaction warning
      alert(`High-risk transaction detected!\n\nAmount: ${formatCurrency(transaction.amount)}\nRecipient: ${transaction.accountName}\nRisk Score: ${(transaction.fraudRiskScore * 100).toFixed(1)}%\n\nThis transaction has been flagged for review.`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>Monitor your financial activity</Text>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor="#6b7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterTabText, selectedFilter === 'all' && styles.filterTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'transfers' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('transfers')}
          >
            <Text style={[styles.filterTabText, selectedFilter === 'transfers' && styles.filterTabTextActive]}>
              Transfers
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'payments' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('payments')}
          >
            <Text style={[styles.filterTabText, selectedFilter === 'payments' && styles.filterTabTextActive]}>
              Payments
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Risk Filter */}
      <View style={styles.riskFilter}>
        <Text style={styles.riskFilterLabel}>Risk Level:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.riskFilterButton, selectedRiskFilter === 'all' && styles.riskFilterButtonActive]}
            onPress={() => setSelectedRiskFilter('all')}
          >
            <Text style={[styles.riskFilterButtonText, selectedRiskFilter === 'all' && styles.riskFilterButtonTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          
          {(['LOW', 'MEDIUM', 'HIGH'] as RiskLabel[]).map((risk) => (
            <TouchableOpacity
              key={risk}
              style={[
                styles.riskFilterButton,
                selectedRiskFilter === risk && styles.riskFilterButtonActive,
                { borderColor: getRiskColor(risk) }
              ]}
              onPress={() => setSelectedRiskFilter(risk)}
            >
              <Text style={[
                styles.riskFilterButtonText,
                selectedRiskFilter === risk && styles.riskFilterButtonTextActive,
                { color: selectedRiskFilter === risk ? '#ffffff' : getRiskColor(risk) }
              ]}>
                {risk}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transaction List */}
      <ScrollView style={styles.transactionList} showsVerticalScrollIndicator={false}>
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionItem}
              onPress={() => handleTransactionPress(transaction)}
            >
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: transaction.fraudRiskLabel === 'HIGH' ? '#dc2626' : '#1f2937' }
                ]}>
                  <Ionicons
                    name={getTransactionIcon(transaction.type)}
                    size={20}
                    color="#ffffff"
                  />
                </View>
                
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionName}>{transaction.accountName}</Text>
                  <Text style={styles.transactionAccount}>{transaction.account}</Text>
                  <Text style={styles.transactionTime}>{formatDate(transaction.timestamp)}</Text>
                </View>
              </View>
              
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>
                  {transaction.type === 'payment' ? '-' : '+'}{formatCurrency(transaction.amount)}
                </Text>
                
                <View style={styles.transactionStatus}>
                  <Ionicons
                    name={getStatusIcon(transaction.status)}
                    size={12}
                    color={getStatusColor(transaction.status)}
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(transaction.status) }]}>
                    {transaction.status}
                  </Text>
                </View>
                
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
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.noTransactions}>
            <Ionicons name="search" size={48} color="#6b7280" />
            <Text style={styles.noTransactionsTitle}>No transactions found</Text>
            <Text style={styles.noTransactionsText}>
              Try adjusting your search or filters
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Fraud Detection Status */}
      <View style={styles.fraudStatus}>
        <View style={styles.fraudStatusHeader}>
          <Ionicons
            name={getRiskIcon(fraudDetection.riskLabel)}
            size={20}
            color={getRiskColor(fraudDetection.riskLabel)}
          />
          <Text style={styles.fraudStatusText}>
            BehaviorGuard AI is actively monitoring your transactions
          </Text>
        </View>
        <Text style={styles.fraudStatusSubtext}>
          Current risk level: {fraudDetection.riskLabel} ({(fraudDetection.riskScore * 100).toFixed(1)}%)
        </Text>
      </View>
    </View>
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12183a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: '#e6e9f2',
    fontSize: 16,
  },
  filterTabs: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#12183a',
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  filterTabActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9aa4bf',
  },
  filterTabTextActive: {
    color: '#04121c',
  },
  riskFilter: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  riskFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6e9f2',
    marginBottom: 12,
  },
  riskFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  riskFilterButtonActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  riskFilterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9aa4bf',
  },
  riskFilterButtonTextActive: {
    color: '#ffffff',
  },
  transactionList: {
    flex: 1,
    paddingHorizontal: 20,
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
  transactionAccount: {
    fontSize: 12,
    color: '#6b7280',
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
    marginBottom: 8,
  },
  transactionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
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
  noTransactions: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#12183a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  noTransactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e6e9f2',
    marginTop: 16,
    marginBottom: 8,
  },
  noTransactionsText: {
    fontSize: 14,
    color: '#9aa4bf',
    textAlign: 'center',
  },
  fraudStatus: {
    backgroundColor: '#12183a',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  fraudStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fraudStatusText: {
    fontSize: 14,
    color: '#e6e9f2',
    marginLeft: 8,
    flex: 1,
  },
  fraudStatusSubtext: {
    fontSize: 12,
    color: '#9aa4bf',
    marginLeft: 28,
  },
});
