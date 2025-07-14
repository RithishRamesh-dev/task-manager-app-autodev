# GitHub Repository Secrets Configuration

This document lists all the required GitHub repository secrets for the CI/CD pipeline.

## Required Secrets

### Core Application Secrets

| Secret Name | Description | Example Value | Required For |
|-------------|-------------|---------------|--------------|
| `DO_API_TOKEN` | DigitalOcean API Token | `dop_v1_abc123...` | All deployments |
| `SECRET_KEY` | Flask application secret key | `your-super-secret-key-here` | All environments |
| `JWT_SECRET_KEY` | JWT token signing key | `jwt-secret-key-here` | All environments |

### Staging Environment Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `STAGING_SECRET_KEY` | Staging-specific Flask secret | `staging-secret-key` |
| `STAGING_JWT_SECRET_KEY` | Staging JWT secret | `staging-jwt-secret` |
| `STAGING_MAIL_SERVER` | Staging email server | `smtp.staging.example.com` |
| `STAGING_MAIL_PORT` | Staging email port | `587` |
| `STAGING_MAIL_USERNAME` | Staging email username | `staging@example.com` |
| `STAGING_MAIL_PASSWORD` | Staging email password | `staging-email-password` |
| `STAGING_REDIS_PASSWORD` | Staging Redis password | `staging-redis-password` |

### Production Environment Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `PRODUCTION_SECRET_KEY` | Production Flask secret | `production-secret-key` |
| `PRODUCTION_JWT_SECRET_KEY` | Production JWT secret | `production-jwt-secret` |
| `PRODUCTION_MAIL_SERVER` | Production email server | `smtp.example.com` |
| `PRODUCTION_MAIL_PORT` | Production email port | `587` |
| `PRODUCTION_MAIL_USERNAME` | Production email username | `notifications@example.com` |
| `PRODUCTION_MAIL_PASSWORD` | Production email password | `production-email-password` |
| `PRODUCTION_REDIS_PASSWORD` | Production Redis password | `production-redis-password` |

## Optional Monitoring Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `SENTRY_DSN` | Sentry error tracking DSN | `https://abc123@sentry.io/123456` |
| `NEW_RELIC_LICENSE_KEY` | New Relic APM license key | `abc123def456...` |
| `DATADOG_API_KEY` | Datadog monitoring API key | `abc123def456...` |

## Setting Up Secrets

### Step 1: Navigate to Repository Settings

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables**
4. Click **Actions**

### Step 2: Add Repository Secrets

For each secret in the tables above:

1. Click **New repository secret**
2. Enter the **Name** exactly as listed in the table
3. Enter the **Secret** value (your actual values, not the examples)
4. Click **Add secret**

### Step 3: Verify Secrets

After adding all secrets, you should see them listed in the repository secrets section. Note that secret values are hidden for security.

## Generating Secret Values

### Flask Secret Key

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### JWT Secret Key

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Redis Password

```bash
openssl rand -base64 32
```

## Environment-Specific Configuration

### Development

For local development, copy `.env.example` to `.env` and fill in your local values:

```bash
cp .env.example .env
# Edit .env with your local configuration
```

### Staging

Staging secrets are automatically injected by GitHub Actions during staging deployments.

### Production

Production secrets are automatically injected by GitHub Actions during production deployments.

## DigitalOcean API Token

### Creating a DigitalOcean API Token

1. Log in to [DigitalOcean Control Panel](https://cloud.digitalocean.com/)
2. Click **API** in the left sidebar
3. Click **Generate New Token**
4. Enter a token name (e.g., "GitHub Actions CI/CD")
5. Select **Write** scope
6. Click **Generate Token**
7. Copy the token immediately (it won't be shown again)
8. Add it as the `DO_API_TOKEN` secret in GitHub

### Token Permissions

The API token needs the following permissions:
- **Apps**: Read, Write (for App Platform deployments)
- **Databases**: Read, Write (for database management)
- **Account**: Read (for account verification)

## Security Best Practices

### Secret Rotation

- Rotate all secrets every 90 days
- Update both GitHub secrets and application configuration
- Test deployments after secret rotation

### Access Control

- Limit repository access to trusted team members
- Use branch protection rules
- Require code reviews for secret-related changes

### Monitoring

- Monitor secret usage through GitHub Actions logs
- Set up alerts for failed deployments
- Regularly audit secret access

## Troubleshooting

### Common Issues

1. **Invalid API Token**
   - Verify token has correct permissions
   - Check if token has expired
   - Regenerate token if necessary

2. **Secret Not Found**
   - Verify secret name matches exactly (case-sensitive)
   - Check if secret was added to correct repository
   - Ensure secret is not empty

3. **Deployment Fails with Auth Error**
   - Check if all required secrets are set
   - Verify secret values are correct
   - Test secrets with manual workflow run

### Validation Commands

```bash
# Test DigitalOcean API token
doctl auth init --access-token YOUR_TOKEN
doctl account get

# Validate app specification
doctl apps spec validate .do/deploy.template.yaml
```

## Backup and Recovery

### Secret Backup

- Document all secret names and sources
- Store regeneration procedures securely
- Maintain emergency contact information

### Recovery Procedures

1. **Lost API Token**
   - Generate new token in DigitalOcean
   - Update GitHub secret
   - Test with staging deployment

2. **Compromised Secrets**
   - Immediately rotate all affected secrets
   - Review access logs
   - Update all environments
   - Monitor for suspicious activity

## Compliance Notes

- All secrets are encrypted by GitHub
- Access is logged and auditable
- Secrets are not exposed in logs or outputs
- Environment-specific isolation is maintained

## Support

For issues with secret configuration:
1. Check this documentation first
2. Verify secret names and values
3. Test with staging environment
4. Contact DevOps team if issues persist

## Updates

This document should be updated when:
- New secrets are added
- Secret requirements change
- Security policies are updated
- New environments are added