"use client";
import React from 'react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    function handleBeforeInstall(e: any) {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall as any);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall as any);
    };
  }, []);

  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').then((reg) => {
        // Listen for updates and notify the page
        reg.addEventListener?.('updatefound', () => {
          const newWorker = reg.installing;
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // new content available, reload to update
              if (confirm('A new version is available. Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      }).catch(() => { /* ignore registration errors */ });
    }
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setVisible(false);
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
      <button
        onClick={install}
        style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--primary)', color: '#fff', border: 'none' }}
      >
        Install App
      </button>
    </div>
  );
}
