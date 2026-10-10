import { Post, PostWithContent } from '../api/posts'
import BookCard from './cards/BookCard'
import PoemCard from './cards/PoemCard'
import StoryCard from './cards/StoryCard'

interface PostCardProps {
  post: Post | PostWithContent
  showProgress?: boolean
  progressPercentage?: number
  chapterCount?: number
}

/**
 * Polymorphic PostCard that renders the optimal editorial card
 * based on the literary content_type (book, poem, story/article).
 */
export default function PostCard({
  post,
  showProgress = false,
  progressPercentage,
  chapterCount,
}: PostCardProps) {
  const type = post.content_type?.toLowerCase()

  if (type === 'book') {
    return (
      <BookCard
        post={post}
        showProgress={showProgress}
        progressPercentage={progressPercentage}
        chapterCount={chapterCount}
      />
    )
  }

  if (type === 'poem' || type === 'poetry') {
    return <PoemCard post={post} />
  }

  return <StoryCard post={post} />
}