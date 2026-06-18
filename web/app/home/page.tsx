'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHijriDate, getNextPrayer, formatTimeRemaining } from '../../lib/prayerHelpers';

export default function HomePage() {
  const [mosqueName, setMosqueName] = useState('Masjid Al-Falah');
  const [city, setCity] = useState('Kuala Lumpur');
  const [timetable, setTimetable] = useState<any>(null);
  const [nextPrayer, setNextPrayer] = useState<any>(null);
  const [hijriDate, setHijriDate] = useState('');

  useEffect(() => {
    setHijriDate(getHijriDate());
    const load = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const pRes = await fetch(`/api/prayers?date=${today}`);
        if (pRes.ok) {
          const prs = await pRes.json();
          if (Array.isArray(prs) && prs.length) setTimetable(prs[0]);
        }
        const mRes = await fetch('/api/mosques');
        if (mRes.ok) {
          const mos = await mRes.json();
          if (Array.isArray(mos) && mos.length) {
            setMosqueName(mos[0].mosqueName || mosqueName);
            setCity(mos[0].city || city);
          }
        }
      } catch (e) {
        console.warn('Home load failed', e);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const update = () => {
      if (timetable) {
        const info = getNextPrayer(timetable);
        setNextPrayer(info);
      }
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [timetable]);

  const timetableRows = timetable
    ? ['fajr','dhuhr','asr','maghrib','isha'].map((p:any) => ({
      name: p.charAt(0).toUpperCase()+p.slice(1),
      adhan: timetable[p]?.adhan || '—',
      iqamah: timetable[p]?.iqamah || '—',
    }))
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      <header className="h-20 border-b border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto h-full px-6 md:px-8 flex items-center justify-between">
          <Link href="/" className="text-xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Masjid Connect</Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold text-slate-600">Admin Sign In</Link>
            <Link href="/register" className="hidden sm:inline-flex px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">Register Mosque</Link>
          </div>
        </div>
      </header>

      <main className="py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl font-black">Connect your <span className="text-emerald-600">Community</span> with the Mosque</h1>
            <p className="mt-4 text-sm text-slate-500">Public prayer dashboard with live countdown and today schedules.</p>
          </div>

          <div className="flex justify-center">
            <div className="w-72 h-[420px] bg-[#0a0f0d] rounded-3xl p-4 text-white">
              <div className="mb-2 flex justify-between">
                <div>
                  <div className="font-black text-emerald-400">{mosqueName}</div>
                  <div className="text-xs text-slate-400">{city}</div>
                </div>
                <div className="text-xs text-slate-400">{hijriDate}</div>
              </div>

              <div className="mt-4 p-3 bg-emerald-950/60 rounded-2xl text-center">
                {nextPrayer ? (
                  <>
                    <div className="text-[9px] text-emerald-400 uppercase">Next {nextPrayer.type}</div>
                    <div className="text-xl font-bold">{nextPrayer.name} in {formatTimeRemaining(nextPrayer.secondsRemaining)}</div>
                    <div className="text-xs text-slate-400">{nextPrayer.time}</div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400">No upcoming prayers</div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="text-[9px] text-slate-500 uppercase">Today Schedules</div>
                {timetableRows.map((r:any) => (
                  <div key={r.name} className="flex justify-between bg-slate-900/60 rounded-xl p-2 text-xs">
                    <div className="font-semibold text-emerald-400">{r.name}</div>
                    <div className="text-slate-400">{r.adhan}</div>
                    <div className="font-semibold">{r.iqamah}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
