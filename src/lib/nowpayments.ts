import crypto from 'crypto';

const NOWPAYMENTS_API_BASE = 'https://api.nowpayments.io/v1';

export interface NowPaymentsInvoiceRequest {
  priceAmount: number;
  priceCurrency: string;
  payCurrency?: string;
  orderId: string;
  orderDescription: string;
  successUrl?: string;
  cancelUrl?: string;
  ipnCallbackUrl?: string;
}

export interface NowPaymentsInvoiceResponse {
  id?: string | number;
  invoice_id?: string | number;
  invoice_url?: string;
  payment_status?: string;
  pay_currency?: string;
  price_amount?: number;
  price_currency?: string;
  order_id?: string;
}

function getApiKey(): string {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) {
    throw new Error('NOWPayments API key is missing. Add NOWPAYMENTS_API_KEY to your environment.');
  }
  return apiKey;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export async function createNowPaymentsInvoice(input: NowPaymentsInvoiceRequest): Promise<NowPaymentsInvoiceResponse> {
  const response = await fetch(`${NOWPAYMENTS_API_BASE}/invoice`, {
    method: 'POST',
    headers: {
      'x-api-key': getApiKey(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      price_amount: input.priceAmount,
      price_currency: input.priceCurrency,
      pay_currency: input.payCurrency,
      order_id: input.orderId,
      order_description: input.orderDescription,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      ipn_callback_url: input.ipnCallbackUrl,
      is_fee_paid_by_user: false,
    }),
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'Could not create NOWPayments invoice.');
  }

  return payload as NowPaymentsInvoiceResponse;
}

export async function fetchNowPaymentsCurrencies(): Promise<string[]> {
  const response = await fetch(`${NOWPAYMENTS_API_BASE}/currencies`, {
    headers: {
      'x-api-key': getApiKey(),
    },
    cache: 'no-store',
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || 'Could not load NOWPayments currencies.');
  }

  return Array.isArray(payload?.currencies) ? payload.currencies : [];
}

function sortObject(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortObject);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortObject((value as Record<string, unknown>)[key]);
        return result;
      }, {});
  }

  return value;
}

export function verifyNowPaymentsSignature(payload: unknown, signature: string | null): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret || !signature) return false;
  const digest = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(sortObject(payload)))
    .digest('hex');

  return digest === signature;
}
