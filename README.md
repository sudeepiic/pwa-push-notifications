# PWA Push Notifications

A Progressive Web App (PWA) with push notification support that works on iOS (16.4+), Android, and desktop browsers (Chrome, Edge, Firefox). The app sends push notifications every 10 seconds.

## Features

- ✅ PWA with offline support
- ✅ Push notifications every 10 seconds
- ✅ iOS 16.4+ support (home screen install required)
- ✅ Android support
- ✅ macOS Chrome/Edge/Firefox support
- ❌ macOS Safari NOT supported (Web Push API not available)
- ✅ VAPID authentication for secure push
- ✅ Service Worker for background handling
- ✅ Responsive design with Tailwind CSS

## Tech Stack

- **Framework:** Next.js 14+ (App Router) with TypeScript
- **PWA Support:** next-pwa for service worker and manifest generation
- **Push Notifications:** Web Push API with VAPID
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Project Structure

```
pwa-push-notifications/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker (push handling)
│   ├── icon-192x192.png       # App icons
│   ├── icon-512x512.png
│   └── apple-touch-icon.png   # iOS icon
├── app/
│   ├── api/
│   │   ├── subscribe/route.ts      # Store push subscriptions
│   │   ├── unsubscribe/route.ts    # Remove subscriptions
│   │   ├── trigger/route.ts        # Manual notification trigger
│   │   └── send-broadcast/route.ts # Scheduled notifications
│   ├── layout.tsx             # Layout with iOS meta tags
│   ├── page.tsx               # Main UI
│   └── globals.css
├── components/
│   └── PushNotificationManager.tsx # Push notification UI component
├── lib/
├── scripts/
│   ├── generate-vapid-keys.js # VAPID key generation
│   └── create-png-icons.js    # Icon creation
├── next.config.js             # PWA configuration
├── vercel.json                # Vercel deployment config
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Generate VAPID Keys

```bash
pnpm run generate-vapid
```

This will generate new VAPID keys. Add them to your `.env.local` file:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

### 3. Run Development Server

```bash
pnpm run dev
```

Access the app at `http://localhost:3000`

**Note:** Service workers and push notifications may not work properly in localhost. Deploy to Vercel for full functionality.

### 4. Build for Production

```bash
pnpm run build
pnpm start
```

## Deployment to Vercel

```bash
vercel
```

Or use the Vercel CLI to deploy:

```bash
vercel --prod
```

**Important:** After deployment, update your environment variables in the Vercel dashboard with your VAPID keys.

## Testing Instructions

### iOS Testing (Critical Steps)

**Requirements:**
- iOS 16.4 or later
- Physical device (not simulator)
- Safari browser
- HTTPS connection

**Steps:**

1. **Deploy to Vercel first** - Push notifications require HTTPS

2. **Open Safari** on your iOS device and navigate to your deployed URL

3. **Add to Home Screen:**
   - Tap the Share button (box with arrow pointing up)
   - Scroll down and tap "Add to Home Screen"
   - Tap "Add" in the top right corner

4. **Open from Home Screen:**
   - **CRITICAL:** Close Safari
   - Open the app by tapping the icon on your home screen (NOT from Safari)

5. **Enable Notifications:**
   - Tap "Enable Notifications" button
   - Allow notifications when prompted by iOS

6. **Verify:**
   - You should see "Subscribed: Active" status
   - You should receive a welcome notification
   - You should receive notifications every 10 seconds

**iOS Troubleshooting:**

- **No notifications appearing?**
  - Make sure you opened the app from the home screen, not Safari
  - Check iOS Settings > Notifications > [App Name] > Allow Notifications
  - Verify you're on iOS 16.4 or later
  - Make sure the app was added to home screen AFTER enabling push notifications

- **"Notifications not supported" error?**
  - Make sure you opened from home screen
  - Check browser console for errors
  - Verify VAPID keys are configured

- **Service worker not registering?**
  - Clear Safari cache and try again
  - Remove from home screen and re-add
  - Make sure you're using HTTPS

### Android Testing

**Requirements:**
- Chrome browser
- HTTPS or localhost

**Steps:**

1. Open Chrome on your Android device
2. Navigate to your app URL (can use localhost for testing)
3. Tap "Enable Notifications"
4. Allow notifications when prompted
5. You should receive notifications every 10 seconds

### Desktop Testing

**Note:** Push notifications work on desktop Chrome/Edge, but NOT on Safari (macOS doesn't support PWA push notifications).

## API Endpoints

### POST /api/subscribe
Store a new push subscription

**Request:**
```json
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

### DELETE /api/unsubscribe
Remove a push subscription

**Request:**
```json
{
  "endpoint": "https://fcm.githubusercontent.com/..."
}
```

### POST /api/trigger
Send a test notification to all subscribers

### POST /api/send-broadcast
Send scheduled notification to all subscribers (called every 10 seconds)

## Notification Scheduling

The app uses **client-side polling** to send notifications every 10 seconds:

1. Client polls `/api/send-broadcast` every 10 seconds
2. Server sends push notifications to all subscribers
3. Each subscriber receives the notification

**Why client-side polling?**
- Vercel Hobby plan doesn't support cron jobs
- Serverless functions have execution time limits
- This approach works on all platforms including iOS

**Alternative approaches:**
- Use Vercel Cron Jobs (Pro Plan only)
- Use external cron service (cron-job.org)
- Use a dedicated backend server

## Environment Variables

```env
# VAPID Keys (required for Web Push API)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

## Subscription Storage

**Current Implementation:** In-memory storage using a Map object

**Limitations:**
- Subscriptions are lost when serverless function restarts
- Not suitable for production use

**Production Alternatives:**
- Vercel KV (Redis)
- Redis Cloud
- PostgreSQL database
- MongoDB

## iOS-Specific Considerations

### Why iOS Push Notifications Are Difficult

1. **Version Requirement:** Only works on iOS 16.4+ (released March 2023)
2. **Home Screen Requirement:** Must be added to home screen, not just bookmarked
3. **No Desktop Support:** Safari on macOS doesn't support PWA push
4. **Permission Timing:** Can only request permission after user interaction
5. **Service Worker Limitations:** iOS has stricter SW policies
6. **Testing Difficulty:** Requires physical device, not simulator
7. **Silent Failures:** Errors often fail silently
8. **HTTPS Required:** No localhost exceptions like Android

### iOS Meta Tags

The app includes iOS-specific meta tags in `app/layout.tsx`:

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="PWA Push" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

### Service Worker for iOS

The service worker (`public/sw.js`) includes:
- Proper push event handling
- Notification click handling
- iOS-compatible notification options
- Background sync support

## Common Issues and Solutions

### Issue: Service Worker Won't Register

**Solution:**
- Make sure you're using HTTPS
- Check browser console for errors
- Clear cache and try again

### Issue: No Notifications on iOS

**Solution:**
- Verify you're on iOS 16.4 or later
- Make sure you opened the app from home screen
- Check iOS Settings > Notifications > [App Name]
- Re-add the app to home screen

### Issue: Notifications Stop After Some Time

**Solution:**
- This is normal behavior on iOS
- iOS may throttle background notifications
- Make sure the app is added to home screen

### Issue: VAPID Error

**Solution:**
- Regenerate VAPID keys using `pnpm run generate-vapid`
- Update environment variables
- Redeploy to Vercel

## Browser Compatibility

| Browser | Push Notifications | PWA Support |
|---------|-------------------|-------------|
| iOS Safari 16.4+ | ✅ | ✅ |
| iOS Safari < 16.4 | ❌ | ⚠️ |
| Android Chrome | ✅ | ✅ |
| Desktop Chrome | ✅ | ✅ |
| Desktop Safari | ❌ | ⚠️ |
| Desktop Firefox | ✅ | ✅ |
| Desktop Edge | ✅ | ✅ |

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
