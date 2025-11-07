from motor.motor_asyncio import AsyncIOMotorClient
from app.config import get_settings

settings = get_settings()

class MongoDB:
    client: AsyncIOMotorClient = None

mongodb = MongoDB()


async def connect_to_mongo():
    """Connect to MongoDB"""
    mongodb.client = AsyncIOMotorClient(settings.MONGO_URI)
    mongodb.client.get_database()  # Test connection


async def close_mongo_connection():
    """Close MongoDB connection"""
    if mongodb.client:
        mongodb.client.close()


def get_mongo_db():
    """Get MongoDB database instance"""
    return mongodb.client.get_database()

