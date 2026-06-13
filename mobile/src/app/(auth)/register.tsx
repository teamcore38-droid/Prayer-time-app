import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator,
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Lock, AlertCircle, ArrowLeft } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { login, apiUrl } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'mosque_admin' }) // Default mobile registers as mosque admin
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      await login(data.token, data.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Network error, please try again.');
    } finally {
      setLoading(false);
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
      <TouchableOpacity 
        style={styles.backBtn}
        onPress={() => router.replace('/(auth)/login')}
      >
        <ArrowLeft size={18} color={colors.text} />
        <Text style={[styles.backText, { color: colors.text }]}>Back to Login</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.brand}>
          <Text style={[styles.brandTitle, { color: colors.primary }]}>Register Center</Text>
          <Text style={[styles.brandDesc, { color: colors.textSecondary }]}>Create a Mosque Administrator Profile</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={14} color="#f43f5e" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {/* Name input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.inputBg }]}>
              <User size={16} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Imam Ahmed"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                style={[styles.input, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Email input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.inputBg }]}>
              <Mail size={16} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="imam@masjid.org"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Password input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.inputBg }]}>
              <Lock size={16} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                style={[styles.input, { color: colors.text }]}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={[styles.btn, { backgroundColor: colors.primary }]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.btnText}>Register Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  },
  backText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 24,
    marginTop: -20,
  },
  brand: {
    alignItems: 'center',
    gap: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandDesc: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff1f2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffe4e6',
  },
  errorText: {
    color: '#e11d48',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
  },
  btn: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '700',
  }
});
