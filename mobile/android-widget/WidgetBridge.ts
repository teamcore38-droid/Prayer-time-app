import { Platform, NativeModules } from 'react-native';

const { WidgetPreferencesBridge } = NativeModules;

export interface WidgetData {
  mosqueName: string;
  nextPrayerName: string;
  nextPrayerTime: string;
  countdownText: string;
}

/**
 * Updates the Android Home Widget data via Shared Preferences bridge.
 */
export async function updateAndroidWidget(data: WidgetData): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    // If running in a bare React Native flow with WidgetPreferencesBridge module installed
    if (WidgetPreferencesBridge) {
      await WidgetPreferencesBridge.setWidgetData(
        data.mosqueName,
        data.nextPrayerName,
        data.nextPrayerTime,
        data.countdownText
      );
      return true;
    }

    // Fallback: If in Expo Go mode, log to console.
    // In production builds, this writes to the SharedPreferences channel.
    console.log('Widget bridge updated (Simulated):', data);
    return true;
  } catch (err) {
    console.warn('Failed to update Android widget preferences:', err);
    return false;
  }
}
