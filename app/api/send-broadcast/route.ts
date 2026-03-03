import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/subscriptions';

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

    const results = await storage.broadcast(notificationPayload);

    console.log('[API] Broadcast notification sent:', {
      sent: results.sent,
      failed: results.failed,
      total: storage.count(),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Broadcast sent successfully',
      stats: {
        sent: results.sent,
        failed: results.failed,
        total: storage.count(),
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

    const results = await storage.broadcast(notificationPayload);

    return NextResponse.json({
      success: true,
      stats: {
        sent: results.sent,
        failed: results.failed,
        total: storage.count(),
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
