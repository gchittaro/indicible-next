'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateAiEditsCount } from '@/app/actions/letters'

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
  ai_edits_count: number
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
  const [aiEditsUsed, setAiEditsUsed]           = useState(letter.ai_edits_count)
  const [adjustInstruction, setAdjustInstruction] = useState('')
  const [adjusting, setAdjusting]               = useState(false)
  const [regenIndex, setRegenIndex]             = useState<number | null>(null)
  const [copied, setCopied]                     = useState(false)
  const [linkCopied, setLinkCopied]             = useState(false)

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
          ✦ Version premium activée
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
          {isPremium ? `${editsLeft} ajustement${editsLeft !== 1 ? 's' : ''} disponible${editsLeft !== 1 ? 's' : ''}` : `${editsLeft} ajustement${editsLeft !== 1 ? 's' : ''} gratuit${editsLeft !== 1 ? 's' : ''} restant${editsLeft !== 1 ? 's' : ''}`}
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
        <div className="premium-gate" style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '.82rem', fontWeight: 300, lineHeight: 1.6 }}>
            {isPremium
              ? `Tu as utilisé tes ${maxEdits} ajustements premium.`
              : `Tu as utilisé tes ${FREE_AI_EDITS} ajustements gratuits — passe en version premium pour continuer à affiner ta lettre.`}
          </p>
        </div>
      ) : (
        <div className="adjust-wrap" style={{ marginBottom: '2rem' }}>
          <textarea
            className="adjust-input"
            rows={2}
            placeholder="Ajuste ta lettre… ex : Rends-la plus courte"
            value={adjustInstruction}
            onChange={e => setAdjustInstruction(e.target.value)}
          />
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
            Appliquer
            {editsLeft > 0 && (
              <span style={{ marginLeft: '.4rem', opacity: .55, fontSize: '.6rem' }}>
                ({editsLeft} restant{editsLeft > 1 ? 's' : ''})
              </span>
            )}
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="lactions">
        <button
          className="btn btn-dark"
          onClick={() => { navigator.clipboard.writeText(currentLetter); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        >
          {copied ? 'Copié ✓' : 'Copier le texte'}
        </button>
        <button
          className="btn btn-border"
          onClick={() => {
            navigator.clipboard.writeText(window.location.origin + '/lettre/' + letter.token)
            setLinkCopied(true)
            setTimeout(() => setLinkCopied(false), 2000)
          }}
        >
          {linkCopied ? 'Lien copié ✓' : 'Partager le lien'}
        </button>
      </div>

    </main>
  )
}
