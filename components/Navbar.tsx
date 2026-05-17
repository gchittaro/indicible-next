import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import NavDropdown from './NavDropdown'

export default async function Navbar() {
  let user = null
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      user = data.user
    }
  } catch {
    // Supabase not ready
  }

  return (
    <header className="navbar">
      <Link href="/" className="navbar-logo">Dicible</Link>
      <nav className="navbar-right">
        {user ? (
          <>
            <Link href="/dashboard" className="navbar-link">Mes lettres</Link>
            <NavDropdown email={user.email || ''} />
          </>
        ) : (
          <>
            <Link href="/login" className="navbar-link">Se connecter</Link>
            <Link href="/register" className="btn btn-dark" style={{ textDecoration: 'none', padding: '.55rem 1.2rem' }}>
              Commencer
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
