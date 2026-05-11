import { createClient } from '@/lib/supabase/server'
import { getLetters } from '@/app/actions/letters'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const TONE_LABELS: Record<string, string> = {
  doux: 'Doux & apaisé', courageux: 'Courageux & direct', nostalgique: 'Nostalgique',
  reconnaissant: 'Reconnaissant', melancolique: 'Mélancolique', paix: 'En quête de paix',
}
const STYLE_LABELS: Record<string, string> = {
  litteraire: 'Littéraire', simple: 'Simple & direct', poetique: 'Poétique',
}
const REL_DISPLAY: Record<string, string> = {
  pere: 'Ton père', mere: 'Ta mère', frere: 'Ton frère',
  soeur: 'Ta sœur', ami: 'Ton ami', amie: 'Ton amie',
}
const REACTION_EMOJI: Record<string, string> = {
  touche: '❤️', parler: '🤝', pardon: '🙏', silence: '🔇',
}

function getDisplay(type: string, name: string | null) {
  return type === 'proche' ? (name || 'Un proche') : (REL_DISPLAY[type] || name || type)
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const letters = await getLetters(user.id)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <main style={{ maxWidth: '640px', margin: '0 auto', padding: '5.5rem 1.5rem 4rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <h1 style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif', fontSize: 'clamp(1.7rem, 4vw, 2.2rem)', fontWeight: 300 }}>
            Mes lettres
          </h1>
          <Link href="/" className="btn btn-dark" style={{ textDecoration: 'none' }}>Nouvelle lettre</Link>
        </div>

        {letters.length === 0 ? (
          <p style={{ fontSize: '.88rem', color: 'var(--mute)', fontWeight: 300, lineHeight: 1.7 }}>
            Pas encore de lettre.{' '}
            <Link href="/" style={{ color: 'var(--ink)', textDecoration: 'underline', textUnderlineOffset: '3px' }}>Commencer maintenant</Link>
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)' }}>
            {letters.map(letter => (
              <div key={letter.id} style={{ background: 'var(--bg)', padding: '1.4rem 1.6rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif', fontSize: '1.15rem', fontWeight: 300, marginBottom: '.4rem' }}>
                    Pour {getDisplay(letter.recipient_type, letter.recipient_name)}
                  </p>
                  <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {[TONE_LABELS[letter.tone], STYLE_LABELS[letter.style]].filter(Boolean).map(l => (
                      <span key={l} className="ltag">{l}</span>
                    ))}
                    <span style={{ fontSize: '.6rem', color: 'var(--mute)', letterSpacing: '.04em' }}>{formatDate(letter.created_at)}</span>
                  </div>
                  {letter.reactions.length > 0 && (
                    <div style={{ display: 'flex', gap: '.3rem', marginTop: '.6rem' }}>
                      {letter.reactions.map(r => (
                        <span key={r.id} style={{ fontSize: '.85rem' }}>{REACTION_EMOJI[r.type] || '💬'}</span>
                      ))}
                    </div>
                  )}
                </div>
                <Link href={`/lettre/${letter.token}`} style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink)', textDecoration: 'none', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)', paddingBottom: '1px', flexShrink: 0 }}>
                  Voir →
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
