'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { logout } from '@/app/auth/actions'

export default function NavDropdown({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const initial = email[0]?.toUpperCase() || '?'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="nav-avatar" onClick={() => setOpen(o => !o)} aria-label="Menu utilisateur" aria-expanded={open}>
        {initial}
      </button>
      {open && (
        <div className="nav-dropdown">
          <div className="nav-dropdown-email">{email}</div>
          <div className="nav-dropdown-divider" />
          <Link href="/settings" className="nav-dropdown-item" onClick={() => setOpen(false)}>
            Paramètres du compte
          </Link>
          <div className="nav-dropdown-divider" />
          <form action={logout}>
            <button type="submit" className="nav-dropdown-item nav-dropdown-logout">Déconnexion</button>
          </form>
        </div>
      )}
    </div>
  )
}
