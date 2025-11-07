from app.config import get_settings

settings = get_settings()

# Try to import resend, but make it optional
try:
    from resend import Resend
    resend = Resend(api_key=settings.EMAIL_API_KEY) if settings.EMAIL_API_KEY else None
except ImportError:
    resend = None
    print("[WARNING] Resend package not available. Email functionality disabled.")


async def send_password_reset_email(email: str, reset_token: str):
    """Send password reset email"""
    if not resend:
        print(f"[DEV] Password reset token for {email}: {reset_token}")
        return
    
    reset_url = f"https://inknechoes.com/reset-password?token={reset_token}"
    
    try:
        resend.emails.send({
            "from": settings.EMAIL_FROM,
            "to": [email],
            "subject": "Reset Your Ink&Echoes Password",
            "html": f"""
            <h2>Password Reset Request</h2>
            <p>Click the link below to reset your password:</p>
            <a href="{reset_url}">{reset_url}</a>
            <p>This link will expire in 1 hour.</p>
            """
        })
    except Exception as e:
        print(f"Error sending email: {e}")


async def send_welcome_email(email: str, username: str):
    """Send welcome email to new user"""
    if not resend:
        print(f"[DEV] Welcome email for {email} ({username})")
        return
    
    try:
        resend.emails.send({
            "from": settings.EMAIL_FROM,
            "to": [email],
            "subject": "Welcome to Ink&Echoes!",
            "html": f"""
            <h2>Welcome, {username}!</h2>
            <p>Your account has been created successfully.</p>
            <p>Start writing and sharing your stories at <a href="https://inknechoes.com">inknechoes.com</a></p>
            """
        })
    except Exception as e:
        print(f"Error sending welcome email: {e}")

