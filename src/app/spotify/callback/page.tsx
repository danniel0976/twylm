'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function CallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const savedState = localStorage.getItem('spotify_state')
    
    if (!code) {
      setError('No authorization code received')
      router.push('/')
      return
    }
    
    if (state !== savedState) {
      setError('State mismatch - possible CSRF attack')
      router.push('/')
      return
    }
    
    // Exchange code for token
    exchangeCodeForToken(code)
  }, [searchParams, router])

  const exchangeCodeForToken = async (code: string) => {
    try {
      const codeVerifier = localStorage.getItem('spotify_code_verifier')
      
      // Use API route for secure token exchange (has client_secret)
      const response = await fetch('/api/spotify/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          code_verifier: codeVerifier || '',
          redirect_uri: 'https://www.lovelikenotomorrow.com/spotify/callback',
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to get access token')
      }
      
      const data = await response.json()
      
      // Store tokens for future use
      localStorage.setItem('spotify_access_token', data.access_token)
      localStorage.setItem('spotify_refresh_token', data.refresh_token)
      localStorage.setItem('spotify_token_expiry', Date.now() + data.expires_in * 1000)
      
      // Clean up
      localStorage.removeItem('spotify_code_verifier')
      localStorage.removeItem('spotify_state')
      
      // Redirect to admin spotify page
      router.push('/admin/spotify')
    } catch (err) {
      console.error('Token exchange failed:', err)
      setError('Failed to authenticate with Spotify')
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="display-large mb-4">Connecting to Spotify...</h1>
        {error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <p className="text-gray-600">Please wait</p>
        )}
      </div>
    </div>
  )
}

export default function SpotifyCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="display-large mb-4">Connecting to Spotify...</h1>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}
