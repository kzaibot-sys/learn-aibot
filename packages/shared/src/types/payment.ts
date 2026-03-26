export interface CreatePaymentDto {
  courseId: string;
  provider: 'YOOKASSA' | 'STRIPE';
}

export interface PaymentResult {
  paymentUrl: string;
  paymentId: string;
}
