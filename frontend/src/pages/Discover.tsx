import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { postsApi, Post } from '../api/posts'
import BookCard from '../components/cards/BookCard'
import PoemCard from '../components/cards/PoemCard'
import StoryCard from '../components/cards/StoryCard'
import AuthorCard from '../components/cards/AuthorCard'
import {
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  BookOpen,
  FileText,
  Feather,
  Users,
  Compass,
  RotateCcw
} from 'lucide-react'

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPosts, setTotalPosts] = useState(0)

  // Filters
  const [activeTab, setActiveTab] = useState(searchParams.get('type') || searchParams.get('tab') || 'all')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'latest')
  const [genreFilter, setGenreFilter] = useState(searchParams.get('genre') || '')
  const [showFilters, setShowFilters] = useState(false)
  const [useFullText, setUseFullText] = useState(false)

  // Sync state with search params
  useEffect(() => {
    const urlType = searchParams.get('type')
    const urlTab = searchParams.get('tab')
    if (urlTab === 'writers') {
      setActiveTab('writers')
    } else if (urlType) {
      setActiveTab(urlType)
    }

    const urlSearch = searchParams.get('search')
    if (urlSearch !== null && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch)
    }

    const urlSort = searchParams.get('sort')
    if (urlSort) {
      setSortBy(urlSort === 'appreciated' ? 'most_appreciated' : urlSort)
    }
  }, [searchParams])

  useEffect(() => {
    if (activeTab !== 'writers') {
      loadPosts()
    }
  }, [page, sortBy, activeTab, searchQuery, genreFilter, useFullText])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)

      const contentTypeParam =
        activeTab === 'all' || activeTab === 'writers'
          ? undefined
          : activeTab === 'poetry' ? 'poem' : activeTab

      if (genreFilter || useFullText || searchQuery) {
        const data = await postsApi.searchPosts({
          page,
          page_size: 18,
          sort_by: sortBy,
          search: searchQuery || undefined,
          content_type: contentTypeParam,
          genre: genreFilter || undefined,
          full_text: useFullText,
        })
        setPosts(data.posts || [])
        setTotalPosts(data.total || 0)
      } else {
        const data = await postsApi.getPosts(
          page,
          18,
          sortBy,
          undefined,
          contentTypeParam
        )
        setPosts(data.posts || [])
        setTotalPosts(data.total || 0)
      }
    } catch (err: any) {
      console.error('Error discovering posts:', err)
      setError('Unable to load publications. Please check your connection and retry.')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setPage(1)
    const newParams = new URLSearchParams(searchParams)
    if (tab === 'all') {
      newParams.delete('type')
      newParams.delete('tab')
    } else if (tab === 'writers') {
      newParams.set('tab', 'writers')
      newParams.delete('type')
    } else {
      newParams.set('type', tab)
      newParams.delete('tab')
    }
    setSearchParams(newParams)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    const newParams = new URLSearchParams(searchParams)
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim())
    } else {
      newParams.delete('search')
    }
    setSearchParams(newParams)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setGenreFilter('')
    setSortBy('latest')
    setUseFullText(false)
    setActiveTab('all')
    setSearchParams(new URLSearchParams())
  }

  const genreOptions = [
    'Fiction',
    'Poetry',
    'Philosophy',
    'Essays',
    'Memoir',
    'Mystery',
    'Historical',
    'Nature',
    'Romance',
  ]

  // Curated writers showcase when Writers tab is active
  const writersCatalog = [
    {
      username: 'elena_vance',
      fullName: 'Elena Vance',
      bio: 'Poet & Essayist. Exploring quiet grief, coastal solitude, and the cadence of silence.',
      publicationsCount: 14,
      followersCount: 342,
    },
    {
      username: 'marcus_reid',
      fullName: 'Marcus Reid',
      bio: 'Author of historical fiction and speculative manuscripts. Writing from old library archives.',
      publicationsCount: 8,
      followersCount: 512,
    },
    {
      username: 'clara_chen',
      fullName: 'Clara Chen',
      bio: 'Literary journal editor. Fascinated by translated verses and modern lyrical minimalism.',
      publicationsCount: 22,
      followersCount: 680,
    },
    {
      username: 'arthur_pendleton',
      fullName: 'Arthur Pendleton',
      bio: 'Nature diarist and essayist. Documenting old forests and seasonal migrations.',
      publicationsCount: 5,
      followersCount: 195,
    },
    {
      username: 'samira_al_khatib',
      fullName: 'Samira Al-Khatib',
      bio: 'Classical and free-verse poet. Writing in dual languages of nostalgia and rebirth.',
      publicationsCount: 17,
      followersCount: 420,
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header Title */}
        <div className="border-b border-border/70 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-sans uppercase tracking-widest text-literary font-semibold mb-1">
              <Compass className="h-3.5 w-3.5" />
              <span>Catalog & Reading Archives</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-foreground">
              Discover Works
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-xl">
              Explore independent literature, published books, contemporary poetry, and personal journals.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-80">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search titles, authors, keywords..."
                className="w-full pl-10 pr-9 py-2 text-sm border border-border rounded-full bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-literary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    const p = new URLSearchParams(searchParams)
                    p.delete('search')
                    setSearchParams(p)
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Content Type Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => handleTabChange('all')}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              All Works
            </button>
            <button
              onClick={() => handleTabChange('poem')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'poem' || activeTab === 'poetry'
                  ? 'bg-terracotta text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Poetry</span>
            </button>
            <button
              onClick={() => handleTabChange('book')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'book'
                  ? 'bg-literary text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Books</span>
            </button>
            <button
              onClick={() => handleTabChange('journal')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'journal'
                  ? 'bg-emerald-700 text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Journals</span>
            </button>
            <button
              onClick={() => handleTabChange('story')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'story'
                  ? 'bg-indigo-700 text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Feather className="h-3.5 w-3.5" />
              <span>Short Stories</span>
            </button>
            <button
              onClick={() => handleTabChange('writers')}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'writers'
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Writers</span>
            </button>
          </div>

          {/* Toggle Advanced Filters Button */}
          {activeTab !== 'writers' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showFilters || genreFilter
                  ? 'border-literary text-literary bg-literary/10'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filters {genreFilter && `(1)`}</span>
            </button>
          )}
        </div>

        {/* Collapsible Refinement Filters */}
        {showFilters && activeTab !== 'writers' && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Sort By Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Sort order:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs border border-border rounded-lg bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-literary"
                >
                  <option value="latest">Latest Publications</option>
                  <option value="most_appreciated">Most Appreciated</option>
                  <option value="oldest">Earliest Archives</option>
                </select>
              </div>

              {/* Full Text Search Toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={useFullText}
                  onChange={(e) => setUseFullText(e.target.checked)}
                  className="rounded border-border text-literary focus:ring-literary"
                />
                <span>Include story manuscript body in search</span>
              </label>

              {/* Reset Filters */}
              {(genreFilter || searchQuery || useFullText || sortBy !== 'latest') && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 text-xs text-terracotta hover:underline font-medium"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset all filters</span>
                </button>
              )}
            </div>

            {/* Genre Filter Pills */}
            <div className="pt-2 border-t border-border/50">
              <span className="text-xs text-muted-foreground font-medium block mb-2">Filter by Genre:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setGenreFilter('')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    !genreFilter ? 'bg-literary text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All Genres
                </button>
                {genreOptions.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => setGenreFilter(genreFilter === genre ? '' : genre)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      genreFilter === genre
                        ? 'bg-literary text-white'
                        : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            WRITERS TAB VIEW
           ========================================================================= */}
        {activeTab === 'writers' ? (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-serif font-bold text-foreground">Featured Literary Authors</h2>
              <p className="text-xs text-muted-foreground">Follow authors to curate your personalized home feed.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {writersCatalog.map((writer) => (
                <AuthorCard
                  key={writer.username}
                  username={writer.username}
                  fullName={writer.fullName}
                  bio={writer.bio}
                  publicationsCount={writer.publicationsCount}
                  followersCount={writer.followersCount}
                />
              ))}
            </div>
          </div>
        ) : (
          /* =========================================================================
              WORKS & PUBLICATIONS GRID
             ========================================================================= */
          <div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-80 bg-muted/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-card border border-border rounded-xl space-y-3">
                <p className="text-sm text-destructive">{error}</p>
                <button
                  onClick={loadPosts}
                  className="px-4 py-2 bg-foreground text-background rounded-full text-xs font-medium hover:opacity-90"
                >
                  Retry Loading
                </button>
              </div>
            ) : posts.length > 0 ? (
              <div className="space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {posts.map((post) => {
                    if (post.content_type === 'book') {
                      return <BookCard key={post.id} post={post} />
                    }
                    if (post.content_type === 'poem' || post.content_type === 'poetry') {
                      return <PoemCard key={post.id} post={post} />
                    }
                    return <StoryCard key={post.id} post={post} />
                  })}
                </div>

                {/* Controlled Pagination */}
                {totalPosts > 18 && (
                  <div className="flex items-center justify-center gap-3 pt-6 border-t border-border/60">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 rounded-lg border border-border text-xs font-medium disabled:opacity-40 hover:bg-muted"
                    >
                      &larr; Previous Page
                    </button>
                    <span className="text-xs text-muted-foreground font-medium">
                      Page {page} of {Math.ceil(totalPosts / 18)}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(totalPosts / 18)}
                      className="px-4 py-2 rounded-lg border border-border text-xs font-medium disabled:opacity-40 hover:bg-muted"
                    >
                      Next Page &rarr;
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Editorial Empty State */
              <div className="text-center py-20 bg-card border border-border/80 rounded-2xl max-w-lg mx-auto p-8 space-y-4">
                <div className="w-12 h-12 rounded-full bg-literary/10 text-literary flex items-center justify-center mx-auto">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h3 className="font-serif font-bold text-xl text-foreground">
                  No matching publications found
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We could not find any publications matching your current query or filters.
                </p>
                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={clearAllFilters}
                    className="px-5 py-2.5 bg-literary text-white rounded-full text-xs font-medium hover:bg-literary-hover transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
