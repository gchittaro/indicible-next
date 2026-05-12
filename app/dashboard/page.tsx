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
  amoureux: 'Ton amoureux', amoureuse: 'Ton amoureuse',
}
const REACTION_EMOJI: Record<string, string> = {
  touche: '❤️', parler: '🤝', pardon: '🙏', silence: '🔇',
}
const REACTION_LABEL: Record<string, string> = {
  touche: 'Touché·e',
  parler: `Je veux qu'on se parle`,
  pardon: `J'accepte / je pardonne`,
  silence: 'Pas de suite',
}
const STATUS_LABEL: Record<string, string> = {
  brouillon: 'Brouillon',
  partagée:  'Partagée',
  lue:       'Lue',
  répondue:  'Répondue',
  draft:     'Brouillon',
}
const STATUS_COLOR: Record<string, string> = {
  brouillon: 'var(--mute)',
  partagée:  '#8B6B3D',
  lue:       '#4A7C59',
  répondue:  '#3B6EA5',
  draft:     'var(--mute)',
}

function getDisplay(type: string, name: string | null) {
  if (type === 'proche') return name || 'Un proche'
  if (type === 'amoureux') return name === 'amoureuse' ? 'Ta amoureuse' : 'Ton amoureux'
  return REL_DISPLAY[type] || name || type
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max).trimEnd() + '…' : str
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
            {letters.map(letter => {
              const reaction = letter.reactions[0] ?? null
              const status   = letter.status || 'draft'

              return (
                <div key={letter.id} style={{ background: 'var(--bg)', padding: '1.4rem 1.6rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>

                    {/* Title + status */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.7rem', marginBottom: '.45rem', flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif', fontSize: '1.15rem', fontWeight: 300, margin: 0 }}>
                        Pour {getDisplay(letter.recipient_type, letter.recipient_name)}
                      </p>
                      <span style={{
                        fontSize: '.58rem', letterSpacing: '.1em', textTransform: 'uppercase',
                        color: STATUS_COLOR[status] ?? 'var(--mute)',
                        border: `1px solid ${STATUS_COLOR[status] ?? 'var(--border)'}`,
                        padding: '.15rem .45rem',
                      }}>
                        {STATUS_LABEL[status] ?? status}
                      </span>
                    </div>

                    {/* Tags + date */}
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '.75rem' }}>
                      {[TONE_LABELS[letter.tone], STYLE_LABELS[letter.style]].filter(Boolean).map(l => (
                        <span key={l} className="ltag">{l}</span>
                      ))}
                      <span style={{ fontSize: '.6rem', color: 'var(--mute)', letterSpacing: '.04em' }}>{formatDate(letter.created_at)}</span>
                    </div>

                    {/* Reaction block */}
                    {reaction ? (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '.7rem' }}>
                        <p style={{ fontSize: '.75rem', color: 'var(--ink)', marginBottom: '.3rem' }}>
                          {REACTION_EMOJI[reaction.type] ?? '💬'}{' '}
                          <span style={{ fontWeight: 400 }}>{REACTION_LABEL[reaction.type] ?? reaction.type}</span>
                        </p>
                        {reaction.message && (
                          <p style={{ fontSize: '.72rem', color: 'var(--soft)', fontWeight: 300, lineHeight: 1.5, fontStyle: 'italic' }}>
                            &ldquo;{truncate(reaction.message, 80)}&rdquo;
                          </p>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: '.7rem', color: 'var(--mute)', fontStyle: 'italic', fontWeight: 300 }}>
                        En attente de réponse…
                      </p>
                    )}
                  </div>

                  <Link href={`/lettre/${letter.token}`} style={{ fontSize: '.65rem', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink)', textDecoration: 'none', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)', paddingBottom: '1px', flexShrink: 0, marginTop: '.25rem' }}>
                    Voir →
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
