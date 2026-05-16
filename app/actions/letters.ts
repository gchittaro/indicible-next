'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { randomBytes } from 'crypto'

export type MediaItem = {
  id: string
  type: 'image' | 'video'
  url: string
  caption: string
}

export interface LetterInsert {
  recipient_name: string | null
  recipient_type: string
  tone: string
  style: string
  moment: string
  intention: string
  answers: Record<string, string>
  content: string
}

type LetterRow = {
  id: string
  token: string
  recipient_name: string | null
  recipient_type: string
  tone: string
  style: string
  status: string
  created_at: string
  reactions: { id: string; type: string; message: string | null; created_at: string }[]
}

export async function saveLetter(data: LetterInsert) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const service = createServiceClient()
  const token = randomBytes(18).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

  const { data: letter, error } = await service
    .from('letters')
    .insert({
      user_id: user.id,
      token,
      recipient_name: data.recipient_name,
      recipient_type: data.recipient_type,
      tone: data.tone,
      style: data.style,
      moment: data.moment,
      intention: data.intention,
      answers: data.answers,
      content: data.content,
    })
    .select('id, token')
    .single()

  if (error) {
    console.error('[saveLetter] Supabase error:', JSON.stringify(error))
    throw new Error(`${error.message} (code: ${error.code}, hint: ${error.hint})`)
  }
  if (!letter) throw new Error('Insert returned no data')
  return letter as { id: string; token: string }
}

export async function getLetters(userId: string): Promise<LetterRow[]> {
  const service = createServiceClient()

  const { data, error } = await service
    .from('letters')
    .select('id, token, recipient_name, recipient_type, tone, style, status, created_at, reactions(id, type, message, created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getLetters] error:', error)
    const { data: simple } = await service
      .from('letters')
      .select('id, token, recipient_name, recipient_type, tone, style, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return ((simple || []) as Omit<LetterRow, 'reactions'>[]).map(l => ({ ...l, reactions: [] }))
  }

  return (data || []) as LetterRow[]
}

export async function getLetterByToken(token: string) {
  const service = createServiceClient()
  const { data } = await service
    .from('letters')
    .select('*')
    .eq('token', token)
    .single()
  return data as {
    id: string
    user_id: string
    token: string
    recipient_name: string | null
    recipient_type: string
    tone: string
    style: string
    moment: string
    intention: string
    content: string
    show_mention: boolean
    status: string
    created_at: string
    media_items?: MediaItem[] | null
  } | null
}

export async function updateLetterMedia(letterId: string, items: MediaItem[]) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const service = createServiceClient()
  await service
    .from('letters')
    .update({ media_items: items })
    .eq('id', letterId)
    .eq('user_id', user.id)
}

export async function submitReaction(letterId: string, type: string, message: string | null) {
  const service = createServiceClient()
  const { error } = await service
    .from('reactions')
    .insert({ letter_id: letterId, type, message })
  if (error) throw error

  await Promise.all([
    service.from('letters')
      .update({ status: 'répondue' })
      .eq('id', letterId),
    service.from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('letter_id', letterId)
      .is('read_at', null),
  ])
}

export async function markLetterShared(letterId: string) {
  const service = createServiceClient()
  await service.from('letters')
    .update({ status: 'partagée' })
    .eq('id', letterId)
    .eq('status', 'brouillon')
}

export async function markLetterRead(letterId: string) {
  const service = createServiceClient()
  await service.from('letters')
    .update({ status: 'lue' })
    .eq('id', letterId)
    .in('status', ['brouillon', 'partagée'])
}

export async function updateAiEditsCount(letterId: string, count: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const service = createServiceClient()
  await service
    .from('letters')
    .update({ ai_edits_count: count })
    .eq('id', letterId)
    .eq('user_id', user.id)
}
