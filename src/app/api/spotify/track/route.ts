import { NextResponse } from 'next/server'

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPITTER_CLIENT_SECRET
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:3000'

const headers = {
  Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
}

export async function GET() {
  try {
    const token = await getAccessToken()
    
    if (!token) {
      return NextResponse.json({ error: 'No Spotify token' }, { status: 401 })
    }
    
    // Get recently played tracks
    const recentlyPlayed = await fetch(
      'https://api.spotify.com/v1/me/player/recently-played?limit=1',
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
        preview_url: track.preview_url,
        external_url: track.external_urls.spotify,
        played_at: data.items[0].played_at,
      })
    }
    
    // If no recently played, try currently playing
    const currentlyPlaying = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
    
    if (currentlyPlaying.ok && currentlyPlaying.status !== 204) {
      const data = await currentlyPlaying.json()
      if (data && data.item) {
        return NextResponse.json({
          song: data.item.name,
          artist: data.item.artists.map((a: any) => a.name).join(', '),
          album: data.item.album.name,
          image: data.item.album.images[0]?.url,
          preview_url: data.item.preview_url,
          external_url: data.item.external_urls.spotify,
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

async function getAccessToken() {
  // Note: Client credentials flow doesn't support user endpoints
  // For recently-played and currently-playing, need OAuth PKCE flow
  // This requires user to authorize the app once
  
  // For now, return null - frontend will handle OAuth
  return null
}
