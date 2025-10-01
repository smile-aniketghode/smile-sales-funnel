#!/usr/bin/env node

/**
 * Create DynamoDB Local tables for SMILe Sales Funnel
 *
 * Run with: node infra/create-local-tables.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  CreateTableCommand,
  ListTablesCommand,
  DeleteTableCommand
} = require('@aws-sdk/client-dynamodb');

// Configure for DynamoDB Local
const client = new DynamoDBClient({
  endpoint: 'http://localhost:8001',
  region: 'local',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
  }
});

const TABLE_PREFIX = 'smile-sales-funnel-dev';

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
        { AttributeName: 'email', AttributeType: 'S' }
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
    await new Promise(resolve => setTimeout(resolve, 1000));
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
      console.log(`   ⚠️  Table ${tableName} already exists, recreating...`);
      await deleteTable(tableName);
    }

    // Create table
    const command = new CreateTableCommand(tableConfig.schema);
    await client.send(command);
    console.log(`   ✓ Created table: ${tableName}`);
    return true;
  } catch (error) {
    console.error(`   ✗ Error creating table ${tableName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🗄️  Setting up DynamoDB Local tables...\n');

  // Check connection
  try {
    await client.send(new ListTablesCommand({}));
    console.log('   ✓ Connected to DynamoDB Local\n');
  } catch (error) {
    console.error('   ✗ Could not connect to DynamoDB Local');
    console.error('   Make sure DynamoDB Local is running:');
    console.error('   docker run -p 8001:8000 amazon/dynamodb-local\n');
    process.exit(1);
  }

  // Create all tables
  let successCount = 0;
  for (const table of tables) {
    const success = await createTable(table);
    if (success) successCount++;
    // Small delay between table creations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`\n✅ Created ${successCount}/${tables.length} tables successfully\n`);

  // List all tables
  try {
    const response = await client.send(new ListTablesCommand({}));
    console.log('📋 Available tables:');
    response.TableNames.forEach(name => {
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
