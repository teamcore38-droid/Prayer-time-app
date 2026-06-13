'use client';

import React, { useState } from 'react';
import Link from 'next/navigation';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-slate-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

      <div className="w-full max-w-md bg-slate-950/80 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 relative z-10 backdrop-blur-xl shadow-2xl shadow-black/40">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <a href="/login" className="inline-block text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Masjid Connect
          </a>
          <h2 className="text-xl font-bold tracking-tight text-white mt-4">Reset Password</h2>
          <p className="text-xs text-slate-400">Receive a magic link to regain access</p>
        </div>

        {submitted ? (
          <div className="space-y-6 text-center py-4 animate-scale-up">
            <div className="inline-flex p-3 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-white text-base">Check your email</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                If an account exists for <span className="font-semibold text-slate-200">{email}</span>, we have sent instructions to reset your password.
              </p>
            </div>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              <ArrowLeft size={12} />
              <span>Back to Sign In</span>
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-950/20"
            >
              Send Recovery Email
            </button>

            <div className="text-center pt-2">
              <a
                href="/login"
                className="inline-flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={12} />
                <span>Back to Sign In</span>
              </a>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
