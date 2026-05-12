import { getLetterByToken, markLetterRead } from '@/app/actions/letters'
import { notFound } from 'next/navigation'
import ReactionForm from '@/components/ReactionForm'
import CopyLinkButton from '@/components/CopyLinkButton'

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

function getDisplay(type: string, name: string | null) {
  return type === 'proche' ? (name || 'Un proche') : (REL_DISPLAY[type] || name || type)
}

export default async function LettrePage({ params }: { params: { token: string } }) {
  const letter = await getLetterByToken(params.token)
  if (!letter) notFound()

  // Mark as read when recipient opens the page (won't overwrite 'répondue')
  if (letter.status !== 'répondue') {
    markLetterRead(letter.id).catch(() => {})
  }

  const display    = getDisplay(letter.recipient_type, letter.recipient_name)
  const paragraphs = letter.content.split('\n\n').filter((p: string) => p.trim())
  const url        = `/lettre/${params.token}`

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '5rem 1.5rem 6rem' }}>
        <p style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif', fontWeight: 300, fontSize: '.95rem', letterSpacing: '.12em', color: 'var(--ink)', opacity: .4, marginBottom: '3.5rem' }}>
          indicible
        </p>
        <div className="lmeta">
          <p className="eyebrow">Une lettre pour toi</p>
          <h1 className="headline" style={{ marginBottom: '.8rem' }}>Pour {display}</h1>
          <div className="settings-recap">
            {[TONE_LABELS[letter.tone], STYLE_LABELS[letter.style]].filter(Boolean).map(l => (
              <span key={l} className="ltag">{l}</span>
            ))}
          </div>
        </div>
        <div className="lpaper show" style={{ marginTop: '2rem' }}>
          {paragraphs.map((para: string, i: number) => (
            <p key={i} className="para-text" style={{ marginBottom: i < paragraphs.length - 1 ? '1.4em' : 0 }}>
              {para}
            </p>
          ))}
          {letter.show_mention && (
            <p style={{ marginTop: '2rem', fontSize: '.62rem', color: 'var(--mute)', letterSpacing: '.08em' }}>
              ✦ Écrit avec Indicible
            </p>
          )}
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <CopyLinkButton url={url} />
        </div>
        <ReactionForm letterId={letter.id} />
      </div>
    </div>
  )
}
