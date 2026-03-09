import { NextRequest, NextResponse } from 'next/server';
import { createNowPaymentsInvoice, getAppUrl } from '@/lib/nowpayments';
import {
  validateEmail,
  validatePayCurrency,
  ValidationError,
} from '@/lib/inputValidation';

const PLAN_MAP = {
  'pro-monthly': {
    name: 'Arcus Pro Monthly',
    amount: 19,
    interval: 'month',
  },
} as const;

export async function POST(request: NextRequest) {
  // Enforce request body size (16 KB max)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 16_384) {
    return NextResponse.json({ error: 'Request body too large.' }, { status: 413 });
  }

  try {
    const body = await request.json();

    // Validate planId against the static allowlist (prevents enumeration)
    const planId = typeof body?.planId === 'string' ? body.planId : '';
    const plan = PLAN_MAP[planId as keyof typeof PLAN_MAP];
    if (!plan) {
      return NextResponse.json(
        { error: 'Unknown billing plan.' },
        { status: 400 }
      );
    }

    // Validate optional pay currency against an explicit allowlist
    const payCurrency = validatePayCurrency(body?.payCurrency);

    // userId: strip to alphanumeric + hyphens only to prevent injection
    const rawUserId = typeof body?.userId === 'string' ? body.userId : 'guest';
    const userId = rawUserId.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 128) || 'guest';

    // Validate email format
    const email = validateEmail(body?.email ?? '');

    const appUrl = getAppUrl();
    const orderId = `arcus-${planId}-${userId}-${Date.now()}`;
    const invoice = await createNowPaymentsInvoice({
      priceAmount: plan.amount,
      priceCurrency: 'usd',
      payCurrency,
      orderId,
      orderDescription: `${plan.name}${email ? ` for ${email}` : ''}`,
      successUrl: `${appUrl}?billing=success&plan=${planId}`,
      cancelUrl: `${appUrl}?billing=cancelled`,
      ipnCallbackUrl: `${appUrl}/api/billing/webhook`,
    });

    return NextResponse.json({
      invoice,
      plan: {
        id: planId,
        ...plan,
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Could not create invoice.',
      },
      { status: 500 }
    );
  }
}
