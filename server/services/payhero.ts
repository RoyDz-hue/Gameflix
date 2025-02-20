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

interface WithdrawalError {
  error_code?: string;
  error_message?: string;
  status_code?: number;
  message?: string;
}

export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

export class PayHeroService {
  private baseUrl: string;
  private credentials: string;
  private merchantId: string;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'https://backend.payhero.co.ke/api/v2/';
    this.merchantId = process.env.PAYHERO_MERCHANT_ID || '';

    // Get API credentials from environment variables
    const apiUsername = process.env.API_USERNAME;
    const apiPassword = process.env.API_PASSWORD;

    if (!apiUsername || !apiPassword) {
      throw new Error('API_USERNAME and API_PASSWORD must be set');
    }

    // Create Basic Auth token as shown in the PHP example
    this.credentials = Buffer.from(`${apiUsername}:${apiPassword}`).toString('base64');
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
      amount: Math.floor(amount),
      phone_number: formattedPhone,
      channel_id: this.merchantId,
      external_reference: `deposit_${Date.now()}_${userId}`,
      provider: 'm-pesa',
      channel: 'mobile',
      payment_service: 'c2b',
      network_code: '63902',
      callback_url: process.env.PAYHERO_CALLBACK_URL
    };

    try {
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
    } catch (error: any) {
      console.error('STK Push Error:', error);
      throw new Error(error.message || 'Payment initiation failed');
    }
  }

  async initiateWithdrawal(amount: number, phone: string, userId: number): Promise<PaymentResponse> {
    const formattedPhone = this.formatPhoneNumber(phone);
    if (!formattedPhone.match(/^254\d{9}$/)) {
      throw new Error('Invalid phone number');
    }

    const externalReference = `withdraw_${Date.now()}_${userId}`;

    const payload = {
      external_reference: externalReference,
      amount: Math.floor(amount),
      phone_number: formattedPhone,
      network_code: '63902',
      callback_url: process.env.PAYHERO_CALLBACK_URL,
      channel: 'mobile',
      channel_id: this.merchantId,
      payment_service: 'b2c'
    };

    try {
      console.log('Withdrawal Request:', {
        url: `${this.baseUrl}withdraw`,
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Content-Type': 'application/json'
        },
        payload
      });

      const response = await fetch(`${this.baseUrl}withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      console.log('Withdrawal API Response:', {
        status: response.status,
        statusText: response.statusText,
        data
      });

      if (!response.ok) {
        const error = data as WithdrawalError;
        console.error('Withdrawal Error Response:', error);

        // Construct detailed error message
        const errorMessage = [
          error.error_message || error.message || 'Unknown error',
          error.error_code ? `Error code: ${error.error_code}` : null,
          error.status_code ? `Status code: ${error.status_code}` : null
        ].filter(Boolean).join('. ');

        throw new Error(errorMessage);
      }

      // Parse successful response
      if (data.response) {
        return paymentResponseSchema.parse({
          status: data.response.Status === "Success" ? "SUCCESS" : "QUEUED",
          merchant_reference: data.response.MerchantRequestID,
          checkout_request_id: data.response.CheckoutRequestID,
          response_code: data.response.ResultCode?.toString(),
          conversation_id: data.response.TransactionID,
          reference: externalReference
        });
      }

      // If response doesn't match expected format
      console.error('Unexpected API response format:', data);
      throw new Error('Unexpected API response format');

    } catch (error: any) {
      console.error('Withdrawal Error:', {
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });
      throw new Error(error.message || 'Withdrawal initiation failed');
    }
  }

  async checkTransactionStatus(reference: string): Promise<TransactionStatus> {
    try {
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
    } catch (error: any) {
      console.error('Status Check Error:', error);
      throw new Error(error.message || 'Transaction status check failed');
    }
  }
}

export const payHero = new PayHeroService();