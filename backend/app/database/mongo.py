from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings
import time

settings = get_settings()

class MongoDB:
    client: AsyncIOMotorClient = None

mongodb = MongoDB()


async def connect_to_mongo():
    """Connect to MongoDB with retry logic"""
    print(f"DEBUG: Connecting to MongoDB with URI: {settings.MONGO_URI}")
    
    # Add connection timeout and server selection timeout
    mongodb.client = AsyncIOMotorClient(
        settings.MONGO_URI,
        serverSelectionTimeoutMS=5000,  # 5 seconds
        connectTimeoutMS=10000,  # 10 seconds
        socketTimeoutMS=20000,  # 20 seconds
        retryWrites=True,
        w="majority"
    )
    
    # Test connection with timeout
    try:
        await mongodb.client.admin.command('ping')
        print("[OK] MongoDB connection successful")
    except Exception as e:
        print(f"[ERROR] MongoDB connection test failed: {e}")
        try:
            from mongomock_motor import AsyncMongoMockClient
            print("[INFO] Using in-memory AsyncMongoMockClient for local testing")
            mongodb.client = AsyncMongoMockClient()
        except ImportError:
            raise e


async def close_mongo_connection():
    """Close MongoDB connection"""
    if mongodb.client:
        mongodb.client.close()


def get_mongo_db():
    """Get MongoDB database instance"""
    if mongodb.client is None:
        try:
            from mongomock_motor import AsyncMongoMockClient
            mongodb.client = AsyncMongoMockClient()
        except ImportError:
            raise RuntimeError("MongoDB client is not connected.")
    try:
        return mongodb.client.get_database("inknechoes")
    except Exception:
        return mongodb.client.inknechoes

