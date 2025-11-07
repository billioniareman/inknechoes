import { Link } from 'react-router-dom'
import { Post, PostWithContent } from '../api/posts'
import { Heart, Hand, BookOpen, User } from 'lucide-react'

interface PostCardProps {
  post: Post | PostWithContent
  showProgress?: boolean
  progressPercentage?: number
}

export default function PostCard({ post, showProgress = false, progressPercentage }: PostCardProps) {
  const getContentTypeIcon = () => {
    switch (post.content_type) {
      case 'book':
        return <BookOpen className="w-4 h-4" />
      case 'poetry':
        return '📝'
      default:
        return '📄'
    }
  }

  const getContentTypeColor = () => {
    switch (post.content_type) {
      case 'book':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'poetry':
        return 'bg-pink-100 text-pink-800 border-pink-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const coverImageUrl = post.cover_image_url || ('content' in post ? post.content?.cover_image_url : undefined)

  return (
    <div className="group relative overflow-hidden border border-amber-200/50 rounded-lg bg-white/60 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Cover Image */}
      {coverImageUrl && (
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200">
          <img
            src={coverImageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Hide image on error
              e.currentTarget.style.display = 'none'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-amber-800/60">{getContentTypeIcon()}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getContentTypeColor()}`}>
                {post.content_type || 'article'}
              </span>
            </div>
            <Link to={`/post/${post.slug}`}>
              <h2 className="text-2xl font-serif font-semibold mb-3 text-amber-900 hover:text-amber-800 transition-colors line-clamp-2">
                {post.title}
              </h2>
            </Link>
            <div className="flex items-center gap-4 text-sm text-amber-800/70 mb-2 flex-wrap">
              {post.author_username && (
                <Link
                  to={`/user/${post.author_username}`}
                  className="flex items-center gap-1 hover:text-amber-900 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <User className="w-3 h-3" />
                  <span className="font-medium">{post.author_username}</span>
                </Link>
              )}
              <span>
                {new Date(post.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {post.likes_count}
                </span>
                <span className="flex items-center gap-1">
                  <Hand className="w-4 h-4" />
                  {post.claps_count}
                </span>
              </div>
            </div>
            {showProgress && progressPercentage !== undefined && (
              <div className="mt-3">
                <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-800 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="text-xs text-amber-800/60 mt-1">
                  {Math.round(progressPercentage)}% complete
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}