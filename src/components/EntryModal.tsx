'use client'

interface DiaryEntry {
  id: string
  date: string
  title?: string
  content?: string
  photo_urls?: string[]
  video_urls?: string[]
  user_name?: string
}

interface EntryModalProps {
  entry: DiaryEntry
  onClose: () => void
}

export default function EntryModal({ entry, onClose }: EntryModalProps) {
  if (!entry || !entry.date) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-none max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                {new Date(entry.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              {entry.title && (
                <h2 className="text-headline">
                  {entry.title} {entry.user_name ? (entry.user_name.toLowerCase() === 'luke' ? '💜' : '💚') : '💙'}
                </h2>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          {entry.content && (
            <div className="mb-8">
              <p className="text-body whitespace-pre-wrap leading-relaxed">
                {entry.content}
              </p>
            </div>
          )}

          {/* Photos */}
          {entry.photo_urls && entry.photo_urls.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Photos</h3>
              <div className="grid grid-cols-2 gap-4">
                {entry.photo_urls.map((url, i) => (
                  <div key={i} className="w-full aspect-square bg-gray-100">
                    {url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={url}
                        alt={`Memory ${i + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E'
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {entry.video_urls && entry.video_urls.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Videos</h3>
              <div className="space-y-4">
                {entry.video_urls.map((url, i) => (
                  <video
                    key={i}
                    src={url}
                    controls
                    className="rounded-lg w-full"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="design-button px-6 py-3"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
