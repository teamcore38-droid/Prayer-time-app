'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, MapPin, Phone, Mail, Globe, X } from 'lucide-react';

interface JumuahSession {
  sessionNumber?: number;
  khutbah: string;
  iqamah: string;
}

interface Mosque {
  _id: string;
  mosqueName: string;
  address: string;
  city: string;
  district: string;
  country: string;
  phone: string;
  email: string;
  logo: string;
  latitude: number;
  longitude: number;
  jumuahSessions: JumuahSession[];
}

export default function MosquesPage() {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMosque, setCurrentMosque] = useState<Partial<Mosque> | null>(null);
  
  // Form Fields
  const [mosqueName, setMosqueName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [country, setCountry] = useState('Malaysia'); // Default example
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [logo, setLogo] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [jumuahSessions, setJumuahSessions] = useState<JumuahSession[]>([
    { khutbah: '12:30', iqamah: '13:00' }
  ]);

  const fetchMosques = async () => {
    try {
      const res = await fetch('/api/mosques');
      if (!res.ok) throw new Error('Failed to fetch mosques');
      const data = await res.json();
      setMosques(data);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMosques();
  }, []);

  const openAddModal = () => {
    setCurrentMosque(null);
    setMosqueName('');
    setAddress('');
    setCity('');
    setDistrict('');
    setCountry('');
    setPhone('');
    setEmail('');
    setLogo('');
    setLatitude(0);
    setLongitude(0);
    setJumuahSessions([{ khutbah: '12:30', iqamah: '13:00' }]);
    setIsModalOpen(true);
  };

  const openEditModal = (mosque: Mosque) => {
    setCurrentMosque(mosque);
    setMosqueName(mosque.mosqueName);
    setAddress(mosque.address);
    setCity(mosque.city);
    setDistrict(mosque.district);
    setCountry(mosque.country);
    setPhone(mosque.phone || '');
    setEmail(mosque.email || '');
    setLogo(mosque.logo || '');
    setLatitude(mosque.latitude);
    setLongitude(mosque.longitude);
    setJumuahSessions(
      mosque.jumuahSessions && mosque.jumuahSessions.length > 0 
        ? mosque.jumuahSessions 
        : [{ khutbah: '12:30', iqamah: '13:00' }]
    );
    setIsModalOpen(true);
  };

  const handleAddJumuahSession = () => {
    setJumuahSessions([...jumuahSessions, { khutbah: '', iqamah: '' }]);
  };

  const handleRemoveJumuahSession = (index: number) => {
    const nextSessions = jumuahSessions.filter((_, idx) => idx !== index);
    setJumuahSessions(nextSessions);
  };

  const handleJumuahChange = (index: number, field: 'khutbah' | 'iqamah', value: string) => {
    const nextSessions = jumuahSessions.map((session, idx) => {
      if (idx === index) {
        return { ...session, [field]: value };
      }
      return session;
    });
    setJumuahSessions(nextSessions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const formattedSessions = jumuahSessions.map((session, idx) => ({
      sessionNumber: idx + 1,
      khutbah: session.khutbah,
      iqamah: session.iqamah
    }));

    const payload = {
      mosqueName,
      address,
      city,
      district,
      country,
      phone,
      email,
      logo,
      latitude: Number(latitude),
      longitude: Number(longitude),
      jumuahSessions: formattedSessions,
    };

    try {
      const url = currentMosque ? `/api/mosques/${currentMosque._id}` : '/api/mosques';
      const method = currentMosque ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Operation failed');
      }

      setIsModalOpen(false);
      fetchMosques();
    } catch (err: any) {
      alert(err.message || 'Failed to save mosque');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white">Mosque Directory</h2>
          <p className="text-sm text-slate-400">Add, edit, and configure registered Islamic centers</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-900/10 flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Register Mosque</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm">
          {error}
        </div>
      )}

      {/* Mosque List Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-[var(--border)] text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Logo / Name</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Contacts</th>
                <th className="px-6 py-4">GPS Coordinates</th>
                <th className="px-6 py-4">Jumuah Sessions</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {mosques.map((mosque) => (
                <tr key={mosque._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {mosque.logo ? (
                        <img 
                          src={mosque.logo} 
                          alt={mosque.mosqueName} 
                          className="h-10 w-10 rounded-lg object-cover border border-[var(--border)]"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {mosque.mosqueName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">{mosque.mosqueName}</p>
                        <p className="text-xs text-slate-400">ID: {mosque._id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{mosque.address}</span>
                      <span className="text-xs text-slate-400">{mosque.city}, {mosque.district}, {mosque.country}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
                      {mosque.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone size={12} />
                          <span>{mosque.phone}</span>
                        </span>
                      )}
                      {mosque.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail size={12} />
                          <span>{mosque.email}</span>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400" />
                      <span>{mosque.latitude.toFixed(5)}, {mosque.longitude.toFixed(5)}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {mosque.jumuahSessions?.map((session) => (
                        <span 
                          key={session.sessionNumber} 
                          className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
                        >
                          S{session.sessionNumber}: {session.khutbah} / {session.iqamah}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEditModal(mosque)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors inline-flex"
                      title="Edit Mosque"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {mosques.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No mosques registered yet. Click &quot;Register Mosque&quot; to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="p-6 md:p-8 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {currentMosque ? 'Edit Mosque Details' : 'Register New Mosque'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Fill in all required fields to update the platform registry.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Mosque Name *</label>
                    <input
                      type="text"
                      required
                      value={mosqueName}
                      onChange={(e) => setMosqueName(e.target.value)}
                      placeholder="e.g. Masjid Al-Falah"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Logo Image URL</label>
                    <input
                      type="text"
                      value={logo}
                      onChange={(e) => setLogo(e.target.value)}
                      placeholder="e.g. https://domain.com/logo.png"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm transition-colors"
                    />
                  </div>
                </div>

                {/* Section 2: Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 123 Jalan Ampang"
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Kuala Lumpur"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">District *</label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Wilayah Persekutuan"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Country *</label>
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. Malaysia"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm transition-colors"
                    />
                  </div>
                </div>

                {/* Section 3: Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +6031234567"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. admin@masjid.org"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm transition-colors"
                    />
                  </div>
                </div>

                {/* Section 4: Geolocation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Latitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={latitude}
                      onChange={(e) => setLatitude(Number(e.target.value))}
                      placeholder="e.g. 3.1390"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Longitude *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={longitude}
                      onChange={(e) => setLongitude(Number(e.target.value))}
                      placeholder="e.g. 101.6869"
                      className="w-full px-4 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm transition-colors"
                    />
                  </div>
                </div>

                {/* Section 5: Default Jumuah Sessions */}
                <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900/40 border border-[var(--border)] rounded-2xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Friday Jumuah Sessions</label>
                    <button
                      type="button"
                      onClick={handleAddJumuahSession}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      + Add Session
                    </button>
                  </div>

                  {jumuahSessions.map((session, index) => (
                    <div key={index} className="flex items-center gap-3 bg-[var(--card)] p-3 border border-[var(--border)] rounded-xl">
                      <span className="text-xs font-bold text-slate-400 w-20">Session {index + 1}</span>
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">Khutbah</span>
                          <input
                            type="text"
                            required
                            placeholder="12:30"
                            value={session.khutbah}
                            onChange={(e) => handleJumuahChange(index, 'khutbah', e.target.value)}
                            className="w-full px-2 py-1 border border-[var(--border)] rounded-lg text-xs bg-transparent outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">Iqamah</span>
                          <input
                            type="text"
                            required
                            placeholder="13:00"
                            value={session.iqamah}
                            onChange={(e) => handleJumuahChange(index, 'iqamah', e.target.value)}
                            className="w-full px-2 py-1 border border-[var(--border)] rounded-lg text-xs bg-transparent outline-none"
                          />
                        </div>
                      </div>
                      {jumuahSessions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveJumuahSession(index)}
                          className="text-xs text-rose-500 hover:text-rose-600 px-2 font-semibold"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-[var(--border)] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-950/10"
                  >
                    {currentMosque ? 'Save Changes' : 'Register Mosque'}
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
