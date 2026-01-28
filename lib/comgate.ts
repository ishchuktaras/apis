/**
 * Comgate Payment Gateway Integration
 * Czech payment gateway for online payments
 * 
 * Documentation: https://help.comgate.cz/
 */

import { query } from './db'

interface ComgateConfig {
  merchantId: string
  secret: string
  test?: boolean
}

interface CreatePaymentOptions {
  reservationId: string
  salonId: string
  amount: number // in CZK
  currency?: string
  label: string
  email: string
  phone?: string
  returnUrl: string
  cancelUrl?: string
  notifyUrl?: string
  method?: string // 'ALL', 'CARD', 'BANK_ALL', etc.
}

interface ComgatePaymentResponse {
  code: number
  message: string
  transId?: string
  redirect?: string
}

class ComgateClient {
  private config: ComgateConfig
  private baseUrl = 'https://payments.comgate.cz/v1.0'

  constructor(config: ComgateConfig) {
    this.config = config
  }

  /**
   * Create a new payment
   */
  async createPayment(options: CreatePaymentOptions): Promise<{
    success: boolean
    transactionId?: string
    redirectUrl?: string
    error?: string
  }> {
    try {
      // Prepare payment data
      const paymentData = new URLSearchParams({
        merchant: this.config.merchantId,
        test: this.config.test ? 'true' : 'false',
        country: 'CZ',
        price: (options.amount * 100).toString(), // Convert to smallest unit (halere)
        curr: options.currency || 'CZK',
        label: options.label.substring(0, 48), // Max 48 chars
        refId: options.reservationId,
        email: options.email,
        prepareOnly: 'true', // We want redirect URL
        embedded: 'false'
      })

      if (options.phone) {
        paymentData.append('phone', options.phone)
      }

      if (options.method) {
        paymentData.append('method', options.method)
      }

      // URLs for redirect
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.salonio.cz'
      paymentData.append('url', options.returnUrl || `${appUrl}/payment/success`)
      
      if (options.cancelUrl) {
        paymentData.append('urlCancel', options.cancelUrl)
      }

      // Webhook URL
      const webhookUrl = options.notifyUrl || `${appUrl}/api/webhooks/comgate`
      paymentData.append('urlNotify', webhookUrl)

      // Make request
      const response = await fetch(`${this.baseUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: paymentData
      })

      const responseText = await response.text()
      const result = this.parseResponse(responseText)

      if (result.code !== 0) {
        console.error('[Comgate] Payment creation failed:', result.message)
        return { success: false, error: result.message }
      }

      // Store payment in database
      await query(
        `INSERT INTO payments (
           reservation_id, salon_id, transaction_id, merchant_id,
           amount, currency, status, customer_email, customer_phone
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          options.reservationId,
          options.salonId,
          result.transId,
          this.config.merchantId,
          options.amount,
          options.currency || 'CZK',
          'pending',
          options.email,
          options.phone || null
        ]
      )

      console.log('[Comgate] Payment created:', result.transId)

      return {
        success: true,
        transactionId: result.transId,
        redirectUrl: result.redirect
      }
    } catch (error) {
      console.error('[Comgate] Error creating payment:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId: string): Promise<{
    status: string
    paid: boolean
    error?: string
  }> {
    try {
      const params = new URLSearchParams({
        merchant: this.config.merchantId,
        transId: transactionId
      })

      const response = await fetch(`${this.baseUrl}/status?${params}`, {
        method: 'GET'
      })

      const responseText = await response.text()
      const result = this.parseResponse(responseText)

      if (result.code !== 0) {
        return { status: 'error', paid: false, error: result.message }
      }

      const status = (result as { status?: string }).status || 'unknown'
      return {
        status,
        paid: status === 'PAID'
      }
    } catch (error) {
      return {
        status: 'error',
        paid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(transactionId: string, amount?: number): Promise<{
    success: boolean
    error?: string
  }> {
    try {
      const params = new URLSearchParams({
        merchant: this.config.merchantId,
        transId: transactionId,
        test: this.config.test ? 'true' : 'false'
      })

      if (amount) {
        params.append('amount', (amount * 100).toString())
      }

      const response = await fetch(`${this.baseUrl}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      })

      const responseText = await response.text()
      const result = this.parseResponse(responseText)

      if (result.code !== 0) {
        return { success: false, error: result.message }
      }

      // Update payment status
      await query(
        `UPDATE payments 
         SET status = 'refunded', refunded_at = NOW(), updated_at = NOW()
         WHERE transaction_id = $1`,
        [transactionId]
      )

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Parse Comgate response (key=value format)
   */
  private parseResponse(text: string): ComgatePaymentResponse {
    const lines = text.split('&')
    const result: Record<string, string> = {}

    for (const line of lines) {
      const [key, value] = line.split('=')
      if (key && value) {
        result[key] = decodeURIComponent(value)
      }
    }

    return {
      code: Number.parseInt(result.code || '-1'),
      message: result.message || 'Unknown error',
      transId: result.transId,
      redirect: result.redirect
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(secret: string): boolean {
    return secret === this.config.secret
  }
}

// Export singleton instance
let comgateClient: ComgateClient | null = null

export function getComgateClient(): ComgateClient {
  if (!comgateClient) {
    const merchantId = process.env.COMGATE_MERCHANT_ID
    const secret = process.env.COMGATE_SECRET

    if (!merchantId || !secret) {
      throw new Error('Comgate credentials not configured')
    }

    comgateClient = new ComgateClient({
      merchantId,
      secret,
      test: process.env.COMGATE_TEST === 'true'
    })
  }

  return comgateClient
}

export { ComgateClient }
