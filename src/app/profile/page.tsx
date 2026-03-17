'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Header from '@/components/Header'

export default function ProfilePage() {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<{ id: string; email: string; role?: string } | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      
      // Fetch user name from users table
      const { data: userData } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single()
      
      setAuthUser({ 
        id: user.id, 
        email: user.email || '',
        role: userData?.name || 'User'
      })
    })
  }, [router])

  const handleChangeEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      setMessage('Please enter a valid email')
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      
      if (error) throw error
      
      setMessage('✅ Email change request sent! Check your inbox for confirmation. You will be logged out once the change is complete.')
      setNewEmail('')
    } catch (err) {
      setMessage('❌ Failed: ' + ((err as Error).message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword) {
      setMessage('Please enter a new password')
      return
    }
    
    if (newPassword !== confirmPassword) {
      setMessage('❌ Passwords do not match')
      return
    }
    
    if (newPassword.length < 6) {
      setMessage('❌ Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      
      if (error) throw error
      
      setMessage('✅ Password changed! You will be logged out and need to sign in with your new password.')
      setNewPassword('')
      setConfirmPassword('')
      
      // Sign out after password change
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login')
      }, 2000)
    } catch (err) {
      setMessage('❌ Failed: ' + ((err as Error).message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const [deletePassword, setDeletePassword] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage('❌ Please enter your password to confirm')
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    try {
      // First verify password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: authUser.email,
        password: deletePassword
      })
      
      if (signInError) {
        setMessage('❌ Incorrect password')
        setLoading(false)
        return
      }
      
      // Delete all user's diary entries first
      const { error: entriesError } = await supabase
        .from('diary_entries')
        .delete()
        .eq('user_id', authUser.id)
      
      if (entriesError) throw entriesError
      
      // Delete user record from users table
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', authUser.id)
      
      if (userError) throw userError
      
      setMessage('✅ Account deleted. Redirecting to login...')
      
      // Sign out and redirect to login page
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login')
      }, 2000)
    } catch (err) {
      setMessage('❌ Failed to delete: ' + ((err as Error).message || 'Unknown error'))
      setLoading(false)
    }
  }

  if (!authUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-20">
        <h1 className="display-large mb-2">
          Profile Settings
        </h1>
        <p className="text-body mb-8">
          Manage your account
        </p>
        <div className="design-divider" />

        {message && (
          <div className={`p-4 text-center mt-6 ${
            message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <div className="design-card rounded-none p-8 mt-8">
          {/* User Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Email
              </p>
              <p className="text-body">{authUser.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                Role
              </p>
              <p className="text-body capitalize">{authUser.role}</p>
            </div>
          </div>

          {/* Current Email */}
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Current Email
            </p>
            <p className="text-body">{authUser.email}</p>
          </div>

          {/* Change Email */}
          <div className="mb-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Change Email
            </label>
            <div className="flex gap-4">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New email address"
                className="flex-1 design-input"
              />
              <button
                onClick={handleChangeEmail}
                disabled={loading || !newEmail}
                className="design-button disabled:opacity-50"
              >
                Update
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              A confirmation email will be sent to your new address. You will be logged out once the change is complete.
            </p>
          </div>

          <div className="design-divider" />

          {/* Change Password */}
          <div className="mt-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Change Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full design-input mb-4"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full design-input mb-4"
            />
            <button
              onClick={handleChangePassword}
              disabled={loading || !newPassword || !confirmPassword}
              className="design-button disabled:opacity-50"
            >
              Change Password
            </button>
            <p className="text-xs text-gray-500 mt-2">
              You will be logged out and need to sign in with your new password.
            </p>
          </div>

          <div className="design-divider" />

          {/* Delete Account */}
          <div className="mt-8">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              Delete Account
            </label>
            <p className="text-body text-gray-600 mb-4">
              Enter your password to permanently delete your account and all entries.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-600 text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-red-700"
              >
                Delete Account
              </button>
            ) : (
              <div className="space-y-4">
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full design-input"
                />
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false)
                      setDeletePassword('')
                    }}
                    className="bg-gray-200 text-gray-700 px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={loading || !deletePassword}
                    className="bg-red-600 text-white px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-red-700 disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
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
