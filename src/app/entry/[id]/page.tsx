'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Header from '@/components/Header'

interface DiaryEntry {
  id: string
  date: string
  title?: string
  content?: string
  photo_urls?: string[]
  video_urls?: string[]
  spotify_urls?: string[]
  user_name?: string
  user_id?: string
  created_at: string
}

export default function EntryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const entryId = params.id as string
  const [entry, setEntry] = useState<DiaryEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [authUser, setAuthUser] = useState<{ id: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(user)
    })
  }, [])

  useEffect(() => {
    if (!entryId) return
    
    const loadEntry = async () => {
      try {
        const { data: entryData, error: entryError } = await supabase
          .from('diary_entries')
          .select('*')
          .eq('id', entryId)
          .single()
        
        if (entryError) throw entryError
        
        let userName: string | undefined
        if (entryData) {
          const { data: userData } = await supabase
            .from('users')
            .select('name')
            .eq('id', entryData.user_id)
            .single()
          userName = userData?.name || undefined
        }
        
        if (entryData) {
          setEntry({
            ...entryData,
            user_name: userName,
            user_id: entryData.user_id
          })
        }
      } catch (err) {
        console.error('Failed to load entry:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadEntry()
  }, [entryId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto py-20">
          <p className="text-gray-600 text-center">Loading entry...</p>
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto py-20">
          <div className="design-card rounded-none p-8 text-center">
            <p className="text-gray-600 mb-4">Entry not found</p>
            <Link
              href="/"
              className="inline-block design-button px-6 py-3"
            >
              Back to Calendar
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Extract Spotify track/playlist ID from URL
  const getSpotifyId = (url: string) => {
    const match = url.match(/open\.spotify\.com\/(?:track|playlist|album|artist)\/([a-zA-Z0-9]+)/)
    return match ? match[1] : null
  }

  // Convert Spotify URL to embed URL
  const getSpotifyEmbedUrl = (url: string) => {
    const id = getSpotifyId(url)
    if (!id) return null
    if (url.includes('track')) return `https://open.spotify.com/embed/track/${id}`
    if (url.includes('playlist')) return `https://open.spotify.com/embed/playlist/${id}`
    if (url.includes('album')) return `https://open.spotify.com/embed/album/${id}`
    if (url.includes('artist')) return `https://open.spotify.com/embed/artist/${id}`
    return null
  }

  const handleEdit = () => {
    router.push(`/admin/write?edit=${entry.id}`)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this entry?')) return
    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', entry.id)
      if (error) throw error
      router.push('/')
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete entry')
    }
  }

  const canEdit = authUser && entry.user_id === authUser.id

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="design-card rounded-none p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">
              {entry.user_name === 'Luke' ? '💜' : '💚'}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {entry.user_name || 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">
                {new Date(entry.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {entry.title && (
            <h1 className="display-large mb-6">
              {entry.title}
            </h1>
          )}

          <div className="design-divider" />

          <div className="mt-6">
            <p className="text-body leading-relaxed whitespace-pre-wrap">
              {entry.content}
            </p>
          </div>

          {/* Content Section */}
          <div className="design-divider my-8" />

          {/* Photos Section - 4:5 Cards */}
          {entry.photo_urls?.length ? (
            <div className="mb-12">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">
                📸 Photos
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {entry.photo_urls.map((url, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={i}
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="w-full aspect-[4/5] object-cover rounded-lg shadow-lg"
                  />
                ))}
              </div>
            </div>
          ) : null}

          {/* Spotify Section - Smaller Embed */}
          {entry.spotify_urls?.length ? (
            <div className="mb-12">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">
                🎵 Song of the Day
              </p>
              <div className="max-w-md space-y-6">
                {entry.spotify_urls.map((url, i) => {
                  const embedUrl = getSpotifyEmbedUrl(url)
                  return embedUrl ? (
                    <div key={i} className="rounded-lg overflow-hidden bg-black shadow-lg">
                      <iframe
                        src={embedUrl}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-body hover:text-black underline"
                    >
                      Song {i + 1} →
                    </a>
                  )
                })}
              </div>
            </div>
          ) : null}

          {/* Videos Section */}
          {entry.video_urls?.length ? (
            <div className="mb-12">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-6">
                🎥 Videos
              </p>
              <div className="space-y-4">
                {entry.video_urls.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-body hover:text-black underline"
                  >
                    Video {i + 1} →
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {/* Edit/Delete buttons - only show if user owns this entry */}
          {canEdit && (
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleEdit}
                className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded hover:bg-gray-300 font-bold uppercase tracking-wider"
              >
                Edit Entry
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-500 text-white px-6 py-3 rounded hover:bg-red-600 font-bold uppercase tracking-wider"
              >
                Delete Entry
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
