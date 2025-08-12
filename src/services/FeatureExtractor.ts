import { SensorData, Transaction } from '@/types/model';

/**
 * Builds the exact 100-length raw feature vector in the specified order:
 *  - 0–29: Motion
 *  - 30–59: Touch
 *  - 60–74: Location & Time
 *  - 75–89: Transaction
 *  - 90–94: Device Usage
 *  - 95–99: Behavioral
 *
 * Inputs are sourced from the sensor snapshot generator in `useSensors` and from
 * the currently evaluated transaction context.
 *
 * NOTE: Replace or refine the mapping below to match the exact ordering used in training.
 * This implementation is deterministic and complete (100 values) and can be adjusted
 * to mirror your precise training pipeline names/order.
 */
export class FeatureExtractor {
  static extractBehavioralFeatures(
    sensorSnapshot: Record<string, number>,
    sensorData: SensorData,
    transaction?: Partial<Transaction>
  ): number[] {
    const features = new Array<number>(100).fill(0);

    // Helper fetch with default 0
    const v = (key: string): number => (Number.isFinite(sensorSnapshot[key]) ? (sensorSnapshot[key] as number) : 0);

    // 0–29 Motion (30)
    const motion: number[] = [
      // Means (6)
      v('accelMeanX'), v('accelMeanY'), v('accelMeanZ'),
      v('gyroMeanX'), v('gyroMeanY'), v('gyroMeanZ'),
      // Variances (6)
      v('accelVarX'), v('accelVarY'), v('accelVarZ'),
      v('gyroVarX'), v('gyroVarY'), v('gyroVarZ'),
      // Correlations (3)
      v('accelCorrXY'), v('accelCorrXZ'), v('accelCorrYZ'),
    ];
    // Derived motion (fill up to 30)
    const accelMeanMag = Math.sqrt(Math.max(0, v('accelMeanX') ** 2 + v('accelMeanY') ** 2 + v('accelMeanZ') ** 2));
    const gyroMeanMag = Math.sqrt(Math.max(0, v('gyroMeanX') ** 2 + v('gyroMeanY') ** 2 + v('gyroMeanZ') ** 2));
    const accelVarSum = v('accelVarX') + v('accelVarY') + v('accelVarZ');
    const gyroVarSum = v('gyroVarX') + v('gyroVarY') + v('gyroVarZ');
    const corrSum = v('accelCorrXY') + v('accelCorrXZ') + v('accelCorrYZ');
    const motionDerived = [accelMeanMag, gyroMeanMag, accelVarSum, gyroVarSum, corrSum];
    while (motion.length + motionDerived.length < 30) motionDerived.push(0);
    motion.push(...motionDerived.slice(0, 30 - motion.length));

    // 30–59 Touch (30)
    const touch: number[] = [
      v('touchPressure'), v('touchDuration'), v('touchArea'),
      v('touchVelocity'), v('touchAcceleration'),
      v('touchPressureVar'), v('touchDurationVar'), v('touchAreaVar'),
      v('touchVelocityVar'), v('touchAccelerationVar'),
      v('touchPressureCorr'), v('touchDurationCorr'), v('touchAreaCorr'),
      v('touchVelocityCorr'), v('touchAccelerationCorr'),
    ];
    // Derived touch to fill 15 more
    const touchDerived = [
      touch[0] - touch[5], // pressure - var
      touch[1] - touch[6], // duration - var
      touch[2] - touch[7], // area - var
      touch[3] - touch[8], // velocity - var
      touch[4] - touch[9], // acceleration - var
      (touch[10] + touch[11] + touch[12]) / 3, // avg corr
      (touch[13] + touch[14]) / 2, // avg corr extra
    ];
    while (touch.length + touchDerived.length < 30) touchDerived.push(0);
    touch.push(...touchDerived.slice(0, 30 - touch.length));

    // 60–74 Location & Time (15)
    const locTime: number[] = [
      v('locationLat'), v('locationLng'), v('locationAccuracy'),
      v('locationSpeed'), v('locationAltitude'), v('locationDistance'), v('locationBearing'),
      v('locationLatVar'), v('locationLngVar'), v('locationConsistency'),
      v('timeBetweenTouches'), v('timeBetweenScreens'), v('timeInApp'),
      v('timeOfDay'), v('dayOfWeek'),
    ];
    locTime.length = 15; // ensure exact length (truncate if needed)

    // 75–89 Transaction (15)
    const amount = Number(transaction?.amount ?? 0);
    const typeCode = txTypeToCode(transaction?.type);
    const statusCode = txStatusToCode(transaction?.status);
    const txExtra = [
      amount,
      amount > 0 ? Math.log10(1 + Math.abs(amount)) : 0,
      typeCode,
      statusCode,
      // rudimentary temporal context
      sensorData.timestamp ? new Date(sensorData.timestamp).getHours() : 0,
      sensorData.timestamp ? new Date(sensorData.timestamp).getDay() : 0,
      // placeholders for frequency/pattern features; replace with your own counts
      0, 0, 0, 0, 0, 0, 0, 0, 0,
    ];
    txExtra.length = 15;

    // 90–94 Device Usage (5)
    const deviceUsage: number[] = [
      sensorData.batteryLevel ?? 0,
      networkTypeToCode(sensorData.networkType),
      orientationToCode(sensorData.deviceOrientation),
      v('deviceBrightness'),
      v('deviceVolume'),
    ];

    // 95–99 Behavioral (5)
    const behavioral: number[] = [
      v('loginAttempts'),
      v('navigationActions'),
      v('keyboardStrokes'),
      v('biometricAttempts'),
      v('biometricFailures'),
    ];

    // Assemble all sections
    const assembled = [...motion, ...touch, ...locTime, ...txExtra, ...deviceUsage, ...behavioral];
    // Guarantee length 100
    if (assembled.length !== 100) {
      if (assembled.length > 100) return assembled.slice(0, 100);
      return [...assembled, ...new Array(100 - assembled.length).fill(0)];
    }
    return assembled;
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


