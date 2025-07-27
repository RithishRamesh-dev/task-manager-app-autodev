# Task Manager Application

A production-ready task management application built with Flask, PostgreSQL, and deployed on DigitalOcean App Platform.

## Features

- **User Authentication**: Secure JWT-based authentication system
- **Project Management**: Create and manage projects with team collaboration
- **Task Management**: Full CRUD operations for tasks with status tracking
- **Real-time Updates**: WebSocket integration for live collaboration
- **Role-based Access**: Project owners, admins, members, and viewers
- **Responsive Design**: Mobile-first responsive web interface

## Tech Stack

- **Backend**: Flask, SQLAlchemy, Flask-Migrate
- **Database**: PostgreSQL
- **Authentication**: JWT (Flask-JWT-Extended)
- **Real-time**: Flask-SocketIO
- **Frontend**: Flask Templates with Bootstrap/Tailwind
- **Deployment**: DigitalOcean App Platform
- **CI/CD**: GitHub Actions

## Quick Start

### Option 1: DevContainer (Recommended)

The easiest way to get started is using the provided DevContainer with VS Code:

1. **Prerequisites**: Docker Desktop and VS Code with Dev Containers extension
2. **Clone and Open**:
```bash
git clone https://github.com/RithishRamesh-dev/task-manager-app-autodev.git
cd task-manager-app-autodev
code .
```
3. **Launch DevContainer**: Select "Reopen in Container" when prompted
4. **Automatic Setup**: The container automatically sets up:
   - PostgreSQL database (taskmanager_dev)
   - Redis for WebSocket sessions
   - Python dependencies
   - Database migrations

### Option 2: Manual Installation

**Prerequisites**: Python 3.9+, PostgreSQL, and Redis installed locally

1. Clone the repository:
```bash
git clone https://github.com/RithishRamesh-dev/task-manager-app-autodev.git
cd task-manager-app-autodev
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your PostgreSQL and Redis configuration
```

5. Set up PostgreSQL database:
```bash
# Create database (adjust connection details as needed)
createdb taskmanager_dev
```

6. Initialize database:
```bash
flask db migrate -m "Initial migration"
flask db upgrade
```

7. Create admin user:
```bash
flask create-admin
```

8. Run the application:
```bash
python app_socketio.py  # Recommended - includes WebSocket support
# OR
flask run              # Basic Flask server
```

## Database Schema

### Users Table
- User authentication and profile information
- Password hashing with bcrypt
- Active status tracking

### Projects Table  
- Project organization and management
- Owner relationship to users
- Soft delete with is_active flag

### Tasks Table
- Core task management functionality
- Status tracking (pending, in_progress, completed, cancelled)
- Priority levels (low, medium, high, critical)
- Assignment and creation tracking

### Task Comments Table
- Comments and updates on tasks
- User attribution and timestamps

### Project Members Table
- Many-to-many relationship for project access
- Role-based permissions (owner, admin, member, viewer)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/{id}` - Get project details
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Tasks
- `GET /api/tasks` - List tasks with filtering
- `POST /api/tasks` - Create new task
- `GET /api/tasks/{id}` - Get task details
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

## Development

### DevContainer Benefits
- **Consistent Environment**: Same PostgreSQL and Redis versions as production
- **Zero Setup**: Everything configured automatically
- **Claude Code Ready**: Integrated support with security restrictions
- **Team Collaboration**: Standardized development environment

### Running Tests
```bash
pytest
pytest --cov=app  # With coverage
```

### Code Quality
```bash
black .  # Format code
flake8  # Lint code
```

### Database Migrations
```bash
flask db migrate -m "Description of changes"
flask db upgrade
```

## Deployment

The application is configured for deployment on DigitalOcean App Platform with automatic CI/CD via GitHub Actions.

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Flask secret key
- `JWT_SECRET_KEY`: JWT signing key
- `REDIS_URL`: Redis connection string

## Contributing

1. Fork the repository
2. Open the project in VS Code with DevContainer support
3. Create a feature branch (`git checkout -b feature/amazing-feature`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

**Note**: Please use the DevContainer for development to ensure consistency across the team.

## License

This project is licensed under the MIT License - see the LICENSE file for details.