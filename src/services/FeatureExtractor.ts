import { SensorData, Transaction } from '@/types/model';

/**
 * EXACT 100-FEATURE EXTRACTION PIPELINE
 * 
 * Based on your training specification:
 * - Features 0-29: Device Motion (accelerometer x/y/z mean/std/max/min/median, gyroscope patterns)
 * - Features 30-59: Touch Patterns (pressure, duration, tap speed, swipe velocity, touch area)
 * - Features 60-74: Location & Time (consistency scores, geographic patterns, temporal patterns)
 * - Features 75-89: Transaction Features (amount patterns, frequency, type patterns)
 * - Features 90-94: Device Usage (app patterns, battery, network usage)
 * - Features 95-99: Behavioral Features (login patterns, navigation, typing rhythm)
 */
export class FeatureExtractor {
  static extractBehavioralFeatures(
    sensorSnapshot: Record<string, number>,
    sensorData: SensorData,
    transaction?: Partial<Transaction>
  ): number[] {
    const features = new Array<number>(100).fill(0);

    // Helper function to safely get values
    const getValue = (key: string, defaultValue: number = 0): number => {
      const value = sensorSnapshot[key];
      return Number.isFinite(value) ? value : defaultValue;
    };

    // FEATURES 0-29: DEVICE MOTION (30 features)
    // Accelerometer features (0-14)
    features[0] = getValue('accelMeanX');           // Accelerometer X mean
    features[1] = getValue('accelMeanY');           // Accelerometer Y mean  
    features[2] = getValue('accelMeanZ');           // Accelerometer Z mean
    features[3] = getValue('accelStdX');            // Accelerometer X standard deviation
    features[4] = getValue('accelStdY');            // Accelerometer Y standard deviation
    features[5] = getValue('accelStdZ');            // Accelerometer Z standard deviation
    features[6] = getValue('accelMaxX');            // Accelerometer X maximum
    features[7] = getValue('accelMaxY');            // Accelerometer Y maximum
    features[8] = getValue('accelMaxZ');            // Accelerometer Z maximum
    features[9] = getValue('accelMinX');            // Accelerometer X minimum
    features[10] = getValue('accelMinY');           // Accelerometer Y minimum
    features[11] = getValue('accelMinZ');           // Accelerometer Z minimum
    features[12] = getValue('accelMedianX');        // Accelerometer X median
    features[13] = getValue('accelMedianY');        // Accelerometer Y median
    features[14] = getValue('accelMedianZ');        // Accelerometer Z median

    // Gyroscope features (15-29)
    features[15] = getValue('gyroMeanX');           // Gyroscope X mean
    features[16] = getValue('gyroMeanY');           // Gyroscope Y mean
    features[17] = getValue('gyroMeanZ');           // Gyroscope Z mean
    features[18] = getValue('gyroStdX');            // Gyroscope X standard deviation
    features[19] = getValue('gyroStdY');            // Gyroscope Y standard deviation
    features[20] = getValue('gyroStdZ');            // Gyroscope Z standard deviation
    features[21] = getValue('gyroMaxX');            // Gyroscope X maximum
    features[22] = getValue('gyroMaxY');            // Gyroscope Y maximum
    features[23] = getValue('gyroMaxZ');            // Gyroscope Z maximum
    features[24] = getValue('gyroMinX');            // Gyroscope X minimum
    features[25] = getValue('gyroMinY');            // Gyroscope Y minimum
    features[26] = getValue('gyroMinZ');            // Gyroscope Z minimum
    features[27] = getValue('gyroMedianX');         // Gyroscope X median
    features[28] = getValue('gyroMedianY');         // Gyroscope Y median
    features[29] = getValue('gyroMedianZ');         // Gyroscope Z median

    // FEATURES 30-59: TOUCH PATTERNS (30 features)
    // Touch pressure features (30-39)
    features[30] = getValue('touchPressureMean');   // Touch pressure mean
    features[31] = getValue('touchPressureStd');    // Touch pressure standard deviation
    features[32] = getValue('touchPressureMax');    // Touch pressure maximum
    features[33] = getValue('touchPressureMin');    // Touch pressure minimum
    features[34] = getValue('touchPressureMedian'); // Touch pressure median
    features[35] = getValue('touchPressureVar');    // Touch pressure variance
    features[36] = getValue('touchPressureSkew');   // Touch pressure skewness
    features[37] = getValue('touchPressureKurt');   // Touch pressure kurtosis
    features[38] = getValue('touchPressureRange');  // Touch pressure range
    features[39] = getValue('touchPressureIQR');    // Touch pressure interquartile range

    // Touch duration features (40-49)
    features[40] = getValue('touchDurationMean');   // Touch duration mean
    features[41] = getValue('touchDurationStd');    // Touch duration standard deviation
    features[42] = getValue('touchDurationMax');    // Touch duration maximum
    features[43] = getValue('touchDurationMin');    // Touch duration minimum
    features[44] = getValue('touchDurationMedian'); // Touch duration median
    features[45] = getValue('touchDurationVar');    // Touch duration variance
    features[46] = getValue('touchDurationSkew');   // Touch duration skewness
    features[47] = getValue('touchDurationKurt');   // Touch duration kurtosis
    features[48] = getValue('touchDurationRange');  // Touch duration range
    features[49] = getValue('touchDurationIQR');    // Touch duration interquartile range

    // Touch area features (50-59)
    features[50] = getValue('touchAreaMean');       // Touch area mean
    features[51] = getValue('touchAreaStd');        // Touch area standard deviation
    features[52] = getValue('touchAreaMax');        // Touch area maximum
    features[53] = getValue('touchAreaMin');        // Touch area minimum
    features[54] = getValue('touchAreaMedian');     // Touch area median
    features[55] = getValue('touchAreaVar');        // Touch area variance
    features[56] = getValue('touchAreaSkew');       // Touch area skewness
    features[57] = getValue('touchAreaKurt');       // Touch area kurtosis
    features[58] = getValue('touchAreaRange');      // Touch area range
    features[59] = getValue('touchAreaIQR');        // Touch area interquartile range

    // FEATURES 60-74: LOCATION & TIME (15 features)
    // Location features (60-69)
    features[60] = getValue('locationLat');         // Current latitude
    features[61] = getValue('locationLng');         // Current longitude
    features[62] = getValue('locationAccuracy');    // Location accuracy
    features[63] = getValue('locationSpeed');       // Movement speed
    features[64] = getValue('locationAltitude');    // Altitude
    features[65] = getValue('locationDistance');    // Distance from last location
    features[66] = getValue('locationBearing');     // Movement bearing
    features[67] = getValue('locationLatVar');      // Latitude variance
    features[68] = getValue('locationLngVar');      // Longitude variance
    features[69] = getValue('locationConsistency'); // Location consistency score

    // Time features (70-74)
    features[70] = getValue('timeOfDay');           // Hour of day (0-23)
    features[71] = getValue('dayOfWeek');           // Day of week (0-6)
    features[72] = getValue('dayOfMonth');          // Day of month (1-31)
    features[73] = getValue('monthOfYear');         // Month of year (1-12)
    features[74] = getValue('timeSinceLastLogin');  // Time since last login (seconds)

    // FEATURES 75-89: TRANSACTION FEATURES (15 features)
    const amount = Number(transaction?.amount ?? 0);
    const typeCode = this.transactionTypeToCode(transaction?.type);
    const statusCode = this.transactionStatusToCode(transaction?.status);
    
    features[75] = amount;                          // Transaction amount
    features[76] = amount > 0 ? Math.log10(1 + Math.abs(amount)) : 0; // Log amount
    features[77] = typeCode;                        // Transaction type code
    features[78] = statusCode;                      // Transaction status code
    features[79] = getValue('transactionFrequency'); // Transactions per day
    features[80] = getValue('transactionAmountMean'); // Mean transaction amount
    features[81] = getValue('transactionAmountStd');  // Std transaction amount
    features[82] = getValue('transactionAmountMax');  // Max transaction amount
    features[83] = getValue('transactionAmountMin');  // Min transaction amount
    features[84] = getValue('transactionTimeMean');   // Mean transaction time (hour)
    features[85] = getValue('transactionTimeStd');    // Std transaction time (hour)
    features[86] = getValue('transactionDayMean');    // Mean transaction day
    features[87] = getValue('transactionDayStd');     // Std transaction day
    features[88] = getValue('transactionTypeFreq');   // Transaction type frequency
    features[89] = getValue('transactionRiskHistory'); // Historical risk score

    // FEATURES 90-94: DEVICE USAGE (5 features)
    features[90] = getValue('batteryLevel');        // Battery level (0-1)
    features[91] = getValue('networkType');         // Network type code
    features[92] = getValue('deviceOrientation');   // Device orientation code
    features[93] = getValue('deviceBrightness');    // Screen brightness (0-1)
    features[94] = getValue('deviceVolume');        // Device volume (0-1)

    // FEATURES 95-99: BEHAVIORAL FEATURES (5 features)
    features[95] = getValue('loginAttempts');       // Login attempts count
    features[96] = getValue('navigationActions');   // Navigation actions count
    features[97] = getValue('keyboardStrokes');     // Keyboard strokes count
    features[98] = getValue('biometricAttempts');   // Biometric attempts count
    features[99] = getValue('biometricFailures');   // Biometric failures count

    return features;
  }

  private static transactionTypeToCode(type?: string): number {
    switch (type) {
      case 'transfer': return 1;
      case 'payment': return 2;
      case 'deposit': return 3;
      case 'withdrawal': return 4;
      default: return 0;
    }
  }

  private static transactionStatusToCode(status?: string): number {
    switch (status) {
      case 'completed': return 1;
      case 'pending': return 2;
      case 'failed': return 3;
      case 'blocked': return 4;
      default: return 0;
    }
  }

  // Get feature name by index for debugging
  static getFeatureName(index: number): string {
    const featureNames = [
      // Motion features (0-29)
      'accelMeanX', 'accelMeanY', 'accelMeanZ', 'accelStdX', 'accelStdY', 'accelStdZ',
      'accelMaxX', 'accelMaxY', 'accelMaxZ', 'accelMinX', 'accelMinY', 'accelMinZ',
      'accelMedianX', 'accelMedianY', 'accelMedianZ',
      'gyroMeanX', 'gyroMeanY', 'gyroMeanZ', 'gyroStdX', 'gyroStdY', 'gyroStdZ',
      'gyroMaxX', 'gyroMaxY', 'gyroMaxZ', 'gyroMinX', 'gyroMinY', 'gyroMinZ',
      'gyroMedianX', 'gyroMedianY', 'gyroMedianZ',
      
      // Touch features (30-59)
      'touchPressureMean', 'touchPressureStd', 'touchPressureMax', 'touchPressureMin', 'touchPressureMedian',
      'touchPressureVar', 'touchPressureSkew', 'touchPressureKurt', 'touchPressureRange', 'touchPressureIQR',
      'touchDurationMean', 'touchDurationStd', 'touchDurationMax', 'touchDurationMin', 'touchDurationMedian',
      'touchDurationVar', 'touchDurationSkew', 'touchDurationKurt', 'touchDurationRange', 'touchDurationIQR',
      'touchAreaMean', 'touchAreaStd', 'touchAreaMax', 'touchAreaMin', 'touchAreaMedian',
      'touchAreaVar', 'touchAreaSkew', 'touchAreaKurt', 'touchAreaRange', 'touchAreaIQR',
      
      // Location & Time features (60-74)
      'locationLat', 'locationLng', 'locationAccuracy', 'locationSpeed', 'locationAltitude',
      'locationDistance', 'locationBearing', 'locationLatVar', 'locationLngVar', 'locationConsistency',
      'timeOfDay', 'dayOfWeek', 'dayOfMonth', 'monthOfYear', 'timeSinceLastLogin',
      
      // Transaction features (75-89)
      'transactionAmount', 'transactionAmountLog', 'transactionType', 'transactionStatus', 'transactionFrequency',
      'transactionAmountMean', 'transactionAmountStd', 'transactionAmountMax', 'transactionAmountMin',
      'transactionTimeMean', 'transactionTimeStd', 'transactionDayMean', 'transactionDayStd',
      'transactionTypeFreq', 'transactionRiskHistory',
      
      // Device Usage features (90-94)
      'batteryLevel', 'networkType', 'deviceOrientation', 'deviceBrightness', 'deviceVolume',
      
      // Behavioral features (95-99)
      'loginAttempts', 'navigationActions', 'keyboardStrokes', 'biometricAttempts', 'biometricFailures'
    ];
    
    return featureNames[index] || `unknown_${index}`;
  }
}

function txTypeToCode(type: Transaction['type'] | undefined): number {
  switch (type) {
    case 'transfer': return 1;
    case 'payment': return 2;
    case 'deposit': return 3;
    case 'withdrawal': return 4;
    default: return 0;
  }
}

function txStatusToCode(status: Transaction['status'] | undefined): number {
  switch (status) {
    case 'pending': return 1;
    case 'completed': return 2;
    case 'failed': return 3;
    case 'blocked': return 4;
    default: return 0;
  }
}

function networkTypeToCode(type: string | undefined): number {
  switch (type) {
    case 'wifi': return 1;
    case 'cellular': return 2;
    case 'ethernet': return 3;
    case 'none': return 4;
    default: return 0;
  }
}

function orientationToCode(o: SensorData['deviceOrientation'] | undefined): number {
  switch (o) {
    case 'portrait': return 1;
    case 'landscape': return 2;
    case 'face-up': return 3;
    case 'face-down': return 4;
    default: return 0;
  }
}


