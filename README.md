# Ink&Echoes - Writing Platform MVP

A full-stack web platform for writers to create, edit, publish, and share their written works, and for readers to explore, read, and comment.

## 🏗️ Architecture

- **Frontend**: React + Vite + TypeScript + TailwindCSS
- **Backend**: FastAPI (Python 3.11+)
- **Databases**: 
  - PostgreSQL (users, profiles, metadata)
  - MongoDB (post content, drafts)
  - Redis (caching, sessions)
- **Containerization**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd inknechoes
   ```

2. **Set up environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   
   # Frontend
   cp frontend/.env.example frontend/.env
   # Edit frontend/.env if needed
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Seed the database (optional)**
   ```bash
   docker-compose exec backend python scripts/seed.py
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Local Development

#### Backend

1. **Set up Python environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your local database URLs
   ```

3. **Run database migrations**
   ```bash
   # Tables are created automatically on startup
   ```

4. **Start the server**
   ```bash
   uvicorn app.main:app --reload
   ```

#### Frontend

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
inknechoes/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration
│   │   ├── database/            # Database connections
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routes/              # API routes
│   │   ├── services/            # Business logic
│   │   ├── utils/               # Utilities
│   │   └── middleware/          # Middleware
│   ├── scripts/
│   │   └── seed.py              # Database seed script
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # API client
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── store/               # Zustand stores
│   │   └── lib/                 # Utilities
│   ├── package.json
│   ├── vite.config.ts
│   ├── Dockerfile
│   └── .env.example
│
└── docker-compose.yml
```

## 🔐 Default Credentials (from seed script)

- **Admin**: admin@inknechoes.com / admin123
- **Writer 1**: writer1@inknechoes.com / password123
- **Writer 2**: writer2@inknechoes.com / password123

## 🛠️ Features

### Phase 1 MVP

- ✅ User authentication (JWT with HTTP-only cookies)
- ✅ User registration and profiles
- ✅ Create, edit, delete posts
- ✅ Rich text editor (Tiptap)
- ✅ Post publishing (public/draft)
- ✅ Discover page with filtering
- ✅ Comments system
- ✅ Like comments
- ✅ Admin dashboard
- ✅ Auto-save drafts

## 📝 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🔒 Security Features

- JWT tokens stored in HTTP-only cookies
- Password hashing with bcrypt
- CORS configuration
- Rate limiting on API endpoints
- Input validation with Pydantic/Zod
- SQL injection protection (SQLAlchemy ORM)
- XSS protection (React)

## 📦 Deployment

### Quick Deployment Guide

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed deployment instructions.

### Free Tier Deployment Stack

- **Frontend**: Vercel (free tier)
- **Backend**: Render (free tier)
- **PostgreSQL**: Render (free tier)
- **MongoDB**: MongoDB Atlas (free tier - 512MB)
- **Image Storage**: Cloudinary (free tier - 25GB)
- **Email**: Brevo (free tier - 300 emails/day)

### Production Environment Variables

Update `.env` files with production values:
- Strong `SECRET_KEY` (generate with: `openssl rand -hex 32`)
- Production database URLs
- Cloudinary credentials (for image storage)
- Brevo API key (for email)
- Production CORS origins

### Deployment Files

- `vercel.json` - Vercel configuration for frontend
- `render.yaml` - Render configuration for backend
- `backend/Dockerfile` - Production Docker image
- `DEPLOYMENT.md` - Complete deployment guide

### Quick Deploy Steps

1. **Setup Services**:
   - MongoDB Atlas (free cluster)
   - Cloudinary (free account)
   - Brevo (free account)

2. **Deploy Backend**:
   - Push to GitHub
   - Create Render web service
   - Create Render PostgreSQL database
   - Set environment variables
   - Deploy

3. **Deploy Frontend**:
   - Push to GitHub
   - Import to Vercel
   - Set `VITE_API_BASE_URL` environment variable
   - Deploy

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for complete instructions.

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Your License Here]

## 🐛 Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL, MongoDB, and Redis are running
- Check database URLs in `.env` files
- Verify Docker containers are healthy: `docker-compose ps`

### Frontend Not Connecting to Backend

- Check `VITE_API_BASE_URL` in frontend `.env`
- Verify CORS settings in backend `config.py`
- Check browser console for errors

### Port Already in Use

- Change ports in `docker-compose.yml`
- Or stop conflicting services

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Tiptap Documentation](https://tiptap.dev/)
- [TailwindCSS Documentation](https://tailwindcss.com/)

