import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Mail, CheckCircle, ArrowLeft } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

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
        {submitted ? (
          <View style={styles.submittedContainer}>
            <CheckCircle size={48} color={colors.primary} />
            <Text style={[styles.submittedTitle, { color: colors.text }]}>Check your email</Text>
            <Text style={[styles.submittedSubtitle, { color: colors.textSecondary }]}>
              We have sent instructions to reset your password if an account is registered with {email}.
            </Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              style={[styles.btn, { backgroundColor: colors.primary, width: '100%' }]}
            >
              <Text style={styles.btnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.brand}>
              <Text style={[styles.brandTitle, { color: colors.primary }]}>Reset Password</Text>
              <Text style={[styles.brandDesc, { color: colors.textSecondary }]}>
                Receive link to regain access
              </Text>
            </View>

            <View style={styles.form}>
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

              <TouchableOpacity
                onPress={() => setSubmitted(true)}
                style={[styles.btn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.btnText}>Send Reset Link</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    marginTop: -40,
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
  submittedContainer: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 12,
  },
  submittedTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  submittedSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  }
});
