import { Link } from 'react-router-dom'
import { Post, PostWithContent } from '../../api/posts'
import { BookOpen } from 'lucide-react'

interface BookCardProps {
  post: Post | PostWithContent
  showProgress?: boolean
  progressPercentage?: number
  chapterCount?: number
}

export default function BookCard({
  post,
  showProgress = false,
  progressPercentage,
  chapterCount
}: BookCardProps) {
  const coverImageUrl = post.cover_image_url || ('content' in post ? post.content?.cover_image_url : undefined)
  const description = 'content' in post ? post.content?.description : undefined

  return (
    <article className="group flex flex-col h-full bg-card border border-border/80 rounded-xl overflow-hidden hover:border-literary/50 hover:shadow-lg transition-all duration-300">
      {/* Book Cover with 3:4 Aspect Ratio & Book Spine illusion */}
      <Link to={`/post/${post.slug}`} className="relative block aspect-[3/4] w-full overflow-hidden bg-muted/60">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col justify-between p-6 bg-gradient-to-br from-literary/15 via-muted to-border/40">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-sans uppercase tracking-widest text-literary font-semibold">Book</span>
              <BookOpen className="h-4 w-4 text-literary/70" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg sm:text-xl text-foreground line-clamp-3 leading-snug">
                {post.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-2 font-serif italic">
                {post.author_username || 'Anonymous'}
              </p>
            </div>
            <div className="text-[11px] text-muted-foreground font-sans">
              Ink&Echoes Editions
            </div>
          </div>
        )}

        {/* Subtle spine shadow on the left */}
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/25 to-transparent pointer-events-none" />

        {/* Content badge */}
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm border border-border/60 text-foreground text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
          Book
        </div>
      </Link>

      {/* Book Metadata & Title */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          <Link to={`/post/${post.slug}`}>
            <h3 className="font-serif font-bold text-lg text-foreground hover:text-literary transition-colors line-clamp-2 leading-snug">
              {post.title}
            </h3>
          </Link>

          {post.author_username && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>by</span>
              <Link
                to={`/user/${post.author_username}`}
                className="font-medium text-foreground hover:text-literary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {post.author_username}
              </Link>
            </div>
          )}

          {description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {chapterCount ? (
              <span>{chapterCount} chapters</span>
            ) : (
              <span>Manuscript</span>
            )}
          </div>

          <Link
            to={`/post/${post.slug}`}
            className="text-literary hover:text-literary-hover font-medium flex items-center gap-1"
          >
            <span>Read</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        {/* Reading Progress */}
        {showProgress && progressPercentage !== undefined && (
          <div className="mt-3">
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div
                className="h-full bg-literary transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 flex justify-between">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
