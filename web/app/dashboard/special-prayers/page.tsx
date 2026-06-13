'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Calendar, Clock, Trash2, Plus, X } from 'lucide-react';

interface SpecialPrayer {
  _id: string;
  mosqueId: string;
  title: string;
  date: string;
  adhanTime?: string;
  iqamahTime: string;
  description?: string;
  createdAt: string;
}

interface Mosque {
  _id: string;
  mosqueName: string;
}

export default function SpecialPrayersPage() {
  const [userRole, setUserRole] = useState('');
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [selectedMosqueId, setSelectedMosqueId] = useState('');
  const [specialPrayers, setSpecialPrayers] = useState<SpecialPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [adhanTime, setAdhanTime] = useState('');
  const [iqamahTime, setIqamahTime] = useState('');
  const [description, setDescription] = useState('');

  const fetchSessionAndMosques = async () => {
    const token = localStorage.getItem('token');
    try {
      const meRes = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!meRes.ok) throw new Error();
      const meData = await meRes.json();
      setUserRole(meData.user.role);

      if (meData.user.role === 'super_admin') {
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

  const fetchSpecialPrayers = async () => {
    if (!selectedMosqueId) return;
    try {
      const res = await fetch(`/api/special-prayers?mosqueId=${selectedMosqueId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSpecialPrayers(data);
    } catch (err) {
      console.error('Failed to load special prayers', err);
    }
  };

  useEffect(() => {
    fetchSessionAndMosques();
  }, []);

  useEffect(() => {
    fetchSpecialPrayers();
  }, [selectedMosqueId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const payload = {
      mosqueId: selectedMosqueId,
      title,
      date,
      adhanTime: adhanTime || undefined,
      iqamahTime,
      description
    };

    try {
      const res = await fetch('/api/special-prayers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create special prayer');
      }

      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setDate('');
      setAdhanTime('');
      setIqamahTime('');
      setDescription('');
      // Reload list
      fetchSpecialPrayers();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this special prayer event?')) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/special-prayers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete');
      }

      fetchSpecialPrayers();
    } catch (err: any) {
      alert(err.message || 'Error deleting event');
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="text-amber-500" size={22} />
            <span>Special Prayers Planner</span>
          </h2>
          <p className="text-sm text-slate-400">Schedule Tarawih, Eid, Janaza, or custom prayer congregations</p>
        </div>

        <div className="flex items-center gap-3">
          {userRole === 'super_admin' && (
            <select
              value={selectedMosqueId}
              onChange={(e) => setSelectedMosqueId(e.target.value)}
              className="px-3 py-2 border border-[var(--border)] rounded-xl outline-none text-sm bg-[var(--card)]"
            >
              {mosques.map(m => (
                <option key={m._id} value={m._id}>{m.mosqueName}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-900/10 flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Schedule Prayer</span>
          </button>
        </div>
      </div>

      {/* Special Prayers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {specialPrayers.map((prayer) => (
          <div key={prayer._id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  Special Congregation
                </span>
                <h4 className="font-bold text-slate-800 dark:text-white text-base">{prayer.title}</h4>
              </div>
              
              <button
                onClick={() => handleDelete(prayer._id)}
                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                title="Delete Event"
              >
                <Trash2 size={15} />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed min-h-[40px]">
              {prayer.description || 'No description provided.'}
            </p>

            <div className="pt-3 border-t border-[var(--border)] grid grid-cols-2 gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">{prayer.date}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Clock size={13} className="text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {prayer.adhanTime ? `${prayer.adhanTime} / ` : ''}{prayer.iqamahTime}
                </span>
              </div>
            </div>
          </div>
        ))}
        {specialPrayers.length === 0 && (
          <div className="col-span-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center text-slate-400">
            No special prayer events scheduled for this mosque.
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Schedule Special Prayer</h3>
                <p className="text-xs text-slate-400">Publish a customized prayer congregation schedule</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Prayer Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Eid-ul-Fitr, Taraweeh prayers"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Adhan Time (Optional)</label>
                    <input
                      type="text"
                      pattern="[0-2][0-9]:[0-5][0-9]"
                      placeholder="08:00"
                      value={adhanTime}
                      onChange={(e) => setAdhanTime(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Iqamah Time *</label>
                    <input
                      type="text"
                      required
                      pattern="[0-2][0-9]:[0-5][0-9]"
                      placeholder="08:30"
                      value={iqamahTime}
                      onChange={(e) => setIqamahTime(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter details e.g., 'Khutbah begins 15 mins before prayer. Ladies section open.'"
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm resize-none"
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-[var(--border)] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-all"
                  >
                    Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
