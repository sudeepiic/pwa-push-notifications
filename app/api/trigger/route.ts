import { NextRequest, NextResponse } from 'next/server';
import { subscriptions, webpush } from '../subscribe/route';

export async function POST(request: NextRequest) {
  try {
    const notificationPayload = {
      title: '🔔 Test Notification',
      body: `This is a test notification sent at ${new Date().toLocaleTimeString()}`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'test-notification',
      requireInteraction: false,
      data: {
        url: '/',
        timestamp: Date.now(),
      },
    };

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Send notification to all subscribers
    for (const [endpoint, subscription] of subscriptions.entries()) {
      try {
        await webpush.sendNotification(
          subscription,
          JSON.stringify(notificationPayload)
        );
        successCount++;
      } catch (error: any) {
        failureCount++;
        errors.push(`${endpoint}: ${error.message}`);

        // Remove invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          subscriptions.delete(endpoint);
          console.log('[API] Removed invalid subscription:', endpoint);
        }
      }
    }

    console.log('[API] Trigger notification sent:', {
      successCount,
      failureCount,
      totalSubscribers: subscriptions.size,
    });

    return NextResponse.json({
      success: true,
      message: 'Notification sent to all subscribers',
      stats: {
        sent: successCount,
        failed: failureCount,
        total: subscriptions.size,
      },
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('[API] Error in trigger route:', error);
    return NextResponse.json(
      { error: 'Failed to trigger notification' },
      { status: 500 }
    );
  }
}
