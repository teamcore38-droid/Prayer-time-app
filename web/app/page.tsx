'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/dashboard'); }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-10 h-10 rounded-full border-4 border-emerald-600 animate-spin" />
        <p className="mt-4 text-sm text-slate-600">Redirecting to prayer dashboard…</p>
      </div>
    </div>
  );
}
