import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // Fetch Dan's tokens from Supabase (server-side, not visitor's localStorage)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    )
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const { data: tokensData } = await supabase
      .from('spotify_tokens')
      .select('access_token, refresh_token, token_expiry')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (!tokensData || !tokensData.access_token) {
      return NextResponse.json({ error: 'No Spotify token' }, { status: 401 })
    }
    
    // Check if token expired, refresh if needed
    const now = Date.now()
    const expiry = tokensData.token_expiry ? new Date(tokensData.token_expiry).getTime() : 0
    
    if (expiry && now > expiry && tokensData.refresh_token) {
      // Refresh token
      const refreshed = await refreshSpotifyToken(tokensData.refresh_token)
      if (refreshed) {
        // Update Supabase with new tokens
        await supabase
          .from('spotify_tokens')
          .upsert({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token || tokensData.refresh_token,
            token_expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
            user_id: 'dan' // Dan's tokens
          })
        tokensData.access_token = refreshed.access_token
      }
    }
    
    // Get recently played tracks using Dan's token
    const recentlyPlayed = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=1',
      {
        headers: {
          Authorization: `Bearer ${tokensData.access_token}`,
        },
      }
    )
    
    if (!recentlyPlayed.ok) {
      return NextResponse.json({ error: 'Failed to fetch recently played' }, { status: 500 })
    }
    
    const data = await recentlyPlayed.json()
    
    if (data.items && data.items.length > 0) {
      const track = data.items[0].track
      return NextResponse.json({
        song: track.name,
        artist: track.artists.map((a: any) => a.name).join(', '),
        album: track.album.name,
        image: track.album.images[0]?.url,
        external_url: track.external_urls.spotify,
        played_at: data.items[0].played_at,
      })
    }
    
    // If no recently played, try currently playing
    const currentlyPlaying = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      {
        headers: {
          Authorization: `Bearer ${tokensData.access_token}`,
        },
      }
    )
    
    if (currentlyPlaying.ok && currentlyPlaying.status !== 204) {
      const currentData = await currentlyPlaying.json()
      if (currentData && currentData.item) {
        return NextResponse.json({
          song: currentData.item.name,
          artist: currentData.item.artists.map((a: any) => a.name).join(', '),
          album: currentData.item.album.name,
          image: currentData.item.album.images[0]?.url,
          external_url: currentData.item.external_urls.spotify,
          is_playing: true,
        })
      }
    }
    
    return NextResponse.json({ message: 'No track playing' }, { status: 204 })
  } catch (error) {
    console.error('Spotify API error:', error)
    return NextResponse.json({ error: 'Failed to fetch Spotify data' }, { status: 500 })
  }
}

async function refreshSpotifyToken(refreshToken: string) {
  try {
    const formData = new URLSearchParams()
    formData.append('grant_type', 'refresh_token')
    formData.append('refresh_token', refreshToken)
    formData.append('client_id', process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || '')
    formData.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET || '')

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return {
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: data.refresh_token,
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    return null
  }
}
