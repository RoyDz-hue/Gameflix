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

interface PayHeroSuccessResponse {
  forward_url?: string;
  response?: {
    Amount: number;
    CheckoutRequestID: string;
    ExternalReference: string;
    MerchantRequestID: string;
    RecipientAccountNumber: string;
    ResultCode: number;
    ResultDesc: string;
    Status: string;
    TransactionID: string;
  };
  status?: boolean;
  merchant_reference?: string;
  checkout_request_id?: string;
  response_code?: string;
  conversation_id?: string;
}

export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
export type TransactionStatus = z.infer<typeof transactionStatusSchema>;

export class PayHeroService {
  private baseUrl: string;
  private credentials: string;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'https://backend.payhero.co.ke/api/v2/';
    const apiUsername = process.env.PAYHERO_API_USERNAME;
    const apiPassword = process.env.PAYHERO_API_PASSWORD;

    if (!apiUsername || !apiPassword) {
      throw new Error('PAYHERO_API_USERNAME and PAYHERO_API_PASSWORD must be set');
    }

    this.credentials = Buffer.from(`${apiUsername}:${apiPassword}`).toString('base64');
  }

  private formatPhoneNumber(phone: string): string {
    phone = phone.replace(/\D/g, '');
    if (phone.length === 9) return '254' + phone;
    if (phone.length === 10 && phone.startsWith('0')) return '254' + phone.slice(1);
    return phone.replace(/^(?:254|\+254|0)(\d{9})$/, '254$1');
  }

  private isSuccessStatus(status: string): boolean {
    return status.toLowerCase() === 'success';
  }

  async initiateWithdrawal(amount: number, phone: string, userId: number): Promise<PaymentResponse> {
    const formattedPhone = this.formatPhoneNumber(phone);
    if (!formattedPhone.match(/^254\d{9}$/)) {
      throw new Error('Invalid phone number');
    }

    const externalReference = `withdraw_${Date.now()}_${userId}`;
    const callbackUrl = typeof window !== 'undefined' ? window.location.origin + '/api/callback' : process.env.PAYHERO_CALLBACK_URL;

    const payload = {
      external_reference: externalReference,
      amount: Math.floor(amount),
      phone_number: formattedPhone,
      network_code: '63902',
      callback_url: callbackUrl,
      channel: 'mobile',
      channel_id: 1564, // Mobile withdrawal channel ID
      payment_service: 'b2c'
    };

    try {
      const response = await fetch(`${this.baseUrl}withdraw`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${this.credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json() as PayHeroSuccessResponse;

      if (!response.ok) {
        const error = data as WithdrawalError;
        const errorMessage = [
          error.error_message || error.message || 'Unknown error',
          error.error_code ? `Error code: ${error.error_code}` : null,
          error.status_code ? `Status code: ${error.status_code}` : null
        ].filter(Boolean).join('. ');

        throw new Error(errorMessage);
      }

      if (data.response && this.isSuccessStatus(data.response.Status)) {
        return paymentResponseSchema.parse({
          status: "SUCCESS",
          merchant_reference: data.response.MerchantRequestID,
          checkout_request_id: data.response.CheckoutRequestID,
          response_code: data.response.ResultCode.toString(),
          conversation_id: data.response.TransactionID,
          reference: externalReference
        });
      }

      return paymentResponseSchema.parse({
        status: data.status ? "SUCCESS" : "QUEUED",
        merchant_reference: data.merchant_reference,
        checkout_request_id: data.checkout_request_id,
        response_code: data.response_code,
        conversation_id: data.conversation_id,
        reference: externalReference
      });

    } catch (error: any) {
      throw new Error(error.message || 'Withdrawal initiation failed');
    }
  }

  async initiateSTKPush(amount: number, phone: string, userId: number): Promise<PaymentResponse> {
    const formattedPhone = this.formatPhoneNumber(phone);
    if (!formattedPhone.match(/^254\d{9}$/)) {
      throw new Error('Invalid phone number');
    }

    const callbackUrl = typeof window !== 'undefined' ? window.location.origin + '/api/callback' : process.env.PAYHERO_CALLBACK_URL;

    const payload = {
      amount: Math.floor(amount),
      phone_number: formattedPhone,
      channel_id: 1487, // STK push channel ID
      external_reference: `deposit_${Date.now()}_${userId}`,
      provider: 'm-pesa',
      channel: 'mobile',
      payment_service: 'c2b',
      network_code: '63902',
      callback_url: callbackUrl
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
      throw new Error(error.message || 'Payment initiation failed');
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

      if (data.response && this.isSuccessStatus(data.response.Status)) {
        return transactionStatusSchema.parse({
          status: "SUCCESS",
          success: true,
          provider: "mpesa",
          reference: reference,
          payment_reference: data.response.TransactionID,
          third_party_reference: data.response.MerchantRequestID,
          CheckoutRequestID: data.response.CheckoutRequestID,
          provider_reference: data.response.TransactionID
        });
      }

      return transactionStatusSchema.parse(data);
    } catch (error: any) {
      throw new Error(error.message || 'Transaction status check failed');
    }
  }
}

export const payHero = new PayHeroService();