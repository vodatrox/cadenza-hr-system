.PHONY: help build up down restart logs shell migrate makemigrations createsuperuser collectstatic test clean

help:
	@echo "Cadenza HR - Available Commands:"
	@echo ""
	@echo "  make build            - Build all containers"
	@echo "  make up               - Start all services"
	@echo "  make down             - Stop all services"
	@echo "  make restart          - Restart all services"
	@echo "  make logs             - View all logs"
	@echo "  make shell            - Open Django shell"
	@echo "  make migrate          - Run Django migrations"
	@echo "  make makemigrations   - Create new Django migrations"
	@echo "  make createsuperuser  - Create Django superuser"
	@echo "  make collectstatic    - Collect static files"
	@echo "  make test             - Run backend tests"
	@echo "  make clean            - Remove all containers and volumes"
	@echo ""

build:
	docker compose build

up:
	docker compose up

down:
	docker compose down

restart:
	docker compose down && docker compose up

logs:
	docker compose logs -f

shell:
	docker compose exec backend python manage.py shell

migrate:
	docker compose exec backend python manage.py migrate

makemigrations:
	docker compose exec backend python manage.py makemigrations

createsuperuser:
	docker compose exec backend python manage.py createsuperuser

collectstatic:
	docker compose exec backend python manage.py collectstatic --noinput

test:
	docker compose exec backend python manage.py test

clean:
	docker compose down -v --remove-orphans
