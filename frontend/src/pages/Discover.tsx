import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { postsApi, Post } from '../api/posts'
import PostCard from '../components/PostCard'
import TrendingTags from '../components/TrendingTags'
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page] = useState(1)
  const [sortBy, setSortBy] = useState('latest')
  const [contentType, setContentType] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [authorFilter, setAuthorFilter] = useState('')
  const [genreFilter, setGenreFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [useFullText, setUseFullText] = useState(false)

  useEffect(() => {
    // Get search query from URL params
    const urlSearch = searchParams.get('search')
    if (urlSearch) {
      setSearchQuery(urlSearch)
    }
  }, [searchParams])

  useEffect(() => {
    loadPosts()
  }, [page, sortBy, contentType, searchQuery, authorFilter, genreFilter, startDate, endDate, useFullText])

  const loadPosts = async () => {
    try {
      setLoading(true)

      // Use advanced search if any advanced filters are set
      const useAdvanced = authorFilter || genreFilter || startDate || endDate || useFullText

      if (useAdvanced) {
        const data = await postsApi.searchPosts({
          page,
          page_size: 20,
          sort_by: sortBy,
          search: searchQuery || undefined,
          author: authorFilter || undefined,
          content_type: contentType || undefined,
          genre: genreFilter || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          full_text: useFullText
        })
        setPosts(data.posts)
      } else {
        // Use simple search
        const data = await postsApi.getPosts(page, 20, sortBy, searchQuery || undefined, contentType || undefined)
        setPosts(data.posts)
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadPosts()
  }

  const clearFilters = () => {
    setContentType(null)
    setSearchQuery('')
    setAuthorFilter('')
    setGenreFilter('')
    setStartDate('')
    setEndDate('')
    setUseFullText(false)
    setSearchParams({})
  }

  const hasFilters = contentType || searchQuery || authorFilter || genreFilter || startDate || endDate

  const contentTypes = [
    { value: null, label: 'All Types' },
    { value: 'article', label: 'Articles' },
    { value: 'poetry', label: 'Poetry' },
    { value: 'book', label: 'Books' },
  ]

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-amber-900 mb-1 sm:mb-2">Discover Stories</h1>
          <p className="text-sm sm:text-base text-amber-800/70">Explore works from talented authors</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full md:w-auto px-3 sm:px-4 py-2 text-base sm:text-sm border border-amber-200 rounded-md bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="most_appreciated">Most Appreciated</option>
          </select>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
        <form onSubmit={handleSearch} className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories..."
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 text-base sm:text-sm border border-amber-200 rounded-lg bg-white text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </form>

        {/* Basic Filter Chips */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-amber-800/70" />
          {contentTypes.map((type) => (
            <button
              key={type.value || 'all'}
              onClick={() => setContentType(type.value)}
              className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${contentType === type.value
                ? 'bg-amber-800 text-amber-50'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
            >
              {type.label}
            </button>
          ))}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-amber-200 text-amber-800 hover:bg-amber-300 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 flex items-center gap-1"
          >
            {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Advanced
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-amber-900 text-sm mb-2">Advanced Filters</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Author Filter */}
              <div>
                <label className="block text-xs font-medium text-amber-800 mb-1">Author Username</label>
                <input
                  type="text"
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  placeholder="e.g. john_doe"
                  className="w-full px-3 py-1.5 text-sm border border-amber-200 rounded-md bg-white text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Genre/Tag Filter */}
              <div>
                <label className="block text-xs font-medium text-amber-800 mb-1">Genre/Tag</label>
                <input
                  type="text"
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                  placeholder="e.g. sci-fi, romance"
                  className="w-full px-3 py-1.5 text-sm border border-amber-200 rounded-md bg-white text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-xs font-medium text-amber-800 mb-1">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-amber-200 rounded-md bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs font-medium text-amber-800 mb-1">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-amber-200 rounded-md bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Full-text Search Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="fulltext"
                checked={useFullText}
                onChange={(e) => setUseFullText(e.target.checked)}
                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <label htmlFor="fulltext" className="text-xs text-amber-800">
                Search in post content (slower, more comprehensive)
              </label>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-amber-800">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white/40 border border-amber-200/50 rounded-lg">
          <p className="text-amber-700 text-lg">No posts found.</p>
          <p className="text-amber-600/70 text-sm mt-2">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>

          {/* Sidebar with Trending Tags */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <TrendingTags />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
