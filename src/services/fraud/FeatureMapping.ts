// Canonical ordering of the 100 sensor-derived features from useSensors.getFeatureSnapshot()
// This order is used to build the 100-length feature vector passed into the scaler.

export const SENSOR_FEATURE_ORDER: string[] = [
  // Motion means (6)
  'accelMeanX','accelMeanY','accelMeanZ','gyroMeanX','gyroMeanY','gyroMeanZ',
  // Motion variances (6)
  'accelVarX','accelVarY','accelVarZ','gyroVarX','gyroVarY','gyroVarZ',
  // Motion correlations (3)
  'accelCorrXY','accelCorrXZ','accelCorrYZ',
  // Touch (15)
  'touchPressure','touchDuration','touchArea',
  'touchVelocity','touchAcceleration',
  'touchPressureVar','touchDurationVar','touchAreaVar',
  'touchVelocityVar','touchAccelerationVar',
  'touchPressureCorr','touchDurationCorr','touchAreaCorr',
  'touchVelocityCorr','touchAccelerationCorr',
  // Timing (20)
  'timeBetweenTouches','timeBetweenScreens','timeInApp','timeSinceLastLogin',
  'timeOfDay','dayOfWeek','dayOfMonth','timeBetweenTransactions',
  'timeToCompleteTransaction','timeToEnterPIN','timeToNavigate',
  'timeBetweenPINAttempts','timeToBiometricAuth','timeToLoadScreen',
  'timeToProcessRequest','timeInBackground','timeToResume','timeToConnect',
  'timeToAuthenticate',
  // Location (10)
  'locationLat','locationLng','locationAccuracy','locationSpeed','locationAltitude',
  'locationDistance','locationBearing','locationLatVar','locationLngVar','locationConsistency',
  // Device (15)
  'batteryLevel','batteryCharging','batteryHealth','networkType','networkStrength','networkSpeed',
  'deviceOrientation','deviceBrightness','deviceVolume','deviceTemperature','deviceMemory','deviceStorage',
  'deviceUptime','deviceLastRestart','deviceModel',
  // Behavioral (25)
  'screenTouches','screenSwipes','screenPinches','keyboardStrokes','navigationActions','transactionCount',
  'loginAttempts','failedLogins','successfulLogins','biometricAttempts','biometricFailures','biometricSuccesses',
  'appLaunches','appCrashes','appUpdates','securityAlerts','fraudAlerts','riskScoreHistory',
  'locationChanges','timeZoneChanges','languageChanges','themeChanges','notificationSettings','privacySettings',
  'securitySettings','appPermissions'
];


