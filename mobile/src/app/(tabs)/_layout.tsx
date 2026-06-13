import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Home, Clock, Sparkles, Megaphone, Settings } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const primaryColor = isDark ? '#10b981' : '#064e3b';
  const inactiveColor = isDark ? '#64748b' : '#94a3b8';
  const tabBarBg = isDark ? '#090f0d' : '#ffffff';
  const borderTopColor = isDark ? '#1b2c27' : '#e2e8f0';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopColor: borderTopColor,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="prayers"
        options={{
          title: 'Prayers',
          tabBarIcon: ({ color }) => <Clock size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="special-prayers"
        options={{
          title: 'Specials',
          tabBarIcon: ({ color }) => <Sparkles size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Notices',
          tabBarIcon: ({ color }) => <Megaphone size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}
