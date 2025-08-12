export type FraudModelMetadata = {
  architecture: string;
  inputFeatures: number; // must be 100
  featureOrder: string[]; // names in order
  performance: { f1: number; accuracy: number };
};

export type Transaction = {
  id: string;
  amount: number;
  account: string;
  accountName: string;
  note?: string;
  type: 'transfer' | 'payment' | 'deposit' | 'withdrawal';
  status: 'pending' | 'completed' | 'failed' | 'blocked';
  timestamp: Date;
  fraudRiskScore: number;
  fraudRiskLabel: RiskLabel;
  location?: {
    latitude: number;
    longitude: number;
    city: string;
  };
};

export type RiskLabel = 'LOW' | 'MEDIUM' | 'HIGH';

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  accountNumber: string;
  balance: number;
  currency: string;
  lastLogin: Date;
  biometricEnabled: boolean;
  pinEnabled: boolean;
  securityLevel: 'basic' | 'enhanced' | 'premium';
};

export type Account = {
  id: string;
  accountNumber: string;
  accountName: string;
  type: 'savings' | 'checking' | 'credit';
  balance: number;
  currency: string;
  status: 'active' | 'suspended' | 'closed';
  lastTransaction: Date;
};

export type BehavioralProfile = {
  userId: string;
  baselineFeatures: number[];
  lastUpdated: Date;
  confidence: number;
  anomalyThreshold: number;
  deviceFingerprint: string;
  locationPatterns: LocationPattern[];
  timePatterns: TimePattern[];
  touchPatterns: TouchPattern[];
  motionPatterns: MotionPattern[];
};

export type LocationPattern = {
  latitude: number;
  longitude: number;
  frequency: number;
  lastSeen: Date;
  riskScore: number;
};

export type TimePattern = {
  hour: number;
  dayOfWeek: number;
  frequency: number;
  riskScore: number;
};

export type TouchPattern = {
  pressure: number;
  duration: number;
  area: number;
  frequency: number;
  riskScore: number;
};

export type MotionPattern = {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  frequency: number;
  riskScore: number;
};

export type FraudAlert = {
  id: string;
  userId: string;
  type: 'transaction' | 'login' | 'behavioral' | 'location';
  severity: RiskLabel;
  description: string;
  timestamp: Date;
  resolved: boolean;
  riskScore: number;
  recommendations: string[];
};

export type SecuritySettings = {
  biometricEnabled: boolean;
  pinEnabled: boolean;
  twoFactorEnabled: boolean;
  locationTracking: boolean;
  behavioralMonitoring: boolean;
  fraudAlerts: boolean;
  autoBlock: boolean;
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
  };
};

export type PINEntry = {
  digits: string[];
  currentIndex: number;
  fraudRiskScore: number;
  fraudRiskLabel: RiskLabel;
  isComplete: boolean;
  attempts: number;
  lastAttempt: Date;
};

export type BiometricAuth = {
  type: 'fingerprint' | 'face' | 'iris';
  available: boolean;
  enrolled: boolean;
  lastUsed: Date;
  successRate: number;
};

export type SensorData = {
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  location: { latitude: number; longitude: number; accuracy: number };
  timestamp: Date;
  deviceOrientation: 'portrait' | 'landscape' | 'face-up' | 'face-down';
  batteryLevel: number;
  networkType: string;
};


