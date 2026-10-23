from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
import time

import os

settings = get_settings()

db_url = settings.POSTGRES_URL

def create_db_engine(url: str):
    engine_kwargs = {
        "pool_pre_ping": True,
    }
    if "sqlite" in url:
        engine_kwargs["connect_args"] = {"check_same_thread": False}
    else:
        engine_kwargs["pool_recycle"] = 300
        engine_kwargs["connect_args"] = {
            "connect_timeout": 3,
            "application_name": "inknechoes_backend"
        }
    return create_engine(url, **engine_kwargs)

try:
    engine = create_db_engine(db_url)
    with engine.connect() as conn:
        pass
except Exception as e:
    # If postgres on localhost is not reachable, fallback to SQLite for local development
    if "postgresql" in db_url and ("localhost" in db_url or "127.0.0.1" in db_url):
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        sqlite_path = os.path.join(backend_dir, "inknechoes_dev.db").replace("\\", "/")
        db_url = f"sqlite:///{sqlite_path}"
        print(f"[INFO] Local PostgreSQL not reachable. Using SQLite fallback: {db_url}")
        engine = create_db_engine(db_url)
    else:
        # Recreate engine so app can attempt connection or raise error on request
        engine = create_db_engine(db_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    """Run Alembic database migrations up to head"""
    from alembic.config import Config
    from alembic import command
    from sqlalchemy import inspect
    
    backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    alembic_ini_path = os.path.join(backend_dir, "alembic.ini")
    if not os.path.exists(alembic_ini_path):
        Base.metadata.create_all(bind=engine)
        print("[OK] Database tables created successfully via Base.metadata")
        return
        
    alembic_cfg = Config(alembic_ini_path)
    
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    if "alembic_version" not in tables and "users" in tables:
        command.stamp(alembic_cfg, "head")
        print("[OK] Existing database stamped at Alembic head")
    else:
        command.upgrade(alembic_cfg, "head")
        print("[OK] Database migrations applied successfully (Alembic head)")


