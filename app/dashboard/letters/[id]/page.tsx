import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import LetterEditor from '@/components/LetterEditor'

export const dynamic = 'force-dynamic'

export default async function LetterEditPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { premium?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: letter, error: letterError } = await service
    .from('letters')
    .select('*')
    .eq('id', params.id)
    .single()

  if (letterError) console.error('[LetterEditPage] fetch error:', letterError)
  if (!letter || letter.user_id !== user.id) redirect('/dashboard')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <LetterEditor
        letter={letter}
        premiumJustActivated={searchParams.premium === 'success'}
      />
    </div>
  )
}
