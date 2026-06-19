"use client";

import React, { useEffect, useState } from 'react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running on iOS Safari
    const checkIsIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isDeviceIOS = /iphone|ipad|ipod/.test(userAgent);
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      return isDeviceIOS && !isStandalone;
    };

    const iosDetected = checkIsIOS();
    if (iosDetected) {
      setIsIOS(true);
      (window as any).pwaInstallable = true;
      (window as any).pwaIsIOS = true;
      window.dispatchEvent(new CustomEvent('pwa-state-change'));
      
      // Auto show modal on first visit if not dismissed
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowModal(true);
      }
    }

    // Android/Chrome beforeinstallprompt event handler
    function handleBeforeInstallPrompt(e: any) {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).pwaInstallable = true;
      (window as any).pwaIsIOS = false;
      window.dispatchEvent(new CustomEvent('pwa-state-change'));

      // Auto show modal on first visit if not dismissed
      const dismissed = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissed) {
        setShowModal(true);
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);

    // Listen for custom trigger event from the home page header button
    function handleTriggerInstall() {
      setShowModal(true);
    }
    window.addEventListener('trigger-pwa-install', handleTriggerInstall);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').then((reg) => {
        reg.addEventListener?.('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (confirm('A new update is available for Masjid Connect. Reload now to apply?')) {
                window.location.reload();
              }
            }
          });
        });
      }).catch(() => { /* ignore */ });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('trigger-pwa-install', handleTriggerInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // For iOS, the user must use the Safari share sheet, modal displays instructions
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_prompt_dismissed', 'true');
      setShowModal(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', 'true');
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-2xl dark:border-slate-800/80 dark:bg-slate-950/95 text-slate-900 dark:text-slate-100 animate-scale-up">
        {/* Mosque Logo / Icon */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600/10 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Install App Icon</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {isIOS 
              ? "Access Masjid Connect instantly from your home screen just like a regular mobile app on your iPhone or iPad."
              : "Add Masjid Connect to your home screen to access prayer schedules and announcements with a single tap."
            }
          </p>
        </div>

        {isIOS ? (
          /* iOS Safari Specific Instructions */
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-700 dark:bg-slate-900/60 dark:text-slate-300 border border-slate-100 dark:border-slate-800/60">
            <p className="font-semibold flex items-center justify-center gap-1.5 text-center text-[13px] text-emerald-600 dark:text-emerald-400">
              📲 Add to Home Screen Instructions
            </p>
            <ol className="mt-3 space-y-2 list-decimal list-inside pl-1 text-[11px] leading-relaxed">
              <li>Tap the <strong className="font-bold text-slate-900 dark:text-white">Share</strong> button in the Safari navigation bar.</li>
              <li>Scroll down the options list and tap <strong className="font-bold text-slate-900 dark:text-white">Add to Home Screen</strong>.</li>
              <li>Confirm the name and click <strong className="font-bold text-emerald-600 dark:text-emerald-400">Add</strong> in the top right.</li>
            </ol>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          {!isIOS && deferredPrompt ? (
            <button
              onClick={handleInstallClick}
              className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              type="button"
            >
              Install App Icon
            </button>
          ) : null}
          <button
            onClick={handleDismiss}
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-900 py-3 text-xs font-bold text-slate-600 dark:text-slate-400 transition cursor-pointer"
            type="button"
          >
            {isIOS ? "Done" : "Maybe Later"}
          </button>
        </div>
      </div>
    </div>
  );
}
