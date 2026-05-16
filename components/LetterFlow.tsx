'use client'

import { useState } from 'react'
import Link from 'next/link'
import TypingText from './TypingText'
import { saveLetter, updateAiEditsCount, markLetterShared } from '@/app/actions/letters'
import PremiumButton from './PremiumButton'

const FREE_AI_EDITS = 2

type Step =
  | 'intro' | 'choose' | 'proche_name' | 'amoureux_gender'
  | 'tone' | 'style' | 'moment' | 'intention'
  | 'questions' | 'generating' | 'letter'

interface Settings {
  tone:      string | null
  style:     string | null
  moment:    string | null
  intention: string | null
}

interface Answers { [key: string]: string }

const RELATIONSHIPS = [
  { id: 'pere',   pick: 'Mon père',  label: 'ton père',  display: 'Ton père',  tu: 'Papa'      },
  { id: 'mere',   pick: 'Ma mère',   label: 'ta mère',   display: 'Ta mère',   tu: 'Maman'     },
  { id: 'frere',  pick: 'Mon frère', label: 'ton frère', display: 'Ton frère', tu: 'Ton frère' },
  { id: 'soeur',  pick: 'Ma sœur',   label: 'ta sœur',   display: 'Ta sœur',   tu: 'Ta sœur'   },
  { id: 'ami',    pick: 'Mon ami',   label: 'ton ami',   display: 'Ton ami',   tu: 'Ton ami'   },
  { id: 'amie',   pick: 'Mon amie',  label: 'ton amie',  display: 'Ton amie',  tu: 'Ton amie'  },
  { id: 'amoureux', pick: 'Mon amoureux·se', label: '', display: '', tu: 'Mon amour' },
  { id: 'proche', pick: 'Un proche', label: '',          display: '',          tu: ''          },
]

const TONES = [
  { id: 'doux',          label: 'Doux & apaisé',      desc: 'Pour réconcilier, poser les choses sans brusquer',          icon: '◌' },
  { id: 'courageux',     label: 'Courageux & direct',  desc: "Pour dire enfin ce qu'on n'a jamais osé",                  icon: '→' },
  { id: 'nostalgique',   label: 'Nostalgique',         desc: "Pour parler d'un avant, d'une époque perdue",              icon: '◎' },
  { id: 'reconnaissant', label: 'Reconnaissant',       desc: "Pour dire merci pour ce qui n'a jamais été dit",           icon: '✦' },
  { id: 'melancolique',  label: 'Mélancolique',        desc: "Pour exprimer une tristesse qu'on porte depuis longtemps", icon: '~' },
  { id: 'paix',          label: 'En quête de paix',    desc: 'Pour pardonner, ou demander pardon',                       icon: '○' },
]

const STYLES = [
  { id: 'litteraire', label: 'Littéraire',      desc: 'Des images, des métaphores, une langue travaillée',    icon: '✎' },
  { id: 'simple',     label: 'Simple & direct', desc: 'Des phrases courtes, des mots vrais, sans ornement',   icon: '—' },
  { id: 'poetique',   label: 'Poétique',         desc: 'Un souffle, des silences, presque une chanson',        icon: '∿' },
]

const MOMENTS = [
  { id: 'vivant', label: 'Elle est encore là', desc: 'Je peux encore lui parler, lui envoyer' },
  { id: 'decede', label: "Elle n'est plus là",  desc: 'Je lui écris malgré son absence'        },
]

const INTENTIONS = [
  { id: 'envoyer',   label: "Je vais l'envoyer",    desc: 'Cette lettre est pour elle, pour lui'    },
  { id: 'moipour',   label: 'Juste pour moi',        desc: 'Je veux écrire, pas forcément envoyer'  },
  { id: 'sais_pas',  label: 'Je ne sais pas encore', desc: 'On verra selon ce que ça donne'          },
]

const QUESTIONS = [
  {
    id: 'souvenir',
    text: (name: string) => `Y a-t-il un souvenir avec ${name} qui te revient avec tendresse — une scène, une image, un moment qui te réchauffe ?`,
    placeholder: 'Un souvenir, une sensation, une image...',
  },
  {
    id: 'apport',
    text: () => "Qu'est-ce que cette relation t'a apporté, même dans les moments difficiles ?",
    placeholder: "Ce que cette relation t'a donné...",
  },
  {
    id: 'ressenti',
    text: () => "Qu'est-ce que tu aimerais que cette personne sache sur toi, sur ce que tu ressens vraiment ?",
    placeholder: "Ce que tu voudrais qu'elle sache...",
  },
  {
    id: 'pourquoi',
    text: () => "Qu'est-ce qui t'a donné envie de lui écrire aujourd'hui ?",
    placeholder: "Ce qui t'a poussé à écrire maintenant...",
  },
  {
    id: 'suite',
    text: (name: string) => `Comment tu imagines la suite, après que ${name} ait lu ta lettre ?`,
    placeholder: 'Ce que tu espères pour la suite...',
  },
]

const TONE_INSTRUCTIONS: Record<string, string> = {
  doux:          'Ton doux, bienveillant, apaisant. Des phrases qui bercent. On dépose les choses délicatement.',
  courageux:     'Ton courageux, direct, avec une vulnérabilité assumée. Ni agressif ni timide — juste honnête.',
  nostalgique:   "Ton nostalgique. On parle d'un avant, d'une époque perdue. On cherche ce qu'on a connu.",
  reconnaissant: "Ton de gratitude profonde. Pas de remerciements convenus — une reconnaissance viscérale.",
  melancolique:  "Ton mélancolique, habité par une tristesse douce qu'on pose enfin. Pas de dramatisation.",
  paix:          "Ton de quelqu'un qui cherche la paix — pour soi autant que pour l'autre. On veut clore, pas rouvrir.",
}
const STYLE_INSTRUCTIONS: Record<string, string> = {
  litteraire: 'Style littéraire : images concrètes, métaphores justes, langue soignée sans être pompeuse.',
  simple:     'Style simple et direct : phrases courtes, mots ordinaires mais vrais, aucun ornement inutile.',
  poetique:   'Style poétique : beaucoup de blanc, de silence entre les phrases, un souffle, presque une chanson.',
}
const MOMENT_INSTRUCTIONS: Record<string, string> = {
  vivant: 'La personne est vivante. La lettre peut envisager un futur, une conversation possible.',
  decede: "La personne est décédée. La lettre s'adresse à elle malgré son absence — un adieu, une continuation du lien. Pas de formules religieuses sauf si les réponses l'impliquent.",
}
const INTENTION_INSTRUCTIONS: Record<string, string> = {
  envoyer:  "Cette lettre sera envoyée. Elle doit être lisible par l'autre, touchante mais pas accablante.",
  moipour:  "Cette lettre est juste pour la personne qui écrit. Elle peut être plus crue, plus libérée.",
  sais_pas: "On ne sait pas si la lettre sera envoyée. Écris-la comme si elle pouvait l'être, mais avec toute la liberté du doute.",
}

const SETTING_STEPS = ['tone', 'style', 'moment', 'intention']

function getAppellatif(relationship: string, procheName: string): string {
  if (relationship === 'proche') return procheName || 'toi'
  if (relationship === 'amoureux') return 'Mon amour'
  return RELATIONSHIPS.find(r => r.id === relationship)?.tu || 'toi'
}

async function callApi(prompt: string): Promise<string> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const data = await res.json()
  return data.text || 'Une erreur est survenue.'
}

async function generateLetter(relationship: string, procheName: string, settings: Settings, answers: Answers): Promise<string> {
  const appellatif = getAppellatif(relationship, procheName)
  const prompt = `Tu es l'un des plus grands épistoliers de notre époque. On te confie quelque chose de rare : les fragments vrais d'une relation humaine — un souvenir, une blessure, des mots jamais dits. Ta mission est de les transformer en une lettre qui bouleverse, sans jamais être excessive.

RÈGLE ABSOLUE : La lettre s'adresse directement à la personne en la tutoyant ("tu", "toi", "te", "ton", "ta"). Commence par "${appellatif}," sur sa propre ligne — jamais par "Mon père", "Ma mère" ou toute autre formule à la troisième personne.

Réglages choisis :
— Ton : ${TONE_INSTRUCTIONS[settings.tone!]}
— Style : ${STYLE_INSTRUCTIONS[settings.style!]}
— Contexte : ${MOMENT_INSTRUCTIONS[settings.moment!]}
— Intention : ${INTENTION_INSTRUCTIONS[settings.intention!]}

Matière première — ce que la personne a confié :
— Un souvenir tendre : "${answers.souvenir}"
— Ce que cette relation lui a apporté : "${answers.apport}"
— Ce qu'elle veut que l'autre sache : "${answers.ressenti}"
— Pourquoi elle écrit maintenant : "${answers.pourquoi}"
— Comment elle imagine la suite : "${answers.suite}"

Lois d'écriture — à respecter absolument :
1. Ne recopie JAMAIS les mots de la personne — transforme-les, fais-en des images, des métaphores, des sensations
2. Trouve UN détail concret et inattendu qui ancre la lettre dans le réel (une odeur, un geste, une lumière, un objet)
3. L'émotion doit monter en trois temps : une ouverture douce, un nœud central, une résolution ouverte
4. Aucune formule convenue ("Je t'écris aujourd'hui", "Je voulais te dire", "Au fond de moi")
5. La dernière phrase doit rester en suspension — pas de conclusion, pas de morale
6. Entre 220 et 300 mots — pas un mot de plus, pas un mot de moins
7. Jamais pompeux, jamais thérapeutique — toujours humain, imparfait, vrai

LANGUE : Réponds UNIQUEMENT en français, quelles que soient les réponses de l'utilisateur.

Écris uniquement la lettre. Pas de titre, pas de commentaire, pas de guillemets autour.`
  return callApi(prompt)
}

async function adjustLetter(currentLetter: string, instruction: string, relationship: string, procheName: string): Promise<string> {
  const appellatif = getAppellatif(relationship, procheName)
  const prompt = `Tu as ecrit cette lettre:\n\n${currentLetter}\n\nDemande: ${instruction}\n\nReecris-la en appliquant cette demande. Tutoiement, commence par ${appellatif}, entre 220 et 300 mots.`
  return callApi(prompt)
}

async function regenParagraph(para: string, currentLetter: string): Promise<string> {
  const prompt = `Tu as ecrit cette lettre:\n\n${currentLetter}\n\nReecris uniquement ce paragraphe differemment, plus fort. Reponds avec uniquement le nouveau paragraphe.\n\nParagraphe: ${para}`
  return callApi(prompt)
}

interface Option { id: string; label: string; desc: string; icon?: string }

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="btn-ghost" onClick={onClick} style={{ marginTop: '1.2rem', fontSize: '.65rem' }}>
      ← Retour
    </button>
  )
}

function SettingGrid({ tag, title, options, onPick, onBack, columns = 2 }: {
  tag: string; title: string; options: Option[]; onPick: (id: string) => void; onBack: () => void; columns?: number
}) {
  return (
    <div className="setting-wrap">
      <p className="section-tag">{tag}</p>
      <h2 className="headline">{title}</h2>
      <div className="opt-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {options.map(o => (
          <button key={o.id} className="opt-btn" onClick={() => onPick(o.id)}>
            {o.icon && <span className="opt-icon">{o.icon}</span>}
            <span className="opt-label">{o.label}</span>
            <span className="opt-desc">{o.desc}</span>
          </button>
        ))}
      </div>
      <BackButton onClick={onBack} />
    </div>
  )
}

export default function LetterFlow() {
  const [step, setStep]                   = useState<Step>('intro')
  const [relationship, setRelationship]   = useState<string | null>(null)
  const [procheName, setProcheName]       = useState('')
  const [amoureux_gender, setAmoureux_gender] = useState<'il' | 'elle' | null>(null)
  const [settings, setSettings]           = useState<Settings>({ tone: null, style: null, moment: null, intention: null })
  const [qIndex, setQIndex]               = useState(0)
  const [answers, setAnswers]             = useState<Answers>({})
  const [answer, setAnswer]               = useState('')
  const [qReady, setQReady]               = useState(false)
  const [letter, setLetter]               = useState('')
  const [letterVisible, setLetterVisible] = useState(false)
  const [copied, setCopied]               = useState(false)
  const [adjustInstruction, setAdjustInstruction] = useState('')
  const [adjusting, setAdjusting]         = useState(false)
  const [paragraphs, setParagraphs]       = useState<string[]>([])
  const [regenIndex, setRegenIndex]       = useState<number | null>(null)
  const [savedToken, setSavedToken]       = useState<string | null>(null)
  const [savedLetterId, setSavedLetterId] = useState<string | null>(null)
  const [aiEditsUsed, setAiEditsUsed]     = useState(0)
  const [linkCopied, setLinkCopied]       = useState(false)
  const [shortAnswerError, setShortAnswerError] = useState(false)
  const [out, setOut]                     = useState(false)

  const rel        = RELATIONSHIPS.find(r => r.id === relationship)
  const relName    = relationship === 'proche'
    ? procheName
    : relationship === 'amoureux'
      ? (amoureux_gender === 'il' ? 'ton amoureux' : 'ton amoureuse')
      : (rel?.label || '')
  const relDisplay = relationship === 'proche'
    ? procheName
    : relationship === 'amoureux'
      ? (amoureux_gender === 'il' ? 'Ton amoureux' : 'Ton amoureuse')
      : (rel?.display || '')
  const q = QUESTIONS[qIndex]

  function go(fn: () => void) {
    setOut(true)
    setTimeout(() => { fn(); setOut(false) }, 340)
  }

  function goBack() {
    switch (step) {
      case 'choose':
        go(() => setStep('intro'))
        break
      case 'proche_name':
      case 'amoureux_gender':
        go(() => setStep('choose'))
        break
      case 'tone':
        if (relationship === 'proche') go(() => setStep('proche_name'))
        else if (relationship === 'amoureux') go(() => setStep('amoureux_gender'))
        else go(() => setStep('choose'))
        break
      case 'style':
        go(() => setStep('tone'))
        break
      case 'moment':
        go(() => setStep('style'))
        break
      case 'intention':
        go(() => setStep('moment'))
        break
      case 'questions':
        setShortAnswerError(false)
        if (qIndex > 0) {
          go(() => { setQIndex(qIndex - 1); setAnswer(answers[QUESTIONS[qIndex - 1].id] || ''); setQReady(false) })
        } else {
          go(() => setStep('intention'))
        }
        break
    }
  }

  function pickRelationship(id: string) {
    setRelationship(id)
    if (id === 'proche') go(() => setStep('proche_name'))
    else if (id === 'amoureux') go(() => setStep('amoureux_gender'))
    else go(() => setStep('tone'))
  }

  function pickSetting(key: keyof Settings, value: string) {
    setSettings(s => ({ ...s, [key]: value }))
    const idx  = SETTING_STEPS.indexOf(key)
    const next = SETTING_STEPS[idx + 1]
    go(() => setStep((next || 'questions') as Step))
  }

  function updateLetter(text: string) {
    setLetter(text)
    setParagraphs(text.split('\n\n').filter(p => p.trim()))
  }

  async function next() {
    if (!answer.trim()) return
    if (answer.trim().split(/\s+/).length < 3) {
      setShortAnswerError(true)
      return
    }
    setShortAnswerError(false)
    const newA = { ...answers, [q.id]: answer }
    setAnswers(newA)
    setAnswer('')
    setQReady(false)

    if (qIndex < QUESTIONS.length - 1) {
      go(() => { setQIndex(qIndex + 1); setQReady(false) })
    } else {
      go(() => setStep('generating'))
      try {
        const text = await generateLetter(relationship!, procheName, settings, newA)
        updateLetter(text)
        try {
          const saved = await saveLetter({
            recipient_name: relationship === 'proche' ? procheName : relationship === 'amoureux' ? (amoureux_gender === 'il' ? 'amoureux' : 'amoureuse') : null,
            recipient_type: relationship!,
            tone: settings.tone!,
            style: settings.style!,
            moment: settings.moment!,
            intention: settings.intention!,
            answers: newA,
            content: text,
          })
          setSavedLetterId(saved.id)
          setSavedToken(saved.token)
        } catch (err) {
          console.error('[saveLetter]', err)
        }
        go(() => { setStep('letter'); setTimeout(() => setLetterVisible(true), 200) })
      } catch {
        setLetter('Une erreur est survenue. Vérifie ta connexion et réessaie.')
        go(() => setStep('letter'))
      }
    }
  }

  function restart() {
    go(() => {
      setStep('intro')
      setRelationship(null)
      setProcheName('')
      setAmoureux_gender(null)
      setSettings({ tone: null, style: null, moment: null, intention: null })
      setQIndex(0)
      setAnswers({})
      setAnswer('')
      setLetter('')
      setLetterVisible(false)
      setSavedToken(null)
      setSavedLetterId(null)
      setAiEditsUsed(0)
    })
  }

  const totalSteps     = SETTING_STEPS.length + QUESTIONS.length
  const currentStepNum =
    step === 'questions'                        ? SETTING_STEPS.length + qIndex
    : step === 'generating' || step === 'letter' ? totalSteps
    : SETTING_STEPS.indexOf(step)

  const progress =
    step === 'intro' || step === 'choose' || step === 'proche_name' || step === 'amoureux_gender' ? 0
    : (currentStepNum / totalSteps) * 100

  return (
    <>
      <div className="bar" style={{ width: `${progress}%` }} />

      <div className={`scene ${out ? 'out' : ''}`}>

        {step === 'intro' && (
          <div className="intro">
            <p className="eyebrow">Pour dire ce qu&apos;on n&apos;a jamais dit</p>
            <h1 className="display">Les mots que tu<br />n&apos;as pas encore <em>trouvés</em></h1>
            <p className="lead">Quelques questions. Une lettre que tu n&apos;aurais jamais pu écrire seul·e.</p>
            <button className="btn btn-dark" onClick={() => go(() => setStep('choose'))}>Commencer</button>
          </div>
        )}

        {step === 'choose' && (
          <div className="choose">
            <p className="section-tag">Le destinataire</p>
            <h2 className="headline">À qui veux-tu écrire ?</h2>
            <div className="grid2">
              {RELATIONSHIPS.filter(r => r.id !== 'proche' && r.id !== 'amoureux').map(r => (
                <button key={r.id} className="rel-btn" onClick={() => pickRelationship(r.id)}>{r.pick}</button>
              ))}
              <button className="rel-btn" style={{ gridColumn: '1 / -1' }} onClick={() => pickRelationship('amoureux')}>
                Mon amoureux·se
              </button>
              <button className="rel-btn" style={{ gridColumn: '1 / -1' }} onClick={() => pickRelationship('proche')}>
                Un proche — prénom libre
              </button>
            </div>
            <BackButton onClick={() => go(() => setStep('intro'))} />
          </div>
        )}

        {step === 'amoureux_gender' && (
          <div className="choose">
            <p className="section-tag">Le destinataire</p>
            <h2 className="headline">C&apos;est…</h2>
            <div className="grid2">
              <button className="rel-btn" onClick={() => { setAmoureux_gender('il'); go(() => setStep('tone')) }}>Mon amoureux</button>
              <button className="rel-btn" onClick={() => { setAmoureux_gender('elle'); go(() => setStep('tone')) }}>Ma amoureuse</button>
            </div>
            <BackButton onClick={() => go(() => setStep('choose'))} />
          </div>
        )}

        {step === 'proche_name' && (
          <div className="qwrap">
            <p className="qnum">Le destinataire</p>
            <div className="qtext">Quel est son prénom ?</div>
            <input type="text" className="textarea" placeholder="Prénom..."
              value={procheName} onChange={e => setProcheName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && procheName.trim()) go(() => setStep('tone')) }}
              autoFocus />
            <div className="qfooter">
              <BackButton onClick={() => go(() => setStep('choose'))} />
              <button className="btn btn-dark" onClick={() => { if (procheName.trim()) go(() => setStep('tone')) }} disabled={!procheName.trim()}>
                Continuer →
              </button>
            </div>
          </div>
        )}

        {step === 'tone' && (
          <SettingGrid tag="Le ton" title="Comment veux-tu lui parler ?" options={TONES} columns={2}
            onPick={v => pickSetting('tone', v)} onBack={goBack} />
        )}
        {step === 'style' && (
          <SettingGrid tag="Le style" title="Quelle forme pour ta lettre ?" options={STYLES} columns={3}
            onPick={v => pickSetting('style', v)} onBack={goBack} />
        )}
        {step === 'moment' && (
          <SettingGrid tag="La situation" title="Cette personne est encore là ?" options={MOMENTS} columns={2}
            onPick={v => pickSetting('moment', v)} onBack={goBack} />
        )}
        {step === 'intention' && (
          <SettingGrid tag="L'intention" title="Que vas-tu faire de cette lettre ?" options={INTENTIONS} columns={3}
            onPick={v => pickSetting('intention', v)} onBack={goBack} />
        )}

        {step === 'questions' && q && (
          <div className="qwrap" key={qIndex}>
            <p className="qnum">{qIndex + 1} sur {QUESTIONS.length}</p>
            <div className="qtext">
              <TypingText text={q.text(relName)} onDone={() => setQReady(true)} speed={20} />
            </div>
            {qReady && (
              <div style={{ animation: 'up .4s ease both' }}>
                <textarea className="textarea" rows={4} placeholder={q.placeholder}
                  value={answer} onChange={e => { setAnswer(e.target.value); setShortAnswerError(false) }}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) next() }}
                  autoFocus />
                {shortAnswerError && (
                  <p style={{ fontSize: '.75rem', color: 'var(--soft)', marginTop: '.8rem', fontWeight: 300, lineHeight: 1.5 }}>
                    Prends le temps de répondre — plus tu partages, plus la lettre sera juste.
                  </p>
                )}
                <div className="qfooter">
                  <BackButton onClick={goBack} />
                  <button className="btn btn-dark" onClick={next} disabled={!answer.trim()}>
                    {qIndex === QUESTIONS.length - 1 ? 'Générer ma lettre' : 'Continuer →'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'generating' && (
          <div className="genwrap">
            <h2 className="gentitle">On écrit ta lettre…</h2>
            <p className="gensub">Quelques instants, le temps de trouver les bons mots.</p>
            <div className="dots"><span /><span /><span /></div>
          </div>
        )}

        {step === 'letter' && (
          <div className="lwrap">
            <div className="lmeta">
              <p className="eyebrow">Ta lettre est prête</p>
              <h2 className="headline" style={{ marginBottom: '.8rem' }}>Pour {relDisplay}</h2>
              <div className="settings-recap">
                {[
                  TONES.find(t => t.id === settings.tone)?.label,
                  STYLES.find(s => s.id === settings.style)?.label,
                  MOMENTS.find(m => m.id === settings.moment)?.label,
                  INTENTIONS.find(i => i.id === settings.intention)?.label,
                ].filter(Boolean).map(l => <span key={l} className="ltag">{l}</span>)}
              </div>
            </div>

            <div className={`lpaper ${letterVisible ? 'show' : ''}`}>
              {adjusting ? (
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <div className="dots"><span /><span /><span /></div>
                  <p style={{ marginTop: '1rem', fontSize: '.8rem', color: 'var(--mute)' }}>On ajuste...</p>
                </div>
              ) : paragraphs.length > 0 ? paragraphs.map((para, i) => (
                <div key={i} className="para-wrap">
                  <p className="para-text">{para}</p>
                  <button
                    className="regen-btn"
                    title={aiEditsUsed >= FREE_AI_EDITS ? 'Limite atteinte' : 'Réécrire ce paragraphe'}
                    onClick={async () => {
                      if (aiEditsUsed >= FREE_AI_EDITS) return
                      const newCount = aiEditsUsed + 1
                      setAiEditsUsed(newCount)
                      if (savedLetterId) updateAiEditsCount(savedLetterId, newCount).catch(() => {})
                      setRegenIndex(i)
                      try {
                        const newPara = await regenParagraph(para, letter)
                        const arr = [...paragraphs]
                        arr[i] = newPara
                        setParagraphs(arr)
                        setLetter(arr.join('\n\n'))
                      } catch { /* silent */ }
                      setRegenIndex(null)
                    }}
                  >
                    {regenIndex === i ? '...' : '↺'}
                  </button>
                </div>
              )) : (
                <p style={{ whiteSpace: 'pre-wrap' }}>{letter}</p>
              )}
            </div>

            {aiEditsUsed >= FREE_AI_EDITS ? (
              <div className="premium-gate">
                <p style={{ marginBottom: '1rem' }}>
                  Tu as utilisé tes {FREE_AI_EDITS} modifications gratuites — débloquer 5 modifications supplémentaires pour 4,99 €
                </p>
                {savedToken && (
                  <PremiumButton letterId={savedLetterId ?? ''} token={savedToken} />
                )}
              </div>
            ) : (
              <div className="adjust-wrap">
                <textarea className="adjust-input" rows={2}
                  placeholder="Ajuste ta lettre… ex : Rends-la plus courte"
                  value={adjustInstruction} onChange={e => setAdjustInstruction(e.target.value)} />
                <button
                  className="btn btn-dark"
                  disabled={!adjustInstruction.trim() || adjusting}
                  onClick={async () => {
                    const newCount = aiEditsUsed + 1
                    setAiEditsUsed(newCount)
                    if (savedLetterId) updateAiEditsCount(savedLetterId, newCount).catch(() => {})
                    setAdjusting(true)
                    try {
                      const t = await adjustLetter(letter, adjustInstruction, relationship!, procheName)
                      updateLetter(t)
                      setAdjustInstruction('')
                    } catch { /* silent */ }
                    setAdjusting(false)
                  }}
                >
                  Appliquer
                  {FREE_AI_EDITS - aiEditsUsed > 0 && (
                    <span style={{ marginLeft: '.4rem', opacity: .55, fontSize: '.6rem' }}>
                      ({FREE_AI_EDITS - aiEditsUsed} restant{FREE_AI_EDITS - aiEditsUsed > 1 ? 's' : ''})
                    </span>
                  )}
                </button>
              </div>
            )}

            <div className="lactions">
              <button className="btn btn-dark" onClick={() => { navigator.clipboard.writeText(letter); setCopied(true); setTimeout(() => setCopied(false), 2000) }}>
                {copied ? 'Copié ✓' : 'Copier le texte'}
              </button>
              {savedToken && (
                <button className="btn btn-border" onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/lettre/' + savedToken)
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 2000)
                  if (savedLetterId) markLetterShared(savedLetterId).catch(() => {})
                }}>
                  {linkCopied ? 'Lien copié ✓' : 'Partager le lien'}
                </button>
              )}
              <button className="btn-ghost" onClick={restart}>Recommencer</button>
              <Link href="/dashboard" className="btn-ghost" style={{ textDecoration: 'none' }}>Mes lettres →</Link>
            </div>

            <p className="premium">✦ Débloquer plus de modifications — ajoute des photos et vidéos à ta lettre.</p>
          </div>
        )}

      </div>
    </>
  )
}
