import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  QueryCommand, 
  ScanCommand, 
  GetCommand,
  UpdateCommand,
  PutCommand
} from '@aws-sdk/lib-dynamodb';
import { Task, Deal, TaskStatus, DealStatus } from '../interfaces';

@Injectable()
export class DynamoDbService {
  private readonly logger = new Logger(DynamoDbService.name);
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tablePrefix: string;

  constructor() {
    const client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    
    this.docClient = DynamoDBDocumentClient.from(client);
    this.tablePrefix = process.env.TABLE_PREFIX || 'smile-sales-funnel-dev';
    
    this.logger.log(`Initialized DynamoDB client with table prefix: ${this.tablePrefix}`);
  }

  private getTableName(entity: string): string {
    return `${this.tablePrefix}-${entity}`;
  }

  async getTasks(status?: TaskStatus, limit: number = 50, lastKey?: any): Promise<{
    items: Task[];
    lastKey?: any;
    count: number;
  }> {
    try {
      let command;
      
      if (status) {
        // Query using GSI
        command = new QueryCommand({
          TableName: this.getTableName('tasks'),
          IndexName: 'status-created_at-index',
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': status
          },
          ScanIndexForward: false, // Most recent first
          Limit: limit,
          ExclusiveStartKey: lastKey
        });
      } else {
        // Scan all tasks (expensive - only for development)
        command = new ScanCommand({
          TableName: this.getTableName('tasks'),
          Limit: limit,
          ExclusiveStartKey: lastKey
        });
      }

      const response = await this.docClient.send(command);
      
      return {
        items: response.Items as Task[] || [],
        lastKey: response.LastEvaluatedKey,
        count: response.Count || 0
      };

    } catch (error) {
      this.logger.error(`Error getting tasks: ${error.message}`, error.stack);
      return { items: [], count: 0 };
    }
  }

  async getDeals(status?: DealStatus, limit: number = 50, lastKey?: any): Promise<{
    items: Deal[];
    lastKey?: any;
    count: number;
  }> {
    try {
      let command;
      
      if (status) {
        // Query using GSI
        command = new QueryCommand({
          TableName: this.getTableName('deals'),
          IndexName: 'status-created_at-index',
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeNames: {
            '#status': 'status'
          },
          ExpressionAttributeValues: {
            ':status': status
          },
          ScanIndexForward: false, // Most recent first
          Limit: limit,
          ExclusiveStartKey: lastKey
        });
      } else {
        // Scan all deals (expensive - only for development)
        command = new ScanCommand({
          TableName: this.getTableName('deals'),
          Limit: limit,
          ExclusiveStartKey: lastKey
        });
      }

      const response = await this.docClient.send(command);
      
      return {
        items: response.Items as Deal[] || [],
        lastKey: response.LastEvaluatedKey,
        count: response.Count || 0
      };

    } catch (error) {
      this.logger.error(`Error getting deals: ${error.message}`, error.stack);
      return { items: [], count: 0 };
    }
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const command = new GetCommand({
        TableName: this.getTableName('tasks'),
        Key: { id: taskId }
      });

      const response = await this.docClient.send(command);
      return response.Item as Task || null;

    } catch (error) {
      this.logger.error(`Error getting task ${taskId}: ${error.message}`, error.stack);
      return null;
    }
  }

  async getDealById(dealId: string): Promise<Deal | null> {
    try {
      const command = new GetCommand({
        TableName: this.getTableName('deals'),
        Key: { id: dealId }
      });

      const response = await this.docClient.send(command);
      return response.Item as Deal || null;

    } catch (error) {
      this.logger.error(`Error getting deal ${dealId}: ${error.message}`, error.stack);
      return null;
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
    try {
      const updateExpression = 'SET updated_at = :updated_at';
      const expressionAttributeValues: any = {
        ':updated_at': new Date().toISOString()
      };

      // Build dynamic update expression
      const updateFields = Object.keys(updates).filter(key => key !== 'id');
      const updateExpr = updateFields.length > 0 
        ? updateExpression + ', ' + updateFields.map(field => `${field} = :${field}`).join(', ')
        : updateExpression;

      updateFields.forEach(field => {
        expressionAttributeValues[`:${field}`] = updates[field];
      });

      const command = new UpdateCommand({
        TableName: this.getTableName('tasks'),
        Key: { id: taskId },
        UpdateExpression: updateExpr,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'UPDATED_NEW'
      });

      await this.docClient.send(command);
      this.logger.debug(`Updated task: ${taskId}`);
      return true;

    } catch (error) {
      this.logger.error(`Error updating task ${taskId}: ${error.message}`, error.stack);
      return false;
    }
  }

  async updateDeal(dealId: string, updates: Partial<Deal>): Promise<boolean> {
    try {
      const updateExpression = 'SET updated_at = :updated_at';
      const expressionAttributeValues: any = {
        ':updated_at': new Date().toISOString()
      };

      // Build dynamic update expression
      const updateFields = Object.keys(updates).filter(key => key !== 'id');
      const updateExpr = updateFields.length > 0 
        ? updateExpression + ', ' + updateFields.map(field => `${field} = :${field}`).join(', ')
        : updateExpression;

      updateFields.forEach(field => {
        expressionAttributeValues[`:${field}`] = updates[field];
      });

      const command = new UpdateCommand({
        TableName: this.getTableName('deals'),
        Key: { id: dealId },
        UpdateExpression: updateExpr,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'UPDATED_NEW'
      });

      await this.docClient.send(command);
      this.logger.debug(`Updated deal: ${dealId}`);
      return true;

    } catch (error) {
      this.logger.error(`Error updating deal ${dealId}: ${error.message}`, error.stack);
      return false;
    }
  }

  async getStats(): Promise<{
    summary: {
      draft_tasks: number;
      draft_deals: number;
      total_tasks: number;
      total_deals: number;
    };
    generated_at: string;
  }> {
    try {
      // Get draft counts
      const [draftTasks, draftDeals, allTasks, allDeals] = await Promise.all([
        this.getTasks(TaskStatus.DRAFT, 100),
        this.getDeals(DealStatus.DRAFT, 100), 
        this.getTasks(undefined, 1000),
        this.getDeals(undefined, 1000)
      ]);

      return {
        summary: {
          draft_tasks: draftTasks.count,
          draft_deals: draftDeals.count,
          total_tasks: allTasks.count,
          total_deals: allDeals.count
        },
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Error getting stats: ${error.message}`, error.stack);
      return {
        summary: {
          draft_tasks: 0,
          draft_deals: 0,
          total_tasks: 0,
          total_deals: 0
        },
        generated_at: new Date().toISOString()
      };
    }
  }

  async healthCheck(): Promise<{ status: string; message?: string }> {
    try {
      // Simple health check - try to describe a table
      const command = new ScanCommand({
        TableName: this.getTableName('tasks'),
        Limit: 1
      });

      await this.docClient.send(command);
      return { status: 'healthy' };

    } catch (error) {
      this.logger.error(`DynamoDB health check failed: ${error.message}`);
      return { 
        status: 'unhealthy', 
        message: error.message 
      };
    }
  }
}