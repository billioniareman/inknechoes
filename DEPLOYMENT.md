# 🚀 Deployment Guide - Ink&Echoes Platform

This guide will help you deploy Ink&Echoes to production using free-tier services.

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier)
- Render account (free tier)
- MongoDB Atlas account (free tier)
- Cloudinary account (free tier)
- Brevo account (free tier)

## 🏗️ Architecture

```
Frontend (React) → Vercel
Backend (FastAPI) → Render
Database (PostgreSQL) → Render (free tier)
Database (MongoDB) → MongoDB Atlas (free tier)
Storage (Images) → Cloudinary (free tier)
Email → Brevo (free tier)
```

## 📦 Step 1: Setup Services

### 1.1 MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new **M0 Free Cluster** (512MB storage)
4. Create a database user:
   - Username: `inknechoes_user`
   - Password: Generate a strong password
5. Whitelist IP addresses:
   - Add `0.0.0.0/0` for Render (or specific Render IPs)
6. Get connection string:
   - Click "Connect" → "Connect your application"
   - Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/inknechoes?retryWrites=true&w=majority`
   - Replace `<password>` with your actual password

### 1.2 Cloudinary

1. Go to https://cloudinary.com
2. Create a free account
3. Get credentials from Dashboard:
   - Cloud Name
   - API Key
   - API Secret

### 1.3 Brevo (Email)

1. Go to https://www.brevo.com
2. Create a free account (300 emails/day)
3. Go to Settings → SMTP & API
4. Generate an API key
5. Save the API key

## 🚀 Step 2: Deploy Backend (Render)

### 2.1 Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/inknechoes.git
git push -u origin main
```

### 2.2 Create Render Web Service

1. Go to https://render.com
2. Sign up/login
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `inknechoes-backend`
   - **Environment**: `Python 3`
   - **Region**: `Oregon` (or closest to you)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app.main:app --workers 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120`

### 2.3 Create PostgreSQL Database

1. In Render dashboard, click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `inknechoes-postgres`
   - **Database**: `inknechoes`
   - **User**: `inknechoes_user`
   - **Plan**: `Free`
3. Note the connection string (auto-added to web service)

### 2.4 Set Environment Variables

In your Render web service → Environment tab, add:

```env
ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/inknechoes?retryWrites=true&w=majority
REDIS_URL=  # Leave empty for free tier (optional)
SECRET_KEY=  # Generate: openssl rand -hex 32
CORS_ORIGINS=https://your-frontend.vercel.app,https://inknechoes.com
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=noreply@inknechoes.com
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Note**: `POSTGRES_URL` is automatically set by Render when you link the database.

### 2.5 Deploy

1. Click "Create Web Service"
2. Wait for deployment (first deploy takes ~5-10 minutes)
3. Note your backend URL: `https://inknechoes-backend.onrender.com`

### 2.6 Test Backend

```bash
# Health check
curl https://your-backend.onrender.com/health

# API docs
open https://your-backend.onrender.com/docs
```

## 🎨 Step 3: Deploy Frontend (Vercel)

### 3.1 Create Vercel Project

1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click "Add New" → "Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3.2 Set Environment Variables

In Vercel project → Settings → Environment Variables:

```env
VITE_API_BASE_URL=https://your-backend.onrender.com
```

### 3.3 Deploy

1. Click "Deploy"
2. Wait for deployment (~2-3 minutes)
3. Note your frontend URL: `https://your-project.vercel.app`

### 3.4 Update CORS in Backend

Update `CORS_ORIGINS` in Render to include your Vercel URL:

```env
CORS_ORIGINS=https://your-project.vercel.app,https://inknechoes.com
```

Redeploy backend after updating.

## ✅ Step 4: Post-Deployment Checklist

### 4.1 Test Frontend

- [ ] Frontend loads correctly
- [ ] Can register new account
- [ ] Can login
- [ ] Can create posts
- [ ] Can view posts
- [ ] Search works
- [ ] Filters work

### 4.2 Test Backend

- [ ] Health endpoint: `/health`
- [ ] API docs: `/docs`
- [ ] Authentication works
- [ ] Database connections work
- [ ] Email sending works (test registration)

### 4.3 Test Integrations

- [ ] MongoDB connection works
- [ ] PostgreSQL connection works
- [ ] Image uploads work (Cloudinary)
- [ ] Email sending works (Brevo)

## 🔧 Step 5: Database Migrations

After deployment, run migrations:

```bash
# Connect to Render shell
# In Render dashboard → Shell tab

# Run migrations
python scripts/migrate_posts.py
python scripts/migrate_book_features.py

# Optional: Seed database
python scripts/seed.py
```

## 🌐 Step 6: Custom Domain (Optional)

### 6.1 Vercel Custom Domain

1. Go to Vercel project → Settings → Domains
2. Add your domain: `inknechoes.com`
3. Follow DNS instructions:
   - Add CNAME record: `www` → `cname.vercel-dns.com`
   - Add A record: `@` → Vercel IP (if provided)

### 6.2 Render Custom Domain

1. Go to Render service → Settings → Custom Domains
2. Add domain: `api.inknechoes.com`
3. Follow DNS instructions:
   - Add CNAME record: `api` → `your-service.onrender.com`

### 6.3 Update Environment Variables

Update `CORS_ORIGINS` in Render:

```env
CORS_ORIGINS=https://inknechoes.com,https://www.inknechoes.com,https://api.inknechoes.com
```

Update `VITE_API_BASE_URL` in Vercel:

```env
VITE_API_BASE_URL=https://api.inknechoes.com
```

## 📊 Monitoring & Maintenance

### Render Free Tier Limitations

- **Spins down after 15 minutes of inactivity**
- **First request after spin-down takes ~30 seconds**
- **512MB RAM limit**
- **Consider upgrading for production use**

### Vercel Free Tier

- **100GB bandwidth/month**
- **Unlimited requests**
- **Good for production**

### MongoDB Atlas Free Tier

- **512MB storage**
- **Shared cluster**
- **Sufficient for MVP**

### Cloudinary Free Tier

- **25GB storage**
- **25GB bandwidth/month**
- **Good for MVP**

### Brevo Free Tier

- **300 emails/day**
- **Sufficient for MVP**

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Backend returns 503 after inactivity
- **Solution**: First request takes ~30s to wake up (Render free tier limitation)

**Problem**: Database connection errors
- **Solution**: Check `POSTGRES_URL` and `MONGO_URI` environment variables

**Problem**: CORS errors
- **Solution**: Update `CORS_ORIGINS` to include your frontend URL

### Frontend Issues

**Problem**: API calls fail
- **Solution**: Check `VITE_API_BASE_URL` environment variable

**Problem**: Build fails
- **Solution**: Check build logs in Vercel dashboard

### Email Issues

**Problem**: Emails not sending
- **Solution**: Check `BREVO_API_KEY` is set correctly
- **Solution**: Verify Brevo account is active

## 🔐 Security Checklist

- [ ] `SECRET_KEY` is strong and unique
- [ ] Database passwords are strong
- [ ] API keys are stored in environment variables (not in code)
- [ ] CORS is configured correctly
- [ ] HTTPS is enabled (automatic on Vercel/Render)
- [ ] Environment variables are not exposed in frontend

## 📝 Next Steps

1. Set up monitoring (optional)
2. Configure backups for databases
3. Set up CI/CD (GitHub Actions)
4. Add error tracking (Sentry free tier)
5. Set up analytics (Google Analytics or Plausible)

## 🆘 Support

If you encounter issues:

1. Check Render logs: Dashboard → Logs
2. Check Vercel logs: Dashboard → Deployments → View Logs
3. Check MongoDB Atlas logs: Dashboard → Logs
4. Review error messages in browser console

---

**Happy Deploying! 🚀**

