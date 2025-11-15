"""
Service for managing user preferences
"""
from sqlalchemy.orm import Session
from app.models.user_preferences import UserPreferences
from app.models.user import User
from app.schemas.user_schema import UserPreferencesUpdate


def get_or_create_user_preferences(db: Session, user_id: int) -> UserPreferences:
    """Get or create user preferences"""
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == user_id).first()
    
    if not preferences:
        # Create default preferences
        preferences = UserPreferences(
            user_id=user_id,
            email_notifications_enabled=True,
            email_on_new_comment=True,
            email_on_new_follower=True,
            email_on_post_published=True,
            email_on_login=False,
            profile_visibility="public",
            show_email=False,
            show_analytics=True,
            default_content_type="article",
            default_visibility="public"
        )
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
    
    return preferences


def update_user_preferences(
    db: Session,
    user_id: int,
    preferences_data: UserPreferencesUpdate
) -> UserPreferences:
    """Update user preferences"""
    preferences = get_or_create_user_preferences(db, user_id)
    
    # Update only provided fields
    if preferences_data.email_notifications_enabled is not None:
        preferences.email_notifications_enabled = preferences_data.email_notifications_enabled
    if preferences_data.email_on_new_comment is not None:
        preferences.email_on_new_comment = preferences_data.email_on_new_comment
    if preferences_data.email_on_new_follower is not None:
        preferences.email_on_new_follower = preferences_data.email_on_new_follower
    if preferences_data.email_on_post_published is not None:
        preferences.email_on_post_published = preferences_data.email_on_post_published
    if preferences_data.email_on_login is not None:
        preferences.email_on_login = preferences_data.email_on_login
    if preferences_data.profile_visibility is not None:
        preferences.profile_visibility = preferences_data.profile_visibility
    if preferences_data.show_email is not None:
        preferences.show_email = preferences_data.show_email
    if preferences_data.show_analytics is not None:
        preferences.show_analytics = preferences_data.show_analytics
    if preferences_data.default_content_type is not None:
        preferences.default_content_type = preferences_data.default_content_type
    if preferences_data.default_visibility is not None:
        preferences.default_visibility = preferences_data.default_visibility
    if preferences_data.ui_preferences is not None:
        preferences.ui_preferences = preferences_data.ui_preferences
    
    db.commit()
    db.refresh(preferences)
    return preferences

