# AWS Setup Guide for Fabrknt Suite

This guide provides step-by-step instructions for setting up AWS infrastructure for Fabrknt Suite.

## Quick Start

1. **Prerequisites**

    - AWS Account with admin access
    - AWS CLI installed and configured
    - Node.js 18+ installed
    - AWS CDK CLI installed (`npm install -g aws-cdk`)

2. **Deploy Infrastructure**

    ```bash
    cd infrastructure
    npm install
    ./scripts/setup.sh dev us-east-1
    ```

3. **Get Stack Outputs**

    ```bash
    ./scripts/get-outputs.sh dev
    ```

4. **Set Up Environment Variables**

    - Copy `.env.example` files to `.env` in each project
    - Update with values from stack outputs

5. **Run Database Migrations**

    ```bash
    # Connect to RDS and run migrations
    psql -h your-rds-endpoint -U admin -d fabrknt_suite
    # Run migrations from your database migration files
    ```

6. **Deploy Lambda Functions**

    - Build Lambda functions
    - Deploy via CDK or manually

7. **Set Up Amplify Apps**
    - Create Amplify apps for each product (PULSE, TRACE, FABRIC)
    - Connect GitHub repositories
    - Configure custom domains

## Detailed Documentation

-   [AWS Architecture](./AWS_ARCHITECTURE.md) - Complete architecture overview
-   [Infrastructure README](../infrastructure/README.md) - CDK setup and deployment
-   [Amplify Setup](./AMPLIFY_SETUP.md) - Frontend hosting configuration
-   [Setup Checklist](./SETUP_CHECKLIST.md) - Step-by-step setup guide

## Cost Optimization Tips

1. **Start Small**: Use t3.micro instances for development
2. **Use On-Demand**: DynamoDB on-demand for unpredictable workloads
3. **Monitor Costs**: Set up CloudWatch billing alarms
4. **Reserved Instances**: Consider for production after 6+ months
5. **Clean Up**: Regularly review and remove unused resources

## Support

For issues or questions:

-   Check [Infrastructure README](../infrastructure/README.md)
-   Review [AWS Architecture](./AWS_ARCHITECTURE.md)
-   Check CloudWatch Logs for errors
