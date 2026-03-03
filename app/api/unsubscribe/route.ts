import { NextRequest, NextResponse } from 'next/server';
import { subscriptions } from '../subscribe/route';

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
    const deleted = subscriptions.delete(endpoint);

    console.log('[API] Subscription removed:', endpoint);

    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Subscription removed successfully' : 'Subscription not found',
      remainingSubscriptions: subscriptions.size,
    });

  } catch (error) {
    console.error('[API] Error in unsubscribe route:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
