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
  const [needsAuth, setNeedsAuth] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSpotifyTrack()
  }, [])

  const fetchSpotifyTrack = async () => {
    const token = localStorage.getItem('spotify_access_token')
    const expiry = localStorage.getItem('spotify_token_expiry')
    
    if (!token || (expiry && Date.now() > parseInt(expiry))) {
      setNeedsAuth(true)
      setLoading(false)
      return
    }
    
    try {
      // Get recently played
      const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.status === 401) {
        setNeedsAuth(true)
        setLoading(false)
        return
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch')
      }
      
      const data = await response.json()
      
      if (data.items && data.items.length > 0) {
        const item = data.items[0]
        setTrack({
          song: item.track.name,
          artist: item.track.artists.map((a: any) => a.name).join(', '),
          album: item.track.album.name,
          image: item.track.album.images[0]?.url,
          external_url: item.track.external_urls.spotify,
          played_at: item.played_at,
          is_playing: false,
        })
      } else {
        // Try currently playing
        const current = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        if (current.ok && current.status !== 204) {
          const currentData = await current.json()
          if (currentData && currentData.item) {
            setTrack({
              song: currentData.item.name,
              artist: currentData.item.artists.map((a: any) => a.name).join(', '),
              album: currentData.item.album.name,
              image: currentData.item.album.images[0]?.url,
              external_url: currentData.item.external_urls.spotify,
              played_at: new Date().toISOString(),
              is_playing: true,
            })
          }
        }
      }
    } catch (err) {
      console.error('Spotify fetch error:', err)
      setError('Failed to load Spotify data')
    } finally {
      setLoading(false)
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
      const redirectUri = encodeURIComponent('http://127.0.0.1:3000/spotify/callback')
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

  if (!track) {
    return null
  }

  return (
    <a
      href={track.external_url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-6 py-4 rounded-full bg-gray-50 border border-gray-200 hover:bg-gray-100"
    >
      {track.image && (
        <img
          src={track.image}
          alt={track.album}
          className="w-10 h-10 rounded object-cover"
        />
      )}
      <div className="text-left">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Dan is playing
        </p>
        <p className="text-sm font-bold truncate max-w-[200px]">
          {track.song} - {track.artist}
        </p>
        <p className="text-xs text-gray-400 mt-1">
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
