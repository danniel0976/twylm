'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Calendar from '@/components/Calendar'
import Header from '@/components/Header'
import SpotifyLastPlayed from '@/components/SpotifyLastPlayed'

interface DiaryEntry {
  id: string
  date: string
  title?: string
  content?: string
  photo_urls?: string[]
  video_urls?: string[]
  spotify_urls?: string[]
  user_id?: string
  user_name?: string
  created_at: string
}

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [entries, setEntries] = useState<Record<string, DiaryEntry>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('diary_entries')
          .select('*')
          .order('date', { ascending: false })

        if (error) throw error

        const entriesMap: Record<string, DiaryEntry> = {}
        if (data) {
          for (const entry of data) {
            const { data: userData } = await supabase
              .from('users')
              .select('name')
              .eq('id', entry.user_id)
              .single()
            
            entriesMap[entry.date] = {
              ...entry,
              user_name: userData?.name || undefined
            }
          }
        }

        setEntries(entriesMap)
      } catch (err) {
        console.error('Failed to load entries:', err)
      } finally {
        setLoading(false)
      }
    }

    loadEntries()
  }, [])

  const handleDateSelect = (date: string | null) => {
    setSelectedDate(date)
  }

  // Calculate countdown to April 9, 2026
  const [days, setDays] = useState(0)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const targetDate = new Date('2026-04-09T00:00:00')
    
    const updateCountdown = () => {
      const now = new Date()
      const diffTime = targetDate.getTime() - now.getTime()
      
      if (diffTime > 0) {
        setDays(Math.floor(diffTime / (1000 * 60 * 60 * 24)))
        setHours(Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))
        setMinutes(Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60)))
        setSeconds(Math.floor((diffTime % (1000 * 60)) / 1000))
      }
    }
    
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="mb-16">
          <h1 className="display-giant mb-4">
            The Way You Love Me
          </h1>
          <p className="text-headline mb-4">
            Stories I tell Luke everyday until we see each other again
          </p>
          <div className="flex items-center gap-6 flex-wrap">
            {days > 0 || hours > 0 || minutes > 0 || seconds > 0 ? (
              <div className="inline-flex items-center gap-6 px-8 py-4 rounded-full bg-purple-50 border border-purple-200">
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">{days}</p>
                  <p className="text-xs uppercase tracking-wider text-purple-700">Days</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">{hours}</p>
                  <p className="text-xs uppercase tracking-wider text-purple-700">Hours</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">{minutes}</p>
                  <p className="text-xs uppercase tracking-wider text-purple-700">Minutes</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">{seconds}</p>
                  <p className="text-xs uppercase tracking-wider text-purple-700">Seconds</p>
                </div>
              </div>
            ) : (
              <p className="text-headline font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                Today's the day! 💜
              </p>
            )}
            
            {/* Real Spotify Last Played */}
            <SpotifyLastPlayed />
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600 text-center">Loading calendar...</p>
        ) : (
          <Calendar
            selectedDate={selectedDate}
            entries={entries}
            onDateSelect={handleDateSelect}
          />
        )}
      </div>
    </div>
  )
}
