import { useState } from 'react'
import DictionaryPopup from './DictionaryPopup'
import { useDictionary } from '../hooks/useDictionary'
import { Sparkles, SlidersHorizontal, BookOpen, Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface PoetryScrollProps {
  title: string
  content: string
  author?: string
  date?: string
}

export default function PoetryScroll({ title, content, author, date }: PoetryScrollProps) {
  const { setTheme, effectiveTheme } = useTheme()
  const [fontSize, setFontSize] = useState<number>(20)
  const [fontFamily, setFontFamily] = useState<'literata' | 'playfair' | 'inter'>('literata')
  const [showControls, setShowControls] = useState<boolean>(false)

  // Dictionary functionality
  const {
    selectedWord,
    dictionaryData,
    popupPosition: dictionaryPosition,
    isLoading: isDictionaryLoading,
    showPopup: showDictionaryPopup,
    closePopup: closeDictionaryPopup,
  } = useDictionary({ enabled: true })

  // Extract stanzas from HTML while preserving blank lines and verse structure
  const parseStanzas = (html: string): string[][] => {
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    const paragraphs = tempDiv.querySelectorAll('p')
    if (paragraphs.length > 0) {
      const stanzas: string[][] = []
      let currentStanza: string[] = []

      paragraphs.forEach((p) => {
        const text = p.textContent?.trim() || ''
        if (text === '') {
          if (currentStanza.length > 0) {
            stanzas.push(currentStanza)
            currentStanza = []
          }
        } else {
          // If inner HTML contains <br>, split by br
          const innerLines = p.innerHTML.split(/<br\s*[\/]?>/gi)
          innerLines.forEach((l) => {
            const clean = l.replace(/<[^>]*>?/gm, '').trim()
            if (clean) currentStanza.push(clean)
          })
        }
      })

      if (currentStanza.length > 0) {
        stanzas.push(currentStanza)
      }

      if (stanzas.length > 0) return stanzas
    }

    // Fallback: split by double newlines or single newlines
    const raw = tempDiv.textContent || ''
    const blocks = raw.split(/\n\s*\n/)
    return blocks.map((b) => b.split('\n').map((l) => l.trim()).filter(Boolean))
  }

  const stanzas = parseStanzas(content)

  const fontClass =
    fontFamily === 'literata'
      ? 'font-reading'
      : fontFamily === 'playfair'
      ? 'font-serif'
      : 'font-sans'

  return (
    <div className="min-h-screen bg-background text-foreground py-10 sm:py-16 px-4 transition-colors">
      <div className="max-w-2xl mx-auto">
        
        {/* Subtle Floating Reader Controls Bar */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-border/70">
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-sans font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-terracotta" />
            <span>Poetry Edition</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Theme Switcher */}
            <div className="flex items-center bg-card border border-border rounded-full p-1 text-xs">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-full transition-colors ${
                  effectiveTheme === 'light' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
                title="Warm Ivory (Light)"
                aria-label="Warm Ivory Light"
              >
                <Sun className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTheme('sepia')}
                className={`p-1.5 rounded-full transition-colors ${
                  effectiveTheme === 'sepia' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
                title="Parchment (Sepia)"
                aria-label="Parchment Sepia"
              >
                <BookOpen className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-full transition-colors ${
                  effectiveTheme === 'dark' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
                title="Charcoal (Dark)"
                aria-label="Charcoal Dark"
              >
                <Moon className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Typography Popover Trigger */}
            <button
              onClick={() => setShowControls(!showControls)}
              className="p-1.5 bg-card border border-border rounded-full text-muted-foreground hover:text-foreground transition-colors"
              title="Reader Settings"
              aria-label="Reader Settings"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Reader Preferences Bar */}
        {showControls && (
          <div className="bg-card border border-border rounded-xl p-4 mb-8 text-xs space-y-3 shadow-sm animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Typeface:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setFontFamily('literata')}
                  className={`px-3 py-1 rounded-md border ${
                    fontFamily === 'literata'
                      ? 'bg-literary text-white border-literary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Literata
                </button>
                <button
                  onClick={() => setFontFamily('playfair')}
                  className={`px-3 py-1 rounded-md border ${
                    fontFamily === 'playfair'
                      ? 'bg-literary text-white border-literary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Playfair
                </button>
                <button
                  onClick={() => setFontFamily('inter')}
                  className={`px-3 py-1 rounded-md border ${
                    fontFamily === 'inter'
                      ? 'bg-literary text-white border-literary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Inter
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Verse Size:</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFontSize(Math.max(16, fontSize - 2))}
                  className="px-2.5 py-1 border border-border rounded-md hover:bg-muted"
                >
                  A-
                </button>
                <span className="text-muted-foreground">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(26, fontSize + 2))}
                  className="px-2.5 py-1 border border-border rounded-md hover:bg-muted"
                >
                  A+
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Poem Header & Attribution */}
        <header className="text-center space-y-3 mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground leading-tight tracking-tight">
            {title}
          </h1>

          {author && (
            <p className="font-serif italic text-base sm:text-lg text-literary">
              by {author}
            </p>
          )}

          {date && (
            <p className="text-xs text-muted-foreground">
              {new Date(date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}

          <div className="w-12 h-px bg-border/80 mx-auto mt-6" />
        </header>

        {/* Stanzas Canvas: Preserves pure line breaks & cadence */}
        <div
          className={`space-y-8 sm:space-y-10 ${fontClass} leading-loose tracking-wide text-foreground/90`}
          style={{ fontSize: `${fontSize}px` }}
        >
          {stanzas.map((stanza, sIdx) => (
            <div key={sIdx} className="space-y-1 pl-4 sm:pl-8 border-l border-literary/30">
              {stanza.map((line, lIdx) => (
                <p key={lIdx} className="leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Footer Finial Decoration */}
        <div className="text-center mt-16 sm:mt-24 pt-8 border-t border-border/70 text-xs text-muted-foreground font-serif italic">
          &lowast; &lowast; &lowast;
        </div>
      </div>

      {/* Dictionary Popup */}
      {showDictionaryPopup && selectedWord && (
        <div data-dictionary-popup>
          <DictionaryPopup
            word={selectedWord}
            definition={dictionaryData}
            position={dictionaryPosition}
            onClose={closeDictionaryPopup}
            isLoading={isDictionaryLoading}
          />
        </div>
      )}
    </div>
  )
}
