import { NextRequest, NextResponse } from 'next/server';
import { verifyNowPaymentsSignature } from '@/lib/nowpayments';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const signature = request.headers.get('x-nowpayments-sig');

    if (!verifyNowPaymentsSignature(payload, signature)) {
      return NextResponse.json({ ok: false, error: 'Invalid signature.' }, { status: 401 });
    }

    return NextResponse.json({ ok: true, received: true, paymentStatus: payload?.payment_status || null });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Webhook processing failed.' },
      { status: 500 }
    );
  }
}
