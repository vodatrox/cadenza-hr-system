.PHONY: help build build-backend build-frontend up up-backend up-frontend down down-backend down-frontend restart logs shell-backend shell-frontend migrate makemigrations createsuperuser test clean

# Default target
help:
	@echo "Cadenza HR Management System - Available Commands:"
	@echo ""
	@echo "Backend Commands:"
	@echo "  make build-backend      - Build backend containers"
	@echo "  make up-backend         - Start backend services"
	@echo "  make down-backend       - Stop backend services"
	@echo "  make logs-backend       - View backend logs"
	@echo "  make shell-backend      - Open Django shell"
	@echo "  make migrate            - Run Django migrations"
	@echo "  make makemigrations     - Create new Django migrations"
	@echo "  make createsuperuser    - Create Django superuser"
	@echo ""
	@echo "Frontend Commands:"
	@echo "  make build-frontend     - Build frontend container"
	@echo "  make up-frontend        - Start frontend service"
	@echo "  make down-frontend      - Stop frontend service"
	@echo "  make logs-frontend      - View frontend logs"
	@echo "  make shell-frontend     - Open frontend container shell"
	@echo ""
	@echo "Combined Commands:"
	@echo "  make build              - Build all containers"
	@echo "  make up                 - Start all services"
	@echo "  make down               - Stop all services"
	@echo "  make restart            - Restart all services"
	@echo "  make logs               - View all logs"
	@echo "  make clean              - Remove all containers"
	@echo "  make clean-volumes      - Remove all volumes (WARNING: Deletes all data)"
	@echo ""
	@echo "Other Commands:"
	@echo "  make collectstatic      - Collect static files"
	@echo "  make test               - Run backend tests"
	@echo "  make install-frontend   - Install frontend dependencies"
	@echo "  make install-backend    - Install backend dependencies"
	@echo "  make setup              - Complete setup (backend + frontend)"
	@echo ""

# Build containers
build-backend:
	@echo "Building backend containers..."
	docker-compose -f docker-compose.backend.yml build

build-frontend:
	@echo "Building frontend container..."
	docker-compose -f docker-compose.frontend.yml build

build: build-backend build-frontend

# Start services
up-backend:
	@echo "Starting backend services..."
	docker-compose -f docker-compose.backend.yml up
	@echo "Backend services started!"
	@echo "Backend: http://localhost:8000"
	@echo "API Docs: http://localhost:8000/swagger/"

up-frontend:
	@echo "Starting frontend service..."
	@echo "Checking if backend network exists..."
	@docker network inspect cadenza_hr_network >/dev/null 2>&1 || \
		(echo "ERROR: Backend network not found. Please start backend first with: make up-backend" && exit 1)
	docker-compose -f docker-compose.frontend.yml up
	@echo "Frontend started!"
	@echo "Frontend: http://localhost:3000"

up: up-backend up-frontend

# Stop services
down-backend:
	@echo "Stopping backend services..."
	docker-compose -f docker-compose.backend.yml down

down-frontend:
	@echo "Stopping frontend service..."
	docker-compose -f docker-compose.frontend.yml down

down: down-backend down-frontend

# Restart services
restart: down up

# View logs
logs-backend:
	docker-compose -f docker-compose.backend.yml logs -f

logs-frontend:
	docker-compose -f docker-compose.frontend.yml logs -f

logs-celery:
	docker-compose -f docker-compose.backend.yml logs -f celery_worker

logs:
	@echo "Showing backend logs (Ctrl+C to stop, then use 'make logs-frontend' for frontend)..."
	docker-compose -f docker-compose.backend.yml logs -f

# Django shell
shell-backend:
	docker-compose -f docker-compose.backend.yml exec backend python manage.py shell

# Frontend shell
shell-frontend:
	docker-compose -f docker-compose.frontend.yml exec frontend sh

# Database operations
migrate:
	@echo "Running migrations..."
	docker-compose -f docker-compose.backend.yml exec backend python manage.py migrate

makemigrations:
	@echo "Creating migrations..."
	docker-compose -f docker-compose.backend.yml exec backend python manage.py makemigrations

# Create superuser
createsuperuser:
	docker-compose -f docker-compose.backend.yml exec backend python manage.py createsuperuser

# Collect static files
collectstatic:
	docker-compose -f docker-compose.backend.yml exec backend python manage.py collectstatic --noinput

# Run tests
test:
	docker-compose -f docker-compose.backend.yml exec backend python manage.py test

# Install dependencies
install-frontend:
	cd frontend && npm install

install-backend:
	cd backend && pip install -r requirements.txt

# Clean up
clean:
	@echo "Removing all containers..."
	docker-compose -f docker-compose.backend.yml down --remove-orphans
	docker-compose -f docker-compose.frontend.yml down --remove-orphans

clean-volumes:
	@echo "WARNING: This will delete all data!"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f docker-compose.backend.yml down -v; \
		docker network rm cadenza_hr_network 2>/dev/null || true; \
		echo "All volumes removed!"; \
	fi

# Development setup
setup:
	@echo "Setting up Cadenza HR for development..."
	@echo ""
	@echo "=== BACKEND SETUP ==="
	@echo "1. Building backend containers..."
	docker-compose -f docker-compose.backend.yml build
	@echo "2. Starting backend services..."
	docker-compose -f docker-compose.backend.yml up -d
	@echo "3. Waiting for database..."
	sleep 10
	@echo "4. Running migrations..."
	docker-compose -f docker-compose.backend.yml exec backend python manage.py migrate
	@echo ""
	@echo "=== FRONTEND SETUP ==="
	@echo "6. Building frontend container..."
	docker-compose -f docker-compose.frontend.yml build
	@echo "7. Starting frontend service..."
	docker-compose -f docker-compose.frontend.yml up -d
	@echo ""
	@echo "Setup complete!"
	@echo "Backend: http://localhost:8000"
	@echo "Frontend: http://localhost:3000"
	@echo "API Docs: http://localhost:8000/swagger/"
	@echo ""
	@echo "Next steps:"
	@echo "  1. Create a superuser: make createsuperuser"
	@echo "  2. Visit http://localhost:3000 to use the application"

# Quick start (setup + createsuperuser)
quickstart: setup
	@echo ""
	@echo "Creating superuser..."
	docker-compose -f docker-compose.backend.yml exec backend python manage.py createsuperuser
