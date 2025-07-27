# DevContainer Setup Instructions

This document provides comprehensive instructions for creating a DevContainer environment for any project, with specific focus on maintaining consistency between local development and production environments.

## Phase 1: Project Analysis and Planning

### Step 1: Review Application Architecture

1. **Identify the main application files:**
   ```bash
   # Look for main entry points
   ls -la *.py *.js *.ts *.go *.java
   
   # Check for configuration files
   ls -la *config* *.yaml *.yml *.json *.toml
   ```

2. **Analyze the technology stack:**
   ```bash
   # Python projects
   cat requirements.txt setup.py pyproject.toml
   
   # Node.js projects
   cat package.json package-lock.json
   
   # Other languages - check relevant dependency files
   ```

3. **Review application entry points:**
   - Look for files like `app.py`, `main.py`, `server.js`, `main.go`
   - Check for special files like `app_socketio.py` (WebSocket support)
   - Identify any special runtime requirements

### Step 2: Database and Services Inventory

1. **Identify required databases:**
   ```bash
   # Search for database connections in code
   grep -r "postgresql\|mysql\|mongodb\|redis\|sqlite" . --include="*.py" --include="*.js" --include="*.yml"
   
   # Check configuration files for database URLs
   grep -r "DATABASE_URL\|DB_HOST\|REDIS_URL" .
   ```

2. **List external services:**
   ```bash
   # Look for service dependencies
   grep -r "amazonaws\|gcp\|azure\|stripe\|sendgrid" . --include="*.py" --include="*.js"
   ```

3. **Check for Docker availability:**
   ```bash
   # Verify Docker is running
   docker --version
   docker-compose --version
   
   # If not available, STOP and install Docker first
   ```

### Step 3: Port Analysis and Conflicts

1. **Identify application ports:**
   ```bash
   # Search for port configurations
   grep -r "port.*[0-9]\|PORT.*=" . --include="*.py" --include="*.js" --include="*.yml"
   ```

2. **Check for port conflicts (especially on macOS):**
   ```bash
   # Check common ports that might be in use
   lsof -i :3000  # React default
   lsof -i :5000  # Flask default (often used by AirPlay on Mac)
   lsof -i :8000  # Django default
   lsof -i :8080  # Common alternative
   ```

3. **Plan port mapping:**
   - If port 5000 is occupied (common on Mac), use 5001:5000
   - Document any port changes needed

## Phase 2: DevContainer Configuration

### Step 4: Create DevContainer Structure

1. **Create the .devcontainer directory:**
   ```bash
   mkdir -p .devcontainer
   ```

2. **Create devcontainer.json:**
   ```json
   {
       "name": "[Project Name] Development",
       "dockerComposeFile": "docker-compose.yml",
       "service": "app",
       "workspaceFolder": "/workspace",
       
       "forwardPorts": [5001, 5432, 6379],
       "portsAttributes": {
           "5001": {
               "label": "Application",
               "onAutoForward": "notify"
           },
           "5432": {
               "label": "PostgreSQL"
           },
           "6379": {
               "label": "Redis"
           }
       },
       
       "postCreateCommand": "pip install -r requirements.txt",
       
       "customizations": {
           "vscode": {
               "extensions": [
                   "ms-python.python",
                   "ms-python.flake8",
                   "ms-python.black-formatter"
               ],
               "settings": {
                   "python.defaultInterpreterPath": "/usr/local/bin/python",
                   "python.formatting.provider": "black"
               }
           }
       }
   }
   ```

3. **Create docker-compose.yml:**
   ```yaml
   services:
     app:
       build: 
         context: ..
         dockerfile: .devcontainer/Dockerfile
       volumes:
         - ..:/workspace
       working_dir: /workspace
       command: sleep infinity
       ports:
         - "5001:5000"  # Adjust based on port conflict analysis
       depends_on:
         - postgres
         - redis
       environment:
         - DATABASE_URL=postgresql://username:password@postgres:5432/dbname
         - REDIS_URL=redis://redis:6379/0
         - FLASK_ENV=development
         - FLASK_APP=app_socketio.py

     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_USER: username
         POSTGRES_PASSWORD: password
         POSTGRES_DB: dbname
       volumes:
         - postgres-data:/var/lib/postgresql/data
       ports:
         - "5432:5432"

     redis:
       image: redis:7-alpine
       volumes:
         - redis-data:/data
       ports:
         - "6379:6379"

   volumes:
     postgres-data:
     redis-data:
   ```

4. **Create Dockerfile:**
   ```dockerfile
   FROM python:3.11

   # Install system dependencies
   RUN apt-get update && apt-get install -y \
       build-essential \
       libpq-dev \
       git \
       && rm -rf /var/lib/apt/lists/*

   WORKDIR /workspace
   ```

### Step 5: Cloud Credentials Integration

1. **Create credentials mount configuration:**
   Add to devcontainer.json mounts section:
   ```json
   "mounts": [
       "source=${localEnv:HOME}/.aws,target=/home/vscode/.aws,type=bind,consistency=cached",
       "source=${localEnv:HOME}/.gcp,target=/home/vscode/.gcp,type=bind,consistency=cached",
       "source=${localEnv:HOME}/.claude,target=/home/vscode/.claude,type=bind,consistency=cached"
   ]
   ```

2. **Add environment variables for cloud access:**
   ```json
   "remoteEnv": {
       "AWS_PROFILE": "${localEnv:AWS_PROFILE}",
       "GOOGLE_APPLICATION_CREDENTIALS": "/home/vscode/.gcp/credentials.json",
       "CLAUDE_CONFIG_DIR": "/home/vscode/.claude"
   }
   ```

## Phase 3: Implementation and Testing

### Step 6: Database Schema and Migrations

1. **Plan database initialization:**
   ```bash
   # For Flask applications
   flask db init     # First time only
   flask db migrate -m "Initial migration"
   flask db upgrade
   
   # For Django applications  
   python manage.py makemigrations
   python manage.py migrate
   ```

2. **Create database initialization script if needed:**
   ```sql
   -- .devcontainer/init.sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   GRANT ALL PRIVILEGES ON DATABASE dbname TO username;
   ```

### Step 7: Application Configuration Updates

1. **Update configuration for containerized environment:**
   - Ensure database URLs point to container names (postgres, redis)
   - Set appropriate host binding (0.0.0.0, not 127.0.0.1)
   - Configure any service discovery for container networking

2. **Fix common import/compatibility issues:**
   ```bash
   # Check for deprecated Flask features
   grep -r "before_first_request" .
   
   # Check for consistent model imports
   grep -r "from.*models.*import" .
   ```

### Step 8: DevContainer Startup and Validation

1. **Build and start the DevContainer:**
   - Open project in VS Code
   - Command Palette → "Dev Containers: Reopen in Container"
   - Wait for build completion

2. **Validate services:**
   ```bash
   # Inside DevContainer
   # Check database connectivity
   psql -h postgres -U username -d dbname -c "SELECT 1;"
   
   # Check Redis connectivity
   redis-cli -h redis ping
   
   # Start the application
   python app_socketio.py  # or appropriate start command
   ```

3. **Test access from host:**
   ```bash
   # From host machine
   curl http://localhost:5001/api/health
   
   # Open browser to http://localhost:5001
   ```

## Phase 4: Troubleshooting Guide

### Common Issues and Solutions

#### Port Conflicts (Especially macOS)
- **Problem**: Port 5000 already in use by AirPlay/ControlCenter
- **Solution**: Use port mapping like `5001:5000` in docker-compose.yml

#### Database Connection Issues
- **Problem**: "Connection refused" to database
- **Solution**: Ensure database container is running and use container name in connection string

#### Permission Issues
- **Problem**: File permission errors in container
- **Solution**: Add proper user configuration in Dockerfile or use remoteUser in devcontainer.json

#### Import/Module Errors
- **Problem**: Python modules not found or import conflicts
- **Solution**: Check PYTHONPATH, ensure consistent naming (e.g., TaskComment vs Comment)

#### Flask Compatibility Issues
- **Problem**: AttributeError for deprecated Flask features
- **Solution**: Update code to use Flask 2.x+ compatible patterns

### Platform-Specific Considerations

#### macOS
- Port 5000 often occupied by AirPlay Receiver
- Use port 5001 or disable AirPlay Receiver in System Preferences

#### Windows
- Ensure Docker Desktop is configured for Linux containers
- Check Windows Defender firewall for port blocking

#### Linux
- Verify Docker service is running: `sudo systemctl status docker`
- Check for SELinux restrictions if applicable

## Phase 5: Best Practices and Optimization

### Security Considerations
1. **Credential Management:**
   - Never commit credentials to repository
   - Use environment-specific credential mounting
   - Implement proper secret management for production

2. **Network Security:**
   - Use internal Docker networks for service communication
   - Only expose necessary ports to host
   - Consider implementing network policies for production

### Performance Optimization
1. **Volume Management:**
   - Use cached volumes for better performance
   - Implement proper data persistence strategies
   - Regular cleanup of unused volumes

2. **Build Optimization:**
   - Use multi-stage builds where appropriate
   - Implement proper layer caching
   - Minimize image size through strategic package installation

### Development Workflow
1. **Code Quality:**
   - Integrate linting and formatting tools
   - Set up pre-commit hooks
   - Configure testing frameworks

2. **Debugging:**
   - Configure proper debugger integration
   - Set up logging for development environment
   - Implement health checks for all services

## Validation Checklist

Before considering the DevContainer setup complete, verify:

- [ ] All required services start successfully
- [ ] Application is accessible from host machine
- [ ] Database connections work correctly
- [ ] Cloud credentials are properly mounted (if needed)
- [ ] Port forwarding works without conflicts
- [ ] All dependencies install correctly
- [ ] Application runs without errors
- [ ] Development tools (linting, formatting) work
- [ ] Hot reload/live updates function properly
- [ ] Tests can be executed in the container environment

## Maintenance and Updates

### Regular Maintenance Tasks
1. **Update base images regularly**
2. **Review and update dependency versions**
3. **Clean up unused Docker resources**
4. **Update VS Code extensions and settings**
5. **Review and update security configurations**

### Documentation Updates
1. **Keep this file updated with project changes**
2. **Document any custom configurations**
3. **Maintain troubleshooting solutions**
4. **Update team onboarding procedures**

---

**Note**: This setup provides a production-like development environment with proper isolation, consistent tooling, and cloud integration capabilities. Regular maintenance and updates ensure continued reliability and security.