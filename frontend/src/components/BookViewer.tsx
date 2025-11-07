import { useState, useEffect, useRef, useMemo } from 'react'
import { ChevronLeft, ChevronRight, BookOpen, Bookmark, BookmarkCheck, Maximize2, Minimize2, Settings, Download, List, X, Type, Plus } from 'lucide-react'
import { chaptersApi, Chapter } from '../api/chapters'
import { bookmarksApi, Bookmark as BookmarkType } from '../api/bookmarks'
import { readingProgressApi, ReadingProgress } from '../api/readingProgress'
import { useUserStore } from '../store/userStore'

// Two Column Content Component
function TwoColumnContent({ content, fontSize, fontFamily }: { content: string; fontSize: number; fontFamily: string }) {
  const { leftColumn, rightColumn } = useMemo(() => {
    if (!content) return { leftColumn: '', rightColumn: '' }
    
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content
    const paragraphs = tempDiv.querySelectorAll('p')
    
    if (paragraphs.length === 0) {
      // If no paragraphs, split by word count
      const words = tempDiv.textContent?.split(/\s+/) || []
      const midPoint = Math.ceil(words.length / 2)
      const leftWords = words.slice(0, midPoint).join(' ')
      const rightWords = words.slice(midPoint).join(' ')
      return { leftColumn: `<p>${leftWords}</p>`, rightColumn: `<p>${rightWords}</p>` }
    }
    
    const midPoint = Math.ceil(paragraphs.length / 2)
    const leftColumn = Array.from(paragraphs).slice(0, midPoint).map(p => p.outerHTML).join('')
    const rightColumn = Array.from(paragraphs).slice(midPoint).map(p => p.outerHTML).join('')
    
    return { leftColumn, rightColumn }
  }, [content])

  return (
    <div className="grid grid-cols-2 gap-12">
      {/* Left Column */}
      <div
        className="text-amber-900/90 prose prose-lg max-w-none"
        style={{
          fontFamily: fontFamily,
          lineHeight: '1.8',
          fontSize: `${fontSize}px`,
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: leftColumn }} />
      </div>
      {/* Right Column */}
      <div
        className="text-amber-900/90 prose prose-lg max-w-none"
        style={{
          fontFamily: fontFamily,
          lineHeight: '1.8',
          fontSize: `${fontSize}px`,
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: rightColumn }} />
      </div>
    </div>
  )
}

interface BookViewerProps {
  title: string
  content: string
  author?: string
  date?: string
  postId: number
  coverImageUrl?: string
  description?: string
}

export default function BookViewer({ title, content, author, date, postId, coverImageUrl, description }: BookViewerProps) {
  const { user } = useUserStore()
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [pages, setPages] = useState<string[]>([])
  const [isTurning, setIsTurning] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showTOC, setShowTOC] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [fontSize, setFontSize] = useState(18)
  const [fontFamily, setFontFamily] = useState("'Playfair Display', 'Georgia', serif")
  const [bookmark, setBookmark] = useState<BookmarkType | null>(null)
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [readingStartTime, setReadingStartTime] = useState<number | null>(null)
  const [showBookmarkNote, setShowBookmarkNote] = useState(false)
  const [bookmarkNote, setBookmarkNote] = useState('')
  const bookRef = useRef<HTMLDivElement>(null)

  // Load chapters
  useEffect(() => {
    const loadChapters = async () => {
      try {
        const chaptersData = await chaptersApi.getChapters(postId)
        setChapters(chaptersData)
        if (chaptersData.length > 0) {
          setCurrentChapterIndex(0)
        }
      } catch (error) {
        console.error('Failed to load chapters:', error)
      }
    }
    loadChapters()
  }, [postId])

  // Load bookmark and progress
  useEffect(() => {
    if (!user) return

    const loadBookmark = async () => {
      try {
        const bookmarkData = await bookmarksApi.getBookmarkForPost(postId)
        setBookmark(bookmarkData)
        if (bookmarkData) {
          setCurrentPage(bookmarkData.page_number - 1)
          if (bookmarkData.chapter_id) {
            const chapterIndex = chapters.findIndex(ch => ch.id === bookmarkData.chapter_id)
            if (chapterIndex !== -1) {
              setCurrentChapterIndex(chapterIndex)
            }
          }
        }
      } catch (error) {
        // Bookmark not found, that's okay
      }
    }

    const loadProgress = async () => {
      try {
        const progressData = await readingProgressApi.getProgress(postId)
        setProgress(progressData)
        if (progressData.current_page > 0) {
          setCurrentPage(progressData.current_page - 1)
        }
      } catch (error) {
        console.error('Failed to load progress:', error)
      }
    }

    loadBookmark()
    loadProgress()
  }, [user, postId, chapters])

  // Load chapter content and split into pages
  useEffect(() => {
    const loadChapterContent = async () => {
      if (currentChapterIndex === null || chapters.length === 0) {
        // Use main content if no chapters
        const words = content.split(/\s+/)
        const wordsPerPage = Math.floor(800 * (fontSize / 18)) // More words per page for two-column layout
        const newPages: string[] = []
        for (let i = 0; i < words.length; i += wordsPerPage) {
          const pageWords = words.slice(i, i + wordsPerPage)
          newPages.push(pageWords.join(' '))
        }
        if (newPages.length === 0) newPages.push('')
        setPages(newPages)
        return
      }

      try {
        const chapter = chapters[currentChapterIndex]
        const chapterData = await chaptersApi.getChapter(chapter.id)
        const chapterContent = chapterData.content.body

        // Split chapter content into pages
        const words = chapterContent.split(/\s+/)
        const wordsPerPage = Math.floor(800 * (fontSize / 18)) // More words per page for two-column layout
        const newPages: string[] = []
        for (let i = 0; i < words.length; i += wordsPerPage) {
          const pageWords = words.slice(i, i + wordsPerPage)
          newPages.push(pageWords.join(' '))
        }
        if (newPages.length === 0) newPages.push('')
        setPages(newPages)
        setCurrentPage(0)
      } catch (error) {
        console.error('Failed to load chapter:', error)
      }
    }

    loadChapterContent()
  }, [currentChapterIndex, chapters, fontSize, content])

  // Track reading time
  useEffect(() => {
    if (!user || !progress) return

    setReadingStartTime(Date.now())

    const interval = setInterval(async () => {
      if (readingStartTime) {
        const minutesElapsed = Math.floor((Date.now() - readingStartTime) / 60000)
        if (minutesElapsed > 0) {
          try {
            await readingProgressApi.updateProgress(postId, {
              current_page: currentPage + 1,
              total_pages: pages.length,
              reading_time_minutes: minutesElapsed
            })
          } catch (error) {
            console.error('Failed to update progress:', error)
          }
        }
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [user, progress, readingStartTime, currentPage, pages.length, postId])

  // Update progress when page changes
  useEffect(() => {
    if (!user || !progress || pages.length === 0) return

    const updateProgress = async () => {
      try {
        const totalPages = chapters.length > 0 
          ? chapters.reduce((sum, ch) => sum + Math.ceil(ch.content?.body.split(/\s+/).length / Math.floor(500 * (fontSize / 18))) || 1, 0)
          : pages.length

        await readingProgressApi.updateProgress(postId, {
          current_page: currentPage + 1,
          total_pages: totalPages,
          progress_percentage: ((currentPage + 1) / totalPages) * 100
        })
      } catch (error) {
        console.error('Failed to update progress:', error)
      }
    }

    const timeout = setTimeout(updateProgress, 1000)
    return () => clearTimeout(timeout)
  }, [currentPage, user, progress, pages.length, chapters, fontSize, postId])

  const handleNextPage = () => {
    if (currentPage < pages.length - 1 && !isTurning) {
      setIsTurning(true)
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1)
        setIsTurning(false)
      }, 300)
    } else if (currentChapterIndex !== null && currentChapterIndex < chapters.length - 1) {
      // Move to next chapter
      setCurrentChapterIndex(currentChapterIndex + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0 && !isTurning) {
      setIsTurning(true)
      setTimeout(() => {
        setCurrentPage((prev) => prev - 1)
        setIsTurning(false)
      }, 300)
    } else if (currentChapterIndex !== null && currentChapterIndex > 0) {
      // Move to previous chapter
      const prevChapterIndex = currentChapterIndex - 1
      setCurrentChapterIndex(prevChapterIndex)
    }
  }

  const handleBookmark = async () => {
    if (!user) return

    try {
      if (bookmark) {
        // Remove bookmark
        await bookmarksApi.deleteBookmark(bookmark.id)
        setBookmark(null)
      } else {
        // Create bookmark
        if (showBookmarkNote) {
          const newBookmark = await bookmarksApi.createBookmark({
            post_id: postId,
            chapter_id: currentChapterIndex !== null && chapters[currentChapterIndex] ? chapters[currentChapterIndex].id : undefined,
            page_number: currentPage + 1,
            note: bookmarkNote
          })
          setBookmark(newBookmark)
          setShowBookmarkNote(false)
          setBookmarkNote('')
        } else {
          setShowBookmarkNote(true)
        }
      }
    } catch (error) {
      console.error('Failed to toggle bookmark:', error)
    }
  }

  const handleSaveBookmark = async () => {
    if (!user) return

    try {
      const newBookmark = await bookmarksApi.createBookmark({
        post_id: postId,
        chapter_id: currentChapterIndex !== null && chapters[currentChapterIndex] ? chapters[currentChapterIndex].id : undefined,
        page_number: currentPage + 1,
        note: bookmarkNote
      })
      setBookmark(newBookmark)
      setShowBookmarkNote(false)
      setBookmarkNote('')
    } catch (error) {
      console.error('Failed to save bookmark:', error)
    }
  }

  const handleExportPDF = () => {
    // Simple PDF export using window.print
    window.print()
  }

  const handleExportEPUB = () => {
    // EPUB export would require a library like epub.js
    alert('EPUB export coming soon!')
  }

  const handleChapterSelect = (index: number) => {
    setCurrentChapterIndex(index)
    setCurrentPage(0)
    setShowTOC(false)
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNextPage()
      if (e.key === 'ArrowLeft') handlePrevPage()
      if (e.key === 'Escape') {
        setIsFullscreen(false)
        setShowTOC(false)
        setShowSettings(false)
      }
      if (e.key === 'f' || e.key === 'F') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          setIsFullscreen(!isFullscreen)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentPage, pages.length, isTurning, isFullscreen])

  const currentChapter = currentChapterIndex !== null && chapters[currentChapterIndex] ? chapters[currentChapterIndex] : null
  const totalPages = chapters.length > 0 
    ? chapters.reduce((sum, ch) => sum + Math.ceil((ch.content?.body.split(/\s+/).length || 0) / Math.floor(500 * (fontSize / 18))), 0)
    : pages.length

  return (
    <div className={`min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-50 py-12 px-4 ${isFullscreen ? 'fixed inset-0 z-50 overflow-auto' : ''}`}>
      <div className="max-w-7xl mx-auto flex gap-6">
        {/* Table of Contents - Left Side */}
        {chapters.length > 0 && (
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-6 bg-white/90 backdrop-blur-sm border border-amber-200/50 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-serif font-bold text-amber-900">Table of Contents</h2>
                <button 
                  onClick={() => setShowTOC(!showTOC)} 
                  className="md:hidden p-1 hover:bg-amber-100 rounded"
                >
                  <X className="w-4 h-4 text-amber-800" />
                </button>
              </div>
              <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
                {chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => handleChapterSelect(index)}
                    className={`w-full text-left p-2 rounded transition-colors text-sm ${
                      currentChapterIndex === index
                        ? 'bg-amber-100 text-amber-900 font-semibold border-l-2 border-amber-800'
                        : 'hover:bg-amber-50 text-amber-800'
                    }`}
                  >
                    <div className="font-medium">{chapter.title}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6 bg-white/80 backdrop-blur-sm border border-amber-200/50 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowTOC(!showTOC)}
                className="md:hidden p-2 hover:bg-amber-100 rounded-lg transition-colors"
                title="Table of Contents"
              >
                <List className="w-5 h-5 text-amber-800" />
              </button>
              {user && (
                <button
                  onClick={handleBookmark}
                  className={`p-2 hover:bg-amber-100 rounded-lg transition-colors ${
                    bookmark ? 'text-amber-600' : 'text-amber-800'
                  }`}
                  title="Bookmark"
                >
                  {bookmark ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </button>
              )}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-amber-800" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                title="Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-5 h-5 text-amber-800" /> : <Maximize2 className="w-5 h-5 text-amber-800" />}
              </button>
              <div className="relative">
                <button
                  onClick={handleExportPDF}
                  className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                  title="Export PDF"
                >
                  <Download className="w-5 h-5 text-amber-800" />
                </button>
              </div>
            </div>
            {progress && (
              <div className="text-sm text-amber-800">
                Progress: {Math.round(progress.progress_percentage)}%
              </div>
            )}
          </div>

          {/* Mobile TOC Toggle */}
          {chapters.length > 0 && (
            <button
              onClick={() => setShowTOC(!showTOC)}
              className="md:hidden fixed bottom-4 right-4 z-40 p-3 bg-amber-800 text-amber-50 rounded-full shadow-lg hover:bg-amber-900"
              title="Table of Contents"
            >
              <List className="w-5 h-5" />
            </button>
          )}

          {/* Mobile Table of Contents Sidebar */}
          {showTOC && (
            <div className="md:hidden fixed inset-0 z-50 flex">
              <div className="bg-black/50 flex-1" onClick={() => setShowTOC(false)}></div>
              <div className="bg-white w-80 shadow-xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-serif font-bold text-amber-900">Table of Contents</h2>
                    <button onClick={() => setShowTOC(false)} className="p-1 hover:bg-amber-100 rounded">
                      <X className="w-5 h-5 text-amber-800" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {chapters.map((chapter, index) => (
                      <button
                        key={chapter.id}
                        onClick={() => handleChapterSelect(index)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          currentChapterIndex === index
                            ? 'bg-amber-100 text-amber-900 font-semibold'
                            : 'hover:bg-amber-50 text-amber-800'
                        }`}
                      >
                        {chapter.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Sidebar */}
          {showSettings && (
            <div className="fixed inset-0 z-50 flex">
              <div className="bg-black/50 flex-1" onClick={() => setShowSettings(false)}></div>
              <div className="bg-white w-80 shadow-xl overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-serif font-bold text-amber-900">Reading Settings</h2>
                    <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-amber-100 rounded">
                      <X className="w-5 h-5 text-amber-800" />
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-2">Font Size</label>
                      <input
                        type="range"
                        min="12"
                        max="24"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="text-sm text-amber-600 mt-1">{fontSize}px</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-2">Font Family</label>
                      <select
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                        className="w-full p-2 border border-amber-200 rounded-md"
                      >
                        <option value="'Playfair Display', 'Georgia', serif">Serif</option>
                        <option value="'Inter', sans-serif">Sans-serif</option>
                        <option value="'Courier New', monospace">Monospace</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bookmark Note Modal */}
          {showBookmarkNote && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-xl font-serif font-bold text-amber-900 mb-4">Add Bookmark Note</h3>
                <textarea
                  value={bookmarkNote}
                  onChange={(e) => setBookmarkNote(e.target.value)}
                  className="w-full p-3 border border-amber-200 rounded-md min-h-[100px] mb-4"
                  placeholder="Add a note for this bookmark..."
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowBookmarkNote(false)
                      setBookmarkNote('')
                    }}
                    className="px-4 py-2 border border-amber-200 rounded-md hover:bg-amber-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveBookmark}
                    className="px-4 py-2 bg-amber-800 text-amber-50 rounded-md hover:bg-amber-900"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Book Cover/Title Page */}
          {currentPage === 0 && currentChapterIndex === null && (
            <div className="mb-8 text-center">
              {coverImageUrl && (
                <img src={coverImageUrl} alt={title} className="mx-auto mb-6 max-w-xs rounded-lg shadow-lg" />
              )}
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-amber-900 mb-4">
                {title}
              </h1>
              {description && (
                <p className="text-lg text-amber-800/70 max-w-2xl mx-auto mb-4">{description}</p>
              )}
              {author && (
                <p className="text-2xl font-serif text-amber-800/70 italic mb-2">
                  by {author}
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

          {/* Book Pages - Traditional Book Template */}
          <div className="flex justify-center items-start">
            <div
              ref={bookRef}
              className={`relative w-full transition-transform duration-300 ${
                isTurning ? 'scale-95' : 'scale-100'
              }`}
            >
              {/* Book Page - Traditional Layout */}
              <div className="bg-white shadow-2xl border border-amber-800/30 min-h-[800px] relative">
                {/* Page Header - Title at top center, page numbers at corners */}
                <div className="absolute top-0 left-0 right-0 h-16 border-b border-amber-800/20 flex items-center justify-between px-8">
                  <div className="text-amber-800/60 text-sm font-serif">
                    {currentPage + 1}
                  </div>
                  <div className="text-amber-900 font-serif font-semibold text-sm">
                    {currentChapter ? currentChapter.title : title}
                  </div>
                  <div className="text-amber-800/60 text-sm font-serif">
                    {pages.length}
                  </div>
                </div>

                {/* Main Content Area - Two Column Layout */}
                <div className="pt-20 pb-16 px-12">
                  {currentPage === 0 && currentChapterIndex === null ? (
                    <div className="text-center py-16">
                      <p className="text-xl text-amber-800/60 italic">Begin reading...</p>
                    </div>
                  ) : (
                    <TwoColumnContent 
                      content={pages[currentPage] || ''} 
                      fontSize={fontSize}
                      fontFamily={fontFamily}
                    />
                  )}
                </div>

                {/* Page Footer */}
                <div className="absolute bottom-0 left-0 right-0 h-12 border-t border-amber-800/20 flex items-center justify-center">
                  <div className="text-amber-800/40 text-xs font-serif">
                    {title}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-center items-center gap-8 mt-8">
            <button
              onClick={handlePrevPage}
              disabled={(currentPage === 0 && (currentChapterIndex === null || currentChapterIndex === 0)) || isTurning}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                (currentPage === 0 && (currentChapterIndex === null || currentChapterIndex === 0)) || isTurning
                  ? 'bg-amber-200/50 text-amber-800/30 cursor-not-allowed'
                  : 'bg-amber-800 text-amber-50 hover:bg-amber-900 shadow-lg hover:shadow-xl'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="text-amber-800/70 font-serif text-sm">
              Page {currentPage + 1} of {pages.length}
              {currentChapter && ` • ${currentChapter.title}`}
            </div>

            <button
              onClick={handleNextPage}
              disabled={(currentPage >= pages.length - 1 && (currentChapterIndex === null || currentChapterIndex >= chapters.length - 1)) || isTurning}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                (currentPage >= pages.length - 1 && (currentChapterIndex === null || currentChapterIndex >= chapters.length - 1)) || isTurning
                  ? 'bg-amber-200/50 text-amber-800/30 cursor-not-allowed'
                  : 'bg-amber-800 text-amber-50 hover:bg-amber-900 shadow-lg hover:shadow-xl'
              }`}
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          {progress && (
            <div className="mt-6 max-w-4xl mx-auto">
              <div className="h-2 bg-amber-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-800 transition-all duration-300"
                  style={{ width: `${progress.progress_percentage}%` }}
                />
              </div>
              <div className="text-sm text-amber-800 mt-2 text-center">
                {Math.round(progress.progress_percentage)}% complete
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
