#!/usr/bin/env node

/**
 * Create DynamoDB tables in AWS for Railway production deployment
 *
 * Usage:
 *   AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy AWS_REGION=us-east-1 TABLE_PREFIX=smile-sales-funnel-prod node infra/create-aws-tables.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  CreateTableCommand,
  ListTablesCommand,
  DeleteTableCommand
} = require('@aws-sdk/client-dynamodb');

// Get configuration from environment
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
const TABLE_PREFIX = process.env.TABLE_PREFIX || 'smile-sales-funnel-prod';

if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error('❌ Missing AWS credentials!');
  console.error('Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables');
  process.exit(1);
}

// Configure for AWS DynamoDB
const client = new DynamoDBClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
});

// Table definitions
const tables = [
  {
    name: 'tasks',
    schema: {
      TableName: `${TABLE_PREFIX}-tasks`,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' },
        { AttributeName: 'created_at', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'status-created_at-index',
          KeySchema: [
            { AttributeName: 'status', KeyType: 'HASH' },
            { AttributeName: 'created_at', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  },
  {
    name: 'deals',
    schema: {
      TableName: `${TABLE_PREFIX}-deals`,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'status', AttributeType: 'S' },
        { AttributeName: 'created_at', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'status-created_at-index',
          KeySchema: [
            { AttributeName: 'status', KeyType: 'HASH' },
            { AttributeName: 'created_at', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  },
  {
    name: 'email-logs',
    schema: {
      TableName: `${TABLE_PREFIX}-email-logs`,
      KeySchema: [
        { AttributeName: 'message_id_hash', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'message_id_hash', AttributeType: 'S' },
        { AttributeName: 'created_at', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'created_at-index',
          KeySchema: [
            { AttributeName: 'created_at', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  },
  {
    name: 'people',
    schema: {
      TableName: `${TABLE_PREFIX}-people`,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
        { AttributeName: 'user_id', AttributeType: 'S' },
        { AttributeName: 'created_at', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'email-index',
          KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        {
          IndexName: 'user_id-created_at-index',
          KeySchema: [
            { AttributeName: 'user_id', KeyType: 'HASH' },
            { AttributeName: 'created_at', KeyType: 'RANGE' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  },
  {
    name: 'companies',
    schema: {
      TableName: `${TABLE_PREFIX}-companies`,
      KeySchema: [
        { AttributeName: 'id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'domain', AttributeType: 'S' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'domain-index',
          KeySchema: [
            { AttributeName: 'domain', KeyType: 'HASH' }
          ],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  },
  {
    name: 'gmail-tokens',
    schema: {
      TableName: `${TABLE_PREFIX}-gmail-tokens`,
      KeySchema: [
        { AttributeName: 'user_id', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'user_id', AttributeType: 'S' }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    }
  }
];

async function tableExists(tableName) {
  try {
    const command = new ListTablesCommand({});
    const response = await client.send(command);
    return response.TableNames.includes(tableName);
  } catch (error) {
    return false;
  }
}

async function deleteTable(tableName) {
  try {
    const command = new DeleteTableCommand({ TableName: tableName });
    await client.send(command);
    console.log(`   ✓ Deleted existing table: ${tableName}`);
    // Wait for table to be deleted
    await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (error) {
    if (error.name !== 'ResourceNotFoundException') {
      console.error(`   ✗ Error deleting table ${tableName}:`, error.message);
    }
  }
}

async function createTable(tableConfig) {
  const tableName = tableConfig.schema.TableName;

  try {
    // Check if table exists
    if (await tableExists(tableName)) {
      console.log(`   ⚠️  Table ${tableName} already exists, skipping...`);
      return true;
    }

    // Create table
    const command = new CreateTableCommand(tableConfig.schema);
    await client.send(command);
    console.log(`   ✓ Created table: ${tableName}`);

    // Wait for table to become active
    console.log(`   ⏳ Waiting for table to become active...`);
    await new Promise(resolve => setTimeout(resolve, 10000));

    return true;
  } catch (error) {
    console.error(`   ✗ Error creating table ${tableName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🗄️  Setting up AWS DynamoDB tables...');
  console.log(`   Region: ${AWS_REGION}`);
  console.log(`   Prefix: ${TABLE_PREFIX}\n`);

  // Check connection
  try {
    await client.send(new ListTablesCommand({}));
    console.log('   ✓ Connected to AWS DynamoDB\n');
  } catch (error) {
    console.error('   ✗ Could not connect to AWS DynamoDB');
    console.error(`   Error: ${error.message}\n`);
    process.exit(1);
  }

  // Create all tables
  let successCount = 0;
  for (const table of tables) {
    const success = await createTable(table);
    if (success) successCount++;
  }

  console.log(`\n✅ Created ${successCount}/${tables.length} tables successfully\n`);

  // List all tables
  try {
    const response = await client.send(new ListTablesCommand({}));
    console.log('📋 Available tables:');
    response.TableNames
      .filter(name => name.startsWith(TABLE_PREFIX))
      .forEach(name => {
        console.log(`   • ${name}`);
      });
    console.log('');
  } catch (error) {
    console.error('Error listing tables:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createTable, tableExists };
