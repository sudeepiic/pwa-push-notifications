import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/subscriptions';

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

    const results = await storage.broadcast(notificationPayload);

    console.log('[API] Trigger notification sent:', {
      sent: results.sent,
      failed: results.failed,
      total: storage.count(),
    });

    return NextResponse.json({
      success: true,
      message: 'Notification sent to all subscribers',
      stats: {
        sent: results.sent,
        failed: results.failed,
        total: storage.count(),
      },
      errors: results.errors.length > 0 ? results.errors : undefined,
    });

  } catch (error) {
    console.error('[API] Error in trigger route:', error);
    return NextResponse.json(
      { error: 'Failed to trigger notification' },
      { status: 500 }
    );
  }
}
