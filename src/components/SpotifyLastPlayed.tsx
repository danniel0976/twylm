'use client'

import { useState, useEffect } from 'react'

interface SpotifyTrack {
  song: string
  artist: string
  album: string
  image: string
  external_url: string
  played_at: string
  is_playing?: boolean
}

export default function SpotifyLastPlayed() {
  const [track, setTrack] = useState<SpotifyTrack | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSpotifyTrack()
  }, [])

  const fetchSpotifyTrack = async () => {
    try {
      // Fetch from server API (uses Dan's Supabase-stored tokens, not visitor's localStorage)
      const response = await fetch('/api/spotify/track')
      
      if (!response.ok) {
        setLoading(false)
        return
      }
      
      const data = await response.json()
      
      if (data && data.song) {
        setTrack({
          song: data.song,
          artist: data.artist,
          album: data.album,
          image: data.image,
          external_url: data.external_url,
          played_at: data.played_at || new Date().toISOString(),
          is_playing: data.is_playing || false,
        })
      }
    } catch (err) {
      console.error('Spotify fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const response = await fetch('/api/spotify/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Refresh failed:', errorData)
        setNeedsAuth(true)
        return
      }
      
      const data = await response.json()
      
      // Store new tokens
      localStorage.setItem('spotify_access_token', data.access_token)
      localStorage.setItem('spotify_token_expiry', Date.now() + data.expires_in * 1000)
      if (data.refresh_token) {
        localStorage.setItem('spotify_refresh_token', data.refresh_token)
      }
      
      // Retry fetching track
      await fetchSpotifyTrack()
    } catch (err) {
      console.error('Token refresh error:', err)
      setNeedsAuth(true)
    }
  }

  const handleSpotifyLogin = () => {
    // PKCE: Generate code verifier and challenge
    const array = new Uint32Array(28)
    window.crypto.getRandomValues(array)
    const codeVerifier = Array.from(array, dec => ('0' + dec.toString(16)).slice(-4)).join('')
    
    // Store verifier for callback
    localStorage.setItem('spotify_code_verifier', codeVerifier)
    
    // SHA256 hash for challenge
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    crypto.subtle.digest('SHA-256', data).then(buffer => {
      const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
      
      // Redirect to Spotify OAuth with PKCE
      const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID
      const redirectUri = encodeURIComponent('https://www.lovelikenotomorrow.com/spotify/callback')
      const scope = encodeURIComponent('user-read-recently-played user-read-currently-playing')
      const state = btoa(Math.random().toString(36).substring(7))
      
      localStorage.setItem('spotify_state', state)
      
      const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`
      window.location.href = authUrl
    })
  }

  if (loading) {
    return null
  }

  if (needsAuth) {
    return (
      <button
        onClick={handleSpotifyLogin}
        className="flex items-center gap-3 px-6 py-4 rounded-full bg-green-500 text-white hover:bg-green-600"
      >
        <span className="font-bold">Connect Spotify</span>
      </button>
    )
  }

  if (!track) {
    return null
  }

  // Show on mobile with responsive sizing
  return (
    <a
      href={track.external_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 sm:px-6 sm:py-4 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100"
    >
      {track.image && (
        <img
          src={track.image}
          alt={track.album}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover"
        />
      )}
      <div className="text-left">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Dan is playing
        </p>
        <p className="text-sm font-bold truncate max-w-[150px] sm:max-w-[200px]">
          {track.song} - {track.artist}
        </p>
        <p className="text-xs text-gray-400 mt-1 hidden sm:block">
          {new Date(track.played_at).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
      </div>
    </a>
  )
}
