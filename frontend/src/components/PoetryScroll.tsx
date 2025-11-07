
interface PoetryScrollProps {
  title: string
  content: string
  author?: string
  date?: string
}

export default function PoetryScroll({ title, content, author, date }: PoetryScrollProps) {
  // Extract text from HTML content
  const extractTextFromHTML = (html: string): string[] => {
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    
    // Extract text from all paragraph elements
    const paragraphs = tempDiv.querySelectorAll('p')
    const lines: string[] = []
    
    paragraphs.forEach((p) => {
      const text = p.textContent?.trim() || ''
      if (text) {
        lines.push(text)
      }
    })
    
    // If no paragraphs found, try to extract all text
    if (lines.length === 0) {
      const allText = tempDiv.textContent || ''
      // Split by newlines and filter empty lines
      const textLines = allText.split('\n').map(line => line.trim()).filter(line => line)
      lines.push(...textLines)
    }
    
    return lines
  }
  
  // Extract text lines from HTML content
  const lines = extractTextFromHTML(content)

  return (
    <div className="flex justify-center items-center min-h-screen py-12 px-4 bg-gradient-to-b from-amber-50/50 to-stone-50/50">
      <div className="relative w-full max-w-2xl">
        {/* Scroll Container */}
        <div className="relative">
          {/* Top Roller */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-32 h-8 bg-gradient-to-b from-amber-800 to-amber-900 rounded-full shadow-lg"></div>
              {/* Decorative finials */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-amber-900 rounded-full shadow-md"></div>
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-amber-900 rounded-full shadow-md"></div>
            </div>
          </div>

          {/* Parchment Paper */}
          <div className="relative bg-gradient-to-b from-amber-50 via-amber-40 to-amber-50 border-t-4 border-b-4 border-amber-800/30 shadow-2xl">
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-amber-800/20 to-transparent">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-amber-800/30"></div>
              </div>
            </div>

            {/* Content Area */}
            <div className="px-12 py-16 mt-12 mb-12">
              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-amber-900 mb-8 text-center leading-tight">
                {title}
              </h1>

              {/* Poetry Lines */}
              <div className="space-y-3 text-amber-900/90">
                {lines.map((line, idx) => (
                  <p
                    key={idx}
                    className="text-lg md:text-xl font-serif text-center leading-relaxed"
                    style={{
                      fontFamily: "'Playfair Display', 'Georgia', serif",
                      letterSpacing: '0.02em',
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>

              {/* Author and Date */}
              {(author || date) && (
                <div className="mt-12 pt-8 border-t border-amber-800/20 text-center">
                  {author && (
                    <p className="text-amber-800/70 font-serif text-lg italic mb-2">
                      — {author}
                    </p>
                  )}
                  {date && (
                    <p className="text-amber-800/50 text-sm">
                      {new Date(date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Decorative bottom border */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-amber-800/20 to-transparent">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-px bg-amber-800/30"></div>
              </div>
            </div>

            {/* Aged paper texture overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-10">
              <div className="absolute top-10 left-8 w-32 h-32 bg-amber-700/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-20 right-12 w-24 h-24 bg-amber-600/20 rounded-full blur-xl"></div>
              <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-amber-800/20 rounded-full blur-lg"></div>
            </div>
          </div>

          {/* Bottom Roller */}
          <div className="flex justify-center mt-4">
            <div className="relative">
              <div className="w-32 h-8 bg-gradient-to-b from-amber-800 to-amber-900 rounded-full shadow-lg"></div>
              {/* Decorative finials */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-amber-900 rounded-full shadow-md"></div>
              <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-amber-900 rounded-full shadow-md"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

