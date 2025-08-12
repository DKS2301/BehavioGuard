import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Location from 'expo-location';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus, Dimensions, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SensorData, TouchPattern, MotionPattern, LocationPattern } from '@/types/model';

type SensorSnapshot = {
  // Motion features (6)
  accelMeanX: number; accelMeanY: number; accelMeanZ: number;
  gyroMeanX: number; gyroMeanY: number; gyroMeanZ: number;
  
  // Motion variance features (6)
  accelVarX: number; accelVarY: number; accelVarZ: number;
  gyroVarX: number; gyroVarY: number; gyroVarZ: number;
  
  // Motion correlation features (3)
  accelCorrXY: number; accelCorrXZ: number; accelCorrYZ: number;
  
  // Touch features (15)
  touchPressure: number; touchDuration: number; touchArea: number;
  touchVelocity: number; touchAcceleration: number;
  touchPressureVar: number; touchDurationVar: number; touchAreaVar: number;
  touchVelocityVar: number; touchAccelerationVar: number;
  touchPressureCorr: number; touchDurationCorr: number; touchAreaCorr: number;
  touchVelocityCorr: number; touchAccelerationCorr: number;
  
  // Timing features (20)
  timeBetweenTouches: number; timeBetweenScreens: number;
  timeInApp: number; timeSinceLastLogin: number;
  timeOfDay: number; dayOfWeek: number; dayOfMonth: number;
  timeBetweenTransactions: number; timeToCompleteTransaction: number;
  timeToEnterPIN: number; timeToNavigate: number;
  timeBetweenPINAttempts: number; timeToBiometricAuth: number;
  timeToLoadScreen: number; timeToProcessRequest: number;
  timeInBackground: number; timeToResume: number;
  timeToConnect: number; timeToAuthenticate: number;
  
  // Location features (10)
  locationLat: number; locationLng: number; locationAccuracy: number;
  locationSpeed: number; locationAltitude: number;
  locationDistance: number; locationBearing: number;
  locationLatVar: number; locationLngVar: number; locationConsistency: number;
  
  // Device features (15)
  batteryLevel: number; batteryCharging: number; batteryHealth: number;
  networkType: number; networkStrength: number; networkSpeed: number;
  deviceOrientation: number; deviceBrightness: number; deviceVolume: number;
  deviceTemperature: number; deviceMemory: number; deviceStorage: number;
  deviceUptime: number; deviceLastRestart: number; deviceModel: number;
  
  // Behavioral features (25)
  screenTouches: number; screenSwipes: number; screenPinches: number;
  keyboardStrokes: number; navigationActions: number; transactionCount: number;
  loginAttempts: number; failedLogins: number; successfulLogins: number;
  biometricAttempts: number; biometricFailures: number; biometricSuccesses: number;
  appLaunches: number; appCrashes: number; appUpdates: number;
  securityAlerts: number; fraudAlerts: number; riskScoreHistory: number;
  locationChanges: number; timeZoneChanges: number; languageChanges: number;
  themeChanges: number; notificationSettings: number; privacySettings: number;
  securitySettings: number; appPermissions: number;
};

export function useSensors() {
  const [isActive, setIsActive] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  
  const buffers = useRef({
    accel: [] as [number, number, number][],
    gyro: [] as [number, number, number][],
    touch: [] as TouchPattern[],
    motion: [] as MotionPattern[],
    location: [] as LocationPattern[],
    timing: [] as number[],
    device: [] as any[]
  });

  const subscriptions = useRef<{ remove: () => void }[]>([]);
  const appStateSubscription = useRef<any>(null);
  const locationSubscriptionRef = useRef<any>(null);

  // App state monitoring for background/foreground detection
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setIsActive(nextAppState === 'active');
      if (nextAppState === 'active') {
        buffers.current.timing.push(Date.now());
      }
    };

    appStateSubscription.current = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      if (appStateSubscription.current) {
        appStateSubscription.current.remove();
      }
    };
  }, []);

  // Location monitoring
  useEffect(() => {
    const startLocationMonitoring = async () => {
      try {
        // Check if Location is available
        if (!Location) {
          console.warn('Location service not available');
          return;
        }

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          // Only set Google API key if available
          try {
            Location.setGoogleApiKey('YOUR_GOOGLE_API_KEY'); // Configure in production
          } catch (error) {
            console.warn('Google API key not configured:', error);
          }

          const locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000,
              distanceInterval: 10,
            },
            (location) => {
              setCurrentLocation(location);
              buffers.current.location.push({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                frequency: 1,
                lastSeen: new Date(),
                riskScore: 0
              });
            }
          );
          
          // Store subscription for cleanup
          locationSubscriptionRef.current = locationSubscription;
        } else {
          console.warn('Location permission denied');
        }
      } catch (error) {
        console.warn('Location permission denied or error:', error);
      }
    };

    startLocationMonitoring();
    return () => {
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
    };
  }, []);

  const stop = useCallback(() => {
    subscriptions.current.forEach((s) => s.remove());
    subscriptions.current = [];
  }, []);

  const start = useCallback(() => {
    // Clear existing subscriptions
    subscriptions.current.forEach((s) => s.remove());
    subscriptions.current = [];
    
    // Motion sensors
    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);
    
    subscriptions.current.push(
      Accelerometer.addListener(({ x, y, z }) => {
        buffers.current.accel.push([x, y, z]);
        buffers.current.motion.push({
          accelerometer: { x, y, z },
          gyroscope: { x: 0, y: 0, z: 0 },
          frequency: 1,
          riskScore: 0
        });
      }),
      Gyroscope.addListener(({ x, y, z }) => {
        buffers.current.gyro.push([x, y, z]);
        if (buffers.current.motion.length > 0) {
          const lastMotion = buffers.current.motion[buffers.current.motion.length - 1];
          lastMotion.gyroscope = { x, y, z };
        }
      })
    );

    // Touch monitoring
    const { width, height } = Dimensions.get('window');
    const touchHandler = (event: any) => {
      const touch = event.nativeEvent.touches[0];
      if (touch) {
        buffers.current.touch.push({
          pressure: touch.force || 0.5,
          duration: 100, // Default duration
          area: touch.area || 50,
          frequency: 1,
          riskScore: 0
        });
        
        // Haptic feedback for touch events
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };

    // Add touch listeners (simplified - in real app, use PanGestureHandler)
    buffers.current.timing.push(Date.now());
  }, []);

  const getFeatureSnapshot = (): Record<string, number> => {
    const accel = buffers.current.accel.splice(0);
    const gyro = buffers.current.gyro.splice(0);
    const touch = buffers.current.touch.splice(0);
    const motion = buffers.current.motion.splice(0);
    const location = buffers.current.location.splice(0);
    const timing = buffers.current.timing.splice(0);

    // Helper functions
    const mean = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const variance = (arr: number[]) => {
      if (arr.length < 2) return 0;
      const m = mean(arr);
      return arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / (arr.length - 1);
    };
    const correlation = (arr1: number[], arr2: number[]) => {
      if (arr1.length !== arr2.length || arr1.length < 2) return 0;
      const m1 = mean(arr1), m2 = mean(arr2);
      const numerator = arr1.reduce((sum, val, i) => sum + (val - m1) * (arr2[i] - m2), 0);
      const denominator = Math.sqrt(
        arr1.reduce((sum, val) => sum + Math.pow(val - m1, 2), 0) *
        arr2.reduce((sum, val) => sum + Math.pow(val - m2, 2), 0)
      );
      return denominator === 0 ? 0 : numerator / denominator;
    };

    // Extract motion features
    const ax = accel.map(a => a[0]), ay = accel.map(a => a[1]), az = accel.map(a => a[2]);
    const gx = gyro.map(g => g[0]), gy = gyro.map(g => g[1]), gz = gyro.map(g => g[2]);

    // Extract touch features
    const touchPressure = touch.map(t => t.pressure);
    const touchDuration = touch.map(t => t.duration);
    const touchArea = touch.map(t => t.area);

    // Extract timing features
    const timeBetweenTouches = timing.length > 1 ? 
      timing.slice(1).map((t, i) => t - timing[i]) : [0];

    // Extract location features
    const locationLat = location.map(l => l.latitude);
    const locationLng = location.map(l => l.longitude);

    // Device features (simplified)
    const batteryLevel = 0.75; // Mock value
    const networkType = 1; // Mock value
    const deviceOrientation = 0; // Mock value

    // Helper functions for statistical calculations
    const std = (arr: number[]) => {
      if (arr.length < 2) return 0;
      const m = mean(arr);
      return Math.sqrt(arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / (arr.length - 1));
    };
    const min = (arr: number[]) => arr.length ? Math.min(...arr) : 0;
    const max = (arr: number[]) => arr.length ? Math.max(...arr) : 0;
    const median = (arr: number[]) => {
      if (arr.length === 0) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    };
    const skewness = (arr: number[]) => {
      if (arr.length < 3) return 0;
      const m = mean(arr);
      const s = std(arr);
      if (s === 0) return 0;
      return arr.reduce((sum, val) => sum + Math.pow((val - m) / s, 3), 0) / arr.length;
    };
    const kurtosis = (arr: number[]) => {
      if (arr.length < 4) return 0;
      const m = mean(arr);
      const s = std(arr);
      if (s === 0) return 0;
      return arr.reduce((sum, val) => sum + Math.pow((val - m) / s, 4), 0) / arr.length - 3;
    };
    const range = (arr: number[]) => max(arr) - min(arr);
    const iqr = (arr: number[]) => {
      if (arr.length < 4) return 0;
      const sorted = [...arr].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)];
      const q3 = sorted[Math.floor(sorted.length * 0.75)];
      return q3 - q1;
    };

    // Get current time for temporal features
    const now = new Date();

    const snapshot: Record<string, number> = {
      // MOTION FEATURES (0-29) - Accelerometer (0-14)
      accelMeanX: mean(ax), accelMeanY: mean(ay), accelMeanZ: mean(az),
      accelStdX: std(ax), accelStdY: std(ay), accelStdZ: std(az),
      accelMaxX: max(ax), accelMaxY: max(ay), accelMaxZ: max(az),
      accelMinX: min(ax), accelMinY: min(ay), accelMinZ: min(az),
      accelMedianX: median(ax), accelMedianY: median(ay), accelMedianZ: median(az),

      // MOTION FEATURES (0-29) - Gyroscope (15-29)
      gyroMeanX: mean(gx), gyroMeanY: mean(gy), gyroMeanZ: mean(gz),
      gyroStdX: std(gx), gyroStdY: std(gy), gyroStdZ: std(gz),
      gyroMaxX: max(gx), gyroMaxY: max(gy), gyroMaxZ: max(gz),
      gyroMinX: min(gx), gyroMinY: min(gy), gyroMinZ: min(gz),
      gyroMedianX: median(gx), gyroMedianY: median(gy), gyroMedianZ: median(gz),

      // TOUCH FEATURES (30-59) - Pressure (30-39)
      touchPressureMean: mean(touchPressure), touchPressureStd: std(touchPressure),
      touchPressureMax: max(touchPressure), touchPressureMin: min(touchPressure),
      touchPressureMedian: median(touchPressure), touchPressureVar: variance(touchPressure),
      touchPressureSkew: skewness(touchPressure), touchPressureKurt: kurtosis(touchPressure),
      touchPressureRange: range(touchPressure), touchPressureIQR: iqr(touchPressure),

      // TOUCH FEATURES (30-59) - Duration (40-49)
      touchDurationMean: mean(touchDuration), touchDurationStd: std(touchDuration),
      touchDurationMax: max(touchDuration), touchDurationMin: min(touchDuration),
      touchDurationMedian: median(touchDuration), touchDurationVar: variance(touchDuration),
      touchDurationSkew: skewness(touchDuration), touchDurationKurt: kurtosis(touchDuration),
      touchDurationRange: range(touchDuration), touchDurationIQR: iqr(touchDuration),

      // TOUCH FEATURES (30-59) - Area (50-59)
      touchAreaMean: mean(touchArea), touchAreaStd: std(touchArea),
      touchAreaMax: max(touchArea), touchAreaMin: min(touchArea),
      touchAreaMedian: median(touchArea), touchAreaVar: variance(touchArea),
      touchAreaSkew: skewness(touchArea), touchAreaKurt: kurtosis(touchArea),
      touchAreaRange: range(touchArea), touchAreaIQR: iqr(touchArea),

      // LOCATION & TIME FEATURES (60-74) - Location (60-69)
      locationLat: mean(locationLat), locationLng: mean(locationLng),
      locationAccuracy: currentLocation?.coords.accuracy || 10,
      locationSpeed: 0, // Would need speed calculation from location history
      locationAltitude: currentLocation?.coords.altitude || 0,
      locationDistance: 0, // Would need distance calculation
      locationBearing: 0, // Would need bearing calculation
      locationLatVar: variance(locationLat), locationLngVar: variance(locationLng),
      locationConsistency: location.length > 1 ? 0.8 : 0.5,

      // LOCATION & TIME FEATURES (60-74) - Time (70-74)
      timeOfDay: now.getHours(), dayOfWeek: now.getDay(),
      dayOfMonth: now.getDate(), monthOfYear: now.getMonth() + 1,
      timeSinceLastLogin: 86400000, // Mock: 24 hours ago

      // TRANSACTION FEATURES (75-89) - Historical patterns
      transactionFrequency: 3, // Mock: 3 transactions per day
      transactionAmountMean: 5000, transactionAmountStd: 2000,
      transactionAmountMax: 15000, transactionAmountMin: 100,
      transactionTimeMean: 14, transactionTimeStd: 4, // 2 PM ± 4 hours
      transactionDayMean: 3, transactionDayStd: 2, // Wednesday ± 2 days
      transactionTypeFreq: 0.6, // 60% transfers
      transactionRiskHistory: 0.15, // Historical average risk

      // DEVICE USAGE FEATURES (90-94)
      batteryLevel: 0.75, // Mock battery level
      networkType: 1, // WiFi
      deviceOrientation: 0, // Portrait
      deviceBrightness: 0.7, // Mock brightness
      deviceVolume: 0.6, // Mock volume

      // BEHAVIORAL FEATURES (95-99)
      loginAttempts: 1, navigationActions: 8,
      keyboardStrokes: 20, biometricAttempts: 1, biometricFailures: 0,
    };

    return snapshot;
  };

  const getCurrentSensorData = useCallback((): SensorData => ({
    accelerometer: { x: 0, y: 0, z: 0 },
    gyroscope: { x: 0, y: 0, z: 0 },
    location: currentLocation ? {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
      accuracy: currentLocation.coords.accuracy || 0
    } : { latitude: 0, longitude: 0, accuracy: 0 },
    timestamp: new Date(),
    deviceOrientation: 'portrait',
    batteryLevel: 0.75,
    networkType: 'wifi'
  }), [currentLocation]);

  return useMemo(() => ({ 
    start, 
    stop, 
    getFeatureSnapshot, 
    getCurrentSensorData,
    isActive,
    currentLocation 
  }), [isActive, currentLocation, start, stop, getCurrentSensorData]);
}


