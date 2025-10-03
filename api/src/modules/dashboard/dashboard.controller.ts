import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { DynamoDbService } from '../../services/dynamodb.service';

@Controller()
export class DashboardController {
  constructor(private readonly dynamoDbService: DynamoDbService) {}

  @Get('insights')
  async getInsights(@Query('user_id') userId: string) {
    try {
      if (!userId) {
        throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
      }

      const insights = await this.dynamoDbService.getInsights(userId);
      return {
        insights,
        count: insights.length,
        status: 'success'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch insights: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats/summary')
  async getStatsSummary(@Query('user_id') userId: string) {
    try {
      if (!userId) {
        throw new HttpException('user_id is required', HttpStatus.BAD_REQUEST);
      }

      const stats = await this.dynamoDbService.getStats(userId);
      return { ...stats, status: 'success' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch stats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
