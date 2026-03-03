import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure VAPID
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';

if (!publicKey || !privateKey) {
  console.error('VAPID keys are not configured');
}

webpush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your email
  publicKey,
  privateKey
);

// In-memory storage for push subscriptions
// In production, use a database like Vercel KV, Redis, or PostgreSQL
const subscriptions = new Map<string, any>();

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Store the subscription
    subscriptions.set(subscription.endpoint, subscription);

    console.log('[API] New subscription registered:', subscription.endpoint);

    // Send a welcome notification
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: '✅ Notifications Enabled!',
          body: 'You will receive a notification every 10 seconds.',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          data: {
            url: '/',
          },
        })
      );
    } catch (pushError: any) {
      console.error('[API] Error sending welcome notification:', pushError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription registered successfully',
      subscriptionCount: subscriptions.size,
    });

  } catch (error) {
    console.error('[API] Error in subscribe route:', error);
    return NextResponse.json(
      { error: 'Failed to register subscription' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    subscriptionCount: subscriptions.size,
    endpoints: Array.from(subscriptions.keys()),
  });
}

// Export for use in other routes
export { subscriptions, webpush };
