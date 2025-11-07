"""
Analytics service for user profile insights
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.user import User
from app.models.post import Post
from app.models.comment import Comment
from app.database.mongo import get_mongo_db
from bson import ObjectId
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from collections import Counter
import re


async def get_user_analytics(db: Session, user_id: int) -> Dict:
    """Get comprehensive analytics for a user"""
    
    # Get user's posts
    user_posts = db.query(Post).filter(
        Post.author_id == user_id,
        Post.visibility == "public"
    ).all()
    
    # Get user's comments (for reading analytics)
    user_comments = db.query(Comment).filter(Comment.author_id == user_id).all()
    
    # Writing Analytics
    writing_analytics = await get_writing_analytics(db, user_id, user_posts)
    
    # Reading Analytics
    reading_analytics = await get_reading_analytics(db, user_id, user_comments)
    
    # Language & Style Insights
    language_insights = await get_language_insights(db, user_id, user_posts)
    
    # User Stats
    user_stats = get_user_stats(db, user_id, user_posts)
    
    return {
        "user_stats": user_stats,
        "writing_analytics": writing_analytics,
        "reading_analytics": reading_analytics,
        "language_insights": language_insights
    }


def get_user_stats(db: Session, user_id: int, user_posts: List[Post]) -> Dict:
    """Get basic user statistics"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {}
    
    # Calculate total reads (approximate - using likes + claps as proxy)
    total_reads = sum(post.likes_count + post.claps_count for post in user_posts)
    
    # Calculate total likes received
    total_likes = sum(post.likes_count for post in user_posts)
    
    # Calculate total claps received
    total_claps = sum(post.claps_count for post in user_posts)
    
    # Calculate followers (users who liked/clapped user's posts)
    # This is a simplified version - in production, you'd have a followers table
    followers_count = 0  # Placeholder
    
    # Writing streak (consecutive days with posts)
    streak = calculate_writing_streak(user_posts)
    
    # Engagement score (weighted combination of metrics)
    engagement_score = calculate_engagement_score(user_posts, db)
    
    return {
        "join_date": user.created_at.isoformat() if user.created_at else None,
        "total_reads": total_reads,
        "total_likes": total_likes,
        "total_claps": total_claps,
        "total_followers": followers_count,
        "writing_streak": streak,
        "engagement_score": engagement_score,
        "total_posts": len(user_posts)
    }


async def get_writing_analytics(db: Session, user_id: int, user_posts: List[Post]) -> Dict:
    """Get writing analytics"""
    if not user_posts:
        return {
            "genre_distribution": [],
            "sentiment_trend": [],
            "word_frequency": [],
            "average_article_length": 0,
            "productivity": {},
            "top_performing": [],
            "evolution_timeline": []
        }
    
    # Genre distribution
    genre_distribution = {}
    for post in user_posts:
        genre = post.content_type or "article"
        genre_distribution[genre] = genre_distribution.get(genre, 0) + 1
    
    # Get post content from MongoDB for analysis
    mongo_db = get_mongo_db()
    all_content = []
    word_counts = []
    
    for post in user_posts:
        try:
            doc = await mongo_db.posts.find_one({"_id": ObjectId(post.mongo_id)})
            if doc:
                body = doc.get("body", "")
                all_content.append(body)
                # Count words (approximate)
                word_count = len(re.findall(r'\b\w+\b', body))
                word_counts.append(word_count)
        except:
            continue
    
    # Word frequency (simplified - extract common words)
    word_frequency = extract_word_frequency(all_content)
    
    # Average article length
    avg_length = sum(word_counts) / len(word_counts) if word_counts else 0
    
    # Productivity (posts per month)
    productivity = calculate_productivity(user_posts)
    
    # Top performing posts
    top_performing = sorted(
        user_posts,
        key=lambda p: p.likes_count + p.claps_count,
        reverse=True
    )[:5]
    
    # Sentiment trend (simplified - using post dates)
    sentiment_trend = calculate_sentiment_trend(user_posts)
    
    # Evolution timeline
    evolution_timeline = calculate_evolution_timeline(user_posts)
    
    return {
        "genre_distribution": [
            {"genre": k, "count": v, "percentage": round(v / len(user_posts) * 100, 1)}
            for k, v in genre_distribution.items()
        ],
        "sentiment_trend": sentiment_trend,
        "word_frequency": word_frequency[:20],  # Top 20 words
        "average_article_length": round(avg_length, 0),
        "productivity": productivity,
        "top_performing": [
            {
                "id": p.id,
                "title": p.title,
                "slug": p.slug,
                "likes": p.likes_count,
                "claps": p.claps_count,
                "total_engagement": p.likes_count + p.claps_count,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in top_performing
        ],
        "evolution_timeline": evolution_timeline
    }


async def get_reading_analytics(db: Session, user_id: int, user_comments: List[Comment]) -> Dict:
    """Get reading analytics based on comments"""
    if not user_comments:
        return {
            "genres_read_most": [],
            "reading_time_trend": [],
            "most_read_authors": [],
            "average_reading_depth": 0,
            "favorite_tone": {},
            "recency_vs_repetition": {}
        }
    
    # Get posts that user commented on
    post_ids = [c.post_id for c in user_comments]
    commented_posts = db.query(Post).filter(Post.id.in_(post_ids)).all()
    
    # Genres read most
    genre_counts = {}
    for post in commented_posts:
        genre = post.content_type or "article"
        genre_counts[genre] = genre_counts.get(genre, 0) + 1
    
    # Most read authors
    author_counts = {}
    for post in commented_posts:
        author_id = post.author_id
        author_counts[author_id] = author_counts.get(author_id, 0) + 1
    
    # Get author usernames
    most_read_authors = []
    for author_id, count in sorted(author_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
        author = db.query(User).filter(User.id == author_id).first()
        if author:
            most_read_authors.append({
                "username": author.username,
                "count": count
            })
    
    # Reading time trend (simplified - based on comment dates)
    reading_time_trend = calculate_reading_trend(user_comments)
    
    return {
        "genres_read_most": [
            {"genre": k, "count": v}
            for k, v in sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)
        ],
        "reading_time_trend": reading_time_trend,
        "most_read_authors": most_read_authors,
        "average_reading_depth": 75,  # Placeholder - would need tracking
        "favorite_tone": {},  # Placeholder
        "recency_vs_repetition": {}  # Placeholder
    }


async def get_language_insights(db: Session, user_id: int, user_posts: List[Post]) -> Dict:
    """Get language and style insights"""
    if not user_posts:
        return {
            "most_frequent_words": [],
            "sentence_complexity": {},
            "unique_vocabulary_ratio": 0,
            "emotion_analysis": {},
            "lexical_diversity": []
        }
    
    # Get all content
    mongo_db = get_mongo_db()
    all_text = []
    
    for post in user_posts:
        try:
            doc = await mongo_db.posts.find_one({"_id": ObjectId(post.mongo_id)})
            if doc:
                body = doc.get("body", "")
                # Strip HTML tags
                text = re.sub(r'<[^>]+>', '', body)
                all_text.append(text)
        except:
            continue
    
    if not all_text:
        return {
            "most_frequent_words": [],
            "sentence_complexity": {},
            "unique_vocabulary_ratio": 0,
            "emotion_analysis": {},
            "lexical_diversity": []
        }
    
    full_text = " ".join(all_text)
    
    # Most frequent words
    words = re.findall(r'\b[a-z]{3,}\b', full_text.lower())
    word_freq = Counter(words)
    # Remove common stop words
    stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'}
    filtered_words = {k: v for k, v in word_freq.items() if k not in stop_words}
    most_frequent = sorted(filtered_words.items(), key=lambda x: x[1], reverse=True)[:15]
    
    # Sentence complexity
    sentences = re.split(r'[.!?]+', full_text)
    sentence_lengths = [len(s.split()) for s in sentences if s.strip()]
    avg_sentence_length = sum(sentence_lengths) / len(sentence_lengths) if sentence_lengths else 0
    
    # Unique vocabulary ratio
    unique_words = len(set(words))
    total_words = len(words)
    unique_ratio = (unique_words / total_words * 100) if total_words > 0 else 0
    
    # Emotion analysis (simplified - keyword-based)
    emotion_keywords = {
        "joy": ["happy", "joy", "smile", "laugh", "celebrate", "delight", "cheer"],
        "sadness": ["sad", "cry", "tear", "grief", "sorrow", "mourn", "pain"],
        "anger": ["angry", "rage", "fury", "hate", "frustrate", "mad"],
        "fear": ["fear", "afraid", "scared", "anxious", "worry", "panic"],
        "trust": ["trust", "believe", "faith", "confident", "sure", "rely"],
        "surprise": ["surprise", "shock", "amaze", "wonder", "astonish"]
    }
    
    emotion_scores = {}
    text_lower = full_text.lower()
    for emotion, keywords in emotion_keywords.items():
        count = sum(text_lower.count(keyword) for keyword in keywords)
        emotion_scores[emotion] = count
    
    # Lexical diversity over time (simplified)
    lexical_diversity = calculate_lexical_diversity(user_posts)
    
    return {
        "most_frequent_words": [{"word": k, "count": v} for k, v in most_frequent],
        "sentence_complexity": {
            "average_sentence_length": round(avg_sentence_length, 1),
            "readability_index": round(206.835 - (1.015 * avg_sentence_length) - (84.6 * (total_words / len(sentences) if sentences else 0)), 1) if sentences else 0
        },
        "unique_vocabulary_ratio": round(unique_ratio, 1),
        "emotion_analysis": emotion_scores,
        "lexical_diversity": lexical_diversity
    }


# Helper functions

def calculate_writing_streak(posts: List[Post]) -> int:
    """Calculate consecutive days with posts"""
    if not posts:
        return 0
    
    # Sort posts by date
    sorted_posts = sorted(posts, key=lambda p: p.created_at if p.created_at else datetime.min, reverse=True)
    
    streak = 0
    current_date = datetime.now().date()
    
    for post in sorted_posts:
        if post.created_at:
            post_date = post.created_at.date()
            if post_date == current_date or post_date == current_date - timedelta(days=streak):
                streak += 1
                current_date = post_date
            else:
                break
    
    return streak


def calculate_engagement_score(posts: List[Post], db: Session) -> float:
    """Calculate engagement score"""
    if not posts:
        return 0.0
    
    total_engagement = sum(p.likes_count + p.claps_count for p in posts)
    
    # Count comments for these posts
    post_ids = [p.id for p in posts]
    total_comments = db.query(Comment).filter(Comment.post_id.in_(post_ids)).count() if post_ids else 0
    
    # Weighted score
    score = (total_engagement * 1.0) + (total_comments * 2.0)
    return round(score, 1)


def extract_word_frequency(content_list: List[str]) -> List[Dict]:
    """Extract word frequency from content"""
    all_text = " ".join(content_list)
    # Strip HTML
    text = re.sub(r'<[^>]+>', '', all_text)
    words = re.findall(r'\b[a-z]{4,}\b', text.lower())
    
    stop_words = {'that', 'this', 'with', 'from', 'have', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'will', 'about', 'would', 'there', 'could', 'other', 'after', 'first', 'never', 'these', 'think', 'where', 'being', 'every', 'great', 'might', 'shall', 'those', 'under', 'while', 'years'}
    filtered = [w for w in words if w not in stop_words]
    
    word_freq = Counter(filtered)
    return [{"word": k, "count": v} for k, v in word_freq.most_common(20)]


def calculate_productivity(posts: List[Post]) -> Dict:
    """Calculate posts per month"""
    if not posts:
        return {}
    
    monthly_counts = {}
    for post in posts:
        if post.created_at:
            month_key = post.created_at.strftime("%Y-%m")
            monthly_counts[month_key] = monthly_counts.get(month_key, 0) + 1
    
    return monthly_counts


def calculate_sentiment_trend(posts: List[Post]) -> List[Dict]:
    """Calculate sentiment trend over time"""
    if not posts:
        return []
    
    # Simplified - just return post counts by month
    monthly_posts = {}
    for post in posts:
        if post.created_at:
            month_key = post.created_at.strftime("%Y-%m")
            if month_key not in monthly_posts:
                monthly_posts[month_key] = []
            monthly_posts[month_key].append(post)
    
    trend = []
    for month, month_posts in sorted(monthly_posts.items()):
        avg_engagement = sum(p.likes_count + p.claps_count for p in month_posts) / len(month_posts)
        trend.append({
            "month": month,
            "post_count": len(month_posts),
            "avg_engagement": round(avg_engagement, 1)
        })
    
    return trend


def calculate_evolution_timeline(posts: List[Post]) -> List[Dict]:
    """Calculate writing evolution timeline"""
    if not posts:
        return []
    
    # Sort by date
    sorted_posts = sorted(posts, key=lambda p: p.created_at if p.created_at else datetime.min)
    
    timeline = []
    for i, post in enumerate(sorted_posts):
        if post.created_at:
            timeline.append({
                "date": post.created_at.isoformat(),
                "title": post.title,
                "engagement": post.likes_count + post.claps_count,
                "word_count": 0  # Would need to fetch from MongoDB
            })
    
    return timeline


def calculate_reading_trend(comments: List[Comment]) -> List[Dict]:
    """Calculate reading trend over time"""
    if not comments:
        return []
    
    monthly_comments = {}
    for comment in comments:
        if comment.created_at:
            month_key = comment.created_at.strftime("%Y-%m")
            monthly_comments[month_key] = monthly_comments.get(month_key, 0) + 1
    
    return [
        {"month": k, "count": v}
        for k, v in sorted(monthly_comments.items())
    ]


def calculate_lexical_diversity(posts: List[Post]) -> List[Dict]:
    """Calculate lexical diversity over time"""
    if not posts:
        return []
    
    # Simplified - return diversity score by month
    monthly_diversity = {}
    for post in posts:
        if post.created_at:
            month_key = post.created_at.strftime("%Y-%m")
            if month_key not in monthly_diversity:
                monthly_diversity[month_key] = []
            monthly_diversity[month_key].append(post)
    
    diversity_scores = []
    for month, month_posts in sorted(monthly_diversity.items()):
        # Simplified diversity calculation
        diversity_scores.append({
            "month": month,
            "diversity_score": round(len(month_posts) * 10, 1)  # Placeholder
        })
    
    return diversity_scores

