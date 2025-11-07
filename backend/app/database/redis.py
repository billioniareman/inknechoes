import redis
from app.config import get_settings

settings = get_settings()

# Try to connect to Redis, but make it optional
# Skip if REDIS_URL is empty or not set
redis_client = None
REDIS_AVAILABLE = False

if settings.REDIS_URL and settings.REDIS_URL.strip():
    try:
        redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
        # Test connection
        redis_client.ping()
        REDIS_AVAILABLE = True
        print("[INFO] Redis connected successfully.")
    except Exception as e:
        print(f"[WARNING] Redis not available: {e}. Running without Redis cache.")
        redis_client = None
        REDIS_AVAILABLE = False
else:
    print("[INFO] REDIS_URL not set. Running without Redis cache.")


def get_redis():
    """Get Redis client (may be None if Redis is unavailable)"""
    return redis_client


def is_redis_available():
    """Check if Redis is available"""
    if not REDIS_AVAILABLE or redis_client is None:
        return False
    try:
        redis_client.ping()
        return True
    except:
        return False

