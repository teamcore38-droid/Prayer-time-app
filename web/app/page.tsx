'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/home'); }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center p-6 rounded-3xl bg-white/90 shadow-xl shadow-slate-900/5 dark:bg-slate-900/95">
        <div className="inline-block w-10 h-10 rounded-full border-4 border-emerald-600 animate-spin" />
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">Redirecting to the prayer home…</p>
      </div>
    </div>
  );
}
