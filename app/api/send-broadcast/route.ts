import { NextRequest, NextResponse } from 'next/server';
import { subscriptions, webpush } from '../subscribe/route';

export async function POST(request: NextRequest) {
  try {
    const notificationPayload = {
      title: '⏰ Scheduled Notification',
      body: `PWA Push notification at ${new Date().toLocaleTimeString()}`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: `scheduled-${Date.now()}`,
      requireInteraction: false,
      silent: false,
      data: {
        url: '/',
        timestamp: Date.now(),
      },
    };

    let successCount = 0;
    let failureCount = 0;

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

        // Remove invalid subscriptions (410 = Gone, 404 = Not Found)
        if (error.statusCode === 404 || error.statusCode === 410) {
          subscriptions.delete(endpoint);
          console.log('[API] Removed invalid subscription:', endpoint);
        }
      }
    }

    console.log('[API] Broadcast notification sent:', {
      successCount,
      failureCount,
      totalSubscribers: subscriptions.size,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Broadcast sent successfully',
      stats: {
        sent: successCount,
        failed: failureCount,
        total: subscriptions.size,
      },
    });

  } catch (error) {
    console.error('[API] Error in send-broadcast route:', error);
    return NextResponse.json(
      { error: 'Failed to send broadcast' },
      { status: 500 }
    );
  }
}

// Also support GET for simple polling
export async function GET() {
  try {
    const notificationPayload = {
      title: '⏰ Scheduled Notification',
      body: `PWA Push notification at ${new Date().toLocaleTimeString()}`,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: `scheduled-${Date.now()}`,
      data: {
        url: '/',
        timestamp: Date.now(),
      },
    };

    let successCount = 0;
    let failureCount = 0;

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

        // Remove invalid subscriptions
        if (error.statusCode === 404 || error.statusCode === 410) {
          subscriptions.delete(endpoint);
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        sent: successCount,
        failed: failureCount,
        total: subscriptions.size,
      },
    });

  } catch (error) {
    console.error('[API] Error in send-broadcast GET route:', error);
    return NextResponse.json(
      { error: 'Failed to send broadcast' },
      { status: 500 }
    );
  }
}
