#!/bin/bash

# Task Manager Application Deployment Script
# This script helps with local deployment testing and utilities

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/deployment.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

# Help function
show_help() {
    echo "Task Manager Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  local-setup     Set up local development environment"
    echo "  test-deploy     Test deployment configuration"
    echo "  validate-spec   Validate DigitalOcean App Platform spec"
    echo "  check-secrets   Check required environment variables"
    echo "  db-setup        Set up database and run migrations"
    echo "  run-tests       Run all tests"
    echo "  start           Start the application locally"
    echo "  help            Show this help message"
    echo ""
    echo "Options:"
    echo "  --env ENVIRONMENT    Specify environment (development, staging, production)"
    echo "  --verbose           Enable verbose output"
    echo "  --skip-tests        Skip running tests"
    echo ""
    echo "Examples:"
    echo "  $0 local-setup"
    echo "  $0 test-deploy --env staging"
    echo "  $0 validate-spec"
}

# Local development setup
local_setup() {
    log "🚀 Setting up local development environment..."
    
    cd "$PROJECT_ROOT"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        log_warning ".env file not found, copying from .env.example"
        cp .env.example .env
        log "Please edit .env file with your actual configuration values"
    fi
    
    # Check Python version
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    log "Python version: $PYTHON_VERSION"
    
    # Set up virtual environment
    if [ ! -d "venv" ]; then
        log "Creating virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    log "Installing dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
    
    # Set up database
    log "Setting up database..."
    ./scripts/deploy.sh db-setup
    
    log_success "Local development environment setup complete!"
    log "To start development:"
    log "  1. Activate virtual environment: source venv/bin/activate"
    log "  2. Start the application: ./scripts/deploy.sh start"
}

# Database setup
db_setup() {
    log "🗄️  Setting up database..."
    
    # Check if we're in virtual environment
    if [ -z "$VIRTUAL_ENV" ]; then
        source venv/bin/activate
    fi
    
    # Initialize database if migrations don't exist
    if [ ! -d "migrations" ]; then
        log "Initializing database migrations..."
        flask db init
    fi
    
    # Create migration if needed
    log "Creating database migration..."
    flask db migrate -m "Deployment setup migration" || log_warning "Migration might already exist"
    
    # Apply migrations
    log "Applying database migrations..."
    flask db upgrade
    
    log_success "Database setup complete!"
}

# Test deployment configuration
test_deploy() {
    local env=${1:-development}
    log "🧪 Testing deployment configuration for environment: $env"
    
    # Validate environment variables
    ./scripts/deploy.sh check-secrets --env "$env"
    
    # Validate app spec
    ./scripts/deploy.sh validate-spec --env "$env"
    
    # Run tests if not skipped
    if [ "$SKIP_TESTS" != "true" ]; then
        ./scripts/deploy.sh run-tests
    fi
    
    log_success "Deployment configuration test complete!"
}

# Validate DigitalOcean App Platform specification
validate_spec() {
    local env=${1:-development}
    log "📋 Validating DigitalOcean App Platform specification for $env..."
    
    if [ ! -f ".do/deploy.template.yaml" ]; then
        log_error "App Platform specification template not found at .do/deploy.template.yaml"
        exit 1
    fi
    
    # Check if doctl is installed
    if ! command -v doctl &> /dev/null; then
        log_warning "doctl is not installed. Install it from https://docs.digitalocean.com/reference/doctl/"
        log "Performing basic YAML validation instead..."
        
        # Basic YAML syntax check
        if command -v python3 &> /dev/null; then
            python3 -c "
import yaml
import sys
try:
    with open('.do/deploy.template.yaml', 'r') as f:
        yaml.safe_load(f)
    print('✅ YAML syntax is valid')
except yaml.YAMLError as e:
    print(f'❌ YAML syntax error: {e}')
    sys.exit(1)
"
        fi
    else
        # Generate spec for validation
        mkdir -p .do/generated
        
        # Create a test spec with placeholder values
        sed \
            -e "s/\${ENVIRONMENT}/$env/g" \
            -e "s/\${BRANCH}/main/g" \
            -e "s/\${APP_DOMAIN}/test.example.com/g" \
            -e "s/\${DB_PRODUCTION}/false/g" \
            -e "s/\${SECRET_KEY}/test-secret/g" \
            -e "s/\${JWT_SECRET_KEY}/test-jwt-secret/g" \
            -e "s/\${CORS_ALLOWED_ORIGINS}/https:\/\/test.example.com/g" \
            -e "s/\${MAIL_SERVER}/smtp.example.com/g" \
            -e "s/\${MAIL_PORT}/587/g" \
            -e "s/\${MAIL_USERNAME}/test@example.com/g" \
            -e "s/\${MAIL_PASSWORD}/test-password/g" \
            -e "s/\${REDIS_PASSWORD}/test-redis-password/g" \
            .do/deploy.template.yaml > .do/generated/test-spec.yaml
        
        # Validate with doctl
        if doctl apps spec validate .do/generated/test-spec.yaml; then
            log_success "App Platform specification is valid!"
        else
            log_error "App Platform specification validation failed!"
            exit 1
        fi
        
        # Cleanup
        rm -f .do/generated/test-spec.yaml
    fi
}

# Check required secrets/environment variables
check_secrets() {
    local env=${1:-development}
    log "🔐 Checking required environment variables for $env..."
    
    # Required variables for all environments
    required_vars=(
        "SECRET_KEY"
        "JWT_SECRET_KEY"
        "DATABASE_URL"
    )
    
    # Additional variables for production
    if [ "$env" = "production" ]; then
        required_vars+=(
            "PRODUCTION_SECRET_KEY"
            "PRODUCTION_JWT_SECRET_KEY"
            "PRODUCTION_MAIL_SERVER"
            "PRODUCTION_MAIL_PASSWORD"
            "DO_API_TOKEN"
        )
    elif [ "$env" = "staging" ]; then
        required_vars+=(
            "STAGING_SECRET_KEY"
            "STAGING_JWT_SECRET_KEY"
            "DO_API_TOKEN"
        )
    fi
    
    # Check if variables are set (for GitHub Actions, they would be in secrets)
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ] && [ ! -f ".env" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_warning "Missing environment variables for $env environment:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        log "For local development, set these in your .env file"
        log "For GitHub Actions, set these as repository secrets"
    else
        log_success "All required environment variables are configured!"
    fi
}

# Run tests
run_tests() {
    log "🧪 Running test suite..."
    
    if [ -z "$VIRTUAL_ENV" ]; then
        source venv/bin/activate
    fi
    
    # Check if tests directory exists
    if [ -d "tests" ]; then
        log "Running pytest..."
        python -m pytest tests/ -v --tb=short
    else
        log_warning "No tests directory found. Consider adding tests!"
    fi
    
    # Run linting
    log "Running code quality checks..."
    if command -v flake8 &> /dev/null; then
        flake8 app/ --count --statistics --max-line-length=88 --exclude=migrations
    else
        log_warning "flake8 not installed, skipping linting"
    fi
    
    # Run formatting check
    if command -v black &> /dev/null; then
        black --check app/ --diff
    else
        log_warning "black not installed, skipping format check"
    fi
    
    log_success "Tests completed!"
}

# Start application locally
start_app() {
    log "🚀 Starting Task Manager application..."
    
    if [ -z "$VIRTUAL_ENV" ]; then
        source venv/bin/activate
    fi
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        log_error ".env file not found. Run './scripts/deploy.sh local-setup' first"
        exit 1
    fi
    
    # Load environment variables
    set -a
    source .env
    set +a
    
    # Check if database exists
    if [ ! -f "instance/taskmanager_dev.db" ] && [[ "$DATABASE_URL" == *"sqlite"* ]]; then
        log "Database not found, setting up..."
        ./scripts/deploy.sh db-setup
    fi
    
    # Start the application
    log "Starting Flask application with WebSocket support..."
    python app_socketio.py
}

# Main script logic
main() {
    local command="$1"
    shift
    
    # Parse options
    while [[ $# -gt 0 ]]; do
        case $1 in
            --env)
                ENVIRONMENT="$2"
                shift 2
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Set default environment
    ENVIRONMENT=${ENVIRONMENT:-development}
    
    # Execute command
    case "$command" in
        local-setup)
            local_setup
            ;;
        test-deploy)
            test_deploy "$ENVIRONMENT"
            ;;
        validate-spec)
            validate_spec "$ENVIRONMENT"
            ;;
        check-secrets)
            check_secrets "$ENVIRONMENT"
            ;;
        db-setup)
            db_setup
            ;;
        run-tests)
            run_tests
            ;;
        start)
            start_app
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"