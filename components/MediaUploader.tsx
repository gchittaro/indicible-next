'use client'

import { useRef, useState } from 'react'
import { updateLetterMedia, type MediaItem } from '@/app/actions/letters'

function parseVideoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  return null
}

export default function MediaUploader({
  letterId,
  initialItems,
}: {
  letterId: string
  initialItems: MediaItem[]
}) {
  const [items, setItems]           = useState<MediaItem[]>(initialItems)
  const [uploading, setUploading]   = useState(false)
  const [videoInput, setVideoInput] = useState('')
  const [showVideo, setShowVideo]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const fileRef                     = useRef<HTMLInputElement>(null)
  const captionTimer                = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function persist(next: MediaItem[]) {
    setItems(next)
    setSaveStatus('saving')
    try {
      await updateLetterMedia(letterId, next)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      console.error('[MediaUploader] save error:', err)
      setSaveStatus('error')
      setError('Erreur de sauvegarde — vérifie que la colonne media_items existe dans Supabase')
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('letterId', letterId)
    try {
      const res  = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        await persist([...items, { id: crypto.randomUUID(), type: 'image', url: data.url, caption: '' }])
      } else {
        setError(data.error ?? 'Erreur lors du chargement')
      }
    } catch {
      setError('Erreur lors du chargement')
    }
    setUploading(false)
    e.target.value = ''
  }

  async function addVideo() {
    const embed = parseVideoEmbed(videoInput.trim())
    if (!embed) { setError('Lien YouTube ou Vimeo invalide'); return }
    await persist([...items, { id: crypto.randomUUID(), type: 'video', url: embed, caption: '' }])
    setVideoInput('')
    setShowVideo(false)
    setError(null)
  }

  async function remove(id: string) {
    await persist(items.filter(i => i.id !== id))
  }

  function updateCaption(id: string, caption: string) {
    const next = items.map(i => i.id === id ? { ...i, caption } : i)
    setItems(next)
    if (captionTimer.current) clearTimeout(captionTimer.current)
    captionTimer.current = setTimeout(async () => {
      try {
        await updateLetterMedia(letterId, next)
      } catch { /* silent for captions */ }
    }, 700)
  }

  const photos = items.filter(i => i.type === 'image')
  const videos = items.filter(i => i.type === 'video')

  return (
    <div style={{ marginTop: '3rem' }}>

      {/* Section label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.6rem' }}>
        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <p style={{ fontSize: '.58rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--mute)', whiteSpace: 'nowrap' }}>
          Souvenirs
        </p>
        <span style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      {/* Add buttons + save status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
        <button className="media-add-btn" onClick={() => { fileRef.current?.click(); setError(null) }} disabled={uploading}>
          {uploading ? <>◻ Chargement…</> : <>◻ Photo</>}
        </button>
        <button
          className="media-add-btn"
          onClick={() => { setShowVideo(v => !v); setError(null) }}
          style={showVideo ? { borderColor: 'var(--ink)', color: 'var(--ink)' } : {}}
        >
          ▷ Vidéo
        </button>
        {saveStatus === 'saving' && (
          <span style={{ fontSize: '.62rem', color: 'var(--mute)', letterSpacing: '.06em' }}>Enregistrement…</span>
        )}
        {saveStatus === 'saved' && (
          <span style={{ fontSize: '.62rem', color: '#4A7C59', letterSpacing: '.06em' }}>Enregistré ✓</span>
        )}
      </div>

      {/* Video input */}
      {showVideo && (
        <div style={{ display: 'flex', gap: '.7rem', marginBottom: '1.2rem', animation: 'up .2s ease both' }}>
          <input
            type="url"
            className="adjust-input"
            placeholder="Colle un lien YouTube ou Vimeo…"
            value={videoInput}
            onChange={e => { setVideoInput(e.target.value); setError(null) }}
            onKeyDown={e => { if (e.key === 'Enter') addVideo() }}
            autoFocus
            style={{ flex: 1 }}
          />
          <button className="btn btn-dark" onClick={addVideo} disabled={!videoInput.trim()}>
            Ajouter
          </button>
        </div>
      )}

      {error && (
        <p style={{ fontSize: '.72rem', color: '#8B3A3A', marginBottom: '.8rem', lineHeight: 1.5 }}>{error}</p>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="media-grid" style={{ marginBottom: videos.length > 0 ? '1.5rem' : 0 }}>
          {photos.map(item => (
            <div key={item.id} className="media-photo-wrap">
              <div className="media-photo-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.caption || ''} className="media-photo-img" />
                <button className="media-remove" onClick={() => remove(item.id)} title="Supprimer">×</button>
              </div>
              <input
                type="text"
                className="media-caption"
                placeholder="Ajoute une légende…"
                value={item.caption}
                onChange={e => updateCaption(item.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      {videos.map(item => (
        <div key={item.id} className="media-video-wrap">
          <div className="media-video-inner">
            <iframe
              src={item.url}
              title="video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="media-video-iframe"
            />
            <button className="media-remove media-remove-video" onClick={() => remove(item.id)} title="Supprimer">×</button>
          </div>
          <input
            type="text"
            className="media-caption"
            placeholder="Ajoute une légende…"
            value={item.caption}
            onChange={e => updateCaption(item.id, e.target.value)}
          />
        </div>
      ))}

    </div>
  )
}
