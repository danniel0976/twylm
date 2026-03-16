'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
}

interface CalendarProps {
  selectedDate: string | null
  entries: Record<string, DiaryEntry>
  onDateSelect: (date: string | null) => void
}

export default function Calendar({ selectedDate, entries, onDateSelect }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState<'march' | 'april'>('march')
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<Record<string, number>>({})

  // March 12-31, 2026 (starting from last Thursday)
  const marchDates = []
  for (let i = 12; i <= 31; i++) {
    marchDates.push(`2026-03-${String(i).padStart(2, '0')}`)
  }

  // April 1-9, 2026
  const aprilDates = []
  for (let i = 1; i <= 9; i++) {
    aprilDates.push(`2026-04-${String(i).padStart(2, '0')}`)
  }

  // Calculate empty cells for March (March 12 is Thursday = index 5)
  const marchStartDay = new Date('2026-03-12').getDay() // 5 = Thursday
  
  // Calculate empty cells for April (April 1 is Wednesday = index 4)
  const aprilStartDay = new Date('2026-04-01').getDay() // 4 = Wednesday

  const hasEntry = (date: string) => entries[date] !== undefined
  const isToday = (date: string) => {
    const today = new Date()
    const checkDate = new Date(date)
    return today.toDateString() === checkDate.toDateString()
  }
  const isSelected = (date: string) => selectedDate === date

  const getHeartColor = (userName?: string) => {
    if (!userName) return '💙'
    if (userName.toLowerCase() === 'luke') return '💜'
    return '💚'
  }

  const getDayName = (date: string) => {
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { weekday: 'short' })
  }

  // Auto-rotate photos for Luke's entries with multiple photos
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(entries).forEach(date => {
        const entry = entries[date]
        if (entry?.user_name?.toLowerCase() === 'luke' && (entry.photo_urls?.length || 0) > 1) {
          setCurrentPhotoIndex(prev => ({
            ...prev,
            [date]: (prev[date] || 0) + 1 >= (entry.photo_urls?.length || 0) ? 0 : (prev[date] || 0) + 1
          }))
        }
      })
    }, 3000) // Rotate every 3 seconds

    return () => clearInterval(interval)
  }, [entries])

  return (
    <div>
      {/* Month Toggle */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={() => setCurrentMonth('march')}
          className={`px-6 py-3 rounded-full font-semibold transition-all ${
            currentMonth === 'march'
              ? 'bg-black text-white shadow-lg'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          March
        </button>
        <button
          onClick={() => setCurrentMonth('april')}
          className={`px-6 py-3 rounded-full font-semibold transition-all ${
            currentMonth === 'april'
              ? 'bg-black text-white shadow-lg'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          April
        </button>
      </div>

      {/* Calendar Grid - No empty rows, starts from March 12 */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-bold uppercase tracking-wider py-3 text-gray-500">
            {day}
          </div>
        ))}

        {/* March Dates - Empty cells before March 12 (Thursday) */}
        {currentMonth === 'march' && (
          <>
            {/* Empty cells for days before March 12 */}
            {Array.from({ length: marchStartDay }).map((_, i) => (
              <div key={`march-empty-${i}`} className="aspect-square" />
            ))}
            
            {marchDates.map(date => {
              const day = parseInt(date.split('-')[2])
              const has = hasEntry(date)
              const today = isToday(date)
              const selected = isSelected(date)
              const hovered = hoveredDate === date
              const entry = entries[date]
              const dayName = getDayName(date)
              const photoIndex = currentPhotoIndex[date] || 0
              const isLukeMultiPhoto = entry?.user_name?.toLowerCase() === 'luke' && (entry.photo_urls?.length || 0) > 1

              return (
                <div
                  key={date}
                  className="relative aspect-[4/5] p-1 group"
                  onMouseEnter={() => setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <Link
                    href={has ? `/entry/${entry.id}` : '#'}
                    onClick={(e) => {
                      if (!has) e.preventDefault()
                      else onDateSelect(date)
                    }}
                    className={`w-full h-full rounded-lg flex flex-col items-center justify-center transition-all relative design-card overflow-hidden ${
                      selected
                        ? 'bg-black text-white shadow-lg scale-105'
                        : has && entry?.photo_urls?.length
                          ? 'bg-gray-900 hover:bg-gray-800'
                          : has
                            ? 'bg-gray-50 hover:bg-gray-100'
                            : today
                              ? 'bg-gray-100'
                              : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {has && entry?.photo_urls?.length ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={entry.photo_urls[photoIndex]}
                        alt="Entry thumbnail"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle"%3E💚%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    ) : null}
                    
                    {/* Heart indicator at top-right corner */}
                    {has && (
                      <div className="absolute top-2 right-2 z-20 text-lg drop-shadow-lg">
                        {getHeartColor(entry?.user_name)}
                      </div>
                    )}
                    
                    {/* Photo count indicator for multi-photo entries */}
                    {isLukeMultiPhoto && (
                      <div className="absolute top-2 left-2 z-20 text-xs font-bold text-white drop-shadow-lg bg-black/50 px-2 py-1 rounded">
                        {photoIndex + 1}/{entry.photo_urls?.length}
                      </div>
                    )}
                    
                    <div className={`relative z-10 flex flex-col items-center ${
                      has && entry?.photo_urls?.length ? 'text-white drop-shadow-lg' : 'text-gray-900'
                    }`}>
                      <span className="text-xs font-bold uppercase mb-1">{dayName}</span>
                      <span className="text-2xl font-bold">{day}</span>
                    </div>
                  </Link>

                  {/* Hover Bubble - Persistent on hover (tile + bubble) */}
                  {has && entry && (
                    <div
                      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white rounded-xl shadow-2xl p-5 z-50 border border-gray-200 ${
                        hovered ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{getHeartColor(entry.user_name)}</span>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            {entry.user_name || 'Unknown'}
                          </span>
                          <p className="text-sm text-gray-600">{date}</p>
                        </div>
                      </div>
                      
                      {entry.title && (
                        <h3 className="text-lg font-bold mb-2">{entry.title}</h3>
                      )}
                      
                      {/* Photo count indicator */}
                      {(entry.photo_urls?.length || 0) > 0 && (
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                          📸 {entry.photo_urls?.length} photo{(entry.photo_urls?.length || 0) > 1 ? 's' : ''}
                        </p>
                      )}
                      
                      {(entry.video_urls?.length || 0) > 0 && (
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                          🎥 {entry.video_urls?.length} video{(entry.video_urls?.length || 0) > 1 ? 's' : ''}
                        </p>
                      )}
                      
                      {(entry.spotify_urls?.length || 0) > 0 && (
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                          🎵 {entry.spotify_urls?.length} song{(entry.spotify_urls?.length || 0) > 1 ? 's' : ''} of the day
                        </p>
                      )}
                      
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <Link
                          href={`/entry/${entry.id}`}
                          className="block text-center text-sm font-bold uppercase tracking-wider bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                        >
                          View Full Entry
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* April Dates - Empty cells before April 1 (Wednesday) */}
        {currentMonth === 'april' && (
          <>
            {/* Empty cells for days before April 1 */}
            {Array.from({ length: aprilStartDay }).map((_, i) => (
              <div key={`april-empty-${i}`} className="aspect-square" />
            ))}
            
            {aprilDates.map(date => {
              const day = parseInt(date.split('-')[2])
              const has = hasEntry(date)
              const today = isToday(date)
              const selected = isSelected(date)
              const hovered = hoveredDate === date
              const entry = entries[date]
              const dayName = getDayName(date)
              const photoIndex = currentPhotoIndex[date] || 0
              const isLukeMultiPhoto = entry?.user_name?.toLowerCase() === 'luke' && (entry.photo_urls?.length || 0) > 1

              return (
                <div
                  key={date}
                  className="relative aspect-[4/5] p-1 group"
                  onMouseEnter={() => setHoveredDate(date)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  <Link
                    href={has ? `/entry/${entry.id}` : '#'}
                    onClick={(e) => {
                      if (!has) e.preventDefault()
                      else onDateSelect(date)
                    }}
                    className={`w-full h-full rounded-lg flex flex-col items-center justify-center transition-all relative design-card overflow-hidden ${
                      selected
                        ? 'bg-black text-white shadow-lg scale-105'
                        : has && entry?.photo_urls?.length
                          ? 'bg-gray-900 hover:bg-gray-800'
                          : has
                            ? 'bg-gray-50 hover:bg-gray-100'
                            : today
                              ? 'bg-gray-100'
                              : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {has && entry?.photo_urls?.length ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={entry.photo_urls[photoIndex]}
                        alt="Entry thumbnail"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle"%3E💚%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    ) : null}
                    
                    {/* Heart indicator at top-right corner */}
                    {has && (
                      <div className="absolute top-2 right-2 z-20 text-lg drop-shadow-lg">
                        {getHeartColor(entry?.user_name)}
                      </div>
                    )}
                    
                    {/* Photo count indicator for multi-photo entries */}
                    {isLukeMultiPhoto && (
                      <div className="absolute top-2 left-2 z-20 text-xs font-bold text-white drop-shadow-lg bg-black/50 px-2 py-1 rounded">
                        {photoIndex + 1}/{entry.photo_urls?.length}
                      </div>
                    )}
                    
                    <div className={`relative z-10 flex flex-col items-center ${
                      has && entry?.photo_urls?.length ? 'text-white drop-shadow-lg' : 'text-gray-900'
                    }`}>
                      <span className="text-xs font-bold uppercase mb-1">{dayName}</span>
                      <span className="text-2xl font-bold">{day}</span>
                    </div>
                  </Link>

                  {/* Hover Bubble - Persistent on hover (tile + bubble) */}
                  {has && entry && (
                    <div
                      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-white rounded-xl shadow-2xl p-5 z-50 border border-gray-200 ${
                        hovered ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{getHeartColor(entry.user_name)}</span>
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            {entry.user_name || 'Unknown'}
                          </span>
                          <p className="text-sm text-gray-600">{date}</p>
                        </div>
                      </div>
                      
                      {entry.title && (
                        <h3 className="text-lg font-bold mb-2">{entry.title}</h3>
                      )}
                      
                      {/* Photo count indicator */}
                      {(entry.photo_urls?.length || 0) > 0 && (
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                          📸 {entry.photo_urls?.length} photo{(entry.photo_urls?.length || 0) > 1 ? 's' : ''}
                        </p>
                      )}
                      
                      {(entry.video_urls?.length || 0) > 0 && (
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                          🎥 {entry.video_urls?.length} video{(entry.video_urls?.length || 0) > 1 ? 's' : ''}
                        </p>
                      )}
                      
                      {(entry.spotify_urls?.length || 0) > 0 && (
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                          🎵 {entry.spotify_urls?.length} song{(entry.spotify_urls?.length || 0) > 1 ? 's' : ''} of the day
                        </p>
                      )}
                      
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <Link
                          href={`/entry/${entry.id}`}
                          className="block text-center text-sm font-bold uppercase tracking-wider bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                        >
                          View Full Entry
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
