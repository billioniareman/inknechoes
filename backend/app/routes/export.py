from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import Optional
from app.database.postgres import get_db
from app.models.post import Post
from app.models.user import User
from app.services import export_service
from app.services.post_service import get_post_content
from app.utils.dependencies import get_optional_current_user

router = APIRouter(prefix="/export", tags=["export"])

@router.get("/pdf/{post_id}")
async def export_pdf(
    post_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Export post as PDF.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Check visibility: public posts can be exported by anyone, non-public only by author/admin
    if post.visibility != 'public':
        if not current_user or (post.author_id != current_user.id and not current_user.is_admin):
            raise HTTPException(status_code=403, detail="Not authorized to export this post")
        
    content = await get_post_content(post.mongo_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
        
    author = db.query(User).filter(User.id == post.author_id).first()
    
    pdf_content = export_service.generate_pdf(post, content, author)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={post.slug}.pdf"}
    )

@router.get("/epub/{post_id}")
async def export_epub(
    post_id: int,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Export post as EPUB.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    # Check visibility: public posts can be exported by anyone, non-public only by author/admin
    if post.visibility != 'public':
        if not current_user or (post.author_id != current_user.id and not current_user.is_admin):
            raise HTTPException(status_code=403, detail="Not authorized to export this post")
        
    content = await get_post_content(post.mongo_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
        
    author = db.query(User).filter(User.id == post.author_id).first()
    
    epub_content = export_service.generate_epub(post, content, author)
    
    return Response(
        content=epub_content,
        media_type="application/epub+zip",
        headers={"Content-Disposition": f"attachment; filename={post.slug}.epub"}
    )

