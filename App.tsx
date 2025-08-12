import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './src/navigation/AppNavigator';
import { TensorflowService } from './src/services/tf/TensorflowService';

export default function App() {
  useEffect(() => {
    // Initialize TensorFlow service for AI model loading
    TensorflowService.initialize().catch((error) => {
      // eslint-disable-next-line no-console
      console.error('TensorFlow initialization failed', error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="#0b1026" />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}


