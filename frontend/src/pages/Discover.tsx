import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { postsApi, Post } from '../api/posts'
import PostCard from '../components/PostCard'
import { Search, TrendingUp, Clock, Filter, X } from 'lucide-react'

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [page] = useState(1)
  const [sortBy, setSortBy] = useState('latest')
  const [contentType, setContentType] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  useEffect(() => {
    // Get search query from URL params
    const urlSearch = searchParams.get('search')
    if (urlSearch) {
      setSearchQuery(urlSearch)
    }
  }, [searchParams])

  useEffect(() => {
    loadPosts()
  }, [page, sortBy, contentType, searchQuery])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const data = await postsApi.getPosts(page, 20, sortBy, searchQuery || undefined, contentType || undefined)
      setPosts(data.posts)
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
    setSearchParams({})
  }

  const contentTypes = [
    { value: null, label: 'All Types' },
    { value: 'article', label: 'Articles' },
    { value: 'poetry', label: 'Poetry' },
    { value: 'book', label: 'Books' },
  ]

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-amber-900 mb-2">Discover Stories</h1>
          <p className="text-amber-800/70">Explore works from talented authors</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-amber-200 rounded-md bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="latest">Latest</option>
            <option value="most_appreciated">Most Appreciated</option>
          </select>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-600 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories..."
            className="w-full pl-10 pr-4 py-2 border border-amber-200 rounded-lg bg-white text-amber-900 placeholder-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </form>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-amber-800/70" />
          {contentTypes.map((type) => (
            <button
              key={type.value || 'all'}
              onClick={() => setContentType(type.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                contentType === type.value
                  ? 'bg-amber-800 text-amber-50'
                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
              }`}
            >
              {type.label}
            </button>
          ))}
          {(contentType || searchQuery) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1 rounded-full text-sm font-medium bg-amber-200 text-amber-800 hover:bg-amber-300 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-amber-800">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 bg-white/40 border border-amber-200/50 rounded-lg">
          <p className="text-amber-700 text-lg">No posts found.</p>
          <p className="text-amber-600/70 text-sm mt-2">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}

