'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { updatePassword } from '@/app/auth/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-ink text-bg text-[0.7rem] tracking-[0.14em] uppercase py-3 px-6 transition-all duration-150 hover:bg-soft disabled:opacity-20 disabled:cursor-not-allowed"
    >
      {pending ? 'Enregistrement…' : 'Enregistrer'}
    </button>
  )
}

export default function ResetPage() {
  const [state, formAction] = useFormState(updatePassword, null)

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-[360px]">

        <div className="text-center mb-10">
          <h1 className="font-serif font-light text-[2rem] leading-none text-ink">
            Nouveau mot de passe
          </h1>
        </div>

        <form action={formAction} className="space-y-7">
          <div>
            <label className="block text-[0.6rem] tracking-[0.18em] uppercase text-mute mb-2">Nouveau mot de passe</label>
            <input
              type="password"
              name="password"
              required
              autoComplete="new-password"
              minLength={6}
              className="w-full bg-transparent border-b border-border pb-2 text-[0.9rem] font-light text-ink placeholder:text-mute/60 focus:outline-none focus:border-ink transition-colors duration-200"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-[0.6rem] tracking-[0.18em] uppercase text-mute mb-2">Confirmer</label>
            <input
              type="password"
              name="confirm"
              required
              autoComplete="new-password"
              className="w-full bg-transparent border-b border-border pb-2 text-[0.9rem] font-light text-ink placeholder:text-mute/60 focus:outline-none focus:border-ink transition-colors duration-200"
              placeholder="••••••••"
            />
          </div>
          {state?.error && (
            <p className="text-[0.72rem] text-[#8B3A3A] tracking-[0.02em]">{state.error}</p>
          )}
          <div className="pt-1"><SubmitButton /></div>
        </form>

      </div>
    </div>
  )
}
