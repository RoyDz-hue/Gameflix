import { z } from "zod";

const paymentResponseSchema = z.object({
  status: z.enum(["QUEUED", "SUCCESS", "FAILED"]),
  merchant_reference: z.string().optional(),
  checkout_request_id: z.string().optional(),
  response_code: z.string().optional(),
  conversation_id: z.string().optional(),
  reference: z.string()
});

const transactionStatusSchema = z.object({
  transaction_date: z.string().optional(),
  provider: z.string(),
  success: z.boolean(),
  merchant: z.string().optional(),
  payment_reference: z.string(),
  third_party_reference: z.string(),
  status: z.enum(["QUEUED", "SUCCESS", "FAILED"]),
  reference: z.string(),
  CheckoutRequestID: z.string(),
  provider_reference: z.string()
});

export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

export class PayHeroService {
  private baseUrl = 'https://backend.payhero.co.ke/api/v2/';
  private credentials: string;

  constructor() {
    const username = process.env.PAYHERO_USERNAME;
    const password = process.env.PAYHERO_PASSWORD;

    if (!username || !password) {
      throw new Error('PayHero credentials not configured');
    }

    this.credentials = Buffer.from(`${username}:${password}`).toString('base64');
  }

  private formatPhoneNumber(phone: string): string {
    phone = phone.replace(/\D/g, '');
    if (phone.length === 9) return '254' + phone;
    if (phone.length === 10 && phone.startsWith('0')) return '254' + phone.slice(1);
    return phone.replace(/^(?:254|\+254|0)(\d{9})$/, '254$1');
  }

  async initiateSTKPush(amount: number, phone: string, userId: number): Promise<PaymentResponse> {
    const formattedPhone = this.formatPhoneNumber(phone);
    if (!formattedPhone.match(/^254\d{9}$/)) {
      throw new Error('Invalid phone number');
    }

    const payload = {
      amount: Math.floor(amount), // Convert to integer
      phone_number: formattedPhone,
      channel_id: '1487',
      external_reference: `spin_${Date.now()}_${userId}`,
      provider: 'm-pesa',
      channel: 'mobile',
      payment_service: 'c2b',
      network_code: '63902', // Safaricom network code
      callback_url: process.env.PAYHERO_CALLBACK_URL
    };

    const response = await fetch(`${this.baseUrl}payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment initiation failed');
    }

    const data = await response.json();
    return paymentResponseSchema.parse(data);
  }

  async initiateWithdrawal(amount: number, phone: string, userId: number): Promise<PaymentResponse> {
    const formattedPhone = this.formatPhoneNumber(phone);
    if (!formattedPhone.match(/^254\d{9}$/)) {
      throw new Error('Invalid phone number');
    }

    const payload = {
      amount: Math.floor(amount),
      phone_number: formattedPhone,
      channel_id: '1487',
      external_reference: `withdraw_${Date.now()}_${userId}`,
      provider: 'm-pesa',
      channel: 'mobile',
      payment_service: 'b2c',
      network_code: '63902',
      callback_url: process.env.PAYHERO_CALLBACK_URL
    };

    const response = await fetch(`${this.baseUrl}withdraw`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Withdrawal initiation failed');
    }

    const data = await response.json();
    return paymentResponseSchema.parse(data);
  }

  async checkTransactionStatus(reference: string): Promise<TransactionStatus> {
    const response = await fetch(
      `${this.baseUrl}transaction-status?reference=${reference}`,
      {
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Cache-Control': 'no-cache'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Transaction status check failed');
    }

    const data = await response.json();
    return transactionStatusSchema.parse(data);
  }
}

// Create a singleton instance
export const payHero = new PayHeroService();