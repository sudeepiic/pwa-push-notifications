import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/subscriptions';

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
    storage.add(subscription.endpoint, subscription);

    // Send a welcome notification
    try {
      await storage.sendNotification(subscription, {
        title: '✅ Notifications Enabled!',
        body: 'You will receive a notification every 10 seconds.',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        data: {
          url: '/',
        },
      });
    } catch (pushError: any) {
      console.error('[API] Error sending welcome notification:', pushError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription registered successfully',
      subscriptionCount: storage.count(),
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
    subscriptionCount: storage.count(),
    endpoints: storage.getAll().map((s: any) => s.endpoint),
  });
}
