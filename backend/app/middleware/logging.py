from fastapi import Request
from loguru import logger
import time

async def log_requests(request: Request, call_next):
    """Log all requests"""
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        # Only log if status code is not 401 and not OPTIONS (to reduce noise)
        # 401 is expected when user is not logged in
        # OPTIONS is CORS preflight
        if response.status_code != 401 and request.method != "OPTIONS":
            logger.info(
                f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s"
            )
        # Debug: log cookie info for auth endpoints with 401
        elif request.url.path == "/api/v1/auth/me" and response.status_code == 401:
            cookies = request.cookies
            cookie_keys = list(cookies.keys())
            logger.debug(f"Auth check failed - Cookies received: {cookie_keys}")
        
        return response
    except Exception as e:
        process_time = time.time() - start_time
        # Only log actual errors, not 401s
        if "401" not in str(e):
            logger.error(f"Error processing {request.method} {request.url.path}: {e} - {process_time:.3f}s")
        raise

