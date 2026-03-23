'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  status?: 'draft' | 'published'
  unlisted?: boolean
  created_at: string
}

export default function MyEntriesPage() {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null)
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts' | 'unlisted'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [previewEntry, setPreviewEntry] = useState<DiaryEntry | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editPhotoUrls, setEditPhotoUrls] = useState<string[]>([])
  const [editVideoUrls, setEditVideoUrls] = useState<string[]>([])
  const [editSpotifyUrls, setEditSpotifyUrls] = useState<string[]>([])
  const [editStatus, setEditStatus] = useState<'draft' | 'published'>('draft')
  const [uploading, setUploading] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/login')
        return
      }
      setAuthUser({ id: user.id, email: user.email || '' })
      loadEntries(user.id)
    })
  }, [router])

  const loadEntries = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (error) throw error
      setEntries(data || [])
    } catch (err) {
      console.error('Failed to load entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    
    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      setEntries(entries.filter(e => e.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
    }
  }

  const handleEdit = (entry: DiaryEntry) => {
    // Redirect to edit form with entry ID
    router.push(`/admin/write?edit=${entry.id}`)
  }

  const handlePreview = (entry: DiaryEntry) => {
    setEditingId(null) // Close edit modal first
    setPreviewEntry(entry)
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    
    try {
      const { error } = await supabase
        .from('diary_entries')
        .update({ 
          title: editTitle,
          content: editContent,
          photo_urls: editPhotoUrls,
          video_urls: editVideoUrls,
          spotify_urls: editSpotifyUrls,
          status: editStatus,
        })
        .eq('id', editingId)
      
      if (error) throw error
      setEntries(entries.map(e => e.id === editingId ? { 
        ...e, 
        title: editTitle,
        content: editContent,
        photo_urls: editPhotoUrls,
        video_urls: editVideoUrls,
        spotify_urls: editSpotifyUrls,
        status: editStatus,
      } : e))
      setEditingId(null)
    } catch (err) {
      console.error('Failed to update:', err)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    setUploading(true)
    const file = e.target.files[0]
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
      
      setEditPhotoUrls([...editPhotoUrls, publicUrl])
    } catch (err) {
      console.error('Failed to upload photo:', err)
    } finally {
      setUploading(false)
      if (photoInputRef.current) photoInputRef.current.value = ''
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    setUploading(true)
    const file = e.target.files[0]
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
      
      setEditVideoUrls([...editVideoUrls, publicUrl])
    } catch (err) {
      console.error('Failed to upload video:', err)
    } finally {
      setUploading(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto py-20">
          <p className="text-gray-600 text-center">Loading...</p>
        </div>
      </div>
    )
  }

  if (!authUser) {
    return null
  }

  const filteredEntries = entries.filter(entry => {
    if (activeTab === 'all') return true
    if (activeTab === 'published') return entry.status === 'published' && !entry.unlisted
    if (activeTab === 'drafts') return entry.status === 'draft'
    if (activeTab === 'unlisted') return entry.unlisted === true
    return true
  })

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="display-large mb-2">
              My Entries
            </h1>
            <p className="text-body">
              {authUser.email}
            </p>
          </div>
          <Link href="/admin/write" className="design-button px-6 py-3">
            New Entry
          </Link>
        </div>
        
        {/* Tabs - Compact */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm rounded font-bold uppercase tracking-wider ${
              activeTab === 'all' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({entries.length})
          </button>
          <button
            onClick={() => setActiveTab('published')}
            className={`px-4 py-2 text-sm rounded font-bold uppercase tracking-wider ${
              activeTab === 'published' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Published ({entries.filter(e => e.status === 'published' && !e.unlisted).length})
          </button>
          <button
            onClick={() => setActiveTab('unlisted')}
            className={`px-4 py-2 text-sm rounded font-bold uppercase tracking-wider ${
              activeTab === 'unlisted' ? 'bg-purple-900 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Unlisted ({entries.filter(e => e.unlisted).length})
          </button>
          <button
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2 text-sm rounded font-bold uppercase tracking-wider ${
              activeTab === 'drafts' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Drafts ({entries.filter(e => e.status === 'draft').length})
          </button>
        </div>

        {filteredEntries.length === 0 ? (
          <div className="design-card rounded-none p-8 text-center">
            <p className="text-gray-600">
              {activeTab === 'drafts' ? 'No drafts yet.' : 
               activeTab === 'published' ? 'No published entries yet.' : 
               'No entries yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEntries.map(entry => (
              <div
                key={entry.id}
                className="design-card rounded-none p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Thumbnail or placeholder */}
                  {entry.photo_urls?.length ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={entry.photo_urls[0]}
                      alt=""
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-xl">
                      {entry.status === 'published' ? '💜' : '💚'}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        entry.status === 'published' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {entry.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                      {entry.unlisted && (
                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-900 text-white">
                          Unlisted
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(entry.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {entry.title ? (
                      <h3 className="text-sm font-bold truncate">
                        {entry.title}
                      </h3>
                    ) : (
                      <p className="text-sm text-gray-500 truncate">
                        {entry.content?.slice(0, 50) || 'Untitled'}...
                      </p>
                    )}
                    <div className="flex gap-3 mt-1 text-xs text-gray-500">
                      {entry.photo_urls?.length ? (
                        <span>📸 {entry.photo_urls.length}</span>
                      ) : null}
                      {entry.video_urls?.length ? (
                        <span>🎥 {entry.video_urls.length}</span>
                      ) : null}
                      {entry.spotify_urls?.length ? (
                        <span>🎵 {entry.spotify_urls.length}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pl-4">
                  {entry.status === 'published' ? (
                    <>
                      <button
                        onClick={() => {
                          window.open(`/entry/${entry.id}`, '_blank')
                        }}
                        className="text-xs font-bold uppercase tracking-wider hover:text-black"
                      >
                        View Entry
                      </button>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/entry/${entry.id}`
                          navigator.clipboard.writeText(url)
                          alert('Link copied to clipboard!')
                        }}
                        className="text-xs font-bold uppercase tracking-wider text-purple-700 hover:text-purple-800"
                      >
                        Copy Link
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handlePreview(entry)}
                      className="text-xs font-bold uppercase tracking-wider hover:text-black"
                    >
                      Preview
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(entry)}
                    className="text-xs font-bold uppercase tracking-wider hover:text-black"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal - Instance Preview (not published page) */}
        {previewEntry && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="display-large mb-4">Preview</h2>
              
              <div className="design-card rounded-none p-6 space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Date
                  </p>
                  <p className="text-body">
                    {new Date(previewEntry.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                
                {previewEntry.title && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Title
                    </p>
                    <h3 className="text-headline">{previewEntry.title}</h3>
                  </div>
                )}
                
                {previewEntry.content && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Content
                    </p>
                    <p className="text-body whitespace-pre-wrap">{previewEntry.content}</p>
                  </div>
                )}
                
                {previewEntry.photo_urls?.length ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                      📸 Photos ({previewEntry.photo_urls.length})
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {previewEntry.photo_urls.map((url, i) => (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          key={i}
                          src={url}
                          alt=""
                          className="w-full aspect-[4/5] object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
                
                {previewEntry.spotify_urls?.length ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                      🎵 Songs ({previewEntry.spotify_urls.length})
                    </p>
                    <div className="space-y-4">
                      {previewEntry.spotify_urls.map((url, i) => {
                        const embedUrl = getSpotifyEmbedUrl(url)
                        if (embedUrl) {
                          return (
                            <iframe
                              key={i}
                              src={embedUrl}
                              width="100%"
                              height="152"
                              frameBorder="0"
                              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                              loading="lazy"
                              className="rounded-lg"
                            />
                          )
                        }
                        return (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-body underline"
                          >
                            Song {i + 1}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                ) : null}
                
                {previewEntry.video_urls?.length ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                      🎥 Videos ({previewEntry.video_urls.length})
                    </p>
                    <div className="space-y-2">
                      {previewEntry.video_urls.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-body underline"
                        >
                          Video {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setPreviewEntry(null)}
                  className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-300"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setPreviewEntry(null)
                    handleEdit(previewEntry)
                  }}
                  className="flex-1 design-button"
                >
                  Edit This
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-headline mb-4">Edit Entry</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full design-input"
                    placeholder="Entry title"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Content
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full design-input min-h-[150px]"
                    placeholder="Write your entry..."
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as 'draft' | 'published')}
                    className="w-full design-input"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                
                {/* Photo upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Photos ({editPhotoUrls.length})
                  </label>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                    className="w-full text-sm"
                  />
                  {editPhotoUrls.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {editPhotoUrls.map((url, i) => (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <div key={i} className="relative aspect-square">
                          <img src={url} alt="" className="w-full h-full object-cover rounded" />
                          <button
                            onClick={() => setEditPhotoUrls(editPhotoUrls.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Video upload */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Videos ({editVideoUrls.length})
                  </label>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={uploading}
                    className="w-full text-sm"
                  />
                  {editVideoUrls.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {editVideoUrls.map((url, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                          <a href={url} target="_blank" className="text-sm underline">
                            Video {i + 1}
                          </a>
                          <button
                            onClick={() => setEditVideoUrls(editVideoUrls.filter((_, idx) => idx !== i))}
                            className="text-red-600 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Spotify URLs */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Spotify URLs ({editSpotifyUrls.length})
                  </label>
                  <input
                    type="text"
                    value={editSpotifyUrls.join(',')}
                    onChange={(e) => setEditSpotifyUrls(e.target.value.split(',').filter(url => url.trim()))}
                    className="w-full design-input"
                    placeholder="Paste Spotify track/album URLs separated by commas"
                  />
                  {editSpotifyUrls.length > 0 && (
                    <div className="space-y-3 mt-3">
                      {editSpotifyUrls.map((url, i) => {
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
                              onClick={() => setEditSpotifyUrls(editSpotifyUrls.filter((_, idx) => idx !== i))}
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
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingId(null)}
                  className="bg-gray-200 text-gray-700 px-4 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null) // Close edit modal first
                    setPreviewEntry({
                      id: editingId,
                      date: editTitle ? editTitle : entries.find(e => e.id === editingId)?.date || '',
                      title: editTitle,
                      content: editContent,
                      photo_urls: editPhotoUrls,
                      video_urls: editVideoUrls,
                      spotify_urls: editSpotifyUrls,
                      status: editStatus,
                      created_at: entries.find(e => e.id === editingId)?.created_at || '',
                    })
                  }}
                  disabled={uploading}
                  className="bg-gray-800 text-white px-4 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-900 text-sm"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditStatus('draft')
                    handleSaveEdit()
                  }}
                  disabled={uploading}
                  className="bg-gray-200 text-gray-700 px-4 py-3 rounded font-bold uppercase tracking-wider hover:bg-gray-300 text-sm"
                  title="Unpublish - hides from calendar"
                >
                  Unpublish
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditStatus('published')
                    handleSaveEdit()
                  }}
                  disabled={uploading}
                  className="flex-1 design-button disabled:opacity-50 text-sm"
                >
                  {uploading ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
