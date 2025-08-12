import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'SecureBank',
  slug: 'securebank',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0b1026'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.securebank.app'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0b1026'
    },
    package: 'com.securebank.app'
  },
  web: {
    favicon: './assets/favicon.png'
  },
  extra: {
    // Fraud detection configuration
    LOW_RISK_THRESHOLD: 0.3,
    MEDIUM_RISK_THRESHOLD: 0.7,
    HIGH_RISK_THRESHOLD: 0.9,
    
    // AI model configuration
    MODEL_VERSION: '1.0.0',
    INPUT_FEATURES: 100,
    INFERENCE_TIMEOUT: 5000,
    
    // Security settings
    ENCRYPTION_ENABLED: true,
    BIOMETRIC_AUTH_ENABLED: true,
    BEHAVIORAL_MONITORING_ENABLED: true,
    
    // Sensor configuration
    ACCELEROMETER_INTERVAL: 100,
    GYROSCOPE_INTERVAL: 100,
    LOCATION_INTERVAL: 5000,
    LOCATION_DISTANCE: 10,
    
    // App configuration
    APP_NAME: 'SecureBank',
    APP_DESCRIPTION: 'AI-Powered Banking with BehaviorGuard',
    SUPPORT_EMAIL: 'support@securebank.com',
    
    // Feature flags
    ENABLE_FRAUD_DETECTION: true,
    ENABLE_LOCATION_TRACKING: true,
    ENABLE_BIOMETRIC_AUTH: true,
    ENABLE_REAL_TIME_MONITORING: true,
    
    // Development settings
    ENABLE_DEBUG_MODE: true,
    ENABLE_MOCK_DATA: true,
    ENABLE_PERFORMANCE_MONITORING: true
  }
};

export default config;


