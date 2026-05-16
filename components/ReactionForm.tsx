'use client'

import { useState } from 'react'
import { submitReaction } from '@/app/actions/letters'

const REACTIONS = [
  { type: 'touche',  emoji: '❤️', label: 'Touché·e' },
  { type: 'parler',  emoji: '🤝', label: "Je veux qu'on se parle" },
  { type: 'pardon',  emoji: '🙏', label: "J'accepte / je pardonne" },
  { type: 'silence', emoji: '🔇', label: 'Je préfère ne pas donner suite' },
]

const REACTION_DISPLAY: Record<string, { emoji: string; label: string }> = {
  touche:  { emoji: '❤️', label: 'Touché·e' },
  parler:  { emoji: '🤝', label: "Veut qu'on se parle" },
  pardon:  { emoji: '🙏', label: 'A accepté / pardonné' },
  silence: { emoji: '🔇', label: 'A préféré ne pas donner suite' },
}

type ExistingReaction = { type: string; message: string | null }

function ReactionDisplay({ reaction, note }: { reaction: ExistingReaction; note: string }) {
  const display = REACTION_DISPLAY[reaction.type]
  return (
    <div style={{ marginTop: '3.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
      <p style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: '1.2rem' }}>
        Réaction
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem 1rem', border: '1px solid var(--border)', background: 'var(--paper)', marginBottom: reaction.message ? '1rem' : '1.5rem' }}>
        <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{display?.emoji ?? '💬'}</span>
        <span style={{ fontSize: '.82rem', fontWeight: 300 }}>{display?.label ?? reaction.type}</span>
      </div>
      {reaction.message && (
        <p style={{ fontSize: '.82rem', fontWeight: 300, color: 'var(--soft)', fontStyle: 'italic', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          &ldquo;{reaction.message}&rdquo;
        </p>
      )}
      <p style={{ fontSize: '.68rem', color: 'var(--mute)', letterSpacing: '.04em' }}>{note}</p>
    </div>
  )
}

export default function ReactionForm({
  letterId,
  isAuthor,
  existingReaction,
}: {
  letterId: string
  isAuthor: boolean
  existingReaction: ExistingReaction | null
}) {
  const [selected,  setSelected]  = useState<string | null>(null)
  const [message,   setMessage]   = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)

  // Author view
  if (isAuthor) {
    if (existingReaction) {
      return <ReactionDisplay reaction={existingReaction} note="Vous êtes l'auteur de cette lettre." />
    }
    return (
      <div style={{ marginTop: '3.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
        <p style={{ fontSize: '.68rem', color: 'var(--mute)', letterSpacing: '.04em' }}>
          Vous êtes l&apos;auteur de cette lettre — en attente d&apos;une réaction.
        </p>
      </div>
    )
  }

  // Recipient already reacted
  if (existingReaction) {
    return <ReactionDisplay reaction={existingReaction} note="Vous avez déjà répondu à cette lettre." />
  }

  // Recipient — normal form
  async function handleSubmit() {
    if (!selected || loading) return
    setLoading(true)
    try {
      await submitReaction(letterId, selected, message.trim() || null)
      setSubmitted(true)
    } catch { /* silent */ }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <p style={{ fontSize: '.85rem', color: 'var(--mute)', fontWeight: 300, letterSpacing: '.04em' }}>
          Ta réaction a été transmise.
        </p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '3.5rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
      <p style={{ fontSize: '.6rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--mute)', marginBottom: '1.2rem' }}>
        Ta réaction
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1.5rem' }}>
        {REACTIONS.map(r => (
          <button key={r.type} onClick={() => setSelected(r.type === selected ? null : r.type)}
            style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem 1rem', border: `1px solid ${selected === r.type ? 'var(--ink)' : 'var(--border)'}`, background: selected === r.type ? 'var(--ink)' : 'transparent', color: selected === r.type ? 'var(--bg)' : 'var(--ink)', fontSize: '.82rem', fontWeight: 300, textAlign: 'left', cursor: 'pointer', transition: 'all .15s ease', width: '100%' }}>
            <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{r.emoji}</span>
            {r.label}
          </button>
        ))}
      </div>
      {selected && (
        <div style={{ animation: 'up .3s ease both', marginBottom: '1.2rem' }}>
          <textarea rows={3} placeholder="Un mot, si tu veux… (facultatif)" value={message} onChange={e => setMessage(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: '1px solid var(--border)', padding: '.75rem', fontSize: '.85rem', fontWeight: 300, color: 'var(--ink)', fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--ink)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
        </div>
      )}
      {selected && (
        <button className="btn btn-dark" onClick={handleSubmit} disabled={loading} style={{ animation: 'up .3s ease both' }}>
          {loading ? 'Envoi…' : 'Envoyer'}
        </button>
      )}
    </div>
  )
}
