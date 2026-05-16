'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { login, signInWithGoogle, signInWithFacebook, sendPasswordReset } from '@/app/auth/actions'

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-ink text-bg text-[0.7rem] tracking-[0.14em] uppercase py-3 px-6 transition-all duration-150 hover:bg-soft disabled:opacity-20 disabled:cursor-not-allowed"
    >
      {pending ? pendingLabel : label}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction]           = useFormState(login, null)
  const [resetState, resetFormAction] = useFormState(sendPasswordReset, null)
  const [showReset, setShowReset]     = useState(false)

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-[360px]">

        <div className="text-center mb-10">
          <p className="text-[0.6rem] tracking-[0.22em] uppercase text-mute mb-5">
            Pour dire ce qu&apos;on n&apos;a jamais dit
          </p>
          <h1 className="font-serif font-light text-[2rem] leading-none text-ink">
            {showReset ? 'Mot de passe oublié' : 'Connexion'}
          </h1>
        </div>

        {showReset ? (
          resetState?.sent ? (
            <div>
              <p className="text-[0.82rem] font-light text-ink leading-relaxed mb-6">
                Un email t&apos;a été envoyé. Clique sur le lien pour choisir un nouveau mot de passe.
              </p>
              <button
                onClick={() => setShowReset(false)}
                className="text-[0.65rem] tracking-[0.1em] uppercase text-mute underline underline-offset-2"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <div>
              <form action={resetFormAction} className="space-y-7">
                <div>
                  <label className="block text-[0.6rem] tracking-[0.18em] uppercase text-mute mb-2">Email</label>
                  <input type="email" name="email" required autoComplete="email"
                    className="w-full bg-transparent border-b border-border pb-2 text-[0.9rem] font-light text-ink placeholder:text-mute/60 focus:outline-none focus:border-ink transition-colors duration-200"
                    placeholder="ton@email.com" />
                </div>
                {resetState?.error && <p className="text-[0.72rem] text-[#8B3A3A] tracking-[0.02em]">{resetState.error}</p>}
                <div className="pt-1">
                  <SubmitButton label="Envoyer le lien" pendingLabel="Envoi…" />
                </div>
              </form>
              <button
                onClick={() => setShowReset(false)}
                className="mt-6 text-[0.65rem] tracking-[0.1em] uppercase text-mute underline underline-offset-2"
              >
                Retour à la connexion
              </button>
            </div>
          )
        ) : (
          <>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '.5rem' }}>
                  <label className="block text-[0.6rem] tracking-[0.18em] uppercase text-mute">Mot de passe</label>
                  <button
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-[0.6rem] tracking-[0.08em] text-mute underline underline-offset-2"
                  >
                    Oublié ?
                  </button>
                </div>
                <input type="password" name="password" required autoComplete="current-password"
                  className="w-full bg-transparent border-b border-border pb-2 text-[0.9rem] font-light text-ink placeholder:text-mute/60 focus:outline-none focus:border-ink transition-colors duration-200"
                  placeholder="••••••••" />
              </div>
              {state?.error && <p className="text-[0.72rem] text-[#8B3A3A] tracking-[0.02em]">{state.error}</p>}
              <div className="pt-1">
                <SubmitButton label="Continuer" pendingLabel="Connexion…" />
              </div>
            </form>

            <p className="mt-8 text-center text-[0.68rem] tracking-[0.06em] text-mute">
              Pas encore de compte ?{' '}
              <Link href="/register" className="text-ink underline underline-offset-2">Créer un compte</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
