'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Header from '@/components/Header'

export default function AdminPage() {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<{ id: string } | null>(null)
  const [date, setDate] = useState('2026-03-15')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [videoFileUrls, setVideoFileUrls] = useState<string[]>([])
  const [youtubeUrls, setYoutubeUrls] = useState<string[]>([])
  const [spotifyUrls, setSpotifyUrls] = useState<string[]>([])
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [unlisted, setUnlisted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      setAuthUser(user)
      
      // Check if editing existing entry
      const urlParams = new URLSearchParams(window.location.search)
      const editId = urlParams.get('edit')
      if (editId) {
        setEditingId(editId)
        loadEntryForEdit(editId)
      }
      // If no editId, it's a new entry (keep form blank)
    })
  }, [router])

  const loadEntryForEdit = async (entryId: string) => {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('id', entryId)
        .single()
      
      if (error) throw error
      
      if (data) {
        setDate(data.date)
        setTitle(data.title || '')
        setContent(data.content || '')
        setPhotoUrls(data.photo_urls || [])
        setVideoFileUrls((data.video_urls || []).filter(u => !u.includes('youtube.com') && !u.includes('youtu.be')))
        setYoutubeUrls((data.video_urls || []).filter(u => u.includes('youtube.com') || u.includes('youtu.be')))
        setSpotifyUrls(data.spotify_urls || [])
        setStatus(data.status || 'draft')
        setUnlisted(data.unlisted || false)
      }
    } catch (err) {
      console.error('Failed to load entry for edit:', err)
    }
  }

  // Generate slug from title (e.g., "The Way You Sound" → "the-way-you-sound")
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleSaveWithStatus(status)
  }

  const handleSaveWithStatus = async (saveStatus: 'draft' | 'published') => {
    setLoading(true)
    setMessage(null)

    if (!authUser) {
      setMessage('Not authenticated')
      setLoading(false)
      return
    }

    try {
      let data, error
      
      // Combine video files and YouTube URLs into single array for DB
      const allVideoUrls = [...videoFileUrls, ...youtubeUrls]
      
      // Generate slug from title
      const slug = title ? generateSlug(title) : null
      
      if (editingId) {
        // Update existing entry by ID
        const result = await supabase
          .from('diary_entries')
          .update({
            date,
            title,
            slug,
            content,
            photo_urls: photoUrls,
            video_urls: allVideoUrls,
            spotify_urls: spotifyUrls,
            status: saveStatus,
            unlisted,
          })
          .eq('id', editingId)
          .select()
          .single()
        
        data = result.data
        error = result.error
      } else {
        // Create new entry (upsert by user_id + date)
        const result = await supabase
          .from('diary_entries')
          .upsert({
            user_id: authUser.id,
            date,
            title,
            slug,
            content,
            photo_urls: photoUrls,
            video_urls: allVideoUrls,
            spotify_urls: spotifyUrls,
            status: saveStatus,
            unlisted,
          })
          .select()
          .single()
        
        data = result.data
        error = result.error
        
        // Set editing ID for new entry
        if (data) {
          setEditingId(data.id)
        }
      }

      if (error) throw error

      setMessage(saveStatus === 'draft' ? 'Draft saved! 💙' : 'Entry published! 💜')
      
      // Redirect to my-entries after publishing
      if (saveStatus === 'published') {
        setTimeout(() => {
          router.push('/my-entries')
        }, 1000)
        return
      }
      
      setTitle('')
      setContent('')
      setPhotoUrls([])
      setVideoFileUrls([])
      setYoutubeUrls([])
      setSpotifyUrls([])
      setStatus('draft')
    } catch (err) {
      setMessage('Failed to save: ' + ((err as Error).message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setMessage('No file selected')
      return
    }
    
    setUploading(true)
    const file = e.target.files[0]
    setMessage(`Uploading: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`)
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('diary-photos')
        .upload(fileName, file)
      
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('diary-photos')
        .getPublicUrl(fileName)
      
      setPhotoUrls([...photoUrls, publicUrl])
      setMessage('✅ Photo uploaded!')
    } catch (err) {
      setMessage(`❌ Failed: ${(err as Error).message}`)
    } finally {
      setUploading(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setMessage('No file selected')
      return
    }
    
    setUploading(true)
    const file = e.target.files[0]
    setMessage(`Uploading: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
    
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
    
    try {
      const { error: uploadError } = await supabase.storage
        .from('diary-videos')
        .upload(fileName, file)
      
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('diary-videos')
        .getPublicUrl(fileName)
      
      setVideoUrls([...videoUrls, publicUrl])
      setMessage('✅ Video uploaded!')
    } catch (err) {
      setMessage(`❌ Failed: ${(err as Error).message}`)
    } finally {
      setUploading(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  const removePhoto = (i: number) => {
    setPhotoUrls(photoUrls.filter((_, idx) => idx !== i))
  }

  const removeVideo = (i: number) => {
    setVideoUrls(videoUrls.filter((_, idx) => idx !== i))
  }

  const getSpotifyEmbedUrl = (url: string) => {
    if (!url) return null
    if (url.includes('open.spotify.com/embed')) return url
    const trackMatch = url.match(/spotify\.com\/(?:intl\/[a-z-]+\/)?(?:track|album)\/([a-zA-Z0-9]+)/)
    if (trackMatch) {
      return `https://open.spotify.com/embed/track/${trackMatch[1]}`
    }
    return null
  }

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
      /youtu\.be\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return `https://www.youtube.com/embed/${match[1]}`
    }
    return null
  }

  if (!authUser) {
    return (
      <div className="min-h-screen bg-white">
        <nav className="design-nav px-6 py-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="text-sm font-bold tracking-tight">TWYLM</div>
            <Link href="/" className="design-nav-link">
              Calendar
            </Link>
          </div>
        </nav>
        <div className="max-w-2xl mx-auto py-20">
          <p className="text-gray-600 text-center">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-20">
        <h1 className="display-large mb-2">
          {editingId ? 'Edit Entry' : 'Write Your Entry'}
        </h1>
        <p className="text-body mb-8">
          Capture your memories, one day at a time
        </p>
        <div className="design-divider" />

        {message && (
          <div className={`p-4 text-center mt-6 ${
            message.includes('Failed') 
              ? 'bg-red-50 text-red-700' 
              : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="design-card rounded-none p-8 mt-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min="2026-03-12"
                max="2026-04-09"
                required
                className="w-full design-input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The day we met"
                className="w-full design-input"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                Your words *
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tell him what you're feeling..."
                rows={8}
                required
                className="w-full design-input resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                📷 Photos
              </label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploading}
                className="w-full text-sm"
              />
              {photoUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {photoUrls.map((url, i) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <div key={i} className="relative aspect-square">
                      <img src={url} alt="" className="w-full h-full object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                🎥 Videos
              </label>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                disabled={uploading}
                className="w-full text-sm"
              />
              {videoFileUrls.length > 0 && (
                <div className="space-y-2 mt-2">
                  {videoFileUrls.map((url, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                      <a href={url} target="_blank" className="text-sm underline">
                        Video {i + 1}
                      </a>
                      <button
                        type="button"
                        onClick={() => setVideoFileUrls(videoFileUrls.filter((_, idx) => idx !== i))}
                        className="text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                🎬 Video of the Day
              </label>
              <input
                type="text"
                value={youtubeUrls.join(',')}
                onChange={(e) => setYoutubeUrls(e.target.value.split(',').filter(url => url.trim()))}
                placeholder="Paste YouTube URLs separated by commas"
                className="w-full design-input"
              />
              {youtubeUrls.length > 0 && (
                <div className="space-y-3 mt-3">
                  {youtubeUrls.map((url, i) => {
                    const embedUrl = getYouTubeEmbedUrl(url)
                    if (embedUrl) {
                      return (
                        <div key={i} className="rounded-lg overflow-hidden bg-black">
                          <iframe
                            src={embedUrl}
                            width="100%"
                            height="315"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            loading="lazy"
                          />
                        </div>
                      )
                    }
                    return (
                      <div key={i} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <a href={url} target="_blank" className="text-sm underline">
                          Video {i + 1}
                        </a>
                        <button
                          type="button"
                          onClick={() => setYoutubeUrls(youtubeUrls.filter((_, idx) => idx !== i))}
                          className="text-red-600 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                Spotify URLs
              </label>
              <input
                type="text"
                value={spotifyUrls.join(',')}
                onChange={(e) => setSpotifyUrls(e.target.value.split(',').filter(url => url.trim()))}
                placeholder="Paste Spotify track/album URLs separated by commas"
                className="w-full design-input"
              />
              {spotifyUrls.length > 0 && (
                <div className="space-y-3 mt-3">
                  {spotifyUrls.map((url, i) => {
                    const embedUrl = getSpotifyEmbedUrl(url)
                    if (embedUrl) {
                      return (
                        <div key={i} className="rounded-lg overflow-hidden bg-black">
                          <iframe
                            src={embedUrl}
                            width="100%"
                            height="152"
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                            loading="lazy"
                          />
                        </div>
                      )
                    }
                    return (
                      <div key={i} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <a href={url} target="_blank" className="text-sm underline">
                          Song {i + 1}
                        </a>
                        <button
                          type="button"
                          onClick={() => setSpotifyUrls(spotifyUrls.filter((_, idx) => idx !== i))}
                          className="text-red-600 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                Visibility
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={unlisted}
                  onChange={(e) => setUnlisted(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span>Unlisted (hidden from calendar, accessible via direct link)</span>
              </label>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={async () => {
                  setStatus('draft')
                  // Wait for state to update, then save with explicit draft status
                  await new Promise(resolve => setTimeout(resolve, 0))
                  handleSaveWithStatus('draft')
                }}
                disabled={loading || !content}
                className="bg-gray-200 text-gray-700 px-4 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-300 disabled:opacity-50 text-sm"
              >
                {loading ? 'Saving...' : 'Save as Draft'}
              </button>
              {editingId && (
                <Link
                  href={`/entry/${editingId}`}
                  target="_blank"
                  className="bg-gray-800 text-white px-4 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-900 disabled:opacity-50 text-sm"
                >
                  Preview
                </Link>
              )}
              <button
                type="submit"
                onClick={() => setStatus('published')}
                disabled={loading || !content}
                className="flex-1 design-button disabled:opacity-50 text-sm"
              >
                {loading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </div>
        </form>

        <div className="flex gap-4 mt-8">
          <Link href="/" className="design-nav-link">
            ← Back to Calendar
          </Link>
        </div>
      </div>
    </div>
  )
}
