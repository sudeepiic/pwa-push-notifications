'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationStatus {
  subscribed: boolean;
  permission: NotificationPermission;
  intervalId: number | null;
}

export default function PushNotificationManager() {
  const [status, setStatus] = useState<NotificationStatus>({
    subscribed: false,
    permission: 'default',
    intervalId: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<Date | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [subscriptionValid, setSubscriptionValid] = useState(false);
  const [isMacOSSafari, setIsMacOSSafari] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check subscription status on mount and periodically
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          const isSubscribed = !!subscription;

          setStatus(prev => ({
            ...prev,
            subscribed: isSubscribed,
            permission: Notification.permission,
          }));

          // Verify subscription with server
          if (isSubscribed) {
            try {
              const response = await fetch('/api/subscribe');
              if (response.ok) {
                const data = await response.json();
                const serverHasSubscription = data.subscriptionCount > 0;
                setSubscriptionValid(serverHasSubscription);

                // If server doesn't have the subscription, resubscribe
                if (!serverHasSubscription) {
                  console.log('[PushManager] Subscription lost on server, resubscribing...');
                  await subscribeToPush();
                  return;
                }
              }
            } catch (e) {
              console.error('[PushManager] Error checking server subscription:', e);
            }
          } else {
            setSubscriptionValid(false);
          }
        }
      }
    } catch (err) {
      console.error('[PushManager] Error checking subscription:', err);
    }
  }, []);

  // Initial check and periodic verification
  useEffect(() => {
    checkSubscriptionStatus();

    // Check every 30 seconds to detect lost subscriptions
    const interval = setInterval(checkSubscriptionStatus, 30000);

    return () => {
      clearInterval(interval);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkSubscriptionStatus]);

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

  const subscribeToPush = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker is not supported in this browser');
      }

      if (!('PushManager' in window)) {
        throw new Error('Push notifications are not supported in this browser');
      }

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission was denied');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      // Get VAPID key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
      if (!vapidPublicKey) {
        throw new Error('VAPID public key is not configured');
      }

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey) as BufferSource;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      // Send subscription to server
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to register subscription on server: ${errorText}`);
      }

      const result = await response.json();
      console.log('[PushManager] Subscription successful:', result);

      setStatus({
        subscribed: true,
        permission: 'granted',
        intervalId: null,
      });
      setSubscriptionValid(true);

      // Start polling for notifications every 10 seconds
      startNotificationPolling();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to subscribe');
    } finally {
      setIsLoading(false);
    }
  };

  const startNotificationPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        // First verify we're still subscribed on the server
        const checkResponse = await fetch('/api/subscribe');
        if (checkResponse.ok) {
          const data = await checkResponse.json();
          if (data.subscriptionCount === 0) {
            console.log('[PushManager] Subscription lost on server, stopping polling');
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            setStatus(prev => ({ ...prev, subscribed: false }));
            setSubscriptionValid(false);
            return;
          }
        }

        const response = await fetch('/api/send-broadcast', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.stats.sent > 0) {
            setLastNotification(new Date());
            setNotificationCount(prev => prev + 1);
          } else if (data.stats.total === 0) {
            console.warn('[PushManager] No subscribers on server, subscription may be lost');
            setStatus(prev => ({ ...prev, subscribed: false }));
            setSubscriptionValid(false);
          }
        }
      } catch (err) {
        console.error('[PushManager] Error sending notification:', err);
      }
    }, 10000);
  };

  const triggerTestNotification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First check if we have a valid subscription
      if (!subscriptionValid) {
        await checkSubscriptionStatus();

        // If still not valid, show error
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = registration ? await registration.pushManager.getSubscription() : null;

        if (!subscription) {
          throw new Error('Not subscribed. Please click "Enable Notifications" first.');
        }

        // Re-register with server
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription),
        });

        if (!response.ok) {
          throw new Error('Failed to re-register subscription');
        }
      }

      const response = await fetch('/api/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to trigger notification');
      }

      const result = await response.json();
      console.log('[PushManager] Trigger result:', result);

      if (result.stats?.sent === 0) {
        throw new Error('Notification sent but not delivered. Your subscription may have been lost. Please re-subscribe.');
      }

      setLastNotification(new Date());
      setNotificationCount(prev => prev + 1);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger notification');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await fetch('/api/unsubscribe', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });

          await subscription.unsubscribe();
        }
      }

      setStatus({
        subscribed: false,
        permission: Notification.permission,
        intervalId: null,
      });
      setSubscriptionValid(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold">Push Notifications</h2>

        {/* Subscription Status Warning */}
        {status.subscribed && !subscriptionValid && (
          <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-3 text-sm">
            <p className="text-yellow-400 font-medium">⚠️ Subscription may be out of sync. Try re-subscribing.</p>
          </div>
        )}

        {/* Permission Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Permission:</span>
            <span className={`font-medium ${
              status.permission === 'granted' ? 'text-green-400' :
              status.permission === 'denied' ? 'text-red-400' :
              'text-yellow-400'
            }`}>
              {status.permission.charAt(0).toUpperCase() + status.permission.slice(1)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Subscription:</span>
            <span className={`font-medium ${
              status.subscribed ? 'text-green-400' : 'text-gray-400'
            }`}>
              {status.subscribed ? 'Active' : 'Inactive'}
            </span>
          </div>

          {lastNotification && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Last notification:</span>
              <span className="text-gray-300">
                {lastNotification.toLocaleTimeString()}
              </span>
            </div>
          )}

          {status.subscribed && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total received:</span>
              <span className="text-gray-300">{notificationCount}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!status.subscribed ? (
            <>
              {isMacOSSafari ? (
                <div className="w-full py-3 px-4 bg-red-600/20 border border-red-600/30 rounded-lg text-center">
                  <p className="text-sm text-red-400 font-medium">Not Supported on macOS Safari</p>
                  <p className="text-xs text-gray-400 mt-1">Please use Chrome, Edge, or Firefox</p>
                </div>
              ) : !isPushSupported ? (
                <div className="w-full py-3 px-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg text-center">
                  <p className="text-sm text-yellow-400 font-medium">Push Not Supported</p>
                  <p className="text-xs text-gray-400 mt-1">Your browser doesn't support push notifications</p>
                </div>
              ) : (
                <button
                  onClick={subscribeToPush}
                  disabled={isLoading || status.permission === 'denied'}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Subscribing...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      Enable Notifications
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <button
                onClick={triggerTestNotification}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Test Notification
                  </>
                )}
              </button>

              <button
                onClick={unsubscribeFromPush}
                disabled={isLoading}
                className="w-full py-3 px-4 bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-700 disabled:cursor-not-allowed border border-red-600/30 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-red-400"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Unsubscribing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Unsubscribe
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Auto-notification indicator */}
        {status.subscribed && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-sm text-green-400 flex items-center gap-2">
            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0 1 0 0 2z" />
            </svg>
            Auto-notifications every 10 seconds
          </div>
        )}
      </div>
    </div>
  );
}
