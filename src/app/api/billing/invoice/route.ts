import { NextRequest, NextResponse } from 'next/server';
import { createNowPaymentsInvoice, getAppUrl } from '@/lib/nowpayments';

const PLAN_MAP = {
  'pro-monthly': {
    name: 'Arcus Pro Monthly',
    amount: 19,
    interval: 'month',
  },
  'pro-annual': {
    name: 'Arcus Pro Annual',
    amount: 180,
    interval: 'year',
  },
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const planId = typeof body?.planId === 'string' ? body.planId : '';
    const payCurrency = typeof body?.payCurrency === 'string' ? body.payCurrency.toLowerCase() : undefined;
    const userId = typeof body?.userId === 'string' ? body.userId : 'guest';
    const email = typeof body?.email === 'string' ? body.email : '';

    const plan = PLAN_MAP[planId as keyof typeof PLAN_MAP];
    if (!plan) {
      return NextResponse.json({ error: 'Unknown billing plan.' }, { status: 400 });
    }

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Could not create invoice.' },
      { status: 500 }
    );
  }
}
