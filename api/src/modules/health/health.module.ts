import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { DynamoDbService } from '../../services/dynamodb.service';

@Module({
  controllers: [HealthController],
  providers: [DynamoDbService],
})
export class HealthModule {}
