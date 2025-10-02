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
    const endpoint = process.env.DYNAMODB_ENDPOINT;
    const region = process.env.AWS_REGION || 'us-east-1';

    // Support local DynamoDB endpoint
    const clientConfig: any = { region };

    if (endpoint) {
      clientConfig.endpoint = endpoint;
      clientConfig.credentials = {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy'
      };
      this.logger.log(`Using local DynamoDB at ${endpoint}`);
    } else {
      this.logger.log(`Using AWS DynamoDB in region ${region}`);
    }

    const client = new DynamoDBClient(clientConfig);

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
      revenue?: number;
      revenue_trend?: string;
      active_deals?: number;
      closing_this_week?: number;
      conversion_rate?: number;
      conversion_trend?: string;
      new_contacts?: number;
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

      // Calculate revenue (sum of all deal values)
      const revenue = allDeals.items.reduce((sum, deal: any) => {
        return sum + (deal.value || 0);
      }, 0);

      // Count active deals (not won/lost)
      const activeDeals = allDeals.items.filter((deal: any) =>
        deal.status !== DealStatus.WON && deal.status !== DealStatus.LOST
      ).length;

      // Count deals closing this week
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const closingThisWeek = allDeals.items.filter((deal: any) => {
        if (!deal.expected_close_date) return false;
        const closeDate = new Date(deal.expected_close_date);
        return closeDate >= now && closeDate <= weekFromNow;
      }).length;

      // Calculate conversion rate (won deals / total deals * 100)
      const wonDeals = allDeals.items.filter((deal: any) =>
        deal.status === DealStatus.WON
      ).length;
      const conversionRate = allDeals.count > 0
        ? Math.round((wonDeals / allDeals.count) * 100)
        : 0;

      // Count new contacts (last 30 days) - placeholder for now
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const newContacts = allDeals.items.filter((deal: any) => {
        if (!deal.created_at) return false;
        const createdDate = new Date(deal.created_at);
        return createdDate >= thirtyDaysAgo;
      }).length;

      return {
        summary: {
          draft_tasks: draftTasks.count,
          draft_deals: draftDeals.count,
          total_tasks: allTasks.count,
          total_deals: allDeals.count,
          revenue,
          revenue_trend: '+22%', // Placeholder - would need historical data
          active_deals: activeDeals,
          closing_this_week: closingThisWeek,
          conversion_rate: conversionRate,
          conversion_trend: '+5%', // Placeholder - would need historical data
          new_contacts: newContacts
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
          total_deals: 0,
          revenue: 0,
          revenue_trend: '+0%',
          active_deals: 0,
          closing_this_week: 0,
          conversion_rate: 0,
          conversion_trend: '+0%',
          new_contacts: 0
        },
        generated_at: new Date().toISOString()
      };
    }
  }

  async getHotDeals(): Promise<any[]> {
    try {
      // Get all deals that are not won/lost
      const result = await this.getDeals(undefined, 1000);

      // Filter for active deals with close dates
      const now = new Date();
      const activeDeals = result.items.filter((deal: any) => {
        return (
          deal.status !== DealStatus.WON &&
          deal.status !== DealStatus.LOST &&
          deal.expected_close_date
        );
      });

      // Sort by:
      // 1. Soonest close date (higher priority)
      // 2. Highest confidence (secondary priority)
      const sortedDeals = activeDeals.sort((a: any, b: any) => {
        const dateA = new Date(a.expected_close_date);
        const dateB = new Date(b.expected_close_date);

        // First sort by close date (ascending - soonest first)
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }

        // If same date, sort by confidence (descending - highest first)
        return b.confidence - a.confidence;
      });

      // Return top 5 hot deals with company name extracted
      return sortedDeals.slice(0, 5).map((deal: any) => ({
        id: deal.id,
        title: deal.title,
        company_name: deal.company_id || 'Unknown Company', // Will improve with actual company lookup
        value: deal.value,
        expected_close_date: deal.expected_close_date,
        confidence: Math.round((deal.confidence || 0) * 100),
        stage: deal.stage,
        probability: deal.probability || 50
      }));

    } catch (error) {
      this.logger.error(`Error getting hot deals: ${error.message}`, error.stack);
      return [];
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