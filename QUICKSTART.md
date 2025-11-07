# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Clone and Setup

```bash
# Navigate to project directory
cd inknechoes

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Step 2: Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check services are running
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 3: Seed Database (Optional)

```bash
# Create sample users and posts
docker-compose exec backend python scripts/seed.py
```

### Step 4: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Step 5: Login

Use the seeded credentials:
- **Admin**: admin@inknechoes.com / admin123
- **Writer**: writer1@inknechoes.com / password123

## 🛠️ Development Mode

### Backend (Local)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend (Local)

```bash
cd frontend
npm install
npm run dev
```

## 📝 Common Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Rebuild containers
docker-compose build --no-cache

# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend

# Access backend shell
docker-compose exec backend bash

# Access database
docker-compose exec postgres psql -U dev -d inknechoes
```

## 🐛 Troubleshooting

### Port Already in Use
Change ports in `docker-compose.yml` or stop conflicting services.

### Database Connection Errors
- Ensure all services are healthy: `docker-compose ps`
- Check `.env` files have correct database URLs
- Wait for databases to be ready (health checks)

### Frontend Can't Connect to Backend
- Check `VITE_API_BASE_URL` in `frontend/.env`
- Verify CORS settings in `backend/app/config.py`
- Check browser console for errors

## ✅ Next Steps

1. Create your account at http://localhost:5173/register
2. Write your first post at http://localhost:5173/write
3. Explore the API docs at http://localhost:8000/docs
4. Check out the Discover page at http://localhost:5173/discover

