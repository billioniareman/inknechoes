from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.postgres import get_db
from app.schemas.comment_schema import CommentCreate, CommentResponse, CommentUpdate
from app.models.comment import Comment
from app.models.post import Post
from app.utils.dependencies import get_current_user
from app.models.user import User
router = APIRouter(prefix="/comments", tags=["comments"])


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new comment"""
    # Verify post exists
    post = db.query(Post).filter(Post.id == comment_data.post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Verify parent comment exists if provided
    if comment_data.parent_id:
        parent = db.query(Comment).filter(Comment.id == comment_data.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found"
            )
    
    comment = Comment(
        post_id=comment_data.post_id,
        author_id=current_user.id,
        parent_id=comment_data.parent_id,
        content=comment_data.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    
    # Add author username and like status
    comment.author_username = current_user.username
    comment.liked_by_user = False  # New comment, user hasn't liked it yet
    return comment


@router.get("/post/{post_id}", response_model=list[CommentResponse])
async def get_post_comments(
    post_id: int,
    db: Session = Depends(get_db)
):
    """Get all comments for a post"""
    comments = db.query(Comment).filter(
        Comment.post_id == post_id,
        Comment.parent_id == None
    ).order_by(Comment.created_at.asc()).all()
    
    # Add author usernames and like status (not authenticated for this endpoint)
    for comment in comments:
        author = db.query(User).filter(User.id == comment.author_id).first()
        comment.author_username = author.username if author else None
        comment.liked_by_user = False  # Public endpoint, no user context
    
    return comments


@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment_id: int,
    db: Session = Depends(get_db)
):
    """Get comment by ID"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    author = db.query(User).filter(User.id == comment.author_id).first()
    comment.author_username = author.username if author else None
    comment.liked_by_user = False  # Public endpoint, no user context
    return comment


@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: int,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update comment"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if comment.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this comment"
        )
    
    comment.content = comment_data.content
    db.commit()
    db.refresh(comment)
    
    comment.author_username = current_user.username
    comment.liked_by_user = current_user in comment.liked_by
    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete comment"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if comment.author_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )
    
    db.delete(comment)
    db.commit()
    return None


@router.post("/{comment_id}/like", response_model=CommentResponse)
async def like_comment(
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like/Unlike a comment (toggle)"""
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user already liked this comment
    already_liked = current_user in comment.liked_by
    
    if already_liked:
        # Unlike: remove user from liked_by and decrement count
        comment.liked_by.remove(current_user)
        comment.likes_count = max(0, comment.likes_count - 1)  # Ensure count doesn't go negative
    else:
        # Like: add user to liked_by and increment count
        comment.liked_by.append(current_user)
        comment.likes_count += 1
    
    db.commit()
    db.refresh(comment)
    
    author = db.query(User).filter(User.id == comment.author_id).first()
    comment.author_username = author.username if author else None
    comment.liked_by_user = current_user in comment.liked_by
    return comment


