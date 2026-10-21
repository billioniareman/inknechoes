import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { postsApi, PostWithContent } from '../api/posts'
import { useUserStore } from '../store/userStore'
import CommentSection from '../components/CommentSection'
import PoetryScroll from '../components/PoetryScroll'
import BookViewer from '../components/BookViewer'
import DictionaryPopup from '../components/DictionaryPopup'
import SEO from '../components/SEO'
import ShareButtons from '../components/ShareButtons'
import FollowButton from '../components/FollowButton'
import { useDictionary } from '../hooks/useDictionary'
import { useAnalytics } from '../hooks/useAnalytics'
import { Heart, Hand, FileText, BookOpen, Clock, ArrowLeft } from 'lucide-react'

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

  // Dictionary functionality
  const {
    selectedWord,
    dictionaryData,
    popupPosition: dictionaryPosition,
    isLoading: isDictionaryLoading,
    showPopup: showDictionaryPopup,
    closePopup: closeDictionaryPopup,
  } = useDictionary({ enabled: true })

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
      console.error('Error loading post:', err)
      setError('Publication not found or has been withdrawn.')
    } finally {
      setLoading(false)
    }
  }

  const loadEngagement = async () => {
    if (!post) return
    try {
      const data = await postsApi.getPostEngagement(post.id)
      setEngagement(data)
    } catch (err) {
      console.error('Error loading engagement:', err)
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
    } catch (err) {
      console.error('Error liking post:', err)
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
    } catch (err) {
      console.error('Error clapping post:', err)
    } finally {
      setUpdating(false)
    }
  }

  // Track analytics
  useAnalytics(post?.id)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-literary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-serif italic text-muted-foreground">Opening manuscript...</span>
        </div>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h2 className="font-serif font-bold text-2xl text-foreground mb-2">Manuscript Unavailable</h2>
        <p className="text-sm text-muted-foreground mb-6">{error || 'This work could not be located.'}</p>
        <Link
          to="/discover"
          className="px-5 py-2.5 bg-foreground text-background rounded-full text-xs font-medium"
        >
          Return to Discover
        </Link>
      </div>
    )
  }

  const isPoetry = post.content_type === 'poem' || post.content_type === 'poetry'
  const isBook = post.content_type === 'book'
  const readingTimeMinutes = Math.max(1, Math.ceil((post.content?.body?.length || 200) / 900))

  // Render Poetry View
  if (isPoetry) {
    return (
      <>
        <SEO
          title={`${post.title} | Ink&Echoes`}
          description={post.content.description || post.content.body.substring(0, 200)}
          image={post.content.cover_image_url}
          url={`/post/${post.slug}`}
          type="article"
          author={post.author_username}
          publishedTime={post.created_at}
          tags={post.content.tags}
        />
        <PoetryScroll
          title={post.title}
          content={post.content.body}
          author={post.author_username}
          date={post.created_at}
        />
        <div className="max-w-2xl mx-auto py-8 px-4 border-t border-border/60">
          <div className="flex items-center justify-between gap-4 mb-8">
            <ShareButtons
              url={`/post/${post.slug}`}
              title={post.title}
              description={post.content.description}
            />

            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                disabled={!isAuthenticated || updating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                  engagement?.is_liked
                    ? 'border-terracotta bg-terracotta/10 text-terracotta'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${engagement?.is_liked ? 'fill-current' : ''}`} />
                <span>{engagement?.likes_count || 0}</span>
              </button>

              <button
                onClick={handleClap}
                disabled={!isAuthenticated || updating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                  engagement?.has_clapped
                    ? 'border-literary bg-literary/10 text-literary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span>{engagement?.claps_count || 0}</span>
              </button>
            </div>
          </div>

          <CommentSection postId={post.id} />
        </div>
      </>
    )
  }

  // Render Book View
  if (isBook) {
    return (
      <>
        <SEO
          title={`${post.title} | Ink&Echoes`}
          description={post.content.description || post.content.body.substring(0, 200)}
          image={post.content.cover_image_url}
          url={`/post/${post.slug}`}
          type="article"
          author={post.author_username}
          publishedTime={post.created_at}
          tags={post.content.tags}
        />
        <BookViewer
          title={post.title}
          content={post.content.body}
          author={post.author_username}
          date={post.created_at}
          postId={post.id}
          coverImageUrl={post.content.cover_image_url}
          description={post.content.description}
        />
        <div className="max-w-4xl mx-auto py-8 px-4 border-t border-border/60">
          <div className="flex items-center justify-between gap-4 mb-8">
            <ShareButtons
              url={`/post/${post.slug}`}
              title={post.title}
              description={post.content.description}
            />
            <div className="flex items-center gap-2">
              <a
                href={`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/export/pdf/${post.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted text-foreground"
              >
                <FileText className="w-3.5 h-3.5 text-literary" />
                <span>PDF</span>
              </a>
              <a
                href={`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/export/epub/${post.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted text-foreground"
              >
                <BookOpen className="w-3.5 h-3.5 text-literary" />
                <span>EPUB</span>
              </a>
            </div>
          </div>
          <CommentSection postId={post.id} />
        </div>
      </>
    )
  }

  // Default Editorial Article / Story Reading View
  return (
    <>
      <SEO
        title={`${post.title} | Ink&Echoes`}
        description={post.content.description || post.content.body.substring(0, 200)}
        image={post.content.cover_image_url}
        url={`/post/${post.slug}`}
        type="article"
        author={post.author_username}
        publishedTime={post.created_at}
        tags={post.content.tags}
      />

      <div className="min-h-screen bg-background text-foreground py-8 sm:py-14 px-4 transition-colors">
        <article className="max-w-3xl mx-auto">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link
              to="/discover"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-literary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Discover</span>
            </Link>
          </div>

          {/* Article Header */}
          <header className="space-y-4 pb-8 mb-8 border-b border-border/70">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-sans font-semibold">
              <span className="text-literary">{post.content_type || 'Story'}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{readingTimeMinutes} min read</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground leading-[1.15]">
              {post.title}
            </h1>

            {post.content.description && (
              <p className="text-lg sm:text-xl font-reading italic text-muted-foreground leading-relaxed">
                {post.content.description}
              </p>
            )}

            {/* Author Attribution Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
              <div className="flex items-center gap-3">
                {post.author_username && (
                  <Link
                    to={`/user/${post.author_username}`}
                    className="w-10 h-10 rounded-full bg-literary/15 text-literary flex items-center justify-center font-serif font-bold text-sm"
                  >
                    {post.author_username[0].toUpperCase()}
                  </Link>
                )}
                <div>
                  <Link
                    to={`/user/${post.author_username}`}
                    className="font-medium text-sm text-foreground hover:text-literary transition-colors"
                  >
                    {post.author_username}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {post.author_username && (
                <FollowButton
                  username={post.author_username}
                  initialIsFollowing={false}
                />
              )}
            </div>
          </header>

          {/* Cover Artwork if provided */}
          {post.content.cover_image_url && (
            <div className="mb-10 rounded-xl overflow-hidden border border-border/60 aspect-[16/9]">
              <img
                src={post.content.cover_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Core Long-form Reading Column (65-75ch measure) */}
          <div
            className="prose prose-lg max-w-none font-reading text-foreground/90 leading-[1.8] text-[19px] sm:text-[20px] selection:bg-literary/20 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content.body }}
          />

          {/* Tags */}
          {post.content.tags && post.content.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-12 pt-6 border-t border-border/60">
              {post.content.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Engagement & Share Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-8 py-5 border-y border-border/70">
            <div className="flex items-center gap-3">
              <button
                onClick={handleLike}
                disabled={!isAuthenticated || updating}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs sm:text-sm font-medium transition-colors ${
                  engagement?.is_liked
                    ? 'border-terracotta bg-terracotta/10 text-terracotta'
                    : 'border-border text-foreground hover:bg-muted'
                }`}
              >
                <Heart className={`w-4 h-4 ${engagement?.is_liked ? 'fill-current' : ''}`} />
                <span>{engagement?.likes_count || 0}</span>
              </button>

              <button
                onClick={handleClap}
                disabled={!isAuthenticated || updating}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs sm:text-sm font-medium transition-colors ${
                  engagement?.has_clapped
                    ? 'border-literary bg-literary/10 text-literary'
                    : 'border-border text-foreground hover:bg-muted'
                }`}
              >
                <Hand className="w-4 h-4" />
                <span>{engagement?.claps_count || 0}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <ShareButtons
                url={`/post/${post.slug}`}
                title={post.title}
                description={post.content.description}
              />

              <div className="flex items-center gap-1.5">
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/export/pdf/${post.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted text-foreground"
                  title="Download PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-literary" />
                  <span>PDF</span>
                </a>
                <a
                  href={`${import.meta.env.VITE_API_BASE_URL || ''}/api/v1/export/epub/${post.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-muted text-foreground"
                  title="Download EPUB"
                >
                  <BookOpen className="w-3.5 h-3.5 text-literary" />
                  <span>EPUB</span>
                </a>
              </div>
            </div>
          </div>

          {/* Author Bio Banner */}
          {post.author_username && (
            <div className="my-10 p-6 bg-card border border-border/80 rounded-2xl flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-literary/15 text-literary flex items-center justify-center font-serif font-bold text-lg flex-shrink-0">
                {post.author_username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-serif font-bold text-base text-foreground">
                    Written by {post.author_username}
                  </h4>
                  <FollowButton username={post.author_username} initialIsFollowing={false} />
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Independent writer published on Ink&Echoes. Explore more works by this author in the library archives.
                </p>
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="mt-12">
            <CommentSection postId={post.id} />
          </div>
        </article>

        {/* Dictionary Word Lookup Popup */}
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
    </>
  )
}
