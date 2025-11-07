# 🚀 Deployment Checklist - Production Environment Variables

## ✅ Configuration Status

The application is now configured to:
- **Local Development**: Uses localhost databases (PostgreSQL, MongoDB, Redis)
- **Production**: Uses environment variables from Render dashboard

## ⚠️ Critical Issues to Fix

### 1. **SECRET_KEY is Empty** ❌ CRITICAL
**Status**: Must be set before deployment

**Action Required**:
1. Generate a secure SECRET_KEY (already generated for you):
   ```
   t8DPWczzpsj7q-ozUHkjPJJdWZZnJaSMCZnSvFUMoFE
   ```

2. Add to Render environment variables:
   ```
   SECRET_KEY=t8DPWczzpsj7q-ozUHkjPJJdWZZnJaSMCZnSvFUMoFE
   ```

**Why**: SECRET_KEY is used for JWT token signing. Without it, authentication will fail.

---

### 2. **MONGO_URI Has Quotes** ⚠️ WARNING
**Current Value**:
```
MONGO_URI="mongodb+srv://rampra9981:ayushsince2002!@inknechoes.gkr88ge.mongodb.net/?appName=inknechoes"
```

**Issue**: The quotes around the connection string will be included as part of the value.

**Action Required**: Remove quotes when setting in Render:
```
MONGO_URI=mongodb+srv://rampra9981:ayushsince2002!@inknechoes.gkr88ge.mongodb.net/?appName=inknechoes
```

---

### 3. **REDIS_URL is Empty** ✅ OK
**Status**: This is fine - Redis is optional

**Note**: The application will run without Redis. Caching features will be disabled, but core functionality works.

**Optional**: If you want Redis caching, you can:
- Use Render's Redis service (paid)
- Use Upstash Redis (free tier)
- Leave empty (current setup works)

---

## 📋 Complete Production Environment Variables

Copy these to your Render dashboard (Environment Variables section):

```bash
# Environment
ENV=production

# Database URLs
POSTGRES_URL=postgresql://inknechoes_user:UaaXpQwjIW1AN1ztqJrzedYIz1Nd6qoR@dpg-d46sr6fdiees73dd00n0-a/inknechoes
MONGO_URI=mongodb+srv://rampra9981:ayushsince2002!@inknechoes.gkr88ge.mongodb.net/?appName=inknechoes

# Redis (optional - leave empty if not using)
REDIS_URL=

# JWT Secret (CRITICAL - use the generated one)
SECRET_KEY=t8DPWczzpsj7q-ozUHkjPJJdWZZnJaSMCZnSvFUMoFE

# CORS Origins (comma-separated, no spaces after commas)
CORS_ORIGINS=https://inknechoes.vercel.app,https://inknechoes.com

# Cloudinary (for image storage)
CLOUDINARY_CLOUD_NAME=dbnpntjom
CLOUDINARY_API_KEY=472873266496885
CLOUDINARY_API_SECRET=2Trx_-JG35Gko1vAcn3lxAq1dnI

# Email (Brevo)
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=noreply@inknechoes.com

# Optional AWS S3 (if not using Cloudinary)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=inknechoes-media
```

---

## 🔍 Verification Steps

After setting environment variables in Render:

1. **Check SECRET_KEY is set**:
   - Go to Render dashboard → Your service → Environment
   - Verify `SECRET_KEY` is present and not empty

2. **Check MONGO_URI has no quotes**:
   - Verify the value starts with `mongodb+srv://` (no quotes)

3. **Check CORS_ORIGINS format**:
   - Should be: `https://inknechoes.vercel.app,https://inknechoes.com`
   - No spaces after commas
   - No quotes

4. **Redeploy**:
   - After updating environment variables, trigger a new deployment
   - Check logs for any errors

---

## 🏠 Local Development

Your local development will continue to work with:
- PostgreSQL: `postgresql://postgres:ayush@localhost:5432/postgres`
- MongoDB: `mongodb://localhost:27017/inknechoes`
- Redis: `redis://localhost:6379/0`
- CORS: `http://localhost:5173`

These are the defaults in `config.py` and will be used when environment variables are not set.

---

## 📝 Notes

1. **Environment Variable Priority**:
   - Production (Render): Uses environment variables from dashboard
   - Local Dev: Uses defaults from `config.py` or `.env` file

2. **SECRET_KEY Security**:
   - Never commit SECRET_KEY to git
   - Use different SECRET_KEY for production vs development
   - The generated key above is for production only

3. **MongoDB Connection**:
   - Ensure MongoDB Atlas allows connections from Render IPs
   - Whitelist `0.0.0.0/0` in MongoDB Atlas Network Access (for testing)
   - Or add specific Render IPs for better security

4. **CORS Origins**:
   - Must include your Vercel frontend URL
   - Must include your custom domain (if using)
   - No trailing slashes

---

## ✅ Deployment Checklist

- [ ] Set `SECRET_KEY` in Render (use generated key)
- [ ] Set `MONGO_URI` without quotes
- [ ] Set `CORS_ORIGINS` with correct frontend URLs
- [ ] Set `CLOUDINARY_*` credentials
- [ ] Set `BREVO_API_KEY` (if using email)
- [ ] Verify `POSTGRES_URL` is correct (from Render database)
- [ ] Leave `REDIS_URL` empty (or set if using Redis)
- [ ] Set `ENV=production`
- [ ] Redeploy service
- [ ] Check deployment logs for errors
- [ ] Test authentication (login/register)
- [ ] Test API endpoints

---

## 🐛 Troubleshooting

### Error: "Invalid refresh token"
- Check `SECRET_KEY` is set correctly
- Ensure same `SECRET_KEY` is used consistently

### Error: "MongoDB connection failed"
- Check `MONGO_URI` has no quotes
- Verify MongoDB Atlas network access allows Render IPs
- Check username/password are correct

### Error: "CORS error"
- Verify `CORS_ORIGINS` includes your frontend URL
- Check for typos in URLs
- Ensure no trailing slashes

### Error: "Redis connection failed"
- This is OK if `REDIS_URL` is empty
- Application will run without Redis
- If you want Redis, set a valid `REDIS_URL`

---

## 📞 Support

If you encounter issues:
1. Check Render deployment logs
2. Verify all environment variables are set correctly
3. Check MongoDB Atlas connection settings
4. Verify frontend `VITE_API_BASE_URL` points to Render backend URL

