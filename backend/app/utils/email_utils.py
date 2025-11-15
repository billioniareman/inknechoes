import httpx
from app.config import get_settings

settings = get_settings()

# Try to import resend, but make it optional (legacy support)
try:
    from resend import Resend
    resend = Resend(api_key=settings.EMAIL_API_KEY) if settings.EMAIL_API_KEY else None
except ImportError:
    resend = None

frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    
async def send_email_via_brevo(to: str, subject: str, html_content: str):
    """Send email using Brevo API (free tier: 300 emails/day)"""
    if not settings.BREVO_API_KEY:
        print(f"[EMAIL] Brevo API key not set. Would send to {to}: {subject}")
        return False
    
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json"
    }
    
    payload = {
        "sender": {
            "name": "Ink&Echoes",
            "email": settings.EMAIL_FROM
        },
        "to": [{"email": to}],
        "subject": subject,
        "htmlContent": html_content
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers=headers, timeout=10.0)
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send email via Brevo: {e}")
            return False


async def send_password_reset_email(email: str, reset_token: str):
    """Send password reset email"""
    reset_url = f"{frontend_url}/reset-password?token={reset_token}"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #B87844;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>You requested to reset your password for your Ink&Echoes account.</p>
        <p>Click the link below to reset your password:</p>
        <p style="margin: 20px 0;">
            <a href="{reset_url}" style="background-color: #B87844; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
            </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="color: #666; word-break: break-all;">{reset_url}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">© 2025 Ink&Echoes. All rights reserved.</p>
    </div>
    """
    
    # Try Brevo first, fallback to Resend, then dev mode
    if settings.BREVO_API_KEY:
        success = await send_email_via_brevo(email, "Reset Your Ink&Echoes Password", html_content)
        if success:
            return
    
    # Fallback to Resend if available
    if resend:
        try:
            resend.emails.send({
                "from": settings.EMAIL_FROM,
                "to": [email],
                "subject": "Reset Your Ink&Echoes Password",
                "html": html_content
            })
            return
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send via Resend: {e}")
    
    # Dev mode fallback
    print(f"[DEV] Password reset token for {email}: {reset_token}")


async def send_welcome_email(email: str, username: str):
    """Send welcome email to new user"""
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #B87844;">Welcome to Ink&Echoes, {username}!</h2>
        <p>Your account has been created successfully.</p>
        <p>Start writing and sharing your stories with our community.</p>
        <p style="margin: 20px 0;">
            <a href="{frontend_url}/write" style="background-color: #B87844; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Write Your First Story
            </a>
        </p>
        <p>Explore amazing works from talented writers at <a href="{frontend_url}/discover">{frontend_url}/discover</a></p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">© 2025 Ink&Echoes. All rights reserved.</p>
    </div>
    """
    
    # Try Brevo first, fallback to Resend, then dev mode
    if settings.BREVO_API_KEY:
        success = await send_email_via_brevo(email, "Welcome to Ink&Echoes!", html_content)
        if success:
            return
    
    # Fallback to Resend if available
    if resend:
        try:
            resend.emails.send({
                "from": settings.EMAIL_FROM,
                "to": [email],
                "subject": "Welcome to Ink&Echoes!",
                "html": html_content
            })
            return
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send via Resend: {e}")
    
    # Dev mode fallback
    print(f"[DEV] Welcome email for {email} ({username})")


async def send_email_verification_email(email: str, username: str, verification_token: str):
    """Send email verification email"""
    # Get frontend URL from settings or use default
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    verify_url = f"{frontend_url}/verify-email?token={verification_token}"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #B87844;">Verify Your Email Address</h2>
        <p>Hello {username},</p>
        <p>Thank you for signing up for Ink&Echoes! Please verify your email address to complete your registration.</p>
        <p>Click the link below to verify your email:</p>
        <p style="margin: 20px 0;">
            <a href="{verify_url}" style="background-color: #B87844; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Verify Email Address
            </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="color: #666; word-break: break-all;">{verify_url}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">© 2025 Ink&Echoes. All rights reserved.</p>
    </div>
    """
    
    # Try Brevo first, fallback to Resend, then dev mode
    if settings.BREVO_API_KEY:
        success = await send_email_via_brevo(email, "Verify Your Ink&Echoes Email", html_content)
        if success:
            return
    
    # Fallback to Resend if available
    if resend:
        try:
            resend.emails.send({
                "from": settings.EMAIL_FROM,
                "to": [email],
                "subject": "Verify Your Ink&Echoes Email",
                "html": html_content
            })
            return
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send via Resend: {e}")
    
    # Dev mode fallback
    print(f"[DEV] Email verification token for {email}: {verification_token}")


async def send_password_change_notification(email: str, username: str):
    """Send notification when password is changed"""
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #B87844;">Password Changed Successfully</h2>
        <p>Hello {username},</p>
        <p>Your password has been successfully changed.</p>
        <p>If you didn't make this change, please contact us immediately.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">© 2025 Ink&Echoes. All rights reserved.</p>
    </div>
    """
    
    if settings.BREVO_API_KEY:
        await send_email_via_brevo(email, "Password Changed - Ink&Echoes", html_content)
    elif resend:
        try:
            resend.emails.send({
                "from": settings.EMAIL_FROM,
                "to": [email],
                "subject": "Password Changed - Ink&Echoes",
                "html": html_content
            })
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send via Resend: {e}")
    else:
        print(f"[DEV] Password change notification for {email}")


async def send_login_notification(email: str, username: str, ip_address: str = None, user_agent: str = None):
    """Send notification when user logs in from new device/location"""
    location_info = f" from {ip_address}" if ip_address else ""
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #B87844;">New Login Detected</h2>
        <p>Hello {username},</p>
        <p>We detected a new login to your Ink&Echoes account{location_info}.</p>
        <p>If this wasn't you, please secure your account immediately.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">© 2025 Ink&Echoes. All rights reserved.</p>
    </div>
    """
    
    if settings.BREVO_API_KEY:
        await send_email_via_brevo(email, "New Login - Ink&Echoes", html_content)
    elif resend:
        try:
            resend.emails.send({
                "from": settings.EMAIL_FROM,
                "to": [email],
                "subject": "New Login - Ink&Echoes",
                "html": html_content
            })
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send via Resend: {e}")
    else:
        print(f"[DEV] Login notification for {email}")


async def send_account_deletion_confirmation(email: str, username: str):
    """Send confirmation when account is deleted"""
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #B87844;">Account Deletion Confirmation</h2>
        <p>Hello {username},</p>
        <p>Your Ink&Echoes account has been successfully deleted.</p>
        <p>We're sorry to see you go. If you change your mind, you can always create a new account.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">© 2025 Ink&Echoes. All rights reserved.</p>
    </div>
    """
    
    if settings.BREVO_API_KEY:
        await send_email_via_brevo(email, "Account Deleted - Ink&Echoes", html_content)
    elif resend:
        try:
            resend.emails.send({
                "from": settings.EMAIL_FROM,
                "to": [email],
                "subject": "Account Deleted - Ink&Echoes",
                "html": html_content
            })
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send via Resend: {e}")
    else:
        print(f"[DEV] Account deletion confirmation for {email}")

