'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugEmailPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email)
        setUserId(user.id)
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Your Account Info</h1>
        {email ? (
          <div className="space-y-2">
            <p><strong>Email:</strong> {email}</p>
            <p><strong>User ID:</strong> {userId}</p>
            <p className="text-sm text-gray-500 mt-4">
              Copy this email to docs/supabase-email-config.md
            </p>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  )
}
