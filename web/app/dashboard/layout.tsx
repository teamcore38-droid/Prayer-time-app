'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  MapPin, 
  Clock, 
  Sparkles, 
  Megaphone, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  User,
  Moon,
  Sun
} from 'lucide-react';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  mosqueId: string | null;
}

interface MosqueDetails {
  _id: string;
  mosqueName: string;
  city: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mosque, setMosque] = useState<MosqueDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check dark mode preference
    const isDark = document.documentElement.classList.contains('dark') || 
                   localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }

    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        const data = await res.json();
        setUser(data.user);
        setMosque(data.mosque);
      } catch (err) {
        console.error('Failed to load user profile', err);
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-slate-500 font-medium animate-pulse">Connecting to Majid Connect...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'mosque_admin'] },
    { name: 'Mosques', href: '/dashboard/mosques', icon: MapPin, roles: ['super_admin'] },
    { name: 'Prayer Times', href: '/dashboard/prayers', icon: Clock, roles: ['super_admin', 'mosque_admin'] },
    { name: 'Special Prayers', href: '/dashboard/special-prayers', icon: Sparkles, roles: ['super_admin', 'mosque_admin'] },
    { name: 'Announcements', href: '/dashboard/announcements', icon: Megaphone, roles: ['super_admin', 'mosque_admin'] },
    { name: 'Users', href: '/dashboard/users', icon: Users, roles: ['super_admin'] },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['super_admin', 'mosque_admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen bg-[var(--background)] flex">
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-950 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex md:flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Masjid Connect
            </span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Mosque Context Indicator */}
        {mosque && (
          <div className="px-6 py-3 bg-emerald-950/60 border-b border-emerald-900/50 flex flex-col gap-0.5">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Active Mosque</span>
            <span className="text-xs font-semibold text-emerald-100 truncate">{mosque.mosqueName}</span>
            <span className="text-[10px] text-emerald-400/70">{mosque.city}</span>
          </div>
        )}

        {/* Navigation List */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all group ${isActive ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight size={14} className="text-emerald-300" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Profile Section */}
        <div className="p-4 border-t border-slate-900 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-emerald-800 flex items-center justify-center text-white font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{user?.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 transition-colors"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--border)] bg-[var(--card)] shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">
              {filteredNavItems.find(item => item.href === pathname)?.name || 'Admin Panel'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              aria-label="Toggle Theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>

            {/* Quick Profile Icon */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 hidden sm:inline">
                {user?.email}
              </span>
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
        ></div>
      )}
    </div>
  );
}
