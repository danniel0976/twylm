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
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-sm font-bold tracking-tight text-white hover:opacity-70">
          TWYLM
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
              {isDan && (
                <Link href="/profile" className="design-nav-link text-purple-100 hover:text-white">
                  Profile
                </Link>
              )}
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
    </nav>
  )
}
