// Simple in-memory storage for push subscriptions
// In production, use Vercel KV, Redis, or a database

import webpush from 'web-push';

// Configure VAPID
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';

if (typeof window === 'undefined' && publicKey && privateKey) {
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    publicKey,
    privateKey
  );
}

// In-memory storage
const subscriptions = new Map<string, any>();

export const storage = {
  subscriptions,
  webpush,

  add(endpoint: string, subscription: any) {
    subscriptions.set(endpoint, subscription);
    console.log('[Storage] Subscription added:', endpoint);
  },

  remove(endpoint: string) {
    const deleted = subscriptions.delete(endpoint);
    console.log('[Storage] Subscription removed:', endpoint, deleted);
    return deleted;
  },

  get(endpoint: string) {
    return subscriptions.get(endpoint);
  },

  getAll() {
    return Array.from(subscriptions.values());
  },

  count() {
    return subscriptions.size;
  },

  async sendNotification(subscription: any, payload: string | object) {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return webpush.sendNotification(subscription, payloadString);
  },

  async broadcast(payload: string | object) {
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

    for (const [endpoint, subscription] of subscriptions.entries()) {
      try {
        await webpush.sendNotification(subscription, payloadString);
        results.sent++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${endpoint}: ${error.message}`);

        // Remove invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          subscriptions.delete(endpoint);
          console.log('[Storage] Removed invalid subscription:', endpoint);
        }
      }
    }

    return results;
  },
};
