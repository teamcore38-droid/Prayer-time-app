import React, { useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  SafeAreaView, 
  useColorScheme,
  Image,
  RefreshControl
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Megaphone, Calendar, Tag, AlertCircle } from 'lucide-react-native';

interface Announcement {
  _id: string;
  title: string;
  description: string;
  image?: string;
  category: 'Quran Class' | 'Event' | 'Fundraiser' | 'Ramadan Notice' | 'General';
  createdAt: string;
}

export default function AnnouncementsScreen() {
  const { followedMosqueId, apiUrl } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [notices, setNotices] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchNotices = async () => {
    // 1. Load instantly from cache
    try {
      const cached = await AsyncStorage.getItem('cache_notices');
      if (cached) {
        setNotices(JSON.parse(cached));
        setLoading(false);
      }
    } catch (e) {
      console.log('Failed to read cache_notices', e);
    }

    if (!followedMosqueId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // 2. Fetch in background with timeout
    try {
      setError('');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch(`${apiUrl}/api/announcements?mosqueId=${followedMosqueId}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setNotices(data);
        await AsyncStorage.setItem('cache_notices', JSON.stringify(data));
      } else {
        throw new Error();
      }
    } catch (err) {
      console.warn('Fetch notices failed, using cache:', err);
      if (notices.length === 0) {
        setError('Could not load announcements.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotices();
  }, [followedMosqueId]);

  useFocusEffect(
    useCallback(() => {
      fetchNotices();
    }, [followedMosqueId])
  );

  const colors = {
    bg: isDark ? '#090f0d' : '#f4f7f6',
    cardBg: isDark ? '#101a17' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    primary: isDark ? '#10b981' : '#064e3b',
    border: isDark ? '#1b2c27' : '#e2e8f0',
  };

  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case 'Quran Class':
        return { bg: '#d1fae5', text: '#065f46', iconColor: '#059669' };
      case 'Event':
        return { bg: '#dbeafe', text: '#1e40af', iconColor: '#2563eb' };
      case 'Fundraiser':
        return { bg: '#fef3c7', text: '#92400e', iconColor: '#d97706' };
      case 'Ramadan Notice':
        return { bg: '#f3e8ff', text: '#6b21a8', iconColor: '#8b5cf6' };
      default:
        return { bg: '#f1f5f9', text: '#334155', iconColor: '#64748b' };
    }
  };

  const renderItem = ({ item }: { item: Announcement }) => {
    const catStyle = getCategoryStyles(item.category);
    const dateLabel = new Date(item.createdAt).toLocaleDateString(undefined, { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

    return (
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        {item.image ? (
          <Image 
            source={{ uri: item.image }} 
            style={styles.cardImage} 
            resizeMode="cover"
          />
        ) : null}

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <View style={[styles.badge, { backgroundColor: catStyle.bg }]}>
              <Tag size={8} color={catStyle.iconColor} />
              <Text style={[styles.badgeText, { color: catStyle.text }]}>{item.category}</Text>
            </View>

            <View style={styles.dateBlock}>
              <Calendar size={10} color={colors.textSecondary} />
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>{dateLabel}</Text>
            </View>
          </View>

          <Text style={[styles.cardTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {item.description}
          </Text>
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
        <Megaphone size={36} color={colors.primary} />
        <Text style={[styles.infoText, { color: colors.text }]}>
          Follow a mosque in settings to load bulletins and notices.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Megaphone size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Mosque Announcements</Text>
      </View>

      <FlatList
        data={notices}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <AlertCircle size={24} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {error || 'No announcements posted recently.'}
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
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 150,
  },
  cardBody: {
    padding: 16,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dateBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
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
