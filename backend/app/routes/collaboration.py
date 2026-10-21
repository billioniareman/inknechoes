from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.utils.dependencies import get_current_user, get_db
from app.services import collaboration_service
from app.models.post import Post
from app.services.audit_service import create_audit_log
import base64

router = APIRouter(prefix="/collab", tags=["collab"])


class SnapshotIn(BaseModel):
    snapshot_b64: str


class InviteIn(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
    role: Optional[str] = "editor"
    display_name: Optional[str] = None
    color: Optional[str] = None


@router.post("/books/{book_id}")
def create_or_get_collab(book_id: int, chapter_id: Optional[int] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # verify that book exists and current_user is owner/author
    try:
        post = db.query(Post).filter(Post.id == book_id).first()
        from typing import Any, cast
        if not post or cast(Any, post).content_type != "book":
            raise HTTPException(status_code=404, detail="Book not found")
        # Only owner (post.author_id) can init collaboration, but existing collaborators can retrieve it
        if cast(Any, post).author_id != current_user.id:
            existing_collab = collaboration_service.get_collaboration_by_book(db, book_id, chapter_id=chapter_id)
            if existing_collab:
                collab_obj = cast(Any, existing_collab)
                is_collab = any(c.get("user_id") == current_user.id for c in (collab_obj.collaborators or []))
                if is_collab:
                    return {
                        "collab_id": existing_collab.id,
                        "book_id": existing_collab.book_id,
                        "chapter_id": existing_collab.chapter_id,
                        "title": existing_collab.title,
                        "collaborators": existing_collab.collaborators
                    }
            raise HTTPException(status_code=403, detail="Only book owner can initialize collaboration")

        collab = collaboration_service.create_collaboration_for_book(db, book_id, current_user.id, str(post.title), chapter_id=chapter_id)
        return {
            "collab_id": collab.id,
            "book_id": collab.book_id,
            "chapter_id": collab.chapter_id,
            "title": collab.title,
            "collaborators": collab.collaborators
        }
    except HTTPException:
        # Re-raise HTTP errors unchanged
        raise
    except Exception as e:
        # Provide a clearer error when DB schema is missing expected columns
        from loguru import logger
        logger.exception(f"Failed to create or get collab for book {book_id} chapter {chapter_id}: {e}")
        try:
            from sqlalchemy.exc import ProgrammingError
            if isinstance(e, ProgrammingError) or ("column collaborative_books.chapter_id does not exist" in str(e)):
                # Helpful hint for developers running locally
                raise HTTPException(status_code=500, detail=("Database schema is missing column 'chapter_id' on 'collaborative_books'. "
                                                             "Please run the migration at scripts/migration_add_collaborative_books_add_chapter_id.sql"))
        except Exception:
            # ignore errors while trying to inspect exception type
            pass
        raise HTTPException(status_code=500, detail="Failed to initialize collaboration")


@router.get("/books/{book_id}")
def get_collab_by_book(book_id: int, chapter_id: Optional[int] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    collab = collaboration_service.get_collaboration_by_book(db, book_id, chapter_id=chapter_id)
    if not collab:
        raise HTTPException(status_code=404, detail="Collaborative document not found")
    # permission: only collaborators or owner or book author can access
    from typing import Any, cast
    collab_obj = cast(Any, collab)
    allowed = False
    if collab_obj.owner_id == current_user.id:
        allowed = True
    for c in collab_obj.collaborators or []:
        if c.get("user_id") == current_user.id:
            allowed = True
            break
    if not allowed:
        raise HTTPException(status_code=403, detail="Access denied")

    snapshot_b64 = base64.b64encode(collab_obj.snapshot).decode() if getattr(collab_obj, 'snapshot', None) else None
    return {
        "collab_id": collab.id,
        "book_id": collab.book_id,
        "chapter_id": collab.chapter_id,
        "title": collab.title,
        "collaborators": collab.collaborators or [],
        "snapshot_b64": snapshot_b64
    }


@router.post("/{collab_id}/snapshot")
def save_snapshot(collab_id: int, payload: SnapshotIn, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # check permission
    if not collaboration_service.user_can_edit(db, collab_id, current_user.id):
        raise HTTPException(status_code=403, detail="No permission to save snapshot")
    snapshot_bytes = base64.b64decode(payload.snapshot_b64)
    try:
        collaboration_service.save_snapshot(db, collab_id, snapshot_bytes)
        # audit
        create_audit_log(db, current_user.id, "save_collab_snapshot", details=f"collab_id={collab_id}")
        return {"status": "ok"}
    except Exception as e:
        create_audit_log(db, current_user.id, "save_collab_snapshot", status="failed", details=str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{collab_id}/invite")
def invite_collaborator(collab_id: int, payload: InviteIn, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # only owner can invite
    collab = collaboration_service.get_collaboration_by_id(db, collab_id)
    if not collab:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    if collab.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can invite collaborators")

    try:
        from app.models.user import User
        target_user_id = payload.user_id
        target_display_name = payload.display_name

        if not target_user_id and payload.username:
            u = db.query(User).filter(User.username == payload.username.strip()).first()
            if not u:
                raise HTTPException(status_code=404, detail=f"User '{payload.username}' not found")
            target_user_id = u.id
            if not target_display_name:
                target_display_name = u.username
        elif target_user_id and not target_display_name:
            u = db.query(User).filter(User.id == target_user_id).first()
            if u:
                target_display_name = u.username

        if not target_user_id:
            raise HTTPException(status_code=400, detail="Either user_id or username is required")

        role = payload.role or 'editor'
        entry = collaboration_service.add_collaborator(db, collab_id, target_user_id, role, target_display_name, payload.color)
        
        # Dispatch notification to invited user
        try:
            from app.services.notification_service import create_notification
            book_title = collab.title or "a manuscript"
            create_notification(
                db=db,
                recipient_id=target_user_id,
                actor_id=current_user.id,
                notification_type="mention",
                message=f"{current_user.username} invited you to collaborate on '{book_title}'",
                post_id=str(collab.book_id)
            )
        except Exception as notify_err:
            from loguru import logger
            logger.warning(f"Could not send notification for collab invite: {notify_err}")

        # audit
        create_audit_log(db, current_user.id, "invite_collaborator", details=f"collab_id={collab_id}, invited={target_user_id}")
        return {"collaborator": entry}
    except HTTPException:
        raise
    except Exception as exc:
        from loguru import logger
        logger.exception(f"Failed to invite collaborator {payload.user_id or payload.username} to collab {collab_id}: {exc}")
        create_audit_log(db, current_user.id, "invite_collaborator", status="failed", details=str(exc))
        raise HTTPException(status_code=500, detail="Failed to invite collaborator")


@router.post("/{collab_id}/remove")
def remove_collaborator(collab_id: int, payload: InviteIn, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    collab = collaboration_service.get_collaboration_by_id(db, collab_id)
    if not collab:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    if collab.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only owner can remove collaborators")
    ok = collaboration_service.remove_collaborator(db, collab_id, payload.user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    return {"status": "ok"}


@router.get("/{collab_id}/collaborators")
def list_collaborators(collab_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    collab = collaboration_service.get_collaboration_by_id(db, collab_id)
    if not collab:
        raise HTTPException(status_code=404, detail="Collaboration not found")
    # permission: only collaborators or owner
    allowed = collab.owner_id == current_user.id or any(c.get("user_id") == current_user.id for c in (collab.collaborators or []))
    if not allowed:
        raise HTTPException(status_code=403, detail="Access denied")
    return {"collaborators": collab.collaborators or []}


@router.get("/ws-token")
def get_ws_token(collab_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Return a short-lived token for WebSocket connections (used by client to include in WS query)"""
    # Validate collaboration exists and user has at least view permission
    collab = collaboration_service.get_collaboration_by_id(db, collab_id)
    if not collab:
        raise HTTPException(status_code=404, detail="Collaboration not found")

    # Only owner, collaborators, or book author can request token
    allowed = collab.owner_id == current_user.id or any(c.get("user_id") == current_user.id for c in (collab.collaborators or []))
    if not allowed:
        raise HTTPException(status_code=403, detail="Access denied")

    from app.utils.jwt_handler import create_access_token
    token = create_access_token({"sub": str(current_user.id)},)
    return {"token": token}


@router.get("/my-collaborations")
def get_my_collaborations(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """List all books where current user is an invited collaborator"""
    from app.models.collaborative_book import CollaborativeBook
    from app.models.user import User
    collabs = db.query(CollaborativeBook).all()
    user_collabs = []
    seen_book_ids = set()
    for c in collabs:
        if c.owner_id == current_user.id:
            continue
        collab_entry = next((col for col in (c.collaborators or []) if col.get("user_id") == current_user.id), None)
        if collab_entry and c.book_id not in seen_book_ids:
            seen_book_ids.add(c.book_id)
            post = db.query(Post).filter(Post.id == c.book_id).first()
            if post:
                owner = db.query(User).filter(User.id == post.author_id).first()
                user_collabs.append({
                    "id": post.id,
                    "title": post.title,
                    "slug": post.slug,
                    "content_type": post.content_type,
                    "visibility": post.visibility,
                    "author_id": post.author_id,
                    "author_username": owner.username if owner else "Unknown",
                    "role": collab_entry.get("role", "editor"),
                    "created_at": post.created_at.isoformat() if post.created_at else None,
                    "updated_at": post.updated_at.isoformat() if post.updated_at else None,
                })
    return {"collaborations": user_collabs}

