# Cadenza HR Management System

A comprehensive HR Management System built for Cadenza Consulting to manage multiple client organizations. The system provides robust features for employee management, payroll processing with Nigerian tax calculations, and multi-tenant support.

## Features

### Core Functionality
- **Multi-Tenant Architecture**: Manage multiple client organizations from a single platform
- **Employee Management**: Track employee information, departments, allowances, and deductions
- **Payroll Processing**: Automated payroll calculations with Nigerian tax compliance
  - PAYE Tax calculation based on Nigerian tax bands
  - Pension (8% of basic salary)
  - National Housing Fund (NHF - 2.5% of basic salary)
  - Custom allowances and deductions
  - Support for suspended and unpaid leave scenarios
- **Dashboard Analytics**: Real-time insights into workforce and payroll metrics
- **User Authentication**: JWT-based authentication with session support and OAuth2/SSO ready
- **Document Management**: Upload and manage employee documents (contracts, resumes, etc.)

### Technical Features
- **RESTful API**: Complete API documentation with Swagger/ReDoc
- **Async Task Processing**: Celery for background jobs (bulk payroll generation, notifications)
- **Caching**: Redis for improved performance
- **Responsive Design**: Modern UI built with Next.js and Tailwind CSS
- **Type Safety**: Full TypeScript implementation on frontend
- **Containerization**: Docker and Docker Compose for easy deployment

## Technology Stack

### Backend
- **Framework**: Django 5.0.1
- **API**: Django REST Framework 3.14
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7
- **Task Queue**: Celery 5.3
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Documentation**: drf-yasg (Swagger/OpenAPI)

### Frontend
- **Framework**: Next.js 14.1 (React 18)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Data Fetching**: React Query
- **Forms**: React Hook Form
- **Charts**: Recharts
- **Icons**: React Icons

### DevOps
- **Containerization**: Docker, Docker Compose
- **Web Server**: Gunicorn
- **Reverse Proxy**: Nginx (for production)
- **CI/CD Ready**: GitHub Actions compatible

## Project Structure

```
cadenza-works/
├── backend/                 # Django backend
│   ├── cadenza_hr/         # Main project settings
│   ├── core/               # Core app (base models, middleware)
│   ├── authentication/     # User authentication
│   ├── clients/            # Client management
│   ├── employees/          # Employee management
│   ├── payroll/            # Payroll processing
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities (API client, etc.)
│   │   ├── store/         # State management
│   │   └── types/         # TypeScript type definitions
│   ├── package.json
│   └── Dockerfile
├── docker-compose.backend.yml   # Backend services orchestration
├── docker-compose.frontend.yml  # Frontend service orchestration
├── Makefile               # Build and deployment commands
└── README.md              # This file
```

## Getting Started

### Prerequisites
- Docker and Docker Compose installed
- Make (optional, for using Makefile commands)

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd cadenza-works
```

2. **Set up environment variables**

Backend:
```bash
cd backend
cp .env.example .env
# Edit .env with your settings (optional for development)
```

Frontend:
```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your settings (optional for development)
```

3. **Build and start the application**
```bash
make setup
```

Or without Make:
```bash
# Backend
docker-compose -f docker-compose.backend.yml build
docker-compose -f docker-compose.backend.yml up -d
sleep 10
docker-compose -f docker-compose.backend.yml exec backend python manage.py migrate

# Frontend
docker-compose -f docker-compose.frontend.yml build
docker-compose -f docker-compose.frontend.yml up -d
```

4. **Create a superuser**
```bash
make createsuperuser
```

Or without Make:
```bash
docker-compose -f docker-compose.backend.yml exec backend python manage.py createsuperuser
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/swagger/
- Django Admin: http://localhost:8000/admin/

## Makefile Commands

### Backend Commands
```bash
make build-backend       # Build backend containers
make up-backend          # Start backend services
make down-backend        # Stop backend services
make logs-backend        # View backend logs
make migrate             # Run database migrations
make makemigrations      # Create new migrations
make createsuperuser     # Create Django superuser
make shell-backend       # Open Django shell
make test                # Run tests
```

### Frontend Commands
```bash
make build-frontend      # Build frontend container
make up-frontend         # Start frontend service
make down-frontend       # Stop frontend service
make logs-frontend       # View frontend logs
```

### Combined Commands
```bash
make build               # Build all containers
make up                  # Start all services
make down                # Stop all services
make restart             # Restart all services
make clean               # Remove containers
make setup               # Complete setup process
make help                # Show all available commands
```

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/swagger/
- **ReDoc**: http://localhost:8000/redoc/

### API Endpoints

#### Authentication
- `POST /api/auth/login/` - Login
- `POST /api/auth/register/` - Register user
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `GET /api/auth/me/` - Get current user

#### Clients
- `GET /api/clients/` - List clients
- `POST /api/clients/` - Create client
- `GET /api/clients/{id}/` - Get client details
- `PUT /api/clients/{id}/` - Update client
- `DELETE /api/clients/{id}/` - Delete client

#### Employees
- `GET /api/employees/` - List employees
- `POST /api/employees/` - Create employee
- `GET /api/employees/{id}/` - Get employee details
- `PUT /api/employees/{id}/` - Update employee
- `DELETE /api/employees/{id}/` - Delete employee
- `GET /api/employees/stats/` - Get employee statistics

#### Payroll
- `GET /api/payroll/` - List payrolls
- `POST /api/payroll/` - Create payroll
- `POST /api/payroll/bulk-create/` - Bulk create payrolls
- `GET /api/payroll/{id}/` - Get payroll details
- `PUT /api/payroll/{id}/` - Update payroll
- `GET /api/payroll/settings/` - Get payroll settings
- `PUT /api/payroll/settings/` - Update payroll settings
- `GET /api/payroll/stats/` - Get payroll statistics

## Multi-Tenancy

The system uses a shared database with application-level tenant isolation:

1. All tenant-specific data includes a `client` foreign key
2. API requests must include `X-Client-ID` header
3. Middleware automatically filters queries by client
4. Frontend stores current client in local storage

## Nigerian Payroll Calculations

### Statutory Deductions

1. **Pension (8% of basic salary)**
   - Can be enabled/disabled in payroll settings
   - Rate is configurable

2. **National Housing Fund - NHF (2.5% of basic salary)**
   - Can be enabled/disabled in payroll settings
   - Rate is configurable

3. **PAYE Tax (Progressive rates)**
   - Tax-free allowance: ₦200,000 annually
   - Tax bands (2024):
     - 0 - 300,000: 7%
     - 300,001 - 600,000: 11%
     - 600,001 - 1,100,000: 15%
     - 1,100,001 - 1,600,000: 19%
     - 1,600,001 - 3,200,000: 21%
     - Above 3,200,000: 24%

### Non-Statutory Deductions
- Customizable per employee
- Can be one-time or recurring
- Examples: Loans, advances, cooperative contributions

### Employee Status Impact
- **Suspended**: No salary payment
- **Inactive**: No salary payment
- **On Leave (Unpaid)**: Handled through leave management integration

## Development

### Backend Development
```bash
# Run backend locally (outside Docker)
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend Development
```bash
# Run frontend locally (outside Docker)
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
# Backend tests
make test

# Or directly
docker-compose exec backend python manage.py test
```

## Deployment

### Production Checklist
1. Update `SECRET_KEY` in environment variables
2. Set `DEBUG=False`
3. Configure `ALLOWED_HOSTS`
4. Set up proper PostgreSQL credentials
5. Configure OAuth2 credentials (if using)
6. Set up SSL/TLS certificates
7. Configure static file serving with Nginx
8. Set up automated backups
9. Configure monitoring and logging
10. Set up proper firewall rules

### Digital Ocean Deployment
1. Create a Droplet (Ubuntu 22.04)
2. Install Docker and Docker Compose
3. Clone the repository
4. Set up environment variables
5. Run `make setup`
6. Configure Nginx as reverse proxy
7. Set up SSL with Let's Encrypt

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

Proprietary - Cadenza Consulting

## Support

For issues and questions:
- Create an issue in the repository
- Contact: support@cadenza-consulting.com

---

Built with ❤️ for Cadenza Consulting
