# DevContainer Auto-Setup Instructions for LLM Agents

This document provides systematic instructions for LLM agents to automatically analyze any repository and generate a complete DevContainer setup for local development. Supports **Node.js**, **Python**, and **Go** projects with automatic database detection and configuration.

## Core Objectives

1. **Analyze repository structure and technology stack**
2. **Detect databases and services automatically**
3. **Generate DevContainer configuration files**
4. **Ensure zero impact on production code**
5. **Handle port conflicts and environment variables**
6. **Support DigitalOcean service integration**

---

## Phase 1: Repository Analysis and Technology Detection

### Task 1: Project Structure Analysis

**Execute these commands to understand the repository:**

```bash
# Get repository overview
find . -maxdepth 3 -type f -name "*.md" -o -name "README*" | head -10
ls -la

# Check for common project indicators
ls -la package.json yarn.lock pnpm-lock.yaml  # Node.js
ls -la requirements.txt setup.py pyproject.toml Pipfile  # Python
ls -la go.mod go.sum main.go  # Go
ls -la docker-compose.yml Dockerfile  # Existing containerization
```

**Decision Logic:**

- If unclear repository structure → **ASK USER**: "This repository contains multiple technologies. Which is the main application you want to containerize?"
- If monorepo with frontend/backend → Proceed with both
- If microservices → **ASK USER**: "Multiple services detected. Which services should be included in the DevContainer?"

### Task 2: Technology Stack Detection

**Node.js Detection:**

```bash
# Primary indicators
cat package.json 2>/dev/null | jq -r '.scripts, .dependencies, .devDependencies'
cat yarn.lock package-lock.json pnpm-lock.yaml 2>/dev/null | head -5

# Framework detection
grep -r "express\|fastify\|koa\|nest" package.json 2>/dev/null
grep -r "react\|vue\|angular\|next\|nuxt\|svelte" package.json 2>/dev/null
grep -r "typescript" package.json tsconfig.json 2>/dev/null
```

**Python Detection:**

```bash
# Primary indicators
cat requirements.txt setup.py pyproject.toml Pipfile 2>/dev/null

# Framework detection
grep -r "flask\|django\|fastapi\|tornado\|bottle" . --include="*.py" --include="*.txt" --include="*.toml" 2>/dev/null
grep -r "uvicorn\|gunicorn\|waitress" . --include="*.py" --include="*.txt" 2>/dev/null

# Entry point detection
find . -name "app.py" -o -name "main.py" -o -name "server.py" -o -name "wsgi.py" -o -name "asgi.py" | head -5
```

**Go Detection:**

```bash
# Primary indicators
cat go.mod go.sum 2>/dev/null
go list -m all 2>/dev/null

# Framework detection
grep -r "gin\|echo\|fiber\|mux\|chi" . --include="*.go" 2>/dev/null
find . -name "main.go" -o -name "server.go" -o -name "cmd" -type d | head -5
```

### Task 3: Database and Service Detection

**Automated Database Detection:**

```bash
# PostgreSQL detection
grep -ri "postgresql\|psycopg\|pg_\|postgres" . --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.toml" --include="*.env*" 2>/dev/null

# MySQL detection
grep -ri "mysql\|mariadb" . --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.toml" --include="*.env*" 2>/dev/null

# MongoDB detection
grep -ri "mongodb\|mongoose\|mongo" . --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.toml" --include="*.env*" 2>/dev/null

# Redis detection
grep -ri "redis" . --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.toml" --include="*.env*" 2>/dev/null

# SQLite detection
grep -ri "sqlite" . --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.toml" --include="*.env*" 2>/dev/null
```

**Port Detection:**

```bash
# Search for port configurations
grep -r "port.*[0-9]\{4,5\}\|PORT.*=\|listen.*[0-9]\{4,5\}" . --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.json" --include="*.yml" --include="*.yaml" --include="*.env*" 2>/dev/null

# Check for common default ports in use
lsof -i :3000 :5000 :8000 :8080 :9000 2>/dev/null || echo "Port check requires lsof"
```

**Environment Variable Detection:**

```bash
# Find environment variable patterns
grep -r "DATABASE_URL\|DB_HOST\|DB_USER\|DB_PASS\|REDIS_URL\|MONGO_URL" . --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.env*" 2>/dev/null

# Find .env files
find . -name ".env*" -type f | grep -v node_modules | head -10
```

---

## Phase 2: Configuration Generation

### Task 4: Generate Technology-Specific Configuration

**Create configuration based on detected stack:**

#### For Node.js Projects:

```json
// devcontainer.json template
{
    "name": "{{PROJECT_NAME}} Development",
    "dockerComposeFile": "docker-compose.yml",
    "service": "app",
    "workspaceFolder": "/workspace",

    "forwardPorts": [{{DETECTED_PORTS}}],
    "portsAttributes": {
        "{{APP_PORT}}": {
            "label": "Application",
            "onAutoForward": "notify"
        }
    },

    "postCreateCommand": "{{INSTALL_COMMAND}}",

    "customizations": {
        "vscode": {
            "extensions": [
                "ms-vscode.vscode-node-azure-pack",
                "esbenp.prettier-vscode",
                "dbaeumer.vscode-eslint"{{TYPESCRIPT_EXTENSIONS}}
            ]
        }
    }
}
```

#### For Python Projects:

```json
// devcontainer.json template
{
    "name": "{{PROJECT_NAME}} Development",
    "dockerComposeFile": "docker-compose.yml",
    "service": "app",
    "workspaceFolder": "/workspace",

    "forwardPorts": [{{DETECTED_PORTS}}],
    "portsAttributes": {
        "{{APP_PORT}}": {
            "label": "Application",
            "onAutoForward": "notify"
        }
    },

    "postCreateCommand": "{{INSTALL_COMMAND}}",

    "customizations": {
        "vscode": {
            "extensions": [
                "ms-python.python",
                "ms-python.flake8",
                "ms-python.black-formatter",
                "ms-python.isort"
            ],
            "settings": {
                "python.defaultInterpreterPath": "/usr/local/bin/python"
            }
        }
    }
}
```

#### For Go Projects:

```json
// devcontainer.json template
{
    "name": "{{PROJECT_NAME}} Development",
    "dockerComposeFile": "docker-compose.yml",
    "service": "app",
    "workspaceFolder": "/workspace",

    "forwardPorts": [{{DETECTED_PORTS}}],
    "portsAttributes": {
        "{{APP_PORT}}": {
            "label": "Application",
            "onAutoForward": "notify"
        }
    },

    "postCreateCommand": "go mod download",

    "customizations": {
        "vscode": {
            "extensions": [
                "golang.Go",
                "ms-vscode.vscode-go"
            ],
            "settings": {
                "go.toolsManagement.checkForUpdates": "local"
            }
        }
    }
}
```

### Task 5: Generate Database Services Configuration

**Docker Compose Services Based on Detection:**

```yaml
# Base docker-compose.yml template
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
      - "{{HOST_PORT}}:{{CONTAINER_PORT}}"
    depends_on:
      {{DETECTED_SERVICES}}
    environment:
      {{ENVIRONMENT_VARIABLES}}

{{DATABASE_SERVICES}}

volumes:
{{DATABASE_VOLUMES}}
```

**Service Templates:**

```yaml
# PostgreSQL Service
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_USER: devuser
    POSTGRES_PASSWORD: devpass
    POSTGRES_DB: {{PROJECT_NAME}}_dev
  volumes:
    - postgres-data:/var/lib/postgresql/data
  ports:
    - "5432:5432"

# MySQL Service
mysql:
  image: mysql:8.0
  environment:
    MYSQL_ROOT_PASSWORD: rootpass
    MYSQL_USER: devuser
    MYSQL_PASSWORD: devpass
    MYSQL_DATABASE: {{PROJECT_NAME}}_dev
  volumes:
    - mysql-data:/var/lib/mysql
  ports:
    - "3306:3306"

# MongoDB Service
mongodb:
  image: mongo:7
  environment:
    MONGO_INITDB_ROOT_USERNAME: devuser
    MONGO_INITDB_ROOT_PASSWORD: devpass
    MONGO_INITDB_DATABASE: {{PROJECT_NAME}}_dev
  volumes:
    - mongodb-data:/data/db
  ports:
    - "27017:27017"

# Redis Service
redis:
  image: redis:7-alpine
  volumes:
    - redis-data:/data
  ports:
    - "6379:6379"
```

### Task 6: Generate Dockerfiles

**Node.js Dockerfile:**

```dockerfile
FROM node:{{NODE_VERSION}}-alpine

# Install system dependencies if needed
RUN apk add --no-cache git

WORKDIR /workspace

# Install global packages if detected
{{GLOBAL_PACKAGES}}
```

**Python Dockerfile:**

```dockerfile
FROM python:{{PYTHON_VERSION}}

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace
```

**Go Dockerfile:**

```dockerfile
FROM golang:{{GO_VERSION}}-alpine

# Install git for go modules
RUN apk add --no-cache git

WORKDIR /workspace
```

---

## Phase 3: Port Management and Environment Variables

### Task 7: Port Conflict Resolution

**Automatic Port Selection Logic:**

```bash
# Function to find available port
check_available_port() {
    local port=$1
    local alternative=$2

    if lsof -i :$port >/dev/null 2>&1; then
        echo "Port $port is in use, using $alternative"
        echo $alternative
    else
        echo $port
    fi
}

# Apply to common scenarios
APP_PORT=$(check_available_port 3000 3001)  # Node.js
APP_PORT=$(check_available_port 5000 5001)  # Python Flask
APP_PORT=$(check_available_port 8000 8001)  # Django/Go
```

### Task 8: Environment Variable Generation

**Generate development environment variables:**

```bash
# Create .env.devcontainer file
cat > .devcontainer/.env.devcontainer << EOF
# Database Configuration
{{#if postgresql}}
DATABASE_URL=postgresql://devuser:devpass@postgres:5432/{{PROJECT_NAME}}_dev
{{/if}}
{{#if mysql}}
DATABASE_URL=mysql://devuser:devpass@mysql:3306/{{PROJECT_NAME}}_dev
{{/if}}
{{#if mongodb}}
MONGODB_URL=mongodb://devuser:devpass@mongodb:27017/{{PROJECT_NAME}}_dev
{{/if}}
{{#if redis}}
REDIS_URL=redis://redis:6379/0
{{/if}}

# Application Configuration
NODE_ENV=development
FLASK_ENV=development
GO_ENV=development

# DigitalOcean Configuration (when detected)
{{#if digitalocean}}
# Mount your DO credentials: ~/.config/doctl -> /home/vscode/.config/doctl
DIGITALOCEAN_TOKEN={{DO_TOKEN_FROM_HOST}}
{{/if}}
EOF
```

---

## Phase 4: File Generation Tasks

### Task 9: Create DevContainer Directory and Files

**Execute file creation in sequence:**

```bash
# 1. Create directory structure
mkdir -p .devcontainer

# 2. Generate devcontainer.json
# (Use templates from Task 4 with detected values)

# 3. Generate docker-compose.yml
# (Use templates from Task 5 with detected services)

# 4. Generate Dockerfile
# (Use templates from Task 6 with detected language)

# 5. Create additional files if needed
# - .env.devcontainer (from Task 8)
# - init scripts for databases
# - VS Code settings
```

### Task 10: Cloud Services and AI Tools Integration

**Claude AI Integration (recommended for all projects):**

```json
// Add to devcontainer.json mounts array
"mounts": [
    "source=${localEnv:HOME}/.claude,target=/home/claude/.claude,type=bind"
],
"remoteEnv": {
    "CLAUDE_CONFIG_DIR": "/home/claude/.claude"
}
```

**DigitalOcean Integration (when DO services detected):**

```json
// Add to devcontainer.json
"mounts": [
    "source=${localEnv:HOME}/.config/doctl,target=/home/vscode/.config/doctl,type=bind,consistency=cached"
],
"remoteEnv": {
    "DIGITALOCEAN_TOKEN": "${localEnv:DIGITALOCEAN_TOKEN}"
}
```

**Complete mounts example with both Claude and DigitalOcean:**

```json
"mounts": [
    "source=${localEnv:HOME}/.claude,target=/home/claude/.claude,type=bind",
    "source=${localEnv:HOME}/.config/doctl,target=/home/vscode/.config/doctl,type=bind,consistency=cached"
],
"remoteEnv": {
    "CLAUDE_CONFIG_DIR": "/home/claude/.claude",
    "DIGITALOCEAN_TOKEN": "${localEnv:DIGITALOCEAN_TOKEN}"
}
```

---

## Phase 5: Validation and Testing

### Task 11: Configuration Validation

**Validate generated configuration:**

```bash
# 1. Validate JSON syntax
cat .devcontainer/devcontainer.json | jq '.' >/dev/null

# 2. Validate Docker Compose syntax
docker-compose -f .devcontainer/docker-compose.yml config >/dev/null

# 3. Check for port conflicts
docker-compose -f .devcontainer/docker-compose.yml port app {{APP_PORT}}

# 4. Validate Dockerfile syntax
docker build -f .devcontainer/Dockerfile -t test-build . --dry-run 2>/dev/null || echo "Dockerfile validation needed"
```

### Task 12: Generate Setup Summary

**Create summary for user:**

```markdown
# DevContainer Setup Complete

## Configuration Summary:

- **Language**: {{DETECTED_LANGUAGE}}
- **Framework**: {{DETECTED_FRAMEWORK}}
- **Databases**: {{DETECTED_DATABASES}}
- **Application Port**: {{APP_PORT}} → {{CONTAINER_PORT}}
- **Additional Services**: {{ADDITIONAL_SERVICES}}

## To Start Development:

1. Open project in VS Code
2. Command Palette → "Dev Containers: Reopen in Container"
3. Wait for container build and dependency installation
4. Access application at: http://localhost:{{APP_PORT}}

## Database Access:

{{DATABASE_CONNECTION_INFO}}

## Troubleshooting:

- If port conflicts occur, check docker-compose.yml port mappings
- For database connection issues, ensure containers are running: `docker-compose ps`
- View logs: `docker-compose logs {{SERVICE_NAME}}`
```

---

## Decision Trees for LLM Agents

### Repository Structure Decision Tree:

```
Is main application clear?
├─ YES → Proceed with detected language/framework
└─ NO → Ask user: "Multiple applications detected. Which should be the main development target?"

Are databases detected?
├─ YES → Include relevant database services
└─ NO → Create minimal setup, mention database can be added later

Are there port conflicts?
├─ YES → Use alternative ports and document the mapping
└─ NO → Use standard ports

Is this a monorepo?
├─ YES → Ask: "Should DevContainer include all services or focus on specific one?"
└─ NO → Proceed with single service setup
```

### Technology Detection Decision Tree:

```
Multiple package managers detected?
├─ yarn.lock → Use yarn
├─ pnpm-lock.yaml → Use pnpm
├─ package-lock.json → Use npm
└─ Ask user for preference

Multiple Python dependency files?
├─ pyproject.toml → Use pip install -e .
├─ Pipfile → Use pipenv
├─ requirements.txt → Use pip install -r requirements.txt
└─ Ask user for preference

Multiple Go entry points?
├─ main.go in root → Use go run main.go
├─ cmd/ directory → Ask which command to use
└─ Ask user for main application entry point
```

---

## Automation Checklist for LLM Agents

**Before starting, verify:**

- [ ] Docker is available and running
- [ ] Repository structure is analyzable
- [ ] User has specified any preferences

**During analysis:**

- [ ] Language/framework detected successfully
- [ ] Database services identified
- [ ] Port requirements understood
- [ ] Environment variables mapped

**During generation:**

- [ ] All template variables resolved
- [ ] File syntax validated
- [ ] Port conflicts resolved
- [ ] Database credentials configured

**After generation:**

- [ ] DevContainer builds successfully
- [ ] Application starts without errors
- [ ] Database connections work
- [ ] Port forwarding functional
- [ ] VS Code integration working

**Success criteria:**

- [ ] Developer can immediately start coding
- [ ] Production code remains unchanged
- [ ] All services accessible locally
- [ ] Development environment matches production architecture

---

**Note**: This instruction set is designed for LLM agents to create complete, working DevContainer environments with minimal human intervention. Each task should be executed systematically, with clear decision points for when human input is required.
