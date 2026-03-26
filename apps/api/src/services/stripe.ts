import crypto from 'crypto';
import { config } from '../config';

interface CreateStripePaymentParams {
  amount: number; // in smallest currency unit (kopecks/cents)
  currency: string;
  courseTitle: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}

interface StripeSessionResponse {
  id: string;
  url: string;
}

export async function createStripePayment(params: CreateStripePaymentParams): Promise<StripeSessionResponse> {
  const body = new URLSearchParams({
    'mode': 'payment',
    'line_items[0][price_data][currency]': params.currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(params.amount),
    'line_items[0][price_data][product_data][name]': params.courseTitle,
    'line_items[0][quantity]': '1',
    'success_url': params.successUrl,
    'cancel_url': params.cancelUrl,
  });

  for (const [key, value] of Object.entries(params.metadata)) {
    body.append(`metadata[${key}]`, value);
  }

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.stripe.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Stripe API error: ${response.status} ${errorBody}`);
  }

  return response.json() as Promise<StripeSessionResponse>;
}

export function verifyStripeWebhook(rawBody: Buffer, signature: string): Record<string, unknown> | null {
  const secret = config.stripe.webhookSecret;
  if (!secret || !signature) return null;

  const parts = signature.split(',');
  const timestampPart = parts.find(p => p.startsWith('t='));
  const sigPart = parts.find(p => p.startsWith('v1='));

  if (!timestampPart || !sigPart) return null;

  const timestamp = timestampPart.slice(2);
  const expectedSig = sigPart.slice(3);

  const payload = `${timestamp}.${rawBody.toString('utf8')}`;
  const computedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(computedSig), Buffer.from(expectedSig))) {
    return null;
  }

  // Reject timestamps older than 5 minutes
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return null;
  }

  return JSON.parse(rawBody.toString('utf8')) as Record<string, unknown>;
}
