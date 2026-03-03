'use client';

import { useEffect, useState } from 'react';

export default function WhatPageAmIOn() {
  const [pageInfo, setPageInfo] = useState<any>({});

  useEffect(() => {
    setPageInfo({
      url: window.location.href,
      hostname: window.location.hostname,
      pathname: window.location.pathname,
      userAgent: navigator.userAgent,
      scripts: Array.from(document.scripts).map((s) => s.src),
      appFiles: {
        hasPageTs: !!document.querySelector('[data-next-page]') || document.body.innerHTML.includes('PWA Push'),
        hasPushManager: typeof PushManager !== 'undefined',
        hasNextJs: window.location.pathname.includes('/_next') || !!document.querySelector('[data-nextjs-router])'),
      },
    });
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">🔎 What Page Am I On?</h1>

        <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4">
          <h2 className="font-semibold text-green-400 mb-2">✅ Correct PWA App Info:</h2>
          <p className="text-sm">You should be on:</p>
          <code className="block mt-2 text-lg">https://pwa-push-notifications.vercel.app</code>
        </div>

        <div className="bg-gray-800 rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Current Page Info:</h2>
          <div className="text-sm space-y-1">
            <div><span className="text-gray-400">URL:</span> <span className="text-green-400">{pageInfo.url}</span></div>
            <div><span className="text-gray-400">Hostname:</span> {pageInfo.hostname}</div>
            <div><span className="text-gray-400">Pathname:</span> {pageInfo.pathname}</div>
          </div>
        </div>

        {pageInfo.hostname !== 'pwa-push-notifications.vercel.app' && pageInfo.hostname !== 'localhost' && (
          <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4">
            <h2 className="font-semibold text-red-400 mb-2">❌ WRONG APP!</h2>
            <p className="text-sm">You are on the wrong website. This is not the PWA app we built.</p>
            <a
              href="https://pwa-push-notifications.vercel.app"
              className="block mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-center"
            >
              Go to Correct App
            </a>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Scripts Loaded:</h2>
          <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
            {pageInfo.scripts && pageInfo.scripts.length > 0 ? (
              pageInfo.scripts.map((src: string, i: number) => (
                <div key={i} className={src.includes('firebase') ? 'text-red-400' : 'text-gray-300'}>
                  {src || '(inline script)'}
                </div>
              ))
            ) : (
              <div className="text-gray-400">No external scripts</div>
            )}
          </div>
          {pageInfo.scripts?.some((s: string) => s.includes('firebase')) && (
            <div className="mt-2 text-red-400 text-sm">
              ⚠️ Firebase scripts detected - this is NOT our PWA app!
            </div>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-4 space-y-2">
          <h2 className="font-semibold">Browser Check:</h2>
          <div className="text-sm space-y-1">
            <div><span className="text-gray-400">Push API:</span> {pageInfo.appFiles?.hasPushManager ? '✅ Yes' : '❌ No'}</div>
            <div><span className="text-gray-400">Next.js App:</span> {pageInfo.appFiles?.hasNextJs ? '✅ Yes' : '❌ No'}</div>
            <div><span className="text-gray-400">PWA Content:</span> {pageInfo.appFiles?.hasPageTs ? '✅ Yes' : '❌ No'}</div>
          </div>
        </div>

        <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
          <h2 className="font-semibold text-blue-400 mb-2">📋 Check These Things:</h2>
          <ol className="text-sm list-decimal list-inside space-y-2">
            <li>Check the URL in your browser address bar</li>
            <li>Make sure it says <code className="bg-gray-900 px-1 rounded">pwa-push-notifications.vercel.app</code></li>
            <li>Close ALL other tabs (especially Vue apps)</li>
            <li>Try in a fresh Incognito window</li>
            <li>Check for browser extensions that might inject scripts</li>
          </ol>
        </div>

        <div className="text-center">
          <a
            href="/"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg inline-block"
          >
            Go to Home Page
          </a>
        </div>
      </div>
    </main>
  );
}
