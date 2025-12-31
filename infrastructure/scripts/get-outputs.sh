#!/bin/bash

# Get AWS Stack Outputs
# This script retrieves important outputs from the deployed stack

set -e

ENVIRONMENT=${1:-dev}
STACK_NAME="FabrkntSuite-$ENVIRONMENT"

echo "📋 Retrieving stack outputs for $STACK_NAME"
echo ""

# Check if stack exists
if ! aws cloudformation describe-stacks --stack-name $STACK_NAME &> /dev/null; then
    echo "❌ Stack $STACK_NAME not found. Please deploy the infrastructure first."
    exit 1
fi

# Get outputs
echo "🔍 Stack Outputs:"
echo ""

aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table

echo ""
echo "💡 To get specific output value:"
echo "aws cloudformation describe-stacks --stack-name $STACK_NAME --query 'Stacks[0].Outputs[?OutputKey==\"DatabaseEndpoint\"].OutputValue' --output text"

