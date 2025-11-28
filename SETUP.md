# Quick Setup Guide - Cadenza HR Management System

## Prerequisites
- Docker Desktop installed and running
- Git (optional, for cloning)
- Make (optional, for using Makefile commands)

## Quick Start (5 minutes)

### 1. Navigate to Project Directory
```bash
cd cadenza-works
```

### 2. Start the Application
```bash
# Using Make (recommended)
make setup

# Or using Docker Compose directly
# Backend
docker-compose -f docker-compose.backend.yml build
docker-compose -f docker-compose.backend.yml up -d
sleep 10
docker-compose -f docker-compose.backend.yml exec backend python manage.py migrate

# Frontend
docker-compose -f docker-compose.frontend.yml build
docker-compose -f docker-compose.frontend.yml up -d
```

### 3. Create Admin User
```bash
# Using Make
make createsuperuser

# Or using Docker Compose
docker-compose -f docker-compose.backend.yml exec backend python manage.py createsuperuser
```

Follow the prompts to create your admin account.

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/swagger/
- **Django Admin**: http://localhost:8000/admin/

## Default Login
Use the credentials you created with `createsuperuser` command.

## Common Tasks

### View Logs
```bash
# Backend logs
make logs-backend

# Frontend logs
make logs-frontend

# Celery worker logs
make logs-celery
```

### Stop the Application
```bash
# Stop all services
make down

# Stop backend only
make down-backend

# Stop frontend only
make down-frontend
```

### Restart the Application
```bash
# Restart all
make restart

# Restart backend only
make down-backend && make up-backend

# Restart frontend only
make down-frontend && make up-frontend
```

### Access Django Shell
```bash
make shell-backend
```

### Run Database Migrations
```bash
make migrate
```

### Create New Migrations
```bash
make makemigrations
```

## Troubleshooting

### Issue: Containers won't start
**Solution**: Make sure Docker Desktop is running and no other services are using ports 3000, 8000, 5432, or 6379.

### Issue: Database connection errors
**Solution**: Wait a few seconds for PostgreSQL to initialize, then run:
```bash
make migrate
```

### Issue: Frontend can't connect to backend
**Solution**: Check that backend is running:
```bash
docker-compose -f docker-compose.backend.yml ps
```
Restart if needed:
```bash
make down-backend && make up-backend
```

### Issue: Permission errors
**Solution**: On Linux/Mac, you may need to adjust file permissions:
```bash
sudo chown -R $USER:$USER .
```

## Development Mode

### Running Backend Locally (without Docker)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with local database settings
python manage.py migrate
python manage.py runserver
```

### Running Frontend Locally (without Docker)
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local if needed
npm run dev
```

## Initial Data Setup

### 1. Login to the Application
Go to http://localhost:3000 and login with your superuser credentials.

### 2. Add Your First Client
- Click "Add New Client"
- Fill in client details
- Upload logo (optional)
- Click "Save"

### 3. Add Departments
- Select the client
- Navigate to Settings
- Add departments (e.g., IT, HR, Finance)

### 4. Add Employees
- Navigate to Employees
- Click "Add Employee"
- Fill in employee details
- Assign to department
- Set salary and bank details

### 5. Configure Payroll Settings
- Navigate to Settings
- Enable/disable statutory deductions
- Adjust rates if needed
- Save changes

### 6. Generate Payroll
- Navigate to Payroll
- Click "New Period"
- Set start and end dates
- Click "Generate Payroll"
- Review and approve payrolls

## Next Steps

1. Explore the API documentation at http://localhost:8000/swagger/
2. Customize payroll settings for your needs
3. Import bulk employee data (via Django admin or custom script)
4. Set up automated payroll generation with Celery Beat
5. Configure email notifications for payslips

## Getting Help

- Check the main README.md for detailed documentation
- View API documentation at /swagger/
- Check logs: `make logs`
- Create an issue in the repository

## Clean Up

To stop and remove all containers:
```bash
make clean
```

To remove all data (WARNING: This deletes the database):
```bash
make clean-volumes
```

## Running Backend and Frontend Separately

### Backend Only
```bash
# Build and start
make build-backend
make up-backend

# Create superuser
make createsuperuser

# View logs
make logs-backend
```

### Frontend Only
```bash
# Build and start
make build-frontend
make up-frontend

# View logs
make logs-frontend
```

---

Happy HR Management! 🎉
