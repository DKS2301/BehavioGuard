import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFraudDetection } from '@/services/fraud/useFraudDetection';
import { FraudModelService } from '@/services/fraud/FraudModelService';
import { SecuritySettings, User } from '@/types/model';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainTabParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<MainTabParamList, 'Settings'>;

// Mock user data
const mockUser: User = {
  id: 'user123',
  email: 'user@securebank.com',
  name: 'John Doe',
  phone: '+91 98765 43210',
  accountNumber: '****1234',
  balance: 231450.29,
  currency: 'INR',
  lastLogin: new Date(),
  biometricEnabled: true,
  pinEnabled: true,
  securityLevel: 'enhanced',
};

export default function SettingsScreen({ navigation }: Props) {
  const fraudDetection = useFraudDetection('user123');
  const [settings, setSettings] = useState<SecuritySettings>({
    biometricEnabled: true,
    pinEnabled: true,
    twoFactorEnabled: false,
    locationTracking: true,
    behavioralMonitoring: true,
    fraudAlerts: true,
    autoBlock: false,
    riskThresholds: {
      low: 0.3,
      medium: 0.7,
      high: 0.9,
    },
  });

  // Monitoring auto-starts inside useFraudDetection when userId is provided

  const handleSettingToggle = (setting: keyof SecuritySettings, value: boolean) => {
    if (setting === 'biometricEnabled' && !value) {
      Alert.alert(
        'Disable Biometric',
        'Are you sure you want to disable biometric authentication? This will reduce your account security.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', onPress: () => updateSetting(setting, value) },
        ]
      );
    } else if (setting === 'behavioralMonitoring' && !value) {
      Alert.alert(
        'Disable Behavioral Monitoring',
        'Disabling behavioral monitoring will reduce fraud detection capabilities. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disable', onPress: () => updateSetting(setting, value) },
        ]
      );
    } else {
      updateSetting(setting, value);
    }
  };

  const updateSetting = (setting: keyof SecuritySettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          // Navigate back to login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' as any }],
          });
        }},
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

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your account and security preferences</Text>
      </View>

      {/* User Profile */}
      <View style={styles.userProfile}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{mockUser.name.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{mockUser.name}</Text>
            <Text style={styles.userEmail}>{mockUser.email}</Text>
            <Text style={styles.userPhone}>{mockUser.phone}</Text>
          </View>
        </View>
        
        <View style={styles.accountInfo}>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Account Number:</Text>
            <Text style={styles.accountValue}>{mockUser.accountNumber}</Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Balance:</Text>
            <Text style={styles.accountValue}>{formatCurrency(mockUser.balance)}</Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Last Login:</Text>
            <Text style={styles.accountValue}>{formatDate(mockUser.lastLogin)}</Text>
          </View>
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Security Level:</Text>
            <Text style={[styles.accountValue, styles.securityLevel]}>
              {mockUser.securityLevel.charAt(0).toUpperCase() + mockUser.securityLevel.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {/* Security Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="finger-print" size={24} color="#22c55e" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Biometric Authentication</Text>
              <Text style={styles.settingDescription}>Use fingerprint or face ID</Text>
            </View>
          </View>
          <Switch
            value={settings.biometricEnabled}
            onValueChange={(value) => handleSettingToggle('biometricEnabled', value)}
            trackColor={{ false: '#374151', true: '#22c55e' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="key" size={24} color="#3b82f6" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>PIN Authentication</Text>
              <Text style={styles.settingDescription}>Require PIN for transactions</Text>
            </View>
          </View>
          <Switch
            value={settings.pinEnabled}
            onValueChange={(value) => handleSettingToggle('pinEnabled', value)}
            trackColor={{ false: '#374151', true: '#22c55e' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="shield-checkmark" size={24} color="#8b5cf6" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Two-Factor Authentication</Text>
              <Text style={styles.settingDescription}>Additional SMS verification</Text>
            </View>
          </View>
          <Switch
            value={settings.twoFactorEnabled}
            onValueChange={(value) => handleSettingToggle('twoFactorEnabled', value)}
            trackColor={{ false: '#374151', true: '#22c55e' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Fraud Detection Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fraud Detection</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="location" size={24} color="#f59e0b" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Location Tracking</Text>
              <Text style={styles.settingDescription}>Monitor location patterns</Text>
            </View>
          </View>
          <Switch
            value={settings.locationTracking}
            onValueChange={(value) => handleSettingToggle('locationTracking', value)}
            trackColor={{ false: '#374151', true: '#22c55e' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="analytics" size={24} color="#ef4444" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Behavioral Monitoring</Text>
              <Text style={styles.settingDescription}>AI-powered behavior analysis</Text>
            </View>
          </View>
          <Switch
            value={settings.behavioralMonitoring}
            onValueChange={(value) => handleSettingToggle('behavioralMonitoring', value)}
            trackColor={{ false: '#374151', true: '#22c55e' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications" size={24} color="#06b6d4" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Fraud Alerts</Text>
              <Text style={styles.settingDescription}>Get notified of suspicious activity</Text>
            </View>
          </View>
          <Switch
            value={settings.fraudAlerts}
            onValueChange={(value) => handleSettingToggle('fraudAlerts', value)}
            trackColor={{ false: '#374151', true: '#22c55e' }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons name="ban" size={24} color="#dc2626" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Auto-Block High Risk</Text>
              <Text style={styles.settingDescription}>Automatically block high-risk transactions</Text>
            </View>
          </View>
          <Switch
            value={settings.autoBlock}
            onValueChange={(value) => handleSettingToggle('autoBlock', value)}
            trackColor={{ false: '#374151', true: '#22c55e' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {/* Risk Thresholds */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Thresholds</Text>
        <Text style={styles.sectionDescription}>
          Configure when BehaviorGuard AI should trigger alerts
        </Text>
        
        <View style={styles.thresholdItem}>
          <Text style={styles.thresholdLabel}>Low Risk:</Text>
          <Text style={styles.thresholdValue}>{(settings.riskThresholds.low * 100).toFixed(0)}%</Text>
        </View>
        
        <View style={styles.thresholdItem}>
          <Text style={styles.thresholdLabel}>Medium Risk:</Text>
          <Text style={styles.thresholdValue}>{(settings.riskThresholds.medium * 100).toFixed(0)}%</Text>
        </View>
        
        <View style={styles.thresholdItem}>
          <Text style={styles.thresholdLabel}>High Risk:</Text>
          <Text style={styles.thresholdValue}>{(settings.riskThresholds.high * 100).toFixed(0)}%</Text>
        </View>
      </View>

      {/* Current Security Status */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Security Status</Text>
        
        <View style={styles.securityStatus}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Risk Level:</Text>
            <Text style={[styles.statusValue, { color: fraudDetection.riskLabel === 'HIGH' ? '#ef4444' : fraudDetection.riskLabel === 'MEDIUM' ? '#f59e0b' : '#22c55e' }]}>
              {fraudDetection.riskLabel}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Risk Score:</Text>
            <Text style={styles.statusValue}>{(fraudDetection.riskScore * 100).toFixed(1)}%</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Confidence:</Text>
            <Text style={styles.statusValue}>{(fraudDetection.confidence * 100).toFixed(1)}%</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Active Alerts:</Text>
            <Text style={styles.statusValue}>{fraudDetection.fraudAlerts.length}</Text>
          </View>
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="key-outline" size={20} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Change PIN</Text>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="lock-closed-outline" size={20} color="#f59e0b" />
          <Text style={styles.actionButtonText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => { fraudDetection.clearBaseline(); }}>
          <Ionicons name="card-outline" size={20} color="#8b5cf6" />
          <Text style={styles.actionButtonText}>Clear Baseline & Alerts</Text>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="help-circle-outline" size={20} color="#06b6d4" />
          <Text style={styles.actionButtonText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      {/* App Version */}
      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>SecureBank v1.0.0</Text>
        <Text style={styles.versionText}>Powered by BehaviorGuard AI</Text>
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
  userProfile: {
    backgroundColor: '#12183a',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a3567',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e6e9f2',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#9aa4bf',
  },
  accountInfo: {
    borderTopWidth: 1,
    borderTopColor: '#2a3567',
    paddingTop: 16,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountLabel: {
    fontSize: 14,
    color: '#9aa4bf',
  },
  accountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6e9f2',
  },
  securityLevel: {
    color: '#22c55e',
  },
  section: {
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
  sectionDescription: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 16,
    lineHeight: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e6e9f2',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#9aa4bf',
  },
  thresholdItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  thresholdLabel: {
    fontSize: 14,
    color: '#9aa4bf',
  },
  thresholdValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22c55e',
  },
  securityStatus: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: '#9aa4bf',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e6e9f2',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3567',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#e6e9f2',
    marginLeft: 16,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  versionInfo: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
});
