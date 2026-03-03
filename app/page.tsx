'use client';

import { useEffect, useState } from 'react';
import PushNotificationManager from '@/components/PushNotificationManager';

export default function Home() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMacOS, setIsMacOS] = useState(false);
  const [isMacOSSafari, setIsMacOSSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS (mobile)
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Detect Android
    const isAndroidDevice = /Android/.test(navigator.userAgent);
    setIsAndroid(isAndroidDevice);

    // Detect macOS
    const isMacOSDevice = /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent);
    setIsMacOS(isMacOSDevice);

    // Detect Safari browser
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // macOS Safari combination
    const isMacOSSafariBrowser = isMacOSDevice && isSafari && !isIOSDevice;
    setIsMacOSSafari(isMacOSSafariBrowser);

    // Detect if running in standalone mode (added to home screen)
    const isStandaloneMode = (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isStandaloneMode);

    // Show iOS prompt if not in standalone mode
    if (isIOSDevice && !isStandaloneMode) {
      // Delay showing the prompt for better UX
      setTimeout(() => setShowIOSPrompt(true), 2000);
    }
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur">
            <svg
              className="w-10 h-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold">PWA Push</h1>
          <p className="text-gray-400">
            Progressive Web App with push notifications every 10 seconds
          </p>
        </div>

        {/* iOS Prompt */}
        {isIOS && !isStandalone && showIOSPrompt && (
          <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-blue-400">iOS Setup Required</h3>
            <p className="text-sm text-gray-300">
              To receive push notifications on iOS, you must add this app to your home screen:
            </p>
            <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
              <li>Tap the Share button</li>
              <li>Scroll down and tap &quot;Add to Home Screen&quot;</li>
              <li>Tap &quot;Add&quot; in the top right</li>
              <li>Open the app from your home screen</li>
            </ol>
          </div>
        )}

        {/* macOS Safari Warning */}
        {isMacOSSafari && (
          <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-red-400">⚠️ macOS Safari Not Supported</h3>
            <p className="text-sm text-gray-300">
              macOS Safari does not support PWA push notifications.
            </p>
            <p className="text-sm text-gray-300">
              Please use one of these browsers on macOS:
            </p>
            <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
              <li><strong>Google Chrome</strong> - Full support</li>
              <li><strong>Microsoft Edge</strong> - Full support</li>
              <li><strong>Firefox</strong> - Full support</li>
            </ul>
            <p className="text-xs text-gray-400 mt-2">
              Note: PWA push notifications are only supported on iOS 16.4+, not macOS.
            </p>
          </div>
        )}

        {/* Status Badge */}
        <div className="flex justify-center">
          {isStandalone ? (
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm font-medium border border-green-500/30">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Running as PWA
            </span>
          ) : (
            <span className="inline-flex items-center px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium border border-yellow-500/30">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Running in browser
            </span>
          )}
        </div>

        {/* Push Notification Manager */}
        <PushNotificationManager />

        {/* Info Section */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 space-y-2">
          <h3 className="font-semibold text-sm">How it works:</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Subscribe to enable push notifications</li>
            <li>• Notifications are sent every 10 seconds</li>
            <li>• <strong>iOS 16.4+:</strong> Requires home screen install</li>
            <li>• <strong>Android:</strong> Works directly in Chrome</li>
            <li>• <strong>macOS:</strong> Use Chrome/Edge/Firefox (not Safari)</li>
          </ul>
        </div>

        {/* Platform Info */}
        <div className="text-center text-xs text-gray-500">
          {isIOS && <span>iOS {navigator.userAgent.match(/OS (\d+)_(\d+)/)?.[1] || '16.4+'} detected</span>}
          {isAndroid && <span>Android detected</span>}
          {isMacOSSafari && <span>macOS Safari detected (push not supported)</span>}
          {isMacOS && !isMacOSSafari && <span>macOS detected (using compatible browser)</span>}
          {!isIOS && !isAndroid && !isMacOS && <span>Desktop detected</span>}
        </div>

        {/* Debug Link */}
        <div className="text-center space-x-4">
          <a
            href="/debug"
            className="text-xs text-gray-500 hover:text-gray-400 underline"
          >
            Debug Console
          </a>
          <a
            href="/clean"
            className="text-xs text-gray-500 hover:text-gray-400 underline"
          >
            Clean Service Workers
          </a>
        </div>
      </div>
    </main>
  );
}
