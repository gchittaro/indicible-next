'use client'

import { useState } from 'react'

export default function PremiumButton({ letterId, token }: { letterId: string; token: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ letterId, token }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError('Une erreur est survenue. Réessaie.')
        setLoading(false)
      }
    } catch {
      setError('Une erreur est survenue. Réessaie.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button className="btn btn-dark" onClick={handleClick} disabled={loading}>
        {loading ? 'Redirection…' : 'Passer en premium — 4,99 €'}
      </button>
      {error && (
        <p style={{ marginTop: '.5rem', fontSize: '.72rem', color: '#8B3A3A' }}>{error}</p>
      )}
    </div>
  )
}
