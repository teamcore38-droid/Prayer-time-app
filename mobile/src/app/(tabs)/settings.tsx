import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Switch, 
  SafeAreaView, 
  TextInput,
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings, MapPin, Bell, User, LogOut, Search, CheckCircle, ChevronRight } from 'lucide-react-native';

interface Mosque {
  _id: string;
  mosqueName: string;
  city: string;
  district: string;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { followedMosqueId, followMosque, isAuthenticated, user, logout, apiUrl } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [followedMosque, setFollowedMosque] = useState<Mosque | null>(null);
  const [loading, setLoading] = useState(true);

  // Notification Toggles
  const [adhanReminder, setAdhanReminder] = useState(true);
  const [iqamahReminder, setIqamahReminder] = useState(true);
  const [specialReminder, setSpecialReminder] = useState(true);
  const [eventReminder, setEventReminder] = useState(true);

  // Fetch followed mosque details
  const fetchMosqueDetails = async () => {
    // 1. Read instantly from cache
    try {
      const cached = await AsyncStorage.getItem('cache_mosque');
      if (cached) {
        setFollowedMosque(JSON.parse(cached));
        setLoading(false);
      }
    } catch (e) {
      console.log('Failed to read cache_mosque', e);
    }

    if (!followedMosqueId) {
      setLoading(false);
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
        setFollowedMosque(data);
        await AsyncStorage.setItem('cache_mosque', JSON.stringify(data));
      }
    } catch (err) {
      console.warn('Failed to load followed mosque details', err);
    } finally {
      setLoading(false);
    }
  };

  // Load reminder settings
  const loadReminderSettings = async () => {
    try {
      const adhan = await AsyncStorage.getItem('notify_adhan');
      const iqamah = await AsyncStorage.getItem('notify_iqamah');
      const special = await AsyncStorage.getItem('notify_special');
      const event = await AsyncStorage.getItem('notify_event');

      if (adhan !== null) setAdhanReminder(adhan === 'true');
      if (iqamah !== null) setIqamahReminder(iqamah === 'true');
      if (special !== null) setSpecialReminder(special === 'true');
      if (event !== null) setEventReminder(event === 'true');
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchMosqueDetails();
    loadReminderSettings();
  }, [followedMosqueId]);

  const toggleSwitch = async (key: string, value: boolean, setter: (val: boolean) => void) => {
    setter(value);
    await AsyncStorage.setItem(key, String(value));
    // If FCM is configured, you can call `/api/notifications/register` here to update backend settings
  };

  const handleSelectMosque = async (mosqueId: string) => {
    await followMosque(mosqueId);
    // Register token subscription with backend
    try {
      const storedToken = await AsyncStorage.getItem('fcm_token') || 'local_simulator_fcm_token';
      await fetch(`${apiUrl}/api/notifications/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fcmToken: storedToken,
          platform: 'android', // or iOS
          subscribedMosques: [mosqueId],
          userId: user?.id || null
        })
      });
    } catch (err) {
      console.log('Failed to upload device subscription to API');
    }
  };

  const colors = {
    bg: isDark ? '#090f0d' : '#f4f7f6',
    cardBg: isDark ? '#101a17' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    primary: isDark ? '#10b981' : '#064e3b',
    border: isDark ? '#1b2c27' : '#e2e8f0',
    inputBg: isDark ? '#1a2723' : '#e2e8f0',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Settings size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Platform Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section 1: Mosque Selector */}
        <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Mosque</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Your application is connected to your local congregation.
          </Text>

          {followedMosque ? (
            <View style={[styles.followedCard, { backgroundColor: colors.bg, borderColor: colors.border }]}>
              <MapPin size={24} color={colors.primary} style={styles.followedIcon} />
              <View style={styles.followedDetails}>
                <Text style={[styles.followedName, { color: colors.text }]}>
                  {followedMosque.mosqueName}
                </Text>
                <Text style={[styles.followedLocation, { color: colors.textSecondary }]}>
                  {followedMosque.city}, {followedMosque.district}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading mosque details...
            </Text>
          )}
        </View>

        {/* Section 2: Notifications */}
        <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Bell size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Adhan Reminders</Text>
              <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>Send push notifications 30 minutes before Adhan</Text>
            </View>
            <Switch
              value={adhanReminder}
              onValueChange={(val) => toggleSwitch('notify_adhan', val, setAdhanReminder)}
              trackColor={{ false: '#d1d5db', true: colors.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Iqamah Reminders</Text>
              <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>Send push notifications 15 minutes before Iqamah</Text>
            </View>
            <Switch
              value={iqamahReminder}
              onValueChange={(val) => toggleSwitch('notify_iqamah', val, setIqamahReminder)}
              trackColor={{ false: '#d1d5db', true: colors.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Special Prayers</Text>
              <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>Notices for Eid, Tarawih, and Janaza assemblies</Text>
            </View>
            <Switch
              value={specialReminder}
              onValueChange={(val) => toggleSwitch('notify_special', val, setSpecialReminder)}
              trackColor={{ false: '#d1d5db', true: colors.primary }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>Events & Announcements</Text>
              <Text style={[styles.toggleDesc, { color: colors.textSecondary }]}>Receive Quran classes and charity fundraiser alerts</Text>
            </View>
            <Switch
              value={eventReminder}
              onValueChange={(val) => toggleSwitch('notify_event', val, setEventReminder)}
              trackColor={{ false: '#d1d5db', true: colors.primary }}
            />
          </View>
        </View>

        {/* Section 3: Auth Portal */}
        <View style={[styles.section, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <User size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mosque Administration</Text>
          </View>

          {isAuthenticated && user ? (
            <View style={styles.profileBoxVertical}>
              <View style={styles.profileBox}>
                <View style={styles.profileDetails}>
                  <Text style={[styles.profileName, { color: colors.text }]}>{user.name}</Text>
                  <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user.email}</Text>
                  <View style={[styles.profileBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.profileBadgeText, { color: colors.primary }]}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.adminActionList}>
                {(user.role === 'mosque_admin' || user.role === 'super_admin') && (
                  <TouchableOpacity
                    onPress={() => router.push('/edit-prayers')}
                    style={[styles.adminActionItem, { borderBottomColor: colors.border }]}
                  >
                    <View style={styles.adminActionLeft}>
                      <Settings size={16} color={colors.primary} />
                      <Text style={[styles.adminActionText, { color: colors.text }]}>Imam Console: Edit Times</Text>
                    </View>
                    <ChevronRight size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={logout}
                  style={styles.adminActionItem}
                >
                  <View style={styles.adminActionLeft}>
                    <LogOut size={16} color="#f43f5e" />
                    <Text style={[styles.adminActionText, { color: '#f43f5e', fontWeight: '700' }]}>Log Out</Text>
                  </View>
                  <ChevronRight size={16} color="#f43f5e" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.loginCTA}>
              <Text style={[styles.loginCTADesc, { color: colors.textSecondary }]}>
                Are you a Mosque Imam, Admin, or Murobi? Login to sync and manage schedules from your smartphone.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/login')}
                style={[styles.btn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.btnText}>Imam / Admin Login</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  section: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 14,
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
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 8,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 12,
    padding: 0,
  },
  list: {
    gap: 2,
    marginTop: 4,
  },
  mosqueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mosqueItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  mosqueItemName: {
    fontSize: 13,
    fontWeight: '700',
  },
  mosqueItemCity: {
    fontSize: 10,
    marginTop: 1,
  },
  noResults: {
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  toggleTextCol: {
    flex: 1,
    gap: 2,
    paddingRight: 12,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  profileBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileDetails: {
    gap: 4,
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '900',
  },
  profileEmail: {
    fontSize: 11,
  },
  profileBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  profileBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnOutlineText: {
    color: '#f43f5e',
    fontSize: 11,
    fontWeight: '700',
  },
  loginCTA: {
    gap: 12,
  },
  loginCTADesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  btn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  followedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  followedIcon: {
    alignSelf: 'center',
  },
  followedDetails: {
    flex: 1,
    gap: 2,
  },
  followedName: {
    fontSize: 14,
    fontWeight: '700',
  },
  followedLocation: {
    fontSize: 11,
  },
  loadingText: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },
  profileBoxVertical: {
    gap: 12,
  },
  adminActionList: {
    marginTop: 8,
  },
  adminActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  adminActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminActionText: {
    fontSize: 13,
    fontWeight: '600',
  }
});
