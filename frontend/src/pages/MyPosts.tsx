import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { postsApi, Post } from '../api/posts'
import { collaborationApi } from '../api/collaboration'
import { Edit, Eye, Trash2, Users, BookOpen } from 'lucide-react'

export default function MyPosts() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'mine' | 'shared'>('mine')
  const [posts, setPosts] = useState<Post[]>([])
  const [collabPosts, setCollabPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [myPosts, shared] = await Promise.allSettled([
        postsApi.getMyPosts(true),
        collaborationApi.getMyCollaborations(),
      ])

      if (myPosts.status === 'fulfilled') {
        setPosts(myPosts.value || [])
      }
      if (shared.status === 'fulfilled') {
        setCollabPosts(shared.value?.collaborations || [])
      }
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
      loadData()
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post')
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 md:py-10 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground tracking-tight">Manuscripts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your publications and collaborative projects</p>
        </div>
        <Link
          to="/write"
          className="px-5 py-2.5 bg-literary text-white rounded-xl hover:opacity-90 transition-opacity text-sm font-medium shadow-sm"
        >
          New Manuscript
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-border/60 pb-1">
        <button
          onClick={() => setActiveTab('mine')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'mine'
              ? 'bg-secondary text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          My Works ({posts.length})
        </button>
        <button
          onClick={() => setActiveTab('shared')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'shared'
              ? 'bg-secondary text-foreground font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Shared With Me ({collabPosts.length})</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading manuscripts...</div>
      ) : activeTab === 'mine' ? (
        posts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/40">
            <BookOpen className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">No manuscripts yet</p>
            <p className="text-sm text-muted-foreground mb-4">Start drafting your first poem, article, or book</p>
            <Link
              to="/write"
              className="inline-block px-4 py-2 bg-literary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Write Your First Post
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div 
                key={post.id}
                className="bg-card border border-border/70 rounded-xl p-4 sm:p-5 shadow-sm hover:border-literary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-serif font-semibold text-foreground mb-1.5">{post.title}</h2>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-muted-foreground mb-2">
                      <span>
                        {new Date(post.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      {post.visibility === 'draft' ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-md text-[11px] font-medium">
                          Draft
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md text-[11px] font-medium">
                          Published
                        </span>
                      )}
                      <span className="capitalize">
                        {post.content_type === 'book' ? '📚 Book' : post.content_type === 'poetry' ? '📝 Poetry' : '📄 Article'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>❤️ {post.likes_count}</span>
                      <span>👏 {post.claps_count}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                    {post.visibility === 'public' && (
                      <Link
                        to={`/post/${post.slug}`}
                        className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                        title="View Post"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    )}
                    <button
                      onClick={() => navigate(`/write/${post.id}`)}
                      className="p-2 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors"
                      title="Edit in Studio"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                      title="Delete Post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Shared With Me tab */
        collabPosts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/40">
            <Users className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">No shared manuscripts</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              When other authors invite you to collaborate on their books, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {collabPosts.map((collab) => (
              <div 
                key={collab.id}
                className="bg-card border border-border/70 rounded-xl p-4 sm:p-5 shadow-sm hover:border-literary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-xl font-serif font-semibold text-foreground">{collab.title}</h2>
                      <span className="px-2 py-0.5 bg-literary/10 text-literary border border-literary/20 rounded-md text-[11px] font-medium capitalize">
                        {collab.role}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Author: <span className="font-medium text-foreground">@{collab.author_username}</span> • {collab.content_type}
                    </p>
                    <span className="text-[11px] text-muted-foreground">
                      Last updated {new Date(collab.updated_at || collab.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => navigate(`/write/${collab.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-literary text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity shadow-sm"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Open Studio</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}


