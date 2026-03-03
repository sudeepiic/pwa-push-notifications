'use client';

import { useEffect, useState } from 'react';

export default function NotificationsCheckPage() {
  const [permissions, setPermissions] = useState<any>({});
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    checkEverything();
  }, []);

  const checkEverything = async () => {
    const results: string[] = [];

    // 1. Check Notification API
    results.push(`🔔 Notification API: ${Notification.permission}`);

    // 2. Check Service Worker
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        results.push(`✅ Service Worker: Active (${reg.active?.state})`);
        const sub = await reg.pushManager.getSubscription();
        results.push(`📱 Push Subscription: ${sub ? 'Active' : 'None'}`);
        if (sub) {
          results.push(`📍 Endpoint: ${sub.endpoint.substring(0, 60)}...`);
        }
      } else {
        results.push(`❌ Service Worker: Not registered`);
      }
    }

    // 3. Test direct notification
    results.push(`\n🧪 Testing direct notification...`);
    try {
      const notif = new Notification('Test Notification', {
        body: 'If you see this, notifications work!',
        icon: '/icon-192x192.png',
        tag: 'test-direct',
      });
      results.push(`✅ Direct notification: Created`);
      setTimeout(() => notif.close(), 5000);
    } catch (e) {
      results.push(`❌ Direct notification: Failed - ${(e as Error).message}`);
    }

    setPermissions({
      notification: Notification.permission,
    });
    setTestResults(results);
  };

  const requestPermission = async () => {
    const result = await Notification.requestPermission();
    setTestResults([...testResults, `\n✋ Permission requested: ${result}`]);
    checkEverything();
  };

  const sendTestPush = async () => {
    setTestResults([...testResults, `\n📡 Sending test push notification...`]);
    const response = await fetch('/api/trigger', { method: 'POST' });
    const data = await response.json();
    setTestResults([...testResults, `📡 Server response: ${JSON.stringify(data)}`]);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">🔔 macOS Notification Diagnostics</h1>

        {/* Permission Status */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Permission Status</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Notification Permission:</span>
              <span className={permissions.notification === 'granted' ? 'text-green-400' : 'text-red-400'}>
                {permissions.notification || 'Unknown'}
              </span>
            </div>
            {permissions.notification !== 'granted' && (
              <button
                onClick={requestPermission}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Request Permission
              </button>
            )}
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Diagnostics</h2>
          <div className="bg-gray-900 rounded p-3 font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
            {testResults.map((result, i) => (
              <div key={i} className={result.includes('✅') ? 'text-green-400' : result.includes('❌') ? 'text-red-400' : 'text-gray-300'}>
                {result}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Test Actions</h2>
          <div className="space-y-3">
            <button
              onClick={checkEverything}
              className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
            >
              🔄 Run Diagnostics Again
            </button>
            <button
              onClick={sendTestPush}
              className="w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg"
            >
              📡 Send Test Push Notification
            </button>
          </div>
        </div>

        {/* macOS Specific Instructions */}
        <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
          <h2 className="font-semibold text-blue-400 mb-3">🍎 macOS Notification Settings</h2>
          <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
            <li>
              <strong>System Settings:</strong> Apple Menu → System Settings → Notifications
            </li>
            <li>
              Find your browser (<strong>Chrome</strong>, <strong>Edge</strong>, or <strong>Firefox</strong>)
            </li>
            <li>
              Ensure <strong>"Allow Notifications"</strong> is enabled
            </li>
            <li>
              Check <strong>"Alerts"</strong> or <strong>"Banners"</strong> style is selected
            </li>
            <li>
              Make sure <strong>"Do Not Disturb"</strong> is OFF
            </li>
          </ol>
          <div className="mt-4 p-3 bg-gray-900 rounded text-xs">
            <p className="text-yellow-400 font-semibold mb-1">💡 Quick Test:</p>
            <p className="text-gray-400">
              Open a different website (like gmail.com) and see if you get notifications there.
              If you don't, it's a system-wide setting, not our app.
            </p>
          </div>
        </div>

        {/* Browser Console */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="font-semibold mb-3">🖥️ Browser Console Check</h2>
          <p className="text-sm text-gray-400 mb-2">
            Open DevTools (F12 or ⌥⌘I) and check Console for errors
          </p>
          <div className="bg-gray-900 rounded p-3 text-xs font-mono">
            Look for:
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>SW logs: [SW] Push event received</li>
              <li>SW logs: [SW] Notification shown successfully</li>
              <li>Any red errors</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
