import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { DynamoDbService } from '../../services/dynamodb.service';

@Controller('health')
export class HealthController {
  constructor(private readonly dynamoDbService: DynamoDbService) {}

  @Get()
  async healthCheck() {
    try {
      const dbHealth = await this.dynamoDbService.healthCheck();
      return {
        api: 'healthy',
        database: dbHealth,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        'Health check failed',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
