'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export type AuthState  = { error: string } | null
export type ResetState = { error?: string; sent?: boolean } | null

function frenchError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (message.includes('Email not confirmed')) return 'Confirme ton email avant de te connecter.'
  if (message.includes('User already registered')) return 'Un compte existe déjà avec cet email.'
  if (message.includes('Password should be at least')) return 'Le mot de passe doit faire au moins 6 caractères.'
  if (message.includes('Unable to validate email')) return 'Adresse email invalide.'
  if (message.toLowerCase().includes('rate limit')) return 'Trop de tentatives — réessaie dans une heure.'
  return 'Une erreur est survenue. Réessaie.'
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const supabase = createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: frenchError(error.message) }
  redirect('/')
}

export async function register(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const password     = formData.get('password') as string
  const confirm      = formData.get('confirm') as string
  const referralCode = ((formData.get('referral_code') as string) || '').trim().toUpperCase()

  if (password !== confirm) return { error: 'Les mots de passe ne correspondent pas.' }
  if (password.length < 6)  return { error: 'Le mot de passe doit faire au moins 6 caractères.' }

  const supabase = createClient()
  const origin   = await getOrigin()

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  })

  if (error) return { error: frenchError(error.message) }

  if (referralCode && data.user?.id) {
    const service = createServiceClient()
    const { data: ref } = await service
      .from('referral_codes')
      .select('id')
      .eq('code', referralCode)
      .eq('uses_count', 0)
      .single()

    if (ref) {
      await Promise.all([
        service.from('credits').insert({
          user_id: data.user.id,
          amount:  1,
          source:  `referral:${referralCode}`,
        }),
        service.from('referral_codes').update({ uses_count: 1 }).eq('id', ref.id),
      ])
    }
  }

  redirect(data.session ? '/' : '/check-email')
}

export async function sendPasswordReset(prevState: ResetState, formData: FormData): Promise<ResetState> {
  const email    = formData.get('email') as string
  const supabase = createClient()
  const origin   = await getOrigin()
  const redirectTo = `${origin}/auth/callback`
  console.log('[sendPasswordReset] email:', email, 'redirectTo:', redirectTo)
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  console.log('[sendPasswordReset] result — data:', JSON.stringify(data), '| error:', error ? JSON.stringify(error) : 'null')
  if (error) return { error: frenchError(error.message) }
  return { sent: true }
}

export async function updatePassword(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const password = formData.get('password') as string
  const confirm  = formData.get('confirm') as string
  if (password !== confirm) return { error: 'Les mots de passe ne correspondent pas.' }
  if (password.length < 6)  return { error: 'Le mot de passe doit faire au moins 6 caractères.' }
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: frenchError(error.message) }
  redirect('/')
}

export async function logout() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

async function getOrigin(): Promise<string> {
  const h = headers()
  const host = h.get('host') || 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  return `${proto}://${host}`
}

export async function signInWithGoogle(_formData: FormData): Promise<void> {
  const supabase = createClient()
  const origin   = await getOrigin()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  })

  if (error || !data.url) return
  redirect(data.url)
}

export async function signInWithFacebook(_formData: FormData): Promise<void> {
  const supabase = createClient()
  const origin   = await getOrigin()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: { redirectTo: `${origin}/auth/callback` },
  })

  if (error || !data.url) return
  redirect(data.url)
}
