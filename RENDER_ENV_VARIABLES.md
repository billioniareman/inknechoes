# 🚀 Render Environment Variables - Copy & Paste

## Quick Setup Instructions

1. Go to **Render Dashboard** → Your Web Service → **Environment**
2. Click **"Add Environment Variable"** for each variable below
3. Copy the **Key** and **Value** exactly as shown
4. Click **"Save Changes"**
5. **Redeploy** your service

---

## Environment Variables to Add

### 1. Environment
```
Key: ENV
Value: production
```

### 2. PostgreSQL Database
```
Key: POSTGRES_URL
Value: postgresql://inknechoes_user:UaaXpQwjIW1AN1ztqJrzedYIz1Nd6qoR@dpg-d46sr6fdiees73dd00n0-a/inknechoes
```

### 3. MongoDB Atlas
```
Key: MONGO_URI
Value: mongodb+srv://rampra9981:ayushsince2002!@inknechoes.gkr88ge.mongodb.net/?appName=inknechoes
```
⚠️ **Important**: Remove any quotes around the value if present

### 4. Redis (Optional - Leave Empty)
```
Key: REDIS_URL
Value: (leave empty or don't add this variable)
```

### 5. JWT Secret Key ⚠️ CRITICAL
```
Key: SECRET_KEY
Value: t8DPWczzpsj7q-ozUHkjPJJdWZZnJaSMCZnSvFUMoFE
```
⚠️ **Critical**: This must be set for authentication to work

### 6. CORS Origins
```
Key: CORS_ORIGINS
Value: https://inknechoes.vercel.app,https://inknechoes.com
```
⚠️ **Important**: No spaces after commas, no quotes

### 7. Cloudinary - Cloud Name
```
Key: CLOUDINARY_CLOUD_NAME
Value: dbnpntjom
```

### 8. Cloudinary - API Key
```
Key: CLOUDINARY_API_KEY
Value: 472873266496885
```

### 9. Cloudinary - API Secret
```
Key: CLOUDINARY_API_SECRET
Value: 2Trx_-JG35Gko1vAcn3lxAq1dnI
```

### 10. Brevo API Key
```
Key: BREVO_API_KEY
Value: your_brevo_api_key
```
⚠️ **Action Required**: Replace `your_brevo_api_key` with your actual Brevo API key

### 11. Email From Address
```
Key: EMAIL_FROM
Value: noreply@inknechoes.com
```

---

## Optional Variables (Can Skip)

### AWS S3 (if not using Cloudinary)
```
Key: AWS_ACCESS_KEY_ID
Value: (leave empty)
Key: AWS_SECRET_ACCESS_KEY
Value: (leave empty)
Key: S3_BUCKET
Value: inknechoes-media
```

### Legacy Email Support
```
Key: EMAIL_API_KEY
Value: (leave empty)
```

---

## ✅ Verification Checklist

After adding all variables:

- [ ] `ENV` = `production`
- [ ] `POSTGRES_URL` is set (from Render database)
- [ ] `MONGO_URI` is set (no quotes)
- [ ] `SECRET_KEY` is set (critical!)
- [ ] `CORS_ORIGINS` includes your frontend URL
- [ ] `CLOUDINARY_*` credentials are set
- [ ] `BREVO_API_KEY` is set (replace placeholder)
- [ ] `EMAIL_FROM` is set
- [ ] `REDIS_URL` is empty or not set (optional)

---

## 🚀 After Setting Variables

1. **Save** all environment variables
2. **Redeploy** your service (Render will auto-deploy or click "Manual Deploy")
3. **Check logs** for any errors
4. **Test** your API endpoints

---

## 📝 Notes

- **SECRET_KEY**: Never share or commit this key. It's used for JWT token signing.
- **MONGO_URI**: Ensure MongoDB Atlas allows connections from Render IPs (whitelist `0.0.0.0/0` for testing)
- **CORS_ORIGINS**: Must match your frontend URL exactly (check Vercel deployment URL)
- **REDIS_URL**: App works without Redis, but caching features will be disabled

---

## 🐛 Troubleshooting

### "Invalid refresh token" error
→ Check `SECRET_KEY` is set correctly

### "MongoDB connection failed"
→ Check `MONGO_URI` has no quotes
→ Verify MongoDB Atlas network access

### "CORS error"
→ Verify `CORS_ORIGINS` includes your frontend URL
→ Check for typos in URLs

### "Redis connection failed"
→ This is OK if `REDIS_URL` is empty
→ App will run without Redis

---

## 📞 Need Help?

1. Check Render deployment logs
2. Verify all environment variables are set correctly
3. Check MongoDB Atlas connection settings
4. Verify frontend `VITE_API_BASE_URL` points to Render backend URL

