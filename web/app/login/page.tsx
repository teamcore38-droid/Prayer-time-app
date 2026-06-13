'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save token in localStorage
      localStorage.setItem('token', data.token);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-100 relative overflow-hidden">
      {/* Background Graphic Patterns */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

      <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 relative z-10 backdrop-blur-xl shadow-2xl shadow-black/40">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-block text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Masjid Connect
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white mt-4">Welcome back</h2>
          <p className="text-xs text-slate-400">Sign in to manage your mosque schedules</p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Email Address</label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@mosque.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-800 focus:border-primary rounded-xl bg-slate-900/50 text-sm outline-none text-white transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-400">Password</label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-800 focus:border-primary rounded-xl bg-slate-900/50 text-sm outline-none text-white transition-colors"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-950/20 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Don&apos;t have an admin account?{' '}
          <Link href="/register" className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline">
            Register center
          </Link>
        </p>

      </div>
    </div>
  );
}
