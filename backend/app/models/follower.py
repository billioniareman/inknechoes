from sqlalchemy import Column, Integer, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from app.database.postgres import Base


# Association table for user follows
followers = Table(
    'followers',
    Base.metadata,
    Column('follower_id', Integer, ForeignKey('users.id'), primary_key=True),  # User who is following
    Column('followed_id', Integer, ForeignKey('users.id'), primary_key=True),  # User being followed
    Column('created_at', DateTime(timezone=True), server_default=func.now())
)
