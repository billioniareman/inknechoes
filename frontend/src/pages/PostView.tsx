import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { postsApi, PostWithContent } from '../api/posts'
import { useUserStore } from '../store/userStore'
import CommentSection from '../components/CommentSection'
import PoetryScroll from '../components/PoetryScroll'
import BookViewer from '../components/BookViewer'
import { Heart, Hand } from 'lucide-react'

export default function PostView() {
  const { slug } = useParams<{ slug: string }>()
  const { isAuthenticated } = useUserStore()
  const [post, setPost] = useState<PostWithContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [engagement, setEngagement] = useState<{
    is_liked: boolean
    has_clapped: boolean
    likes_count: number
    claps_count: number
  } | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (slug) {
      loadPost()
    }
  }, [slug])

  useEffect(() => {
    if (post && isAuthenticated) {
      loadEngagement()
    }
  }, [post, isAuthenticated])

  const loadPost = async () => {
    try {
      setLoading(true)
      const data = await postsApi.getPostBySlug(slug!)
      setPost(data)
      if (isAuthenticated) {
        loadEngagement()
      } else {
        setEngagement({
          is_liked: false,
          has_clapped: false,
          likes_count: data.likes_count,
          claps_count: data.claps_count,
        })
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Post not found')
    } finally {
      setLoading(false)
    }
  }

  const loadEngagement = async () => {
    if (!post) return
    try {
      const data = await postsApi.getPostEngagement(post.id)
      setEngagement(data)
    } catch (error) {
      // If not authenticated, use post counts
      setEngagement({
        is_liked: false,
        has_clapped: false,
        likes_count: post.likes_count,
        claps_count: post.claps_count,
      })
    }
  }

  const handleLike = async () => {
    if (!post || !isAuthenticated || updating) return
    setUpdating(true)
    try {
      const updated = await postsApi.likePost(post.id)
      setPost({ ...post, ...updated })
      setEngagement({
        is_liked: !engagement?.is_liked,
        has_clapped: engagement?.has_clapped || false,
        likes_count: updated.likes_count,
        claps_count: updated.claps_count,
      })
    } catch (error) {
      console.error('Error liking post:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleClap = async () => {
    if (!post || !isAuthenticated || updating) return
    setUpdating(true)
    try {
      const updated = await postsApi.clapPost(post.id)
      setPost({ ...post, ...updated })
      setEngagement({
        is_liked: engagement?.is_liked || false,
        has_clapped: true,
        likes_count: updated.likes_count,
        claps_count: updated.claps_count,
      })
    } catch (error) {
      console.error('Error clapping post:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (error || !post) {
    return <div className="text-center py-16">{error || 'Post not found'}</div>
  }

  // Render based on content type
  if (post.content_type === 'poetry') {
    return (
      <>
        <PoetryScroll
          title={post.title}
          content={post.content.body}
          date={post.created_at}
        />
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Engagement buttons */}
          <div className="flex items-center gap-4 mb-8 justify-center">
            <button
              onClick={handleLike}
              disabled={!isAuthenticated || updating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                engagement?.is_liked
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`w-5 h-5 ${engagement?.is_liked ? 'fill-current' : ''}`} />
              <span>{engagement?.likes_count || 0}</span>
            </button>
            <button
              onClick={handleClap}
              disabled={!isAuthenticated || updating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                engagement?.has_clapped
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Hand className="w-5 h-5" />
              <span>{engagement?.claps_count || 0}</span>
            </button>
          </div>

          {/* Tags */}
          {post.content.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {post.content.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <CommentSection postId={post.id} />
        </div>
      </>
    )
  }

  if (post.content_type === 'book') {
    return (
      <>
        <BookViewer
          title={post.title}
          content={post.content.body}
          date={post.created_at}
          postId={post.id}
          coverImageUrl={post.content.cover_image_url}
          description={post.content.description}
        />
        <div className="max-w-4xl mx-auto py-8 px-4">
          {/* Engagement buttons */}
          <div className="flex items-center gap-4 mb-8 justify-center">
            <button
              onClick={handleLike}
              disabled={!isAuthenticated || updating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                engagement?.is_liked
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Heart className={`w-5 h-5 ${engagement?.is_liked ? 'fill-current' : ''}`} />
              <span>{engagement?.likes_count || 0}</span>
            </button>
            <button
              onClick={handleClap}
              disabled={!isAuthenticated || updating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                engagement?.has_clapped
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Hand className="w-5 h-5" />
              <span>{engagement?.claps_count || 0}</span>
            </button>
          </div>

          {/* Tags */}
          {post.content.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {post.content.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <CommentSection postId={post.id} />
        </div>
      </>
    )
  }

  // Default article view
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <article>
        <h1 className="text-5xl font-serif font-bold mb-6 leading-tight text-amber-900">
          {post.title}
        </h1>
        <p className="text-muted-foreground mb-8">
          {new Date(post.created_at).toLocaleDateString()}
        </p>

        {/* Engagement buttons */}
        {isAuthenticated && (
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={handleLike}
              disabled={updating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                engagement?.is_liked
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Heart className={`w-5 h-5 ${engagement?.is_liked ? 'fill-current' : ''}`} />
              <span>{engagement?.likes_count || 0}</span>
            </button>
            <button
              onClick={handleClap}
              disabled={updating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                engagement?.has_clapped
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Hand className="w-5 h-5" />
              <span>{engagement?.claps_count || 0}</span>
            </button>
          </div>
        )}

        <div
          className="prose prose-lg max-w-none text-amber-900/90"
          style={{
            fontFamily: "'Playfair Display', 'Georgia', serif",
          }}
          dangerouslySetInnerHTML={{ __html: post.content.body }}
        />
        {post.content.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.content.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      <CommentSection postId={post.id} />
    </div>
  )
}

