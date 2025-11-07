# Environment Variables Reference

## Backend Environment Variables

Create `backend/.env` file with the following variables:

```env
# Environment
ENV=development

# Database URLs
POSTGRES_URL=postgresql://postgres:password@localhost:5432/inknechoes
MONGO_URI=mongodb://localhost:27017/inknechoes
REDIS_URL=redis://localhost:6379/0

# Cloudinary (for image storage - free tier)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# AWS S3 (optional, if you prefer S3)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=inknechoes-media

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# Email (Brevo - free tier: 300 emails/day)
BREVO_API_KEY=your_brevo_api_key
EMAIL_API_KEY=  # Legacy support for Resend
EMAIL_FROM=noreply@inknechoes.com

# CORS
CORS_ORIGINS=http://localhost:5173,https://inknechoes.com

# App
APP_NAME=Ink&Echoes
API_V1_PREFIX=/api/v1
```

## Frontend Environment Variables

Create `frontend/.env` file with the following variables:

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:8000

# For production, set this to your backend URL:
# VITE_API_BASE_URL=https://your-backend.onrender.com
```

## Production Environment Variables (Render)

Set these in Render Dashboard → Environment Variables:

```env
ENV=production
POSTGRES_URL=  # Auto-set by Render PostgreSQL service
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/inknechoes?retryWrites=true&w=majority
REDIS_URL=  # Optional, leave empty for free tier
SECRET_KEY=  # Generate: openssl rand -hex 32
CORS_ORIGINS=https://your-frontend.vercel.app,https://inknechoes.com
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=noreply@inknechoes.com
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Production Environment Variables (Vercel)

Set these in Vercel Dashboard → Settings → Environment Variables:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

## Generating SECRET_KEY

```bash
# Linux/Mac
openssl rand -hex 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

