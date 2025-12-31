#!/bin/bash

# Fabrknt Suite AWS Infrastructure Setup Script
# This script helps set up the AWS infrastructure for Fabrknt Suite

set -e

ENVIRONMENT=${1:-dev}
REGION=${2:-us-east-1}

echo "🚀 Setting up Fabrknt Suite infrastructure"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK is not installed. Installing..."
    npm install -g aws-cdk
fi

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account ID: $ACCOUNT_ID"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
cd "$(dirname "$0")/.."
npm install

# Bootstrap CDK (if not already bootstrapped)
echo "🔧 Bootstrapping CDK..."
cdk bootstrap aws://$ACCOUNT_ID/$REGION || echo "CDK already bootstrapped"

# Set environment variables
export CDK_DEFAULT_ACCOUNT=$ACCOUNT_ID
export CDK_DEFAULT_REGION=$REGION

# Synthesize CloudFormation template
echo "📝 Synthesizing CloudFormation template..."
cdk synth --context environment=$ENVIRONMENT

# Deploy infrastructure
echo "🚀 Deploying infrastructure..."
read -p "Do you want to proceed with deployment? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cdk deploy --all --context environment=$ENVIRONMENT --require-approval never
    
    echo ""
    echo "✅ Infrastructure deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Get database credentials from AWS Secrets Manager"
    echo "2. Update .env files with the output values"
    echo "3. Run database migrations"
    echo "4. Deploy Lambda functions"
    echo "5. Set up Amplify apps for each product"
else
    echo "Deployment cancelled."
fi

