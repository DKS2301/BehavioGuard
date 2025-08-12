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

    const snapshot: Record<string, number> = {
      // Motion features (6)
      accelMeanX: mean(ax), accelMeanY: mean(ay), accelMeanZ: mean(az),
      gyroMeanX: mean(gx), gyroMeanY: mean(gy), gyroMeanZ: mean(gz),
      
      // Motion variance features (6)
      accelVarX: variance(ax), accelVarY: variance(ay), accelVarZ: variance(az),
      gyroVarX: variance(gx), gyroVarY: variance(gy), gyroVarZ: variance(gz),
      
      // Motion correlation features (3)
      accelCorrXY: correlation(ax, ay), accelCorrXZ: correlation(ax, az), accelCorrYZ: correlation(ay, az),
      
      // Touch features (15)
      touchPressure: mean(touchPressure), touchDuration: mean(touchDuration), touchArea: mean(touchArea),
      touchVelocity: mean(touchPressure), touchAcceleration: mean(touchPressure),
      touchPressureVar: variance(touchPressure), touchDurationVar: variance(touchDuration), touchAreaVar: variance(touchArea),
      touchVelocityVar: variance(touchPressure), touchAccelerationVar: variance(touchPressure),
      touchPressureCorr: correlation(touchPressure, touchDuration), touchDurationCorr: correlation(touchDuration, touchArea), touchAreaCorr: correlation(touchArea, touchPressure),
      touchVelocityCorr: correlation(touchPressure, touchDuration), touchAccelerationCorr: correlation(touchDuration, touchArea),
      
      // Timing features (20)
      timeBetweenTouches: mean(timeBetweenTouches), timeBetweenScreens: 1000,
      timeInApp: 300000, timeSinceLastLogin: 86400000,
      timeOfDay: new Date().getHours(), dayOfWeek: new Date().getDay(), dayOfMonth: new Date().getDate(),
      timeBetweenTransactions: 3600000, timeToCompleteTransaction: 30000,
      timeToEnterPIN: 5000, timeToNavigate: 2000,
      timeBetweenPINAttempts: 10000, timeToBiometricAuth: 3000,
      timeToLoadScreen: 1500, timeToProcessRequest: 2000,
      timeInBackground: 0, timeToResume: 500,
      timeToConnect: 1000, timeToAuthenticate: 5000,
      
      // Location features (10)
      locationLat: mean(locationLat), locationLng: mean(locationLng), locationAccuracy: 10,
      locationSpeed: 0, locationAltitude: 100,
      locationDistance: 0, locationBearing: 0,
      locationLatVar: variance(locationLat), locationLngVar: variance(locationLng), locationConsistency: 0.8,
      
      // Device features (15)
      batteryLevel, batteryCharging: 0, batteryHealth: 0.9,
      networkType, networkStrength: 0.8, networkSpeed: 100,
      deviceOrientation, deviceBrightness: 0.7, deviceVolume: 0.6,
      deviceTemperature: 25, deviceMemory: 0.7, deviceStorage: 0.6,
      deviceUptime: 86400000, deviceLastRestart: 604800000, deviceModel: 1,
      
      // Behavioral features (25)
      screenTouches: touch.length, screenSwipes: 5, screenPinches: 2,
      keyboardStrokes: 20, navigationActions: 8, transactionCount: 3,
      loginAttempts: 1, failedLogins: 0, successfulLogins: 1,
      biometricAttempts: 1, biometricFailures: 0, biometricSuccesses: 1,
      appLaunches: 5, appCrashes: 0, appUpdates: 1,
      securityAlerts: 0, fraudAlerts: 0, riskScoreHistory: 0.2,
      locationChanges: location.length, timeZoneChanges: 0, languageChanges: 0,
      themeChanges: 0, notificationSettings: 1, privacySettings: 1,
      securitySettings: 1, appPermissions: 1,
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


