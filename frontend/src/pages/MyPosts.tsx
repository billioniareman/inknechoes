import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { postsApi, Post } from '../api/posts'
import { Edit, Eye, Trash2 } from 'lucide-react'

export default function MyPosts() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const data = await postsApi.getMyPosts(true) // Include drafts
      setPosts(data)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    try {
      await postsApi.deletePost(postId)
      loadPosts() // Reload posts after deletion
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-4 sm:py-6 md:py-8 px-3 sm:px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-amber-900">My Posts</h1>
        <Link
          to="/write"
          className="w-full sm:w-auto px-4 py-2 bg-amber-800 text-amber-50 rounded-md hover:bg-amber-900 transition-colors text-center text-sm sm:text-base"
        >
          New Post
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-16 text-amber-800">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-amber-800 mb-4">No posts yet.</p>
          <Link
            to="/write"
            className="inline-block px-4 py-2 bg-amber-800 text-amber-50 rounded-md hover:bg-amber-900 transition-colors"
          >
            Write Your First Post
          </Link>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {posts.map((post) => (
            <div 
              key={post.id}
              className="bg-white/60 border border-amber-200/50 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-serif font-semibold mb-2 text-amber-900">{post.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-amber-800/70 mb-2 sm:mb-3">
                    <span>
                      {new Date(post.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    {post.visibility === 'draft' && (
                      <span className="px-2 py-0.5 sm:py-1 bg-amber-100 text-amber-800 rounded text-xs font-medium">
                        Draft
                      </span>
                    )}
                    {post.visibility === 'public' && (
                      <span className="px-2 py-0.5 sm:py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        Published
                      </span>
                    )}
                    <span className="text-amber-800/60">
                      {post.content_type === 'book' ? '📚 Book' : post.content_type === 'poetry' ? '📝 Poetry' : '📄 Article'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-800/60">
                    <span>❤️ {post.likes_count}</span>
                    <span>👏 {post.claps_count}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  {post.visibility === 'public' && (
                    <Link
                      to={`/post/${post.slug}`}
                      className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                      title="View Post"
                    >
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-amber-800" />
                    </Link>
                  )}
                  <button
                    onClick={() => navigate(`/write/${post.id}`)}
                    className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                    title="Edit Post"
                  >
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-amber-800" />
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

