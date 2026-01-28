/**
 * GoSMS Integration for SMS Notifications
 * Czech SMS gateway for reservation reminders
 * 
 * Documentation: https://doc.gosms.cz/
 */

import { query } from './db'

interface GoSMSConfig {
  clientId: string
  clientSecret: string
  channelId?: number
}

interface SendSMSOptions {
  phone: string
  message: string
  salonId: string
  reservationId?: string
  messageType: 'reminder' | 'confirmation' | 'cancellation' | 'custom'
}

interface GoSMSResponse {
  id: number
  status: string
  message_count: number
  price: number
}

interface GoSMSError {
  error: string
  error_description: string
}

class GoSMSClient {
  private config: GoSMSConfig
  private accessToken: string | null = null
  private tokenExpiry: Date | null = null
  private baseUrl = 'https://app.gosms.cz/api/v1'

  constructor(config: GoSMSConfig) {
    this.config = config
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken
    }

    const response = await fetch(`${this.baseUrl}/oauth/access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret
      })
    })

    if (!response.ok) {
      const error = await response.json() as GoSMSError
      throw new Error(`GoSMS auth failed: ${error.error_description}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000)

    return this.accessToken
  }

  /**
   * Format phone number to E.164 format for Czech Republic
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '')

    // Handle Czech numbers
    if (cleaned.startsWith('420')) {
      return `+${cleaned}`
    }
    if (cleaned.startsWith('00420')) {
      return `+${cleaned.substring(2)}`
    }
    if (cleaned.length === 9) {
      return `+420${cleaned}`
    }

    // Return as-is if already in international format
    if (cleaned.startsWith('00')) {
      return `+${cleaned.substring(2)}`
    }

    return phone
  }

  /**
   * Send SMS message
   */
  async sendSMS(options: SendSMSOptions): Promise<{ success: boolean; externalId?: string; error?: string }> {
    try {
      const token = await this.getAccessToken()
      const formattedPhone = this.formatPhoneNumber(options.phone)

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: options.message,
          recipients: formattedPhone,
          channel: this.config.channelId || 1
        })
      })

      if (!response.ok) {
        const error = await response.json() as GoSMSError
        
        // Log failed SMS
        await this.logSMS({
          ...options,
          phone: formattedPhone,
          status: 'failed',
          errorMessage: error.error_description
        })

        return { success: false, error: error.error_description }
      }

      const data = await response.json() as GoSMSResponse

      // Log successful SMS
      await this.logSMS({
        ...options,
        phone: formattedPhone,
        status: 'sent',
        externalId: data.id.toString(),
        partsCount: data.message_count,
        cost: data.price
      })

      return { success: true, externalId: data.id.toString() }
    } catch (error) {
      console.error('[GoSMS] Send error:', error)
      
      await this.logSMS({
        ...options,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Log SMS to database
   */
  private async logSMS(data: {
    phone: string
    message: string
    salonId: string
    reservationId?: string
    messageType: string
    status: string
    externalId?: string
    errorMessage?: string
    partsCount?: number
    cost?: number
  }): Promise<void> {
    try {
      await query(
        `INSERT INTO sms_notifications (
           salon_id, reservation_id, phone, message, message_type,
           external_id, status, error_message, parts_count, cost, sent_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          data.salonId,
          data.reservationId || null,
          data.phone,
          data.message,
          data.messageType,
          data.externalId || null,
          data.status,
          data.errorMessage || null,
          data.partsCount || 1,
          data.cost || null,
          data.status === 'sent' ? new Date() : null
        ]
      )
    } catch (error) {
      console.error('[GoSMS] Failed to log SMS:', error)
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<{ balance: number; currency: string } | null> {
    try {
      const token = await this.getAccessToken()

      const response = await fetch(`${this.baseUrl}/account`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        return null
      }

      const data = await response.json()
      return {
        balance: data.balance,
        currency: 'CZK'
      }
    } catch {
      return null
    }
  }
}

// SMS message templates
export const smsTemplates = {
  confirmation: (salonName: string, date: string, time: string) =>
    `Potvrzen\u00ed rezervace v ${salonName} na ${date} v ${time}. T\u011b\u0161\u00edme se na V\u00e1s!`,

  reminder: (salonName: string, date: string, time: string) =>
    `P\u0159ipom\u00edn\u00e1me Va\u0161i rezervaci v ${salonName} z\u00edtra ${date} v ${time}.`,

  cancellation: (salonName: string) =>
    `Va\u0161e rezervace v ${salonName} byla zru\u0161ena. Pro novou rezervaci nav\u0161tivte na\u0161e str\u00e1nky.`
}

// Export singleton instance
let gosmsClient: GoSMSClient | null = null

export function getGoSMSClient(): GoSMSClient {
  if (!gosmsClient) {
    const clientId = process.env.GOSMS_CLIENT_ID
    const clientSecret = process.env.GOSMS_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      throw new Error('GoSMS credentials not configured')
    }

    gosmsClient = new GoSMSClient({
      clientId,
      clientSecret,
      channelId: process.env.GOSMS_CHANNEL_ID ? Number.parseInt(process.env.GOSMS_CHANNEL_ID) : undefined
    })
  }

  return gosmsClient
}

export { GoSMSClient }
