'use client';

import React, { useEffect, useState } from 'react';
import { Users, Edit2, ShieldAlert, Check, X } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'mosque_admin' | 'community_user';
  mosqueId: string | null;
  createdAt: string;
}

interface Mosque {
  _id: string;
  mosqueName: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form Fields
  const [role, setRole] = useState<'super_admin' | 'mosque_admin' | 'community_user'>('community_user');
  const [mosqueId, setMosqueId] = useState('');

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      const [usersRes, mosquesRes] = await Promise.all([
        fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/mosques')
      ]);

      if (!usersRes.ok || !mosquesRes.ok) throw new Error('Failed to load users or mosques');

      const usersData = await usersRes.json();
      const mosquesData = await mosquesRes.json();

      setUsers(usersData);
      setMosques(mosquesData);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to fetch directory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setRole(user.role);
    setMosqueId(user.mosqueId || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const token = localStorage.getItem('token');

    const payload = {
      userId: editingUser._id,
      role,
      mosqueId: role === 'mosque_admin' ? mosqueId || null : null
    };

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update user');
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Error occurred');
    }
  };

  const getMosqueName = (mId: string | null) => {
    if (!mId) return 'N/A';
    const mosque = mosques.find(m => m._id === mId);
    return mosque ? mosque.mosqueName : 'Unknown Mosque';
  };

  const getRoleBadgeStyles = (uRole: string) => {
    switch (uRole) {
      case 'super_admin':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
      case 'mosque_admin':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/10';
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
      <div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Users className="text-primary" size={22} />
          <span>User Role Administration</span>
        </h2>
        <p className="text-sm text-slate-400">View user directories, update permission levels, and delegate mosque administrators</p>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-none">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-[var(--border)] text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Name / Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Assigned Mosque</th>
                <th className="px-6 py-4">Registered Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-slate-800 dark:text-white">{user.name}</span>
                      <span className="text-xs text-slate-400">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeStyles(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {getMosqueName(user.mosqueId)}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openEditModal(user)}
                      className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition-colors inline-flex"
                      title="Edit Permissions"
                    >
                      <Edit2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-500">
                <ShieldAlert size={20} />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Modify User Access</h3>
              </div>
              <p className="text-xs text-slate-400">
                You are updating permission parameters for <span className="font-semibold text-slate-700 dark:text-slate-200">{editingUser.name}</span> ({editingUser.email}).
              </p>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500">Access Level / Role</label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-[var(--card)] outline-none focus:border-primary text-sm"
                  >
                    <option value="community_user">Community User (Read-only)</option>
                    <option value="mosque_admin">Mosque Admin (Manage Mosque details)</option>
                    <option value="super_admin">Super Admin (Full platform rights)</option>
                  </select>
                </div>

                {role === 'mosque_admin' && (
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-xs font-bold text-slate-500">Assign to Mosque</label>
                    <select
                      value={mosqueId}
                      required
                      onChange={(e) => setMosqueId(e.target.value)}
                      className="w-full px-3 py-2 border border-[var(--border)] rounded-xl bg-[var(--card)] outline-none focus:border-primary text-sm"
                    >
                      <option value="">-- Choose Mosque --</option>
                      {mosques.map(m => (
                        <option key={m._id} value={m._id}>{m.mosqueName}</option>
                      ))}
                    </select>
                  </div>
                )}

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
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-950/10"
                  >
                    Save Roles
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
