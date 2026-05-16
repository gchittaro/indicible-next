import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'
import { headers } from 'next/headers'
import { randomBytes } from 'crypto'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig  = headers().get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe webhook] signature error:', err)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object as Stripe.Checkout.Session
    const letterId = session.metadata?.letter_id
    const userId   = session.metadata?.user_id

    if (!letterId) return Response.json({ ok: true })

    const service = createServiceClient()

    // Mark letter as premium
    await service.from('letters').update({ status: 'premium' }).eq('id', letterId)

    // Generate referral code for the buyer
    if (userId) {
      try {
        const coupon = await stripe.coupons.create({
          percent_off:      100,
          max_redemptions:  1,
          duration:         'once',
        })

        const code = 'INDIC-' + randomBytes(4).toString('hex').toUpperCase()

        const promoCode = await stripe.promotionCodes.create({
          coupon:           coupon.id,
          code,
          max_redemptions:  1,
        } as any)

        await service.from('referral_codes').insert({
          code:                     promoCode.code,
          user_id:                  userId,
          stripe_promotion_code_id: promoCode.id,
          uses_count:               0,
        })

        console.log(`[stripe webhook] referral code created: ${promoCode.code} for user ${userId}`)
      } catch (err) {
        console.error('[stripe webhook] referral code error:', err)
      }
    }
  }

  return Response.json({ ok: true })
}
