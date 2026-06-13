import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  SafeAreaView, 
  useColorScheme,
  TouchableOpacity
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Calendar, Clock, AlertCircle } from 'lucide-react-native';

interface SpecialPrayer {
  _id: string;
  title: string;
  date: string;
  adhanTime?: string;
  iqamahTime: string;
  description?: string;
}

export default function SpecialPrayersScreen() {
  const { followedMosqueId, apiUrl } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [specials, setSpecials] = useState<SpecialPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSpecials = async () => {
    if (!followedMosqueId) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      const res = await fetch(`${apiUrl}/api/special-prayers?mosqueId=${followedMosqueId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSpecials(data);
    } catch (err) {
      setError('Could not load special services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecials();
  }, [followedMosqueId]);

  const colors = {
    bg: isDark ? '#090f0d' : '#f4f7f6',
    cardBg: isDark ? '#101a17' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    primary: isDark ? '#10b981' : '#064e3b',
    accent: isDark ? '#fbbf24' : '#d97706',
    border: isDark ? '#1b2c27' : '#e2e8f0',
  };

  const renderItem = ({ item }: { item: SpecialPrayer }) => {
    const dateObj = new Date(item.date);
    const dateLabel = dateObj.toLocaleDateString(undefined, { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    return (
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.badgeContainer}>
            <Sparkles size={12} color={colors.accent} />
            <Text style={[styles.badgeText, { color: colors.accent }]}>Special Assembly</Text>
          </View>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
        </View>

        {item.description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
        ) : null}

        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <View style={styles.footerCol}>
            <Calendar size={12} color={colors.primary} />
            <Text style={[styles.footerText, { color: colors.text }]}>{dateLabel}</Text>
          </View>
          <View style={[styles.footerCol, { alignItems: 'flex-end' }]}>
            <Clock size={12} color={colors.primary} />
            <Text style={[styles.footerText, { color: colors.text }]}>
              {item.adhanTime ? `Adhan: ${item.adhanTime} • ` : ''}Salah: {item.iqamahTime}
            </Text>
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
        <Sparkles size={36} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          Follow a mosque in settings to load scheduled assemblies.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Sparkles size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Special Prayers</Text>
      </View>

      <FlatList
        data={specials}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <AlertCircle size={24} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {error || 'No special prayer assemblies currently scheduled.'}
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
    gap: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  cardHeader: {
    gap: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
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
