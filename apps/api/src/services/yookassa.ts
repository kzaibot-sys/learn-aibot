import crypto from 'crypto';
import { config } from '../config';

interface CreateYooKassaPaymentParams {
  amount: string;
  currency: string;
  description: string;
  returnUrl: string;
  metadata: Record<string, string>;
}

interface YooKassaPaymentResponse {
  id: string;
  confirmation: {
    confirmation_url: string;
  };
}

export async function createYooKassaPayment(params: CreateYooKassaPaymentParams): Promise<YooKassaPaymentResponse> {
  const idempotenceKey = crypto.randomUUID();

  const response = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotence-Key': idempotenceKey,
      Authorization: `Basic ${Buffer.from(`${config.yookassa.shopId}:${config.yookassa.secretKey}`).toString('base64')}`,
    },
    body: JSON.stringify({
      amount: {
        value: params.amount,
        currency: params.currency,
      },
      confirmation: {
        type: 'redirect',
        return_url: params.returnUrl,
      },
      capture: true,
      description: params.description,
      metadata: params.metadata,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`YooKassa API error: ${response.status} ${errorBody}`);
  }

  return response.json() as Promise<YooKassaPaymentResponse>;
}

export function verifyYooKassaWebhook(body: Record<string, unknown>): boolean {
  // YooKassa uses IP whitelist for webhook verification
  // Verify the event structure is valid
  return (
    typeof body === 'object' &&
    body !== null &&
    'event' in body &&
    'object' in body &&
    typeof (body as Record<string, unknown>).event === 'string'
  );
}
