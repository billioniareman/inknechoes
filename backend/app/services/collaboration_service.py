from sqlalchemy.orm import Session
from app.models.collaborative_book import CollaborativeBook
from app.models.post import Post
from typing import Optional, List, Dict
import base64


def create_collaboration_for_book(db: Session, book_id: int, owner_id: int, title: str, chapter_id: Optional[int] = None) -> CollaborativeBook:
    """Create or return existing collaborative entry for a book or specific chapter"""
    query = db.query(CollaborativeBook).filter(CollaborativeBook.book_id == book_id)
    if chapter_id is None:
        query = query.filter(CollaborativeBook.chapter_id.is_(None))
    else:
        query = query.filter(CollaborativeBook.chapter_id == chapter_id)

    existing = query.first()
    if existing:
        return existing

    collab = CollaborativeBook(book_id=book_id, chapter_id=chapter_id, owner_id=owner_id, title=title, collaborators=[{"user_id": owner_id, "role": "owner"}])
    db.add(collab)
    db.commit()
    db.refresh(collab)
    return collab


def get_collaboration_by_book(db: Session, book_id: int, chapter_id: Optional[int] = None) -> Optional[CollaborativeBook]:
    query = db.query(CollaborativeBook).filter(CollaborativeBook.book_id == book_id)
    if chapter_id is None:
        query = query.filter(CollaborativeBook.chapter_id.is_(None))
    else:
        query = query.filter(CollaborativeBook.chapter_id == chapter_id)
    return query.first()


def get_collaboration_by_id(db: Session, collab_id: int) -> Optional[CollaborativeBook]:
    return db.query(CollaborativeBook).filter(CollaborativeBook.id == collab_id).first()


from typing import Any, cast


def save_snapshot(db: Session, collab_id: int, snapshot_bytes: bytes) -> None:
    collab = get_collaboration_by_id(db, collab_id)
    if not collab:
        raise ValueError("Collaborative document not found")
    collab_obj = cast(Any, collab)
    collab_obj.snapshot = snapshot_bytes
    db.commit()


def add_collaborator(db: Session, collab_id: int, user_id: int, role: str = "editor", display_name: Optional[str] = None, color: Optional[str] = None) -> Dict:
    collab = get_collaboration_by_id(db, collab_id)
    if not collab:
        raise ValueError("Collaborative document not found")
    # Ensure we have a concrete list for manipulation (pyright can't infer runtime value)
    collab_obj = cast(Any, collab)
    collab_list = list(collab_obj.collaborators or [])
    # Avoid duplicates
    for c in collab_list:
        if c.get("user_id") == user_id:
            c.update({"role": role, "display_name": display_name or c.get("display_name"), "color": color or c.get("color")})
            # Persist
            collab_obj.collaborators = collab_list
            db.commit()
            return c

    entry = {"user_id": user_id, "role": role, "display_name": display_name, "color": color}
    collab_list.append(entry)
    collab_obj.collaborators = collab_list
    db.commit()
    return entry


def remove_collaborator(db: Session, collab_id: int, user_id: int) -> bool:
    collab = get_collaboration_by_id(db, collab_id)
    if not collab:
        return False
    collab_obj = cast(Any, collab)
    collab_list = list(collab_obj.collaborators or [])
    before = len(collab_list)
    collab_list = [c for c in collab_list if c.get("user_id") != user_id]
    collab_obj.collaborators = collab_list
    db.commit()
    return len(collab_list) < before


def user_can_edit(db: Session, collab_id: int, user_id: int) -> bool:
    collab = get_collaboration_by_id(db, collab_id)
    if not collab:
        return False
    # Owner check
    if cast(Any, collab).owner_id == user_id:
        return True

    # Collaborators list check
    collab_obj = cast(Any, collab)
    for c in list(collab_obj.collaborators or []):
        if c.get("user_id") == user_id and c.get("role") in ("editor", "owner"):
            return True

    # fallback: if permissions default to edit true
    perms = collab.permissions or {}
    return perms.get("edit", False)


def list_collaborators(db: Session, collab_id: int) -> List[Dict]:
    collab = get_collaboration_by_id(db, collab_id)
    if not collab:
        return []
    collab_obj = cast(Any, collab)
    return list(collab_obj.collaborators or [])
