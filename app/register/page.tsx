'use client'

import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { register, signInWithGoogle, signInWithFacebook } from '@/app/auth/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="w-full bg-ink text-bg text-[0.7rem] tracking-[0.14em] uppercase py-3 px-6 transition-all duration-150 hover:bg-soft disabled:opacity-20 disabled:cursor-not-allowed">
      {pending ? 'Création…' : 'Créer mon compte'}
    </button>
  )
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(register, null)

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-[360px]">

        <div className="text-center mb-10">
          <p className="text-[0.6rem] tracking-[0.22em] uppercase text-mute mb-5">
            Pour dire ce qu&apos;on n&apos;a jamais dit
          </p>
          <h1 className="font-serif font-light text-[2rem] leading-none text-ink">
            Créer un compte
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '.75rem', marginBottom: '1.6rem' }}>
          <form action={signInWithGoogle} style={{ flex: 1 }}>
            <button type="submit" className="w-full border border-border text-ink text-[0.65rem] tracking-[0.12em] uppercase py-[0.7rem] transition-all duration-150 hover:border-ink bg-transparent cursor-pointer">
              Google
            </button>
          </form>
          <form action={signInWithFacebook} style={{ flex: 1 }}>
            <button type="submit" className="w-full border border-border text-ink text-[0.65rem] tracking-[0.12em] uppercase py-[0.7rem] transition-all duration-150 hover:border-ink bg-transparent cursor-pointer">
              Facebook
            </button>
          </form>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.6rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span className="text-[0.6rem] tracking-[0.12em] text-mute uppercase">ou</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <form action={formAction} className="space-y-7">
          <div>
            <label className="block text-[0.6rem] tracking-[0.18em] uppercase text-mute mb-2">Email</label>
            <input type="email" name="email" required autoComplete="email"
              className="w-full bg-transparent border-b border-border pb-2 text-[0.9rem] font-light text-ink placeholder:text-mute/60 focus:outline-none focus:border-ink transition-colors duration-200"
              placeholder="ton@email.com" />
          </div>
          <div>
            <label className="block text-[0.6rem] tracking-[0.18em] uppercase text-mute mb-2">Mot de passe</label>
            <input type="password" name="password" required autoComplete="new-password"
              className="w-full bg-transparent border-b border-border pb-2 text-[0.9rem] font-light text-ink placeholder:text-mute/60 focus:outline-none focus:border-ink transition-colors duration-200"
              placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-[0.6rem] tracking-[0.18em] uppercase text-mute mb-2">Confirmer le mot de passe</label>
            <input type="password" name="confirm" required autoComplete="new-password"
              className="w-full bg-transparent border-b border-border pb-2 text-[0.9rem] font-light text-ink placeholder:text-mute/60 focus:outline-none focus:border-ink transition-colors duration-200"
              placeholder="••••••••" />
          </div>
          {state?.error && <p className="text-[0.72rem] text-[#8B3A3A] tracking-[0.02em]">{state.error}</p>}
          <div className="pt-1"><SubmitButton /></div>
        </form>

        <p className="mt-8 text-center text-[0.68rem] tracking-[0.06em] text-mute">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-ink underline underline-offset-2">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
