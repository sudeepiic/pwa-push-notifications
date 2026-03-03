'use client';

import { useEffect, useState } from 'react';

export default function CleanPage() {
  const [status, setStatus] = useState<string>('Ready to clean...');
  const [serviceWorkers, setServiceWorkers] = useState<any[]>([]);

  const getServiceWorkers = async () => {
    const sws = await navigator.serviceWorker.getRegistrations();
    setServiceWorkers(
      sws.map((sw) => ({
        scope: sw.scope,
        state: sw.active?.state,
        scriptURL: sw.active?.scriptURL,
      }))
    );
  };

  const cleanAllServiceWorkers = async () => {
    setStatus('Cleaning service workers...');
    const registrations = await navigator.serviceWorker.getRegistrations();

    for (const registration of registrations) {
      console.log('Unregistering:', registration.scope);
      await registration.unregister();
    }

    setStatus(`✅ Cleaned ${registrations.length} service worker(s). Refreshing...`);
    setServiceWorkers([]);

    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  const clearCache = async () => {
    setStatus('Clearing cache...');
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
      setStatus(`✅ Cleared ${cacheNames.length} cache(s).`);
    }
  };

  const clearAll = async () => {
    await cleanAllServiceWorkers();
    await clearCache();
  };

  useEffect(() => {
    getServiceWorkers();
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">🧹 Service Worker Cleaner</h1>

        <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4">
          <h2 className="font-semibold text-yellow-400 mb-2">⚠️ Firebase Service Worker Detected</h2>
          <p className="text-sm text-gray-300">
            You have a Firebase service worker from another project. This conflicts with our PWA service worker.
          </p>
        </div>

        {serviceWorkers.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-semibold mb-3">Current Service Workers:</h2>
            <div className="space-y-2">
              {serviceWorkers.map((sw, i) => (
                <div key={i} className="bg-gray-900 rounded p-3 text-sm">
                  <div className="text-gray-400">Scope: {sw.scope}</div>
                  <div className="text-gray-400">State: {sw.state}</div>
                  {sw.scriptURL && (
                    <div className="text-gray-500 break-all">{sw.scriptURL}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-4 space-y-3">
          <h2 className="font-semibold">Actions:</h2>
          <button
            onClick={cleanAllServiceWorkers}
            className="w-full py-2 bg-red-600 hover:bg-red-700 rounded-lg"
          >
            Clean All Service Workers
          </button>
          <button
            onClick={clearCache}
            className="w-full py-2 bg-orange-600 hover:bg-orange-700 rounded-lg"
          >
            Clear Browser Cache
          </button>
          <button
            onClick={clearAll}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            Clean Everything
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
          >
            Go to Home Page
          </button>
        </div>

        {status && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="font-semibold mb-2">Status:</h2>
            <p className="text-sm">{status}</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
          <h2 className="font-semibold mb-2">Manual Steps:</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Click "Clean Everything" above</li>
            <li>Wait for page to refresh</li>
            <li>Go to Home Page</li>
            <li>Open DevTools → Application → Service Workers</li>
            <li>Verify only "sw.js" is registered</li>
            <li>Click "Enable Notifications"</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
