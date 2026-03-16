'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Header from '@/components/Header'

// Dan's email (only he can access admin)
const DAN_EMAIL = 'danielhairiemir@gmail.com'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null)
  const [entriesCount, setEntriesCount] = useState(0)
  const [draftsCount, setDraftsCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !user.email) {
        router.push('/login')
        return
      }
      
      // Check if this is Dan's account
      if (user.email !== DAN_EMAIL) {
        setError('Access denied. Admin is for Dan only.')
        setTimeout(() => router.push('/'), 3000)
        return
      }
      
      setAuthUser({ id: user.id, email: user.email || '' })
      countEntries(user.id)
    })
  }, [router])

  const countEntries = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('id, status', { head: true })
        .eq('user_id', userId)

      if (error) throw error

      setEntriesCount(data?.length || 0)
      setDraftsCount(data?.filter(e => e.status === 'draft').length || 0)
    } catch (err) {
      console.error('Failed to count entries:', err)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto py-20">
          <div className="design-card rounded-none p-8 text-center">
            <p className="text-headline mb-4">⛔ Access Denied</p>
            <p className="text-body mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting to homepage...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="display-large mb-2">
          Admin Dashboard
        </h1>
        <p className="text-body mb-8">
          {authUser.email}
        </p>
        <div className="design-divider" />

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* New Entry */}
          <Link href="/admin/write" className="design-card rounded-none p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">✏️</div>
            <h2 className="text-headline mb-2">Write Entry</h2>
            <p className="text-body mb-4">
              Create a new diary entry for Luke
            </p>
          </Link>

          {/* My Entries */}
          <Link href="/my-entries" className="design-card rounded-none p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">📚</div>
            <h2 className="text-headline mb-2">My Entries</h2>
            <p className="text-body mb-4">
              View and manage all your entries
            </p>
            <div className="text-sm font-bold uppercase tracking-wider">
              {entriesCount} entries ({draftsCount} drafts)
            </div>
          </Link>

          {/* Spotify Connection */}
          <Link href="/admin/spotify" className="design-card rounded-none p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🎵</div>
            <h2 className="text-headline mb-2">Spotify</h2>
            <p className="text-body mb-4">
              Connect your Spotify to show what you&apos;re listening to
            </p>
          </Link>

          {/* Profile */}
          <Link href="/profile" className="design-card rounded-none p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">👤</div>
            <h2 className="text-headline mb-2">Profile</h2>
            <p className="text-body mb-4">
              Manage your account settings
            </p>
          </Link>
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="design-nav-link">
            ← Back to Calendar
          </Link>
        </div>
      </div>
    </div>
  )
}
