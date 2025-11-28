# Docker Setup Guide

This project uses **separate Docker Compose files** for backend and frontend services.

## Architecture

```
┌─────────────────────────────────────┐
│   docker-compose.backend.yml        │
│   ├── PostgreSQL (db)               │
│   ├── Redis                          │
│   ├── Django Backend                 │
│   ├── Celery Worker                  │
│   └── Celery Beat                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   docker-compose.frontend.yml       │
│   └── Next.js Frontend               │
└─────────────────────────────────────┘
```

Both share the same Docker network: `cadenza_hr_network`

## Quick Start

### Option 1: Using Make (Recommended)

```bash
# Setup everything
make setup

# Or step by step (IMPORTANT: Start backend first!)
make build-backend
make up-backend        # This creates the shared network
make build-frontend
make up-frontend       # This connects to the network
```

**⚠️ Important:** Always start the backend before the frontend, as the backend creates the shared Docker network that both services use.

### Option 2: Using Docker Compose Directly

```bash
# Backend (MUST be started first!)
docker-compose -f docker-compose.backend.yml build
docker-compose -f docker-compose.backend.yml up -d

# Wait for DB to be ready, then migrate
sleep 10
docker-compose -f docker-compose.backend.yml exec backend python manage.py migrate

# Frontend (after backend is running)
docker-compose -f docker-compose.frontend.yml build
docker-compose -f docker-compose.frontend.yml up -d
```

**⚠️ Note:** If you try to start frontend before backend, you'll get an error: `network cadenza_hr_network declared as external, but could not be found`

## Common Operations

### Start Services

```bash
# All services
make up

# Backend only
make up-backend

# Frontend only
make up-frontend
```

### Stop Services

```bash
# All services
make down

# Backend only
make down-backend

# Frontend only
make down-frontend
```

### View Logs

```bash
# Backend
make logs-backend

# Frontend
make logs-frontend

# Celery Worker
make logs-celery
```

### Rebuild Services

```bash
# Rebuild backend after code changes
make down-backend
make build-backend
make up-backend

# Rebuild frontend after package changes
make down-frontend
make build-frontend
make up-frontend
```

## Development Workflow

### 1. Backend Development

```bash
# Start backend
make up-backend

# Watch logs
make logs-backend

# Run migrations after model changes
make makemigrations
make migrate

# Access Django shell
make shell-backend

# Run tests
make test
```

### 2. Frontend Development

For local development, you can run frontend outside Docker:

```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

Or use Docker:

```bash
make up-frontend
make logs-frontend
```

### 3. Database Operations

```bash
# Create migrations
make makemigrations

# Apply migrations
make migrate

# Create superuser
make createsuperuser

# Access Django admin
# http://localhost:8000/admin
```

## Networking

Both compose files use the shared network `cadenza_hr_network`:

- Backend creates the network
- Frontend connects to it as external
- **Server-side services** can communicate using their service names:
  - `db` - PostgreSQL
  - `redis` - Redis
  - `backend` - Django API (for internal Docker communication)

### Important: Frontend API Calls

⚠️ **The frontend uses `localhost:8000` NOT `backend:8000`** because:
- Next.js frontend runs in the **browser** (client-side)
- The browser doesn't have access to Docker's internal network
- Browser requests go through the host machine's network
- `localhost:8000` is mapped to the backend container via Docker port mapping

**Example:**
```typescript
// Correct - uses localhost
const API_URL = 'http://localhost:8000'

// Wrong - would fail in browser
const API_URL = 'http://backend:8000'  // ❌ Browser can't resolve 'backend'
```

## Environment Variables

### Backend (.env)
Located in `backend/.env`:
```env
DEBUG=True
SECRET_KEY=your-secret-key
DB_NAME=cadenza_hr
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
REDIS_URL=redis://redis:6379/0
```

### Frontend (.env.local)
Located in `frontend/.env.local`:
```env
# IMPORTANT: Use localhost, not 'backend'
# Frontend runs in browser, needs to access via host machine
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Troubleshooting

### Backend won't start
```bash
# Check if ports are in use
lsof -i :8000
lsof -i :5432
lsof -i :6379

# View backend logs
make logs-backend

# Restart backend
make down-backend && make up-backend
```

### Frontend won't start
```bash
# Check if port is in use
lsof -i :3000

# View frontend logs
make logs-frontend

# Rebuild frontend (if dependencies changed)
make down-frontend
make build-frontend
make up-frontend
```

### Database connection issues
```bash
# Wait for database to be ready
sleep 10

# Run migrations
make migrate

# Check database status
docker-compose -f docker-compose.backend.yml exec db pg_isready -U postgres
```

### Network issues
```bash
# Check network exists
docker network ls | grep cadenza

# Recreate network
docker network rm cadenza_hr_network
docker-compose -f docker-compose.backend.yml up -d
```

### Frontend can't reach backend
```bash
# Check backend is running
docker-compose -f docker-compose.backend.yml ps

# Check network connectivity
docker-compose -f docker-compose.frontend.yml exec frontend ping backend

# Verify API URL
echo $NEXT_PUBLIC_API_URL
```

## Clean Up

### Remove containers (keep data)
```bash
make clean
```

### Remove everything including data
```bash
make clean-volumes
```

### Full reset
```bash
make clean-volumes
rm -rf backend/venv
rm -rf frontend/node_modules
rm -rf frontend/.next
```

## Production Deployment

For production:

1. Update environment variables
2. Set `DEBUG=False` in backend
3. Use production-ready secrets
4. Configure proper CORS settings
5. Set up SSL/TLS
6. Use managed database (not container)
7. Set up proper logging
8. Configure monitoring

Example production docker-compose:
```yaml
# Use production builds
# Add nginx reverse proxy
# Use environment files
# Configure health checks
# Set resource limits
```

## Tips

1. **Always start backend before frontend** - Frontend needs backend API
2. **Use Make commands** - They handle the docker-compose file references
3. **Check logs first** - Most issues are visible in logs
4. **Network matters** - Both services must be on the same network
5. **Environment files** - Keep them up to date

## Further Reading

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Django Docker Best Practices](https://docs.docker.com/samples/django/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
