'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Header from '@/components/Header'

export default function AdminSpotifyPage() {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<{ id: string } | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastPlayed, setLastPlayed] = useState<{song: string, artist: string, played_at: string} | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      setAuthUser(user)
      checkSpotifyConnection()
    })
  }, [router])

  const checkSpotifyConnection = async () => {
    const token = localStorage.getItem('spotify_access_token')
    const refreshToken = localStorage.getItem('spotify_refresh_token')
    const expiry = localStorage.getItem('spotify_token_expiry')
    
    // Check if token is expired or about to expire (within 5 minutes)
    const isExpired = !expiry || Date.now() >= parseInt(expiry) - 300000
    
    if (token && !isExpired) {
      setConnected(true)
      fetchLastPlayed(token)
    } else if (refreshToken && isExpired) {
      // Auto-refresh using refresh token
      await refreshAccessToken(refreshToken)
    }
  }

  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const response = await fetch('/api/spotify/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to refresh token')
      }
      
      const data = await response.json()
      
      // Update tokens
      localStorage.setItem('spotify_access_token', data.access_token)
      localStorage.setItem('spotify_token_expiry', Date.now() + data.expires_in * 1000)
      if (data.refresh_token) {
        localStorage.setItem('spotify_refresh_token', data.refresh_token)
      }
      
      setConnected(true)
      fetchLastPlayed(data.access_token)
    } catch (err) {
      console.error('Token refresh failed:', err)
      // Clear invalid tokens
      localStorage.removeItem('spotify_access_token')
      localStorage.removeItem('spotify_refresh_token')
      localStorage.removeItem('spotify_token_expiry')
      setConnected(false)
    }
  }

  const fetchLastPlayed = async (token: string) => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) return
      
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        const item = data.items[0]
        setLastPlayed({
          song: item.track.name,
          artist: item.track.artists.map((a: any) => a.name).join(', '),
          played_at: item.played_at,
        })
      }
    } catch (err) {
      console.error('Failed to fetch last played:', err)
    }
  }

  const handleSpotifyLogin = () => {
    const array = new Uint32Array(28)
    window.crypto.getRandomValues(array)
    const codeVerifier = Array.from(array, dec => ('0' + dec.toString(16)).slice(-4)).join('')
    
    localStorage.setItem('spotify_code_verifier', codeVerifier)
    
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    crypto.subtle.digest('SHA-256', data).then(buffer => {
      const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
      
      const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
      const redirectUri = encodeURIComponent(window.location.origin + '/spotify/callback')
      const scope = encodeURIComponent('user-read-recently-played user-read-currently-playing')
      const state = btoa(Math.random().toString(36).substring(7))
      
      localStorage.setItem('spotify_state', state)
      
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`
      window.location.href = authUrl
    })
  }

  const handleDisconnect = () => {
    localStorage.removeItem('spotify_access_token')
    localStorage.removeItem('spotify_refresh_token')
    localStorage.removeItem('spotify_token_expiry')
    localStorage.removeItem('spotify_code_verifier')
    localStorage.removeItem('spotify_state')
    setConnected(false)
    setLastPlayed(null)
  }

  if (!authUser) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-20">
        <h1 className="display-large mb-2">
          Spotify Connection
        </h1>
        <p className="text-body mb-8">
          Connect your Spotify to show what you're listening to
        </p>
        <div className="design-divider" />

        <div className="design-card rounded-none p-8 mt-8">
          {connected ? (
            <div className="text-center">
              <p className="text-4xl mb-4">🎵</p>
              <h2 className="text-headline mb-4">Spotify Connected!</h2>
              {lastPlayed && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">Last played:</p>
                  <p className="text-lg font-bold">{lastPlayed.song}</p>
                  <p className="text-sm text-gray-600">{lastPlayed.artist}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(lastPlayed.played_at).toLocaleString()}
                  </p>
                </div>
              )}
              <button
                onClick={handleDisconnect}
                className="design-button bg-red-600 hover:bg-red-700"
              >
                Disconnect Spotify
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-4xl mb-4">🎵</p>
              <h2 className="text-headline mb-4">Connect Spotify</h2>
              <p className="text-body mb-6">
                Link your Spotify account to show your listening activity on the homepage. Only you (Dan) can connect - visitors will see your activity.
              </p>
              <button
                onClick={handleSpotifyLogin}
                className="design-button bg-green-600 hover:bg-green-700"
              >
                Connect Spotify
              </button>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <Link href="/admin" className="design-nav-link">
            ← Back to Admin
          </Link>
        </div>
      </div>
    </div>
  )
}
