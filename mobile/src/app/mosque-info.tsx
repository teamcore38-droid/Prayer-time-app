import React, { useEffect, useState, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  Image,
  useColorScheme,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MapPin, Phone, Mail, Globe, ArrowLeft, Info, Compass } from 'lucide-react-native';

interface Mosque {
  _id: string;
  mosqueName: string;
  address: string;
  city: string;
  district: string;
  country: string;
  phone?: string;
  email?: string;
  logo?: string;
  latitude: number;
  longitude: number;
}

export default function MosqueInfoScreen() {
  const router = useRouter();
  const { followedMosqueId, apiUrl } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDetails = async () => {
    // 1. Read instantly from cache
    try {
      const cached = await AsyncStorage.getItem('cache_mosque');
      if (cached) {
        setMosque(JSON.parse(cached));
        setLoading(false);
      }
    } catch (e) {
      console.log('Failed to read cache_mosque', e);
    }

    if (!followedMosqueId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    // 2. Fetch in background with timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const res = await fetch(`${apiUrl}/api/mosques/${followedMosqueId}`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setMosque(data);
        await AsyncStorage.setItem('cache_mosque', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Fetch mosque details failed, using cache:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetails();
  }, [followedMosqueId]);

  useEffect(() => {
    fetchDetails();
  }, [followedMosqueId]);

  const colors = {
    bg: isDark ? '#090f0d' : '#f4f7f6',
    cardBg: isDark ? '#101a17' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    primary: isDark ? '#10b981' : '#064e3b',
    border: isDark ? '#1b2c27' : '#e2e8f0',
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <View style={styles.spinner} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <TouchableOpacity 
        style={styles.backBtn}
        onPress={() => router.back()}
      >
        <ArrowLeft size={18} color={colors.text} />
        <Text style={[styles.backText, { color: colors.text }]}>Dashboard</Text>
      </TouchableOpacity>

      {mosque ? (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {/* Logo / Header banner */}
          <View style={[styles.headerBanner, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {mosque.logo ? (
              <Image source={{ uri: mosque.logo }} style={styles.logo} />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary + '10' }]}>
                <Text style={[styles.logoText, { color: colors.primary }]}>{mosque.mosqueName.charAt(0)}</Text>
              </View>
            )}
            <Text style={[styles.mosqueName, { color: colors.text }]}>{mosque.mosqueName}</Text>
            <Text style={[styles.mosqueID, { color: colors.textSecondary }]}>ID: {mosque._id}</Text>
          </View>

          {/* Location details */}
          <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <MapPin size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Location Details</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Address</Text>
              <Text style={[styles.value, { color: colors.text }]}>{mosque.address}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>City & State</Text>
              <Text style={[styles.value, { color: colors.text }]}>{mosque.city}, {mosque.district}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Country</Text>
              <Text style={[styles.value, { color: colors.text }]}>{mosque.country}</Text>
            </View>
          </View>

          {/* Contact details */}
          <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <Phone size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact Details</Text>
            </View>
            {mosque.phone ? (
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Telephone</Text>
                <Text style={[styles.value, { color: colors.text }]}>{mosque.phone}</Text>
              </View>
            ) : null}
            {mosque.email ? (
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
                <Text style={[styles.value, { color: colors.text }]}>{mosque.email}</Text>
              </View>
            ) : null}
            {!mosque.phone && !mosque.email ? (
              <Text style={[styles.emptyLabel, { color: colors.textSecondary }]}>No contact info available.</Text>
            ) : null}
          </View>

          {/* GPS coordinates */}
          <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.sectionTitleRow}>
              <Compass size={16} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Geolocation Metrics</Text>
            </View>
            <View style={styles.coordinateRow}>
              <View style={styles.coordinateBox}>
                <Text style={[styles.coordinateLabel, { color: colors.textSecondary }]}>Latitude</Text>
                <Text style={[styles.coordinateValue, { color: colors.text }]}>{mosque.latitude.toFixed(6)}</Text>
              </View>
              <View style={styles.coordinateBox}>
                <Text style={[styles.coordinateLabel, { color: colors.textSecondary }]}>Longitude</Text>
                <Text style={[styles.coordinateValue, { color: colors.text }]}>{mosque.longitude.toFixed(6)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View style={[styles.center, { backgroundColor: colors.bg, padding: 20 }]}>
          <Info size={36} color={colors.primary} />
          <Text style={[styles.emptyLabel, { color: colors.text, textAlign: 'center' }]}>
            No mosque info found.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  headerBanner: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    gap: 8,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 16,
  },
  logoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
  },
  mosqueName: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  mosqueID: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  infoRow: {
    gap: 2,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyLabel: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  coordinateRow: {
    flexDirection: 'row',
    gap: 16,
  },
  coordinateBox: {
    flex: 1,
    gap: 2,
  },
  coordinateLabel: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: '#064e3b',
    borderTopColor: 'transparent',
  }
});
