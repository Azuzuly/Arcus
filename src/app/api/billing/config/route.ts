import { NextResponse } from 'next/server';
import { fetchNowPaymentsCurrencies, hasNowPaymentsConfig } from '@/lib/nowpayments';

export async function GET() {
  try {
    const billingEnabled = hasNowPaymentsConfig();
    const currencies = billingEnabled ? await fetchNowPaymentsCurrencies() : ['btc', 'eth', 'sol', 'usdttrc20'];
    return NextResponse.json({
      billingEnabled,
      plans: [
        {
          id: 'pro-monthly',
          name: 'Arcus Pro Monthly',
          price: 19,
          currency: 'usd',
          interval: 'month',
          badge: 'Popular',
        },
        {
          id: 'pro-annual',
          name: 'Arcus Pro Annual',
          price: 180,
          currency: 'usd',
          interval: 'year',
          badge: 'Best value',
        },
      ],
      currencies: currencies.filter(currency => ['btc', 'eth', 'sol', 'usdttrc20', 'usdt', 'trx', 'ltc'].includes(String(currency).toLowerCase())).slice(0, 7),
    });
  } catch (error) {
    return NextResponse.json({
      billingEnabled: false,
      plans: [
        { id: 'pro-monthly', name: 'Arcus Pro Monthly', price: 19, currency: 'usd', interval: 'month', badge: 'Popular' },
        { id: 'pro-annual', name: 'Arcus Pro Annual', price: 180, currency: 'usd', interval: 'year', badge: 'Best value' },
      ],
      currencies: ['btc', 'eth', 'sol', 'usdttrc20'],
      error: error instanceof Error ? error.message : 'Could not load billing configuration.',
    });
  }
}
