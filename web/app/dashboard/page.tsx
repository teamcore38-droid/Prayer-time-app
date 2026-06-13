'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  MapPin, 
  Clock, 
  Megaphone, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Settings,
  CalendarDays
} from 'lucide-react';

interface Stats {
  users: number;
  mosques?: number;
  devices: number;
  prayers?: number;
  specialPrayers?: number;
  announcements?: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [scope, setScope] = useState<'global' | 'mosque'>('mosque');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/dashboard-stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error('Failed to load stats');
        }

        const data = await res.json();
        setStats(data.stats);
        setScope(data.scope);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
        <p className="font-semibold">Error Loading Statistics</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome & Banner Header */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-emerald-950 to-teal-900 text-white relative overflow-hidden shadow-xl shadow-emerald-950/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl -ml-20 -mb-20"></div>

        <div className="relative z-10 space-y-3 max-w-xl">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">
            Control Center
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Welcome to Masjid Connect
          </h2>
          <p className="text-sm md:text-base text-emerald-100/90 leading-relaxed">
            {scope === 'global' 
              ? 'Manage registered mosques, allocate administration access, and track application metrics globally.' 
              : 'Update prayer times, dispatch announcements, and publish special prayer tables to your community in real-time.'}
          </p>
        </div>
      </div>

      {/* Grid Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {scope === 'global' ? (
          <>
            {/* Global User Card */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-4 right-4 p-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-500">Total Users</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-2">
                {stats?.users}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-4">
                <TrendingUp size={12} />
                <span>Active platform accounts</span>
              </p>
            </div>

            {/* Global Mosque Card */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-4 right-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <MapPin size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-500">Total Mosques</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-2">
                {stats?.mosques}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-4">
                Across cities and districts
              </p>
            </div>

            {/* Global Devices Card */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-4 right-4 p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-500">Active Devices</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-2">
                {stats?.devices}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-4">
                Receiving push notifications
              </p>
            </div>

            {/* Global Prayer Schedules */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-4 right-4 p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Clock size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-500">Timetable Records</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-2">
                {stats?.prayers}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-4">
                Total calendar rows uploaded
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Mosque Users */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-4 right-4 p-3 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform">
                <Users size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-500">Mosque Members</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-2">
                {stats?.users}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-4">
                Community members associated
              </p>
            </div>

            {/* Special Prayers */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-4 right-4 p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Sparkles size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-500">Special Prayers</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-2">
                {stats?.specialPrayers}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-4">
                Taraweeh, Eid, & Janazas
              </p>
            </div>

            {/* Announcements */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-4 right-4 p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Megaphone size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-500">Announcements</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-2">
                {stats?.announcements}
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-4">
                Events, classes, fundraisers
              </p>
            </div>

            {/* Subscribers */}
            <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-4 right-4 p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <TrendingUp size={24} />
              </div>
              <p className="text-sm font-semibold text-slate-500">Push Subscribers</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-2">
                {stats?.devices}
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-4">
                Subscribed device tokens
              </p>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Quick Tasks</h3>
          <p className="text-sm text-slate-400">Perform standard operations immediately</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link 
            href="/dashboard/prayers"
            className="p-5 rounded-xl border border-emerald-800/10 bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-500/10 transition-all flex flex-col justify-between h-40 group"
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg w-10 h-10 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors flex items-center gap-1.5">
                <span>Update Prayer Times</span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-0 group-hover:translate-x-1 duration-200" />
              </h4>
              <p className="text-xs text-slate-400 mt-1">Configure Adhan & Iqamah schedules</p>
            </div>
          </Link>

          <Link 
            href="/dashboard/announcements"
            className="p-5 rounded-xl border border-amber-800/10 bg-amber-50/20 dark:bg-amber-950/10 hover:bg-amber-500/10 transition-all flex flex-col justify-between h-40 group"
          >
            <div className="p-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg w-10 h-10 flex items-center justify-center">
              <Megaphone size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors flex items-center gap-1.5">
                <span>Post Announcement</span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-0 group-hover:translate-x-1 duration-200" />
              </h4>
              <p className="text-xs text-slate-400 mt-1">Share news and Ramadan updates</p>
            </div>
          </Link>

          <Link 
            href="/dashboard/special-prayers"
            className="p-5 rounded-xl border border-teal-800/10 bg-teal-50/20 dark:bg-teal-950/10 hover:bg-teal-500/10 transition-all flex flex-col justify-between h-40 group"
          >
            <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-lg w-10 h-10 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white group-hover:text-primary transition-colors flex items-center gap-1.5">
                <span>Manage Special Prayers</span>
                <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-0 group-hover:translate-x-1 duration-200" />
              </h4>
              <p className="text-xs text-slate-400 mt-1">Schedule Eid, Janaza, or Qiyam</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
