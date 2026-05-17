import Link from 'next/link'

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-6">
      <div className="w-full max-w-[360px] text-center">
        <p className="font-serif font-light text-[0.95rem] tracking-[0.12em] text-ink/40 mb-10">Dicible</p>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem', fontSize: '1.3rem' }}>
          ✉
        </div>
        <h1 className="font-serif font-light text-[1.7rem] leading-tight text-ink mb-4">Vérifie ta boîte mail</h1>
        <p className="text-[0.85rem] font-light text-soft leading-relaxed mb-8">
          On t&apos;a envoyé un lien de confirmation.<br />Clique dessus pour activer ton compte.
        </p>
        <p className="text-[0.68rem] tracking-[0.06em] text-mute">
          Déjà confirmé ?{' '}
          <Link href="/login" className="text-ink underline underline-offset-2">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
