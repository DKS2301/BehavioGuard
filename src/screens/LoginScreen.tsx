import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onLogin = () => {
    if (!email || !password) {
      Alert.alert('Missing credentials', 'Please enter email and password');
      return;
    }
    
    // Navigate to PIN entry screen
    navigation.navigate('PINEntry', { email });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SecureBank</Text>
      <Text style={styles.subtitle}>Secure Banking with AI Protection</Text>
      <Text style={styles.description}>
        Your financial security is protected by BehaviorGuard AI, monitoring behavioral patterns in real-time
      </Text>
      
      <View style={styles.formContainer}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor="#6b7280"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
        <TouchableOpacity style={styles.button} onPress={onLogin}>
          <Text style={styles.buttonText}>Continue to PIN</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.securityInfo}>
        <Text style={styles.securityTitle}>🔒 Advanced Security Features</Text>
        <Text style={styles.securityText}>• Real-time behavioral monitoring</Text>
        <Text style={styles.securityText}>• AI-powered fraud detection</Text>
        <Text style={styles.securityText}>• Biometric authentication</Text>
        <Text style={styles.securityText}>• Location and device verification</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'center', 
    backgroundColor: '#0b1026' 
  },
  title: { 
    fontSize: 32, 
    fontWeight: '700', 
    color: '#ffffff', 
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: { 
    fontSize: 16, 
    color: '#9aa4bf', 
    textAlign: 'center', 
    marginBottom: 16
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
    paddingHorizontal: 20
  },
  formContainer: {
    marginBottom: 40
  },
  input: {
    backgroundColor: '#12183a',
    borderRadius: 12,
    padding: 16,
    color: '#e6e9f2',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2a3567',
    fontSize: 16
  },
  button: { 
    backgroundColor: '#22c55e', 
    padding: 16, 
    borderRadius: 12, 
    marginTop: 8 
  },
  buttonText: { 
    color: '#04121c', 
    fontWeight: '700', 
    textAlign: 'center',
    fontSize: 16
  },
  securityInfo: {
    backgroundColor: '#12183a',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a3567'
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e6e9f2',
    marginBottom: 12,
    textAlign: 'center'
  },
  securityText: {
    fontSize: 14,
    color: '#9aa4bf',
    marginBottom: 6,
    lineHeight: 20
  }
});


