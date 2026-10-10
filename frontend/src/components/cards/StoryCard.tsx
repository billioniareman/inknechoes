import { Link } from 'react-router-dom'
import { Post, PostWithContent } from '../../api/posts'
import { Clock, Heart, FileText } from 'lucide-react'

interface StoryCardProps {
  post: Post | PostWithContent
}

export default function StoryCard({ post }: StoryCardProps) {
  const coverImageUrl = post.cover_image_url || ('content' in post ? post.content?.cover_image_url : undefined)
  const description = 'content' in post ? post.content?.description : undefined
  const tags = 'content' in post && Array.isArray(post.content?.tags) ? post.content.tags : []

  // Estimate reading time if body is available (~200 wpm)
  const readingTimeMinutes = Math.max(1, Math.ceil((post.title.length * 5) / 200))

  return (
    <article className="group flex flex-col justify-between h-full bg-card border border-border/80 rounded-xl overflow-hidden hover:border-literary/40 hover:shadow-md transition-all duration-300">
      <div>
        {coverImageUrl && (
          <Link to={`/post/${post.slug}`} className="block aspect-[16/9] w-full overflow-hidden bg-muted">
            <img
              src={coverImageUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          </Link>
        )}

        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-sans uppercase tracking-wider text-literary font-semibold">
              <FileText className="h-3 w-3" />
              <span>{post.content_type || 'Story'}</span>
            </span>

            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="h-3 w-3" />
              <span>{readingTimeMinutes} min read</span>
            </span>
          </div>

          <Link to={`/post/${post.slug}`}>
            <h3 className="font-serif font-bold text-xl text-foreground hover:text-literary transition-colors mb-2 line-clamp-2 leading-snug">
              {post.title}
            </h3>
          </Link>

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
              {description}
            </p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        {post.author_username && (
          <Link
            to={`/user/${post.author_username}`}
            className="flex items-center gap-1.5 font-medium text-foreground hover:text-literary transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-literary/15 text-literary flex items-center justify-center text-[10px] font-bold">
              {post.author_username[0].toUpperCase()}
            </div>
            <span>{post.author_username}</span>
          </Link>
        )}

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            <span>{post.likes_count || 0}</span>
          </span>

          <Link
            to={`/post/${post.slug}`}
            className="text-literary hover:text-literary-hover font-medium ml-2"
          >
            Read &rarr;
          </Link>
        </div>
      </div>
    </article>
  )
}
