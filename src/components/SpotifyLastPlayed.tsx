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
    const fetchSpotifyTrack = async () => {
      try {
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

    fetchSpotifyTrack()
  }, [])

  if (loading || !track) {
    return null
  }

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
      </div>
    </a>
  )
}
