# Android Home Screen Widget Integration Guide

This guide details how to bundle the Kotlin and XML layout files into the Android project compiled by Expo.

---

## 1. Native File Allocation

During the Expo prebuild step (which converts your React Native code into a native `/android` folder), the native files should be placed in the following directories:

1. **Kotlin Source File**:
   - Save [PrayerWidget.kt](file:///d:/prayer%20time%20app/mobile/android-widget/PrayerWidget.kt) to:
     `android/app/src/main/java/com/masjidconnect/widgets/PrayerWidget.kt`

2. **Widget Layout File**:
   - Save [prayer_widget.xml](file:///d:/prayer%20time%20app/mobile/android-widget/prayer_widget.xml) to:
     `android/app/src/main/res/layout/prayer_widget.xml`

3. **Background Vector File**:
   - Create a background drawable with rounded corners at:
     `android/app/src/main/res/drawable/widget_background.xml`
     ```xml
     <?xml version="1.0" encoding="utf-8"?>
     <shape xmlns:android="http://schemas.android.com/apk/res/android">
         <solid android:color="#064e3b" /> <!-- Emerald Green Background -->
         <corners android:radius="20dp" />
     </shape>
     ```

4. **Widget Metadata File**:
   - Create `android/app/src/main/res/xml/prayer_widget_info.xml`:
     ```xml
     <?xml version="1.0" encoding="utf-8"?>
     <appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
         android:minWidth="110dp"
         android:minHeight="110dp"
         android:updatePeriodMillis="86400000"
         android:initialLayout="@layout/prayer_widget"
         android:resizeMode="horizontal|vertical"
         android:widgetCategory="home_screen">
     </appwidget-provider>
     ```

---

## 2. Android Manifest Registration

Add the AppWidget receiver declaration inside the `<application>` tag of your `android/app/src/main/AndroidManifest.xml`:

```xml
<receiver android:name="com.masjidconnect.widgets.PrayerWidget"
    android:exported="true">
    <intent-filter>
        <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
    </intent-filter>
    <meta-data
        android:name="android.appwidget.provider"
        android:resource="@xml/prayer_widget_info" />
</receiver>
```

---

## 3. Automation using Expo Config Plugins

To avoid manually editing the `/android` folder (since Expo can recreate it on clean builds), you can write a simple Config Plugin in your root `app.json` or build custom scripts using `expo-build-properties` or standard native directories copying.

The JS bridge uses standard Android SharedPreferences:
- Preference Name: `MasjidConnectWidgetPrefs`
- Keys written: `mosqueName`, `nextPrayerName`, `nextPrayerTime`, `countdownText`

When these preferences update from the JS thread, the widget pulls them instantly.
