# AWS Amplify Setup Guide for Fabrknt Suite

This guide explains how to set up AWS Amplify hosting for PULSE, TRACE, and FABRIC, consistent with the main website deployment.

## Prerequisites

- AWS Account with appropriate permissions
- GitHub repository access
- AWS CLI configured (optional, for advanced setup)

## Amplify Configuration Files

Each product (PULSE, TRACE, FABRIC) should have an `amplify.yml` file in its root directory.

### Template: `amplify.yml`

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
        - echo "Installing dependencies"
    build:
      commands:
        - npm run build
        - echo "Build completed"
    postBuild:
      commands:
        - echo "Post-build completed"
  artifacts:
    baseDirectory: .next
    files:
      - "**/*"
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
customHeaders:
  - pattern: '**/*'
    headers:
      - key: 'Cache-Control'
        value: 'public, max-age=31536000, immutable'
  - pattern: '*.html'
    headers:
      - key: 'Cache-Control'
        value: 'public, max-age=0, must-revalidate'
  - pattern: '/api/**'
    headers:
      - key: 'Cache-Control'
        value: 'no-cache, no-store, must-revalidate'
```

## Environment Variables

Set the following environment variables in AWS Amplify Console:

### Required Variables

```
NEXT_PUBLIC_API_URL=https://api.trace.fabrknt.com  # or pulse/fabric
AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
```

### Database Connection (for Lambda functions)

```
RDS_HOST=your-rds-endpoint.region.rds.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=fabrknt_suite
RDS_USERNAME=admin
```

**Note:** Database credentials should be stored in AWS Secrets Manager and accessed via Lambda environment variables, not directly in Amplify.

## Setup Steps

### 1. Create Amplify App

1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Connect to GitHub repository
4. Select branch (main/master)
5. Configure build settings:
   - Build specification: `amplify.yml`
   - App root directory: `/` (or subdirectory if monorepo)

### 2. Configure Custom Domain

1. In Amplify Console, go to "Domain management"
2. Add custom domain:
   - `trace.fabrknt.com` for TRACE
   - `pulse.fabrknt.com` for PULSE
   - `fabric.fabrknt.com` for FABRIC
3. Configure DNS records (CNAME) as instructed
4. SSL certificate will be automatically provisioned

### 3. Set Environment Variables

1. In Amplify Console, go to "App settings" → "Environment variables"
2. Add all required variables (see above)
3. For sensitive values, use AWS Secrets Manager integration

### 4. Configure Build Settings

Ensure `amplify.yml` is in the repository root or specify the path in Amplify Console.

### 5. Set Up Backend Resources

Before deploying, ensure backend resources are set up:
- RDS PostgreSQL instance
- API Gateway endpoints
- Lambda functions
- Cognito User Pool

See `AWS_ARCHITECTURE.md` for detailed backend setup.

## Monorepo Setup (Optional)

If all three products are in a monorepo:

```yaml
# amplify.yml for monorepo
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd trace  # or pulse/fabric
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: trace/.next  # adjust path
    files:
      - "**/*"
```

## CI/CD Integration

Amplify automatically builds and deploys on:
- Push to connected branch
- Pull request creation (preview deployments)

### Manual Deployments

1. Go to Amplify Console
2. Select app
3. Click "Redeploy this version" or "Deploy"

## Monitoring

- **Build logs**: Available in Amplify Console → "Build history"
- **Access logs**: CloudWatch Logs integration
- **Performance**: CloudWatch metrics and X-Ray tracing

## Cost Optimization

- Use Amplify's free tier (1000 build minutes/month)
- Enable caching for static assets
- Use CloudFront (included) for CDN
- Optimize build times with caching

## Troubleshooting

### Build Failures

1. Check build logs in Amplify Console
2. Verify `amplify.yml` syntax
3. Ensure all dependencies are in `package.json`
4. Check Node.js version compatibility

### Environment Variables Not Working

1. Verify variable names match exactly
2. Check if variables are set in correct environment (production/preview)
3. Ensure `NEXT_PUBLIC_` prefix for client-side variables

### Custom Domain Issues

1. Verify DNS records are correct
2. Wait for DNS propagation (up to 48 hours)
3. Check SSL certificate status
4. Verify domain ownership

## Next Steps

1. Set up backend infrastructure (see `AWS_ARCHITECTURE.md`)
2. Configure API Gateway endpoints
3. Set up Lambda functions
4. Configure Cognito authentication
5. Test end-to-end flow

