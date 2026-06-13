import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API URL (pointing to localhost or production domain)
// For local development on emulator, use your machine IP instead of localhost.
// We'll define a fallback and let it be configured.
export const API_URL = 'https://prayer-time-app-ten.vercel.app'; // Change to user's deployment URL in production

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  mosqueId: string | null;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  followedMosqueId: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, user: UserProfile) => Promise<void>;
  logout: () => Promise<void>;
  followMosque: (mosqueId: string) => Promise<void>;
  apiUrl: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [followedMosqueId, setFollowedMosqueId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        const storedUser = await AsyncStorage.getItem('user');
        const storedMosqueId = await AsyncStorage.getItem('followedMosqueId');

        if (storedMosqueId) {
          setFollowedMosqueId(storedMosqueId);
        }

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verify token against API
          try {
            const res = await fetch(`${API_URL}/api/auth/me`, {
              headers: {
                'Authorization': `Bearer ${storedToken}`,
              },
            });
            if (res.ok) {
              const data = await res.json();
              setToken(storedToken);
              setUser(data.user);
              // If the user is a Mosque Admin, automatically set their followed mosque to their assigned mosque
              if (data.user.role === 'mosque_admin' && data.user.mosqueId) {
                setFollowedMosqueId(data.user.mosqueId);
                await AsyncStorage.setItem('followedMosqueId', data.user.mosqueId);
              }
            } else {
              // Token expired
              await logout();
            }
          } catch (err) {
            console.log('API unreachable, using cached session details');
          }
        }
      } catch (e) {
        console.warn('Failed to load session details', e);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (newToken: string, newUser: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));

    if (newUser.role === 'mosque_admin' && newUser.mosqueId) {
      setFollowedMosqueId(newUser.mosqueId);
      await AsyncStorage.setItem('followedMosqueId', newUser.mosqueId);
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  };

  const followMosque = async (mosqueId: string) => {
    setFollowedMosqueId(mosqueId);
    await AsyncStorage.setItem('followedMosqueId', mosqueId);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        followedMosqueId,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
        followMosque,
        apiUrl: API_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
