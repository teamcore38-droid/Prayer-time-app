'use client';

import React, { useEffect, useState } from 'react';
import { Settings, Plus, Trash2, Check, AlertCircle } from 'lucide-react';

interface JumuahSession {
  sessionNumber?: number;
  khutbah: string;
  iqamah: string;
}

interface Mosque {
  _id: string;
  mosqueName: string;
  jumuahSessions: JumuahSession[];
}

export default function SettingsPage() {
  const [userRole, setUserRole] = useState('');
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [selectedMosqueId, setSelectedMosqueId] = useState('');
  const [activeMosque, setActiveMosque] = useState<Mosque | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Form Fields
  const [jumuahSessions, setJumuahSessions] = useState<JumuahSession[]>([]);

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

  const fetchMosqueDetails = async () => {
    if (!selectedMosqueId) return;
    try {
      const res = await fetch(`/api/mosques/${selectedMosqueId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setActiveMosque(data);
      setJumuahSessions(
        data.jumuahSessions && data.jumuahSessions.length > 0
          ? data.jumuahSessions
          : [{ sessionNumber: 1, khutbah: '12:30', iqamah: '13:00' }]
      );
    } catch (err) {
      console.error('Failed to load mosque settings', err);
    }
  };

  useEffect(() => {
    fetchSessionAndMosques();
  }, []);

  useEffect(() => {
    fetchMosqueDetails();
  }, [selectedMosqueId]);

  const handleAddSession = () => {
    setJumuahSessions([...jumuahSessions, { khutbah: '', iqamah: '' }]);
  };

  const handleRemoveSession = (index: number) => {
    setJumuahSessions(jumuahSessions.filter((_, idx) => idx !== index));
  };

  const handleSessionChange = (index: number, field: 'khutbah' | 'iqamah', value: string) => {
    const nextSessions = jumuahSessions.map((session, idx) => {
      if (idx === index) {
        return { ...session, [field]: value };
      }
      return session;
    });
    setJumuahSessions(nextSessions);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    const token = localStorage.getItem('token');

    const formattedSessions = jumuahSessions.map((session, idx) => ({
      sessionNumber: idx + 1,
      khutbah: session.khutbah,
      iqamah: session.iqamah
    }));

    try {
      const res = await fetch(`/api/mosques/${selectedMosqueId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jumuahSessions: formattedSessions })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update Jumuah settings');
      }

      setStatusMessage({ type: 'success', text: 'Jumuah congregation sessions updated successfully!' });
      fetchMosqueDetails();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error occurred during save' });
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
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="text-primary" size={22} />
            <span>Mosque Congregation Settings</span>
          </h2>
          <p className="text-sm text-slate-400">Configure multi-session Jumuah (Friday) congregations and times</p>
        </div>

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

      {activeMosque ? (
        <form onSubmit={handleSave} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white">Jumuah (Friday) Congregation Sessions</h3>
            <p className="text-xs text-slate-400 mt-1">
              Configure session timings. These settings will display on the Mobile app Home and details page.
            </p>
          </div>

          <div className="space-y-4">
            {jumuahSessions.map((session, index) => (
              <div key={index} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/20 p-4 border border-[var(--border)] rounded-2xl relative group">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Congregation Session {index + 1}</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Khutbah Starts *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 12:30 PM"
                      value={session.khutbah}
                      onChange={(e) => handleSessionChange(index, 'khutbah', e.target.value)}
                      className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Iqamah / Salah *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1:00 PM"
                      value={session.iqamah}
                      onChange={(e) => handleSessionChange(index, 'iqamah', e.target.value)}
                      className="w-full px-3 py-1.5 border border-[var(--border)] rounded-lg bg-[var(--card)] text-sm"
                    />
                  </div>
                </div>

                {jumuahSessions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSession(index)}
                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                    title="Remove Session"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
            <button
              type="button"
              onClick={handleAddSession}
              className="px-4 py-2 border border-primary text-primary hover:bg-primary hover:text-white text-xs font-bold rounded-xl transition-all"
            >
              + Add Friday Session
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-md shadow-emerald-950/10 transition-all"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center text-slate-400">
          Please assign or select a mosque to manage congregation settings.
        </div>
      )}
    </div>
  );
}
