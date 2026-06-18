'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, Megaphone, Sparkles, Smartphone, CheckCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { getHijriDate, getNextPrayer, formatTimeRemaining } from '../lib/prayerHelpers';

export default function LandingPage() {
  const router = useRouter();
  // Redirect root to dashboard to show prayer dashboard as initial page
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-10 h-10 rounded-full border-4 border-emerald-600 animate-spin" />
        <p className="mt-4 text-sm text-slate-600">Redirecting to prayer dashboard…</p>
      </div>
    </div>
  );
      
      {/* Navigation Header */}
      <header className="h-20 border-b border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-6 md:px-8 flex items-center justify-between">
          <Link href="/" className="text-xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            Masjid Connect
          </Link>

          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-emerald-400 transition-colors"
            >
              Admin Sign In
            </Link>
            <Link 
              href="/register" 
              className="hidden sm:inline-flex px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-900/10"
            >
              Register Mosque
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden border-b border-slate-200 dark:border-slate-900">
        {/* Glow gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Left Column: CTA */}
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">
              Platform Release v1.0
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
              Connect your{' '}
              <span className="text-emerald-600 dark:text-emerald-400">Community</span>{' '}
              with the Mosque
            </h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Masjid Connect is a complete, production-ready solution that bridges the communication gap between Islamic Centers and their congregations. Push live Adhan/Iqamah timings, share special events, and publish announcements directly to community smartphones.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Link 
                href="/register"
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 group"
              >
                <span>Register Your Mosque</span>
                <ArrowRight size={16} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#download"
                className="px-6 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Smartphone size={16} className="text-slate-400" />
                <span>Download Mobile App</span>
              </a>
            </div>
          </div>

          {/* Right Column: Visual Mockup (dynamic from API) */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl"></div>
            <div className="w-72 h-[500px] border border-slate-200 dark:border-slate-800 rounded-[40px] bg-slate-950 p-3 shadow-2xl relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-slate-950 rounded-b-2xl z-20"></div>
              <div className="w-full h-full bg-[#0a0f0d] rounded-[32px] overflow-hidden p-4 flex flex-col justify-between text-white relative">
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-950/80 to-transparent z-0 opacity-40"></div>
                <div className="relative z-10 space-y-4 pt-4">
                  <div className="flex justify-between items-center text-[10px]">
                    <div>
                      <h4 className="font-black text-emerald-400">{mosqueName}</h4>
                      <p className="text-slate-400">{city}</p>
                    </div>
                    <span className="text-slate-400">{hijriDate}</span>
                  </div>

                  {/* Next Prayer Display */}
                  {nextPrayer ? (
                    <div className="p-3 bg-emerald-950/60 border border-emerald-900/50 rounded-2xl text-center space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">Next Prayer {nextPrayer.type}</span>
                      <h3 className="text-xl font-bold">{nextPrayer.name} in {formatTimeRemaining(nextPrayer.secondsRemaining)}</h3>
                      <p className="text-[10px] text-slate-400">Adhan {nextPrayer.time}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-950/20 rounded-2xl text-center">
                      <span className="text-[10px] text-slate-400">No upcoming prayers</span>
                    </div>
                  )}

                  {/* Upcoming prayer card snippet */}
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Today Schedules</span>
                    <div className="space-y-1">
                      {['fajr','dhuhr','asr','maghrib','isha'].map((p) => (
                        <div key={p} className={`flex justify-between items-center p-2 ${nextPrayer?.name?.toLowerCase()===p ? 'bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs' : 'bg-slate-900/60 rounded-xl text-xs'}`}>
                          <span className="font-semibold text-emerald-400">{p.charAt(0).toUpperCase()+p.slice(1)}</span>
                          <span className="text-[10px] text-slate-400">{timetable?.[p]?.adhan || '—'}</span>
                          <span className="font-semibold">{timetable?.[p]?.iqamah || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative z-10 pt-4 border-t border-slate-900 text-center">
                  <span className="text-[8px] text-slate-500">Android Home Widget Support Built-in</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20 max-w-7xl mx-auto px-6 md:px-8 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Fully Integrated Modules</h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
            Admin dashboard and cross-platform mobile apps synchronizing seamlessly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-2xl space-y-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl w-12 h-12 flex items-center justify-center">
              <Clock size={24} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Prayer Schedules</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Configure daily Adhan and Iqamah times. Community members can access accurate schedules instantly.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-2xl space-y-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl w-12 h-12 flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Special Prayers</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Organize special configurations for Eid ul-Fitr, Eid ul-Adha, Qiyam, Taraweeh, or Janaza notifications.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-2xl space-y-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl w-12 h-12 flex items-center justify-center">
              <Megaphone size={24} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Announcements</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Publish categories of community events, announcements, fundraisers, or Quran classes with image attachments.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-900 rounded-2xl space-y-4">
            <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl w-12 h-12 flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Role-Based Access</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Delegate admin credentials. Mosque admins manage their respective center; Super Admins manage global variables.
            </p>
          </div>
        </div>
      </section>

      {/* Download Block */}
      <section id="download" className="py-16 bg-gradient-to-br from-slate-900 to-slate-950 border-t border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-black">Bring Masjid Connect to your Phone</h2>
            <p className="text-xs text-slate-400 max-w-md">
              Available for Android and iOS devices. Check count-down widgets directly on your home screen.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold transition-all">
              Get Android Widget & APK
            </button>
            <button className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold transition-all">
              Download on iOS App Store
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 mt-auto text-xs text-center text-slate-500">
        <p>© 2026 Masjid Connect. All rights reserved.</p>
      </footer>

    </div>
  );
}
