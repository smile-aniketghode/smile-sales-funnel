#!/bin/bash

# Deploy DynamoDB tables for SMILe Sales Funnel
# Usage: ./deploy.sh [stack-name] [region]

STACK_NAME=${1:-"smile-sales-funnel-dev"}
REGION=${2:-"us-east-1"}

echo "Deploying DynamoDB tables..."
echo "Stack name: $STACK_NAME"
echo "Region: $REGION"

aws cloudformation deploy \
  --template-file dynamodb-tables.yml \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --capabilities CAPABILITY_IAM \
  --tags Project=SMILe-Sales-Funnel Environment=Development

if [ $? -eq 0 ]; then
  echo "✅ DynamoDB tables deployed successfully!"
  echo "Stack outputs:"
  aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
    --output table
else
  echo "❌ Deployment failed"
  exit 1
fi