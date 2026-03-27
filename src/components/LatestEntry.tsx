'use client'

import Link from 'next/link'

interface DiaryEntry {
  id: string
  date: string
  title?: string
  slug?: string
  content?: string
  photo_urls?: string[]
  video_urls?: string[]
  spotify_urls?: string[]
  user_name?: string
  created_at: string
}

interface TodaysEntryProps {
  entries: Record<string, DiaryEntry>
}

export default function LatestEntry({ entries }: TodaysEntryProps) {
  // Find the latest entry by created_at timestamp
  const entryArray = Object.values(entries)
  
  if (entryArray.length === 0) {
    return null // No entries at all, don't show the section
  }
  
  // Sort by created_at descending and get the most recent
  const latestEntry = entryArray.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })[0]
  
  if (!latestEntry) {
    return null
  }

  // Check if there's a dual entry situation (Dan + Luke same date)
  const dateKey = latestEntry.date
  const danEntry = entries[dateKey]
  const lukeEntry = entries[dateKey + '_luke']
  const entry = danEntry || lukeEntry
  const hasBothEntries = danEntry && lukeEntry

  // Helper functions for counting media
  const getVideoCounts = (urls: string[] = []) => {
    const youtubeUrls = urls.filter(u => u.includes('youtube.com') || u.includes('youtu.be'))
    const fileUrls = urls.filter(u => !u.includes('youtube.com') && !u.includes('youtu.be'))
    return { youtubeUrls, fileUrls }
  }

  const { youtubeUrls, fileUrls } = getVideoCounts(entry.video_urls)

  return (
    <div className="md:hidden mb-12">
      <div className="design-card rounded-none overflow-hidden">
        {/* Hero Thumbnail */}
        {entry.photo_urls?.length ? (
          <div className="relative aspect-[4/5] bg-gray-900 rounded-t-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={entry.photo_urls[0]}
              alt="Today's entry"
              className="w-full h-full object-cover rounded-t-none"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="500"%3E%3Crect fill="%23ddd" width="400" height="500"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E'
              }}
            />
            {/* Heart indicator */}
            <div className="absolute top-4 right-4 z-10 text-3xl drop-shadow-lg">
              {hasBothEntries ? (
                <span>💚💜</span>
              ) : entry.user_name?.toLowerCase() === 'luke' ? (
                <span>💜</span>
              ) : (
                <span>💚</span>
              )}
            </div>
            {/* Photo count if multiple */}
            {entry.photo_urls.length > 1 && (
              <div className="absolute top-4 left-4 z-10 text-sm font-bold text-white drop-shadow-lg bg-black/50 px-3 py-1 rounded">
                📸 {entry.photo_urls.length}
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-[4/5] bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center rounded-t-none">
            <div className="text-6xl">
              {entry.user_name?.toLowerCase() === 'luke' ? '💜' : '💚'}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Date & Author */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">
              {entry.user_name?.toLowerCase() === 'luke' ? '💜' : '💚'}
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Latest Entry
              </p>
              <p className="text-sm text-gray-600">
                {entry.user_name || 'Unknown'} • {new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Title */}
          {entry.title && (
            <h2 className="text-2xl font-bold mb-4">{entry.title}</h2>
          )}

          {/* Media Indicators */}
          <div className="flex flex-wrap gap-3 mb-4">
            {(entry.photo_urls?.length || 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-gray-600 bg-gray-100 px-3 py-1 rounded">
                📸 {entry.photo_urls!.length} photo{(entry.photo_urls!.length || 0) > 1 ? 's' : ''}
              </span>
            )}
            {fileUrls.length > 0 && (
              <span className="inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-gray-600 bg-gray-100 px-3 py-1 rounded">
                🎥 {fileUrls.length} video{fileUrls.length > 1 ? 's' : ''}
              </span>
            )}
            {youtubeUrls.length > 0 && (
              <span className="inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-gray-600 bg-gray-100 px-3 py-1 rounded">
                🎬 {youtubeUrls.length} video of the day{youtubeUrls.length > 1 ? 's' : ''}
              </span>
            )}
            {(entry.spotify_urls?.length || 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-gray-600 bg-gray-100 px-3 py-1 rounded">
                🎵 {entry.spotify_urls!.length} song{(entry.spotify_urls!.length || 0) > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3">
            <Link
              href={`/entry/${entry.slug || entry.id}`}
              className="flex-1 text-center text-sm font-bold uppercase tracking-wider bg-black text-white px-6 py-3 rounded hover:bg-gray-800"
            >
              Read Full Entry
            </Link>
            {lukeEntry && danEntry && (
              <Link
                href={`/entry/${lukeEntry.slug || lukeEntry.id}`}
                className="text-center text-sm font-bold uppercase tracking-wider bg-purple-900 text-white px-6 py-3 rounded hover:bg-purple-800"
              >
                Luke's 💜
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
