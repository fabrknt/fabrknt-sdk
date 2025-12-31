# Fabrknt Suite AWS Infrastructure

This directory contains the AWS CDK infrastructure code for Fabrknt Suite (PULSE, TRACE, FABRIC).

## Overview

The infrastructure includes:

-   **VPC**: Isolated network with public, private, and database subnets
-   **RDS PostgreSQL**: Primary database for all products
-   **DynamoDB**: High-frequency writes (clicks, events)
-   **ElastiCache Redis**: Caching and session storage
-   **API Gateway**: RESTful APIs for all products
-   **Lambda**: Serverless functions for APIs and background workers
-   **Cognito**: User authentication and authorization
-   **S3**: Static assets and data exports
-   **EventBridge**: Scheduled tasks and event-driven architecture
-   **SQS**: Async task processing

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Node.js** 18+ and npm/pnpm
4. **AWS CDK** CLI installed: `npm install -g aws-cdk`

## Quick Start

### 1. Install Dependencies

```bash
cd infrastructure
npm install
```

### 2. Configure AWS Credentials

```bash
aws configure
```

Or set environment variables:

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

### 3. Bootstrap CDK (First Time Only)

```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### 4. Deploy Infrastructure

**Development Environment:**

```bash
npm run deploy:dev
```

**Production Environment:**

```bash
npm run deploy:prod
```

Or use the setup script:

```bash
./scripts/setup.sh dev us-east-1
```

### 5. Get Stack Outputs

After deployment, retrieve important values:

```bash
./scripts/get-outputs.sh dev
```

Or manually:

```bash
aws cloudformation describe-stacks \
  --stack-name FabrkntSuite-dev \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table
```

## Project Structure

```
infrastructure/
├── src/
│   ├── index.ts                 # CDK app entry point
│   └── stacks/
│       └── fabrknt-suite-stack.ts  # Main stack definition
├── lambda/                      # Lambda function templates
│   ├── trace/
│   ├── pulse/
│   ├── fabric/
│   └── shared/
├── scripts/
│   ├── setup.sh                 # Setup script
│   └── get-outputs.sh           # Get stack outputs
├── package.json
├── tsconfig.json
├── cdk.json
└── README.md
```

## Environment Variables

After deployment, you'll need to set these environment variables:

### Infrastructure Variables

```bash
# Database (from Secrets Manager)
RDS_HOST=your-rds-endpoint.region.rds.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=fabrknt_suite
RDS_USERNAME=admin
RDS_PASSWORD=from-secrets-manager

# Redis
REDIS_ENDPOINT=your-redis-endpoint.cache.amazonaws.com
REDIS_PORT=6379

# DynamoDB Tables
CLICKS_TABLE_NAME=fabrknt-trace-clicks-dev
ACTIVITY_METRICS_TABLE_NAME=fabrknt-trace-activity-metrics-dev

# API Gateway URLs
TRACE_API_URL=https://api-id.execute-api.region.amazonaws.com/dev
PULSE_API_URL=https://api-id.execute-api.region.amazonaws.com/dev
FABRIC_API_URL=https://api-id.execute-api.region.amazonaws.com/dev

# Cognito
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_CLIENT_ID=your-client-id
```

## CDK Commands

```bash
# Compile TypeScript
npm run build

# Watch for changes
npm run watch

# Synthesize CloudFormation template
npm run synth

# Deploy all stacks
npm run deploy

# Deploy specific environment
npm run deploy:dev
npm run deploy:prod

# View differences
npm run diff

# Destroy infrastructure
npm run destroy
```

## Cost Estimation

### Development Environment

-   **RDS PostgreSQL** (db.t3.micro): ~$15-30/month
-   **DynamoDB** (on-demand): ~$5-10/month
-   **ElastiCache Redis** (cache.t3.micro): ~$15-20/month
-   **Lambda**: ~$5-10/month (1M requests)
-   **API Gateway**: ~$3.50/month (1M requests)
-   **S3**: ~$2-5/month
-   **Amplify**: ~$15/month
-   **CloudWatch**: ~$5-10/month
-   **Total**: ~$65-105/month

### Production Environment

-   **RDS PostgreSQL** (db.t3.medium, Multi-AZ): ~$200-400/month
-   **DynamoDB**: ~$100-200/month
-   **ElastiCache Redis** (cache.t3.small): ~$60-120/month
-   **Lambda**: ~$50-100/month
-   **API Gateway**: ~$20-50/month
-   **S3**: ~$20-40/month
-   **Amplify**: ~$50/month
-   **CloudWatch**: ~$30-50/month
-   **Total**: ~$530-1010/month

## Security Considerations

1. **VPC**: All resources are in private subnets where possible
2. **Security Groups**: Least privilege access
3. **Secrets Manager**: Database credentials stored securely
4. **Encryption**: Enabled at rest and in transit
5. **IAM**: Least privilege roles for Lambda functions
6. **WAF**: Can be added to API Gateway for additional protection

## Monitoring

-   **CloudWatch Logs**: All Lambda functions log to CloudWatch
-   **CloudWatch Metrics**: Custom metrics for business KPIs
-   **X-Ray**: Distributed tracing (can be enabled)
-   **Alarms**: Set up for errors, latency, and costs

## Database Migrations

After infrastructure is deployed, run database migrations:

```bash
# Connect to RDS
psql -h your-rds-endpoint.region.rds.amazonaws.com \
     -U admin \
     -d fabrknt_suite

# Run migrations from your database migration files
# Example: \i migrations/001_initial_schema.sql
```

## Lambda Functions

Lambda functions are located in `lambda/` directory:

-   **trace/api-handler.ts**: TRACE API endpoints
-   **pulse/api-handler.ts**: PULSE API endpoints
-   **fabric/api-handler.ts**: FABRIC API endpoints
-   **shared/metrics-aggregator.ts**: Daily metrics aggregation

To deploy Lambda functions, you'll need to:

1. Build the functions
2. Package them
3. Deploy via CDK or manually

## Troubleshooting

### Stack Deployment Fails

1. Check CloudFormation events in AWS Console
2. Verify IAM permissions
3. Check VPC limits (default: 5 VPCs per region)
4. Verify account limits

### Database Connection Issues

1. Verify security group rules
2. Check VPC configuration
3. Verify credentials in Secrets Manager
4. Test connection from Lambda VPC

### API Gateway 500 Errors

1. Check CloudWatch Logs for Lambda errors
2. Verify Lambda environment variables
3. Check API Gateway integration settings
4. Verify CORS configuration

## Next Steps

1. ✅ Deploy infrastructure
2. ✅ Get stack outputs
3. ✅ Set up environment variables
4. ✅ Run database migrations
5. ✅ Deploy Lambda functions
6. ✅ Set up Amplify apps
7. ✅ Configure custom domains
8. ✅ Set up monitoring and alarms

## Resources

-   [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
-   [AWS Architecture Document](../docs/AWS_ARCHITECTURE.md)
-   [Amplify Setup Guide](../docs/AMPLIFY_SETUP.md)
-   [Migration Checklist](../docs/MIGRATION_CHECKLIST.md)
