import { useState, useEffect } from 'react'
import { useUserStore } from '../store/userStore'
import { commentsApi, Comment } from '../api/comments'
import { Heart } from 'lucide-react'

interface CommentSectionProps {
  postId: number
}

export default function CommentSection({ postId }: CommentSectionProps) {
  const { isAuthenticated } = useUserStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadComments()
  }, [postId])

  const loadComments = async () => {
    try {
      const data = await commentsApi.getPostComments(postId)
      setComments(data)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !isAuthenticated) return

    try {
      await commentsApi.createComment({
        post_id: postId,
        content: newComment,
      })
      setNewComment('')
      loadComments()
    } catch (error) {
      console.error('Error creating comment:', error)
    }
  }

  const handleLike = async (commentId: number) => {
    if (!isAuthenticated) return
    try {
      await commentsApi.likeComment(commentId)
      loadComments()
    } catch (error) {
      console.error('Error liking comment:', error)
    }
  }

  if (loading) {
    return <div className="mt-8">Loading comments...</div>
  }

  return (
    <div className="mt-12 pt-8 border-t border-border/50">
      <h3 className="text-3xl font-serif font-semibold mb-6">Comments</h3>

      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-3 border border-border rounded-md resize-none"
            rows={4}
          />
          <button
            type="submit"
            className="mt-2 px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 font-medium"
          >
            Post Comment
          </button>
        </form>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border border-border/50 rounded-lg p-5 bg-white/50 mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-foreground">{comment.author_username}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
              <p className="mb-3 text-foreground leading-relaxed">{comment.content}</p>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleLike(comment.id)}
                  className="flex items-center space-x-1 text-muted-foreground hover:text-foreground"
                >
                  <Heart className="h-4 w-4" />
                  <span>{comment.likes_count}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

