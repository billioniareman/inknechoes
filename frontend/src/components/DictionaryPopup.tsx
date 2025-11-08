import { useEffect, useRef } from 'react'
import { X, Volume2, BookOpen } from 'lucide-react'
import { DictionaryEntry } from '../api/dictionary'

interface DictionaryPopupProps {
  word: string
  definition: DictionaryEntry[] | null
  position: { x: number; y: number }
  onClose: () => void
  isLoading?: boolean
}

export default function DictionaryPopup({
  word,
  definition,
  position,
  onClose,
  isLoading = false,
}: DictionaryPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    // Close on Escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Play audio pronunciation
  const playAudio = (audioUrl: string | undefined) => {
    if (!audioUrl) return
    
    // Handle relative URLs (starting with //)
    const fullUrl = audioUrl.startsWith('//') 
      ? `https:${audioUrl}` 
      : audioUrl.startsWith('http')
      ? audioUrl
      : `https://${audioUrl}`
    
    const audio = new Audio(fullUrl)
    audio.play().catch((error) => {
      console.error('Error playing audio:', error)
    })
  }

  // Calculate position to keep popup within viewport
  const calculatePosition = () => {
    const popupWidth = 400 // max-w-md
    const popupHeight = 400 // estimated max height
    const padding = 20

    let x = position.x
    let y = position.y

    // Adjust if popup would go off right edge
    if (x + popupWidth > window.innerWidth - padding) {
      x = window.innerWidth - popupWidth - padding
    }

    // Adjust if popup would go off left edge
    if (x < padding) {
      x = padding
    }

    // Adjust if popup would go off bottom edge
    if (y + popupHeight > window.innerHeight - padding) {
      y = position.y - popupHeight - 10 // Show above selection instead
    }

    // Adjust if popup would go off top edge
    if (y < padding) {
      y = padding
    }

    return { x, y }
  }

  const finalPosition = calculatePosition()

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col"
      style={{
        left: `${finalPosition.x}px`,
        top: `${finalPosition.y}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white capitalize">
            {word}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close dictionary"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto p-4 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading definition...</span>
          </div>
        ) : definition === null ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              No definition found for &quot;{word}&quot;
            </p>
          </div>
        ) : (
          definition.map((entry, entryIndex) => (
            <div key={entryIndex} className="space-y-4">
              {/* Phonetic */}
              {entry.phonetic && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="italic">{entry.phonetic}</span>
                  {entry.phonetics.find((p) => p.audio) && (
                    <button
                      onClick={() => playAudio(entry.phonetics.find((p) => p.audio)?.audio)}
                      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Play pronunciation"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Origin */}
              {entry.origin && (
                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                  <span className="font-semibold">Origin: </span>
                  {entry.origin}
                </div>
              )}

              {/* Meanings */}
              {entry.meanings.map((meaning, meaningIndex) => (
                <div key={meaningIndex} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                      {meaning.partOfSpeech}
                    </span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
                  </div>

                  <div className="space-y-3 ml-2">
                    {meaning.definitions.map((def, defIndex) => (
                      <div key={defIndex} className="space-y-1">
                        <p className="text-gray-900 dark:text-white">
                          {defIndex + 1}. {def.definition}
                        </p>
                        {def.example && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 italic ml-4">
                            &quot;{def.example}&quot;
                          </p>
                        )}
                        {def.synonyms.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Synonyms:
                            </span>
                            {def.synonyms.slice(0, 5).map((synonym, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                              >
                                {synonym}
                              </span>
                            ))}
                          </div>
                        )}
                        {def.antonyms.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              Antonyms:
                            </span>
                            {def.antonyms.slice(0, 5).map((antonym, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded"
                              >
                                {antonym}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

