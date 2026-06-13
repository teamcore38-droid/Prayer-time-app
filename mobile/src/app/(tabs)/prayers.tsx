import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  SafeAreaView, 
  useColorScheme
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Clock, Calendar, AlertCircle } from 'lucide-react-native';

interface TimePair {
  adhan: string;
  iqamah: string;
}

interface PrayerTimeRow {
  _id: string;
  date: string;
  sunrise: string;
  fajr: TimePair;
  dhuhr: TimePair;
  asr: TimePair;
  maghrib: TimePair;
  isha: TimePair;
}

export default function PrayersScreen() {
  const { followedMosqueId, apiUrl } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [prayers, setPrayers] = useState<PrayerTimeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!followedMosqueId) {
        setLoading(false);
        return;
      }

      try {
        setError('');
        // Fetch all schedules for this month
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        
        const res = await fetch(`${apiUrl}/api/prayers?mosqueId=${followedMosqueId}&month=${year}-${month}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPrayers(data);
      } catch (err) {
        setError('Could not fetch monthly schedules.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [followedMosqueId]);

  const colors = {
    bg: isDark ? '#090f0d' : '#f4f7f6',
    cardBg: isDark ? '#101a17' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    primary: isDark ? '#10b981' : '#064e3b',
    border: isDark ? '#1b2c27' : '#e2e8f0',
  };

  const renderItem = ({ item }: { item: PrayerTimeRow }) => {
    // Format date for display
    const dateObj = new Date(item.date);
    const dayLabel = dateObj.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const weekdayLabel = dateObj.toLocaleDateString(undefined, { weekday: 'short' });
    const isToday = new Date().toISOString().split('T')[0] === item.date;

    return (
      <View style={[
        styles.rowCard, 
        { backgroundColor: colors.cardBg, borderColor: colors.border },
        isToday && [styles.todayCard, { borderColor: colors.primary }]
      ]}>
        {/* Date block */}
        <View style={styles.dateBlock}>
          <Text style={[styles.dayText, { color: colors.text }]}>{dayLabel}</Text>
          <Text style={[styles.weekDayText, { color: colors.primary }]}>{weekdayLabel}</Text>
        </View>

        {/* Times grid */}
        <View style={styles.grid}>
          <View style={styles.gridCol}>
            <Text style={[styles.gridTitle, { color: colors.textSecondary }]}>Fajr</Text>
            <Text style={[styles.gridVal, { color: colors.text }]}>{item.fajr.adhan}</Text>
            <Text style={[styles.gridIqamah, { color: colors.primary }]}>{item.fajr.iqamah}</Text>
          </View>

          <View style={styles.gridCol}>
            <Text style={[styles.gridTitle, { color: colors.textSecondary }]}>Dhuhr</Text>
            <Text style={[styles.gridVal, { color: colors.text }]}>{item.dhuhr.adhan}</Text>
            <Text style={[styles.gridIqamah, { color: colors.primary }]}>{item.dhuhr.iqamah}</Text>
          </View>

          <View style={styles.gridCol}>
            <Text style={[styles.gridTitle, { color: colors.textSecondary }]}>Asr</Text>
            <Text style={[styles.gridVal, { color: colors.text }]}>{item.asr.adhan}</Text>
            <Text style={[styles.gridIqamah, { color: colors.primary }]}>{item.asr.iqamah}</Text>
          </View>

          <View style={styles.gridCol}>
            <Text style={[styles.gridTitle, { color: colors.textSecondary }]}>Maghrib</Text>
            <Text style={[styles.gridVal, { color: colors.text }]}>{item.maghrib.adhan}</Text>
            <Text style={[styles.gridIqamah, { color: colors.primary }]}>{item.maghrib.iqamah}</Text>
          </View>

          <View style={styles.gridCol}>
            <Text style={[styles.gridTitle, { color: colors.textSecondary }]}>Isha</Text>
            <Text style={[styles.gridVal, { color: colors.text }]}>{item.isha.adhan}</Text>
            <Text style={[styles.gridIqamah, { color: colors.primary }]}>{item.isha.iqamah}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <View style={styles.spinner} />
      </View>
    );
  }

  if (!followedMosqueId) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg, padding: 20 }]}>
        <AlertCircle size={36} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          Please select a mosque in settings to load timetables.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Clock size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Timetable Calendar</Text>
      </View>

      <FlatList
        data={prayers}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.tableLegend}>
            <Calendar size={12} color={colors.textSecondary} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Schedule for the current Gregorian month. Columns show Adhan / Iqamah times.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <AlertCircle size={24} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {error || 'No timetable records created for this month.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
  },
  listContent: {
    padding: 20,
    gap: 12,
  },
  tableLegend: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 12,
    alignItems: 'center',
  },
  legendText: {
    fontSize: 10,
    flex: 1,
    lineHeight: 14,
  },
  rowCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  todayCard: {
    borderWidth: 1.5,
  },
  dateBlock: {
    alignItems: 'center',
    width: 50,
    gap: 2,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '900',
  },
  weekDayText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    alignItems: 'center',
    gap: 1,
  },
  gridTitle: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  gridVal: {
    fontSize: 11,
    fontWeight: '500',
  },
  gridIqamah: {
    fontSize: 11,
    fontWeight: '800',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#064e3b',
    borderTopColor: 'transparent',
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  }
});
