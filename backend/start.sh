#!/bin/sh

echo "Waiting for database..."
# Give the database a moment to be reachable
sleep 3

echo "Running migrations..."
python manage.py migrate --noinput || {
    echo "Migration failed, retrying in 5s..."
    sleep 5
    python manage.py migrate --noinput
}

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn on port ${PORT:-8000}..."
exec gunicorn cadenza_hr.wsgi:application \
    --bind "0.0.0.0:${PORT:-8000}" \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
