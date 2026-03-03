'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [subscription, setSubscription] = useState<any>(null);
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    gatherDebugInfo();
  }, []);

  const gatherDebugInfo = async () => {
    const info: any = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      https: location.protocol === 'https:',
      hostname: location.hostname,
    };

    // Service Worker support
    info.serviceWorkerSupport = 'serviceWorker' in navigator;

    // Push API support
    info.pushApiSupport = 'PushManager' in window;

    // Notification support
    info.notificationSupport = 'Notification' in window;
    info.notificationPermission = Notification.permission;

    // Service Worker status
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          info.serviceWorkerState = registration.active?.state;
          info.serviceWorkerScope = registration.scope;
        } else {
          info.serviceWorkerState = 'Not registered';
        }
      } catch (e) {
        info.serviceWorkerError = (e as Error).message;
      }
    }

    // VAPID public key
    info.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.substring(0, 20) + '...' || 'NOT SET';

    // Check subscription
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const sub = await registration.pushManager.getSubscription();
          if (sub) {
            info.hasSubscription = true;
            info.subscriptionEndpoint = sub.endpoint;
            setSubscription(sub);
          } else {
            info.hasSubscription = false;
          }
        }
      } catch (e) {
        info.subscriptionError = (e as Error).message;
      }
    }

    setDebugInfo(info);
  };

  const testSubscribe = async () => {
    setLoading(true);
    setTestResult('');

    try {
      // Check service worker
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker not supported');
      }

      if (!('PushManager' in window)) {
        throw new Error('Push API not supported');
      }

      // Register service worker
      console.log('[Debug] Registering service worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[Debug] Service Worker registered:', registration);

      await navigator.serviceWorker.ready;
      console.log('[Debug] Service Worker ready');

      // Request permission
      console.log('[Debug] Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('[Debug] Permission:', permission);

      if (permission !== 'granted') {
        throw new Error('Notification permission denied: ' + permission);
      }

      // Get VAPID key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error('VAPID public key not configured');
      }

      // Convert VAPID key
      const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey) as BufferSource;

      // Subscribe
      console.log('[Debug] Subscribing to push...');
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
      console.log('[Debug] Subscription created:', sub);

      // Send to server
      console.log('[Debug] Sending subscription to server...');
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });

      console.log('[Debug] Server response:', response.status);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Server returned ${response.status}: ${text}`);
      }

      const result = await response.json();
      console.log('[Debug] Server result:', result);

      setTestResult(`✅ Success! Subscribed. Server has ${result.subscriptionCount} subscriptions.`);
      setSubscription(sub);
      await gatherDebugInfo();

    } catch (error) {
      console.error('[Debug] Error:', error);
      setTestResult(`❌ Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const testNotification = async () => {
    setLoading(true);
    setTestResult('');

    try {
      console.log('[Debug] Sending test notification...');
      const response = await fetch('/api/trigger', { method: 'POST' });
      const result = await response.json();
      console.log('[Debug] Trigger result:', result);

      if (result.stats) {
        setTestResult(`✅ Notification sent to ${result.stats.sent} subscribers. Failed: ${result.stats.failed}`);
      } else {
        setTestResult('✅ Notification sent (or queued)');
      }

    } catch (error) {
      console.error('[Debug] Error:', error);
      setTestResult(`❌ Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkEnvVars = async () => {
    try {
      const response = await fetch('/api/subscribe');
      const text = await response.text();
      setTestResult(`API Check: ${response.status}\n${text}`);
    } catch (error) {
      setTestResult(`Error: ${(error as Error).message}`);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">🔍 PWA Debug Console</h1>

        {/* Environment Check */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Environment</h2>
          <div className="grid grid-cols-2 gap-2 text-sm font-mono">
            <div className="text-gray-400">HTTPS:</div>
            <div className={debugInfo.https ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.https ? '✅ Yes' : '❌ No'}
            </div>

            <div className="text-gray-400">Service Worker:</div>
            <div className={debugInfo.serviceWorkerSupport ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.serviceWorkerSupport ? '✅ Supported' : '❌ Not supported'}
            </div>

            <div className="text-gray-400">Push API:</div>
            <div className={debugInfo.pushApiSupport ? 'text-green-400' : 'text-red-400'}>
              {debugInfo.pushApiSupport ? '✅ Supported' : '❌ Not supported'}
            </div>

            <div className="text-gray-400">Notification Permission:</div>
            <div className={
              debugInfo.notificationPermission === 'granted' ? 'text-green-400' :
              debugInfo.notificationPermission === 'denied' ? 'text-red-400' :
              'text-yellow-400'
            }>
              {debugInfo.notificationPermission}
            </div>

            <div className="text-gray-400">SW State:</div>
            <div className="text-gray-300">{debugInfo.serviceWorkerState || 'N/A'}</div>

            <div className="text-gray-400">VAPID Key:</div>
            <div className={debugInfo.vapidPublicKey === 'NOT SET' ? 'text-red-400' : 'text-green-400'}>
              {debugInfo.vapidPublicKey}
            </div>

            <div className="text-gray-400">Subscription:</div>
            <div className={debugInfo.hasSubscription ? 'text-green-400' : 'text-gray-400'}>
              {debugInfo.hasSubscription ? '✅ Active' : '❌ None'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Test Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={testSubscribe}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg"
            >
              {loading ? 'Testing...' : 'Test Subscribe'}
            </button>

            <button
              onClick={testNotification}
              disabled={loading || !debugInfo.hasSubscription}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg"
            >
              {loading ? 'Sending...' : 'Send Test Notification'}
            </button>

            <button
              onClick={checkEnvVars}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg"
            >
              Check API Status
            </button>

            <button
              onClick={gatherDebugInfo}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg"
            >
              Refresh Info
            </button>
          </div>

          {testResult && (
            <div className="mt-4 p-3 bg-gray-900 rounded-lg font-mono text-sm whitespace-pre-wrap">
              {testResult}
            </div>
          )}
        </div>

        {/* Subscription Details */}
        {subscription && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3">Active Subscription</h2>
            <div className="text-sm space-y-2">
              <div>
                <span className="text-gray-400">Endpoint:</span>
                <div className="text-gray-300 break-all text-xs mt-1">{subscription.endpoint}</div>
              </div>
              {subscription.keys && (
                <>
                  <div>
                    <span className="text-gray-400">p256dh:</span>
                    <div className="text-gray-300 break-all text-xs mt-1">{subscription.keys.p256dh}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">auth:</span>
                    <div className="text-gray-300 break-all text-xs mt-1">{subscription.keys.auth}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Debug Log */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3">Console Output</h2>
          <p className="text-sm text-gray-400">Check the browser console (F12) for detailed logs.</p>
        </div>
      </div>
    </main>
  );
}
