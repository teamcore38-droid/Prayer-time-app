'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, Trash2, Calendar, Tag, X } from 'lucide-react';

interface Announcement {
  _id: string;
  mosqueId: string;
  title: string;
  description: string;
  image?: string;
  category: 'Quran Class' | 'Event' | 'Fundraiser' | 'Ramadan Notice' | 'General';
  createdAt: string;
}

interface Mosque {
  _id: string;
  mosqueName: string;
}

export default function AnnouncementsPage() {
  const [userRole, setUserRole] = useState('');
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [selectedMosqueId, setSelectedMosqueId] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState<'Quran Class' | 'Event' | 'Fundraiser' | 'Ramadan Notice' | 'General'>('General');

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

  const fetchAnnouncements = async () => {
    if (!selectedMosqueId) return;
    try {
      const res = await fetch(`/api/announcements?mosqueId=${selectedMosqueId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to load announcements', err);
    }
  };

  useEffect(() => {
    fetchSessionAndMosques();
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [selectedMosqueId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const payload = {
      mosqueId: selectedMosqueId,
      title,
      description,
      image: image || undefined,
      category
    };

    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to publish announcement');
      }

      setIsModalOpen(false);
      // Reset form
      setTitle('');
      setDescription('');
      setImage('');
      setCategory('General');
      // Reload list
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete');
      }

      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Error deleting announcement');
    }
  };

  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case 'Quran Class':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'Event':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'Fundraiser':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'Ramadan Notice':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
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
            <Megaphone className="text-primary" size={22} />
            <span>Announcements & Events</span>
          </h2>
          <p className="text-sm text-slate-400">Broadcast classes, fundraisers, and general alerts to mobile users</p>
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
            <span>Publish Announcement</span>
          </button>
        </div>
      </div>

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {announcements.map((announcement) => (
          <div key={announcement._id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm flex flex-col md:flex-row">
            {announcement.image && (
              <div className="md:w-1/3 relative h-40 md:h-auto min-h-[160px] bg-slate-100 dark:bg-slate-900">
                <img 
                  src={announcement.image} 
                  alt={announcement.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1 p-5 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${getCategoryStyles(announcement.category)}`}>
                    <Tag size={8} />
                    <span>{announcement.category}</span>
                  </span>
                  
                  <button
                    onClick={() => handleDelete(announcement._id)}
                    className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded transition-colors"
                    title="Delete Announcement"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <h4 className="font-bold text-slate-800 dark:text-white text-base leading-snug">{announcement.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                  {announcement.description}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                <Calendar size={11} />
                <span>Published on {new Date(announcement.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && (
          <div className="col-span-full bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center text-slate-400">
            No announcements posted for this mosque.
          </div>
        )}
      </div>

      {/* Publish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-lg shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Publish Announcement</h3>
                <p className="text-xs text-slate-400">Dispatch a notice to all subscribed community devices</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Notice Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Weekly Quran Tajweed Class"
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500">Category *</label>
                    <select
                      value={category}
                      onChange={(e: any) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-[var(--card)] outline-none focus:border-primary text-sm"
                    >
                      <option value="General">General</option>
                      <option value="Quran Class">Quran Class</option>
                      <option value="Event">Event</option>
                      <option value="Fundraiser">Fundraiser</option>
                      <option value="Ramadan Notice">Ramadan Notice</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Banner Image URL (Optional)</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="e.g. https://domain.com/banner.jpg"
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-transparent outline-none focus:border-primary text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Description *</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detail the class schedules, locations, dates, fundraiser goals, or general notices..."
                    rows={4}
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
                    Publish
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
