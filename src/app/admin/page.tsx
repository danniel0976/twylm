'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Header from '@/components/Header'

// Dan's email (only he can access admin)
const DAN_EMAIL = 'danielhairiemir@gmail.com'

export default function AdminPage() {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null)
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
      
      setAuthUser(user)
      // Redirect to dashboard
      router.push('/admin/dashboard')
    })
  }, [router])

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
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-2xl mx-auto py-20">
          <p className="text-gray-600 text-center">Loading...</p>
        </div>
      </div>
    )
  }

  return null
}
