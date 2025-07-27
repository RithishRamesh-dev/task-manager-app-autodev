# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### DevContainer Setup (Recommended)
This project includes a complete DevContainer setup with PostgreSQL and Redis:

1. **Prerequisites**: Docker Desktop and VS Code with Dev Containers extension
2. **Open in DevContainer**: Open this project in VS Code and select "Reopen in Container"
3. **Automatic Setup**: The container will automatically:
   - Install Python dependencies
   - Set up PostgreSQL (taskmanager_dev database)
   - Set up Redis for WebSocket sessions
   - Apply database migrations
   - Configure environment variables

### Manual Environment Setup (Alternative)
**Note**: Manual setup requires PostgreSQL and Redis to be installed locally.
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Database Operations
```bash
flask db migrate -m "Description of changes"  # Create migration
flask db upgrade     # Apply migrations
flask create-admin   # Create admin user
```

### Running the Application
```bash
# In DevContainer or with WebSocket support
python app_socketio.py    # Recommended - includes WebSocket support

# Alternative methods
flask run                 # Development server (no WebSocket)
python app.py            # Basic Flask app
```

### Testing and Code Quality
```bash
pytest               # Run all tests
pytest --cov=app     # Run tests with coverage
black .              # Format code with Black
flake8               # Lint code with Flake8
```

### WebSocket Development
The application includes real-time features via Flask-SocketIO. The WebSocket server requires Redis for session management and is fully configured in the DevContainer environment.

## Architecture Overview

### Application Structure
- **Flask Application Factory Pattern**: The app uses `create_app()` in `app/__init__.py`
- **Blueprint Organization**: Separate blueprints for API (`app/api/`) and frontend (`app/frontend/`)
- **Database Models**: SQLAlchemy models in `app/models/` with relationship mapping
- **WebSocket Integration**: Real-time features via Flask-SocketIO in `app/websocket/`

### Key Components

#### API Layer (`app/api/`)
- **Flask-RESTX**: Used for API documentation with Swagger UI at `/api/docs`
- **JWT Authentication**: Token-based auth with refresh tokens
- **Input Validation**: Marshmallow schemas for request validation
- **Namespaced Routes**: auth, projects, tasks, comments

#### Models (`app/models/`)
- **User**: Authentication and profile management with bcrypt password hashing
- **Project**: Project organization with owner relationships
- **Task**: Core task management with status/priority tracking
- **TaskComment**: Comment system for task collaboration
- **ProjectMember**: Many-to-many relationship with role-based permissions

#### WebSocket Events (`app/websocket/events.py`)
- **Authentication**: JWT token or session-based WebSocket auth
- **Room Management**: Project-based rooms for real-time updates
- **Event Broadcasting**: Task updates, comments, status changes
- **User Presence**: Online user tracking and typing indicators

### Database Schema
The application uses PostgreSQL for all environments (development, testing, and production). Key relationships:
- Users can own multiple projects and be members of others
- Tasks belong to projects and can be assigned to users
- Comments are linked to tasks and authored by users
- Project members have roles (owner, admin, member, viewer)

### Configuration Management
- **Environment-based**: Development, Testing, Production configs
- **Environment Variables**: Database URL, JWT secrets, Redis URL
- **DevContainer**: Pre-configured environment variables in `.devcontainer/.env`
- **Default Fallbacks**: PostgreSQL connection for manual setup

### Frontend Integration
- **Template Rendering**: Flask templates with Jinja2
- **Session Management**: User session data available in templates
- **API Communication**: Frontend calls REST API endpoints
- **Real-time Updates**: WebSocket integration for live collaboration

## Important Implementation Notes

### Database Migrations
Always create migrations when modifying models. The migration system tracks schema changes and can be applied to production safely.

### JWT Token Management
- Access tokens expire in 1 hour
- Refresh tokens expire in 30 days
- Use `/api/auth/refresh` endpoint to get new access tokens

### WebSocket Authentication
WebSocket connections require either:
1. JWT token passed as query parameter: `?token=<jwt_token>`
2. Valid session with user_id

### Project Access Control
Users can access projects if they are:
- The project owner (created the project)
- Listed as a project member in the ProjectMember table

### Real-time Event Flow
1. API endpoints trigger WebSocket events via utility functions
2. Connected clients receive real-time updates in project rooms
3. Users automatically join rooms for projects they have access to

### Testing Strategy
- Unit tests for models and business logic
- API endpoint testing with pytest
- WebSocket event testing for real-time features
- Coverage reporting to ensure comprehensive testing

## Entry Points

- **Main Application**: `app.py` - Creates and runs the Flask app
- **Application Factory**: `app/__init__.py` - Configures and initializes app
- **WebSocket Server**: `app_socketio.py` - SocketIO-enabled server (recommended)
- **Configuration**: `config.py` - Environment-specific settings

## DevContainer Details

### Container Services
- **App Container**: Python 3.11 development environment with all dependencies
- **PostgreSQL**: Version 15 with persistent storage and initialization scripts
- **Redis**: Version 7 with persistent storage for WebSocket sessions and rate limiting

### Automatic Configuration
- Database migrations applied on container start
- Environment variables pre-configured for container networking
- VS Code extensions and settings optimized for Python development
- Pre-commit hooks installed for code quality

### Development Workflow
1. Open project in VS Code
2. Select "Reopen in Container" when prompted
3. Wait for container setup to complete (includes firewall initialization)
4. Start development with `python app_socketio.py`
5. Access application at `http://localhost:5000`
6. API documentation available at `http://localhost:5000/api/docs`

### Claude Code Integration
The DevContainer includes full Claude Code support with:
- Network security restrictions (whitelisted domains only)
- Persistent command history and Claude configuration
- Pre-configured development environment
- No additional setup required for Claude Code usage