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
      className="fixed z-50 bg-card border border-border rounded-xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col text-card-foreground backdrop-blur-sm"
      style={{
        left: `${finalPosition.x}px`,
        top: `${finalPosition.y}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="font-serif font-bold text-lg text-foreground capitalize">
            {word}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close dictionary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto p-4 flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary"></div>
            <span className="ml-3 text-sm text-muted-foreground">Looking up definition...</span>
          </div>
        ) : definition === null ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No definition found for &quot;{word}&quot;
            </p>
          </div>
        ) : (
          definition.map((entry, entryIndex) => (
            <div key={entryIndex} className="space-y-4">
              {/* Phonetic */}
              {entry.phonetic && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="italic font-serif">{entry.phonetic}</span>
                  {entry.phonetics.find((p) => p.audio) && (
                    <button
                      onClick={() => playAudio(entry.phonetics.find((p) => p.audio)?.audio)}
                      className="p-1 rounded-md hover:bg-muted text-primary transition-colors"
                      aria-label="Play pronunciation"
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Origin */}
              {entry.origin && (
                <div className="text-xs text-muted-foreground italic font-serif">
                  <span className="font-semibold font-sans not-italic">Origin: </span>
                  {entry.origin}
                </div>
              )}

              {/* Meanings */}
              {entry.meanings.map((meaning, meaningIndex) => (
                <div key={meaningIndex} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider font-sans">
                      {meaning.partOfSpeech}
                    </span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>

                  <div className="space-y-3 ml-1">
                    {meaning.definitions.map((def, defIndex) => (
                      <div key={defIndex} className="space-y-1 text-sm">
                        <p className="text-foreground leading-relaxed">
                          <strong className="text-muted-foreground font-serif mr-1">{defIndex + 1}.</strong> {def.definition}
                        </p>
                        {def.example && (
                          <p className="text-xs text-muted-foreground italic ml-4 font-serif">
                            &quot;{def.example}&quot;
                          </p>
                        )}
                        {def.synonyms.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            <span className="text-xs font-medium text-muted-foreground mr-1">
                              Synonyms:
                            </span>
                            {def.synonyms.slice(0, 5).map((synonym, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full border border-border/50"
                              >
                                {synonym}
                              </span>
                            ))}
                          </div>
                        )}
                        {def.antonyms.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-xs font-medium text-muted-foreground mr-1">
                              Antonyms:
                            </span>
                            {def.antonyms.slice(0, 5).map((antonym, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive rounded-full border border-destructive/20"
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

