#!/bin/bash

# Create DynamoDB tables in AWS for production deployment
# Usage: ./infra/create-aws-tables.sh

set -e

echo "🗄️  Creating DynamoDB tables in AWS..."
echo ""

AWS_REGION=${AWS_REGION:-us-east-1}
TABLE_PREFIX="smile-sales-funnel-prod"

echo "Using AWS Region: $AWS_REGION"
echo "Table prefix: $TABLE_PREFIX"
echo ""

# Function to create table with GSI
create_table_with_gsi() {
    TABLE_NAME=$1
    echo "Creating table: $TABLE_NAME"

    aws dynamodb create-table \
        --table-name "$TABLE_NAME" \
        --attribute-definitions \
            AttributeName=id,AttributeType=S \
            AttributeName=status,AttributeType=S \
            AttributeName=created_at,AttributeType=S \
        --key-schema \
            AttributeName=id,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --global-secondary-indexes \
            "IndexName=status-created_at-index,KeySchema=[{AttributeName=status,KeyType=HASH},{AttributeName=created_at,KeyType=RANGE}],Projection={ProjectionType=ALL}" \
        --region "$AWS_REGION" \
        > /dev/null 2>&1 && echo "   ✓ Created: $TABLE_NAME" || echo "   ⚠️  Already exists or error: $TABLE_NAME"
}

# Function to create simple table
create_simple_table() {
    TABLE_NAME=$1
    KEY_NAME=$2
    echo "Creating table: $TABLE_NAME"

    aws dynamodb create-table \
        --table-name "$TABLE_NAME" \
        --attribute-definitions \
            AttributeName="$KEY_NAME",AttributeType=S \
        --key-schema \
            AttributeName="$KEY_NAME",KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$AWS_REGION" \
        > /dev/null 2>&1 && echo "   ✓ Created: $TABLE_NAME" || echo "   ⚠️  Already exists or error: $TABLE_NAME"
}

# Create tables
create_table_with_gsi "$TABLE_PREFIX-tasks"
create_table_with_gsi "$TABLE_PREFIX-deals"
create_simple_table "$TABLE_PREFIX-email-logs" "message_id_hash"
create_simple_table "$TABLE_PREFIX-people" "id"
create_simple_table "$TABLE_PREFIX-companies" "id"
create_simple_table "$TABLE_PREFIX-gmail-tokens" "user_id"

echo ""
echo "✅ Table creation complete!"
echo ""
echo "📋 Verifying tables..."
aws dynamodb list-tables --region "$AWS_REGION" | grep "$TABLE_PREFIX" || echo "Run: aws dynamodb list-tables --region $AWS_REGION"
echo ""
echo "🚀 Ready to deploy to Railway!"
