# Debugging Push Notifications on Chrome

## Quick Fix: Set VAPID Keys in Vercel

The most common issue is missing VAPID keys in your Vercel environment.

### Step 1: Get your VAPID keys

Run this locally:
```bash
pnpm run generate-vapid
```

### Step 2: Add to Vercel

Via CLI:
```bash
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production
# Paste your public key

vercel env add VAPID_PRIVATE_KEY production
# Paste your private key

vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY preview
# Paste your public key

vercel env add VAPID_PRIVATE_KEY preview
# Paste your private key
```

Or via Dashboard:
1. Go to https://vercel.com/sudeepiic/pwa-push-notifications/settings/environment-variables
2. Add these variables:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
3. Redeploy after adding

## Debug Steps

### 1. Check Service Worker
1. Open your site in Chrome
2. Open DevTools (F12)
3. Go to Application → Service Workers
4. Check if `sw.js` is registered and active

### 2. Check Subscription
1. Open DevTools → Console
2. Run:
```javascript
navigator.serviceWorker.getRegistration().then(async (reg) => {
  const sub = await reg.pushManager.getSubscription();
  console.log('Subscription:', sub);
});
```

### 3. Check Permission
```javascript
console.log('Notification Permission:', Notification.permission);
```

### 4. Test API Endpoints

Test subscription:
```bash
curl -X GET https://pwa-push-notifications.vercel.app/api/subscribe
```

Test notification trigger:
```bash
curl -X POST https://pwa-push-notifications.vercel.app/api/trigger
```

## Common Issues & Fixes

### Issue: Service Worker Not Registering
**Fix:** Check browser console for errors. Verify HTTPS.

### Issue: Subscription Fails
**Fix:** Verify VAPID keys are set correctly in Vercel.

### Issue: No Notifications Arrive
**Fix:** Check if notification permission is "granted" and subscription is active.

### Issue: In-Memory Subscription Lost
**Current behavior:** Subscriptions are lost when Vercel function cold starts.
**Workaround:** Re-subscribe after cold start.
**Production fix:** Use Vercel KV or database.
