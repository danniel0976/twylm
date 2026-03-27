'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Header from '@/components/Header'
import imageCompression from 'browser-image-compression'

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
  const [featured, setFeatured] = useState(false)
  const [entriesForDate, setEntriesForDate] = useState<Array<{id: string, title?: string, status: string, featured: boolean}>>([])
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
      
      const urlParams = new URLSearchParams(window.location.search)
      const editId = urlParams.get('edit')
      if (editId) {
        setEditingId(editId)
        loadEntryForEdit(editId)
      }
    })
  }, [router])

  useEffect(() => {
    if (authUser && date) {
      loadEntriesForDate(date)
    }
  }, [date, authUser])

  const loadEntriesForDate = async (selectedDate: string) => {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('id, title, status, featured')
        .eq('user_id', authUser!.id)
        .eq('date', selectedDate)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      setEntriesForDate(data || [])
      
      if (editingId) {
        const currentEntry = data?.find(e => e.id === editingId)
        setFeatured(currentEntry?.featured || false)
      } else if (data && data.length > 0) {
        setFeatured(false)
      } else {
        setFeatured(true)
      }
    } catch (err) {
      console.error('Failed to load entries for date:', err)
    }
  }

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
        setFeatured(data.featured || false)
      }
    } catch (err) {
      console.error('Failed to load entry for edit:', err)
    }
  }

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
      const allVideoUrls = [...videoFileUrls, ...youtubeUrls]
      const slug = title ? generateSlug(title) : null
      
      if (editingId) {
        // First, unset featured on all other entries for this date
        if (featured) {
          await supabase
            .from('diary_entries')
            .update({ featured: false })
            .eq('user_id', authUser.id)
            .eq('date', date)
            .neq('id', editingId)
        }
        
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
            featured,
          })
          .eq('id', editingId)
          .select()
          .single()
        
        data = result.data
        error = result.error
      } else {
        // For new entries, first unset featured on others if this one should be featured
        if (featured) {
          await supabase
            .from('diary_entries')
            .update({ featured: false })
            .eq('user_id', authUser.id)
            .eq('date', date)
        }
        
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
            featured,
          })
          .select()
          .single()
        
        data = result.data
        error = result.error
        
        if (data) {
          setEditingId(data.id)
        }
      }

      if (error) {
        console.error('Save error:', error)
        throw error
      }

      setMessage(saveStatus === 'draft' ? 'Draft saved! 💙' : 'Entry published! 💜')
      
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
    const originalSize = (file.size / 1024 / 1024).toFixed(2)
    setMessage(`Compressing: ${file.name} (${originalSize} MB)...`)
    
    try {
      // Compression options
      const options = {
        maxSizeMB: 0.5,           // Target max 500KB
        maxWidthOrHeight: 1200,   // Resize if larger than 1200px
        useWebWorker: true,       // Use web worker for better performance
        fileType: 'image/jpeg',   // Convert to JPEG for better compression
      }
      
      // Compress the image
      const compressedFile = await imageCompression(file, options)
      const compressedSize = (compressedFile.size / 1024 / 1024).toFixed(2)
      setMessage(`Uploading: ${file.name} (${originalSize} MB → ${compressedSize} MB)...`)
      
      const fileExt = 'jpg'
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('diary-photos')
        .upload(fileName, compressedFile)
      
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage
        .from('diary-photos')
        .getPublicUrl(fileName)
      
      setPhotoUrls([...photoUrls, publicUrl])
      setMessage(`✅ Photo uploaded! (${originalSize} MB → ${compressedSize} MB)`)
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
      
      setVideoFileUrls([...videoFileUrls, publicUrl])
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
    setVideoFileUrls(videoFileUrls.filter((_, idx) => idx !== i))
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

            {entriesForDate.length > 0 && (
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                  🌟 Featured Entry
                </label>
                <div className="design-card rounded-none p-4 bg-gray-50">
                  <p className="text-xs text-gray-600 mb-3">
                    {entriesForDate.length} entr{entriesForDate.length === 1 ? 'y' : 'ies'} for this date. Choose which one shows on calendar, or none.
                  </p>
                  <div className="space-y-2">
                    {/* None option */}
                    <label className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer">
                      <input
                        type="radio"
                        name="featured"
                        value="none"
                        checked={!featured}
                        onChange={async () => {
                          setFeatured(false)
                          await supabase
                            .from('diary_entries')
                            .update({ featured: false })
                            .eq('user_id', authUser!.id)
                            .eq('date', date)
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        None (hide all entries for this date from calendar)
                      </span>
                    </label>
                    {/* Entry options */}
                    {entriesForDate.map(entry => (
                      <label key={entry.id} className="flex items-center gap-3 p-2 rounded hover:bg-white cursor-pointer">
                        <input
                          type="radio"
                          name="featured"
                          value={entry.id}
                          checked={entry.id === editingId ? featured : false}
                          onChange={async () => {
                            if (entry.id === editingId) {
                              setFeatured(true)
                            }
                            await supabase
                              .from('diary_entries')
                              .update({ featured: false })
                              .eq('user_id', authUser!.id)
                              .eq('date', date)
                              .neq('id', entry.id)
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">
                          {entry.title || `Entry on ${date}`}
                          <span className="text-xs text-gray-500 ml-2">({entry.status})</span>
                        </span>
                        {entry.featured && entry.id !== editingId && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                            Currently Featured
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                  Visibility
                </label>
                <select
                  value={unlisted ? 'unlisted' : 'listed'}
                  onChange={(e) => setUnlisted(e.target.value === 'unlisted')}
                  className="w-full design-input"
                >
                  <option value="listed">Listed (shows on calendar if featured)</option>
                  <option value="unlisted">Unlisted (hidden from calendar, direct link works)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                  className="w-full design-input"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-blue-50 text-blue-800 text-sm rounded mb-4">
              <p className="font-bold mb-1">📌 Featured Entry Rules:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Only <strong>published</strong> entries can be featured</li>
                <li>If unlisted, entry won't show on calendar even if featured</li>
                <li>Only ONE entry per date can be featured</li>
              </ul>
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

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={async () => {
                  setStatus('draft')
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
