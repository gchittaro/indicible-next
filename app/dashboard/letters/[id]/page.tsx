import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import LetterEditor from '@/components/LetterEditor'

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
  const { data: letter } = await service
    .from('letters')
    .select('id, token, user_id, recipient_name, recipient_type, tone, style, moment, intention, content, status, ai_edits_count, created_at')
    .eq('id', params.id)
    .single()

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
