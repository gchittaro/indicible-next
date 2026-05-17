import { getLetterByToken, markLetterRead } from '@/app/actions/letters'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
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

  // Detect author
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthor = !!user && user.id === letter.user_id

  // Fetch existing reaction (most recent)
  const service = createServiceClient()
  const { data: reactionRow } = await service
    .from('reactions')
    .select('type, message')
    .eq('letter_id', letter.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const existingReaction = reactionRow as { type: string; message: string | null } | null

  // Only mark as read when the recipient (not the author) opens the page
  if (!isAuthor && letter.status !== 'répondue') {
    markLetterRead(letter.id).catch(() => {})
  }

  const display    = getDisplay(letter.recipient_type, letter.recipient_name)
  const paragraphs = letter.content.split('\n\n').filter((p: string) => p.trim())
  const url        = `/lettre/${params.token}`
  const mediaItems = letter.media_items ?? []
  const photos     = mediaItems.filter((m: { type: string }) => m.type === 'image')
  const videos     = mediaItems.filter((m: { type: string }) => m.type === 'video')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '5rem 1.5rem 6rem' }}>
        <p style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif', fontWeight: 300, fontSize: '.95rem', letterSpacing: '.12em', color: 'var(--ink)', opacity: .4, marginBottom: '3.5rem' }}>
          Dicible
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
              ✦ Écrit avec Dicible
            </p>
          )}
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div className="media-grid" style={{ marginTop: '2rem' }}>
            {photos.map((item: { id: string; url: string; caption: string }) => (
              <div key={item.id} className="media-photo-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.caption || ''} className="media-photo-img" />
                {item.caption && (
                  <p style={{ fontSize: '.68rem', color: 'var(--mute)', fontStyle: 'italic', marginTop: '.4rem', fontWeight: 300 }}>
                    {item.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Videos */}
        {videos.map((item: { id: string; url: string; caption: string }) => (
          <div key={item.id} className="media-video-wrap" style={{ marginTop: '2rem' }}>
            <div className="media-video-inner">
              <iframe
                src={item.url}
                title="video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="media-video-iframe"
              />
            </div>
            {item.caption && (
              <p style={{ fontSize: '.68rem', color: 'var(--mute)', fontStyle: 'italic', marginTop: '.5rem', fontWeight: 300 }}>
                {item.caption}
              </p>
            )}
          </div>
        ))}

        {/* Copy link — only shown to non-authors */}
        {!isAuthor && (
          <div style={{ marginTop: '1.5rem' }}>
            <CopyLinkButton url={url} />
          </div>
        )}

        <ReactionForm
          letterId={letter.id}
          isAuthor={isAuthor}
          existingReaction={existingReaction}
        />
      </div>
    </div>
  )
}
