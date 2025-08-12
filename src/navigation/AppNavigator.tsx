import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from '@/screens/LoginScreen';
import PINEntryScreen from '@/screens/PINEntryScreen';
import DashboardScreen from '@/screens/DashboardScreen';
import TransferScreen from '@/screens/TransferScreen';
import SecurityDashboardScreen from '@/screens/SecurityDashboardScreen';
import TransactionsScreen from '@/screens/TransactionsScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import BiometricAuthModal from '@/components/auth/BiometricAuthModal';

export type RootStackParamList = {
  Login: undefined;
  PINEntry: { email: string };
  MainApp: undefined;
  BiometricAuth: { transactionId: string; amount: number };
};

export type MainTabParamList = {
  Dashboard: undefined;
  Transfer: undefined;
  Transactions: undefined;
  Security: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Transfer') {
            iconName = focused ? 'swap-horizontal' : 'swap-horizontal-outline';
          } else if (route.name === 'Transactions') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Security') {
            iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#9aa4bf',
        tabBarStyle: {
          backgroundColor: '#0b1026',
          borderTopColor: '#2a3567',
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#0b1026',
        },
        headerTintColor: '#e6e9f2',
        headerTitleStyle: {
          fontWeight: '700',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'SecureBank' }}
      />
      <Tab.Screen 
        name="Transfer" 
        component={TransferScreen} 
        options={{ title: 'New Transfer' }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen} 
        options={{ title: 'Transactions' }}
      />
      <Tab.Screen 
        name="Security" 
        component={SecurityDashboardScreen} 
        options={{ title: 'Security' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Login"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0b1026',
        },
        headerTintColor: '#e6e9f2',
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="PINEntry" 
        component={PINEntryScreen} 
        options={{ 
          headerShown: false,
          gestureEnabled: false 
        }} 
      />
      <Stack.Screen 
        name="MainApp" 
        component={MainTabNavigator} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="BiometricAuth" 
        component={BiometricAuthModal} 
        options={{ 
          presentation: 'modal',
          headerShown: false 
        }} 
      />
    </Stack.Navigator>
  );
}


