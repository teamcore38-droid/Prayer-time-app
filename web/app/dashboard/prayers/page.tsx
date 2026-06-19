'use client';

import React, { useEffect, useState } from 'react';
import { validateTime } from '../../../lib/validate';
import { Clock, Calendar, Check, AlertCircle, Sparkles } from 'lucide-react';

interface TimePair {
  adhan: string;
  iqamah: string;
}

interface PrayerTimeRow {
  _id?: string;
  mosqueId: string;
  date: string;
  sunrise: string;
  fajr: TimePair;
  dhuhr: TimePair;
  asr: TimePair;
  maghrib: TimePair;
  isha: TimePair;
}

interface Mosque {
  _id: string;
  mosqueName: string;
}

export default function PrayersPage() {
  const [userRole, setUserRole] = useState('');
  const [userMosqueId, setUserMosqueId] = useState('');
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [selectedMosqueId, setSelectedMosqueId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [upcomingPrayers, setUpcomingPrayers] = useState<PrayerTimeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // In-memory cache for quick UI updates (keyed by `${mosqueId}:${date}`)
  const [dailyCache, setDailyCache] = useState<Record<string, any>>({});
  const [dailyLoading, setDailyLoading] = useState(false);

  // Form Fields
  const [sunrise, setSunrise] = useState('06:00');
  const [fajrAdhan, setFajrAdhan] = useState('05:10');
  const [fajrIqamah, setFajrIqamah] = useState('05:30');
  const [dhuhrAdhan, setDhuhrAdhan] = useState('12:15');
  const [dhuhrIqamah, setDhuhrIqamah] = useState('12:30');
  const [asrAdhan, setAsrAdhan] = useState('15:45');
  const [asrIqamah, setAsrIqamah] = useState('16:00');
  const [maghribAdhan, setMaghribAdhan] = useState('18:22');
  const [maghribIqamah, setMaghribIqamah] = useState('18:27');
  const [ishaAdhan, setIshaAdhan] = useState('19:40');
  const [ishaIqamah, setIshaIqamah] = useState('20:00');

  // Bulk Panel
  const [bulkJson, setBulkJson] = useState('');

  useEffect(() => {
    const fetchSessionData = async () => {
      const token = localStorage.getItem('token');
      try {
        // Fetch current user context
        const meRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!meRes.ok) throw new Error();
        const meData = await meRes.json();
        setUserRole(meData.user.role);
        setUserMosqueId(meData.user.mosqueId || '');

        if (meData.user.role === 'super_admin') {
          // Fetch all mosques
          const mosquesRes = await fetch('/api/mosques');
          if (mosquesRes.ok) {
            const mosquesData = await mosquesRes.json();
            setMosques(mosquesData);
            if (mosquesData.length > 0) {
              setSelectedMosqueId(mosquesData[0]._id);
            }
          }
        } else {
          setSelectedMosqueId(meData.user.mosqueId || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessionData();
  }, []);

  // Fetch prayer schedules when mosque ID or date changes
  useEffect(() => {
    if (!selectedMosqueId) return;

    const applyTimetable = (row: any) => {
    if (row) {
      setSunrise(row.sunrise || '06:00');
      setFajrAdhan(row.fajr?.adhan || '05:10');
      setFajrIqamah(row.fajr?.iqamah || '05:30');
      setDhuhrAdhan(row.dhuhr?.adhan || '12:15');
      setDhuhrIqamah(row.dhuhr?.iqamah || '12:30');
      setAsrAdhan(row.asr?.adhan || '15:45');
      setAsrIqamah(row.asr?.iqamah || '16:00');
      setMaghribAdhan(row.maghrib?.adhan || '18:22');
      setMaghribIqamah(row.maghrib?.iqamah || '18:27');
      setIshaAdhan(row.isha?.adhan || '19:40');
      setIshaIqamah(row.isha?.iqamah || '20:00');
    } else {
      setSunrise('06:00');
      setFajrAdhan('05:10'); setFajrIqamah('05:30');
      setDhuhrAdhan('12:15'); setDhuhrIqamah('12:30');
      setAsrAdhan('15:45'); setAsrIqamah('16:00');
      setMaghribAdhan('18:22'); setMaghribIqamah('18:27');
      setIshaAdhan('19:40'); setIshaIqamah('20:00');
    }
    };

    const fetchPrayerForDate = async () => {
    if (!selectedMosqueId) return;
    const key = `${selectedMosqueId}:${selectedDate}`;

    // Quick UI update from in-memory cache
    if (dailyCache[key]) {
      applyTimetable(dailyCache[key]);
    }

    setDailyLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`/api/prayers?mosqueId=${selectedMosqueId}&date=${selectedDate}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        const row = data && data.length > 0 ? data[0] : null;
        setDailyCache(prev => ({ ...prev, [key]: row }));
        applyTimetable(row);
      } else {
        if (!dailyCache[key]) applyTimetable(null);
      }
    } catch (err) {
      console.error('fetchPrayerForDate failed', err);
      if (!dailyCache[key]) applyTimetable(null);
    } finally {
      setDailyLoading(false);
    }
    };

    const fetchUpcomingPrayers = async () => {
      try {
        const res = await fetch(`/api/prayers?mosqueId=${selectedMosqueId}`);
        if (res.ok) {
          const data = await res.json();
          // Slice only upcoming/recent 7 records
          setUpcomingPrayers(data.slice(0, 10));
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchPrayerForDate();
    fetchUpcomingPrayers();
  }, [selectedMosqueId, selectedDate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    const token = localStorage.getItem('token');

    // Validate times before sending to API
    const toValidate = [
      { val: sunrise, label: 'Sunrise' },
      { val: fajrAdhan, label: 'Fajr Adhan' },
      { val: fajrIqamah, label: 'Fajr Iqamah' },
      { val: dhuhrAdhan, label: 'Dhuhr Adhan' },
      { val: dhuhrIqamah, label: 'Dhuhr Iqamah' },
      { val: asrAdhan, label: 'Asr Adhan' },
      { val: asrIqamah, label: 'Asr Iqamah' },
      { val: maghribAdhan, label: 'Maghrib Adhan' },
      { val: maghribIqamah, label: 'Maghrib Iqamah' },
      { val: ishaAdhan, label: 'Isha Adhan' },
      { val: ishaIqamah, label: 'Isha Iqamah' },
    ];

    for (const item of toValidate) {
      const res = validateTime(item.val, item.label);
      if (!res.isValid) {
        setSaving(false);
        setStatusMessage({ type: 'error', text: res.error || `${item.label} is invalid` });
        return;
      }
    }

    const payload = {
      mosqueId: selectedMosqueId,
      date: selectedDate,
      sunrise,
      fajr: { adhan: fajrAdhan, iqamah: fajrIqamah },
      dhuhr: { adhan: dhuhrAdhan, iqamah: dhuhrIqamah },
      asr: { adhan: asrAdhan, iqamah: asrIqamah },
      maghrib: { adhan: maghribAdhan, iqamah: maghribIqamah },
      isha: { adhan: ishaAdhan, iqamah: ishaIqamah }
    };

    try {
      const res = await fetch('/api/prayers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update prayer times');
      }

      setStatusMessage({ type: 'success', text: 'Schedules updated successfully!' });

      // Refresh list
      const listRes = await fetch(`/api/prayers?mosqueId=${selectedMosqueId}`);
      if (listRes.ok) {
        const data = await listRes.json();
        setUpcomingPrayers(data.slice(0, 10));
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error saving data' });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkJson.trim()) return;
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    const token = localStorage.getItem('token');

    try {
      let parsed = JSON.parse(bulkJson);
      
      // Inject mosqueId to all records if missing
      if (Array.isArray(parsed)) {
        parsed = parsed.map(item => ({ ...item, mosqueId: selectedMosqueId }));
      } else {
        parsed.mosqueId = selectedMosqueId;
      }

      const res = await fetch('/api/prayers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(parsed)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to process bulk upload');
      }

      const resData = await res.json();
      setStatusMessage({ type: 'success', text: resData.message || 'Bulk upload complete!' });
      setBulkJson('');

      // Refresh list
      const listRes = await fetch(`/api/prayers?mosqueId=${selectedMosqueId}`);
      if (listRes.ok) {
        const data = await listRes.json();
        setUpcomingPrayers(data.slice(0, 10));
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Validation Error: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Mosque and Date Selector Headers */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-sm">
        <div className="flex-1 space-y-1">
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Clock className="text-primary" size={22} />
            <span>Prayer Timetable Planner</span>
          </h2>
          <p className="text-sm text-slate-400">Configure adhan (call to prayer) and iqamah (start time)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {userRole === 'super_admin' && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Mosque</span>
              <select
                value={selectedMosqueId}
                onChange={(e) => setSelectedMosqueId(e.target.value)}
                className="px-3 py-2 border border-[var(--border)] rounded-xl outline-none focus:border-primary text-sm bg-transparent"
              >
                {mosques.map(m => (
                  <option key={m._id} value={m._id}>{m.mosqueName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</span>
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] rounded-xl bg-transparent">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="outline-none text-sm bg-transparent border-none p-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {statusMessage.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
        }`}>
          {statusMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid: Editor Form and Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Form Editor */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <span>Daily Schedule Editor</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  {selectedDate}
                </span>
              </h3>
              <span className="text-xs text-slate-400">Time format: 24-Hour (HH:MM)</span>
            </div>

            {/* Sunrise Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-amber-500/5 p-4 rounded-2xl border border-amber-500/10">
              <div className="flex flex-col justify-center">
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Sparkles size={16} />
                  <span>Sunrise time</span>
                </span>
                <span className="text-xs text-slate-400 mt-0.5">Used as reference for Shuruq calculations</span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Shuruq Time</label>
                <input
                  type="text"
                  required
                  pattern="[0-2][0-9]:[0-5][0-9]"
                  value={sunrise}
                  onChange={(e) => setSunrise(e.target.value)}
                  placeholder="06:00"
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-transparent outline-none focus:border-amber-500 text-sm"
                />
              </div>
            </div>

            {/* Prayers grid */}
            <div className="space-y-4">
              {/* Fajr */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl">
                <span className="font-bold text-slate-800 dark:text-white">Fajr (Dawn)</span>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Adhan Time</label>
                  <input
                    type="text"
                    required
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    value={fajrAdhan}
                    onChange={(e) => setFajrAdhan(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-transparent text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Iqamah Time</label>
                  <input
                    type="text"
                    required
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    value={fajrIqamah}
                    onChange={(e) => setFajrIqamah(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-transparent text-sm"
                  />
                </div>
              </div>

              {/* Dhuhr */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl">
                <span className="font-bold text-slate-800 dark:text-white">Dhuhr (Midday)</span>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Adhan Time</label>
                  <input
                    type="text"
                    required
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    value={dhuhrAdhan}
                    onChange={(e) => setDhuhrAdhan(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-transparent text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Iqamah Time</label>
                  <input
                    type="text"
                    required
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    value={dhuhrIqamah}
                    onChange={(e) => setDhuhrIqamah(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-transparent text-sm"
                  />
                </div>
              </div>

              {/* Asr */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl">
                <span className="font-bold text-slate-800 dark:text-white">Asr (Afternoon)</span>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Adhan Time</label>
                  <input
                    type="text"
                    required
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    value={asrAdhan}
                    onChange={(e) => setAsrAdhan(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-transparent text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Iqamah Time</label>
                  <input
                    type="text"
                    required
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    value={asrIqamah}
                    onChange={(e) => setAsrIqamah(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-transparent text-sm"
                  />
                </div>
              </div>

              {/* Maghrib */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl">
                <span className="font-bold text-slate-800 dark:text-white">Maghrib (Sunset)</span>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Adhan Time</label>
                  <input
                    type="text"
                    required
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    value={maghribAdhan}
                    onChange={(e) => setMaghribAdhan(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-transparent text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Iqamah Time</label>
                  <input
                    type="text"
                    required
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    value={maghribIqamah}
                    onChange={(e) => setMaghribIqamah(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-transparent text-sm"
                  />
                </div>
              </div>

              {/* Isha */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-50 dark:bg-slate-900/20 p-4 rounded-xl">
                <span className="font-bold text-slate-800 dark:text-white">Isha (Night)</span>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Adhan Time</label>
                  <input
                    type="text"
                    required
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    value={ishaAdhan}
                    onChange={(e) => setIshaAdhan(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-transparent text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Iqamah Time</label>
                  <input
                    type="text"
                    required
                    pattern="[0-2][0-9]:[0-5][0-9]"
                    value={ishaIqamah}
                    onChange={(e) => setIshaIqamah(e.target.value)}
                    className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-transparent text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-950/10 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </form>

          {/* Bulk Paste Area */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 md:p-8 space-y-4 shadow-sm">
            <div>
              <h4 className="font-bold text-slate-800 dark:text-white">Bulk Schedule Upload</h4>
              <p className="text-xs text-slate-400 mt-1">
                Upload scheduling blocks using JSON formats. Useful for migrating monthly schedules.
              </p>
            </div>

            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <textarea
                value={bulkJson}
                onChange={(e) => setBulkJson(e.target.value)}
                placeholder='[{"date":"2026-06-14","sunrise":"06:01","fajr":{"adhan":"05:11","iqamah":"05:31"},"dhuhr":{"adhan":"12:16","iqamah":"12:31"},"asr":{"adhan":"15:46","iqamah":"16:01"},"maghrib":{"adhan":"18:23","iqamah":"18:28"},"isha":{"adhan":"19:41","iqamah":"20:01"}}]'
                rows={5}
                className="w-full p-4 border border-[var(--border)] rounded-xl bg-transparent font-mono text-xs outline-none focus:border-primary"
              ></textarea>
              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving || !bulkJson.trim()}
                  className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  Upload JSON Array
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Upcoming lists */}
        <div className="space-y-6">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white">Upcoming Timetable</h3>
              <p className="text-xs text-slate-400 mt-1">Overview of the upcoming days</p>
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[500px]">
              {upcomingPrayers.map((row) => (
                <div key={row._id} className="p-3 border border-[var(--border)] rounded-xl bg-slate-50/50 dark:bg-slate-900/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-1.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{row.date}</span>
                    <span className="text-[10px] text-slate-400">Shuruq: {row.sunrise}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                    <div className="bg-[var(--card)] p-1 border border-[var(--border)] rounded">
                      <span className="block font-bold text-slate-500">Fajr</span>
                      <span className="text-slate-800 dark:text-white">{row.fajr.adhan}</span>
                      <span className="block text-slate-400">{row.fajr.iqamah}</span>
                    </div>
                    <div className="bg-[var(--card)] p-1 border border-[var(--border)] rounded">
                      <span className="block font-bold text-slate-500">Dhuhr</span>
                      <span className="text-slate-800 dark:text-white">{row.dhuhr.adhan}</span>
                      <span className="block text-slate-400">{row.dhuhr.iqamah}</span>
                    </div>
                    <div className="bg-[var(--card)] p-1 border border-[var(--border)] rounded">
                      <span className="block font-bold text-slate-500">Asr</span>
                      <span className="text-slate-800 dark:text-white">{row.asr.adhan}</span>
                      <span className="block text-slate-400">{row.asr.iqamah}</span>
                    </div>
                    <div className="bg-[var(--card)] p-1 border border-[var(--border)] rounded">
                      <span className="block font-bold text-slate-500">Maghrib</span>
                      <span className="text-slate-800 dark:text-white">{row.maghrib.adhan}</span>
                      <span className="block text-slate-400">{row.maghrib.iqamah}</span>
                    </div>
                    <div className="bg-[var(--card)] p-1 border border-[var(--border)] rounded">
                      <span className="block font-bold text-slate-500">Isha</span>
                      <span className="text-slate-800 dark:text-white">{row.isha.adhan}</span>
                      <span className="block text-slate-400">{row.isha.iqamah}</span>
                    </div>
                  </div>
                </div>
              ))}
              {upcomingPrayers.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">No schedules configured yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
