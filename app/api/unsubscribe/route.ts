import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/storage/subscriptions';

export async function DELETE(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Remove the subscription
    const deleted = storage.remove(endpoint);

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Subscription removed successfully' : 'Subscription not found',
      remainingSubscriptions: storage.count(),
    });

  } catch (error) {
    console.error('[API] Error in unsubscribe route:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
