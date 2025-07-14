# CI/CD Pipeline Setup Guide

This document provides comprehensive instructions for setting up and using the CI/CD pipeline for the Task Manager Application with GitHub Actions and DigitalOcean App Platform.

## Overview

The CI/CD pipeline provides automated deployment workflows for three environments:
- **Preview Apps**: Ephemeral environments for Pull Request testing
- **Staging**: Stable testing environment for integration testing
- **Production**: Live production environment

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Development   │    │     Staging      │    │   Production    │
│                 │    │                  │    │                 │
│ Feature Branches│───▶│ staging branch   │───▶│  main branch    │
│ Preview Apps    │    │ Auto-deploy      │    │ Manual approval │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Workflow Files

### 1. Preview App Deployment (`.github/workflows/preview-app.yml`)

**Trigger**: Pull Requests to `staging` branch
**Purpose**: Create ephemeral preview environments for testing changes

**Features**:
- Automatic deployment on PR creation/updates
- Unique preview URL for each PR
- Health checks and smoke tests
- Automatic cleanup when PR is closed
- PR comments with deployment status

### 2. Staging Deployment (`.github/workflows/staging-deploy.yml`)

**Trigger**: Pushes to `staging` branch
**Purpose**: Deploy to stable staging environment for integration testing

**Features**:
- Comprehensive test suite execution
- Code quality and security checks
- Automatic deployment with monitoring
- Health checks and smoke tests
- Deployment notifications

### 3. Production Deployment (`.github/workflows/production-deploy.yml`)

**Trigger**: Pushes to `main` branch (with manual confirmation)
**Purpose**: Deploy to production environment

**Features**:
- Enhanced security and quality gates
- Staging environment validation
- Manual deployment confirmation
- Production-grade monitoring
- Automated rollback capabilities
- Issue tracking for deployments

### 4. Preview Cleanup (`.github/workflows/cleanup-preview.yml`)

**Trigger**: PR closure
**Purpose**: Clean up ephemeral preview apps to optimize costs

**Features**:
- Automatic resource cleanup
- Cost tracking and reporting
- Error handling for failed cleanups
- Deployment lifecycle tracking

## DigitalOcean App Platform Configuration

### App Specification (`.do/deploy.template.yaml`)

The app specification defines the complete infrastructure:

- **Web Service**: Flask application with WebSocket support
- **Database**: PostgreSQL with environment-specific sizing
- **Redis**: For WebSocket session management
- **Environment Variables**: Secure configuration management
- **Health Checks**: Automated monitoring and alerting

### Environment-Specific Configurations

| Environment | Instance Size | Database | Redis | SSL |
|-------------|---------------|----------|-------|-----|
| Preview     | basic-xxs     | dev      | basic | Yes |
| Staging     | basic-xxs     | dev      | basic | Yes |
| Production  | professional-xs| prod    | standard| Yes |

## Setup Instructions

### 1. Repository Configuration

#### Required GitHub Secrets

Set the following secrets in your GitHub repository settings:

**General Secrets:**
```
DO_API_TOKEN=your_digitalocean_api_token
SECRET_KEY=your_flask_secret_key
JWT_SECRET_KEY=your_jwt_secret_key
```

**Staging Environment:**
```
STAGING_SECRET_KEY=staging_specific_secret
STAGING_JWT_SECRET_KEY=staging_jwt_secret
STAGING_MAIL_SERVER=smtp.staging.example.com
STAGING_MAIL_PORT=587
STAGING_MAIL_USERNAME=staging@example.com
STAGING_MAIL_PASSWORD=staging_mail_password
STAGING_REDIS_PASSWORD=staging_redis_password
```

**Production Environment:**
```
PRODUCTION_SECRET_KEY=production_secret_key
PRODUCTION_JWT_SECRET_KEY=production_jwt_secret
PRODUCTION_MAIL_SERVER=smtp.example.com
PRODUCTION_MAIL_PORT=587
PRODUCTION_MAIL_USERNAME=notifications@example.com
PRODUCTION_MAIL_PASSWORD=production_mail_password
PRODUCTION_REDIS_PASSWORD=production_redis_password
```

#### Setting Up Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret from the lists above

### 2. DigitalOcean Setup

#### Install doctl CLI

```bash
# macOS
brew install doctl

# Linux
cd ~
wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
tar xf ~/doctl-1.94.0-linux-amd64.tar.gz
sudo mv ~/doctl /usr/local/bin
```

#### Authenticate doctl

```bash
doctl auth init
# Enter your DigitalOcean API token when prompted
```

#### Verify Setup

```bash
doctl account get
doctl apps list
```

### 3. Branch Protection Rules

Set up branch protection for `staging` and `main` branches:

1. Go to **Settings** → **Branches**
2. Add protection rules for both branches:
   - Require status checks to pass
   - Require branches to be up to date
   - Require review from CODEOWNERS
   - Include administrators

### 4. Environment Configuration

#### GitHub Environments

Create the following environments in GitHub:

1. Go to **Settings** → **Environments**
2. Create `staging` environment:
   - No deployment protection rules
   - Environment secrets (if different from repository)
3. Create `production` environment:
   - Required reviewers: Add team members
   - Deployment branches: Limit to `main`
   - Environment secrets

## Usage Guide

### Development Workflow

#### 1. Feature Development

```bash
# Create feature branch from staging
git checkout staging
git pull origin staging
git checkout -b feature/my-new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"
git push origin feature/my-new-feature
```

#### 2. Create Pull Request

1. Create PR from `feature/my-new-feature` to `staging`
2. GitHub Actions will automatically:
   - Run tests and code quality checks
   - Deploy preview app
   - Comment on PR with preview URL

#### 3. Review and Test

1. Review code changes
2. Test feature on preview app
3. Check automated test results
4. Approve and merge when ready

#### 4. Staging Deployment

When PR is merged to `staging`:
1. Staging deployment workflow runs automatically
2. Tests and security checks execute
3. Application deploys to staging environment
4. Health checks verify deployment

#### 5. Production Deployment

```bash
# Create PR from staging to main
git checkout main
git pull origin main
git checkout staging
git pull origin staging
git checkout -b release/staging-to-main
git push origin release/staging-to-main

# Create PR from release/staging-to-main to main
# After approval and merge, production deployment requires manual confirmation
```

### Manual Deployment

#### Staging Deployment

```bash
# Trigger manual staging deployment
gh workflow run staging-deploy.yml
```

#### Production Deployment

```bash
# Trigger manual production deployment (requires confirmation)
gh workflow run production-deploy.yml -f confirm_production="DEPLOY TO PRODUCTION"
```

### Local Development

#### Setup

```bash
# Clone repository
git clone <repository-url>
cd task-manager-app-autodev

# Run setup script
./scripts/deploy.sh local-setup

# Start development server
./scripts/deploy.sh start
```

#### Testing Deployment Configuration

```bash
# Test deployment configuration
./scripts/deploy.sh test-deploy --env staging

# Validate app specification
./scripts/deploy.sh validate-spec

# Check required secrets
./scripts/deploy.sh check-secrets --env production
```

## Monitoring and Troubleshooting

### Deployment Status

#### GitHub Actions

1. Go to **Actions** tab in GitHub repository
2. View workflow runs and their status
3. Click on specific run for detailed logs

#### DigitalOcean App Platform

1. Visit [DigitalOcean Cloud Control Panel](https://cloud.digitalocean.com/apps)
2. Select your app
3. View deployment history and logs

### Common Issues

#### 1. Deployment Timeout

**Cause**: Large application or slow build process
**Solution**: 
- Optimize Docker layers
- Use build caching
- Increase timeout values in workflows

#### 2. Health Check Failures

**Cause**: Application not starting properly
**Solution**:
- Check application logs in DigitalOcean dashboard
- Verify environment variables
- Check database connectivity

#### 3. Secret/Environment Variable Issues

**Cause**: Missing or incorrect configuration
**Solution**:
- Verify all required secrets are set
- Check secret names match workflow files
- Validate environment-specific configurations

#### 4. Database Migration Failures

**Cause**: Migration conflicts or database issues
**Solution**:
- Check migration files for conflicts
- Verify database permissions
- Review migration logs in app platform

### Debugging Commands

```bash
# Check app status
doctl apps get <app-id>

# View app logs
doctl apps logs <app-id> --type run

# View deployment logs
doctl apps logs <app-id> --type deploy

# List all apps
doctl apps list

# Validate app spec locally
doctl apps spec validate .do/deploy.template.yaml
```

## Security Considerations

### Secrets Management

- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Use environment-specific secrets

### Access Control

- Limit who can approve production deployments
- Use branch protection rules
- Require code reviews
- Enable audit logging

### Network Security

- All deployments use HTTPS
- Database connections are encrypted
- Redis connections use authentication
- CORS is properly configured

## Cost Optimization

### Preview Apps

- Automatically cleaned up when PRs close
- Use minimal instance sizes
- Development-tier databases
- Automatic scaling disabled

### Resource Management

- Staging uses development-tier resources
- Production uses optimized instance sizes
- Automatic cleanup prevents resource accumulation
- Monitoring alerts for unusual usage

## Performance Monitoring

### Health Checks

- Application health endpoint: `/health`
- WebSocket status: `/websocket/status`
- Database connectivity verification
- Redis connectivity verification

### Metrics

- Response time monitoring
- Error rate tracking
- Resource utilization
- User activity metrics

## Backup and Recovery

### Database Backups

- Automatic daily backups on production
- Point-in-time recovery available
- Cross-region backup replication
- Backup retention policies

### Application Recovery

- Blue-green deployment strategy
- Rollback capabilities
- Configuration version control
- Infrastructure as code

## Compliance and Auditing

### Deployment Tracking

- All deployments create GitHub issues
- Deployment history maintained
- Change tracking through Git
- Audit logs available

### Security Scanning

- Vulnerability scanning in pipelines
- Dependency security checks
- Static code analysis
- Security policy enforcement

## Future Enhancements

### Planned Improvements

- Multi-region deployments
- Canary deployment strategy
- Advanced monitoring integration
- Automated performance testing
- Infrastructure cost optimization

### Integration Opportunities

- Slack notifications
- Datadog monitoring
- New Relic APM
- Sentry error tracking
- PagerDuty alerting

## Support and Maintenance

### Documentation Updates

Keep this document updated when:
- Adding new environments
- Changing deployment procedures
- Updating security requirements
- Adding new integrations

### Regular Maintenance Tasks

- Review and rotate secrets monthly
- Update dependencies regularly
- Monitor resource usage
- Review deployment metrics
- Update documentation

## Troubleshooting Checklist

Before deploying:
- [ ] All tests pass locally
- [ ] Required secrets are configured
- [ ] App specification is valid
- [ ] Database migrations are ready
- [ ] Environment variables are set

After deployment:
- [ ] Health checks pass
- [ ] Application responds correctly
- [ ] Database connectivity works
- [ ] WebSocket functionality works
- [ ] All features are accessible

For production deployments:
- [ ] Staging deployment successful
- [ ] Security scans pass
- [ ] Performance tests complete
- [ ] Backup verification
- [ ] Rollback plan ready