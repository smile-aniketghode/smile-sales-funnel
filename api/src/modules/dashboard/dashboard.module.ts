import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DynamoDbService } from '../../services/dynamodb.service';

@Module({
  controllers: [DashboardController],
  providers: [DynamoDbService],
})
export class DashboardModule {}
