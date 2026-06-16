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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  MapPin, 
  Megaphone,
  Info
} from 'lucide-react-native';

interface TimePair {
  adhan: string;
  iqamah: string;
}

interface JumuahSession {
  sessionNumber: number;
  khutbah: string;
  iqamah: string;
}

interface Announcement {
  _id: string;
  title: string;
  description: string;
  category: string;
  createdAt: string;
}

const validateTime = (timeStr: string, label: string): { isValid: boolean; formatted: string; error?: string } => {
  const trimmed = timeStr ? timeStr.trim() : '';
  if (!trimmed) {
    return { isValid: false, formatted: '', error: `${label} is required.` };
  }

  // Regex checks for numbers only with exactly one colon or semicolon between hour and minute
  const timeRegex = /^\d{1,2}[:;]\d{2}$/;
  if (!timeRegex.test(trimmed)) {
    return { 
      isValid: false, 
      formatted: trimmed, 
      error: `${label} must contain numbers only, separated by a colon or semicolon (e.g. 05:45 or 18;30).` 
    };
  }

  const parts = trimmed.split(/[:;]/);
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (hours < 0 || hours > 23) {
    return { 
      isValid: false, 
      formatted: trimmed, 
      error: `${label} hour must be between 0 and 23.` 
    };
  }

  if (minutes < 0 || minutes > 59) {
    return { 
      isValid: false, 
      formatted: trimmed, 
      error: `${label} minute must be between 00 and 59.` 
    };
  }

  const normalizedHours = String(hours).padStart(2, '0');
  const normalizedMinutes = String(minutes).padStart(2, '0');
  return { isValid: true, formatted: `${normalizedHours}:${normalizedMinutes}` };
};

const validateEmail = (emailStr: string): boolean => {
  if (!emailStr) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailStr.trim());
};

const validatePhone = (phoneStr: string): boolean => {
  if (!phoneStr) return true;
  const phoneRegex = /^[0-9+\s()-]{7,20}$/;
  return phoneRegex.test(phoneStr.trim());
};

const validateCoordinates = (lat: any, lng: any): { isValid: boolean; latNum: number; lngNum: number; error?: string } => {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || latNum < -90 || latNum > 90) {
    return { isValid: false, latNum: 0, lngNum: 0, error: 'Latitude must be a valid number between -90 and 90.' };
  }
  if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
    return { isValid: false, latNum: 0, lngNum: 0, error: 'Longitude must be a valid number between -180 and 180.' };
  }
  return { isValid: true, latNum, lngNum };
};

export default function EditPrayersScreen() {
  const router = useRouter();
  const { followedMosqueId, token, apiUrl } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  type TabType = 'daily' | 'jumuah' | 'profile' | 'announcements';
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Daily Prayer states
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Daily Prayer states (separated hour and minute)
  const [sunriseHour, setSunriseHour] = useState('');
  const [sunriseMin, setSunriseMin] = useState('');
  const [fajrAdhanHour, setFajrAdhanHour] = useState('');
  const [fajrAdhanMin, setFajrAdhanMin] = useState('');
  const [fajrIqamahHour, setFajrIqamahHour] = useState('');
  const [fajrIqamahMin, setFajrIqamahMin] = useState('');
  const [dhuhrAdhanHour, setDhuhrAdhanHour] = useState('');
  const [dhuhrAdhanMin, setDhuhrAdhanMin] = useState('');
  const [dhuhrIqamahHour, setDhuhrIqamahHour] = useState('');
  const [dhuhrIqamahMin, setDhuhrIqamahMin] = useState('');
  const [asrAdhanHour, setAsrAdhanHour] = useState('');
  const [asrAdhanMin, setAsrAdhanMin] = useState('');
  const [asrIqamahHour, setAsrIqamahHour] = useState('');
  const [asrIqamahMin, setAsrIqamahMin] = useState('');
  const [maghribAdhanHour, setMaghribAdhanHour] = useState('');
  const [maghribAdhanMin, setMaghribAdhanMin] = useState('');
  const [maghribIqamahHour, setMaghribIqamahHour] = useState('');
  const [maghribIqamahMin, setMaghribIqamahMin] = useState('');
  const [ishaAdhanHour, setIshaAdhanHour] = useState('');
  const [ishaAdhanMin, setIshaAdhanMin] = useState('');
  const [ishaIqamahHour, setIshaIqamahHour] = useState('');
  const [ishaIqamahMin, setIshaIqamahMin] = useState('');

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Swipe gesture state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Friday Jumuah state
  const [jumuahSessions, setJumuahSessions] = useState<JumuahSession[]>([]);

  const splitTime = (timeStr: string) => {
    if (!timeStr) return { hour: '', minute: '' };
    const parts = timeStr.split(/[:;]/);
    return {
      hour: parts[0] || '',
      minute: parts[1] || ''
    };
  };

  const handleTouchStart = (e: any) => {
    setTouchStartX(e.nativeEvent.pageX);
  };

  const handleTouchEnd = (e: any) => {
    if (touchStartX === null) return;
    const touchEndX = e.nativeEvent.pageX;
    const diffX = touchStartX - touchEndX;

    const swipeThreshold = 60; // 60px swipe

    if (diffX > swipeThreshold) {
      // Swipe Left -> Next Day
      changeDate(1);
    } else if (diffX < -swipeThreshold) {
      // Swipe Right -> Previous Day
      changeDate(-1);
    }
    setTouchStartX(null);
  };

  const onDateChange = (event: any, selected: Date | undefined) => {
    setShowDatePicker(false);
    if (selected) {
      setSelectedDate(selected);
    }
  };

  // Mosque Profile states
  const [mosqueName, setMosqueName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  // Announcements states
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [newAnnTitle, setNewAnnTitle] = useState('');
  const [newAnnDesc, setNewAnnDesc] = useState('');
  const [newAnnCategory, setNewAnnCategory] = useState('General');

  const dateStr = selectedDate.toISOString().split('T')[0];
  const displayDate = selectedDate.toLocaleDateString(undefined, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });

  // Cache for daily prayer times by date string (e.g. '2026-06-16' => Timetable data)
  const [dailyCache, setDailyCache] = useState<Record<string, any>>({});
  const [dailyLoading, setDailyLoading] = useState(false);

  const applyTimetableTimes = (timetable: any) => {
    if (!timetable) {
      clearDailyInputs();
      return;
    }
    const sun = splitTime(timetable.sunrise);
    setSunriseHour(sun.hour); setSunriseMin(sun.minute);
    
    const fAdhan = splitTime(timetable.fajr?.adhan);
    setFajrAdhanHour(fAdhan.hour); setFajrAdhanMin(fAdhan.minute);
    
    const fIqamah = splitTime(timetable.fajr?.iqamah);
    setFajrIqamahHour(fIqamah.hour); setFajrIqamahMin(fIqamah.minute);
    
    const dAdhan = splitTime(timetable.dhuhr?.adhan);
    setDhuhrAdhanHour(dAdhan.hour); setDhuhrAdhanMin(dAdhan.minute);
    
    const dIqamah = splitTime(timetable.dhuhr?.iqamah);
    setDhuhrIqamahHour(dIqamah.hour); setDhuhrIqamahMin(dIqamah.minute);
    
    const aAdhan = splitTime(timetable.asr?.adhan);
    setAsrAdhanHour(aAdhan.hour); setAsrAdhanMin(aAdhan.minute);
    
    const aIqamah = splitTime(timetable.asr?.iqamah);
    setAsrIqamahHour(aIqamah.hour); setAsrIqamahMin(aIqamah.minute);
    
    const mAdhan = splitTime(timetable.maghrib?.adhan);
    setMaghribAdhanHour(mAdhan.hour); setMaghribAdhanMin(mAdhan.minute);
    
    const mIqamah = splitTime(timetable.maghrib?.iqamah);
    setMaghribIqamahHour(mIqamah.hour); setMaghribIqamahMin(mIqamah.minute);
    
    const iAdhan = splitTime(timetable.isha?.adhan);
    setIshaAdhanHour(iAdhan.hour); setIshaAdhanMin(iAdhan.minute);
    
    const iIqamah = splitTime(timetable.isha?.iqamah);
    setIshaIqamahHour(iIqamah.hour); setIshaIqamahMin(iIqamah.minute);
  };

  const clearDailyInputs = () => {
    setSunriseHour(''); setSunriseMin('');
    setFajrAdhanHour(''); setFajrAdhanMin('');
    setFajrIqamahHour(''); setFajrIqamahMin('');
    setDhuhrAdhanHour(''); setDhuhrAdhanMin('');
    setDhuhrIqamahHour(''); setDhuhrIqamahMin('');
    setAsrAdhanHour(''); setAsrAdhanMin('');
    setAsrIqamahHour(''); setAsrIqamahMin('');
    setMaghribAdhanHour(''); setMaghribAdhanMin('');
    setMaghribIqamahHour(''); setMaghribIqamahMin('');
    setIshaAdhanHour(''); setIshaAdhanMin('');
    setIshaIqamahHour(''); setIshaIqamahMin('');
  };

  const fetchDailyTimesForDate = async (targetDateStr: string) => {
    if (!followedMosqueId) return;

    // 1. Check if we have this date in the cache
    if (targetDateStr in dailyCache) {
      applyTimetableTimes(dailyCache[targetDateStr]);
      return;
    }

    // 2. Otherwise, fetch from API
    setDailyLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/prayers?mosqueId=${followedMosqueId}&date=${targetDateStr}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const timetable = data[0];
          // Save to cache
          setDailyCache(prev => ({ ...prev, [targetDateStr]: timetable }));
          applyTimetableTimes(timetable);
        } else {
          // No record exists
          clearDailyInputs();
          setDailyCache(prev => ({ ...prev, [targetDateStr]: null }));
        }
      }
    } catch (err) {
      console.warn('Failed to fetch daily times', err);
    } finally {
      setDailyLoading(false);
    }
  };

  const fetchStaticDetails = async () => {
    if (!followedMosqueId) return;
    try {
      // Fetch Mosque details
      const mosqueRes = await fetch(`${apiUrl}/api/mosques/${followedMosqueId}`);
      if (mosqueRes.ok) {
        const mosqueData = await mosqueRes.json();
        if (mosqueData) {
          setJumuahSessions(mosqueData.jumuahSessions || []);
          setMosqueName(mosqueData.mosqueName || '');
          setAddress(mosqueData.address || '');
          setCity(mosqueData.city || '');
          setDistrict(mosqueData.district || '');
          setCountry(mosqueData.country || '');
          setPhone(mosqueData.phone || '');
          setEmail(mosqueData.email || '');
          setLatitude(mosqueData.latitude || 0);
          setLongitude(mosqueData.longitude || 0);
        }
      }

      // Fetch Announcements
      const annRes = await fetch(`${apiUrl}/api/announcements?mosqueId=${followedMosqueId}`);
      if (annRes.ok) {
        const annData = await annRes.json();
        setAnnouncements(annData || []);
      }
    } catch (err) {
      console.warn('Failed to load static mosque details', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchStaticDetails(),
      fetchDailyTimesForDate(dateStr)
    ]);
    setLoading(false);
  };

  // Initial full load
  useEffect(() => {
    loadData();
  }, [followedMosqueId]);

  // Date change lightweight load
  useEffect(() => {
    // Only load if the initial page load is finished
    if (!loading) {
      fetchDailyTimesForDate(dateStr);
    }
  }, [selectedDate]);

  const changeDate = (days: number) => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + days);
    setSelectedDate(next);
  };

  const handleSaveDaily = async () => {
    if (!token) return;

    // Validate and normalize all daily prayer times
    const timesToValidate = [
      { hour: sunriseHour, min: sunriseMin, label: 'Sunrise' },
      { hour: fajrAdhanHour, min: fajrAdhanMin, label: 'Fajr Adhan' },
      { hour: fajrIqamahHour, min: fajrIqamahMin, label: 'Fajr Iqamah' },
      { hour: dhuhrAdhanHour, min: dhuhrAdhanMin, label: 'Dhuhr Adhan' },
      { hour: dhuhrIqamahHour, min: dhuhrIqamahMin, label: 'Dhuhr Iqamah' },
      { hour: asrAdhanHour, min: asrAdhanMin, label: 'Asr Adhan' },
      { hour: asrIqamahHour, min: asrIqamahMin, label: 'Asr Iqamah' },
      { hour: maghribAdhanHour, min: maghribAdhanMin, label: 'Maghrib Adhan' },
      { hour: maghribIqamahHour, min: maghribIqamahMin, label: 'Maghrib Iqamah' },
      { hour: ishaAdhanHour, min: ishaAdhanMin, label: 'Isha Adhan' },
      { hour: ishaIqamahHour, min: ishaIqamahMin, label: 'Isha Iqamah' },
    ];

    const normalized: { [key: string]: string } = {};

    for (const item of timesToValidate) {
      const combined = `${item.hour}:${item.min}`;
      const res = validateTime(combined, item.label);
      if (!res.isValid) {
        Alert.alert('Validation Error', res.error);
        return;
      }
      normalized[item.label] = res.formatted;
    }

    setSaving(true);
    try {
      const payload = {
        mosqueId: followedMosqueId,
        date: dateStr,
        sunrise: normalized['Sunrise'],
        fajr: { adhan: normalized['Fajr Adhan'], iqamah: normalized['Fajr Iqamah'] },
        dhuhr: { adhan: normalized['Dhuhr Adhan'], iqamah: normalized['Dhuhr Iqamah'] },
        asr: { adhan: normalized['Asr Adhan'], iqamah: normalized['Asr Iqamah'] },
        maghrib: { adhan: normalized['Maghrib Adhan'], iqamah: normalized['Maghrib Iqamah'] },
        isha: { adhan: normalized['Isha Adhan'], iqamah: normalized['Isha Iqamah'] }
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
      
      // Update local memory cache with the newly saved times
      const savedTimetable = {
        sunrise: normalized['Sunrise'],
        fajr: { adhan: normalized['Fajr Adhan'], iqamah: normalized['Fajr Iqamah'] },
        dhuhr: { adhan: normalized['Dhuhr Adhan'], iqamah: normalized['Dhuhr Iqamah'] },
        asr: { adhan: normalized['Asr Adhan'], iqamah: normalized['Asr Iqamah'] },
        maghrib: { adhan: normalized['Maghrib Adhan'], iqamah: normalized['Maghrib Iqamah'] },
        isha: { adhan: normalized['Isha Adhan'], iqamah: normalized['Isha Iqamah'] }
      };
      setDailyCache(prev => ({ ...prev, [dateStr]: savedTimetable }));
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Check your internet connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveJumuah = async () => {
    if (!token) return;

    // Validate and normalize Friday Jumuah session times
    const validatedSessions = [];
    for (const session of jumuahSessions) {
      const khutbahRes = validateTime(session.khutbah, `Session ${session.sessionNumber} Khutbah`);
      if (!khutbahRes.isValid) {
        Alert.alert('Validation Error', khutbahRes.error);
        return;
      }
      const iqamahRes = validateTime(session.iqamah, `Session ${session.sessionNumber} Salah`);
      if (!iqamahRes.isValid) {
        Alert.alert('Validation Error', iqamahRes.error);
        return;
      }

      validatedSessions.push({
        sessionNumber: session.sessionNumber,
        khutbah: khutbahRes.formatted,
        iqamah: iqamahRes.formatted
      });
    }

    // Update local state
    setJumuahSessions(validatedSessions);

    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/mosques/${followedMosqueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jumuahSessions: validatedSessions })
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

  const updateJumuahSessionTime = (sessionNumber: number, field: 'khutbah' | 'iqamah', part: 'hour' | 'minute', val: string) => {
    const updated = jumuahSessions.map(s => {
      if (s.sessionNumber === sessionNumber) {
        const parts = splitTime(s[field]);
        parts[part] = val.replace(/[^0-9]/g, '').slice(0, 2);
        return { ...s, [field]: `${parts.hour}:${parts.minute}` };
      }
      return s;
    });
    setJumuahSessions(updated);
  };

  const renderSplitTimeInput = (
    hourVal: string,
    setHourVal: (val: string) => void,
    minVal: string,
    setMinVal: (val: string) => void,
    label: string
  ) => {
    return (
      <View style={styles.inputBoxHalf}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
        <View style={styles.splitInputContainer}>
          <TextInput 
            style={[styles.splitInput, { backgroundColor: colors.inputBg, color: colors.text }]}
            value={hourVal}
            onChangeText={(val) => {
              const cleaned = val.replace(/[^0-9]/g, '');
              if (cleaned.length <= 2) setHourVal(cleaned);
            }}
            placeholder="HH"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={2}
          />
          <Text style={[styles.fixedSeparator, { color: colors.text }]}>;</Text>
          <TextInput 
            style={[styles.splitInput, { backgroundColor: colors.inputBg, color: colors.text }]}
            value={minVal}
            onChangeText={(val) => {
              const cleaned = val.replace(/[^0-9]/g, '');
              if (cleaned.length <= 2) setMinVal(cleaned);
            }}
            placeholder="MM"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={2}
          />
        </View>
      </View>
    );
  };

  const handleSaveProfile = async () => {
    if (!token) return;
    if (!mosqueName || !address || !city || !district || !country) {
      Alert.alert('Error', 'Please fill in all required fields (Name, Address, City, District, Country).');
      return;
    }

    // Validate phone number if provided
    if (phone && !validatePhone(phone)) {
      Alert.alert('Validation Error', 'Please enter a valid telephone number.');
      return;
    }

    // Validate email if provided
    if (email && !validateEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    // Validate coordinate numbers
    const coordRes = validateCoordinates(latitude, longitude);
    if (!coordRes.isValid) {
      Alert.alert('Validation Error', coordRes.error);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/mosques/${followedMosqueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mosqueName,
          address,
          city,
          district,
          country,
          phone: phone ? phone.trim() : '',
          email: email ? email.trim().toLowerCase() : '',
          latitude: coordRes.latNum,
          longitude: coordRes.lngNum
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save profile');

      Alert.alert('Success', 'Mosque profile details updated successfully!');
      loadData();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Check your network connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!token) return;
    if (!newAnnTitle || !newAnnDesc) {
      Alert.alert('Error', 'Please provide a title and content for the announcement.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${apiUrl}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mosqueId: followedMosqueId,
          title: newAnnTitle,
          description: newAnnDesc,
          category: newAnnCategory
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post announcement');

      Alert.alert('Success', 'Announcement posted successfully!');
      setNewAnnTitle('');
      setNewAnnDesc('');
      setNewAnnCategory('General');
      loadData();
    } catch (err: any) {
      Alert.alert('Failed', err.message || 'Could not post announcement.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (annId: string) => {
    if (!token) return;
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to remove this announcement?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const res = await fetch(`${apiUrl}/api/announcements/${annId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (!res.ok) throw new Error('Failed to delete');
              loadData();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete announcement.');
            } finally {
              setSaving(false);
            }
          }
        }
      ]
    );
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'profile' && [styles.activeTab, { borderBottomColor: colors.activeTab }]]}
            onPress={() => setActiveTab('profile')}
          >
            <Text style={[styles.tabText, activeTab === 'profile' && { color: colors.activeTab, fontWeight: '800' }, { color: colors.textSecondary }]}>
              Mosque Profile
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'announcements' && [styles.activeTab, { borderBottomColor: colors.activeTab }]]}
            onPress={() => setActiveTab('announcements')}
          >
            <Text style={[styles.tabText, activeTab === 'announcements' && { color: colors.activeTab, fontWeight: '800' }, { color: colors.textSecondary }]}>
              Announcements
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {/* Tab 1: Daily Prayers */}
            {activeTab === 'daily' && (
              <View 
                style={styles.formContainer}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {/* Date Navigator */}
                <View style={[styles.dateNavigator, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navBtn}>
                    <ChevronLeft size={20} color={colors.text} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.dateInfo}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Calendar size={14} color={colors.primary} />
                    <Text style={[styles.dateLabel, { color: colors.text }]}>{displayDate}</Text>
                    {dailyLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => changeDate(1)} style={styles.navBtn}>
                    <ChevronRight size={20} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.formCardList}>
                  <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <Text style={[styles.cardHeader, { color: colors.textSecondary }]}>Sunrise Time</Text>
                    <View style={styles.cardInputRow}>
                      {renderSplitTimeInput(
                        sunriseHour,
                        setSunriseHour,
                        sunriseMin,
                        setSunriseMin,
                        'Sunrise'
                      )}
                      <View style={styles.inputBoxHalf} />
                    </View>
                  </View>

                  {[
                    { name: 'Fajr', adhanHour: fajrAdhanHour, setAdhanHour: setFajrAdhanHour, adhanMin: fajrAdhanMin, setAdhanMin: setFajrAdhanMin, iqamahHour: fajrIqamahHour, setIqamahHour: setFajrIqamahHour, iqamahMin: fajrIqamahMin, setIqamahMin: setFajrIqamahMin },
                    { name: 'Dhuhr', adhanHour: dhuhrAdhanHour, setAdhanHour: setDhuhrAdhanHour, adhanMin: dhuhrAdhanMin, setAdhanMin: setDhuhrAdhanMin, iqamahHour: dhuhrIqamahHour, setIqamahHour: setDhuhrIqamahHour, iqamahMin: dhuhrIqamahMin, setIqamahMin: setDhuhrIqamahMin },
                    { name: 'Asr', adhanHour: asrAdhanHour, setAdhanHour: setAsrAdhanHour, adhanMin: asrAdhanMin, setAdhanMin: setAsrAdhanMin, iqamahHour: asrIqamahHour, setIqamahHour: setAsrIqamahHour, iqamahMin: asrIqamahMin, setIqamahMin: setAsrIqamahMin },
                    { name: 'Maghrib', adhanHour: maghribAdhanHour, setAdhanHour: setMaghribAdhanHour, adhanMin: maghribAdhanMin, setAdhanMin: setMaghribAdhanMin, iqamahHour: maghribIqamahHour, setIqamahHour: setMaghribIqamahHour, iqamahMin: maghribIqamahMin, setIqamahMin: setMaghribIqamahMin },
                    { name: 'Isha', adhanHour: ishaAdhanHour, setAdhanHour: setIshaAdhanHour, adhanMin: ishaAdhanMin, setAdhanMin: setIshaAdhanMin, iqamahHour: ishaIqamahHour, setIqamahHour: setIshaIqamahHour, iqamahMin: ishaIqamahMin, setIqamahMin: setIshaIqamahMin }
                  ].map((prayer) => (
                    <View key={prayer.name} style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                      <Text style={[styles.cardHeader, { color: colors.text }]}>{prayer.name} Times</Text>
                      <View style={styles.cardInputRow}>
                        {renderSplitTimeInput(
                          prayer.adhanHour,
                          prayer.setAdhanHour,
                          prayer.adhanMin,
                          prayer.setAdhanMin,
                          'Adhan (Call)'
                        )}
                        {renderSplitTimeInput(
                          prayer.iqamahHour,
                          prayer.setIqamahHour,
                          prayer.iqamahMin,
                          prayer.setIqamahMin,
                          'Iqamah (Salah)'
                        )}
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
              </View>
            )}

            {/* Tab 2: Friday Jumuah */}
            {activeTab === 'jumuah' && (
              <View style={styles.formContainer}>
                <View style={styles.formCardList}>
                  <Text style={[styles.sectionHeadingText, { color: colors.textSecondary }]}>
                    Define the sessions/batches for the Friday Jumuah Congregation prayers.
                  </Text>

                  {jumuahSessions.map((session) => {
                    const khutbahParts = splitTime(session.khutbah);
                    const iqamahParts = splitTime(session.iqamah);
                    return (
                      <View key={session.sessionNumber} style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                        <View style={styles.cardHeaderRow}>
                          <Text style={[styles.cardHeader, { color: colors.text }]}>Session {session.sessionNumber}</Text>
                          <TouchableOpacity onPress={() => removeJumuahSession(session.sessionNumber)}>
                            <Trash2 size={16} color="#f43f5e" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.cardInputRow}>
                          {renderSplitTimeInput(
                            khutbahParts.hour,
                            (val) => updateJumuahSessionTime(session.sessionNumber, 'khutbah', 'hour', val),
                            khutbahParts.minute,
                            (val) => updateJumuahSessionTime(session.sessionNumber, 'khutbah', 'minute', val),
                            'Khutbah (Sermon)'
                          )}
                          {renderSplitTimeInput(
                            iqamahParts.hour,
                            (val) => updateJumuahSessionTime(session.sessionNumber, 'iqamah', 'hour', val),
                            iqamahParts.minute,
                            (val) => updateJumuahSessionTime(session.sessionNumber, 'iqamah', 'minute', val),
                            'Salah (Congregation)'
                          )}
                        </View>
                      </View>
                    );
                  })}

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
              </View>
            )}


            {/* Tab 3: Mosque Profile */}
            {activeTab === 'profile' && (
              <View style={styles.formContainer}>
                <View style={styles.formCardList}>
                  <Text style={[styles.sectionHeadingText, { color: colors.textSecondary }]}>
                    Update the general information of your Mosque displayed to congregation users.
                  </Text>

                  <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <Text style={[styles.cardHeader, { color: colors.text }]}>General Information</Text>

                    {/* Mosque Name */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Mosque Name *</Text>
                      <TextInput 
                        style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                        value={mosqueName}
                        onChangeText={setMosqueName}
                        placeholder="e.g. Colombo Grand Mosque"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>

                    {/* Address */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Address *</Text>
                      <TextInput 
                        style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="e.g. 152 New Moor Street"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>

                    {/* City & District */}
                    <View style={styles.cardInputRow}>
                      <View style={styles.inputBoxHalf}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>City *</Text>
                        <TextInput 
                          style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                          value={city}
                          onChangeText={setCity}
                          placeholder="e.g. Colombo"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>
                      <View style={styles.inputBoxHalf}>
                        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>District *</Text>
                        <TextInput 
                          style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                          value={district}
                          onChangeText={setDistrict}
                          placeholder="e.g. Colombo"
                          placeholderTextColor={colors.textSecondary}
                        />
                      </View>
                    </View>

                    {/* Country */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Country *</Text>
                      <TextInput 
                        style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                        value={country}
                        onChangeText={setCountry}
                        placeholder="e.g. Sri Lanka"
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>

                  <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <Text style={[styles.cardHeader, { color: colors.text }]}>Contact Details</Text>

                    {/* Phone & Email */}
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone Number</Text>
                      <TextInput 
                        style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="e.g. +94 11 234 5678"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="phone-pad"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email Address</Text>
                      <TextInput 
                        style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="e.g. info@mosque.lk"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                    onPress={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Save size={18} color="#ffffff" />
                        <Text style={styles.saveBtnText}>Save Mosque Details</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Tab 4: Announcements */}
            {activeTab === 'announcements' && (
              <View style={styles.formContainer}>
                {/* Create notice form */}
                <View style={[styles.formCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <Text style={[styles.cardHeader, { color: colors.text }]}>Publish New Notice</Text>
                  
                  {/* Notice Title */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Notice Title *</Text>
                    <TextInput 
                      style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text }]}
                      value={newAnnTitle}
                      onChangeText={setNewAnnTitle}
                      placeholder="e.g. Eid Assembly Timing Announcement"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  {/* Category Selection */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category</Text>
                    <View style={styles.categoryRow}>
                      {['General', 'Event', 'Class', 'Charity'].map(cat => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoryBadge,
                            { borderColor: colors.border },
                            newAnnCategory === cat && { backgroundColor: colors.primary, borderColor: colors.primary }
                          ]}
                          onPress={() => setNewAnnCategory(cat)}
                        >
                          <Text style={[
                            styles.categoryBadgeText,
                            { color: colors.textSecondary },
                            newAnnCategory === cat && { color: '#ffffff', fontWeight: '800' }
                          ]}>
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Notice Description */}
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Content / Message *</Text>
                    <TextInput 
                      style={[styles.textArea, { backgroundColor: colors.inputBg, color: colors.text }]}
                      value={newAnnDesc}
                      onChangeText={setNewAnnDesc}
                      placeholder="Type your announcement details here..."
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={4}
                    />
                  </View>

                  <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                    onPress={handleCreateAnnouncement}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Plus size={18} color="#ffffff" />
                        <Text style={styles.saveBtnText}>Publish Notice</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Notices List */}
                <Text style={[styles.sectionHeadingText, { color: colors.text, fontWeight: '800', marginTop: 8 }]}>
                  Active Notices ({announcements.length})
                </Text>
                
                <View style={styles.announcementsList}>
                  {announcements.map((ann) => (
                    <View key={ann._id} style={[styles.announcementCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                      <View style={styles.annHeaderRow}>
                        <View style={styles.annTitleGroup}>
                          <Megaphone size={14} color={colors.primary} />
                          <Text style={[styles.annTitle, { color: colors.text }]}>{ann.title}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteAnnouncement(ann._id)}>
                          <Trash2 size={16} color="#f43f5e" />
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={[styles.annDesc, { color: colors.textSecondary }]}>{ann.description}</Text>
                      
                      <View style={styles.annFooter}>
                        <View style={[styles.annBadge, { backgroundColor: colors.primary + '15' }]}>
                          <Text style={[styles.annBadgeText, { color: colors.primary }]}>{ann.category.toUpperCase()}</Text>
                        </View>
                        <Text style={[styles.annDate, { color: colors.textSecondary }]}>
                          {new Date(ann.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                    </View>
                  ))}
                  
                  {announcements.length === 0 && (
                    <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                      <Info size={24} color={colors.textSecondary} />
                      <Text style={[styles.emptyBoxText, { color: colors.textSecondary }]}>No active announcements posted yet.</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
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
    paddingHorizontal: 20,
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
    paddingBottom: 40,
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
    paddingVertical: 60,
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
  inputGroup: {
    gap: 6,
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
  textArea: {
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    fontWeight: '600',
    minHeight: 80,
    textAlignVertical: 'top',
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
    shadowOpacity: 0.1,
    elevation: 2,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 11,
  },
  announcementsList: {
    gap: 12,
  },
  announcementCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  annHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  annTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  annTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  annDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  annFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  annBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  annBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  annDate: {
    fontSize: 10,
  },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
  },
  emptyBoxText: {
    fontSize: 11,
  },
  splitInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  splitInput: {
    width: 60,
    height: 40,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  fixedSeparator: {
    fontSize: 18,
    fontWeight: '900',
    paddingHorizontal: 1,
  },
});
