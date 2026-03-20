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
        print("✓ MongoDB connection successful")
    except Exception as e:
        print(f"✗ MongoDB connection test failed: {e}")
        raise e


async def close_mongo_connection():
    """Close MongoDB connection"""
    if mongodb.client:
        mongodb.client.close()


def get_mongo_db():
    """Get MongoDB database instance"""
    return mongodb.client.get_database()

