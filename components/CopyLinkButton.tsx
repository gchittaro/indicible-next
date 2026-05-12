'use client'

import { useState } from 'react'

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(window.location.origin + url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button className="btn btn-border" onClick={copy}>
      {copied ? 'Lien copié ✓' : 'Copier le lien'}
    </button>
  )
}
