export interface LocationAccuracyConfig {
  desiredAccuracy: number; // in meters
  acceptableAccuracy: number; // in meters
  timeout: number; // in milliseconds
}

export const DEFAULT_LOCATION_CONFIG: LocationAccuracyConfig = {
  desiredAccuracy: 10, // 10 meters
  acceptableAccuracy: 100, // 100 meters (adjust based on your needs)
  timeout: 10000, // 10 seconds
};

export const isLocationAccurate = (accuracy: number, acceptableAccuracy: number = 100): boolean => {
  return accuracy <= acceptableAccuracy;
};

export const formatAccuracyWarning = (accuracy: number): string => {
  return `Inaccurate location skipped: ${Math.round(accuracy)}m`;
};
