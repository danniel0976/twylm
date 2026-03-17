'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// Dan's email (for admin menu display)
const DAN_EMAIL = 'danielhairiemir@gmail.com'

export default function Header() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isDan, setIsDan] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
      setIsDan(user?.email === DAN_EMAIL)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setIsLoggedIn(false)
    router.push('/')
  }

  return (
    <nav className="design-nav px-6 py-4 bg-purple-900/40 backdrop-blur-md border-b border-purple-500/30">
      {/* Desktop: Centered menu */}
      <div className="max-w-7xl mx-auto hidden md:flex justify-center items-center gap-8">
        <Link href="/" className="text-sm font-bold tracking-tight text-white hover:opacity-70">
          Love Like No Tomorrow
        </Link>
        <div className="flex gap-4">
          <Link href="/" className="design-nav-link text-purple-100 hover:text-white">
            Calendar
          </Link>
          <Link href="/about" className="design-nav-link text-purple-100 hover:text-white">
            About
          </Link>
          {isLoggedIn ? (
            <>
              {isDan && (
                <Link href="/admin" className="design-nav-link text-purple-100 hover:text-white">
                  Admin
                </Link>
              )}
              <Link href="/my-entries" className="design-nav-link text-purple-100 hover:text-white">
                My Entries
              </Link>
              <Link href="/profile" className="design-nav-link text-purple-100 hover:text-white">
                Profile
              </Link>
              <button onClick={handleSignOut} className="design-nav-link text-purple-100 hover:text-white">
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="design-nav-link text-purple-100 hover:text-white">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile: Title on top row, burger on bottom right */}
      <div className="md:hidden">
        <div className="text-center py-3">
          <Link href="/" className="text-sm font-bold tracking-tight text-white hover:opacity-70">
            Love Like No Tomorrow
          </Link>
        </div>
        <div className="flex justify-end pb-2">
          <button 
            className="text-white hover:text-white bg-purple-800/50 rounded p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 flex flex-col gap-3 border-t border-purple-500/30 pt-4">
          <Link href="/" className="design-nav-link text-purple-100 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
            Calendar
          </Link>
          <Link href="/about" className="design-nav-link text-purple-100 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
            About
          </Link>
          {isLoggedIn ? (
            <>
              {isDan && (
                <Link href="/admin" className="design-nav-link text-purple-100 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                  Admin
                </Link>
              )}
              <Link href="/my-entries" className="design-nav-link text-purple-100 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                My Entries
              </Link>
              <Link href="/profile" className="design-nav-link text-purple-100 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
                Profile
              </Link>
              <button onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} className="design-nav-link text-purple-100 hover:text-white text-left">
                Sign Out
              </button>
            </>
          ) : (
            <Link href="/login" className="design-nav-link text-purple-100 hover:text-white" onClick={() => setMobileMenuOpen(false)}>
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
