# Student Project Finance Tracker Backend

A Django REST Framework backend for tracking student finances, loans, scholarships, and notifications. The project uses PostgreSQL, JWT authentication, Celery for background tasks, and Redis as the message broker.

## Features
- Custom `users.User` model authenticating with email
- Finance tracking (categories, income, expenses, budgets, summaries)
- Loan management with automatic repayment schedules
- Scholarship applications with approval-driven disbursements
- Notification system with optional email delivery and Celery reminders
- JWT authentication with registration, token obtain/refresh endpoints
- OpenAPI documentation served through drf-spectacular
- Dockerized development stack with Celery worker and beat services

## Requirements
- Docker + Docker Compose (recommended)
- Python 3.11 (for local development without Docker)

## Environment Variables
Copy `.env.example` to `.env` and adjust values as needed.

```bash
cp .env.example .env
```

Key variables:
- `DJANGO_SECRET_KEY`
- `DEBUG`
- `POSTGRES_*`
- `REDIS_URL`

## Running with Docker

```bash
docker compose up --build
```

Services started:
- `backend` (Gunicorn serving Django on `:8000`)
- `db` (PostgreSQL)
- `redis`
- `celery-worker`
- `celery-beat`

Access the API at `http://localhost:8000/` and docs at `http://localhost:8000/api/docs/`.

## Local Development (without Docker)
1. Create and activate a Python 3.11 virtual environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Ensure PostgreSQL and Redis are running locally.
4. Apply migrations and create a superuser:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   ```
5. Run the development server:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
6. In separate terminals start Celery worker and beat:
   ```bash
   celery -A core_project worker -l info
   celery -A core_project beat -l info
   ```

## Testing

Run Django's test suite:
```bash
python manage.py test
```

## API Documentation
- Schema: `GET /api/schema/`
- Swagger UI: `GET /api/docs/`

Refer to `docs/postman_collection.json` for sample requests.
