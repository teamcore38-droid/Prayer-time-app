'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getHijriDate, getNextPrayer, formatTimeRemaining } from '../../lib/prayerHelpers';

const SAMPLE_TIMETABLE = {
  sunrise: '05:24',
  fajr: { adhan: '04:45', iqamah: '04:55' },
  dhuhr: { adhan: '12:15', iqamah: '12:25' },
  asr: { adhan: '15:40', iqamah: '15:50' },
  maghrib: { adhan: '18:08', iqamah: '18:18' },
  isha: { adhan: '19:32', iqamah: '19:42' },
};

const SAMPLE_ANNOUNCEMENTS = [
  {
    id: 'a1',
    title: 'Friday Quran Recitation Class',
    description: 'Join the weekly Quran class after Isha with Sheikh Ahmed. All ages are welcome.',
    category: 'Class',
    date: 'Today',
  },
  {
    id: 'a2',
    title: 'Community Iftar Event',
    description: 'Bring your family for a shared iftar under the mosque canopy at Maghrib.',
    category: 'Event',
    date: 'Tomorrow',
  },
  {
    id: 'a3',
    title: 'Prayer Reminder Alerts',
    description: 'Enable reminders to receive prayer countdowns and announcement alerts.',
    category: 'Settings',
    date: 'Today',
  },
];

const DEFAULT_NOTIFICATIONS = {
  prayerReminders: true,
  announcementAlerts: true,
  congregationUpdates: false,
};

export default function HomePage() {
  const [mosqueName, setMosqueName] = useState('Masjid Al-Falah');
  const [city, setCity] = useState('Kuala Lumpur');
  const [hijriDate, setHijriDate] = useState('');
  const [timetable, setTimetable] = useState<any>(SAMPLE_TIMETABLE);
  const [nextPrayer, setNextPrayer] = useState<any>(null);
  const [announcements, setAnnouncements] = useState(SAMPLE_ANNOUNCEMENTS);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setHijriDate(getHijriDate());
    const loadData = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [pRes, mRes] = await Promise.all([
          fetch(`/api/prayers?date=${today}`),
          fetch('/api/mosques'),
        ]);

        if (pRes.ok) {
          const prs = await pRes.json();
          if (Array.isArray(prs) && prs.length) {
            setTimetable(prs[0]);
          }
        }

        if (mRes.ok) {
          const mos = await mRes.json();
          if (Array.isArray(mos) && mos.length) {
            setMosqueName(mos[0].mosqueName || mosqueName);
            setCity(mos[0].city || city);
          }
        }

        const annRes = await fetch('/api/announcements?mosqueId=default');
        if (annRes.ok) {
          const data = await annRes.json();
          if (Array.isArray(data) && data.length) {
            setAnnouncements(data.slice(0, 3).map((item: any) => ({
              id: item._id,
              title: item.title,
              description: item.description,
              category: item.category || 'Announcement',
              date: new Date(item.createdAt).toLocaleDateString(),
            })));
          }
        }
      } catch (error) {
        setErrorMessage('Network unavailable; showing sample data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const update = () => {
      if (timetable) {
        setNextPrayer(getNextPrayer(timetable));
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timetable]);

  const prayerRows = useMemo(
    () => [
      { name: 'Fajr', time: timetable?.fajr?.adhan, iqamah: timetable?.fajr?.iqamah },
      { name: 'Dhuhr', time: timetable?.dhuhr?.adhan, iqamah: timetable?.dhuhr?.iqamah },
      { name: 'Asr', time: timetable?.asr?.adhan, iqamah: timetable?.asr?.iqamah },
      { name: 'Maghrib', time: timetable?.maghrib?.adhan, iqamah: timetable?.maghrib?.iqamah },
      { name: 'Isha', time: timetable?.isha?.adhan, iqamah: timetable?.isha?.iqamah },
    ],
    [timetable]
  );

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-5">
          <section className="rounded-[28px] border border-slate-200/80 bg-white/90 dark:border-slate-800/80 dark:bg-slate-950/95 shadow-xl shadow-slate-900/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-600">Prayer Home</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight">Masjid Connect</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Updated live with prayer times, announcements, and notification settings for your community.</p>
              </div>
              <div className="rounded-3xl bg-emerald-600/10 px-4 py-3 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <p className="text-xs uppercase tracking-[0.2em] font-semibold">{hijriDate}</p>
                <p className="mt-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-100">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1.5fr_1fr]">
              <div className="rounded-[28px] border border-slate-200/80 bg-slate-950/95 p-5 text-white shadow-lg shadow-slate-950/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{mosqueName}</p>
                    <h2 className="mt-2 text-2xl font-black">{city}</h2>
                  </div>
                  <span className="rounded-2xl bg-slate-800/90 px-3 py-2 text-xs uppercase tracking-[0.22em] text-slate-300">Live</span>
                </div>

                <div className="mt-6 rounded-[28px] bg-white/5 p-5">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-emerald-300">Next prayer</p>
                  {nextPrayer ? (
                    <div className="mt-4 space-y-2">
                      <div className="text-xl font-black tracking-tight text-white">{nextPrayer.name} {nextPrayer.type}</div>
                      <div className="text-4xl font-black tracking-tight">{formatTimeRemaining(nextPrayer.secondsRemaining)}</div>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Scheduled at {nextPrayer.time}</p>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-300">Prayer timetable not available yet.</p>
                  )}
                </div>

                <div className="mt-6 grid gap-3">
                  {prayerRows.map((item) => (
                    <div key={item.name} className="rounded-3xl bg-slate-900/80 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{item.name}</p>
                          <p className="text-xs text-slate-500">Adhan / Iqamah</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white">{item.time || '—'}</p>
                          <p className="text-xs text-emerald-300">{item.iqamah || '—'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/95">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Notification</p>
                      <h3 className="mt-2 text-lg font-black">Stay informed</h3>
                    </div>
                    <div className="rounded-3xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700">Mobile style</div>
                  </div>

                  <div className="mt-5 space-y-4">
                    {(
                      Object.keys(notifications) as Array<keyof typeof notifications>
                    ).map((key) => (
                      <button
                        key={key}
                        onClick={() => toggleNotification(key)}
                        className="flex w-full items-center justify-between rounded-3xl border px-4 py-4 text-left transition hover:border-emerald-300/80"
                        type="button"
                      >
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{key === 'prayerReminders' ? 'Prayer reminders' : key === 'announcementAlerts' ? 'Announcements' : 'Congregation updates'}</p>
                          <p className="text-xs text-slate-500">{key === 'prayerReminders' ? 'Receive countdown and adhan alerts' : key === 'announcementAlerts' ? 'Get broadcast announcements' : 'Club updates and mosque notices'}</p>
                        </div>
                        <div className={`h-6 w-11 rounded-full p-1 transition ${notifications[key] ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                          <div className={`h-4 w-4 rounded-full bg-white shadow-md transition ${notifications[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/95">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Announcements</p>
                      <h3 className="mt-2 text-lg font-black">Latest updates</h3>
                    </div>
                    <Link href="/dashboard/announcements" className="text-xs font-semibold text-emerald-600">View all</Link>
                  </div>

                  <div className="mt-5 space-y-3">
                    {announcements.map((item) => (
                      <div key={item.id} className="rounded-3xl bg-slate-100 p-4 dark:bg-slate-950/80">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.category} • {item.date}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {errorMessage ? (
              <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
                {errorMessage}
              </div>
            ) : null}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/95">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Quick actions</h3>
              <div className="mt-4 space-y-3">
                <Link href="/login" className="block rounded-3xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-emerald-500 dark:border-slate-800 dark:text-slate-100">Sign in as mosque admin</Link>
                <Link href="/dashboard/settings" className="block rounded-3xl border border-slate-200 px-4 py-4 text-sm font-semibold text-slate-900 transition hover:border-emerald-500 dark:border-slate-800 dark:text-slate-100">Manage mosque settings</Link>
              </div>
            </div>
            <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/95">
              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Community overview</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-3xl bg-slate-100 p-4 dark:bg-slate-950/80">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Small prayer hall status</p>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Open</span>
                </div>
                <div className="flex items-center justify-between rounded-3xl bg-slate-100 p-4 dark:bg-slate-950/80">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications enabled</p>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">{Object.values(notifications).filter(Boolean).length}/3</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
