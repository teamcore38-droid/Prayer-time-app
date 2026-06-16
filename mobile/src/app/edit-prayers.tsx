import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert,
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Clock, Calendar, Plus, Trash2, ChevronLeft, ChevronRight, Save } from 'lucide-react-native';

interface TimePair {
  adhan: string;
  iqamah: string;
}

interface JumuahSession {
  sessionNumber: number;
  khutbah: string;
  iqamah: string;
}

export default function EditPrayersScreen() {
  const router = useRouter();
  const { followedMosqueId, token, apiUrl } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [activeTab, setActiveTab] = useState<'daily' | 'jumuah'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Daily Prayer states
  const [sunrise, setSunrise] = useState('');
  const [fajrAdhan, setFajrAdhan] = useState('');
  const [fajrIqamah, setFajrIqamah] = useState('');
  const [dhuhrAdhan, setDhuhrAdhan] = useState('');
  const [dhuhrIqamah, setDhuhrIqamah] = useState('');
  const [asrAdhan, setAsrAdhan] = useState('');
  const [asrIqamah, setAsrIqamah] = useState('');
  const [maghribAdhan, setMaghribAdhan] = useState('');
  const [maghribIqamah, setMaghribIqamah] = useState('');
  const [ishaAdhan, setIshaAdhan] = useState('');
  const [ishaIqamah, setIshaIqamah] = useState('');

  // Jumuah sessions state
  const [jumuahSessions, setJumuahSessions] = useState<JumuahSession[]>([]);

  const dateStr = selectedDate.toISOString().split('T')[0];
  const displayDate = selectedDate.toLocaleDateString(undefined, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });

  // Load times for selected date
  const loadData = async () => {
    if (!followedMosqueId) return;
    setLoading(true);
    try {
      // 1. Fetch daily prayers
      const prayerRes = await fetch(`${apiUrl}/api/prayers?mosqueId=${followedMosqueId}&date=${dateStr}`);
      if (prayerRes.ok) {
        const data = await prayerRes.json();
        if (data && data.length > 0) {
          const timetable = data[0];
          setSunrise(timetable.sunrise || '');
          setFajrAdhan(timetable.fajr?.adhan || '');
          setFajrIqamah(timetable.fajr?.iqamah || '');
          setDhuhrAdhan(timetable.dhuhr?.adhan || '');
          setDhuhrIqamah(timetable.dhuhr?.iqamah || '');
          setAsrAdhan(timetable.asr?.adhan || '');
          setAsrIqamah(timetable.asr?.iqamah || '');
          setMaghribAdhan(timetable.maghrib?.adhan || '');
          setMaghribIqamah(timetable.maghrib?.iqamah || '');
          setIshaAdhan(timetable.isha?.adhan || '');
          setIshaIqamah(timetable.isha?.iqamah || '');
        } else {
          // Clear inputs if no record exists for this date yet
          setSunrise('');
          setFajrAdhan(''); setFajrIqamah('');
          setDhuhrAdhan(''); setDhuhrIqamah('');
          setAsrAdhan(''); setAsrIqamah('');
          setMaghribAdhan(''); setMaghribIqamah('');
          setIshaAdhan(''); setIshaIqamah('');
        }
      }

      // 2. Fetch Jumuah sessions (only once, or on refresh)
      const mosqueRes = await fetch(`${apiUrl}/api/mosques/${followedMosqueId}`);
      if (mosqueRes.ok) {
        const mosqueData = await mosqueRes.json();
        setJumuahSessions(mosqueData.jumuahSessions || []);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load timetable details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, followedMosqueId]);

  const changeDate = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + days);
    setSelectedDate(next);
  };

  const handleSaveDaily = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const payload = {
        mosqueId: followedMosqueId,
        date: dateStr,
        sunrise,
        fajr: { adhan: fajrAdhan, iqamah: fajrIqamah },
        dhuhr: { adhan: dhuhrAdhan, iqamah: dhuhrIqamah },
        asr: { adhan: asrAdhan, iqamah: asrIqamah },
        maghrib: { adhan: maghribAdhan, iqamah: maghribIqamah },
        isha: { adhan: ishaAdhan, iqamah: ishaIqamah }
      };

      const res = await fetch(`${apiUrl}/api/prayers`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save times');

      Alert.alert('Success', 'Daily prayer times updated successfully!');
      loadData();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Check your internet connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveJumuah = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/mosques/${followedMosqueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jumuahSessions })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save sessions');

      Alert.alert('Success', 'Friday Jumuah sessions updated successfully!');
      loadData();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Check your credentials.');
    } finally {
      setSaving(false);
    }
  };

  const addJumuahSession = () => {
    const nextSessionNumber = jumuahSessions.length > 0 
      ? Math.max(...jumuahSessions.map(s => s.sessionNumber)) + 1 
      : 1;
    
    setJumuahSessions([
      ...jumuahSessions,
      { sessionNumber: nextSessionNumber, khutbah: '13:00', iqamah: '13:15' }
    ]);
  };

  const removeJumuahSession = (sessionNumber: number) => {
    const updated = jumuahSessions
      .filter(s => s.sessionNumber !== sessionNumber)
      .map((s, idx) => ({ ...s, sessionNumber: idx + 1 })); // Re-index
    setJumuahSessions(updated);
  };

  const updateJumuahSession = (sessionNumber: number, field: 'khutbah' | 'iqamah', val: string) => {
    const updated = jumuahSessions.map(s => {
      if (s.sessionNumber === sessionNumber) {
        return { ...s, [field]: val };
      }
      return s;
    });
    setJumuahSessions(updated);
  };

  const colors = {
    bg: isDark ? '#090f0d' : '#f4f7f6',
    cardBg: isDark ? '#101a17' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1e293b',
    textSecondary: isDark ? '#94a3b8' : '#64748b',
    primary: isDark ? '#10b981' : '#064e3b',
    border: isDark ? '#1b2c27' : '#e2e8f0',
    inputBg: isDark ? '#1a2723' : '#f8fafc',
    activeTab: isDark ? '#10b981' : '#064e3b',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header bar */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Imam Console</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs selector */}
      <View style={[styles.tabsContainer, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'daily' && [styles.activeTab, { borderBottomColor: colors.activeTab }]]}
          onPress={() => setActiveTab('daily')}
        >
          <Text style={[styles.tabText, activeTab === 'daily' && { color: colors.activeTab, fontWeight: '800' }, { color: colors.textSecondary }]}>
            Daily Prayers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'jumuah' && [styles.activeTab, { borderBottomColor: colors.activeTab }]]}
          onPress={() => setActiveTab('jumuah')}
        >
          <Text style={[styles.tabText, activeTab === 'jumuah' && { color: colors.activeTab, fontWeight: '800' }, { color: colors.textSecondary }]}>
            Friday Jumuah
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'daily' ? (
          <View style={styles.formContainer}>
            {/* Date Navigator */}
            <View style={[styles.dateNavigator, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navBtn}>
                <ChevronLeft size={20} color={colors.text} />
              </TouchableOpacity>
              <View style={styles.dateInfo}>
                <Calendar size={14} color={colors.primary} />
                <Text style={[styles.dateLabel, { color: colors.text }]}>{displayDate}</Text>
              </View>
              <TouchableOpacity onPress={() => changeDate(1)} style={styles.navBtn}>
                <ChevronRight size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={styles.formCardList}>
                {/* Sunrise Row */}
                <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <Text style={[styles.cardHeader, { color: colors.textSecondary }]}>Sunrise Time</Text>
                  <View style={styles.cardInputRow}>
                    <View style={styles.inputBoxHalf}>
                      <TextInput 
                        style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                        value={sunrise}
                        onChangeText={setSunrise}
                        placeholder="e.g. 05:48"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                    <View style={styles.inputBoxHalf} />
                  </View>
                </View>

                {/* Daily prayers fields */}
                {[
                  { name: 'Fajr', adhan: fajrAdhan, setAdhan: setFajrAdhan, iqamah: fajrIqamah, setIqamah: setFajrIqamah },
                  { name: 'Dhuhr', adhan: dhuhrAdhan, setAdhan: setDhuhrAdhan, iqamah: dhuhrIqamah, setIqamah: setDhuhrIqamah },
                  { name: 'Asr', adhan: asrAdhan, setAdhan: setAsrAdhan, iqamah: asrIqamah, setIqamah: setAsrIqamah },
                  { name: 'Maghrib', adhan: maghribAdhan, setAdhan: setMaghribAdhan, iqamah: maghribIqamah, setIqamah: setMaghribIqamah },
                  { name: 'Isha', adhan: ishaAdhan, setAdhan: setIshaAdhan, iqamah: ishaIqamah, setIqamah: setIshaIqamah }
                ].map((prayer) => (
                  <View key={prayer.name} style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <Text style={[styles.cardHeader, { color: colors.text }]}>{prayer.name} Times</Text>
                    <View style={styles.cardInputRow}>
                      <View style={styles.inputBoxHalf}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Adhan (Call)</Text>
                        <TextInput 
                          style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                          value={prayer.adhan}
                          onChangeText={prayer.setAdhan}
                          placeholder="e.g. 13:15"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>
                      <View style={styles.inputBoxHalf}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Iqamah (Salah)</Text>
                        <TextInput 
                          style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                          value={prayer.iqamah}
                          onChangeText={prayer.setIqamah}
                          placeholder="e.g. 13:30"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>
                    </View>
                  </View>
                ))}

                <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveDaily}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Save size={18} color="#ffffff" />
                      <Text style={styles.saveBtnText}>Save Prayer Times</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.formContainer}>
            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={styles.formCardList}>
                <Text style={[styles.sectionHeadingText, { color: colors.textSecondary }]}>
                  Define the sessions/batches for the Friday Jumuah Congregation prayers.
                </Text>

                {jumuahSessions.map((session, index) => (
                  <View key={session.sessionNumber} style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.cardHeader, { color: colors.text }]}>Session {session.sessionNumber}</Text>
                      <TouchableOpacity onPress={() => removeJumuahSession(session.sessionNumber)}>
                        <Trash2 size={16} color="#f43f5e" />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.cardInputRow}>
                      <View style={styles.inputBoxHalf}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Khutbah (Sermon)</Text>
                        <TextInput 
                          style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                          value={session.khutbah}
                          onChangeText={(val) => updateJumuahSession(session.sessionNumber, 'khutbah', val)}
                          placeholder="e.g. 13:00"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>
                      <View style={styles.inputBoxHalf}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Salah (Congregation)</Text>
                        <TextInput 
                          style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                          value={session.iqamah}
                          onChangeText={(val) => updateJumuahSession(session.sessionNumber, 'iqamah', val)}
                          placeholder="e.g. 13:15"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>
                    </View>
                  </View>
                ))}

                <TouchableOpacity 
                  style={[styles.addBtn, { borderColor: colors.primary }]}
                  onPress={addJumuahSession}
                >
                  <Plus size={16} color={colors.primary} />
                  <Text style={[styles.addBtnText, { color: colors.primary }]}>Add Session</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveJumuah}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Save size={18} color="#ffffff" />
                      <Text style={styles.saveBtnText}>Save Jumuah Sessions</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#10b981',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 20,
  },
  formContainer: {
    gap: 16,
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  navBtn: {
    padding: 6,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  center: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCardList: {
    gap: 16,
  },
  sectionHeadingText: {
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '900',
  },
  cardInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputBoxHalf: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  textInput: {
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  }
});
