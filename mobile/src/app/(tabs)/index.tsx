import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  useColorScheme
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHijriDate, getNextPrayer, formatTimeRemaining, NextPrayerInfo } from '@/utils/prayerHelpers';
import { Clock, MapPin, Sparkles, BookOpen, AlertCircle, ChevronRight } from 'lucide-react-native';

interface TimePair {
  adhan: string;
  iqamah: string;
}

interface Timetable {
  sunrise: string;
  fajr: TimePair;
  dhuhr: TimePair;
  asr: TimePair;
  maghrib: TimePair;
  isha: TimePair;
}

interface Mosque {
  _id: string;
  mosqueName: string;
  city: string;
  jumuahSessions: Array<{ sessionNumber: number; khutbah: string; iqamah: string }>;
}

const DEFAULT_MOSQUE: Mosque = {
  _id: '6a316567b9dfbc429c7ccc0b',
  mosqueName: 'Colombo Grand Mosque',
  city: 'Colombo',
  jumuahSessions: [
    { sessionNumber: 1, khutbah: '12:15 PM', iqamah: '12:30 PM' },
    { sessionNumber: 2, khutbah: '01:15 PM', iqamah: '01:30 PM' }
  ]
};

const DEFAULT_TIMETABLE: Timetable = {
  sunrise: '05:54',
  fajr: { adhan: '04:45', iqamah: '04:55' },
  dhuhr: { adhan: '12:15', iqamah: '12:25' },
  asr: { adhan: '15:45', iqamah: '15:55' },
  maghrib: { adhan: '18:30', iqamah: '18:40' },
  isha: { adhan: '19:45', iqamah: '19:55' }
};

export default function HomeDashboard() {
  const router = useRouter();
  const { followedMosqueId, apiUrl, isAuthenticated, user } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [mosque, setMosque] = useState<Mosque | null>(DEFAULT_MOSQUE);
  const [timetable, setTimetable] = useState<Timetable | null>(DEFAULT_TIMETABLE);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date constants
  const [hijriDate, setHijriDate] = useState('');
  const [gregorianDate, setGregorianDate] = useState('');

  // Fetch mosque info and prayer times
  const loadData = async () => {
    // 1. Load instantly from cache
    try {
      const cachedMosque = await AsyncStorage.getItem('cache_mosque');
      const cachedTimetable = await AsyncStorage.getItem('cache_timetable');
      if (cachedMosque) setMosque(JSON.parse(cachedMosque));
      if (cachedTimetable) setTimetable(JSON.parse(cachedTimetable));
    } catch (e) {
      console.log('Failed to read cache', e);
    }

    if (!followedMosqueId) {
      setLoading(false);
      return;
    }

    // 2. Fetch in background with network timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout

      setError('');
      // Fetch mosque details
      const mosqueRes = await fetch(`${apiUrl}/api/mosques/${followedMosqueId}`, { signal: controller.signal });
      if (mosqueRes.ok) {
        const mosqueData = await mosqueRes.json();
        setMosque(mosqueData);
        await AsyncStorage.setItem('cache_mosque', JSON.stringify(mosqueData));
      }

      // Fetch today's prayer times
      const todayStr = new Date().toISOString().split('T')[0];
      const prayerRes = await fetch(`${apiUrl}/api/prayers?mosqueId=${followedMosqueId}&date=${todayStr}`, { signal: controller.signal });
      if (prayerRes.ok) {
        const prayerData = await prayerRes.json();
        if (prayerData && prayerData.length > 0) {
          setTimetable(prayerData[0]);
          await AsyncStorage.setItem('cache_timetable', JSON.stringify(prayerData[0]));
        }
      }
      clearTimeout(timeoutId);
    } catch (err: any) {
      console.log('Fetch failed, using cached data:', err.message);
      if (!timetable) {
        setError('Connection offline. Showing cached times.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [followedMosqueId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      setHijriDate(getHijriDate());
      setGregorianDate(new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
    }, [followedMosqueId])
  );

  // Live Countdown logic
  useEffect(() => {
    if (!timetable) return;

    // Run immediately
    const updateCountdown = () => {
      const info = getNextPrayer(timetable);
      setNextPrayer(info);
    };
    updateCountdown();

    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [timetable]);

  // Theme-aware styles
  const colors = {
    bg: isDark ? '#090f0d' : '#f4f7f6',
    cardBg: isDark ? '#101a17' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    primary: isDark ? '#10b981' : '#064e3b',
    accent: isDark ? '#fbbf24' : '#d97706',
    border: isDark ? '#1b2c27' : '#e8eded',
    divider: isDark ? '#1b2c27' : '#eef2f1',
    highlight: isDark ? '#0c2c22' : '#e7f6ef',
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <View style={styles.spinner} />
      </View>
    );
  }

  // Case: User hasn't chosen any mosque
  if (!followedMosqueId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.emptyContainer}>
          <BookOpen size={48} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Welcome to Masjid Connect</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Follow a mosque in your community to view local prayer times, iqamah schedules, and center announcements.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/settings')}
          >
            <Text style={styles.btnText}>Find a Mosque</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Open Header — no surrounding box, sits directly on the page */}
        {mosque && (
          <TouchableOpacity
            style={styles.header}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/mosque-info' })}
          >
            <View style={styles.headerInfo}>
              <View style={styles.mosqueBadge}>
                <MapPin size={15} color={colors.primary} />
                <Text style={[styles.mosqueLabel, { color: colors.primary }]}>{mosque.city}</Text>
              </View>
              <Text style={[styles.mosqueName, { color: colors.text }]}>{mosque.mosqueName}</Text>
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>{gregorianDate}</Text>
              <Text style={[styles.hijriText, { color: colors.accent }]}>{hijriDate}</Text>
            </View>
            <ChevronRight size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Live Countdown — the single hero card */}
        {nextPrayer ? (
          <View style={[styles.countdownCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.countdownTitle}>NEXT PRAYER</Text>
            <Text style={styles.countdownName}>
              {nextPrayer.name} {nextPrayer.type}
            </Text>
            <Text style={styles.countdownTimer}>
              {formatTimeRemaining(nextPrayer.secondsRemaining)}
            </Text>
            <View style={styles.countdownDetails}>
              <Clock size={13} color="#ffffff" />
              <Text style={styles.countdownDetailText}>
                Scheduled at {nextPrayer.time}
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.errorCard, { borderColor: colors.border, backgroundColor: colors.cardBg }]}>
            <AlertCircle size={20} color={colors.accent} />
            <Text style={[styles.errorText, { color: colors.text }]}>
              {error || 'No timetable records found for today. Admin update required.'}
            </Text>
          </View>
        )}

        {/* Admin Edit Button */}
        {isAuthenticated && (user?.role === 'mosque_admin' || user?.role === 'super_admin') && (
          <TouchableOpacity
            style={[styles.adminEditCard, { borderColor: colors.primary }]}
            onPress={() => router.push('/edit-prayers')}
          >
            <Sparkles size={16} color={colors.primary} />
            <Text style={[styles.adminEditText, { color: colors.primary }]}>
              Imam Console: Edit Times
            </Text>
          </TouchableOpacity>
        )}

        {/* Timetable — one card, flat full-width rows divided by thin lines */}
        {timetable && (
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Clock size={17} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Today&apos;s Prayer Times</Text>
            </View>

            <View style={styles.timetableHeaders}>
              <Text style={[styles.colName, styles.headerLabel, { color: colors.textSecondary }]}>Salah</Text>
              <Text style={[styles.colTime, styles.headerLabel, { color: colors.textSecondary }]}>Adhan</Text>
              <Text style={[styles.colTime, styles.headerLabel, { color: colors.textSecondary }]}>Iqamah</Text>
            </View>

            {/* Timetable Rows */}
            {[
              { name: 'Fajr', times: timetable.fajr },
              { name: 'Dhuhr', times: timetable.dhuhr },
              { name: 'Asr', times: timetable.asr },
              { name: 'Maghrib', times: timetable.maghrib },
              { name: 'Isha', times: timetable.isha }
            ].map((prayer, index, arr) => {
              const isNext = nextPrayer?.name === prayer.name;
              const isLast = index === arr.length - 1;
              return (
                <View
                  key={prayer.name}
                  style={[
                    styles.tableRow,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.divider },
                    isNext && [styles.rowHighlight, { backgroundColor: colors.highlight }]
                  ]}
                >
                  <Text style={[styles.colName, styles.prayerName, { color: colors.text }]}>
                    {prayer.name}
                    {isNext && <Text style={[styles.nextTag, { color: colors.primary }]}>  • Next</Text>}
                  </Text>
                  <Text style={[styles.colTime, styles.cellText, { color: colors.textSecondary }]}>
                    {prayer.times.adhan}
                  </Text>
                  <Text style={[styles.colTime, styles.iqamahTime, { color: colors.primary }]}>
                    {prayer.times.iqamah}
                  </Text>
                </View>
              );
            })}

            <View style={styles.sunriseRow}>
              <Text style={[styles.sunriseText, { color: colors.textSecondary }]}>
                Sunrise <Text style={{ color: colors.text, fontWeight: '700' }}>{timetable.sunrise}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Friday Jumuah — flat rows, no inner boxes */}
        {mosque && mosque.jumuahSessions && mosque.jumuahSessions.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <Sparkles size={17} color={colors.accent} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Friday Jumuah Sessions</Text>
            </View>

            {mosque.jumuahSessions.map((session, index, arr) => {
              const isLast = index === arr.length - 1;
              return (
                <View
                  key={session.sessionNumber}
                  style={[
                    styles.jumuahRow,
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.divider }
                  ]}
                >
                  <Text style={[styles.jumuahNumber, { color: colors.primary }]}>Session {session.sessionNumber}</Text>
                  <View style={styles.jumuahTimes}>
                    <Text style={[styles.jumuahLabel, { color: colors.textSecondary }]}>Khutbah <Text style={{ color: colors.text, fontWeight: '700' }}>{session.khutbah}</Text></Text>
                    <Text style={[styles.jumuahLabel, { color: colors.textSecondary }]}>Salah <Text style={{ color: colors.primary, fontWeight: '700' }}>{session.iqamah}</Text></Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 18,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 4,
    borderColor: '#064e3b',
    borderTopColor: 'transparent',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 16,
    minHeight: 400,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Open header (no box) */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  headerInfo: {
    gap: 6,
    flex: 1,
  },
  mosqueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },
  mosqueLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mosqueName: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  dateText: {
    fontSize: 13,
  },
  hijriText: {
    fontSize: 13,
    fontWeight: '800',
  },

  /* Hero countdown card */
  countdownCard: {
    paddingVertical: 30,
    paddingHorizontal: 24,
    borderRadius: 26,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  countdownTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    opacity: 0.85,
  },
  countdownName: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  countdownTimer: {
    color: '#ffffff',
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 60,
  },
  countdownDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  countdownDetailText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.9,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  /* Generic section card — one level only */
  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  /* Timetable */
  timetableHeaders: {
    flexDirection: 'row',
    paddingBottom: 10,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    alignItems: 'center',
  },
  rowHighlight: {
    borderRadius: 14,
    borderBottomWidth: 0,
    paddingHorizontal: 12,
    marginHorizontal: -12,
  },
  colName: {
    flex: 2,
  },
  colTime: {
    flex: 1,
    textAlign: 'center',
  },
  cellText: {
    fontSize: 15,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '700',
  },
  nextTag: {
    fontSize: 12,
    fontWeight: '800',
  },
  iqamahTime: {
    fontSize: 15,
    fontWeight: '800',
  },
  sunriseRow: {
    alignItems: 'flex-end',
    paddingTop: 12,
    paddingBottom: 8,
  },
  sunriseText: {
    fontSize: 12,
  },

  /* Jumuah */
  jumuahRow: {
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jumuahNumber: {
    fontSize: 14,
    fontWeight: '800',
  },
  jumuahTimes: {
    flexDirection: 'row',
    gap: 16,
  },
  jumuahLabel: {
    fontSize: 13,
  },

  /* Admin */
  adminEditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  adminEditText: {
    fontSize: 13,
    fontWeight: '700',
  }
});
