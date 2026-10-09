import { Link } from 'react-router-dom'
import { Post, PostWithContent } from '../../api/posts'
import { Sparkles, Heart } from 'lucide-react'

interface PoemCardProps {
  post: Post | PostWithContent
  excerpt?: string
}

export default function PoemCard({ post, excerpt }: PoemCardProps) {
  // Extract clean text snippet for excerpt if body is available
  const bodyText = 'content' in post && post.content?.body ? post.content.body : ''
  const displayExcerpt: string[] = excerpt
    ? (excerpt.includes('\n') ? excerpt.split('\n') : [excerpt]).filter(Boolean).slice(0, 4)
    : extractPoemExcerpt(bodyText)

  function extractPoemExcerpt(html: string): string[] {
    if (!html) return []
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    const paragraphs = tempDiv.querySelectorAll('p')
    const lines: string[] = []
    
    paragraphs.forEach((p) => {
      const text = p.textContent?.trim()
      if (text) lines.push(text)
    })

    if (lines.length === 0) {
      const allText = tempDiv.textContent || ''
      return allText.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 4)
    }

    return lines.slice(0, 4)
  }

  return (
    <article className="group flex flex-col justify-between h-full bg-card border border-border/80 rounded-xl p-5 sm:p-6 hover:border-literary/40 hover:shadow-md transition-all duration-300">
      <div>
        {/* Top Type Indicator */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="inline-flex items-center gap-1 text-[11px] font-sans uppercase tracking-widest text-terracotta font-semibold">
            <Sparkles className="h-3 w-3" />
            <span>Poetry</span>
          </span>
          <span className="text-[11px] text-muted-foreground">
            {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>

        {/* Poem Title */}
        <Link to={`/post/${post.slug}`}>
          <h3 className="font-serif font-bold text-xl text-foreground hover:text-literary transition-colors mb-2 leading-tight">
            {post.title}
          </h3>
        </Link>

        {/* Poet Attribution */}
        {post.author_username && (
          <div className="text-xs text-muted-foreground font-serif italic mb-4">
            by{' '}
            <Link
              to={`/user/${post.author_username}`}
              className="text-foreground hover:text-literary font-sans not-italic font-medium transition-colors"
            >
              {post.author_username}
            </Link>
          </div>
        )}

        {/* Stanza Excerpt */}
        {displayExcerpt.length > 0 ? (
          <div className="space-y-1 my-4 pl-3 border-l-2 border-literary/30 font-reading text-sm sm:text-base text-foreground/85 italic leading-relaxed">
            {displayExcerpt.map((line, idx) => (
              <p key={idx} className="truncate">{line}</p>
            ))}
          </div>
        ) : (
          <div className="my-4 pl-3 border-l-2 border-literary/30 font-reading text-sm text-muted-foreground italic">
            Lines composed in stillness...
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 mt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{post.likes_count || 0}</span>
        </span>

        <Link
          to={`/post/${post.slug}`}
          className="text-literary hover:text-literary-hover font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Read poem</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </article>
  )
}
