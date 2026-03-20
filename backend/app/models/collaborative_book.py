from sqlalchemy import Column, Integer, String, LargeBinary, JSON, TIMESTAMP, func, Boolean
from app.database.postgres import Base


class CollaborativeBook(Base):
    __tablename__ = "collaborative_books"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, nullable=False, index=True)  # references posts.id (book)
    chapter_id = Column(Integer, nullable=True, index=True)  # references chapters.id - optional for per-chapter docs
    title = Column(String, nullable=False)
    owner_id = Column(Integer, nullable=False)  # references users.id
    snapshot = Column(LargeBinary, nullable=True)  # Yjs binary snapshot
    collaborators = Column(JSON, nullable=True, default=list)  # list of {user_id, role, display_name, color}
    permissions = Column(JSON, nullable=True, default={"edit": True})
    is_active = Column(Boolean, default=True)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "book_id": self.book_id,
            "title": self.title,
            "owner_id": self.owner_id,
            "collaborators": self.collaborators or [],
            "permissions": self.permissions or {},
            "has_snapshot": bool(self.snapshot),
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
