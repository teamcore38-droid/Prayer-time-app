import { Stack, DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="mosque-info" />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
