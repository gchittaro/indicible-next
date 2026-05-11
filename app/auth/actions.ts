'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export type AuthState = { error: string } | null

function frenchError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (message.includes('Email not confirmed')) return 'Confirme ton email avant de te connecter.'
  if (message.includes('User already registered')) return 'Un compte existe déjà avec cet email.'
  if (message.includes('Password should be at least')) return 'Le mot de passe doit faire au moins 6 caractères.'
  if (message.includes('Unable to validate email')) return 'Adresse email invalide.'
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
  const password = formData.get('password') as string
  const confirm  = formData.get('confirm') as string

  if (password !== confirm) return { error: 'Les mots de passe ne correspondent pas.' }
  if (password.length < 6)  return { error: 'Le mot de passe doit faire au moins 6 caractères.' }

  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password,
  })

  if (error) return { error: frenchError(error.message) }
  redirect(data.session ? '/' : '/check-email')
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
