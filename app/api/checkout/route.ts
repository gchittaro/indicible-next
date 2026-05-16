import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { headers } from 'next/headers'

export async function POST(request: Request) {
  const { letterId: rawLetterId, token } = await request.json()

  if (!token) {
    return Response.json({ error: 'Missing token' }, { status: 400 })
  }

  const service = createServiceClient()

  // Resolve letterId from token if not provided
  let letterId = rawLetterId
  if (!letterId) {
    const { data } = await service.from('letters').select('id').eq('token', token).single()
    letterId = data?.id
  }

  if (!letterId) {
    return Response.json({ error: 'Letter not found' }, { status: 404 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const h      = headers()
  const host   = h.get('host') || 'localhost:3000'
  const proto  = host.startsWith('localhost') ? 'http' : 'https'
  const origin = `${proto}://${host}`

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: 'price_1TXbwwE7qwJ4d7BP7MU8b6Mz', quantity: 1 }],
      metadata: {
        letter_id: letterId,
        user_id:   user?.id ?? '',
      },
      success_url: `${origin}/dashboard/letters/${letterId}?premium=success`,
      cancel_url:  `${origin}/lettre/${token}`,
    })

    return Response.json({ url: session.url })
  } catch (err) {
    console.error('[checkout]', err)
    return Response.json({ error: 'Failed to create session' }, { status: 500 })
  }
}
