#!/usr/bin/env node

/**
 * Create DynamoDB table for Gmail OAuth tokens (local development)
 *
 * Table: smile-sales-funnel-dev-gmail-tokens
 *
 * Attributes:
 * - user_id (PK): User identifier (email address)
 * - access_token: OAuth access token
 * - refresh_token: OAuth refresh token
 * - token_uri: Google token URI
 * - client_id: OAuth client ID
 * - client_secret: OAuth client secret
 * - scopes: Array of granted scopes
 * - expiry: ISO timestamp when token expires
 * - created_at: ISO timestamp when token was created
 * - updated_at: ISO timestamp when token was last refreshed
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const TABLE_PREFIX = process.env.TABLE_PREFIX || 'smile-sales-funnel-dev';
const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || 'http://localhost:8001';

const client = new DynamoDBClient({
  endpoint: DYNAMODB_ENDPOINT,
  region: 'local',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy',
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function createGmailTokensTable() {
  const tableName = `${TABLE_PREFIX}-gmail-tokens`;

  try {
    // Check if table already exists
    try {
      await docClient.send(
        new DescribeTableCommand({ TableName: tableName })
      );
      console.log(`✅ Table ${tableName} already exists`);
      return;
    } catch (err) {
      if (err.name !== 'ResourceNotFoundException') {
        throw err;
      }
      // Table doesn't exist, create it
    }

    const params = {
      TableName: tableName,
      KeySchema: [{ AttributeName: 'user_id', KeyType: 'HASH' }],
      AttributeDefinitions: [{ AttributeName: 'user_id', AttributeType: 'S' }],
      BillingMode: 'PAY_PER_REQUEST', // On-demand pricing (no need to specify RCU/WCU)
    };

    await docClient.send(new CreateTableCommand(params));
    console.log(`✅ Created table: ${tableName}`);
  } catch (error) {
    console.error(`❌ Error creating table ${tableName}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('Creating Gmail tokens table for local DynamoDB...\n');
  console.log(`Endpoint: ${DYNAMODB_ENDPOINT}`);
  console.log(`Table prefix: ${TABLE_PREFIX}\n`);

  await createGmailTokensTable();

  console.log('\n✅ Gmail tokens table setup complete!');
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
