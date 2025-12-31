# AWS Infrastructure Setup Checklist

This checklist guides the setup of AWS infrastructure for PULSE, TRACE, and FABRIC.

## Pre-Migration

-   [ ] Review AWS architecture document (`AWS_ARCHITECTURE.md`)
-   [ ] Estimate costs using AWS Pricing Calculator
-   [ ] Set up AWS account and billing alerts
-   [ ] Create IAM users/roles with appropriate permissions

## Phase 1: Infrastructure Setup

### AWS Account & IAM

-   [ ] Create AWS account (or use existing)
-   [ ] Set up billing alerts
-   [ ] Create IAM roles for Lambda, Amplify, etc.
-   [ ] Configure AWS CLI (optional)

### Database Setup

-   [ ] Create RDS PostgreSQL instance
    -   [ ] Choose instance type (start with db.t3.micro)
    -   [ ] Configure Multi-AZ for production
    -   [ ] Set up automated backups
    -   [ ] Configure security groups
-   [ ] Create RDS Proxy (for connection pooling)
-   [ ] Set up DynamoDB tables (for high-frequency writes)
-   [ ] Configure ElastiCache Redis cluster

### Storage & Caching

-   [ ] Create S3 buckets for each product
-   [ ] Configure bucket policies and CORS
-   [ ] Set up ElastiCache Redis cluster
-   [ ] Configure CloudFront distributions (if needed)

### Secrets Management

-   [ ] Store database credentials in Secrets Manager
-   [ ] Store API keys in Secrets Manager
-   [ ] Store third-party service tokens

## Phase 2: Database Migration

### Schema Setup

-   [ ] Review database schema requirements
-   [ ] Create RDS schema (run migrations)
-   [ ] Verify schema matches requirements
-   [ ] Set up initial data if needed

### Connection Setup

-   [ ] Configure RDS Proxy endpoints
-   [ ] Test database connections
-   [ ] Set up connection pooling
-   [ ] Configure read replicas (if needed)

## Phase 3: API Development

### Lambda Functions

-   [ ] Create Lambda functions for each API endpoint
-   [ ] Configure Lambda environment variables
-   [ ] Set up Lambda layers (if needed)
-   [ ] Configure Lambda VPC (for RDS access)
-   [ ] Set up Lambda error handling and retries

### API Gateway

-   [ ] Create API Gateway REST APIs
-   [ ] Configure API endpoints
-   [ ] Set up request/response transformations
-   [ ] Configure rate limiting
-   [ ] Set up API keys (for external access)
-   [ ] Configure CORS
-   [ ] Set up custom domain names

### Authentication

-   [ ] Create Cognito User Pool
-   [ ] Configure Cognito Identity Pool (if needed)
-   [ ] Set up wallet-based authentication flow
-   [ ] Migrate user data to Cognito
-   [ ] Test authentication flows

## Phase 4: Background Workers

### EventBridge

-   [ ] Create EventBridge rules for scheduled tasks
-   [ ] Configure event targets (Lambda functions)
-   [ ] Set up cron expressions for periodic jobs
-   [ ] Test event triggers

### SQS Queues

-   [ ] Create SQS queues for async processing
-   [ ] Configure dead letter queues
-   [ ] Set up queue policies
-   [ ] Test queue processing

### Lambda Workers

-   [ ] Create on-chain indexer Lambda
-   [ ] Create metrics aggregator Lambda
-   [ ] Create webhook processor Lambdas
-   [ ] Configure Lambda triggers
-   [ ] Test worker functions

## Phase 5: Frontend Migration

### Code Updates

-   [ ] Set up AWS SDK clients
-   [ ] Implement authentication code (Cognito)
-   [ ] Set up API calls (API Gateway endpoints)
-   [ ] Implement database queries (RDS via Lambda)
-   [ ] Install required AWS dependencies

### Configuration

-   [ ] Update environment variables
-   [ ] Configure Amplify environment variables
-   [ ] Update API endpoints
-   [ ] Configure Cognito client IDs

### Testing

-   [ ] Test authentication flow
-   [ ] Test API calls
-   [ ] Test data fetching
-   [ ] Test real-time features (if any)

## Phase 6: Deployment

### Amplify Setup

-   [ ] Create Amplify apps for each product
-   [ ] Connect GitHub repositories
-   [ ] Configure build settings (`amplify.yml`)
-   [ ] Set up custom domains
-   [ ] Configure environment variables

### Deployment

-   [ ] Deploy to staging environment
-   [ ] Run integration tests
-   [ ] Deploy to production
-   [ ] Monitor deployment

## Phase 7: Monitoring & Optimization

### CloudWatch Setup

-   [ ] Create CloudWatch dashboards
-   [ ] Set up CloudWatch alarms
-   [ ] Configure log groups
-   [ ] Set up X-Ray tracing

### Performance Optimization

-   [ ] Review Lambda cold starts
-   [ ] Optimize database queries
-   [ ] Review caching strategy
-   [ ] Optimize API Gateway responses

### Cost Optimization

-   [ ] Review AWS costs
-   [ ] Optimize RDS instance size
-   [ ] Review DynamoDB capacity
-   [ ] Optimize Lambda memory/timeout
-   [ ] Set up cost alerts

## Phase 8: Cleanup

### Cleanup

-   [ ] Verify all infrastructure is working
-   [ ] Update documentation
-   [ ] Remove any unused dependencies from code
-   [ ] Archive any old configuration files

### Documentation

-   [ ] Update architecture diagrams
-   [ ] Update README files
-   [ ] Create runbooks
-   [ ] Document troubleshooting steps
-   [ ] Update API documentation

## Testing Checklist

### Functional Testing

-   [ ] Authentication works correctly
-   [ ] API endpoints return correct data
-   [ ] Database queries work
-   [ ] Background workers process correctly
-   [ ] Real-time features work (if applicable)

### Performance Testing

-   [ ] API response times acceptable
-   [ ] Database queries optimized
-   [ ] Lambda functions perform well
-   [ ] No memory leaks

### Security Testing

-   [ ] Authentication secure
-   [ ] API endpoints protected
-   [ ] Database access restricted
-   [ ] Secrets properly managed
-   [ ] No exposed credentials

### Integration Testing

-   [ ] TRACE ↔ FABRIC integration works
-   [ ] PULSE ↔ FABRIC integration works
-   [ ] Cross-service API calls work
-   [ ] Webhook integrations work

## Rollback Plan

If issues occur during setup:

1. **Immediate Rollback**

    - [ ] Revert code changes
    - [ ] Verify functionality restored
    - [ ] Document issues encountered

2. **Partial Rollback**

    - [ ] Keep working infrastructure
    - [ ] Fix issues incrementally
    - [ ] Test each component separately

## Post-Setup

-   [ ] Monitor for 1 week
-   [ ] Review costs vs. estimates
-   [ ] Gather team feedback
-   [ ] Document lessons learned
-   [ ] Plan optimizations

## Resources

-   [AWS Architecture Document](./AWS_ARCHITECTURE.md)
-   [Amplify Setup Guide](./AMPLIFY_SETUP.md)
-   [AWS Documentation](https://docs.aws.amazon.com/)
-   [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
