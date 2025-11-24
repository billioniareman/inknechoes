"""
Service for handling user follow/unfollow operations and retrieving follow relationships.
"""
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.follower import followers
from sqlalchemy import select, func


def follow_user(db: Session, follower_id: int, followed_id: int) -> bool:
    """
    Make a user follow another user.
    
    Args:
        db: Database session
        follower_id: ID of the user who wants to follow
        followed_id: ID of the user to be followed
        
    Returns:
        True if follow was successful, False if already following
    """
    # Check if already following
    if is_following(db, follower_id, followed_id):
        return False
    
    # Check if users exist
    follower = db.query(User).filter(User.id == follower_id).first()
    followed = db.query(User).filter(User.id == followed_id).first()
    
    if not follower or not followed:
        return False
    
    # Can't follow yourself
    if follower_id == followed_id:
        return False
    
    # Insert follow relationship
    stmt = followers.insert().values(follower_id=follower_id, followed_id=followed_id)
    db.execute(stmt)
    db.commit()
    
    return True


def unfollow_user(db: Session, follower_id: int, followed_id: int) -> bool:
    """
    Make a user unfollow another user.
    
    Args:
        db: Database session
        follower_id: ID of the user who wants to unfollow
        followed_id: ID of the user to be unfollowed
        
    Returns:
        True if unfollow was successful, False if not following
    """
    # Check if currently following
    if not is_following(db, follower_id, followed_id):
        return False
    
    # Delete follow relationship
    stmt = followers.delete().where(
        (followers.c.follower_id == follower_id) & 
        (followers.c.followed_id == followed_id)
    )
    db.execute(stmt)
    db.commit()
    
    return True


def is_following(db: Session, follower_id: int, followed_id: int) -> bool:
    """
    Check if a user is following another user.
    
    Args:
        db: Database session
        follower_id: ID of the potential follower
        followed_id: ID of the potentially followed user
        
    Returns:
        True if following, False otherwise
    """
    stmt = select(followers).where(
        (followers.c.follower_id == follower_id) & 
        (followers.c.followed_id == followed_id)
    )
    result = db.execute(stmt).first()
    return result is not None


def get_followers(db: Session, user_id: int, limit: int = 100, offset: int = 0):
    """
    Get list of users who follow the specified user.
    
    Args:
        db: Database session
        user_id: ID of the user whose followers to retrieve
        limit: Maximum number of followers to return
        offset: Number of followers to skip
        
    Returns:
        List of User objects who follow the specified user
    """
    followers_list = db.query(User).join(
        followers, User.id == followers.c.follower_id
    ).filter(
        followers.c.followed_id == user_id
    ).limit(limit).offset(offset).all()
    
    return followers_list


def get_following(db: Session, user_id: int, limit: int = 100, offset: int = 0):
    """
    Get list of users that the specified user follows.
    
    Args:
        db: Database session
        user_id: ID of the user whose following list to retrieve
        limit: Maximum number of users to return
        offset: Number of users to skip
        
    Returns:
        List of User objects that the specified user follows
    """
    following_list = db.query(User).join(
        followers, User.id == followers.c.followed_id
    ).filter(
        followers.c.follower_id == user_id
    ).limit(limit).offset(offset).all()
    
    return following_list


def get_follower_count(db: Session, user_id: int) -> int:
    """
    Get the count of followers for a user.
    
    Args:
        db: Database session
        user_id: ID of the user
        
    Returns:
        Number of followers
    """
    count = db.query(func.count()).select_from(followers).filter(
        followers.c.followed_id == user_id
    ).scalar()
    
    return count or 0


def get_following_count(db: Session, user_id: int) -> int:
    """
    Get the count of users that a user follows.
    
    Args:
        db: Database session
        user_id: ID of the user
        
    Returns:
        Number of users being followed
    """
    count = db.query(func.count()).select_from(followers).filter(
        followers.c.follower_id == user_id
    ).scalar()
    
    return count or 0
