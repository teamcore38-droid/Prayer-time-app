package com.masjidconnect.widgets

import android.app.PendingIntent
import android.app.admin.DevicePolicyManager
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.widget.RemoteViews
import com.masjidconnect.R

/**
 * Android Home Screen Widget for Masjid Connect.
 * Displays current followed mosque, next prayer name, and iqamah countdown time.
 */
class PrayerWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        // Perform updates for each active widget instance
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    companion object {
        private const val PREFS_NAME = "MasjidConnectWidgetPrefs"
        private const val KEY_MOSQUE_NAME = "mosqueName"
        private const val KEY_NEXT_PRAYER = "nextPrayerName"
        private const val KEY_PRAYER_TIME = "nextPrayerTime"
        private const val KEY_COUNTDOWN = "countdownText"

        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            // Read values cached in Shared Preferences written by the React Native app
            const val DEFAULT_VAL = "Loading..."
            val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val mosqueName = prefs.getString(KEY_MOSQUE_NAME, "No Mosque Selected")
            val nextPrayer = prefs.getString(KEY_NEXT_PRAYER, "Next Salah")
            val prayerTime = prefs.getString(KEY_PRAYER_TIME, "--:--")
            val countdown = prefs.getString(KEY_COUNTDOWN, "00:00:00")

            // Construct RemoteViews object pointing to the layout XML
            val views = RemoteViews(context.packageName, R.layout.prayer_widget)
            views.setTextViewText(R.id.widget_mosque_name, mosqueName)
            views.setTextViewText(R.id.widget_next_prayer_title, "$nextPrayer Adhan")
            views.setTextViewText(R.id.widget_prayer_time, prayerTime)
            views.setTextViewText(R.id.widget_countdown_timer, countdown)

            // Setup click intent to launch the main app on press
            val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            val pendingIntent = PendingIntent.getActivity(
                context, 
                0, 
                intent, 
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_container, pendingIntent)

            // Direct AppWidgetManager to update the widget
            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
