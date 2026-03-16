'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
  
  // Service role key for bypassing RLS (defined at component scope)
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0dnJmemZndWRtcWFuaHFreGlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzU0MTg4NywiZXhwIjoyMDg5MTE3ODg3fQ.J7-u-w8XSmtTb0tNJ'

  const checkRoleAvailability = async (selectedName: string) => {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createClient(
      'https://rtvrfzfgudmqanhqkxir.supabase.co',
      serviceRoleKey
    )
    
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('name, email')
        .eq('name', selectedName)
        .single()
      
      if (error || !data) return { available: true }
      
      // Role is taken - reject signup
      return { available: false, takenBy: data.email }
    } catch {
      return { available: true }
    }
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (isSignUp) {
        // Validate role is selected
        if (!name) {
          setMessage('Please select your role (Dan or Luke)')
          setLoading(false)
          return
        }
        
        // Check if role is already taken
        const roleCheck = await checkRoleAvailability(name)
        if (!roleCheck.available) {
          setMessage(`${name} is already registered. Please use a different name or sign in.`)
          setLoading(false)
          return
        }
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        
        // Save user's name to database using service role key (bypasses RLS)
        if (data.user) {
          const { createClient } = await import('@supabase/supabase-js')
          const supabaseAdmin = createClient(
            'https://rtvrfzfgudmqanhqkxir.supabase.co',
            serviceRoleKey
          )
          
          const { error: insertError } = await supabaseAdmin
            .from('users')
            .upsert({
              id: data.user.id,
              email,
              name,
              role: 'user'
            })
          if (insertError) throw insertError
        }
        
        setMessage('Account created! Please check your email to confirm.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push('/')
      }
    } catch (err) {
      setMessage((err as Error).message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="design-card rounded-none p-8">
          <h1 className="display-large mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-body mb-8">
            {isSignUp ? 'Join the love story' : 'Sign in to continue'}
          </p>
          <div className="design-divider" />

          {message && (
            <div className={`p-4 text-center mt-6 ${
              message.includes('Failed') || message.includes('already')
                ? 'bg-red-50 text-red-700'
                : 'bg-green-50 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6 mt-8">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full design-input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full design-input"
                placeholder="••••••••"
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                  Your Name *
                </label>
                <select
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full design-input"
                >
                  <option value="">Select your role</option>
                  <option value="Dan">Dan 💚</option>
                  <option value="Luke">Luke 💜</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full design-button disabled:opacity-50"
            >
              {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-body hover:text-black underline"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
