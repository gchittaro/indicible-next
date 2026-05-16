'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateAiEditsCount, saveLetterContent, type MediaItem } from '@/app/actions/letters'
import { useRouter } from 'next/navigation'
import MediaUploader from './MediaUploader'
import PremiumButton from './PremiumButton'

const FREE_AI_EDITS    = 2
const PREMIUM_AI_EDITS = 5

const REL_APPELLATIF: Record<string, string> = {
  pere:  'Papa',
  mere:  'Maman',
  frere: 'Ton frère',
  soeur: 'Ta sœur',
  ami:   'Ton ami',
  amie:  'Ton amie',
}

const REL_DISPLAY: Record<string, string> = {
  pere:  'Ton père',
  mere:  'Ta mère',
  frere: 'Ton frère',
  soeur: 'Ta sœur',
  ami:   'Ton ami',
  amie:  'Ton amie',
}

function getAppellatif(recipientType: string, recipientName: string | null): string {
  if (recipientType === 'proche') return recipientName || 'toi'
  if (recipientType === 'amoureux') return 'Mon amour'
  return REL_APPELLATIF[recipientType] || 'toi'
}

function getDisplay(recipientType: string, recipientName: string | null): string {
  if (recipientType === 'proche') return recipientName || 'Un proche'
  if (recipientType === 'amoureux') {
    return recipientName === 'amoureuse' ? 'Ton amoureuse' : 'Ton amoureux'
  }
  return REL_DISPLAY[recipientType] || recipientName || recipientType
}

async function callApi(prompt: string): Promise<string> {
  const res  = await fetch('/api/generate', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ prompt }),
  })
  const data = await res.json()
  return data.text || 'Une erreur est survenue.'
}

async function adjustLetter(currentLetter: string, instruction: string, appellatif: string): Promise<string> {
  const prompt = `Tu as écrit cette lettre:\n\n${currentLetter}\n\nDemande: ${instruction}\n\nRéécris-la en appliquant cette demande. Tutoiement, commence par ${appellatif}, entre 220 et 300 mots. LANGUE : Réponds UNIQUEMENT en français.`
  return callApi(prompt)
}

async function regenParagraph(para: string, currentLetter: string): Promise<string> {
  const prompt = `Tu as écrit cette lettre:\n\n${currentLetter}\n\nRéécris uniquement ce paragraphe différemment, plus fort. Réponds avec uniquement le nouveau paragraphe. LANGUE : Réponds UNIQUEMENT en français.\n\nParagraphe: ${para}`
  return callApi(prompt)
}

interface LetterData {
  id: string
  token: string
  recipient_name: string | null
  recipient_type: string
  tone: string
  style: string
  content: string
  status: string
  ai_edits_count?: number | null
  media_items?: MediaItem[] | null
}

export default function LetterEditor({
  letter,
  premiumJustActivated,
}: {
  letter: LetterData
  premiumJustActivated: boolean
}) {
  const isPremium   = letter.status === 'premium' || premiumJustActivated
  const maxEdits    = isPremium ? PREMIUM_AI_EDITS : FREE_AI_EDITS
  const appellatif  = getAppellatif(letter.recipient_type, letter.recipient_name)
  const display     = getDisplay(letter.recipient_type, letter.recipient_name)

  const initParagraphs = letter.content.split('\n\n').filter(p => p.trim())

  const [paragraphs, setParagraphs]             = useState<string[]>(initParagraphs)
  const [currentLetter, setCurrentLetter]       = useState(letter.content)
  const [aiEditsUsed, setAiEditsUsed]           = useState(letter.ai_edits_count ?? 0)
  const [adjustInstruction, setAdjustInstruction] = useState('')
  const [adjusting, setAdjusting]               = useState(false)
  const [regenIndex, setRegenIndex]             = useState<number | null>(null)
  const [showShareModal, setShowShareModal]     = useState(false)
  const [modalLinkCopied, setModalLinkCopied]   = useState(false)
  const [saving, setSaving]                     = useState(false)
  const [showMediaGate, setShowMediaGate]       = useState(false)
  const router                                  = useRouter()

  function updateContent(text: string) {
    setCurrentLetter(text)
    setParagraphs(text.split('\n\n').filter(p => p.trim()))
  }

  const editsLeft    = maxEdits - aiEditsUsed
  const editsBlocked = aiEditsUsed >= maxEdits

  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '5.5rem 1.5rem 5rem' }}>

      {/* Premium confirmation */}
      {premiumJustActivated && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '.5rem',
          marginBottom: '2rem', padding: '.7rem 1rem',
          border: '1px solid #8B6B3D', color: '#8B6B3D',
          fontSize: '.72rem', letterSpacing: '.06em',
        }}>
          ✦ Modifications débloquées ✓
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <Link href="/dashboard" style={{ fontSize: '.65rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--mute)', textDecoration: 'none' }}>
          ← Mes lettres
        </Link>
        <h1 style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 300, margin: '1rem 0 .3rem' }}>
          Pour {display}
        </h1>
        <p style={{ fontSize: '.7rem', color: 'var(--mute)', letterSpacing: '.06em' }}>
          {`${editsLeft} modification${editsLeft !== 1 ? 's' : ''} restante${editsLeft !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Letter */}
      <div className="lpaper show" style={{ marginBottom: '2rem' }}>
        {adjusting ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div className="dots"><span /><span /><span /></div>
            <p style={{ marginTop: '1rem', fontSize: '.8rem', color: 'var(--mute)' }}>On ajuste…</p>
          </div>
        ) : paragraphs.map((para, i) => (
          <div key={i} className="para-wrap">
            <p className="para-text">{para}</p>
            <button
              className="regen-btn"
              title={editsBlocked ? 'Limite atteinte' : 'Réécrire ce paragraphe'}
              onClick={async () => {
                if (editsBlocked) return
                const newCount = aiEditsUsed + 1
                setAiEditsUsed(newCount)
                updateAiEditsCount(letter.id, newCount).catch(() => {})
                setRegenIndex(i)
                try {
                  const newPara = await regenParagraph(para, currentLetter)
                  const arr = [...paragraphs]
                  arr[i]    = newPara
                  setParagraphs(arr)
                  setCurrentLetter(arr.join('\n\n'))
                } catch { /* silent */ }
                setRegenIndex(null)
              }}
            >
              {regenIndex === i ? '…' : '↺'}
            </button>
          </div>
        ))}
      </div>

      {/* Adjust area */}
      {editsBlocked ? (
        <div style={{ marginBottom: '2rem' }}>
          {isPremium ? (
            <p style={{ fontSize: '.78rem', color: 'var(--mute)', fontWeight: 300 }}>
              Tu as utilisé tes {maxEdits} modifications.
            </p>
          ) : (
            <PremiumButton letterId={letter.id} token={letter.token} />
          )}
        </div>
      ) : (
        <div style={{ marginBottom: '2rem' }}>
          <textarea
            className="adjust-input"
            rows={3}
            placeholder="Ajuste ta lettre… ex : Rends-la plus courte, ajoute une note d'humour…"
            value={adjustInstruction}
            onChange={e => setAdjustInstruction(e.target.value)}
            style={{ width: '100%', marginBottom: '.8rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-dark"
              disabled={!adjustInstruction.trim() || adjusting}
              onClick={async () => {
                const newCount = aiEditsUsed + 1
                setAiEditsUsed(newCount)
                updateAiEditsCount(letter.id, newCount).catch(() => {})
                setAdjusting(true)
                try {
                  const t = await adjustLetter(currentLetter, adjustInstruction, appellatif)
                  updateContent(t)
                  setAdjustInstruction('')
                } catch { /* silent */ }
                setAdjusting(false)
              }}
            >
              {adjusting ? 'Réécriture…' : 'Appliquer'}
              {!adjusting && editsLeft > 0 && (
                <span style={{ marginLeft: '.4rem', opacity: .55, fontSize: '.6rem' }}>
                  ({editsLeft} restant{editsLeft > 1 ? 's' : ''})
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Media — between adjust and actions */}
      {isPremium ? (
        <MediaUploader
          letterId={letter.id}
          initialItems={letter.media_items ?? []}
        />
      ) : (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: showMediaGate ? '1rem' : 0 }}>
            <button className="media-locked-btn" onClick={() => setShowMediaGate(g => !g)}>
              <span className="media-btn-icon">📷</span>
              <span className="media-btn-label">Ajouter une photo</span>
              <span className="media-btn-lock">🔒 Débloquer pour ajouter</span>
            </button>
            <button className="media-locked-btn" onClick={() => setShowMediaGate(g => !g)}>
              <span className="media-btn-icon">🎬</span>
              <span className="media-btn-label">Ajouter une vidéo</span>
              <span className="media-btn-lock">🔒 Débloquer pour ajouter</span>
            </button>
          </div>
          {showMediaGate && (
            <div className="premium-gate" style={{ animation: 'up .2s ease both' }}>
              <p style={{ fontSize: '.82rem', fontWeight: 300, lineHeight: 1.6, marginBottom: '1rem' }}>
                Débloquer 5 modifications — ajoute des photos et vidéos à ta lettre pour 4,99 €
              </p>
              <PremiumButton letterId={letter.id} token={letter.token} />
            </div>
          )}
        </div>
      )}

      {/* ── PARTAGER ─────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2.5rem', marginBottom: '1.5rem' }}>
        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <p style={{ fontSize: '.58rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--mute)', whiteSpace: 'nowrap' }}>
          Partager ma lettre
        </p>
        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-border"
          disabled={saving}
          onClick={async () => {
            setSaving(true)
            try {
              await saveLetterContent(letter.id, currentLetter)
            } catch { /* silent */ }
            setSaving(false)
            router.push('/dashboard')
          }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer en brouillon'}
        </button>
        <button className="btn btn-dark" onClick={() => {
          const url = window.location.origin + '/lettre/' + letter.token
          if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({ title: 'Une lettre pour toi', text: "J'ai quelque chose à te dire.", url })
          } else {
            setShowShareModal(true)
          }
        }}>
          Partager
        </button>
      </div>

      {/* ── Modal partage (desktop / fallback) ── */}
      {showShareModal && (
        <>
          <div
            onClick={() => setShowShareModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(27,23,20,.5)', zIndex: 200 }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'min(90vw, 400px)',
            background: 'var(--paper)', border: '1px solid var(--border)',
            padding: '2rem', zIndex: 201, animation: 'up .22s ease both',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.8rem' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant), Cormorant Garamond, serif', fontWeight: 300, fontSize: '1.35rem' }}>
                Partager ta lettre
              </h2>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: 'var(--mute)', cursor: 'pointer', lineHeight: 1, padding: '0 .2rem' }}>
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <button
                className="btn btn-border"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/lettre/' + letter.token)
                  setModalLinkCopied(true)
                  setTimeout(() => setModalLinkCopied(false), 2500)
                }}
              >
                {modalLinkCopied ? 'Copié ✓' : 'Copier le lien'}
              </button>
              <a
                className="btn btn-dark"
                style={{ textDecoration: 'none', justifyContent: 'center' }}
                href={`mailto:?subject=Une lettre pour toi&body=${encodeURIComponent("J'ai quelque chose à te dire. Tu peux lire ma lettre ici : " + window.location.origin + '/lettre/' + letter.token)}`}
              >
                Envoyer par email
              </a>
            </div>
          </div>
        </>
      )}

    </main>
  )
}
