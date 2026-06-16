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
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
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

export default function HomeDashboard() {
  const router = useRouter();
  const { followedMosqueId, apiUrl, isAuthenticated, user } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date constants
  const [hijriDate, setHijriDate] = useState('');
  const [gregorianDate, setGregorianDate] = useState('');

  // Fetch mosque info and prayer times
  const loadData = async () => {
    if (!followedMosqueId) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      // 1. Fetch mosque details
      const mosqueRes = await fetch(`${apiUrl}/api/mosques/${followedMosqueId}`);
      if (!mosqueRes.ok) throw new Error('Failed to load mosque details');
      const mosqueData = await mosqueRes.json();
      setMosque(mosqueData);

      // 2. Fetch today's prayer times
      const todayStr = new Date().toISOString().split('T')[0];
      const prayerRes = await fetch(`${apiUrl}/api/prayers?mosqueId=${followedMosqueId}&date=${todayStr}`);
      if (prayerRes.ok) {
        const prayerData = await prayerRes.json();
        if (prayerData && prayerData.length > 0) {
          setTimetable(prayerData[0]);
        } else {
          setTimetable(null);
        }
      }
    } catch (err: any) {
      setError('Connection offline. Pull to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [followedMosqueId]);

  useEffect(() => {
    loadData();
    setHijriDate(getHijriDate());
    setGregorianDate(new Date().toLocaleDateString(undefined, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, [followedMosqueId]);

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
    border: isDark ? '#1b2c27' : '#e2e8f0',
    highlight: isDark ? '#064e3b' : '#d1fae5',
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header Block */}
        {mosque && (
          <TouchableOpacity 
            style={[styles.headerCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/mosque-info' })}
          >
            <View style={styles.headerInfo}>
              <View style={styles.mosqueBadge}>
                <MapPin size={14} color={colors.primary} />
                <Text style={[styles.mosqueLabel, { color: colors.primary }]}>{mosque.city}</Text>
              </View>
              <Text style={[styles.mosqueName, { color: colors.text }]}>{mosque.mosqueName}</Text>
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>{gregorianDate}</Text>
              <Text style={[styles.hijriText, { color: colors.accent }]}>{hijriDate}</Text>
            </View>
            <ChevronRight size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Live Countdown Widget */}
        {nextPrayer ? (
          <View style={[styles.countdownCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.countdownTitle}>
              Next Event: <Text style={{ fontWeight: '900' }}>{nextPrayer.name} {nextPrayer.type}</Text>
            </Text>
            <Text style={styles.countdownTimer}>
              {formatTimeRemaining(nextPrayer.secondsRemaining)}
            </Text>
            <View style={styles.countdownDetails}>
              <Clock size={12} color="#ffffff" opacity={0.8} />
              <Text style={styles.countdownDetailText}>
                Scheduled for {nextPrayer.time}
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

        {/* Timetable Section */}
        {timetable && (
          <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Clock size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Today Prayer Times</Text>
            </View>

            <View style={styles.timetableHeaders}>
              <Text style={[styles.tableCol, styles.colName, { color: colors.textSecondary }]}>Salah</Text>
              <Text style={[styles.tableCol, styles.colTime, { color: colors.textSecondary }]}>Adhan</Text>
              <Text style={[styles.tableCol, styles.colTime, { color: colors.textSecondary }]}>Iqamah</Text>
            </View>

            {/* Timetable Rows */}
            {[
              { name: 'Fajr', times: timetable.fajr },
              { name: 'Dhuhr', times: timetable.dhuhr },
              { name: 'Asr', times: timetable.asr },
              { name: 'Maghrib', times: timetable.maghrib },
              { name: 'Isha', times: timetable.isha }
            ].map((prayer) => {
              const isNext = nextPrayer?.name === prayer.name;
              return (
                <View 
                  key={prayer.name} 
                  style={[
                    styles.tableRow, 
                    { borderBottomColor: colors.border },
                    isNext && [styles.rowHighlight, { backgroundColor: colors.highlight, borderColor: colors.primary }]
                  ]}
                >
                  <Text style={[styles.tableCol, styles.colName, styles.prayerName, { color: colors.text }]}>
                    {prayer.name}
                  </Text>
                  <Text style={[styles.tableCol, styles.colTime, { color: colors.text }]}>
                    {prayer.times.adhan}
                  </Text>
                  <Text style={[styles.tableCol, styles.colTime, styles.iqamahTime, { color: colors.primary }]}>
                    {prayer.times.iqamah}
                  </Text>
                </View>
              );
            })}

            <View style={styles.sunriseRow}>
              <Text style={[styles.sunriseText, { color: colors.textSecondary }]}>
                Sunrise: <Text style={{ color: colors.text, fontWeight: '700' }}>{timetable.sunrise}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Friday Jumuah Congregation */}
        {mosque && mosque.jumuahSessions && mosque.jumuahSessions.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Sparkles size={16} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Friday Jumuah Sessions</Text>
            </View>

            <View style={styles.jumuahGrid}>
              {mosque.jumuahSessions.map((session) => (
                <View key={session.sessionNumber} style={[styles.jumuahCard, { borderColor: colors.border }]}>
                  <Text style={[styles.jumuahNumber, { color: colors.primary }]}>Session {session.sessionNumber}</Text>
                  <View style={styles.jumuahTimes}>
                    <Text style={[styles.jumuahLabel, { color: colors.textSecondary }]}>Khutbah: <Text style={{ color: colors.text, fontWeight: '600' }}>{session.khutbah}</Text></Text>
                    <Text style={[styles.jumuahLabel, { color: colors.textSecondary }]}>Salah: <Text style={{ color: colors.primary, fontWeight: '700' }}>{session.iqamah}</Text></Text>
                  </View>
                </View>
              ))}
            </View>
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
    padding: 20,
    gap: 20,
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
  headerCard: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerInfo: {
    gap: 4,
    flex: 1,
  },
  mosqueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  mosqueLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  mosqueName: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 11,
  },
  hijriText: {
    fontSize: 11,
    fontWeight: '800',
  },
  countdownCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  countdownTitle: {
    color: '#ffffff',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.9,
  },
  countdownTimer: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },
  countdownDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countdownDetailText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  timetableHeaders: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  rowHighlight: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    marginHorizontal: -10,
    shadowOpacity: 0.05,
    elevation: 1,
  },
  tableCol: {
    fontSize: 13,
  },
  colName: {
    flex: 2,
  },
  colTime: {
    flex: 1,
    textAlign: 'center',
  },
  prayerName: {
    fontWeight: '700',
  },
  iqamahTime: {
    fontWeight: '800',
  },
  sunriseRow: {
    alignItems: 'flex-end',
    paddingTop: 4,
  },
  sunriseText: {
    fontSize: 11,
  },
  jumuahGrid: {
    gap: 10,
  },
  jumuahCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jumuahNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  jumuahTimes: {
    flexDirection: 'row',
    gap: 12,
  },
  jumuahLabel: {
    fontSize: 11,
  },
  adminEditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  adminEditText: {
    fontSize: 13,
    fontWeight: '700',
  }
});
