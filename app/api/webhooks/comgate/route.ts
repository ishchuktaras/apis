/**
 * Comgate Payment Gateway Webhook Handler
 * Receives payment status updates from Comgate
 * 
 * Documentation: https://help.comgate.cz/
 */

import { NextRequest, NextResponse } from 'next/server'
import { query, transaction } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Comgate status codes
const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  AUTHORIZED: 'AUTHORIZED'
} as const

interface ComgateWebhookPayload {
  merchant: string
  test: string
  price: string
  curr: string
  label: string
  refId: string
  payerId?: string
  method?: string
  account?: string
  email?: string
  phone?: string
  payerName?: string
  transId: string
  secret: string
  status: keyof typeof PAYMENT_STATUS
  fee?: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse form data (Comgate sends application/x-www-form-urlencoded)
    const formData = await request.formData()
    
    const payload: ComgateWebhookPayload = {
      merchant: formData.get('merchant') as string,
      test: formData.get('test') as string,
      price: formData.get('price') as string,
      curr: formData.get('curr') as string,
      label: formData.get('label') as string,
      refId: formData.get('refId') as string,
      payerId: formData.get('payerId') as string || undefined,
      method: formData.get('method') as string || undefined,
      account: formData.get('account') as string || undefined,
      email: formData.get('email') as string || undefined,
      phone: formData.get('phone') as string || undefined,
      payerName: formData.get('payerName') as string || undefined,
      transId: formData.get('transId') as string,
      secret: formData.get('secret') as string,
      status: formData.get('status') as keyof typeof PAYMENT_STATUS,
      fee: formData.get('fee') as string || undefined
    }

    // Verify secret (should match your Comgate merchant secret)
    const expectedSecret = process.env.COMGATE_SECRET
    if (payload.secret !== expectedSecret) {
      console.error('[Comgate] Invalid secret received')
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
    }

    console.log('[Comgate] Webhook received:', {
      transId: payload.transId,
      status: payload.status,
      refId: payload.refId
    })

    // Process payment within transaction
    await transaction(async (client) => {
      // Update payment record
      const paymentResult = await client.query(
        `UPDATE payments 
         SET status = $1,
             payment_method = $2,
             customer_email = $3,
             customer_phone = $4,
             response_code = $5,
             paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END,
             updated_at = NOW()
         WHERE transaction_id = $6
         RETURNING id, reservation_id`,
        [
          payload.status.toLowerCase(),
          payload.method,
          payload.email,
          payload.phone,
          payload.status,
          payload.transId
        ]
      )

      if (paymentResult.rows.length === 0) {
        // Payment not found - might be a new payment, create record
        const insertResult = await client.query(
          `INSERT INTO payments (
             transaction_id, merchant_id, amount, currency, status,
             payment_method, customer_email, customer_phone,
             response_code, paid_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, reservation_id`,
          [
            payload.transId,
            payload.merchant,
            Number.parseInt(payload.price) / 100, // Comgate sends in smallest currency unit
            payload.curr,
            payload.status.toLowerCase(),
            payload.method,
            payload.email,
            payload.phone,
            payload.status,
            payload.status === 'PAID' ? new Date() : null
          ]
        )

        console.log('[Comgate] New payment record created:', insertResult.rows[0]?.id)
      }

      // If payment is successful, update reservation status
      if (payload.status === 'PAID') {
        await client.query(
          `UPDATE reservations 
           SET payment_status = 'paid',
               payment_reference = $1,
               status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
               updated_at = NOW()
           WHERE id = (
             SELECT reservation_id FROM payments WHERE transaction_id = $2
           )`,
          [payload.transId, payload.transId]
        )

        console.log('[Comgate] Reservation confirmed for transaction:', payload.transId)
      }

      // Log to audit
      await client.query(
        `INSERT INTO audit_logs (action, entity_type, entity_id, new_values)
         VALUES ($1, $2, $3, $4)`,
        [
          'payment_webhook',
          'payment',
          payload.transId,
          JSON.stringify(payload)
        ]
      )
    })

    // Comgate expects HTTP 200 with specific response
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('[Comgate] Webhook error:', error)
    
    // Log error but still return 200 to prevent Comgate retries for processing errors
    return new NextResponse('OK', { status: 200 })
  }
}
